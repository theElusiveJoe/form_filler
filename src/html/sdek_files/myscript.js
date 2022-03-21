var ziplusheets = {}
var gpackages
var numitems = 0

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
    numitems = 0


    var clearHTML = [
        'itemsList',
        'terminal_id',
        'gsheetCommments',
        'delivery_point_address',
        'zippackLink',
        'createOrderResp',
        'terminal_addr',
        'door_address',
        'serviceCodeList'
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
    var simpleFields = {
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

    // цены всякие
    var cost = Number(order['zippack']['obj']['Sum'])
    document.getElementById('cargoValue').value = order['gsheets']['paid'] == "оплачено" ? 0 : Number(order['zippack']['obj']['Sum'])
    console.log('paooaooaoa', order['gsheets']['paid'] == "оплачено", order['gsheets']['paid'])
    document.getElementById('shippingValue').value = Number(order['zippack']['obj']['ShippingCost']) 
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
    for (var key in simpleFields) {
        document.getElementById(key).value = GetByPath(order, simpleFields[key])
    }
    // товары
    gpackages = JSON.parse(ziplusheets['gsheets']['warehouse'])
    document.getElementById('itemsList').innerHTML = ''

    var gitems = []
    for (var i = 0; i < gpackages.length; i++) {
        for (var j = 0; j < gpackages[i]["items"].length; j++) {
            gpackages[i]["items"][j]['numpack'] = i
            gitems.push(gpackages[i]["items"][j])
        }
    }
    numitems = gitems.length
    for (var i = 0; i < numitems; i++) {
        var item = gitems[i];
        console.log(item)
        document.getElementById('itemsList').innerHTML += `<tr id="box${i}">` +
            `<td>${i}</td>` + 
            `<td><input size="15" type="text" id="items[${i}][article]" value="${item['artNo']}"></td>` +
            `<td><input size="100" style="width:100%" type="text" id="items[${i}][name]" value="Набор ${item['ammount']}шт: ${item['name']}"></td>` +
            `<td><input style="display:none" size="15" type="text" id="items[${i}][numpack]" value="${item['numpack']}"></td>` +
        `</tr>`
    }
    // for (i = 0; i < GetByPath(order, 'zippack.obj.Items').length; i++) {
    //     item = GetByPath(order, 'zippack.obj.Items')[i];
    //     document.getElementById('items[' + i + '][article]').value = item['ArtNo']
    //     document.getElementById('items[' + i + '][name]').value = item['Name']
    //     document.getElementById('items[' + i + '][quantity]').value = item['Amount']
    // }
    // комментарии
    document.getElementById('gsheetCommments').innerHTML = order['gsheets']['comments']

    // адрес доставки
    if (order['zippack']['obj']['ShippingName'].includes('выдачи') || order['zippack']['obj']['ShippingName'].includes('Самовывоз')) {
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
