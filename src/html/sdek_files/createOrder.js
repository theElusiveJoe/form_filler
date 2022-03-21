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
        "value": Number(document.querySelector('#shippingValue').value)
    }

    // упаковки
    data['packages'] = []
    
    // переберем все упаковки, чтобы заполнить массу и габариты
    for (var i = 0; i < gpackages.length; i++) {
        var package = {}

        package['number'] = i

        package['weight'] = parseInt(Number(gpackages[i]['weight'].replace(',', '.')) * 1000) // общий вес в граммах для каждой упаковки
        var gabs = gpackages[i]['size'].split('/')
        package['length'] = gabs[0]
        package['width'] = gabs[1]
        package['height'] = gabs[2]

        package['items'] = []
        data['packages'].push(package)
    }

    // а теперь раскидаем товары из таблички по упаковкам
    var disc = (100 - ziplusheets['zippack']['obj']['OrderDiscount']) / 100;
    var payval = Number(document.querySelector("#cargoValue").value) * disc / numitems
    var costval = Number(ziplusheets['zippack']['obj']['Sum']) / numitems
    console.log('платиииии', payval)
    for (var i = 0; i < numitems; i++){
        var numpack = parseInt(document.querySelector(`#items\\[${i}\\]\\[numpack\\]`).value)
        console.log('номер посылки: ', numpack)
        var item = {
            'name': document.querySelector(`#items\\[${i}\\]\\[name\\]`).value,
            'amount': 1,
            'ware_key': document.querySelector(`#items\\[${i}\\]\\[article\\]`).value,
            'weight': parseInt(gpackages[numpack]['weight']) / gpackages[numpack]['items'].length * 1000,
            'cost': costval,
            'payment' : {'value' : payval},
            'value' : payval
        }
        console.log('item: ', item)
        console.log('data: ', data)
        data['packages'][numpack]['items'].push(item)
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
