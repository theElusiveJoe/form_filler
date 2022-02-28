function sendJSON() {
    var order = {}
    order['method'] = 'basketCreate'
    order['data'] = {}
    order['data']['orders'] = []
    order['data']['orders'][0] = {}
    order['data']['orders'][0]['receiver'] = {}
    order['data']['orders'][0]['receiver']['person'] = document.getElementsByName('receiver[person]')[0].value
    order['data']['orders'][0]['receiver']['phone'] = document.getElementsByName('receiver[phone]')[0].value
    order['data']['orders'][0]['receiver']['email'] = document.getElementsByName('receiver[email]')[0].value
    order['data']['orders'][0]['receiver']['town'] = document.getElementsByName('receiver[town]')[0].value
    order['data']['orders'][0]['receiver']['address'] = document.getElementsByName('receiver[address]')[0].value
    order['data']['orders'][0]['receiver']['pvzcode'] = document.getElementsByName('receiver[pvzcode]')[0].value 
    order['data']['orders'][0]['receiver']['date'] = document.getElementsByName('receiver[date]')[0].value
    order['data']['orders'][0]['receiver']['timeMin'] = document.getElementsByName('receiver[timeMin]')[0].value 
    order['data']['orders'][0]['receiver']['timeMax'] = document.getElementsByName('receiver[timeMax]')[0].value
    
    order['data']['orders'][0]['service'] = document.getElementsByName('service')[0].value
    order['data']['orders'][0]['order'] = document.getElementsByName('order')[0].value
    order['data']['orders'][0]['weight'] = document.getElementsByName('weight')[0].value
    order['data']['orders'][0]['quantity'] = document.getElementsByName('quantity')[0].value
    order['data']['orders'][0]['instruction'] = document.getElementsByName('instruction')[0].value
    
    order['data']['orders'][0]['items'] = {}
    for (var i = 0; i < document.getElementById('itemsTable').rows.length-1; i++){
        var j = document.getElementById('itemsList').children[i].getAttributeNode('id').value.substr(4);
        if (document.getElementsByName('items['+j+'][article]')[0].value == ''){
            continue;
        }
        order['data']['orders'][0]['items'][i.toString()] = {}
        order['data']['orders'][0]['items'][i.toString()]['article'] = document.getElementsByName('items['+j+'][article]')[0].value
        order['data']['orders'][0]['items'][i.toString()]['name'] =  document.getElementsByName('items['+j+'][name]')[0].value
        order['data']['orders'][0]['items'][i.toString()]['barcode'] = document.getElementsByName('items['+j+'][barcode]')[0].value
        order['data']['orders'][0]['items'][i.toString()]['VATrate'] = document.getElementsByName('items['+j+'][VATrate]')[0].value
        order['data']['orders'][0]['items'][i.toString()]['governmentCode'] = document.getElementsByName('items['+j+'][governmentCode]')[0].value
        order['data']['orders'][0]['items'][i.toString()]['quantity'] = document.getElementsByName('items['+j+'][quantity]')[0].value
        order['data']['orders'][0]['items'][i.toString()]['mass'] = '0'//document.getElementsByName('items['+j+'][mass]')[0].value
        order['data']['orders'][0]['items'][i.toString()]['retprice'] = document.getElementsByName('items['+j+'][retprice]')[0].value
        order['data']['orders'][0]['items'][i.toString()]['type'] = document.getElementsByName('items['+ j + '][type]')[0].value
    }
    
    order['data']['orders'][0]['priced'] = document.getElementsByName('priced')[0].value
    order['data']['orders'][0]['declaredPrice'] = document.getElementsByName('declaredPrice')[0].value      
    order['data']['orders'][0]['price'] = document.getElementsByName('price')[0].value
    
    order['data']['orders'][0]['paytype'] = document.getElementsByName('paytype')[0].value
    
    order['data']['orders'][0]['deliveryDiff'] = {}
    order['data']['orders'][0]['deliveryDiff']['above_price'] = ""
    order['data']['orders'][0]['deliveryDiff']['return_price'] = ""
    order['data']['orders'][0]['deliveryDiff']['VATrate'] = ""
    
    
    console.log(order)
    var xhr = new XMLHttpRequest()

    xhr.onloadend = () => {
        document.getElementById('123').innerHTML = "";
        document.getElementById('321').innerHTML = "";

        if (xhr.status === 500){
            console.log('ошибка на сервере')
            alert('произошла ошибка на сервере')
            return
        }
        try {
            var dalli_resp = JSON.parse(xhr.responseText);
        } catch (err){
            alert('произошла ошибка при разборе данных, прибывших с сервера')
            return
        }

        if (dalli_resp[0] == null){
            document.getElementById('123').innerHTML = "Успешно добавлен!!"; 
            for (var i = 0; i <  document.getElementsByClassName("btnBoxesRemove").length; i++){
                document.getElementsByClassName("btnBoxesRemove")[i].click();
            }
            document.getElementById('321').innerHTML = "Успешно добавлен!!"; 
            
            return;
        }
        var s = "";
        for (key in dalli_resp){
            s += dalli_resp[key].toString() + '<br>';
        }
        document.getElementById('123').innerHTML = s;
    }

    xhr.open('POST', '/sendDalli.json', true);
    xhr.setRequestHeader('Content-type', 'application/json');
    xhr.send(JSON.stringify(order));
    document.getElementById('123').innerHTML = "<h1>отправляем заказ</h1>";
    document.getElementById('321').innerHTML = "<h1>отправляем заказ</h1>";
    
}