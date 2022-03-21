function compareNumeric(a, b) {
    if (a > b) return -1;
    if (a == b) return 0;
    if (a < b) return 1;
}

function cmparr(a, b) {
    for (var i = 0; i < a.length; i++) {
        if (a[i] < b[i]) {
            return -1
        }
        if (a[i] > b[i]) {
            return 1
        }
    }
    return -1
}

function collectData() {
    if (document.querySelector("#toSort").innerHTML != "") {
        alert("раскидайте все позиции по упаковкам")
        return
    }
    var toSend = {}
    var packages = []
    var weight = 0;
    var maxSizes = [0, 0, 0]
    var maxSizeStr = ""

    for (var i = 0; i < document.getElementById("packages").childNodes.length; i++) {
        package = document.getElementById("packages").childNodes[i]
        if (!Array.from(package.childNodes).some((x) => x.className == "item")) {
            continue
        }
        var pinfo = {}
        w = package.querySelector(".weight").value
        pinfo["weight"] = w
        weight += Number(w)
        var l1 = package.querySelector(".l1").value
        var l2 = package.querySelector(".l2").value
        var l3 = package.querySelector(".l3").value
        var sarr = [l1, l2, l3].sort(compareNumeric)
        var sstr = String(sarr[0]) + "/" + String(sarr[1]) + "/" + String(sarr[2])
        if (cmparr(sarr, maxSizes) == 1) {
            maxSizes = sarr
            maxSizeStr = sstr
        }
        pinfo["size"] = sstr
        pinfo["items"] = []
        console.log(package.childNodes.length)
        for (var j = 0; j < package.childNodes.length; j++) {
            var item = package.childNodes[j]
            console.log(item)
            if (item.className != "item") {
                continue
            }
            var item_obj = {
                "artNo": item.querySelector(".artNo").value,
                "name": item.getElementsByClassName("name")[0].value,
                "ammount": item.getElementsByClassName("ammount")[0].value,
            }
            pinfo["items"].push(item_obj)
        }
        packages.push(pinfo)
    }

    toSend["packages"] = packages
    toSend["weight"] = weight
    toSend["size"] = maxSizeStr
    toSend["id"] = document.getElementById("orderNum").innerHTML
    toSend["lineNum"] = lineNum

    console.log(toSend)
    sendData(toSend)
}

function sendData(data) {
    body = JSON.stringify(data)

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:8041/' + 'sendToGsheets.func', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(body);
    document.querySelector('.hover_bkgr_fricc').style.display = "inline-block"

    xhr.onloadend = () => {
        document.querySelector('.hover_bkgr_fricc').style.display = "none"
        console.log('status:', xhr.status)
        if (xhr.status === 500) {
            console.log('ошибка на сервере')
            alert('произошла ошибка на сервере')
            return
        }
        document.getElementById("orderNum").innerHTML = xhr.responseText
        resetPage()
    }
}