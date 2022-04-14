var ziplusheets = {}
var lineNum = 0
var item_id = 1

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

function addItem(name, artNo, ammount, price) {
    var newitem = document.createElement("div")
    newitem.id = item_id++
    newitem.className = "item"
    newitem.draggable = "true"
    newitem.addEventListener("dragstart", (event) => { drag_item(event) })
    newitem.innerHTML = `
    <div style="display: inline; margin-left: 5px">
    название:
    <input type="text" style="width:25%" class="name" value=${name}>
    артикул:
    <input type="text" style="width:35%" class="artNo" value=${artNo}>
    кол-во:
    <input type="text" style="width:5%" class="ammount" value=${ammount}>
    </div> 
    `

    var d = document.createElement("div")
    
    var bubton = document.createElement("button")
    bubton.className = "btn22"
    bubton.style.margin = "10px"
    bubton.onclick = () => addItem(name, artNo, ammount)
    bubton.innerHTML = "клонировать"
    var bubton2 = document.createElement("button")
    bubton2.className = "btn22"
    bubton2.style.margin = "10px"
    bubton2.addEventListener('click', function(e) {
        e.currentTarget.parentNode.parentNode.remove();
        heights()
    }, false);
    bubton2.innerHTML = "удалить"

    d.appendChild(bubton)
    // d.appendChild(document.createElement("div"))
    d.appendChild(bubton2)
    newitem.appendChild(d)
    document.querySelector('#toSort').appendChild(newitem)

    heights()
}

function getJSON() {
    // отпраляем запрос
    var xhr = new XMLHttpRequest();
    lineNum = document.getElementById("lineNum").value
    xhr.open('GET', 'http://localhost:8041/' + lineNum + '.json', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();
    document.querySelector('.hover_bkgr_fricc').style.display = "inline-block"
    // после загрузки заполняем поля
    xhr.onloadend = () => {
        document.querySelector('.hover_bkgr_fricc').style.display = "none"
        console.log('status:', xhr.status)
        if (xhr.status === 500) {
            console.log('ошибка на сервере')
            alert('произошла ошибка на сервере')
            return
        }
        try {
            var obj = JSON.parse(xhr.responseText)
        } catch (err) {
            alert('произошла ошибка при разборе данных, прибывших с сервера')
            return
        }
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
    
    heights()
}

function resetPage() {
    document.querySelector("#toSort").innerHTML = ""
    document.querySelector("#packages").innerHTML = ""
}