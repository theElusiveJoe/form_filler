var ziplusheets = {}
var lineNum = 0

function addItemsbox(i) {
    var newbox = document.createElement("div")
    newbox.id = i
    newbox.className = "itemsbox"
    newbox.style.height = "100px"
    newbox.addEventListener("drop", (event) => { drop(event) })
    newbox.addEventListener("dragover", (event) => { allowDrop(event) })
    newbox.innerHTML = `
    вес (кг)
        <input type="text" class="weight">
        размеры(см)
        <input type="text" class="l1">
        <input type="text" class="l2">
        <input type="text" class="l3">    
    `
    document.querySelector('#packages').appendChild(newbox)
}

function addItem(name, artNo, ammount, price, id) {
    var newitem = document.createElement("div")
    newitem.id = id
    newitem.className = "item"
    newitem.draggable = "true"
    newitem.addEventListener("dragstart", (event) => { drag_item(event) })
    newitem.innerHTML = `
    <div class="name">${name}</div> 
    артикул: <b><div class="artNo">${artNo}</div></b>
    кол-во: <b> <div class="ammount">${ammount}</div></b>
    <div style="display:none" class="price">${price}</div>
    `
    document.querySelector('#toSort').appendChild(newitem)
}

function getJSON() {
    // отпраляем запрос
    var xhr = new XMLHttpRequest();
    lineNum = document.getElementById("lineNum").value
    xhr.open('GET', 'http://localhost:8041/' + lineNum + '.json', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();
    document.querySelector("#orderNum").innerHTML = "собираем данные...";
    // после загрузки заполняем поля
    xhr.onloadend = () => {
        obj = JSON.parse(xhr.responseText)
        ziplusheets = obj
        fillFields(obj)
    }

}

function fillFields(order) {
    resetPage()

    // document.querySelector("#toSort").innerHTML = ""
    // document.querySelector("#packages").innerHTML = ""
    // document.querySelector("#orderNum").innerHTML = "собираем данные..."

    console.log(order)
    if (!order['zippack']['result']) {
        document.querySelector("#orderNum").innerHTML = 'произошла ошибка при подгрузке данных';
        return;
    }

    document.querySelector("#orderNum").innerHTML = order["gsheets"]["id"]

    document.querySelector("#toSort").style.height = String(order['zippack']['obj']['Items'].length * 85) + "px"
    for (var i = 0; i < order['zippack']['obj']['Items'].length; i++) {
        item = order['zippack']['obj']['Items'][i]
        console.log(item)
        addItem(item["Name"], item["ArtNo"], item["Amount"], item["Price"], "item_" + String(i))
        addItemsbox("itemsbox_" + String(i))
    }

}

function resetPage() {
    document.querySelector("#toSort").innerHTML = ""
    document.querySelector("#packages").innerHTML = ""
}