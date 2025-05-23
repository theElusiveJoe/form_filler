var ziplusheets = {}

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
    document.getElementById('createOrderResp').innerHTML = ''
    document.querySelector("#serverResp").innerHTML = ''
    document.getElementById('countServiceResp').innerHTML = ''
    document.querySelector("#terminalList").innerHTML = ''
    document.querySelector("#serviceCode").innerHTML = ''
    choosen = ''
    document.querySelector("#choosenTerminal").innerHTML = ''
    //    document.querySelector('.hover_bkgr_fricc').style.display = "none"
    document.getElementById('zippackLink').innerHTML = ''
}

function fillFields(order) {
    resetInnerHTML()
    console.log(order)
    if (!order['zippack']['result']) {
        document.querySelector("#lineNum").value = 'На Зиппаке произошла ошибка';
        return;
    }
    ziplusheets = order

    // ссылка на заказ
    const orderId = order['zippack']['obj']['Id']
    var orderLink = ""
    if (order['shop'] == 'zippack') {
        orderLink = "https://zippack.ru/adminv3/orders/edit/" + orderId
    } else {
        orderLink = "https://spbkonvert.com/adminv3/orders/edit/" + orderId
    }

    document.getElementById('zippackLink').innerHTML = (
        '<a target="_blank" href="' + orderLink + '">ссылка на заказ ' + orderId + '</a>'
    )
    // начинаем заполнять поля
    simpleFields = {
        'cargoNumPack': 'gsheets.positions', // количество посылок
        'cargoWeight': 'gsheets.weight', // вес всех посылок
        'receiverName': 'zippack.obj.Customer.FirstName', // фио получателя
        'receiverContactFio': 'zippack.obj.Customer.FirstName', // фио контактного лица 
        'receiverContactPhone': 'zippack.obj.Customer.Phone', // телефон
        'receiverEmail': 'zippack.obj.Customer.Email', // почта
        'receiverRegion': 'zippack.obj.Customer.Region', // регион
        'receiverCity': 'zippack.obj.Customer.City', // город
        // 'receiverStreet': 'zippack.obj.Customer.Street', // улица
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

    document.getElementById('datePickup').value = getTodayDate();
    document.getElementById('pickupTimePeriod').value = '9-13';

    document.getElementById('gsheetCommments').innerHTML = order['gsheets']['comments']

    // заполнение информации о заказе

    // вариант доставки
    var serviceVariant = 'ДД'
    if (order['zippack']['obj']['ShippingName'].includes('выдачи')) {
        serviceVariant = 'ДТ'
    }
    document.getElementById('serviceVariant').value = serviceVariant
    // цена = сумма - доставка
    var cost = Number(order['zippack']['obj']['Sum']) - Number(order['zippack']['obj']['ShippingCost'])
    document.getElementById('cargoValue').value = cost
    // номер заказа
    document.getElementById('orderNumberInternal').value = order['gsheets']['account_number'] != '' ? order['gsheets']['account_number'].trim() : order['gsheets']['id'].trim();
    console.log(order['gsheets']['account_number'] != '' ? order['gsheets']['account_number'].trim() : order['gsheets']['id'].trim())
    // содержимое отправки
    document.getElementById('cargoCategory').value = 'пакеты'

    // товары
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

    //  для поиска терминала
    if (document.getElementById('serviceVariant').value == 'ДТ') {
        buttonTerminalDelivery();
    } else {
        buttonAddressDelivery();
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
    document.getElementById('getJsonResp').innerHTML = 'Подождите'
    // после загрузки заполняем поля
    xhr.onloadend = () => {
        if (xhr.status === 500) {
            console.log('ошибка на сервере')
            alert('произошла ошибка на сервере')
            return
        }

        console.log(xhr.responseText)
        console.log(JSON.parse(xhr.responseText))

        try {
            obj = JSON.parse(xhr.responseText)
            fillFields(obj)
        } catch (err) {
            alert('произошла ошибка при разборе данных, прибывших с сервера')
            return
        }

    }

}

