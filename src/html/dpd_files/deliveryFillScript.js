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
    xhr.onloadend = () => {
        alert('got termianls')
        // var terminals = JSON.parse(xhr.responseText)
    }
    xhr.open('POST', 'http://localhost:8040/' + 'getDPDTerminals.func', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    body = JSON.stringify(obj)
    xhr.send(body);
    alert('sent')
}



function chooseDeliveryType(){
    console.log(document.querySelector("#serviceVariant").value, 'ДТ');
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
    document.querySelector("#terminalDeliveryContainer").style.display='block';

    // заполняем поля адреса терминала
    document.querySelector("#terminalRegion").value = GetByPath(ziplusheets, 'zippack.obj.Customer.Region');
    document.querySelector("#terminalCity").value = GetByPath(ziplusheets, 'zippack.obj.Customer.City');
    document.querySelector("#cf1").value = GetByPath(ziplusheets, 'zippack.obj.Customer.CustomField1');

}

