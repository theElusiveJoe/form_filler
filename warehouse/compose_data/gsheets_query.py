import httplib2 
import apiclient.discovery
from oauth2client.service_account import ServiceAccountCredentials	

import xml.etree.ElementTree as ET
import json

with open('tokens.json', 'r') as f:
    tokens = json.load(f)
    api_mail = tokens['gsheets']['api_mail']
    SHEET_ID = tokens['gsheets']['SHEET_ID']
    CREDENTIALS_FILE = tokens['gsheets']['CREDENTIALS_FILE']

SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']

credentials = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, SCOPES)

httpAuth = credentials.authorize(httplib2.Http())
service = apiclient.discovery.build('sheets', 'v4', http=httpAuth)
sheet = service.spreadsheets()

columns_to_xmlels = {'Число': 'date',
        'Заказ': 'id',
        'Номер счета': 'account_number', 
        'Нал': 'cash',
        'Безнал': 'emoney', 
        'Оплачено (число)': 'paid',
        'Форма оплаты': 'payment_method', 
        'Время': 'payment_time',
        'Примечание': 'comments', 
        'Вывоз': 'delivery_service',
        'Письмо на склад': 'mail_on_warehouse',
        'Доставка на': 
        'delivery_arranged_on',
        'Мест': 'positions', 
        'габариты': 'size',
        'вес': 'weight', 
        'Списано со склада': 'decommisioned',
        'Статус': 'status', 'примечания': 'comments2', 'warehouse' : 'warehouse'}

def get_titles():
    return sheet.values().get(spreadsheetId=SHEET_ID, range='Лист1!A2:Z2').execute()['values'][0]

def get_string(num):
    a = sheet.values()
    print('a:', a)
    b = a.get(spreadsheetId=SHEET_ID, range=f'Лист1!A{num}:Z{num}')
    print('b:', b)
    c = b.execute()
    print('c:', c)
    print('values', c['values'])

    return sheet.values().get(spreadsheetId=SHEET_ID, range=f'Лист1!A{num}:Z{num}').execute()['values'][0]

def get_order_from_gsheetstring(ordernum):
    titles = get_titles()
    values = get_string(ordernum)
    for i in range(len(titles)-len(values) + 1):
        values.append('')
    m = {}
    for i, title in enumerate(titles):
        m[columns_to_xmlels[title]] = values[i]
    return json.dumps(m, ensure_ascii=False), m['id'] if m['id'].strip() != '' else m['account_number']

if __name__ == '__main__':
    get_order_from_gsheetstring(4416)