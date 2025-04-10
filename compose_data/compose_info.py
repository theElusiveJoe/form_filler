import json
import re
import logging

from compose_data.gsheets_query import get_order_from_gsheetstring
from compose_data.zippack_query import get_order_from_zippack
from compose_data.mail_reader import get_order_from_mail
from compose_data.spbkonvert_query import get_order_from_spbkonvert


def get_order_info(line_num):
    gstring, order_id = get_order_from_gsheetstring(line_num.strip())
    zstring = ''
    if ord('A') <= ord(order_id.strip()[0]) <= ord('Z'): 
        try:
            zstring = get_order_from_zippack(re.sub("\D", "", order_id))
        except:
            logging.exception('')
            logging.error('Проблема с гугл таблицами')
    else:
        try:
            zstring = get_order_from_spbkonvert(order_id)
        except:
            logging.exception('')
            logging.error('Проблема с спбконверт')
    the_string = f'{{"zippack":{zstring}, "gsheets":{gstring}}}'
    
    print('--------------------ПРИШЛО С ЗАППАКА|ПОЧТЫ:--------------------\n' + zstring)
    print('--------------------ПРИШЛО С ГУГЛ ТАБЛИЦ--------------------\n' + gstring)
    return the_string
