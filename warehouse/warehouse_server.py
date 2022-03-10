from compose_data.gsheets_write import warehouse_to_gsheets
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
        if self.path != "/" and not exists(path) and not (path.endswith('json') or '.func' in path):
            self.send_error(404, "File not found")
            # print('--------File not found-----------')
            return
        try:
            if self.path == "/":
                self.send_response(200)
                self.send_header("Content-type", "text/html")
                self.send_header("Encoding", "utf-8")
                self.end_headers()
                data = open("./src/index.html", "r", encoding='utf-8').read()
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
                    print(f'--------------------ОБРАБОТКА СТРОКИ: {line_num}--------------------')
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
        try:
            if 'sendToGsheets.func' in path:
                warehouse_to_gsheets(post_body)
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                self.wfile.write(bytes('OK', "utf-8"))
        except:
            logging.exception('')
            self.send_error(500, "Error on server")
def run(server_class=HTTPServer, handler_class=S, addr="localhost", port=8000):
    server_address = (addr, port)
    httpd = server_class(server_address, handler_class)

    print(f"Starting httpd server on {addr}:{port}")
    httpd.serve_forever()

if __name__ == "__main__":
    run(addr='localhost', port=8041)

