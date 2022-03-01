function createAdress(order){

    var district = order['zippack']['obj']['Customer']['District'];
    var city = order['zippack']['obj']['Customer']['City'] ;
    var street = order['zippack']['obj']['Customer']['Street'] ;
    var house = order['zippack']['obj']['Customer']['House'] ;
    var aps = order['zippack']['obj']['Customer']['Apartment'] ;
    var struct = order['zippack']['obj']['Customer']['Structure'] ;
    var entr = order['zippack']['obj']['Customer']['Entrance'];
    var floor = order['zippack']['obj']['Customer']['Floor'];
    var addr = ((district == null || district.trim()) == '' ? '' : ('район: ' + district + ' '))
    + ((city.trim() == '' || city.trim() == 'Москва') ? '' : ('город: ' + city + ' '))
    + (street.trim() == '' ? '' : ('улица: ' + street + ' '))
    + (house == '' ? '' : ('дом: ' + house + ' '))
    + (aps.trim() == '' ? '' : ('квартира: ' + aps + ' '))
    + (struct.trim() == '' ? '' : ('строение: ' + struct + ' '))
    + (entr.trim() == '' ? '' : ('подъезд: ' + entr + ' '))
    + (floor.trim() == '' ? '' : ('этаж: ' + floor + ' ')) + ''
    if (order['zippack']['obj']['Customer']['CustomField1']  == ''){
        return order['zippack']['obj']['Customer']['CustomField1'] + ' ' + addr;
    }
    return order['zippack']['obj']['Customer']['CustomField1'] + ' ' + addr;
}

function getTodayDate(){
    var now = new Date();
    var tomorrow = new Date();
    tomorrow.setDate(now.getDate()+1);
    date = tomorrow.getDate().toString();
    mon = (tomorrow.getMonth()+1).toString();
    if (date.length == 1){date = '0' + date;}
    if (date.length == 1){mon = '0' + mon;}
    return date + '.' + mon + '.' + tomorrow.getFullYear().toString();
}

function OblastToMoscow(town){
    if (town.trim == "Московская область"){
        return 'Москва'
    }
    return town
}

function getJSON() {
    var xhr = new XMLHttpRequest();
    
    xhr.onloadend = () => {
        document.getElementById('321').innerHTML = "";
        document.getElementById('123').innerHTML = "";
        
        if (xhr.status === 500){
            console.log('ошибка на сервере')
            alert('произошла ошибка на сервере')
            return
        }
        try {
            var order = JSON.parse(xhr.responseText)
        } catch (err){
            alert('произошла ошибка при разборе данных, прибывших с сервера')
            return
        }

        document.getElementsByName('receiver[person]')[0].value = order['zippack']['obj']['Customer']['FirstName'];
        document.getElementsByName('receiver[phone]')[0].value = order['zippack']['obj']['Customer']['Phone'];
        document.getElementsByName('receiver[email]')[0].value = order['zippack']['obj']['Customer']['Email'];
        document.getElementsByName('receiver[town]')[0].value = order['zippack']['obj']['Customer']['Region'];
        
        document.getElementsByName('receiver[address]')[0].value = createAdress(order)
        var reg = order['zippack']['obj']['Customer']['Region'];
        document.getElementsByName('receiver[pvzcode]')[0].value = reg == "Московская область" ? 'Москва' : reg; // ?????
        
        document.getElementsByName('order')[0].value = order['gsheets']['account_number'] != '' ? order['gsheets']['account_number'].trim() : order['gsheets']['id'].trim();
        document.getElementsByName('weight')[0].value = order['gsheets']['weight'].replace(',', '.').replace(/[^\d.]/g, '');
        document.getElementsByName('quantity')[0].value = order['gsheets']['positions']
        document.getElementsByName('receiver[date]')[0].value = getTodayDate();
        var time =  order['gsheets']['payment_time']
        document.getElementsByName('receiver[timeMin]')[0].value = time.slice(0,2) + ':00'; 
        document.getElementsByName('receiver[timeMax]')[0].value = time.slice(-2) + ':00';
        document.getElementsByName('instruction')[0].value = order['gsheets']['comments'] + order['zippack']['obj']['CustomerComment'] + order['zippack']['obj']['AdminComment'];
        

        for (var i = 0; i <  document.getElementsByClassName("btnBoxesRemove").length; i++){
            document.getElementsByClassName("btnBoxesRemove")[i].click();
        }
        for (var i = 0; i < order['zippack']['obj']['Items'].length; i++){
            document.getElementById('additembtm').click()
        }
        var sum = 0
        var disc = (100 - order['zippack']['obj']['OrderDiscount'])/100;
        for (var j = 0; j <  document.getElementById('itemsList').children.length; j++){
            var i = document.getElementById('itemsList').children[j].getAttributeNode('id').value.substr(4);
            var k = Number(i)
            document.getElementById('itemsList')
            document.getElementsByName('items['+i+'][type]')[0].value = "1";
            document.getElementsByName('items['+i+'][article]')[0].value = order['zippack']['obj']['Items'][j]['ArtNo']
            document.getElementsByName('items['+i+'][name]')[0].value = order['zippack']['obj']['Items'][j]['Name']
            var amm = order['zippack']['obj']['Items'][j]['Amount'];
            var price = Number(order['zippack']['obj']['Items'][j]['Price'])
            document.getElementsByName('items['+i+'][quantity]')[0].value = amm;
            var one_price = Math.trunc(price*disc*100)/100;
            sum += one_price*amm;
            document.getElementsByName('items['+i+'][retprice]')[0].value = one_price;
            document.getElementsByName('items['+i+'][mass]')[0].value = 0;
        }
        document.getElementsByName('priced')[0].value = order['zippack']['obj']['ShippingCost']
        document.getElementsByName('declaredPrice')[0].value = sum + order['zippack']['obj']['ShippingCost']; //order['zippack']['obj']['Sum']                
        document.getElementsByName('price')[0].value = sum + order['zippack']['obj']['ShippingCost']; //order['zippack']['obj']['Sum']  
        var paytype = "NO";
        if (order['gsheets']['payment_method'] == 'наложный'){
            paytype = "CARD";
        } else if (order['gsheets']['payment_method'] == 'нал'){
            paytype = "CASH";
        }
        document.getElementsByName('paytype')[0].value = paytype;
    }
    
    var linenum = document.getElementById("lineNum").value
    xhr.open('GET', '/'+linenum+'.json', true);
    
    document.getElementById('123').innerHTML = "скачиваем данные";
    document.getElementById('321').innerHTML = "скачиваем данные";

    xhr.send();
    
}

