import json
import sqlite3
import http.client


with open("tokens.json", "r") as f:
    tokens = json.load(f)
    dadata_token = tokens["dadata_token"]
    dadata_key = tokens["dadata_key"]

def getCorrectAddres(badAddress):
    """
    gets unformatted address and returns array of predictions
    (not a string, but python object)
    """
    # print('пришел такой адрес: ', badAddress)
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
    # # print("resp ", a)
    return json.loads(a)


def beautifyAddr(addrTuple):
    # # print(addrTuple)
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

def isNoneInJson(hashmap, key, trimres = 0):
    print(key, ': ', hashmap[key])
    if key not in hashmap.keys() or hashmap[key] is None:
        return '-'
    return hashmap[key][:-trimres]

def createSuggestionTemplate(code, lat, long, addr):
    return {"code": code, "lat": lat, "long": long, "addr": addr}


    # # print(addr_obj)

def getTerminals(siteQuery, dadataResp = ''):
    """
    gets data about order and returns a single terminal? if it is suitable
    or suggests list of affordable terminals

    returns json string ready to respond to website

    структура ответа на сервер:
        error - если вообще невозможно отправить посылку
        problems - не находит такой пункт самовывоза, или не подходит по габаритам
    """

    # for test!!!
    orderData = siteQuery
    # orderData = json.loads(siteQuery)

    conn = sqlite3.connect(r"./db/dpd.db")
    cur = conn.cursor()

    resp = {
        "error": False,
        "problems": False,
        "description": "",
        "suggestions": [],
    }

    # анализируем адрес
    # for test!!!
    addr_obj = dadataResp
    # # print(addr_obj)
    # addr_obj = getCorrectAddres(
    #     orderData["region"] + "  " + orderData["city"] + "  " + ('' if orderData["addr"]=='' else orderData["addr"]) 
    # )[0]


    # проверим, адекватен ли адрес
    # print(addr_obj["qc"])
    # # print(orderData["region"] + "  " + orderData["city"] + "  " + ('' if orderData["addr"]=='' else orderData["addr"]) )
    if addr_obj["qc"] != 0 and addr_obj["qc"] != 3:
        codes = {
            1: """Остались «лишние» части. Пример: «109341 Тверская область Москва Верхние Поля» — здесь лишняя «Тверская область».
    Либо в исходном адресе недостаточно данных для уверенного разбора. Пример: «Сходня Красная 12» — здесь нет региона 
    и города.""",
            2: "Адрес пустой или заведомо «мусорный»",
        }
        resp["description"] = codes[addr_obj["qc"]]
        resp["problems"] = "проблемы с адресом"
        # print(resp['description'])
        # print('ret1')
        return json.dumps(resp, ensure_ascii=False)

    # проверим, доступен ли в выбраном городе тип платежа
    if orderData["payType"] == "наложный":
        query1 = f"""SELECT * FROM citiesCashPay Where cityName='{orderData['city']}'"""
        cur.execute(query1)
        dbresp = cur.fetchall()
        if len(dbresp) == 0:
            resp["error"] = True
            resp["description"] = "этого города нет в списке городов, в которых доступен наложный платёж"
            # print('ret2')
            # print(resp)
            return json.dumps(resp)

    # если все хорошо, начинаем искать по извращенной логике:
    # для региона используем: 
    #       region_kladr_id[:2], region (это имя) - с ним все понятно
    # городом может быть все, что угодно:
    #       region_kladr_id[:-2] и region (например для москвы)
    #       area_kladr_id[:-5] и area - обрезаем до кода района (одинцово)
    #       city_kladr_id[:-2] и city
    # [:-2] делается для обрезания последних двух цифр - актуальности адресного объекта

    searchParams = (
        isNoneInJson(addr_obj,'region_kladr_id', 2), isNoneInJson(addr_obj, 'region'), 
        isNoneInJson(addr_obj, 'region_kladr_id', 2), isNoneInJson(addr_obj,'region'), 
        isNoneInJson(addr_obj, 'area_kladr_id', 5), isNoneInJson(addr_obj,'area'), 
        isNoneInJson(addr_obj,'city_kladr_id', 2), isNoneInJson(addr_obj, 'city'), 

        isNoneInJson(addr_obj, 'street'), 
        
        isNoneInJson(addr_obj, 'house'), isNoneInJson(addr_obj, 'house')
    )
    # # print(searchParams)
    
    sqlQuery = f"""SELECT code, latitude, longitude, cityName, streetAbbr, street, houseNo, ownership, building, structure
        FROM terminalsSelfDelivery2 
        WHERE       (
                        regionCode  LIKE "%{isNoneInJson(addr_obj,'region_kladr_id', 2)}%"OR regionName  LIKE "%{isNoneInJson(addr_obj,'region')}%"
                    )
                AND 
                    (   cityCode  LIKE "%{isNoneInJson(addr_obj,'region_kladr_id', 2)}%"OR cityName LIKE "%{isNoneInJson(addr_obj,'region')}%"
                        OR cityCode LIKE "%{isNoneInJson(addr_obj,'area_kladr_id', 5)}%" OR cityName LIKE "%{isNoneInJson(addr_obj,'area')}%"
                        OR cityCode  LIKE "%{isNoneInJson(addr_obj,'city_kladr_id', 2)}%"OR cityName LIKE "%{isNoneInJson(addr_obj,'city')}%"
                    ) 
               
                """
    print(sqlQuery)
    cur.execute(
       sqlQuery
    )
    searchResult = cur.fetchall()
    # # if len(searchResult) >= 3:
       
            # # print(searchResult[:3])
    # else:
        # # print(searchResult)

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
        # print('ret3')
        return json.dumps(resp)

    # во второй (with restrictions):
    sqlQuery = f"""SELECT code, latitude, longitude, 
        cityName, streetAbbr, street, houseNo, ownership, building, structure, 
        maxWeight, maxLength, maxWidth, maxHeight
        FROM parcelShops
        WHERE       (
                        regionCode  LIKE "%{isNoneInJson(addr_obj,'region_kladr_id', 2)}%"OR regionName  LIKE "%{isNoneInJson(addr_obj,'region')}%"
                    )
                AND 
                    (   cityCode  LIKE "%{isNoneInJson(addr_obj,'region_kladr_id', 2)}%"OR cityName LIKE "%{isNoneInJson(addr_obj,'region')}%"
                        OR cityCode LIKE "%{isNoneInJson(addr_obj,'area_kladr_id', 5)}%" OR cityName LIKE "%{isNoneInJson(addr_obj,'area')}%"
                        OR cityCode  LIKE "%{isNoneInJson(addr_obj,'city_kladr_id', 2)}%"OR cityName LIKE "%{isNoneInJson(addr_obj,'city')}%"
                    ) 
                AND
                    street LIKE "%{isNoneInJson(addr_obj,'street')}%"
                AND
                    (
                        houseNo LIKE "%{isNoneInJson(addr_obj,'house')}%" OR ownership LIKE "%{isNoneInJson(addr_obj,'house')}%"
                    ) 
                """

    print(sqlQuery)
    cur.execute(
       sqlQuery
    )
    searchResult = cur.fetchall()
    # # if len(searchResult) >= 3:
       
            # # print(searchResult[:3])
    # else:
        # # print(searchResult)

    # со второго раза - тоже не плохо
    if len(searchResult) == 1:
        # # print("found in table 2")
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
            # # print(suggestion)
            resp["suggestions"].append(suggestion)
            # print('ret4')
            return json.dumps(resp)

    # if couldn't unambiguously choose address
    resp["problems"] = True
    resp["description"] = "слишком большая посылка, либо нашлось несколько подходящих пунктов"

    # find suitable in that city

    # in table 1

    sqlQuery = f"""SELECT code, latitude, longitude, cityName, streetAbbr, street, houseNo, ownership, building, structure
        FROM terminalsSelfDelivery2
        WHERE       (
                        regionCode  LIKE "%{isNoneInJson(addr_obj,'region_kladr_id', 2)}%"OR regionName  LIKE "%{isNoneInJson(addr_obj,'region')}%"
                    )
                AND 
                    (   cityCode  LIKE "%{isNoneInJson(addr_obj,'region_kladr_id', 2)}%"OR cityName LIKE "%{isNoneInJson(addr_obj,'region')}%"
                        OR cityCode LIKE "%{isNoneInJson(addr_obj,'area_kladr_id', 5)}%" OR cityName LIKE "%{isNoneInJson(addr_obj,'area')}%"
                        OR cityCode  LIKE "%{isNoneInJson(addr_obj,'city_kladr_id', 2)}%"OR cityName LIKE "%{isNoneInJson(addr_obj,'city')}%"
                    ) 
                AND
                    street LIKE "%{isNoneInJson(addr_obj,'street')}%"
                AND
                    (
                        houseNo LIKE "%{isNoneInJson(addr_obj,'house')}%" OR ownership LIKE "%{isNoneInJson(addr_obj,'house')}%"
                    ) 
                """
    
    print(sqlQuery)
    cur.execute(
       sqlQuery
    )
    searchResult = cur.fetchall()
    # # if len(searchResult) >= 3:
       
            # # print(searchResult[:3])
    # else:
        # # print(searchResult)

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
    sqlQuery = f"""SELECT code, latitude, longitude, 
        cityName, streetAbbr, street, houseNo, ownership, building, structure
        FROM parcelShops
        WHERE       (
                        regionCode  LIKE "%{isNoneInJson(addr_obj,'region_kladr_id', 2)}%"OR regionName  LIKE "%{isNoneInJson(addr_obj,'region')}%"
                    )
                AND 
                    (   cityCode  LIKE "%{isNoneInJson(addr_obj,'region_kladr_id', 2)}%"OR cityName LIKE "%{isNoneInJson(addr_obj,'region')}%"
                        OR cityCode LIKE "%{isNoneInJson(addr_obj,'area_kladr_id', 5)}%" OR cityName LIKE "%{isNoneInJson(addr_obj,'area')}%"
                        OR cityCode  LIKE "%{isNoneInJson(addr_obj,'city_kladr_id', 2)}%"OR cityName LIKE "%{isNoneInJson(addr_obj,'city')}%"
                    ) 
                AND
                    street LIKE "%{isNoneInJson(addr_obj,'street')}%"
                AND
                    (
                        houseNo LIKE "%{isNoneInJson(addr_obj,'house')}%" OR ownership LIKE "%{isNoneInJson(addr_obj,'house')}%"
                    ) 
                AND (
                        {orderData["maxWeight"]} <= maxWeight AND {orderData["maxLength"]} <= maxLength AND
                        {orderData["midWidth"]} <= maxWidth AND {orderData["minHeight"]} <= maxHeight
                    )
                """
    print(sqlQuery)
    cur.execute(
       sqlQuery
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
        # print(addrTuple[:-4])
        suggestion = createSuggestionTemplate(
            rescode, reslatitude, reslongitude, beautifyAddr(addrTuple)
        )
        resp["suggestions"].append(suggestion)
        # if len(searchResult) >= 3:
       
            # # print(searchResult[:3])
        # else::
       
            # # print(searchResult)
    
    # print('ret5')
    return json.dumps(resp)


def updateDadataResps():
    f = open('./test/dpdAddressTests.json', 'r')
    tests = json.load(f)
    adresses = []
    for test in tests:
        orderData = test    
        # # print(orderData)
        # print(orderData["region"] + "  " + orderData["city"] + "  " + (' ' if orderData["addr"]=='' else orderData["addr"]) )
        addr_obj = getCorrectAddres(
            orderData["region"] + "  " + orderData["city"] + "  " + (' ' if orderData["addr"]=='' else orderData["addr"]) 
        )[0]
        adresses.append(addr_obj)
    # print(adresses)
    f = open('./test/dadataResps.json', 'w').write(json.dumps(adresses, ensure_ascii=False))

def createManyDadataResps():
    adresses = []
    tests = [
        'Московская область, город Одинцово',
        'город москва',
        'смоленская область, сафоново',
        'волгодонск',
        'ленинградская область, питербург'
    ]
    for test in tests:
        # # print(orderData)
        # print(test)
        addr_obj = getCorrectAddres(
            test
        )[0]
        adresses.append(addr_obj)
    f = open('./test/dadataRespExamples.json', 'w').write(json.dumps(adresses, ensure_ascii=False))

if __name__ == "__main__":
    # updateDadataResps()
    # createManyDadataResps()

    ftests = open('test/dpdAddressTests.json')
    tests = json.load(ftests)
    ftests.close()

    fresps = open('test/dadataResps.json')
    resps = json.load(fresps)
    fresps.close()

    fresults = open('test/results.json', 'w')
    results = []

    nums = range(len(tests))
    nums = [6]
    # print(tests[6], resps[6])

    for i in nums:
        # print('_________' ,i ,'_________')
        a = json.loads(getTerminals(tests[i], dadataResp=resps[i]))
        a['predicion'] = tests[i]['prediction']
        results.append(a)

    # print('ended')
    json.dump(results, fresults, ensure_ascii=False)

    # for test in testsList:
    #     # a = getTerminals(test)
    #     # a = json.loads(a)
    #     # a = json.dumps(a, ensure_ascii=False)
    #     # f.write(a)

    #     testMap = json.loads(test)
    #     a = getCorrectAddres(testMap['region'] + '  ' + testMap['city'] + ' ' + testMap['addr'])[0]
    #     # print(a['qc'], ' : ' + a['result'])