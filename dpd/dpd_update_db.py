import sqlite3
import xml.etree.ElementTree as ET
import json
import http.client

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

# для обновления базы нужно реализовать 3 функции:
#   1 getCitiesCashPay - Получить список городов свозможностью доставки сналоженным платежом
#   2 getParcelShops - Получить список пунктовприема/выдачи посылок,имеющих ограничения
#   3 getTerminalsSelfDelivery2 Получить список пунктовприема/выдачи посылок, не имеющих ограничений

queries = {
    1: f"""<?xml version='1.0' encoding='UTF-8'?>
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
        xmlns:tns="http://dpd.ru/ws/geography/2015-05-20">
        <soapenv:Body>
            <tns:getCitiesCashPay>
                <request>
                    <auth>
                        <clientNumber>{client_number}</clientNumber>
                        <clientKey>{client_key}</clientKey>
                    </auth>
                    <countryCode>RU</countryCode>
                </request>
            </tns:getCitiesCashPay>
        </soapenv:Body>
        </soapenv:Envelope>""",
    2: f"""<?xml version='1.0' encoding='UTF-8'?>
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
        xmlns:tns="http://dpd.ru/ws/geography/2015-05-20">
        <soapenv:Body>
            <tns:getParcelShops>
                <request>
                    <auth>
                        <clientNumber>{client_number}</clientNumber>
                        <clientKey>{client_key}</clientKey>
                    </auth>
                </request>
            </tns:getParcelShops>
        </soapenv:Body>
        </soapenv:Envelope>""",
    3: f"""<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
        xmlns:tns="http://dpd.ru/ws/geography/2015-05-20">
        <soapenv:Body>
            <tns:getTerminalsSelfDelivery2>
                    <auth>
                        <clientNumber>{client_number}</clientNumber>
                        <clientKey>{client_key}</clientKey>
                    </auth>
            </tns:getTerminalsSelfDelivery2>
        </soapenv:Body>
        </soapenv:Envelope>""",
}

prefix_map = {
    "S": "http://schemas.xmlsoap.org/soap/envelope/",
    "ns2": "http://dpd.ru/ws/geography/2015-05-20",
}


def queryToXMLs():
    for queryNum in [1, 2, 3]:
        conn = http.client.HTTPConnection(serverURL)
        headers = {"Encoding": "utf-8"}
        body = queries[queryNum]
        conn.request("POST", "/services/geography2?wsdl", body, headers)
        resp = conn.getresponse()
        # print(resp.status)
        result = resp.read().decode("utf-8")
        conn.close()

        # for tests
        # print(result)
        with open("query" + str(queryNum) + ".xml", "w") as f:
            f.write(result)


def getQueryTextFromXML(queryNum):
    return open("query" + str(queryNum) + ".xml", "r").read()


def getQueryText(queryNum):
    conn = http.client.HTTPConnection(serverURL)
    headers = {"Encoding": "utf-8"}
    body = queries[queryNum]
    conn.request("POST", "/services/geography2?wsdl", body, headers)
    resp = conn.getresponse()
    # print(resp.status)
    result = resp.read().decode("utf-8")
    conn.close()
    return result


def updateCitiesCashPay():
    print('UPDATING')
    tableName = "citiesCashPay"
    conn = sqlite3.connect(r"db/dpd.db")
    cur = conn.cursor()
    cur.execute(
        f"""CREATE TABLE IF NOT EXISTS {tableName}(
        cityId INTEGER,
        regionCode TEXT,
        regionName TEXT,
        cityCode TEXT,
        cityName TEXT
        );"""
    )
    cur.execute(f"""DELETE FROM {tableName}""")

    tree = ET.ElementTree(ET.fromstring(getQueryText(1)))
    cities = (
        tree.getroot()
        .find("S:Body", prefix_map)
        .find("ns2:getCitiesCashPayResponse", prefix_map)
    )

    to_insert = []
    for city in cities:
        cid = city.find("cityId").text
        rc = city.find("regionCode").text
        rn = city.find("regionName").text
        cc = city.find("cityCode").text
        cn = city.find("cityName").text
        to_insert.append((cid, rc, rn, cc, cn))
    cur.executemany(
        f"""INSERT INTO {tableName}
                    (cityId , regionCode, regionName, cityCode, cityName)
                    VALUES (?,?,?,?,?);""",
        to_insert,
    )
    conn.commit()
    conn.close()


def updateParcelShops():
    tableName = "parcelShops"
    conn = sqlite3.connect(r"db/dpd.db")
    cur = conn.cursor()

    columns = [
        "code",
        "parcelShopType",
        "state",
        "cityId",
        "regionCode",
        "regionName",
        "cityCode",
        "cityName",
        "street",
        "streetAbbr",
        "houseNo",
        "building",
        "structure",
        "ownership",
        "latitude",
        "longitude",
        "maxShipmentWeight",
        "maxWeight",
        "maxLength",
        "maxWidth",
        "maxHeight",
        "dimentionSum",
        "services",
    ]

    columns_declare_str = ""
    columns_list = ""
    for x in columns:
        if x in ["maxShipmetWeight","maxWeight","maxLength","maxWidth","maxHeight","dimentionSum"]:
            columns_declare_str += x + " INTEGER, "
        else:
            columns_declare_str += x + " TEXT, "
        columns_list += x + ", "
    columns_declare_str = columns_declare_str[:-2]
    columns_list = columns_list[:-2]

    cur.execute(f"""CREATE TABLE IF NOT EXISTS {tableName}({columns_declare_str});""")

    cur.execute(f"""DELETE FROM {tableName}""")
    tree = ET.ElementTree(ET.fromstring(getQueryText(2)))

    retrn = (
        tree.getroot()
        .find("S:Body", prefix_map)
        .find("ns2:getParcelShopsResponse", prefix_map)
        .find("return")
    )

    to_insert = []
    for parcelShop in retrn:
        code = parcelShop.find("code").text
        parcelShopType = parcelShop.find("parcelShopType").text
        state = parcelShop.find("state").text
        addr = parseAddress(parcelShop.find("address"))
        latitude = parcelShop.find("geoCoordinates").find("latitude").text
        longitude = parcelShop.find("geoCoordinates").find("longitude").text
        if parcelShop.find("limits") is None:
            # print(code)
            limits = ("none", "none", "none", "none", "none", "none")
        else:
            limits = parseLimits(parcelShop.find("limits"))
        services = ""
        for child in parcelShop.find("services"):
            services += child.text + " "

        a = (
            (code, parcelShopType, state)
            + addr
            + (latitude, longitude)
            + limits
            + (services,)
        )
        to_insert.append(a)

    # print(len(columns))
    # print(('?,'*len(columns))[:-1])
    # print(columns_list)
    # print(columns_declare_str)
    cur.executemany(
        f"""INSERT INTO {tableName} ({columns_list})
                        VALUES ({('?,'*len(columns))[:-1]}); """,
        to_insert,
    )
    conn.commit()
    conn.close()


def updateTerminalsSelfDelivery2():
    tableName = "terminalsSelfDelivery2"
    conn = sqlite3.connect(r"db/dpd.db")
    cur = conn.cursor()

    columns = [
        "code",
        "name",
        "cityId",
        "regionCode",
        "regionName",
        "cityCode",
        "cityName",
        "street",
        "streetAbbr",
        "houseNo",
        "building",
        "structure",
        "ownership",
        "latitude",
        "longitude",
        "services",
    ]

    columns_declare_str = ""
    columns_list = ""
    for x in columns:
        columns_declare_str += x + " TEXT, "
        columns_list += x + ", "
    columns_declare_str = columns_declare_str[:-2]
    columns_list = columns_list[:-2]

    cur.execute(f"""CREATE TABLE IF NOT EXISTS {tableName}({columns_declare_str});""")

    cur.execute(f"""DELETE FROM {tableName}""")
    tree = ET.ElementTree(ET.fromstring(getQueryText(3)))
    retrn = (
        tree.getroot()
        .find("S:Body", prefix_map)
        .find("ns2:getTerminalsSelfDelivery2Response", prefix_map)
        .find("return")
    )
    to_insert = []
    for parcelShop in retrn:
        code = parcelShop.find("terminalCode").text
        name = parcelShop.find("terminalName").text
        addr = parseAddress(parcelShop.find("address"))
        latitude = parcelShop.find("geoCoordinates").find("latitude").text
        longitude = parcelShop.find("geoCoordinates").find("longitude").text
        services = ""
        for child in parcelShop.find("services"):
            services += child.text + " "

        a = (code, name) + addr + (latitude, longitude, services)
        to_insert.append(a)

    # print(len(columns))
    # print(('?,'*len(columns))[:-1])
    # print(columns_list)
    # print(columns_declare_str)
    cur.executemany(
        f"""INSERT INTO {tableName} ({columns_list})
                        VALUES ({('?,'*len(columns))[:-1]}); """,
        to_insert,
    )
    conn.commit()
    conn.close()


def parseAddress(addressElem):
    tags = [
        "cityId",
        "regionCode",
        "regionName",
        "cityCode",
        "cityName",
        "street",
        "streetAbbr",
        "houseNo",
        "building",
        "structure",
        "ownership",
    ]

    res = []
    for tag in tags:
        elem = addressElem.find(tag)
        if elem is None:
            res.append("none")
            continue
        res.append(elem.text)
    return tuple(res)


def parseLimits(limitsElem):
    tags = [
        "maxShipmetWeight",
        "maxWeight",
        "maxLength",
        "maxWidth",
        "maxHeight",
        "dimentionSum",
    ]

    res = []
    for tag in tags:
        elem = limitsElem.find(tag)
        if elem is None:
            res.append(10000)
            continue
        res.append(elem.text)

    return tuple(res)

def updateAll():
    print('******updating CitiesCashPay******')
    updateCitiesCashPay()
    print('******updating ParcelShops******')
    updateParcelShops()
    print('******updating TerminalsSelfDelivery******')
    updateTerminalsSelfDelivery2()

if __name__ == "__main__":
    updateCitiesCashPay()
    updateParcelShops()
    updateTerminalsSelfDelivery2()
   