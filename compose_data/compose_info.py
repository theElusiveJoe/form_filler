import json
import re

from compose_data.gsheets_query import get_order_from_gsheetstring
from compose_data.zippack_query import get_order_from_zippack
from compose_data.mail_reader import get_order_from_mail


def get_order_info(line_num):
    gstring, order_id = get_order_from_gsheetstring(line_num)
    if ord('A') <= ord(order_id[0]) <= ord('Z'): 
        zstring = get_order_from_zippack(re.sub("\D", "", order_id))
    else:
        zstring = get_order_from_mail(order_id)
    the_string = f'{{"zippack":{zstring}, "gsheets":{gstring}}}'
    
    print('--------------------ПРИШЛО С ЗАППАКА:--------------------\n' + zstring)
    print('--------------------ПРИШЛО С ГУГЛ ТАБЛИЦ--------------------\n' + gstring)
    return the_string
