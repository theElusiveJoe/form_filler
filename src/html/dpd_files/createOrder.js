function createOrder() {
    if (choosen == ''){
        document.getElementById('createOrderResp').innerHTML = `<h2>Вы не выбрали пункт ПВЗ</h2>`;
        return;
    }
    document.getElementById('createOrderResp').innerHTML = `<h2>Подождите...</h2>`
    var data = {}

    data['header'] = {}
    data['header']['datePickup'] = document.querySelector("#datePickup").value
    data['header']['pickupTimePeriod'] = document.querySelector("#pickupTimePeriod").value

    data['order'] = {}
    data['order']['orderNumberInternal'] = document.querySelector("#orderNumberInternal").value
    data['order']['serviceCode'] = document.querySelector("#serviceCode").value
    data['order']['serviceVariant'] = document.querySelector("#serviceVariant").value
    data['order']['cargoNumPack'] = document.querySelector("#cargoNumPack").value
    data['order']['cargoWeight'] = document.querySelector("#cargoWeight").value.replace(/[^\d.,]/g, '').replace(',', '.')
    data['order']['cargoValue'] = document.querySelector("#cargoValue").value
    data['order']['cargoCategory'] = document.querySelector("#cargoCategory").value

    data['order']['receiverAddress'] = {}
    data['order']['receiverAddress']['name'] = ziplusheets['zippack']['obj']['Customer']['FirstName']
    data['order']['receiverAddress']['terminalCode'] = choosen
    data['order']['receiverAddress']['countryName'] = 'Россия'
    data['order']['receiverAddress']['contactFio'] = ziplusheets['zippack']['obj']['Customer']['FirstName']
    data['order']['receiverAddress']['contactPhone'] = ziplusheets['zippack']['obj']['Customer']['Phone']

    data['order']['unitLoad'] = []
    if (ziplusheets['gsheets']['paid'] != 'оплачено'){
        for (var i = 0; i < ziplusheets['zippack']['obj']['Items'].length; i++) {
            var unit = {}
            unit['article'] = ziplusheets['zippack']['obj']['Items'][i]['ArtNo']
            unit['descript'] = ziplusheets['zippack']['obj']['Items'][i]['Name']
            unit['npp_amount'] = ziplusheets['zippack']['obj']['Items'][i]['Price']
            unit['count'] = ziplusheets['zippack']['obj']['Items'][i]['Amount']
            data['order']['unitLoad'].push(unit)
        }
    }


    console.log('заказ: ')
    console.log(data)

    body = JSON.stringify(data)

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:8040/' + 'createOrder.func', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(body);

    xhr.onreadystatechange = function () {
        if (xhr.readyState != 4) {
            return
        }
        var resp = xhr.responseText
        resp = JSON.parse(resp);
        console.log(resp);
        document.getElementById('createOrderResp').innerHTML = `<h2>${resp['errorMessage']}</h2>`
    }
}