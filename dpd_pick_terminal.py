import json
import sqlite3


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


    # print(addr_obj)
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
    # addr_obj = getCorrectAddres(
    #     orderData["region"] + "  " + orderData["city"] + "  " + ('' if orderData["addr"]=='' else orderData["addr"]) 
    # )[0]


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



if __name__ == "__main__":
    # f = open('./test/dpdAddressTests.json', 'r')
    # tests = json.load(f)
    # adresses = []
    # for test in tests:
    #     orderData = test    
    #     # print(orderData)
    #     print(orderData["region"] + "  " + orderData["city"] + "  " + (' ' if orderData["addr"]=='' else orderData["addr"]) )
    #     addr_obj = getCorrectAddres(
    #         orderData["region"] + "  " + orderData["city"] + "  " + (' ' if orderData["addr"]=='' else orderData["addr"]) 
    #     )[0]
    #     adresses.append(addr_obj)
    # print(adresses)
    # f = open('./test/dadaraResps.json', 'w').write(json.dumps(adresses, ensure_ascii=False))


    ftests = open('test/dpdAddressTests.json')
    tests = json.load(ftests)[0]
    ftests.close()

    fresps = open('test/dadaraResps.dadaraResps.json')
    resps = json.load(fresps)[0]
    fresps.close()

    for i in len(tests):


    # for test in testsList:
    #     # a = getTerminals(test)
    #     # a = json.loads(a)
    #     # a = json.dumps(a, ensure_ascii=False)
    #     # f.write(a)

    #     testMap = json.loads(test)
    #     a = getCorrectAddres(testMap['region'] + '  ' + testMap['city'] + ' ' + testMap['addr'])[0]
    #     print(a['qc'], ' : ' + a['result'])