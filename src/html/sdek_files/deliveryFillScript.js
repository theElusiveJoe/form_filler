var choosen_id  
// ПОТОМ УДАЛИТЬ _ ЭТО ДЛЯ ТЕСТОВ
var choosen_city_code = 504
var choosen_type = ''

function getMaxWeight(){
    var max = 0
    for (var i = 0; i < gpackages.length; i++) {
        var w = Number(gpackages[i]["weight"])
        if (w > max){
            max = w
        }
    }
    return parseInt(max)
}

function parseTerminals(points) {
    console.log(points)
    for (var i = 0; i < points.length; i++) {
        var lat = points[i]['latitude'];
        var long = points[i]['longitude'];
        var myPlacemark = new ymaps.Placemark([lat, long], {
            balloonContent: points[i]['addr'],
            hintContent: points[i]['addr'],
            id: points[i]['code'],
            addr: points[i]['addr'],
            city_code: points[i]['city_code'],
            type: points[i]['type']
        }, {});
        
        myPlacemark.events.add('click', function (e) {
            var target = e.get('target');

            target.options.set("preset", "islands#redDotIcon")
            choosen_id = target.properties.get('id')
            choosen_city_code = target.properties.get('city_code')
            console.log(target.properties)
            choosen_type = target.properties.get('type')
            document.querySelector("#terminal_id").innerHTML = choosen_id
            document.getElementById('terminal_addr').innerHTML = target.properties.get('addr')
        })

        myMap.geoObjects.add(myPlacemark);
    }

    if (points.length == 1) {
        myMap.geoObjects.get(0).click;
    }
}

function getTerminals() {
    // document.querySelector("#terminalList").innerHTML = '';
    // document.querySelector("#serverResp").innerHTML = '';
    // document.querySelector("#findTerminalResp").innerHTML = '<h3>Ищем...</h3>';

    myMap.geoObjects.removeAll()

    gabs = ziplusheets["gsheets"]['size'].split('/')

    var obj = {
        "all_info": document.querySelector("#delivery_point_address").value,
        "weight" : getMaxWeight(),
        "length" : gabs[0],
        "height" : gabs[1],
        "width" : gabs[2],
    }
    var xhr = new XMLHttpRequest();
    xhr.onloadend = () => {
       document.querySelector('.hover_bkgr_fricc').style.display = "none"
        console.log('status:', xhr.status)
        if (xhr.status === 500) {
            console.log('ошибка на сервере')
            alert('произошла ошибка на сервере')
            return
        }
        try {
            var terminals = JSON.parse(xhr.responseText)
        } catch (err) {
            alert('произошла ошибка при разборе данных, прибывших с сервера')
            return
        }
        console.log(terminals);
        searchControl.search(terminals['ymapSearch']);
        parseTerminals(terminals["suggestions"]) 
    }
    xhr.open('POST', 'http://localhost:8040/' + 'getSDEKTerminals.func', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    body = JSON.stringify(obj)
    console.log(body) 
    xhr.send(body);
    document.querySelector('.hover_bkgr_fricc').style.display = "inline-block"
}

function count_delivery(){
    var obj = {
        "from_location": {
            "code": "40" 
        },
        "to_location": {
            "code": choosen_city_code
        },
        "packages" : []
    }

    for (var i = 0; i < gpackages.length; i++){
        var gabs = gpackages[i]['size'].split('/')
        obj["packages"].push({
            "weight": parseInt(Number(gpackages[i]["weight"])*1000),
            "length": gabs[0],
            "width": gabs[1],
            "height": gabs[2],
        })
    }

    var xhr = new XMLHttpRequest();
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

        if (typeof resp['errors'] != "undefined"){
            document.querySelector("#choosenTerminal").innerHTML = resp['errors']['message']
            return 
        } 

        resp["tariff_codes"].sort(function (a, b) {
            if (Number(a['delivery_sum']) > Number(b['delivery_sum'])) {
                return 1;
            }
            return -1;
        })
        console.log(resp);
        
        var tariffs
        console.log('choosen type: ', choosen_type)
        if (document.querySelector('input[name="delivery_type"]:checked').value == "door"){
            tariffs = resp["tariff_codes"].filter(x => x['delivery_mode'] == 3)
        } else { 
            if (choosen_type == "PVZ"){
                tariffs = resp["tariff_codes"].filter(x => x['delivery_mode'] == 4)
            } else if (choosen_type == "POSTAMAT"){ 
                tariffs = resp["tariff_codes"].filter(x => x['delivery_mode'] == 7)
            }
        }
        console.log(tariffs)
        var chooseDeliveryServiceList = document.querySelector("#serviceCodeList")
        chooseDeliveryServiceList.innerHTML = ''
        for (var i = 0; i < tariffs.length; i++) {
            chooseDeliveryServiceList.innerHTML += `<option value="${tariffs[i]["tariff_code"]}" >` +
                `${tariffs[i]['tariff_name']} ${tariffs[i]['delivery_sum']} руб (${tariffs[i]['period_min']} дня)</option>`
        }
    }

    xhr.open('POST', 'http://localhost:8040/' + 'countSDEKDelivery.func', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    var body = JSON.stringify(obj)
    console.log(obj) 
    xhr.send(body);
    document.querySelector('.hover_bkgr_fricc').style.display = "inline-block"
}

function justParseAddress(){

    myMap.geoObjects.removeAll()

    var obj = {
        "all_info": document.querySelector("#door_address").value,
    }
    var xhr = new XMLHttpRequest();
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
        searchControl.search(resp['address_full']);
        document.querySelector("#terminal_addr").innerHTML = resp['address_full']
        choosen_city_code = resp["city_code"]       
    }
    xhr.open('POST', 'http://localhost:8040/' + 'parseSDEKAddress.func', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    var body = JSON.stringify(obj)
    console.log(body) 
    xhr.send(body);
    document.querySelector('.hover_bkgr_fricc').style.display = "inline-block"
}