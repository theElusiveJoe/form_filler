from sdek.sdek_queries import send_SDEK_order
from sdek.sdek_queries import getSDEKOffices as get_SDEK_offices
from sdek.sdek_queries import countSDEKDelivery as count_SDEK_delivery
from sdek.sdek_queries import parseSDEKAddress as parse_SDEK_address
from sdek.sdek_queries import get_orders_status as get_SDEK_order_status
from dpd.dpd_order import create_dpd_order
from dpd.dpd_service_cost import getServiceCostByParcels2 as get_dpd_cost
from dpd.dpd_pick_terminal import getTerminals as get_dpd_terminals
from dalli.dalii_order import create_dalli_order
from compose_data.compose_info import get_order_info
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
from urllib.request import urlopen


import argparse
from os.path import exists
from os.path import abspath
import json
import logging 

import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))


class S(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_GET(self):
        print(self.path)
        # парсим аргументы
        url = urlparse(self.path)
        query = url.query
        params = {}
        if query != '':
            for x in query.split('&'):
                t = x.split('=')
                params[t[0]] = t[1]

        print(params)

        path = abspath('.'+url.path)

        # запросы на json-файлы я использую как команды,
        # поэтому могу запрашивать несуществующий json-файл
        try:
            if self.path != "/" and not exists(path) and not (path.endswith('json') or '.func' in path):
                self.send_error(404, "File not found")
                # print('--------File not found-----------')
                return

            if self.path == "/":
                self.send_response(200)
                self.send_header("Content-type", "text/html")
                self.send_header("Encoding", "utf-8")
                self.end_headers()
                data = open("./src/html/index.html", "r").read()
                self.wfile.write(bytes(data, "utf-8"))
            elif url.path.endswith('html'):
                self.send_response(200)
                self.send_header("Content-type", "text/html")
                self.send_header("Encoding", "utf-8")
                self.end_headers()
                data = open(path, "r", encoding='utf-8').read()
                self.wfile.write(bytes(data, "utf-8"))
            elif url.path.endswith('js'):
                self.send_response(200)
                self.send_header("Content-type", "text/javascript")
                self.send_header("Encoding", "utf-8")
                self.end_headers()
                data = open(path, "r", encoding='utf-8').read()
                self.wfile.write(bytes(data, 'utf-8'))
            elif url.path.endswith('css'):
                self.send_response(200)
                self.send_header("Content-type", "text/css")
                self.end_headers()
                data = open(path, "r", encoding='utf-8').read()
                self.wfile.write(bytes(data, 'utf-8'))
            elif url.path.endswith('json'):
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                if exists(path):
                    data = open(path, "r", encoding='utf-8').read()
                    self.wfile.write(bytes(data, 'utf-8'))
                else:
                    # обрабатываю get-запрос для кнопки "ввести номер линии из таблицы"
                    line_num = self.path[1:-5]
                    print(
                        f'--------------------ОБРАБОТКА СТРОКИ: {line_num}--------------------')
                    data = get_order_info(line_num)
                    self.wfile.write(bytes(data, 'utf-8'))
            else:
                self.send_response(200)
                self.send_header("Content-type", "text/html")
                self.end_headers()
                data = open(path, "rb").read()
                self.wfile.write(bytes(data))
        except:
            logging.exception('')
            self.send_error(500, "Error on server")

    def do_HEAD(self):
        self._set_headers()

    def do_POST(self):
        # парсим аргументы
        # print('new post')

        url = urlparse(self.path)
        query = url.query
        params = {}
        if query != '':
            for x in query.split('&'):
                t = x.split('=')
                params[t[0]] = t[1]
        path = abspath('.'+url.path)

        content_len = int(self.headers.get('Content-Length'))
        post_body = self.rfile.read(content_len).decode('utf-8')

        # а вот и те самые команды:
        try:
            if self.path == '/APIclient.php':  # обрабатывает синюю далишную кнопку
                pass
            # Dalli
            elif self.path == '/sendDalli.json':  # обрабатывает мою кнопку
                result = create_dalli_order(post_body)
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                self.wfile.write(bytes(result, "utf-8"))
            # DPD
            elif 'getDPDTerminals.func' in self.path:
                result = get_dpd_terminals(post_body)
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                self.wfile.write(bytes(result, "utf-8"))
            elif 'getServiceCost.func' in self.path:
                result = get_dpd_cost(post_body)
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                self.wfile.write(bytes(result, "utf-8"))
            elif 'createOrder.func' in self.path:
                result = create_dpd_order(post_body)
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                self.wfile.write(bytes(result, "utf-8"))
            # SDEK
            elif 'getSDEKTerminals.func' in self.path:
                result = get_SDEK_offices(post_body)
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                self.wfile.write(bytes(result, "utf-8"))
            elif 'parseSDEKAddress.func' in self.path:
                result = parse_SDEK_address(post_body)
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                self.wfile.write(bytes(result, "utf-8"))
            elif 'countSDEKDelivery.func' in self.path:
                result = count_SDEK_delivery(post_body)
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                self.wfile.write(bytes(result, "utf-8"))
            elif 'createSDEKOrder.func' in self.path:
                result = send_SDEK_order(post_body)
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                self.wfile.write(bytes(result, "utf-8"))
            elif 'getSDEKstatus.func' in self.path:
                result = get_SDEK_order_status()
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                self.wfile.write(bytes(result, "utf-8"))
        except:
            logging.exception('')
            self.send_error(500, "Error on server")


def run(server_class=HTTPServer, handler_class=S, addr="localhost", port=8000):
    server_address = (addr, port)
    httpd = server_class(server_address, handler_class)

    print(f"Starting httpd server on {addr}:{port}")
    httpd.serve_forever()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run a simple HTTP server")
    parser.add_argument(
        "-l",
        "--listen",
        default="localhost",
        help="Specify the IP address on which the server listens",
    )
    parser.add_argument(
        "-p",
        "--port",
        type=int,
        default=8040,
        help="Specify the port on which the server listens",
    )
    args = parser.parse_args()

    run(addr=args.listen, port=args.port)