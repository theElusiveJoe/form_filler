import json
import re

from compose_data.gsheets_query import get_order_from_gsheetstring
from compose_data.zippack_query import get_order_from_zippack

def get_order_info(line_num):
    gstring, order_id = get_order_from_gsheetstring(line_num)
    zstring = get_order_from_zippack(re.sub("\D", "", order_id))
    the_string = f'{{"zippack":{zstring}, "gsheets":{gstring}}}'
    
    print('--------------------ПРИШЛО С ЗАППАКА:--------------------\n' + zstring)
    print('--------------------ПРИШЛО С ГУГЛ ТАБЛИЦ--------------------\n' + gstring)
    return the_string
