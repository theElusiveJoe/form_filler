import xml.etree.ElementTree as ET 
import http.client 
import sqlite3
import json
import os

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

def getServiceCostByParcels2(siteQuery):
    orderData = json.loads(siteQuery)

    dbConn = sqlite3.connect(r"db/dpd.db")
    cur = dbConn.cursor()
    cur.execute(f"""
        SELECT cityId
        FROM parcelShops
        WHERE code = "{orderData['terminalId']}"
        UNION
        SELECT cityId
        FROM terminalsSelfDelivery2
        WHERE code = "{orderData['terminalId']}"
    """)
    cityId = cur.fetchone()[0]
    # print(cityId)

    ns = {
        'soapenv': 'http://schemas.xmlsoap.org/soap/envelope/',
        'tns': 'http://dpd.ru/ws/calculator/2012-03-20',
        'S': 'http://schemas.xmlsoap.org/soap/envelope/',
        'ns2': 'http://dpd.ru/ws/calculator/2012-03-20'
    }
    tree = ET.parse("dpd"+os.sep+"dpd_service_cost_pattern.xml")
    theRoot = tree.getroot()
    
    root = theRoot.find('soapenv:Body', ns).find('tns:getServiceCostByParcels2', ns).find('request')

    root.find('auth').find('clientNumber').text = client_number
    root.find('auth').find('clientKey').text = client_key

    root.find('delivery').find('cityId').text = cityId

    root.find('selfPickup').text = 'false'
    root.find('selfDelivery').text = 'true'

    parcel = root.find('parcel')
    parcel.find('weight').text = orderData['weight']
    parcel.find('height').text = orderData['size'][0] 
    parcel.find('length').text = orderData['size'][1]
    parcel.find('width').text = orderData['size'][2]
    parcel.find('quantity').text = orderData['positions'] 

    myXml = ET.tostring(theRoot)

    conn = http.client.HTTPConnection(serverURL)
    headers = {
        "Encoding": "utf-8",
    }
    conn.request("POST", "/services/calculator2?wsdl", myXml, headers)

    resp = conn.getresponse()
    a = resp.read().decode("utf-8")
    tree =  ET.ElementTree(ET.fromstring(a))
    root = tree.getroot()
    root = root.find('S:Body', ns).find('ns2:getServiceCostByParcels2Response', ns)

    jsonResp = []
    for child in root:
        m = {}
        m['serviceCode'] = child.find('serviceCode').text
        m['cost'] = float(child.find('cost').text)
        m['days'] = child.find('days').text
        m['serviceName'] = child.find('serviceName').text
        jsonResp.append(m)

    return json.dumps(jsonResp)
