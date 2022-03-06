function heights() {
    var boxes = document.querySelectorAll(".itemsbox")
    console.log(boxes)
    for (var i = 0; i < boxes.length; i++) {
        console.log(boxes[i])
        items = boxes[i].querySelectorAll(".item").length;
        boxes[i].style.height = String(82 * (items + 2)) + "px";
    }
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drag_item(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
    console.log('drag', ev.target.className)
}

function drop(ev) {
    console.log('drop')
    ev.preventDefault();
    if (ev.target.className != 'itemsbox') {
        return
    }
    var data = ev.dataTransfer.getData("text");
    console.log(data)
    ev.target.appendChild(document.getElementById(data))
    heights()
}