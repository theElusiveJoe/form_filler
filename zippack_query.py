import http.client
from json2xml import json2xml
from json2xml.utils import readfromurl, readfromstring, readfromjson
import xml.etree.ElementTree as ET
import json

with open('tokens.json', 'r') as f:
    tokens = json.load(f)
    TOKEN = tokens['zippack_token']

def get_order_from_zippack(order_id):
    conn = http.client.HTTPConnection('www.zippack.ru')
    conn.request('GET', f'https://zippack.ru/api/order/get/{order_id}?apikey='+TOKEN)
    resp = conn.getresponse()

    if resp.status != 200:
        print("ZIPPACK ОТВЕЧАЕТ:\nStatus: {} and reason: {}".format(resp.status, resp.reason)) 
        conn.close()
        return

    json_data = readfromstring(resp.read().decode('utf-8)'))
    # print(json_data)
    
    conn.close()
    # open('zippack.json', 'w+').write(json_data)
    # tree = ET.ElementTree(ET.fromstring(json2xml.Json2xml(json_data).to_xml()))
    # open('zippack.xml', 'w+').write(json2xml.Json2xml(json_data).to_xml())
    # return tree
    return json.dumps(json_data, ensure_ascii=False)

if __name__ == '__main__':
    print(get_order_from_zippack(12345))