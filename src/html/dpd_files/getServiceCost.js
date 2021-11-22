function getServiceCost() {
    if (choosen == ''){
        document.getElementById('countServiceResp').innerHTML = `<h2>Вы не выбрали пункт ПВЗ</h2>`;
        return;
    }
    document.getElementById('countServiceResp').innerHTML = 'Считаем...';
    console.log(choosen)

    d = {
        'terminalId': choosen,
        'positions': ziplusheets['gsheets']['positions'].replace(',', '.'),
        'weight': ziplusheets['gsheets']['weight'].replace(',', '.').value.replace(/[^\d.]/g, ''),
        'size': ziplusheets['gsheets']['size'].replace(',', '.').replace(/\s/g, '').replace('\\', '/').split('/')
    }
    body = JSON.stringify(d)

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:8040/' + 'getServiceCost.func', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(body);

    xhr.onreadystatechange = function () {
        if (xhr.readyState != 4) {
            return
        }
        document.getElementById('countServiceResp').innerHTML = '';
        var resp = xhr.responseText
        resp = JSON.parse(resp);
        resp.sort(function (a, b) {
            if (Number(a['cost']) > Number(b['cost'])) {
                return 1;
            }
            return -1;
        })
        console.log(resp);
        var chooseDeliveryServiceList = document.querySelector("#serviceCode")
        for (var i = 0; i < resp.length; i++) {
            chooseDeliveryServiceList.innerHTML += `<option value="${resp[i]['serviceCode']}" >` +
                `${resp[i]['serviceName']} ${resp[i]['cost']} руб (${resp[i]['days']})</option>`
        }
    }
}