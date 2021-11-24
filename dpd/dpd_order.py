import xml.etree.ElementTree as ET
import json
import http.client
import sqlite3
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


def create_xml(data):
    """
    parses template file and fills data from 'data' parametr(string)
    """
    order = json.loads(data)

    ns = {
        'soapenv': 'http://schemas.xmlsoap.org/soap/envelope/',
        'tns': 'http://dpd.ru/ws/order2/2012-04-04',
        'S': 'http://schemas.xmlsoap.org/soap/envelope/',
        'ns2': 'http://dpd.ru/ws/order2/2012-04-04'
    }
    tree = ET.parse("dpd"+os.sep+"dpd_order_pattern.xml")
    theRoot = tree.getroot()

    root = theRoot.find('soapenv:Body', ns).find('tns:createOrder', ns).find('orders')

    root.find("auth").find('clientNumber').text = client_number
    root.find("auth").find('clientKey').text = client_key

    root.find('header').find('datePickup').text = order['header']['datePickup']
    root.find('header').find('pickupTimePeriod').text = order['header']['pickupTimePeriod']

    ord = root.find("order")
    ord.find("orderNumberInternal").text = order['order']["orderNumberInternal"]
    ord.find("serviceCode").text = order['order']["serviceCode"]
    ord.find("serviceVariant").text = order['order']["serviceVariant"]
    ord.find("cargoNumPack").text = order['order']["cargoNumPack"]
    ord.find("cargoWeight").text = order['order']["cargoWeight"]
    ord.find("cargoCategory").text = order['order']["cargoCategory"]
    ord.find("cargoValue").text = order['order']["cargoValue"]

    ord.find("receiverAddress").find('name').text = order['order']['receiverAddress']['name']
    ord.find("receiverAddress").find('terminalCode').text = order['order']['receiverAddress']['terminalCode']
    ord.find("receiverAddress").find('contactFio').text = order['order']['receiverAddress']['contactFio']
    ord.find("receiverAddress").find('contactPhone').text = order['order']['receiverAddress']['contactPhone']
    
    for i in range(len(order['order']['unitLoad'])):
        it = ET.SubElement(root.find('order'), "unitLoad")
        for x in ['article', 'descript', 'npp_amount', 'count']:
            a =ET.SubElement(it, x)
            a.text = str(order['order']['unitLoad'][i][x])

    ans = ET.tostring(theRoot)
    return ans


def send_order(data_xml):
    """
    simply sends the xml-string to dpd soap server
    """
    print('connection opened')
    conn = http.client.HTTPConnection(serverURL)
    print(serverURL)
    headers = {"Encoding": "utf-8"}
    conn.request("POST", "/services/order2?wsdl", data_xml, headers)
    print('sent')
    resp = conn.getresponse()
    print(resp.status)
    return parseResp(resp.read().decode("utf-8"))

def parseResp(xmlString):
    print(xmlString)
    tree = ET.ElementTree(ET.fromstring(xmlString))
    root = tree.getroot()
    ns = {
        'S': "http://schemas.xmlsoap.org/soap/envelope/",
        'ns2' : "http://dpd.ru/ws/order2/2012-04-04"
    }
    root = root.find('S:Body', ns)
    root = root.find('ns2:createOrderResponse', ns)
    root = root.find('return')
 
    if root.find('status').text == 'OK':
        m = {
            'status' : 'OK',
            'errorMessage': 'Заказ успешно добавлен'
        }
    else:
        m = {
            'status' : 'error',
            'errorMessage': root.find('errorMessage').text
        }

    return json.dumps(m)

def create_dpd_order(data):
    xmlString = create_xml(data)
    resp = send_order(xmlString)
    print(resp)
    return resp 
   
