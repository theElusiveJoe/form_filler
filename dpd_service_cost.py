import xml.etree.ElementTree as ET 
import http.client 
import sqlite3
import json

with open("tokens.json", "r") as f:
    tokens = json.load(f)
    client_number = tokens["dpd_number"]
    client_key = tokens["dpd_key"]

def getServiceCostByParcels2(siteQuery):
    orderData = json.loads(siteQuery)
    # print(orderData)

    dbConn = sqlite3.connect(r"./db/dpd.db")
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
    tree = ET.parse("dpd_service_cost_pattern.xml")
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
    # print(myXml)
    conn = http.client.HTTPConnection('wstest.dpd.ru')
    headers = {
        "Encoding": "utf-8",
    }
    conn.request("POST", "/services/calculator2?wsdl", myXml, headers)

    resp = conn.getresponse()
    a = resp.read().decode("utf-8")
    # print(a)
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

if __name__ == '__main__':
    getServiceCostByParcels2()
#     myXml = open('test_service.xml', 'r').read()
#     print(myXml)
#     myXml = '''<?xml version='1.0' encoding='UTF-8'?>
# <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://dpd.ru/ws/calculator/2012-03-20">
# 	<soapenv:Body>
# 		<tns:getServiceCostByParcels2>
# 			<request>
# 				<auth>
# 					<clientNumber>1002017398</clientNumber>
# 					<clientKey>6D4216831E84FE7DE86BBDC4B5E9C97CE3E0E21D</clientKey>
# 				</auth>
#                 <pickup> 
#                     <cityId>49694102</cityId>
#                 </pickup>
#                 <delivery>   
#                     <cityId>49694102</cityId>
#                 </delivery>

#                 <selfPickup>false</selfPickup>

#                 <selfDelivery>true</selfDelivery>
                
#                 <maxDays>15</maxDays>
                
#                 <maxCost>15000</maxCost>
#                 <declaredValue>1000</declaredValue>
#                 <parcel>
#                     <weight>2</weight>
#                     <length>12</length>
#                     <width>12</width>
#                     <height>12</height>
#                     <quantity>3</quantity>
#                 </parcel>
#                 <parcel>
#                     <weight>2</weight>
#                     <length>12</length>
#                     <width>12</width>
#                     <height>12</height>
#                     <quantity>3</quantity>
#                 </parcel>
# 			</request>
# 		</tns:getServiceCostByParcels2>
# 	</soapenv:Body>
# </soapenv:Envelope>
#     '''
#     conn = http.client.HTTPConnection('wstest.dpd.ru')
#     headers = {
#         "Encoding": "utf-8",
#     }
#     conn.request("POST", "/services/calculator2?wsdl", myXml.encode('utf-8'), headers)

#     resp = conn.getresponse()
#     a = resp.read().decode("utf-8")
#     print(a)
#     conn.close()
    
#     open('smth.xml', 'w').write(a)