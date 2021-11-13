
var orderStatusColors = {
        //---------------------------------------------
        'created': '#f2f2f2', // создан
        'takewarehouse': '#b3a2c7', // принят на склад
        'indelivery': '#8eb4e3', // В доставке
        'deliveredto': '#77933c', // Доставлен
        'undelivered': '#ffff00', //Не доставлен
        'cancel': '#ff0000',// Отмена
        //---------------------------------------------
        //- СТАРЫЕ СТАТУСЫ
	"NEW": "color:#000;background-color:#87CEEB",
	"ACCEPTED": "color:#fff;background-color:#8a2be2",
	"DEPARTURING": "color:#fff;background-color:#8a2be2",
	"DEPARTURE": "color:#fff;background-color:#BC8F8F",
	"DELIVERY": "color:#fff;background-color:#0000FF",
	"COURIERDELIVERED": "color:#fff;background-color:green",
	"COMPLETE": "color:#fff;background-color:green",
	"PARTIALLY": "color:#000;background-color:#FFFF00",
	"COURIERRETURN": "color:#000;background-color:red",
	"CANCELED": "color:#000;background-color:red",
	"RETURNING": "color:#000;background-color:#FFFF00",
	"RETURNED": "color:#fff;background-color:green",
	"CONFIRM": "color:#fff;background-color:#8a2be2",
	"DATECHANGE": "color:#000;background-color:#FFFF00",
	"PICKUPREADY": "color:#fff;background-color:#0000FF",
	"AWAITING_SYNC": ""
};

var orderStatusTitle = {
	"NEW": "Новый",
	"ACCEPTED": "Принят на склад",
	"DEPARTURING": "Подготовлен к отправке",
	"DEPARTURE": "Отправлен партнеру",
	"DELIVERY": "Доставляется",
	"COURIERDELIVERED": "Доставлен",
	"COMPLETE": "Доставлен",
	"PARTIALLY": "Частично доставлен",
	"COURIERRETURN": "Не доставлен",
	"CANCELED": "Возврат",
	"RETURNING": "Возврат",
	"RETURNED": "Возвращен в ИМ",
	"CONFIRM": "Согласована доставка",
	"DATECHANGE": "Перенос",
	"PICKUPREADY": "Готов к выдаче",
	"AWAITING_SYNC": ""
};

var deliveryTypes = {
	"1": "Обычная МСК и МО",
	"2": "Экспресс внутри МКАД",
	"3": "Срочная МСК",
	"4": "ПВЗ Далли-Сервис",
	"5": "Забор из ИМ",
	"6": "Забор от поставщика",
	"7": "Возврат товара",
	"8": "Возврат денег",
	"9": "ПВЗ СДЭК",
	"10": "Курьерская СДЭК",
	"11": "Обычная СПБ и ЛО",
	"12": "ПВЗ СПБ",
	"13": "ПВЗ BOXBERRY",
	"14": "ПВЗ Pick-UP",
	"15": "ПВЗ PickPoint",
    "16": "Экспресс забор",
    "17": "Первая миля",
    "18": "Первая миля+",
    "19": "Почта России",
    "20": "5POST",
};

var deliveryTypesCat = {
    "KUR" : [1,2,10,11,17,18],
    "PVZ" : [4,9,12,13,14,15,20]
};

var paytypes = {
    "CASH": "Наличными курьеру",
    "CARD": "Картой курьеру",
    "NO": "Курьер не должен брать деньги"
    // "OPTION": "Другой"
};

var APILocalization = {
	"person" : "Получатель",
	"order" : "Номер заказа",
	"length" : "Длина",
	"width" : "Ширина",
	"height" : "Высота",



	"receiver.person" : "Получатель",
	"receiver.phone" : "Контактный телефон",
        "receiver.timeMin": "Время с",
        "pvzcode или address" : "Код ПВЗ или адрес",
	"item.quantity" : "Товарная позиция -> Количество мест",
	"item.name" : "Товарная позиция -> Наименование",
	"item.retprice" : "Товарная позиция -> Стоимость за единицу товара",
	"order.orderId" : "Номер заказа",
	"order.service" : "Тип доставки",
	"order.declaredPrice(FLOAT)" : "Объявленная ценность",
	"order.priced": "Стоимость доставки",
	"order.price(FLOAT)": "Наложенный платеж",

	"Validator.weight" : "Общий вес",
	"Validator.declared_price" : "Объявленная ценность",
	"Validator.weight(FLOAT)" : "Общий вес",
	"Validator.price(FLOAT)" : "Наложенный платеж",
	"Validator.declared_price(FLOAT)" : "Объявленная ценность",
	"Validator.price" : "Наложенный платеж",
	"Validator.length" : "Длина",
	"Validator.width" : "Ширина",
	"Validator.height" : "Выстота",

	"Validator.length(FLOAT)" : "Длина",
	"Validator.width(FLOAT)" : "Ширина",
	"Validator.height(FLOAT)": "Высота"
};

/**
 * Коды ошибок
 * @type object
 */
var ApiErrCodes = {
   '100': {'EN': 'TYPE_MISMATCH'},
   '101': {'EN': 'NOT_SET_PROPERTY'},
   '102': {'EN': 'NOT_EMPTY_PROPERTY'},
   '103': {'EN': 'SQL_ERROR'},
   '104': {'EN': 'DECLARED_PRICE_MUST_GREAT_PRICE'},
   '105': {'EN': 'SERVICE_DISABLED'},
   '106': {'EN': 'PAY_TYPE_DISABLED'},
   '107': {'EN': 'ORDER_ALREADY_EXIST'},
   '108': {'EN': 'PVZ_NOT_APPROPRIATE_SERVICE'},
   '109': {'EN': 'DATA_FORMAT_ERROR'},
   '110': {'EN': 'NOT_MEET_TEMPLATE'},
   '111': {'EN': 'NOT_IN_SET'},
   '112': {'EN': 'DATE_SHOULD_BE_MOST_CURRENT'},
   '113': {'EN': 'DATE_TOO_LARGE'},
   '114': {'EN': 'TIME_TOO_LARGE'},
   '115': {'EN': 'DATE_TOO_OLD'},
   '116': {'EN': 'TIME_TOO_EARLY'},
   '117': {'EN': 'SMALL_NURVAL'},
   '118': {'EN': 'CRITICAL_ERROR_FOUD'},
   '119': {'EN': 'ASSES_DENY'},
   '120': {'EN': 'ORDER_NO_EXIST'}
};

var ApiTicketStatuses = {
    'NEW': 'Новый',
    'WAITING': 'Ожидает ответа',
    'OPENED': 'Открытый',
    'CLOSED': 'Закрытый'
};

/**
 * Локализация статуса
 * @param {string} status
 * @returns {ApiTicketStatuses}
 */
function ticketStatusLocalization(status){
    if (status in ApiTicketStatuses){
        return ApiTicketStatuses[status];
    }
    
    return status;
}


function dsLocalization(params, defaultValue){

	if(params[2] !== undefined && APILocalization[params[2] + "." + params[1]] !== undefined){
		return params[0].msg.replace("%s", APILocalization[params[2] + "." + params[1]] );
	}
	if(APILocalization[params[1]] !== undefined){
        return params[0].msg.replace("%s", APILocalization[params[1]] );
	}
	return defaultValue;
}

/**
 * Вспомогательная функция для сериализации форм в json
 */
$.fn.serializeObject = function() {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name]) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

/**
 * Вспомогательная функция для поиска значений в массиве
 */
function in_array(needle, haystack, strict) {

	var found = false, 
		key, 
		strict = !!strict;

	for (key in haystack) {
		if ((strict && haystack[key] === needle) || (!strict && haystack[key] == needle)) {
			found = true;
			break;
		}
	}

	return found;
};

/**
 * Генерирует случайное число в интервале с min по max
 * @param {int} min
 * @param {int} max
 * @returns {Number}
 */
function rand_int(min, max) {
    var rand = min - 0.5 + Math.random() * (max - min + 1);
    rand = Math.round(rand);
    return rand;
}

/**
 * Функция открытия и скрытия лоадера
 * @example loader($('.container'), 'show') ИЛИ loader($('.container'), 'hide')
 * @param {jquery} target - элемент в котором нужно запустить
 * @param {string} action - действие (show-отобразить|hide-закрыть)
 * @param {function} after - функция которая будет выполняться по окончанию 
 * @param {bool} fixed 
 * @returns {undefined}
 */
function loader(target, action, after, fixed){
    var context = target, fixed_css = {'position': 'fixed'};
    switch (action){
        case 'show':
            // $('> .loader', context).length || context.prepend($('<div class="loader-mask"></div>').css(fixed ? fixed_css : {}));
            // $('> .loader', context).length || context.prepend($('<div class="loader-wrapper"><div class="loader"></div><div class="loader-title">Подождите</div></div>').css(fixed ? fixed_css : {}));
            break;
        case 'hide':
            $('> .loader-mask', context).remove();
            $('> .loader-wrapper', context).remove();
            break;
    }
    if (typeof after === 'function'){
        after(context);
    }
}

/**
 * Обращение к API методам
 * @param {string} method
 * @param {object} data
 * @param {function} success
 * @param {function} fail
 * @returns {undefined}
 */
function api_method(method, data, success, fail) {
    var params = $.extend({"method": method}, (typeof data === 'object') ? data : {});
    $.post("/APIclient.php", JSON.stringify(params), function (jsonString) {
        try {
            // Пробуем преобразовать ответ в JSON объект
            var json = $.parseJSON(jsonString);
            // Функция вызова
            (typeof success === 'function') && success(json);
        } catch (e) {
            (typeof fail === 'function') && fail(json);
            console.error('API::' + method + "::Error: Во время получения результата запроса произошла ошибка", json, e);
            return false;
        }
    });
}

/**
 * Бот телеги в группу Лёха
 * @param {int} level - уровень ошибки (0:info|1:warning|2:error)
 * @param {object} params - входные параметры
 * @param {string} message - сообщение
 * @returns {undefined}
 */
function api_bot_message(level, method, input, message, url){
    var levels = {
        '0': 'info',
        '1': 'warning',
        '2': 'error'
    };
    if (!(level in levels)){
        return false;
    } else {
        level = levels[level];
        var botmessage = 'Тип сообщения: '+level+"\n";
        botmessage += 'URL: '+(url === undefined ? '' : url)+"\n";
        botmessage += 'Метод: '+method+"\n";
        botmessage += 'Входные параметры: '+JSON.stringify(input)+"\n";
        botmessage += "Сообщение:\n"+message;
        
        $.post('/debugassistent.php', {'botmessage': botmessage}, function(res){
            if (res.success === false){
                throw new Error('BotMessage: '+res.message);
            }
        }).fail(function(jqhxr){
            console.log(jqhxr);
        });
    }
}

Date.prototype.yyyymmddhhiiss = function() {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();
  var hh = this.getHours();
  var ii = this.getMinutes();
  var ss = this.getSeconds();

  return [this.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
         ].join('-')+' '+[
            (hh>9 ? '' : '0') + hh,
            (ss>9 ? '' : '0') + ss
        ].join(':');
};

jQuery.fn.serializeJSON=function() {
    var json = {};
    jQuery.map(jQuery(this).serializeArray(), function(n, i) {
        var _ = n.name.indexOf('[');
        if (_ > -1) {
            var o = json;
            _name = n.name.replace(/\]/gi, '').split('[');
            for (var i=0, len=_name.length; i<len; i++) {
                if (i == len-1) {
                    if (o[_name[i]]) {
                        if (typeof o[_name[i]] == 'string') {
                            o[_name[i]] = [o[_name[i]]];
                        }
                        o[_name[i]].push(n.value);
                    }
                    else o[_name[i]] = n.value || '';
                }
                else o = o[_name[i]] = o[_name[i]] || {};
            }
        }
        else {
            if (json[n.name] !== undefined) {
                if (!json[n.name].push) {
                    json[n.name] = [json[n.name]];
                }
                json[n.name].push(n.value || '');
            }
            else json[n.name] = n.value || '';
        }
    });
    return json;
};
