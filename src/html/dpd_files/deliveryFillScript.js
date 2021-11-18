function parseTerminals(points){
    // document.getElementById('')
    myMap.setCenter([points[0]['lat'],points[0]['long']], 11)

    for (var i = 0; i < points.length; i++){
        var lat = points[i]['lat'];
        var long = points[i]['long'];
        var myPlacemark = new ymaps.Placemark([lat, long], {
            balloonContent: points[i]['addr'],
            hintContent: 'пункт',
            id: points[i]['code'],
            addr: points[i]['addr']
        }, {});
        myPlacemark.events.add('click', function(e){
            var target = e.get('target');
            document.getElementById('choosenTerminal').innerHTML = target.properties.get('addr')
        })

        myMap.geoObjects.add(myPlacemark);
    }
}



function getDPDTerminals() {
    var size = ziplusheets['gsheets']['size'].split('/')
    var intSize = [Number(size[0]), Number(size[1]), Number(size[2])].sort()
    var obj = {
        'region':   document.querySelector("#terminalRegion").value,
        'city':  document.querySelector("#terminalCity").value,
        'addr': document.querySelector("#cf1").value,
        'maxLength': intSize[2],
        'midWidth': intSize[1],
        'minHeight': intSize[0],
        'maxWeight': Math.ceil(Number(ziplusheets['gsheets']['weight']) / Number(ziplusheets['gsheets']['positions'])),
        'payType': ziplusheets['gsheets']['payment_method']
    }
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState != 4) {
          return
        }
        var resp = xhr.responseText
        var terminals = JSON.parse(resp);
        console.log(terminals);
        tlist = document.querySelector("#terminalList")
        for(var i = 0; i < terminals['suggestions'].length; i++){
            tlist.innerHTML += `<option value="${terminals['suggestions'][i]['addr']}" >${terminals['suggestions'][i]['addr']}</option>`
        }
        document.getElementById('serverResp').innerHTML += `<b>${terminals['description']}</b>`
        parseTerminals(terminals["suggestions"])
    }
    xhr.open('POST', 'http://localhost:8040/' + 'getDPDTerminals.func', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    body = JSON.stringify(obj)
    xhr.send(body);
}

function chooseDeliveryType(){
    if (document.querySelector("#serviceVariant").value == "ДТ"){
        buttonTerminalDelivery();
    }
    return;
    alert('на доработке');
    buttonAddressDelivery();
}

function buttonAddressDelivery(){
    return;
}

function buttonTerminalDelivery(){
    // document.querySelector("#terminalDeliveryContainer").style.display='block';

    // заполняем поля адреса терминала
    document.querySelector("#terminalRegion").value = GetByPath(ziplusheets, 'zippack.obj.Customer.Region');
    document.querySelector("#terminalCity").value = GetByPath(ziplusheets, 'zippack.obj.Customer.City');
    document.querySelector("#cf1").value = GetByPath(ziplusheets, 'zippack.obj.Customer.CustomField1');

}
