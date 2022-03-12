import json
import http.client
import requests
import time


THE_TOKEN = ''
token_upd_time = 0
token_expiration_time = 0
order_constants = json.load(open('sdek/order_constants.json', 'r', encoding='utf-8'))

with open("tokens.json", "r") as f:
    tokens = json.load(f)

    testMode = ''
    client_account = tokens['sdek']['account']
    client_password = tokens['sdek']['password']
    if tokens['settings']['mode'] == 'test':
        testMode = '.edu'
        client_account = tokens['sdek']['test_account']
        client_password = tokens['sdek']['test_password']

    dadata_token = tokens['dadata']["dadata_token"]
    dadata_key = tokens['dadata']["dadata_key"]

smth = open("smth.json", "w")


def get_token():

    global THE_TOKEN
    global token_expiration_time
    global token_upd_time

    print('###########ОБНОВЛЯЮ ТОКЕН#################')
    body = {
        'grant_type': "client_credentials",
        "client_id": client_account,
        "client_secret": client_password,
    }
    resp = requests.post(
        f'https://api{testMode}.cdek.ru/v2/oauth/token?parameters', data=body)

    cont = json.loads(str(resp.content, encoding='utf-8'))
    # print(cont)
    THE_TOKEN = 'Bearer ' + cont['access_token']
    token_upd_time = time.time()
    token_expiration_time = int(cont['expires_in'])


def check_token_relevance():
    if int(time.time()) > token_upd_time + token_expiration_time + 180:
        get_token()


def get_regions():
    check_token_relevance()

    token = THE_TOKEN
    headers = {'Authorization': token}
    params = {"country_codes": ["RU"]}

    resp = requests.get(
        f'https://api{testMode}.cdek.ru/v2/location/regions', params=params, headers=headers)

    return str(resp.content, encoding='utf-8')


def get_cities(fias_region_guid='',
               fias_guid='',
               city='',
               size=15):
    check_token_relevance()

    token = THE_TOKEN
    headers = {'Authorization': token}
    params = {"country_codes": ["RU"],
              "size": size,
              "city": city,
              'fias_region_guid': fias_region_guid}

    resp = requests.get(
        f'https://api{testMode}.cdek.ru/v2/location/cities', params=params, headers=headers)

    return json.loads(str(resp.content, encoding='utf-8'))


def get_cities_by_name(name):
    check_token_relevance()

    headers = {'Authorization': THE_TOKEN}
    params = {"country_codes": ["RU"],
              "city": name,
              }
    resp = requests.get(
        f'https://api{testMode}.cdek.ru/v2/location/cities', params=params, headers=headers)

    return json.loads(str(resp.content, encoding='utf-8'))


def get_offices_by_citycode(city_code, max_weight):
    check_token_relevance()

    token = THE_TOKEN
    headers = {'Authorization': token}
    params = {"country_code": "RU",
              "city_code": city_code,
              'weight_max': max_weight,
              'type': 'ALL'
              }

    resp = requests.get(
        f'https://api{testMode}.cdek.ru/v2/deliverypoints', params=params, headers=headers)

    return json.loads(str(resp.content, encoding='utf-8'))


def getCorrectAddres(badAddress):
    """
    на вход принимает строку с адресом, 
    возвращает питоновский словарь с dadata
    """

    conn = http.client.HTTPConnection("cleaner.dadata.ru")
    headers = {
        "Encoding": "utf-8",
        "Authorization": f"Token {dadata_token}",
        "X-Secret": dadata_key,
    }
    conn.request("POST", '/api/v1/clean/address',
                 json.dumps([badAddress]), headers)

    resp = conn.getresponse()
    a = resp.read().decode("utf-8")
    conn.close()

    return json.loads(a)


def comparator(office, addr_obj):
    if office['type'] != 'POSTAMAT':
        return True

    off = [office['dimensions']['width'], office['dimensions']
           ['depth'], office['dimensions']['height']].sort(reverse=True)
    add = [addr_obj["length"], addr_obj["width"],
           addr_obj["height"]].sort(reverse=True)
    for i in range(3):
        if off[i] < add[i]:
            return False
    return True


def getSDEKOffices(post_body):
    """
    главная функция по офисам
    возвращает ответ сайту
    """

    addr_obj = json.loads(post_body)
    print('###############Пришло с сайта:################\n', addr_obj)
    addr_predictions = getCorrectAddres(addr_obj['all_info'])
    print('###############Пришло с dadata:################\n', addr_predictions)

    return_obj = {'problems': False}
    if len(addr_predictions) == 0:
        return_obj = {
            'problems': True,
            'description': 'dadata не выдал ни одного совпадения'
        }
        return json.dumps(return_obj)
    elif len(addr_predictions) > 1:
        return_obj = {
            'description': 'найдено несколько совпадений, вернул первое',
            'problems': True
        }

    addr = addr_predictions[0]

    print('LVL:', addr['fias_level'])

    return_obj['ymapSearch'] = addr['result']

    for x in ['settlement', 'city', 'area', 'region']:
        if addr[x] is not None:
            cities = get_cities_by_name(addr[x])
            break

    offices_list = []
    print('cities:', cities)
    for city in cities:
        print('city: ', city)
        offices = get_offices_by_citycode(city['code'], addr_obj['weight'])
        for office in offices:
            print(office['type'])
            offices_list.append({
                'code': office['code'],
                'latitude': office['location']['latitude'],
                'longitude': office['location']['longitude'],
                'addr': office['location']['address_full'],
                'city_code': office['location']['city_code'],
                'type': office['type']
            }
            )
    return_obj['suggestions'] = offices_list
    return json.dumps(return_obj)


def countSDEKDelivery(body):
    check_token_relevance()
    
    token = THE_TOKEN
    headers = {'Authorization': token,
               'Content-Type': 'application/json'}

    resp = requests.post(
        f'https://api{testMode}.cdek.ru/v2/calculator/tarifflist', headers=headers, data=body).content

    resp = resp.decode('utf-8')
    print('#######ответ по вариантам доставки:#######', resp)

    return resp


def parseSDEKAddress(body):
    addr_obj = json.loads(body)
    print('###############Пришло с сайта:################\n', addr_obj)
    addr_predictions = getCorrectAddres(addr_obj['all_info'])
    print('###############Пришло с dadata:################\n', addr_predictions)

    return_obj = {'problems': False}
    if len(addr_predictions) == 0:
        return_obj = {
            'problems': True,
            'description': 'dadata не выдал ни одного совпадения'
        }
        return json.dumps(return_obj)
    elif len(addr_predictions) > 1:
        return_obj = {
            'description': 'найдено несколько совпадений, вернул первое',
            'problems': True
        }

    addr = addr_predictions[0]

    print('LVL:', addr['fias_level'])

    return_obj['address_full'] = addr['result']

    for x in ['settlement', 'city', 'area', 'region']:
        if addr[x] is not None:
            return_obj['city_code'] = get_cities_by_name(addr[x])[0]['code']
            break

    return json.dumps(return_obj)


def send_SDEK_order(post_body):
    order_obj = json.loads(post_body)

    order_obj.update(order_constants)

    print(order_obj)

    return send_to_server(order_obj)


def send_to_server(obj):

    check_token_relevance()

    headers = {'Authorization': THE_TOKEN, 'Content-Type': 'application/json'}
    # params = {"country_codes": ["RU"]}
    print('######################BOODY',type(obj), json.dumps(obj, ensure_ascii=False))
    resp = requests.post(f'https://api{testMode}.cdek.ru/v2/orders',
                        #  params=params,
                         headers=headers,
                         data=json.dumps(obj))

    resp = json.loads(str(resp.content, encoding='utf-8'))
    print(resp)
    ans = {
        'state': resp['requests'][0]['state'],
    }
    if 'errors' in resp['requests'][0]:
        ans['errors'] = resp['requests'][0]['errors']
    if 'warnings' in resp['requests'][0]:
        ans['warnings'] = resp['requests'][0]['warnings']

    return json.dumps(ans)


if __name__ == "__main__":
    get_token()
