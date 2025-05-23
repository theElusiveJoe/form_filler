import http.client
from json2xml import json2xml
from json2xml.utils import readfromurl, readfromstring, readfromjson
import xml.etree.ElementTree as ET
import json

with open('tokens.json', 'r') as f:
    tokens = json.load(f)
    SPBTOKEN = tokens['zippack']['zippack_token']

def get_order_from_spbkonvert(order_id):
    conn = http.client.HTTPConnection('www.spbkonvert.com')
    url = f'https://spbkonvert.com/api/order/get/{order_id}?apikey='+SPBTOKEN
    conn.request('GET', url)
    resp = conn.getresponse()

    if resp.status != 200:
        print("spbkonvert ОТВЕЧАЕТ:\nStatus: {} and reason: {}".format(resp.status, resp.reason)) 
        conn.close()
        return

    json_data = readfromstring(resp.read().decode('utf-8)'))
    # print(json_data)
    
    conn.close()
    # open('zippack.json', 'w+').write(json_data)
    # tree = ET.ElementTree(ET.fromstring(json2xml.Json2xml(json_data).to_xml()))
    # open('zippack.xml', 'w+').write(json2xml.Json2xml(json_data).to_xml())
    # return tree
    try:
        res = json.dumps(json_data, ensure_ascii=False)
    except BaseException:
        print('SOMETHING WENT WRONG')
        return ""
    return res

if __name__ == '__main__':
    print(get_order_from_spbkonvert(12850))