// function createAdress(order){
//     var street = order['zippack']['obj']['Customer']['Street'] 
//     var house = order['zippack']['obj']['Customer']['House'] 
//     var aps = order['zippack']['obj']['Customer']['Apartment'] 
//     var struct = order['zippack']['obj']['Customer']['Structure'] 
//     var entr = order['zippack']['obj']['Customer']['Entrance'] 
//     var floor = order['zippack']['obj']['Customer']['Floor'];
//     var addr = (street.trim() == '' ? '' : ('улица: ' + street + ';'))
//     + (house == '' ? '' : ('дом: ' + house + ';'))
//     + (aps.trim() == '' ? '' : ('квартира: ' + aps + ';'))
//     + (struct.trim() == '' ? '' : ('строение: ' + struct + ';'))
//     + (entr.trim() == '' ? '' : ('подъезд: ' + entr + ';'))
//     + (floor.trim() == '' ? '' : ('этаж: ' + floor + ';')) + ''
//     if (order['zippack']['obj']['Customer']['CustomField1']  == ''){
//         return order['zippack']['obj']['Customer']['CustomField1'] + ' ' + addr;
//     }
//     return order['zippack']['obj']['Customer']['CustomField1'] + ' ' + addr;
// }

// function getTodayDate(){
//     var now = new Date();
//     var tomorrow = new Date();
//     tomorrow.setDate(now.getDate()+1);
//     date = tomorrow.getDate().toString();
//     mon = (tomorrow.getMonth()+1).toString();
//     if (date.length == 1){date = '0' + date;}
//     if (date.length == 1){mon = '0' + mon;}
//     return date + '.' + mon + '.' + tomorrow.getFullYear().toString();
// }
var ziplusheets = {}

function getTodayDate() {
    var now = new Date();
    var date = now.getDate().toString();
    var date = now.getDate().toString();
    var mon = (now.getMonth() + 1).toString();
    if (date.length == 1) { date = '0' + date; }
    if (date.length == 1) { mon = '0' + mon; }
    return (now.getFullYear().toString() + '-' + mon + '-'+ date);
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



function fillFields(order) {
    console.log(order)
    ziplusheets = order
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
        console.log(key)
    }
    
    console.log(getTodayDate());
    document.getElementById('datePickup').value = getTodayDate();
    document.getElementById('pickupTimePeriod').value = '9-13';


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

    // заполнение получателя


    // document.getElementById('receiver[address]').value = createAdress(order)

    // document.getElementById('weight').value = order['gsheets']['weight'].replace(',', '.').replace(/[^\d.]/g, '');
    // document.getElementById('quantity').value = order['gsheets']['positions']
    // document.getElementById('receiver[date]').value = getTodayDate();
    // var time = order['gsheets']['payment_time']
    // document.getElementById('instruction').value = order['gsheets']['comments'] + order['zippack']['obj']['CustomerComment'] + order['zippack']['obj']['AdminComment'];

    // товары
    document.getElementById('itemsList').innerHTML = ''
    for (i = 0; i < GetByPath(order, 'zippack.obj.Items').length; i++){
        item = GetByPath(order, 'zippack.obj.Items')[i];
        console.log(item)
        document.getElementById('itemsList').innerHTML += '<tr id="box'+i+'">' +
        '<td><input size="1" type="text" id="items['+i+'][no]"></td>' + 
        '<td><input size="15" type="text" id="items['+i+'][article]"></td>' + 
        '<td><input size="100" style.width="100%" type="text" id="items['+i+'][name]"></td>' + 
        '<td><input type="text" id="items['+i+'][quantity]"></td>' +
        '<td><input type="text" id="items['+i+'][price]"></td>' +
        '</tr> '
        document.getElementById('items['+i+'][no]').value = i+1
        document.getElementById('items['+i+'][article]').value = item['ArtNo']
        document.getElementById('items['+i+'][name]').value = item['Name']
        document.getElementById('items['+i+'][quantity]').value = item['Amount']
        document.getElementById('items['+i+'][price]').value = item['Price']
    }

    // for (var i = 0; i <  document.getElementsByClassId("btnBoxesRemove").length; i++){
    //     document.getElementsByClassId("btnBoxesRemove")[i].click();
    // }
    // for (var i = 0; i < order['zippack']['obj']['Items'].length; i++){
    //     document.getElementById('additembtm').click()
    // }
    // var sum = 0
    // var disc = (100 - order['zippack']['obj']['OrderDiscount'])/100;
    // for (var j = 0; j <  document.getElementById('itemsList').children.length; j++){
    //     var i = document.getElementById('itemsList').children[j].getAttributeNode('id').value.substr(4);
    //     var k = Number(i)
    //     document.getElementById('itemsList')
    //     document.getElementById('items['+i+'][type]')[0].value = "1";
    //     document.getElementById('items['+i+'][article]')[0].value = order['zippack']['obj']['Items'][j]['ArtNo']
    //     document.getElementById('items['+i+'][Id]')[0].value = order['zippack']['obj']['Items'][j]['Id']
    //     var amm = order['zippack']['obj']['Items'][j]['Amount'];
    //     var price = Number(order['zippack']['obj']['Items'][j]['Price'])
    //     document.getElementById('items['+i+'][quantity]')[0].value = amm;
    //     var one_price = Math.trunc(price*disc*100)/100;
    //     sum += one_price*amm;
    //     document.getElementById('items['+i+'][retprice]')[0].value = one_price;
    //     document.getElementById('items['+i+'][mass]')[0].value = 1;
    // }

    // document.getElementById('priced')[0].value = order['zippack']['obj']['ShippingCost']
    // document.getElementById('declaredPrice')[0].value = sum + order['zippack']['obj']['ShippingCost']; //order['zippack']['obj']['Sum']                
    // document.getElementById('price')[0].value = sum + order['zippack']['obj']['ShippingCost']; //order['zippack']['obj']['Sum']  
    // var paytype = "NO";
    // if (order['gsheets']['payment_method'] == 'наложный'){
    //     paytype = "CARD";
    // } else if (order['gsheets']['payment_method'] == 'нал'){
    //     paytype = "CASH";
    // }
    // document.getElementById('paytype')[0].value = paytype;
}

// получаем первичные данные по заказу с сервера и заполняем поля формы
function getJSON() {
    // отпраляем запрос
    var xhr = new XMLHttpRequest();
    var linenum = document.getElementById("lineNum").value
    xhr.open('GET', 'http://localhost:8040/' + linenum + '.json', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();

    // после загрузки заполняем поля
    xhr.onloadend = () =>{
        obj = JSON.parse(xhr.responseText)
        fillFields(obj)
    }
}

