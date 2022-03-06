import json

import httplib2
import apiclient.discovery
from oauth2client.service_account import ServiceAccountCredentials

with open('tokens.json', 'r') as f:
    tokens = json.load(f)
    api_mail = tokens['gsheets']['api_mail']
    SHEET_ID = tokens['gsheets']['SHEET_ID']
    CREDENTIALS_FILE = tokens['gsheets']['CREDENTIALS_FILE']

SCOPES = ['https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive']

credentials = ServiceAccountCredentials.from_json_keyfile_name(
    CREDENTIALS_FILE, SCOPES)

httpAuth = credentials.authorize(httplib2.Http())
service = apiclient.discovery.build('sheets', 'v4', http=httpAuth)
sheet = service.spreadsheets()


def warehouse_to_gsheets(post_body):
    pkg_info = json.loads(post_body)
    print(pkg_info)

    rowNum = pkg_info['lineNum']
    results = service.spreadsheets().values().batchUpdate(spreadsheetId=SHEET_ID, body={
        "valueInputOption": "USER_ENTERED",
        "data": [
            {"range": f"Лист1!S{rowNum}",
             "majorDimension": "ROWS",
             "values": [[str(pkg_info['packages']).replace("'", '"')]]
             }
        ]
    }).execute()
    results = service.spreadsheets().values().batchUpdate(spreadsheetId=SHEET_ID, body={
        "valueInputOption": "USER_ENTERED",
        "data": [
            {"range": f"Лист1!M{rowNum}",
             "majorDimension": "ROWS",
             "values": [[len(pkg_info['packages'])]]
             }
        ]
    }).execute()
    results = service.spreadsheets().values().batchUpdate(spreadsheetId=SHEET_ID, body={
        "valueInputOption": "USER_ENTERED",
        "data": [
            {"range": f"Лист1!N{rowNum}",
             "majorDimension": "ROWS",
             "values": [[pkg_info['size']]]
             }
        ]
    }).execute()
    results = service.spreadsheets().values().batchUpdate(spreadsheetId=SHEET_ID, body={
        "valueInputOption": "USER_ENTERED",
        "data": [
            {"range": f"Лист1!O{rowNum}",
             "majorDimension": "ROWS",
             "values": [[pkg_info['weight']]]
             }
        ]
    }).execute()


def get_string(num):
    return sheet.values().get(spreadsheetId=SHEET_ID, range=f'Лист1!A{num}:Z{num}').execute()['values'][0]

def get_column(num):
    col = chr(ord('A')-1+num)
    print(col)
    return sheet.values().get(spreadsheetId=SHEET_ID, range=f'Лист1!{col}1:{col}100').execute()['values'][0]