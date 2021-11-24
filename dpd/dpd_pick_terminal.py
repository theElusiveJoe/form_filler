import json
import sqlite3
import http.client
import os
import time

from dpd.dpd_update_db import updateAll

with open("tokens.json", "r") as f:
    tokens = json.load(f)
    testMode = ''
    if tokens['settings']['mode'] == 'test':
        testMode = 'test_'
    serverURL = tokens['dpd'][f"{testMode}server"]
    client_number = tokens['dpd']["dpd_number"]
    client_key = tokens['dpd']["dpd_key"]
    dadata_token = tokens['dadata']["dadata_token"]
    dadata_key = tokens['dadata']["dadata_key"]

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
    return json.loads(a)


def beautifyAddr(addrTuple):
    addr = ''
    for i in range(5):
        addr += addrTuple[i] + ', '

    addr += f'({addrTuple[5]}{addrTuple[6]})'
    addr = addr.replace('none', '').replace('()', '').replace(' , ', '').replace(',(', '(')
    return addr

def isNoneInJson(hashmap, key, trimres = 0):
    if key not in hashmap.keys() or hashmap[key] is None:
        return '-'
    if trimres == 0:
        return hashmap[key]
    return hashmap[key][:-trimres]

def createSuggestionTemplate(code, lat, long, addr):
    return {"code": code, "lat": lat, "long": long, "addr": addr}

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
    # m = {
    #     "error": False,
    #     "problems": True,
    #     "description": "слишком большая посылка, либо нашлось несколько подходящих пунктов",
    #     "suggestions": [
    #         {
    #             "code": "M11",
    #             "lat": "55.827237",
    #             "long": "37.659551",
    #             "addr": "Москва, улица, Касаткина, 11(2)"
    #         }
    #     ],
    #     "predicion": "превышение габарит"
    # }

    # return json.dumps(m)
    # orderData = siteQuery
    # orderData = json.loads(siteQuery)

    conn = sqlite3.connect(r"db/dpd.db")
    cur = conn.cursor()
    
    cur.execute("""
        SELECT * FROM lastUpdate
    """)

    lastUpdateTime = cur.fetchone()[0]
    nowtime = round(time.time())
    if nowtime - lastUpdateTime > 5*60*60:
        print('******updating BD******')
        updateAll()
        cur.execute(f"""
            DELETE FROM lastUpdate;
        """)
        cur.execute(f"""
            INSERT INTO lastUpdate (time) VALUES ({nowtime});
        """)
        conn.commit()

    resp = {
        "error": False,
        "problems": False,
        "description": "",
        "suggestions": [],
    }

    # for test!!!
    dadataResp = """{
    "source": "Волгоградская область  Волжский  Мира 42м",
        "result": "Волгоградская обл, г Волжский, ул Мира, д 42М",
        "postal_code": "404127",
        "country": "Россия",
        "country_iso_code": "RU",
        "federal_district": "Южный",
        "region_fias_id": "da051ec8-da2e-4a66-b542-473b8d221ab4",
        "region_kladr_id": "3400000000000",
        "region_iso_code": "RU-VGG",
        "region_with_type": "Волгоградская обл",
        "region_type": "обл",
        "region_type_full": "область",
        "region": "Волгоградская",
        "area_fias_id": null,
        "area_kladr_id": null,
        "area_with_type": null,
        "area_type": null,
        "area_type_full": null,
        "area": null,
        "city_fias_id": "bc5ed788-84c8-493e-9598-7a15a9f1e4c1",
        "city_kladr_id": "3400000200000",
        "city_with_type": "г Волжский",
        "city_type": "г",
        "city_type_full": "город",
        "city": "Волжский",
        "city_area": null,
        "city_district_fias_id": null,
        "city_district_kladr_id": null,
        "city_district_with_type": null,
        "city_district_type": null,
        "city_district_type_full": null,
        "city_district": null,
        "settlement_fias_id": null,
        "settlement_kladr_id": null,
        "settlement_with_type": null,
        "settlement_type": null,
        "settlement_type_full": null,
        "settlement": null,
        "street_fias_id": "41390b6b-9019-4faa-ba42-1776697d8f84",
        "street_kladr_id": "34000002000003100",
        "street_with_type": "ул Мира",
        "street_type": "ул",
        "street_type_full": "улица",
        "street": "Мира",
        "house_fias_id": "5082f8fd-554b-475a-bf7d-0485d1266603",
        "house_kladr_id": "3400000200000310399",
        "house_type": "д",
        "house_type_full": "дом",
        "house": "42М",
        "block_type": null,
        "block_type_full": null,
        "block": null,
        "entrance": null,
        "floor": null,
        "flat_fias_id": null,
        "flat_type": null,
        "flat_type_full": null,
        "flat": null,
        "flat_area": null,
        "square_meter_price": null,
        "flat_price": null,
        "postal_box": null,
        "fias_id": "5082f8fd-554b-475a-bf7d-0485d1266603",
        "fias_code": "34000002000000000310399",
        "fias_level": "8",
        "fias_actuality_state": "0",
        "kladr_id": "3400000200000310399",
        "capital_marker": "0",
        "okato": "18410000000",
        "oktmo": "18710000001",
        "tax_office": "3435",
        "tax_office_legal": "3435",
        "timezone": "UTC+3",
        "geo_lat": "48.775275",
        "geo_lon": "44.799226",
        "beltway_hit": null,
        "beltway_distance": null,
        "qc_geo": 0,
        "qc_complete": 5,
        "qc_house": 2,
        "qc": 0,
        "unparsed_parts": null,
        "metro": null
        }"""
    orderData = json.loads(siteQuery)
    
    if dadataResp != '': 
        addr_obj = json.loads(dadataResp)
    else :
        print(orderData)

        addr_obj = getCorrectAddres( orderData["region"] + "  " + orderData["city"] + "  " + ('' if orderData["addr"]=='' else orderData["addr"]))[0]
        
    print('--------------------ПРИШЛО С DADATA   :--------------------')
    print(addr_obj)


    # проверим, адекватен ли адрес
    if addr_obj["qc"] != 0 and addr_obj["qc"] != 3:
        codes = {
            1: """Остались «лишние» части. Пример: «109341 Тверская область Москва Верхние Поля» — здесь лишняя «Тверская область».
    Либо в исходном адресе недостаточно данных для уверенного разбора. Пример: «Сходня Красная 12» — здесь нет региона
    и города.""",
            2: "Адрес пустой или заведомо «мусорный»",
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
            resp["description"] = "этого города нет в списке городов, в которых доступен наложный платёж"
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
    print(searchParams)

    sqlQuery = f"""
        SELECT code, latitude, longitude, cityName, streetAbbr, street, houseNo, ownership, building, structure
        FROM terminalsSelfDelivery2
        WHERE       (
                        regionCode  LIKE "%{isNoneInJson(addr_obj,'region_kladr_id', 2)}%" OR regionName LIKE "{isNoneInJson(addr_obj, 'region')}"
                    )
                AND
                    (   cityCode  LIKE "%{isNoneInJson(addr_obj,'region_kladr_id', 2)}%" OR cityName LIKE "%{isNoneInJson(addr_obj,'region')}%"
                        OR cityCode LIKE "%{isNoneInJson(addr_obj,'area_kladr_id', 5)}%" OR cityName LIKE "%{isNoneInJson(addr_obj,'area')}%"
                        OR cityCode  LIKE "%{isNoneInJson(addr_obj,'city_kladr_id', 2)}%" OR cityName LIKE "%{isNoneInJson(addr_obj,'city')}%"
                    )

                """
    # print(sqlQuery)
    cur.execute(
       sqlQuery
    )
    searchResult = cur.fetchall()
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
        return json.dumps(resp)

    # во второй (with restrictions):
    sqlQuery = f"""
        SELECT code, latitude, longitude,
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

    cur.execute(
       sqlQuery
    )
    searchResult = cur.fetchall()

    # со второго раза - тоже не плохо
    if len(searchResult) == 1:
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
            resp["suggestions"].append(suggestion)
            return json.dumps(resp)

    # if couldn't unambiguously choose address
    resp["problems"] = True
    resp["description"] = "слишком большая посылка, либо нашлось несколько подходящих пунктов"

    # find suitable in that city

    # in table 1

    sqlQuery = f"""
        SELECT code, latitude, longitude, cityName, streetAbbr, street, houseNo, ownership, building, structure
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

    # print(sqlQuery)
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
        suggestion = createSuggestionTemplate(
            rescode, reslatitude, reslongitude, beautifyAddr(addrTuple)
        )
        resp["suggestions"].append(suggestion)

    # in table 2
    sqlQuery = f"""
        SELECT code, latitude, longitude,
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
                AND (
                        {orderData["maxWeight"]} <= maxWeight AND {orderData["maxLength"]} <= maxLength AND
                        {orderData["midWidth"]} <= maxWidth AND {orderData["minHeight"]} <= maxHeight
                    )
                """
    # print(sqlQuery)
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
        suggestion = createSuggestionTemplate(
            rescode, reslatitude, reslongitude, beautifyAddr(addrTuple)
        )
        resp["suggestions"].append(suggestion)

    return json.dumps(resp)


def updateDadataResps():
    f = open('./test/dpdAddressTests.json', 'r')
    tests = json.load(f)
    adresses = []
    for test in tests:
        orderData = test
        addr_obj = getCorrectAddres(
            orderData["region"] + "  " + orderData["city"] + "  " + (' ' if orderData["addr"]=='' else orderData["addr"])
        )[0]
        adresses.append(addr_obj)
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
        addr_obj = getCorrectAddres(
            test
        )[0]
        adresses.append(addr_obj)
    f = open('./test/dadataRespExamples.json', 'w').write(json.dumps(adresses, ensure_ascii=False))

if __name__ == "__main__":
    conn = sqlite3.connect(r"db/dpd.db")
    cur = conn.cursor()
    
    cur.execute("""
        SELECT * FROM lastUpdate
    """)

    lastUpdateTime = cur.fetchone()[0]
    nowtime = round(time.time())
    if nowtime - lastUpdateTime > 5*60*60:
        print('******updating BD******')
        updateAll()
        cur.execute(f"""
            DELETE FROM lastUpdate;
        """)
        cur.execute(f"""
            INSERT INTO lastUpdate (time) VALUES ({nowtime});
        """)
        conn.commit()