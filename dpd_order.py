import xml.etree.ElementTree as ET
import json
import http.client

with open("tokens.json", "r") as f:
    tokens = json.load(f)
    client_number = tokens["dpd_number"]
    client_key = tokens["dpd_key"]
   


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
