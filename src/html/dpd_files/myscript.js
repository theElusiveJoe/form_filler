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

function getDPDTerminals(obj){
    var xhr = new XMLHttpRequest();
    xhr.onloadend = () => {
        alert('got termianls')
        // var terminals = JSON.parse(xhr.responseText)
    }
    xhr.open('POST','http://localhost:8040/'+'getDPDTerminals.func', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    body = JSON.stringify(obj)
    xhr.send(JSON.stringify(body));
}

function getJSON() {
    var xhr = new XMLHttpRequest();
   
    xhr.onloadend = () => {
        var order = JSON.parse(xhr.responseText)

        // получив первичные данные, веб страница запрашивает адрес пункта самовывоза
        // для этого на сервер отсылаются:
        //      регион, город, адрес (и обычныый и customField1)
        //      тип оплаты
        //      вес и размеры товара

        document.getElementById('orderNumberInternal').value = order['gsheets']['account_number'] != '' ? order['gsheets']['account_number'].trim() : order['gsheets']['id'].trim();
        if (order['zippack']['obj']['ShippingName'].includes('до пункта выдачи')){
            // alert('до пункта выдачи')
            // пока считаем, что если до пункта водачи, то адрес в CustomField1
            var size = order['gsheets']['size'].split('/')
            console.log(size)
            var intSize = [Number(size[0]), Number(size[1]), Number(size[2])].sort()
            var obj = {
                'region' : order['zippack']['obj']['Customer']['Region'],
                'city' : order['zippack']['obj']['Customer']['City'],
                'addr' : order['zippack']['obj']['Customer']['CustomField1'],
                'maxDim' : intSize[2],
                'midDim' : intSize[1],
                'minDim' : intSize[0],
                'maxWeight' : Math.ceil(Number(order['gsheets']['weight'])/Number(order['gsheets']['positions']))
            }
            getDPDTerminals(obj);
        }
        // пытаемся вывбрать пвз
        // document.getElementsById('receiver[person]')[0].value = order['zippack']['obj']['Customer']['FirstName'];
        // document.getElementsById('receiver[phone]')[0].value = order['zippack']['obj']['Customer']['Phone'];
        // document.getElementsById('receiver[email]')[0].value = order['zippack']['obj']['Customer']['Email'];
        // document.getElementsById('receiver[town]')[0].value = order['zippack']['obj']['Customer']['Region'];
        
        // document.getElementsById('receiver[address]')[0].value = createAdress(order)
        // document.getElementsById('receiver[pvzcode]')[0].value = order['zippack']['obj']['Customer']['Region']; // ?????
        // document.getElementsById('weight')[0].value = order['gsheets']['weight'].replace(',', '.').replace(/[^\d.]/g, '');
        // document.getElementsById('quantity')[0].value = order['gsheets']['positions']
        // document.getElementsById('receiver[date]')[0].value = getTodayDate();
        // var time =  order['gsheets']['payment_time']
        // document.getElementsById('receiver[timeMin]')[0].value = time.slice(0,2) + ':00'; 
        // document.getElementsById('receiver[timeMax]')[0].value = time.slice(-2) + ':00';
        // document.getElementsById('instruction')[0].value = order['gsheets']['comments'] + order['zippack']['obj']['CustomerComment'] + order['zippack']['obj']['AdminComment'];
        

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
        //     document.getElementsById('items['+i+'][type]')[0].value = "1";
        //     document.getElementsById('items['+i+'][article]')[0].value = order['zippack']['obj']['Items'][j]['ArtNo']
        //     document.getElementsById('items['+i+'][Id]')[0].value = order['zippack']['obj']['Items'][j]['Id']
        //     var amm = order['zippack']['obj']['Items'][j]['Amount'];
        //     var price = Number(order['zippack']['obj']['Items'][j]['Price'])
        //     document.getElementsById('items['+i+'][quantity]')[0].value = amm;
        //     var one_price = Math.trunc(price*disc*100)/100;
        //     sum += one_price*amm;
        //     document.getElementsById('items['+i+'][retprice]')[0].value = one_price;
        //     document.getElementsById('items['+i+'][mass]')[0].value = 1;
        // }
            
        // document.getElementsById('priced')[0].value = order['zippack']['obj']['ShippingCost']
        // document.getElementsById('declaredPrice')[0].value = sum + order['zippack']['obj']['ShippingCost']; //order['zippack']['obj']['Sum']                
        // document.getElementsById('price')[0].value = sum + order['zippack']['obj']['ShippingCost']; //order['zippack']['obj']['Sum']  
        // var paytype = "NO";
        // if (order['gsheets']['payment_method'] == 'наложный'){
        //     paytype = "CARD";
        // } else if (order['gsheets']['payment_method'] == 'нал'){
        //     paytype = "CASH";
        // }
        // document.getElementsById('paytype')[0].value = paytype;
    }
    
    var linenum = document.getElementById("lineNum").value
    xhr.open('GET', 'http://localhost:8040/'+linenum+'.json', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.send();
    
}

