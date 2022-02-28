function parseTerminals(points) {
    // document.getElementById('')
    myMap.setCenter([points[0]['lat'], points[0]['long']], 11)
    for (var i = 0; i < points.length; i++) {
        var lat = points[i]['lat'];
        var long = points[i]['long'];
        var myPlacemark = new ymaps.Placemark([lat, long], {
            balloonContent: points[i]['addr'],
            hintContent: points[i]['addr'],
            id: points[i]['code'],
            addr: points[i]['addr']
        }, {});
        myPlacemark.events.add('click', function (e) {
            var target = e.get('target');
            choosen = target.properties.get('id')
            document.getElementById('choosenTerminal').innerHTML = target.properties.get('addr')
        })
        
        myMap.geoObjects.add(myPlacemark);
    }
    
    // if (points.length == 1) {
        //     myMap.geoObjects.get(0).click;
        // }
    }
    
    var choosen = ''
    
    function getDPDTerminals() {
        document.querySelector("#terminalList").innerHTML = '';
        document.querySelector("#serverResp").innerHTML = '';
        document.querySelector("#findTerminalResp").innerHTML = '<h3>Ищем...</h3>';
        
        myMap.geoObjects.removeAll()
        
        var size = ziplusheets['gsheets']['size'].replace('\\', '/').replace(/[^\d.,/]/g, '').replace(',', '.').split('/')
        var intSize = [Number(size[0]), Number(size[1]), Number(size[2])].sort()
        var obj = {
            'region': document.querySelector("#terminalRegion").value,
            'city': document.querySelector("#terminalCity").value,
            'addr': document.querySelector("#cf1").value,
            'maxLength': intSize[2],
            'midWidth': intSize[1],
            'minHeight': intSize[0],
            'maxWeight': Math.ceil(Number(ziplusheets['gsheets']['weight'].replace(/[^\d.,]/, '').replace(',', '.')) / Number(ziplusheets['gsheets']['positions'])),
            'payType': ziplusheets['gsheets']['payment_method']
        }
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState != 4) {
                return
            }
            document.querySelector("#findTerminalResp").innerHTML = '';
            
            if (xhr.status === 500){
                console.log('ошибка на сервере')
                alert('произошла ошибка на сервере')
                return
            }
            try {
                var resp = xhr.responseText
                var terminals = JSON.parse(resp);
            } catch (err){
                alert('произошла ошибка при разборе данных, прибывших с сервера')
                return
            }
            
            console.log(terminals);
            searchControl.search(terminals['ymapSearch'])
            tlist = document.getElementById('terminalList')
            for (var i = 0; i < terminals['suggestions'].length; i++) {
                tlist.innerHTML += `<option value="${terminals['suggestions'][i]['code']}" >${terminals['suggestions'][i]['addr']}</option>`
            }
            if (terminals['suggestions'].length == 1){
                choosen = terminals['suggestions'][0]['code']
            document.querySelector("#choosenTerminal").innerHTML = terminals['suggestions'][0]['addr'] 
        }
        document.getElementById('serverResp').innerHTML += `${terminals['description']}`
        parseTerminals(terminals["suggestions"])
    }
    xhr.open('POST', 'http://localhost:8040/' + 'getDPDTerminals.func', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    body = JSON.stringify(obj)
    console.log(body)
    xhr.send(body);
}

function buttonAddressDelivery() {
    document.querySelector("#serviceVariant").value = 'ДД';
    document.getElementsByName("terminalDelivery")[0].style.display='none';
    document.getElementsByName("doorShipment")[0].style.display='block';
    return;
}

function buttonTerminalDelivery() {
    document.querySelector("#serviceVariant").value = 'ДТ';
    document.getElementsByName("terminalDelivery")[0].style.display='block';
    document.getElementsByName("doorShipment")[0].style.display='none';

    // заполняем поля адреса терминала
    document.querySelector("#terminalRegion").value = GetByPath(ziplusheets, 'zippack.obj.Customer.Region');
    document.querySelector("#terminalCity").value = GetByPath(ziplusheets, 'zippack.obj.Customer.City');
    document.querySelector("#cf1").value = GetByPath(ziplusheets, 'zippack.obj.Customer.CustomField1');

}
