function put_by_id(destObj, tagname, id) {
    var val = document.querySelector(`#${id}`).value
    if (val == null) {
        return
    }
    destObj[tagname] = val
}


function createOrder() {
    // document.getElementById('createOrderResp').innerHTML = `<h2>Подождите...</h2>`
    var data = {}

    // номер заказа
    put_by_id(data, 'number', 'number')

    // код тарифа
    data['tariff_code'] = document.querySelector("#serviceCodeList").value

    // номер терминала
    // rb = document.getElementsByName('delivery_type')
    // console.log('rb:', rb)
    // var delivery_type = ''
    // for (var i = 0; i < rb.length; i++) {
    //     if (rb[i].checked) {
    //         delivery_type = rb[i].value;
    //     }
    // }
    // console.log('delivery type:', delivery_type)
    // console.log('aaaa', document.querySelector('#terminal_rb').checked)
    if (document.querySelector('#terminal_rb').checked) {
        data['delivery_point'] = document.querySelector("#terminal_id").innerHTML;
    }

    // получатель
    data['recipient'] = {}
    var simpleFields = [
        'company', 'name', 'email',
    ]
    for (var i = 0; i < simpleFields.length; i++) {
        var key = simpleFields[i]
        put_by_id(data['recipient'], key, key)
    }

    data['recipient']['phones'] = [{
        'number': document.querySelector("#phone1").value,
        'additional': document.querySelector("#phone2").value
    }]

    // адрес получателя
    if (document.querySelector('#door_rb').checked) {
        data['delivery_point'] = document.querySelector("#door_address").value;
    }

    // доп сбор
    data['delivery_recipient_cost'] = {
        "value": Number(ziplusheets['zippack']['obj']['ShippingCost'])
    }

    // упаковки
    data['packages'] = []

    for (var i = 0; i < gpackages.length; i++) {
        var package = {}

        package['number'] = i

        package['weight'] = parseInt(Number(gpackages[i]['weight'].replace(',', '.')) * 1000) // общий вес в граммах для каждой упаковки
        var amm_of_items_in_this_package = 0 // количество единиц тавара в упаковке, причем паки по 1000+ считаются за один
        for (var j = 0; j < gpackages[i]['items'].length; j++) {
            amm_of_items_in_this_package += Number(gpackages[i]['items'][j]['ammount']) < 1000 ? Number(gpackages[i]['items'][j]['ammount']) : 1
        }
        console.log('gpackages: ', gpackages)
        console.log('amount: ', amm_of_items_in_this_package)
        var avg_weight = package['weight'] / amm_of_items_in_this_package // средний вес единицы товара в упаковки [в граммах]
        console.log('avg weight ', avg_weight)

        var gabs = gpackages[i]['size'].split('/')
        package['length'] = gabs[0]
        package['width'] = gabs[1]
        package['height'] = gabs[2]

        var items = []
        for (var j = 0; j < gpackages[i]['items'].length; j++) {
            items[j] = {}
            if (Number(gpackages[i]['items'][j]['ammount']) >= 1000) {
                items[j]['name'] = 'Набор ' + gpackages[i]['items'][j]['ammount'] + "шт "
                    + gpackages[i]['items'][j]['name']
                items[j]['amount'] = 1
                items[j]['cost'] = Number(gpackages[i]['items'][j]['price']) * Number(gpackages[i]['items'][j]['ammount'])
                items[j]['weight'] = parseInt(avg_weight)
            } else {
                items[j]['name'] = gpackages[i]['items'][j]['name']
                items[j]['amount'] = Number(gpackages[i]['items'][j]['ammount'])
                items[j]['weight'] = parseInt(avg_weight)

            }
            items[j]['ware_key'] = gpackages[i]['items'][j]['artNo']
            items[j]['cost'] = Number(gpackages[i]['items'][j]['price'])
            if (ziplusheets['gsheets']['paid'] == 'оплачено') {
                var payval = 0
            } else {
                var disc = (100 - ziplusheets['zippack']['obj']['OrderDiscount']) / 100;
                var payval = Number(gpackages[i]['items'][j]['price']) * disc
            }
            items[j]['payment'] = { 'value': payval }
            items[j]['value'] = payval
        }
        package['items'] = items

        data['packages'].push(package)
    }

    console.log('заказ: ')
    console.log(data)

    var body = JSON.stringify(data)

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:8040/' + 'createSDEKOrder.func', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(body);
    document.querySelector('.hover_bkgr_fricc').style.display = "inline-block"

    xhr.onloadend = () => {
        document.querySelector('.hover_bkgr_fricc').style.display = "none"
        console.log('status:', xhr.status)
        if (xhr.status === 500) {
            console.log('ошибка на сервере')
            alert('произошла ошибка на сервере')
            return
        }
        try {
            var resp = JSON.parse(xhr.responseText)
        } catch (err) {
            alert('произошла ошибка при разборе данных, прибывших с сервера')
            return
        }
        console.log(resp);
        if (resp['state'] == 'INVALID') {
            document.querySelector('#createOrderResp').innerHTML = '<h3>Запрос обработался с ошибкой</h3>'
            document.querySelector('#createOrderResp').innerHTML += '<h5>Ошибки</h5>'
            if (resp.hasOwnProperty('errors')) {
                for (var i = 0; i < resp['errors'].length; i++) {
                    document.querySelector('#createOrderResp').innerHTML += `<h6>${resp['errors'][i]['message']}</h6>`
                }
            }
            if (resp.hasOwnProperty('warnings')) {
                document.querySelector('#createOrderResp').innerHTML = '<h4>Предупреждения</h4>'
                for (var i = 0; i < resp['warnings'].length; i++) {
                    document.querySelector('#createOrderResp').innerHTML += `<h6>${resp['warnings'][i]['message']}</h6>`
                }
            }
        } else if (resp['state'] == 'SUCCESSFUL') {
            document.querySelector('#createOrderResp').innerHTML = '<h3>Запрос обработан успешно</h3>'
        } else if (resp['state'] == 'WAITING') {
            document.querySelector('#createOrderResp').innerHTML = '<h3>Запрос ожидает обработки</h3>'
        } else if (resp['state'] == 'ACCEPTED') {
            document.querySelector('#createOrderResp').innerHTML = '<h3>Пройдена предварительная валидация и запрос принят</h3>'
        }
    }
}
