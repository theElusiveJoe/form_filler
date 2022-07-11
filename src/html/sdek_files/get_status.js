function get_status(){
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:8040/getSDEKstatus.func', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();
    // document.querySelector('.hover_bkgr_fricc').style.display = "inline-block"
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
        fillFields(obj)
    }
}

function fillFields(obj){
    console.log(obj)
    var table = document.getElementById("table");
    for(var i = 0; i < obj.length; i++){
        var err_str = ''
        for (const error of obj[i]['errors']){
            err_str += error + '\n'
        }
        var warn_str = ''
        for (const error of obj[i]['warnings']){
            warn_str += error + '\n'
        }
        table.innerHTML +=`
        <tr><td>${obj[i]['id']}</td><td>${err_str + warn_str}</td><td>${obj[i]['state']}</td></tr> \ 
        `
    }
}