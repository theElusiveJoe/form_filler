import xml.etree.ElementTree as ET
import json
import http.client
import sqlite3
from typing import NamedTuple

getCorrectAddresSample="""
[{"source":"Новосибирская область  Новосибирск  ","result":"Новосибирск",
"postal_code":"630000","country":"Россия","country_iso_code":"RU","federal_district":"Сибирский",
"region_fias_id":"1ac46b49-3209-4814-b7bf-a509ea1aecd9","region_kladr_id":"5400000000000",
"region_iso_code":"RU-NVS","region_with_type":"Новосибирская обл","region_type":"обл",
"region_type_full":"область","region":"Новосибирская","area_fias_id":null,"area_kladr_id":null,
"area_with_type":null,"area_type":null,"area_type_full":null,"area":null,
"city_fias_id":"8dea00e3-9aab-4d8e-887c-ef2aaa546456","city_kladr_id":"5400000100000",
"city_with_type":"г Новосибирск","city_type":"г","city_type_full":"город","city":"Новосибирск",
"city_area":null,"city_district_fias_id":null,"city_district_kladr_id":null,"city_district_with_type":null,"city_district_type":null,"city_district_type_full":null,"city_district":null,"settlement_fias_id":null,"settlement_kladr_id":null,"settlement_with_type":null,"settlement_type":null,"settlement_type_full":null,"settlement":null,"street_fias_id":null,"street_kladr_id":null,"street_with_type":null,"street_type":null,"street_type_full":null,"street":null,"house_fias_id":null,"house_kladr_id":null,"house_type":null,"house_type_full":null,"house":null,"block_type":null,"block_type_full":null,"block":null,"entrance":null,"floor":null,"flat_fias_id":null,"flat_type":null,"flat_type_full":null,"flat":null,"flat_area":null,"square_meter_price":null,"flat_price":null,"postal_box":null,"fias_id":"8dea00e3-9aab-4d8e-887c-ef2aaa546456","fias_code":"54000001000000000000000","fias_level":"4","fias_actuality_state":"0","kladr_id":"5400000100000","capital_marker":"2","okato":"50401000000","oktmo":"50701000001","tax_office":"5400","tax_office_legal":"5400","timezone":"UTC+7","geo_lat":"55.028191","geo_lon":"82.9211489","beltway_hit":null,"beltway_distance":null,"qc_geo":4,"qc_complete":3,"qc_house":10,"qc":0,"unparsed_parts":null,"metro":null}]"""

with open("tokens.json", "r") as f:
    tokens = json.load(f)
    client_number = tokens["dpd_number"]
    client_key = tokens["dpd_key"]
    dadata_token = tokens["dadata_token"]
    dadata_key = tokens["dadata_key"]


def create_xml(data):
    """
    parses template file and fills data from 'data' parametr(string)
    """
    parsed_data = json.loads(data)
    # print(parsed_data)
    order = parsed_data["data"]["orders"][0]
    # print(order)

    tree = ET.parse("dalli_order_pattern.xml")
    root = tree.getroot()
    root.find("auth").set("token", TOKEN)
    root.find("order").set("number", order["order"])

    rec = root.find("order").find("receiver")
    rec.find("town").text = order["receiver"]["town"] + " город"
    rec.find("address").text = order["receiver"]["address"]
    rec.find("person").text = order["receiver"]["person"]
    rec.find("phone").text = order["receiver"]["phone"]
    date = order["receiver"]["date"].split(".")
    rec.find("date").text = date[2] + "-" + date[1] + "-" + date[0]
    rec.find("time_min").text = order["receiver"]["timeMin"]
    rec.find("time_max").text = order["receiver"]["timeMax"]

    ord = root.find("order")
    ord.find("service").text = order["service"]
    ord.find("weight").text = order["weight"]
    ord.find("quantity").text = order["quantity"]
    ord.find("paytype").text = order["paytype"]
    ord.find("priced").text = order["priced"]
    ord.find("price").text = order["price"]
    # ord.find('upsnak').text = order
    ord.find("inshprice").text = order["declaredPrice"]
    ord.find("instruction").text = order["instruction"]

    for i in range(len(order["items"])):
        it = ET.SubElement(ord.find("items"), "item")
        it.set("quantity", order["items"][f"{i}"]["quantity"])
        it.set("weight", order["items"][f"{i}"]["mass"])
        it.set("retprice", order["items"][f"{i}"]["retprice"])
        it.set("article", order["items"][f"{i}"]["article"])
        it.text = order["items"][f"{i}"]["name"]

    tree.write("parsed_data.xml", encoding="utf-8")
    ans = ET.tostring(root, encoding="utf-8")
    # print(ans)
    return ans


def send_order(data_xml):
    """
    simply sends the xml-string to dpd soap server
    """
    conn = http.client.HTTPConnection("wstest.dpd.ru")
    headers = {"Encoding": "utf-8"}
    conn.request("POST", "/services/order2?wsdl", data_xml.encode("utf-8"), headers)

    resp = conn.getresponse()
    return resp.read().decode("utf-8")


def create_dpd_order():
    """
    works incorrect now
    """
    # print("--------------------ОТСЫЛАЮ В DPD--------------------")
    # print(data)
    # data_xml = create_xml(data)
    data_xml = open("dpd_order_pattern.xml", "r").read()
    # print('created xml:')
    # print(data_xml)

    resp = send_order(data_xml)
    # print(resp)
    open("smth.xml", "w").write(resp)
    # errors = {}
    # root = ET.fromstring(resp)
    # for i, child in enumerate(root.find('order')):
    #     err = child.get('errorMessage')
    #     errors[i] = err
    #     # print('ОШИБКА:', err)

    # return json.dumps(errors)


def getCorrectAddres(badAddress):
    """
    gets unformatted address and returns array of predictions
    (not a string, but python object)
    """
    print('пришел такой адрес: ', badAddress)
    # for tests!!!!!!!!!!!!!
    # return json.loads(
    #     getCorrectAddresSample
    # )

    conn = http.client.HTTPConnection("cleaner.dadata.ru")
    headers = {
        "Encoding": "utf-8",
        "Authorization": f"Token {dadata_token}",
        "X-Secret": dadata_key,
    }
    conn.request("POST", "/api/v1/clean/address", json.dumps([badAddress]), headers)

    resp = conn.getresponse()
    a = resp.read().decode("utf-8")
    conn.close()
    # print("resp ", a)
    return json.loads(a)


def beautifyAddr(addrTuple):
    # print(addrTuple)
    (
        rescityName,
        resstreetAbbr,
        resstreet,
        reshouseNo,
        resownership,
        resbuilding,
        resstructure,
    ) = addrTuple
    addr = rescityName + ", " + resstreetAbbr + " " + resstreet + ", "
    addr += (
        ""
        if reshouseNo == "none"
        else reshouseNo + ""
        if resownership == "none"
        else resownership
    )
    if "none" not in [resbuilding, resstructure]:
        return addr + f"({resstructure}|{resbuilding})"
    if resbuilding == resstructure == "none":
        return addr
    if resstructure != "none":
        return addr + f"({resstructure})"
        return addr + f"({building})"


def createSuggestionTemplate(code, lat, long, addr):
    return {"code": code, "lat": lat, "long": long, "addr": addr}


def getTerminals(siteQuery):
    """
    gets data about order and returns a single terminal? if it is suitable
    or suggests list of affordable terminals

    returns json string ready to respond to website

    структура ответа на сервер:
        error - если вообще невозможно отправить посылку
        problems - не находит такой пункт самовывоза, или не подходит по габаритам
    """
    # print(siteQuery)
    orderData = json.loads(siteQuery)

    conn = sqlite3.connect(r"./db/dpd.db")
    cur = conn.cursor()

    resp = {
        "error": False,
        "problems": False,
        "description": "",
        "suggestions": [],
    }
    # print('err?', typeof(orderData["addr"]))
    # анализируем адрес
    addr_obj = getCorrectAddres(
        orderData["region"] + "  " + orderData["city"] + "  " + ' ' if orderData["addr"]=='' else orderData["addr"] 
    )[0]

    # print(addr_obj)

    # проверим, адекватен ли адрес
    if addr_obj["qc"] != 0:
        codes = {
            1: """
            Остались «лишние» части. Пример: «109341 Тверская область Москва Верхние Поля» — здесь лишняя «Тверская область».\n
Либо в исходном адресе недостаточно данных для уверенного разбора. Пример: «Сходня Красная 12» — здесь нет региона 
и города.""",
            2: "Адрес пустой или заведомо «мусорный»",
            3: "Есть альтернативные варианты. Пример: «Москва Тверская-Ямская» — в Москве четыре Тверских-Ямских улицы.",
        }
        resp["description"] = codes[addr_obj["qc"]]
        resp["problems"] = "проблемы с адресом"
        print(resp['description'])
        print('ret1')
        return json.dumps(resp, ensure_ascii=False)

    # проверим, доступен ли в выбраном городе тип платежа
    if orderData["payType"] == "наложный":
        query1 = f"""SELECT * FROM citiesCashPay Where cityName='{orderData['city']}'"""
        cur.execute(query1)
        dbresp = cur.fetchall()
        if len(dbresp) == 0:
            resp["error"] = True
            resp["description"] = "этого города нет в списке городов, в которых доступен наложный платёж"
            print('ret2')
            print(resp)
            return json.dumps(resp)

    # если все хорошо, начинаем искать
    regionCode = addr_obj["city_kladr_id"][:2]
    cityСode = addr_obj["city_kladr_id"][:-2]
    street = addr_obj["street"]
    house = addr_obj["house"]
    block = addr_obj["block"]  # и корпус и строение
    optional_string = ""
    if block is not None:
        optional_string = (
            "AND building ( LIKE " % {block} % " OR structure LIKE " % {block} % ") "
        )

    # в первой (без ограничений):
    cur.execute(
        f"""
        SELECT code, latitude, longitude, cityName, streetAbbr, street, houseNo, ownership, building, structure
        FROM terminalsSelfDelivery2 
        WHERE   regionCode == '{regionCode}' AND
                cityCode == '{cityСode}' AND
                street LIKE "%{street}%" AND
                (houseNo LIKE "%{house}%" OR ownership LIKE "%{house}%") 
                {optional_string}"""
    )
    searchResult = cur.fetchall()

    # сразу в яблочко
    if len(searchResult) == 1:
        addrTuple = ()
        rescode, reslatitude, reslongitude, addrTuple = (
            searchResult[0][0],
            searchResult[0][1],
            searchResult[0][2],
            searchResult[0][3:],
        )
        suggestion = createSuggestionTemplate(
            rescode, reslatitude, reslongitude, beautifyAddr(addrTuple)
        )
        resp["suggestions"].append(suggestion)
        print('ret3')
        return resp

    # во второй (with restrictions):
    cur.execute(
        f"""
        SELECT code, latitude, longitude, 
        cityName, streetAbbr, street, houseNo, ownership, building, structure, 
        maxWeight, maxLength, maxWidth, maxHeight
        FROM parcelShops 
        WHERE   regionCode == "{regionCode}" AND
                cityCode == "{cityСode}" AND
                street LIKE "%{street}%" AND
                (houseNo LIKE "%{house}%" OR ownership LIKE "%{house}%") 
                {optional_string} """
    )
    searchResult = cur.fetchall()

    # со второго раза - тоже не плохо
    if len(searchResult) == 1:
        # print("found in table 2")
        # addrTuple = ()
        (
            rescode,
            reslatitude,
            reslongitude,
            addrTuple,
            resMaxWeight,
            resMaxL,
            resMaxW,
            resMaxH,
        ) = (
            searchResult[0][0],
            searchResult[0][1],
            searchResult[0][2],
            searchResult[0][3:-4],
            searchResult[0][-4],
            searchResult[0][-3],
            searchResult[0][-2],
            searchResult[0][-1],
        )
        if (
            resMaxL >= orderData["maxLength"]
            and resMaxW >= orderData["midWidth"]
            and resMaxH >= orderData["minHeight"]
            and resMaxWeight >= orderData["maxWeight"]
        ):
            suggestion = createSuggestionTemplate(
                rescode, reslatitude, reslongitude, beautifyAddr(addrTuple)
            )
            # print(suggestion)
            resp["suggestions"].append(suggestion)
            print('ret4')
            return resp

    # if couldn't unambiguously choose address
    resp["problems"] = True
    resp["description"] = "package is too large (or found more than one suitable)"

    # find suitable in that city

    # in table 1
    cur.execute(
        f"""
        SELECT  code, latitude, longitude, cityName, 
                streetAbbr, street, houseNo, ownership, building, structure
        FROM terminalsSelfDelivery2 
        WHERE   regionCode == '{regionCode}' AND
                cityCode == '{cityСode}' AND
                street LIKE "%{street}%" AND
                (houseNo LIKE "%{house}%" OR ownership LIKE "%{house}%") 
                {optional_string}"""
    )
    searchResult = cur.fetchall()

    for x in searchResult:
        addrTuple = ()
        rescode, reslatitude, reslongitude, addrTuple = (
            x[0],
            x[1],
            x[2],
            x[3:],
        )
        suggestion = createSuggestionTemplate(
            rescode, reslatitude, reslongitude, beautifyAddr(addrTuple)
        )
        resp["suggestions"].append(suggestion)

    # in table 2
    cur.execute(
        f"""
        SELECT  code, latitude, longitude, cityName, 
                streetAbbr, street, houseNo, ownership, building, structure
        FROM parcelShops 
        WHERE   regionCode == "{regionCode}" AND
                cityCode == "{cityСode}" AND
                {orderData["maxWeight"]} <= maxWeight AND {orderData["maxLength"]} <= maxLength AND
                {orderData["midWidth"]} <= maxWidth AND {orderData["minHeight"]} <= maxHeight
                """
    )
    searchResult = cur.fetchall()
    for x in searchResult:
        addrTuple = ()
        rescode, reslatitude, reslongitude, addrTuple = (
            x[0],
            x[1],
            x[2],
            x[3:],
        )
        suggestion = createSuggestionTemplate(
            rescode, reslatitude, reslongitude, beautifyAddr(addrTuple)
        )
        resp["suggestions"].append(suggestion)
    
    print('ret5')
    return resp

testsList = [
        # вернуть ошибку при поиске адреса
        {
            "region": "starnge",
            "city": "адрес",
            "addr": "",
            "maxLength": 37,
            "midWidth": 18,
            "minHeight": 13,
            "maxWeight": 3,
            "payType": "наложный"
        },
        # один в первой (а без строения найдет?)
        {
            "region": "Новосибирская область",
            "city": "Новосибирск",
            "addr": "проспект Мира 58",
            "maxLength": 1000,
            "midWidth": 18,
            "minHeight": 13,
            "maxWeight": 3,
            "payType": "наложный"
        },
        # один в первой
        {
            "region": "Новосибирская область",
            "city": "Новосибирск",
            "addr": "проспект Мира 58, стр 11",
            "maxLength": 0,
            "midWidth": 0,
            "minHeight": 0,
            "maxWeight": 0,
            "payType": "наложный"
        },
        # один во второй
        {
            "region": "Москва",
            "city": "Москва",
            "addr": "москва, никулинская улица, 15с1",
            "maxLength": 37,
            "midWidth": 18,
            "minHeight": 13,
            "maxWeight": 3,
            "payType": "наложный"
        },
        # нашёлся только один во второй таблице и не подошел по ограничениям
        {
           "region": "Москва",
            "city": "Москва",
            "addr": "москва, никулинская улица, 15с1",
            "maxLength": 37,
            "midWidth": 10000,
            "minHeight": 100000,
            "maxWeight": 3,
            "payType": "наложный"
        },
        {
            "region": "Москва",
            "city": "Москва",
            "addr": "москва, Алтуфьевское шоссе",
            "maxLength": 37,
            "midWidth": 10,
            "minHeight": 10,
            "maxWeight": 3,
            "payType": "наложный"
        },
    ]

def createTests():
    # какие могут результаты работы функции?

    # некорректный адрес
    # для города не доступен наложный платеж (городов больше, чем пвз)

    # нашёлся только один в первой таблице
    # нашёлся только один во второй таблице и подошел по ограничениям
    # нашёлся только один во второй таблице и не подошел по ограничениям
    # нашлось несколько подходящих

    
    adresses = []
    for test in testsList:
        orderData = json.loads(test)

        addr_obj = getCorrectAddres(
            orderData["region"] + "  " + orderData["city"] + "  " + ' ' if orderData["addr"]=='' else orderData["addr"] 
        )[0]

        adresses.append(addr_obj)
    
    print(adresses)
    f = open('testSts.json', 'w').write(json.dumps(adresses))

def getTerminalsTestEdit(siteQuery, siteResp):
    """
    gets data about order and returns a single terminal? if it is suitable
    or suggests list of affordable terminals

    returns json string ready to respond to website

    структура ответа на сервер:
        error - если вообще невозможно отправить посылку
        problems - не находит такой пункт самовывоза, или не подходит по габаритам
    """
    # print(siteQuery)
    orderData = json.loads(siteQuery)

    conn = sqlite3.connect(r"./db/dpd.db")
    cur = conn.cursor()

    resp = {
        "error": False,
        "problems": False,
        "description": "",
        "suggestions": [],
    }
    # print('err?', typeof(orderData["addr"]))
    # анализируем адрес
    addr_obj = siteResp

    # print(addr_obj)

    # проверим, адекватен ли адрес
    if addr_obj["qc"] != 0:
        codes = {
            1: """
            Остались «лишние» части. Пример: «109341 Тверская область Москва Верхние Поля» — здесь лишняя «Тверская область».\n
            Либо в исходном адресе недостаточно данных для уверенного разбора. Пример: «Сходня Красная 12» — здесь нет региона 
            и города.""",
            2: "Адрес пустой или заведомо «мусорный»",
            3: "Есть альтернативные варианты. Пример: «Москва Тверская-Ямская» — в Москве четыре Тверских-Ямских улицы.",
        }
        resp["description"] = codes[addr_obj["qc"]]
        resp["problems"] = "проблемы с адресом"
        return json.dumps(resp, ensure_ascii=False)

    # проверим, доступен ли в выбраном городе тип платежа
    if orderData["payType"] == "наложный":
        query1 = f"""SELECT * FROM citiesCashPay Where cityName='{orderData['city']}'"""
        cur.execute(query1)
        dbresp = cur.fetchall()
        if len(dbresp) == 0:
            resp["error"] = True
            resp[
                "description"
            ]: "этого города нет в списке городов, в которых доступен наложный платёж"
            return json.dumps(resp, ensure_ascii=False)

    # если все хорошо, начинаем искать
    regionCode = addr_obj["city_kladr_id"][:2]
    cityСode = addr_obj["city_kladr_id"][:-2]
    street = addr_obj["street"]
    house = addr_obj["house"]
    block = addr_obj["block"]  # и корпус и строение
    optional_string = ""
    if block is not None:
        optional_string = (
            "AND building ( LIKE " % {block} % " OR structure LIKE " % {block} % ") "
        )

    # в первой (без ограничений):
    cur.execute(
        f"""
        SELECT code, latitude, longitude, cityName, streetAbbr, street, houseNo, ownership, building, structure
        FROM terminalsSelfDelivery2 
        WHERE   regionCode == '{regionCode}' AND
                cityCode == '{cityСode}' AND
                street LIKE "%{street}%" AND
                (houseNo LIKE "%{house}%" OR ownership LIKE "%{house}%") 
                {optional_string}"""
    )
    searchResult = cur.fetchall()

    # сразу в яблочко
    if len(searchResult) == 1:
        addrTuple = ()
        rescode, reslatitude, reslongitude, addrTuple = (
            searchResult[0][0],
            searchResult[0][1],
            searchResult[0][2],
            searchResult[0][3:],
        )
        suggestion = createSuggestionTemplate(
            rescode, reslatitude, reslongitude, beautifyAddr(addrTuple)
        )
        resp["suggestions"].append(suggestion)
        return resp

    # во второй (with restrictions):
    cur.execute(
        f"""
        SELECT code, latitude, longitude, 
        cityName, streetAbbr, street, houseNo, ownership, building, structure, 
        maxWeight, maxLength, maxWidth, maxHeight
        FROM parcelShops 
        WHERE   regionCode == "{regionCode}" AND
                cityCode == "{cityСode}" AND
                street LIKE "%{street}%" AND
                (houseNo LIKE "%{house}%" OR ownership LIKE "%{house}%") 
                {optional_string} """
    )
    searchResult = cur.fetchall()

    # со второго раза - тоже не плохо
    if len(searchResult) == 1:
        # print("found in table 2")
        # addrTuple = ()
        (
            rescode,
            reslatitude,
            reslongitude,
            addrTuple,
            resMaxWeight,
            resMaxL,
            resMaxW,
            resMaxH,
        ) = (
            searchResult[0][0],
            searchResult[0][1],
            searchResult[0][2],
            searchResult[0][3:-4],
            searchResult[0][-4],
            searchResult[0][-3],
            searchResult[0][-2],
            searchResult[0][-1],
        )
        if (
            resMaxL >= orderData["maxLength"]
            and resMaxW >= orderData["midWidth"]
            and resMaxH >= orderData["minHeight"]
            and resMaxWeight >= orderData["maxWeight"]
        ):
            suggestion = createSuggestionTemplate(
                rescode, reslatitude, reslongitude, beautifyAddr(addrTuple)
            )
            # print(suggestion)
            resp["suggestions"].append(suggestion)
            return resp

    # if couldn't unambiguously choose address
    resp["problems"] = True
    resp["description"] = "package is too large (or found more than one suitable)"

    # find suitable in that city

    # in table 1
    cur.execute(
        f"""
        SELECT  code, latitude, longitude, cityName, 
                streetAbbr, street, houseNo, ownership, building, structure
        FROM terminalsSelfDelivery2 
        WHERE   regionCode == '{regionCode}' AND
                cityCode == '{cityСode}' AND
                street LIKE "%{street}%" AND
                (houseNo LIKE "%{house}%" OR ownership LIKE "%{house}%") 
                {optional_string}"""
    )
    searchResult = cur.fetchall()

    for x in searchResult:
        addrTuple = ()
        rescode, reslatitude, reslongitude, addrTuple = (
            x[0],
            x[1],
            x[2],
            x[3:],
        )
        suggestion = createSuggestionTemplate(
            rescode, reslatitude, reslongitude, beautifyAddr(addrTuple)
        )
        resp["suggestions"].append(suggestion)

    # in table 2
    cur.execute(
        f"""
        SELECT  code, latitude, longitude, cityName, 
                streetAbbr, street, houseNo, ownership, building, structure
        FROM parcelShops 
        WHERE   regionCode == "{regionCode}" AND
                cityCode == "{cityСode}" AND
                {orderData["maxWeight"]} <= maxWeight AND {orderData["maxLength"]} <= maxLength AND
                {orderData["midWidth"]} <= maxWidth AND {orderData["minHeight"]} <= maxHeight
                """
    )
    searchResult = cur.fetchall()
    for x in searchResult:
        addrTuple = ()
        rescode, reslatitude, reslongitude, addrTuple = (
            x[0],
            x[1],
            x[2],
            x[3:],
        )
        suggestion = createSuggestionTemplate(
            rescode, reslatitude, reslongitude, beautifyAddr(addrTuple)
        )
        resp["suggestions"].append(suggestion)
    

    return resp

def runTests():
    with  open('testSts.json') as testsFile:
        tests2 = json.loads(testsFile.read())

    resultsFile = open('testResults.json', 'w')
    for i in range(len(testsList)):
        a = getTerminalsTestEdit(testsList[i], tests2[i])
        resultsFile.write(a + '\n\n')

if __name__ == "__main__":
    a = open('test/dpdAddressTests.json', 'w')
    b = json.loads(testsList)
    print(b)
    # for test in testsList:
    #     # a = getTerminals(test)
    #     # a = json.loads(a)
    #     # a = json.dumps(a, ensure_ascii=False)
    #     # f.write(a)

    #     testMap = json.loads(test)
    #     a = getCorrectAddres(testMap['region'] + '  ' + testMap['city'] + ' ' + testMap['addr'])[0]
    #     print(a['qc'], ' : ' + a['result'])