var ziplusheets = {}
var gpackages

function getTodayDate() {
    var now = new Date();
    var date = now.getDate().toString();
    var date = now.getDate().toString();
    var mon = (now.getMonth() + 1).toString();
    if (date.length == 1) { date = '0' + date; }
    if (mon.length == 1) { mon = '0' + mon; }
    return (now.getFullYear().toString() + '-' + mon + '-' + date);
}

function GetByPath(obj, path) {
    var parts = path.split(".");
    var current = obj;
    for (var i = 0; i < parts.length; i++) {
        current = current[parts[i]];
        if (!current)
            break;
    }
    return current;
}

function resetInnerHTML() {
    console.log("отчищаю страницу")

    ziplusheets = {}
    gpackages = {}
    choosen_id = -1
    choosen_city_code = -1
    choosen_type = -1


    var clearHTML = [
        'itemsList',
        'terminal_id',
        'gsheetCommments',
        'delivery_point_address',
        'zippackLink',
        'createOrderResp'
    ]
    for (var i = 0; i < clearHTML.length; i++) {
        document.querySelector('#' + clearHTML[i]).innerHTML = ''
    }

    var linenum = document.querySelector("#lineNum").value
    inputs = document.querySelectorAll('input')
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].value = ''
    }
    document.querySelector("#lineNum").value = linenum

    document.querySelector("#terminal_rb").checked = false
    document.querySelector("#door_rb").checked = false

    myMap.geoObjects.removeAll()
}

function createAdress(order) {
    var district = order['zippack']['obj']['Customer']['District'];
    var city = order['zippack']['obj']['Customer']['City'];
    var street = order['zippack']['obj']['Customer']['Street'];
    var house = order['zippack']['obj']['Customer']['House'];
    var aps = order['zippack']['obj']['Customer']['Apartment'];
    var struct = order['zippack']['obj']['Customer']['Structure'];
    var entr = order['zippack']['obj']['Customer']['Entrance'];
    var floor = order['zippack']['obj']['Customer']['Floor'];
    var addr = ((district == null || district.trim()) == '' ? '' : ('район: ' + district + ' '))
        + ((city.trim() == '' || city.trim() == 'Москва') ? '' : ('город: ' + city + ' '))
        + (street.trim() == '' ? '' : ('улица: ' + street + ' '))
        + (house == '' ? '' : ('дом: ' + house + ' '))
        + (aps.trim() == '' ? '' : ('квартира: ' + aps + ' '))
        + (struct.trim() == '' ? '' : ('строение: ' + struct + ' '))
        + (entr.trim() == '' ? '' : ('подъезд: ' + entr + ' '))
        + (floor.trim() == '' ? '' : ('этаж: ' + floor + ' ')) + ''
    if (order['zippack']['obj']['Customer']['CustomField1'] == '') {
        return order['zippack']['obj']['Customer']['CustomField1'] + ' ' + addr;
    }
    return order['zippack']['obj']['Customer']['CustomField1'] + ' ' + addr;
}


function fillFields(order) {
    resetInnerHTML()
    console.log(order)

    if (!order['zippack']['result']) {
        alert('На Зиппаке произошла ошибка')
        return;
    }

    ziplusheets = order

    // ссылка на заказ
    document.getElementById('zippackLink').innerHTML = ('<a target="_blank" href="https://zippack.ru/adminv3/orders/edit/' + order['zippack']['obj']['Id']
        + '">ссылка на заказ ' + order['zippack']['obj']['Id'] + '</a>')
    // начинаем заполнять поля

    // данные по заказу
    simpleFields = {
        'cargoNumPack': 'gsheets.positions', // количество посылок
        'cargoWeight': 'gsheets.weight',
    }
    for (key in simpleFields) {
        document.getElementById(key).value = GetByPath(order, simpleFields[key])
    }

    if (document.querySelector("#cargoNumPack").value == '') {
        document.querySelector("#cargoNumPack").value = 1
    }
    if (document.querySelector("#cargoWeight").value == '') {
        document.querySelector("#cargoWeight").value = '????'
    }

    // цена = сумма - доставка
    var cost = Number(order['zippack']['obj']['Sum']) - Number(order['zippack']['obj']['ShippingCost'])
    document.getElementById('cargoValue').value = cost
    // номер заказа
    document.getElementById('number').value = order['gsheets']['account_number'] != '' ? order['gsheets']['account_number'].trim() : order['gsheets']['id'].trim();
    console.log(order['gsheets']['account_number'] != '' ? order['gsheets']['account_number'].trim() : order['gsheets']['id'].trim())
    // содержимое отправки
    document.getElementById('cargoCategory').value = 'пакеты'

    // данные по клиенту
    simpleFields = {
        'company': 'zippack.obj.Customer.Organization',
        'name': 'zippack.obj.Customer.FirstName', // фио получателя
        'phone1': 'zippack.obj.Customer.Phone', // телефон
        'email': 'zippack.obj.Customer.Email', // почта
    }
    for (key in simpleFields) {
        document.getElementById(key).value = GetByPath(order, simpleFields[key])
    }
    // товары
    gpackages = JSON.parse(ziplusheets['gsheets']['warehouse'])
    document.getElementById('itemsList').innerHTML = ''
    for (i = 0; i < GetByPath(order, 'zippack.obj.Items').length; i++) {
        item = GetByPath(order, 'zippack.obj.Items')[i];
        document.getElementById('itemsList').innerHTML += '<tr id="box' + i + '">' +
            '<td>' + (i + 1) + '</td>' +
            '<td><input size="15" type="text" id="items[' + i + '][article]"></td>' +
            '<td><input size="100" style.width="100%" type="text" id="items[' + i + '][name]"></td>' +
            '<td><input type="text" id="items[' + i + '][quantity]"></td>' +
            '<td><input type="text" id="items[' + i + '][price]"></td>' +
            '</tr> '
    }
    for (i = 0; i < GetByPath(order, 'zippack.obj.Items').length; i++) {
        item = GetByPath(order, 'zippack.obj.Items')[i];
        document.getElementById('items[' + i + '][article]').value = item['ArtNo']
        document.getElementById('items[' + i + '][name]').value = item['Name']
        document.getElementById('items[' + i + '][quantity]').value = item['Amount']
        document.getElementById('items[' + i + '][price]').value = item['Price']
    }
    // комментарии
    document.getElementById('gsheetCommments').innerHTML = order['gsheets']['comments']

    // адрес доставки
    if (order['zippack']['obj']['ShippingName'].includes('выдачи')) {
        console.log("to terminal")
        document.querySelector("#terminal_rb").checked = true
        var addr = GetByPath(order, 'zippack.obj.Customer.Region')
            + " " + GetByPath(order, 'zippack.obj.Customer.City')
            + " " + GetByPath(order, 'zippack.obj.Customer.CustomField1')
        document.querySelector("#delivery_point_address").value = addr
    } else {
        console.log('to door')
        document.querySelector("#door_rb").checked = true
        document.querySelector("#door_address").value = createAdress(order)
    }
}
// получаем первичные данные по заказу с сервера и заполняем поля формы
function getJSON() {
    // отпраляем запрос
    var xhr = new XMLHttpRequest();
    var linenum = document.getElementById("lineNum").value
    xhr.open('GET', 'http://localhost:8040/' + linenum + '.json', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();
    document.querySelector('.hover_bkgr_fricc').style.display = "inline-block"
    // после загрузки заполняем поля
    xhr.onloadend = () => {
        document.querySelector('.hover_bkgr_fricc').style.display = "none"
        console.log('status:', xhr.status)
        if (xhr.status === 500) {
            console.log('ошибка на сервере')
            alert('произошла ошибка на сервере')
            return
        }
        try {
            var obj = JSON.parse(xhr.responseText)
        } catch (err) {
            alert('произошла ошибка при разборе данных, прибывших с сервера')
            return
        }
        fillFields(obj)
    }
}
