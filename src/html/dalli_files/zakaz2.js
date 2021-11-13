
/**
 * Обработка нажатия на блок с типом доставки
 */
$(".betaNewOrderTypeDelivery").click(function () {
    /**
     * Берем тип доставки (инт)
     */
    var typedelivery = $(this).attr("typedelivery");

    /**
     * Перекрашиваем все рамки в серый
     */
    $(".betaNewOrderTypeDelivery").css({borderColor: "#ddd"});
    $(".betaNewOrderTypeDelivery").removeClass("selected");

    /**
     * Красим рамку нажатого в синий
     */
    $(this).css({borderColor: "#0054ab"});
    $(this).addClass("selected");

    /**
     * Записываем значение в инпут
     */
    $("input[name='service']").val(typedelivery);


    if(in_array(typedelivery, [9,10,13,15])){
        $(".btnDeliveryDiff").hide();
    }else{
        $(".btnDeliveryDiff").show();
    }

    /**
     * Разбираемся курьрека это или ПВЗ
     */
    if (in_array(typedelivery, deliveryTypesCat.PVZ)) {

        /**
         * Если это ПВЗ, то меняем поле для ввода адреса на кнопку выбора ПВЗ
         */
        $(".betaNewOrderInputAddress").parent().hide();
        $(".betaNewOrderChangePVZ").parent().show();

    } else {

        /**
         * Если это курьерка, то меняем кнопку выбора ПВЗ на инпут
         */
        $(".betaNewOrderInputAddress").parent().show();
        $(".betaNewOrderChangePVZ").parent().hide();
    }
});

/**
 * Обработка выбора значения из селекта ПВЗ/курьерка
 */
$(".betaNewOrderInputTypeDelivery").change(function () {
    var val = $(this).find("option:selected").val();

    /**
     * Если выборана пустота (Все)
     */
    if (val == "") {
        $(".betaNewOrderTypeDelivery").parent().show(); // показываем все блоки с типом доставки
        return;
    }
    /**
     * Скрываем все типы доставок
     */
    $(".betaNewOrderTypeDelivery").parent().hide();

    /**
     * Показываем все которые попадают под выборку PVZ|KUR
     * Массив deliveryTypesCat см. в utils.js
     */
    $.each(deliveryTypesCat[val], function (key, value) {
        $(".betaNewOrderTypeDelivery[typedelivery='" + value + "']").parent().show();
    });
});

/**
 * Кнопка удаления строки вложения.
 */
$('body').on("click","a.btnBoxesRemove", function () {
    var index = Number($(this).attr('href').replace('boxI', ''));
    $("#ErrBoxI" +index).remove();
    $("#boxI" +index).remove();
    boxesRecalculation();
    return false;
});

/**
 * Добавление строки.
 */
$('body').on("click", "input.btnBoxesAdd", function () {
    var num = $(this).attr("pos"),
            tr = $("<tr/>", {id: "boxI" + num}).
            append(
                $("<td/>").append("<input size='10' type='text' name='items["+num+"][article]'/>") // ячейка и инпут артикула
                .add("<td><input type='text' name='items["+num+"][name]'/></td>") // ячейка и инпут наименования тов.поз
                .add("<td><input size='10' type='text' name='items["+num+"][barcode]'/></td>") // ячейка и инпут штрих-кода
                .add("<td><input size='2' type='number' name='items["+num+"][VATrate]'/></td>") // ячейка и инпут НДС
                .add("<td><input type='text' placeholder='01...21...' name='items["+num+"][governmentCode]'/></td>") // ячейка и инпут штрих-кода
                .add("<td class='boxesCalcInput boxQty'><input type='number' name='items["+num+"][quantity]'/></td>")  // ячейка и инпут количества штук
                .add("<td><input size='2' type='text' name='items["+num+"][mass]' step='0.01' /></td>")  // ячейка и инпут массы одной шт
                .add("<td class='boxesCalcInput'><input type='text' name='items["+num+"][retprice]' class='retprice' /></td>")  // ячейка и инпут цены за штуку
                .add('<td><select name="items['+num+'][type]" class="itmType form-control"><option value="1">Товар</option><option value="7">Забор</option></select></td>')  // ячейка и инпут цены за штуку
                .add($("<td/>").append($("<a/>", {text: "Удалить", href: "boxI" + num, class: "btn btnBoxesRemove"})))  // ячейка и ссылка удаления строки.
            );
    $("table.BoxesTable").append(tr);
    $(this).attr("pos", ++num);
    return false;
});


/**
 * Подписываемся на изменение полей стоимости за штуку и количества штук в таблице товарных позиций.
 */
$('body').on("change", "td.boxesCalcInput > input, input[name='priced']", function () {
    /**
     * Перерасчет стоимости.
     */
    boxesRecalculation();
});

$('body').on("change", "select.itmType", function () {
    var indexItm = Number($(this).parent().parent().attr("id").replace('boxI', '')),
        inputs = ["retprice","VATrate","quantity","governmentCode"],
        lock = Number(this.value) == 7 ? true : false;
    // console.log(lock);
    // console.log(this.value);
    $.each(inputs,function(k,v){
        $("input[name='items["+indexItm+"]["+v+"]']").attr("readonly",lock);
        $("input[name='items["+indexItm+"]["+v+"]']").val("");
    });
    $("input[name='items["+indexItm+"][quantity]']").val("1");
    $("input[name='items["+indexItm+"][retprice]']").val("0");
});


/**
 * Перерасчет стоимости
 */
function boxesRecalculation() {
    /**
     * Вводим переменную "Итоговая стоимость"
     */
    var summs = 0;
    /**
     * Перебираем все инпуты количества штук
     */
    $('td.boxesCalcInput.boxQty > input').each(function (i, el) {
        /**
         * Вводим две переменные.
         * Количество
         * Цена за единицу
         */
        var quantity = $(el).val(),
            price = $(this).closest('tr').find("td.boxesCalcInput > input.retprice").val();
        
        /**
         * Если не указано количество,
         * тогда устанавливаем его значение = 1 в форме и в переменной
         */
        if (quantity === "") {
            $(this).val(1);
            quantity = 1;
        }

        /**
         * Если не указана цена за штуку,
         * тогда устанавливаем её значение = 1 в форме и в переменной
         */
        if (price === "") {
            price = 0;
            $(this).closest('tr').find("td.boxesCalcInput > input.retprice").val(0);
        }

        /**
         * Прибавляем к сумме (цена умноженная на количество)
         */
        summs += parseFloat(quantity * price);
    });

    /**
     * Вводим переменную "Стоимость доставки"
     */
    var priced = 0;

    /**
     * Если стоимость доставке не пустая,
     * тогда закидываем значение из переменной в форму
     */
    if ($("input[name='priced']").val() !== "") {
        priced = $("input[name='priced']").val();
    }

    /**
     * Прибавляем к итоговой стоимости стоимость доставки
     */
    summs += parseFloat(priced);

    /**
     * Записываем итоговую стоимость в инпут на форме
     */
    $("input[name='price']").val(summs.toFixed(2));
}

var pvzList;

$(document).ready(function () {
$(".betaNewOrderInputTypeDelivery").change();
    /**
     * Просто текущая дата
     * @type {Date}
     */
    var today = new Date();

    /**
     * Выбор даты "с" в форме поиска
     */
    $("input[name='receiver[date]']").datepicker({
        format: 'yyyy-mm-dd',
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10),
        autoclose: true,
        language: 'ru'
    });
    
    // Отправка в корзину
    $('form.formNewOrder').on('submit',function(e){
        new Basket(e).Create();
        return false;
    });
    // Отправка в корзину
    $('form.formEditOrder').on('submit',function(e){
        new Basket(e).Edit();
        return false;
    });
    
    $("button.btnChangePVZ").click(function () {
        var service = $("input[name='service']").val(),
            town = $("input[name='receiver[town]']").val(),
            divPoints = $(".points"),
            selectPoints = $("select.selectPoint");
            
        divPoints.empty();
        selectPoints.empty();
        selectPoints.append($("<option/>"));
        api_method('getPVZ', {'data': {'partner': service,'city': town}}, function(json){
            pvzList = json;
            if (pvzList.success === true){
                var currentPVZ = $("input[name='receiver[pvzcode]']").val();
                console.log("Код ПВЗ: " + currentPVZ);
                $.each(pvzList.data, function (k, v){
                    var params, sparams;
                    if (currentPVZ == v.pvz_code) {
                        params = {
                            class: "point",
                            dsCode: k,
                            style: "border: 1px solid #0054ab"
                        };
                        sparams = {
                            value: v.pvz_code,
                            text: v.address + " [код ПВЗ: "+v.pvz_code+"]",
                            dsCode: k,
                            selected: true
                        };
                        selectPoint(k);
                    } else {
                        params = {
                            class: "point",
                            dsCode: k
                        };

                        sparams = {
                            value: v.pvz_code,
                            dsCode: k,
                            text: v.address + " [код ПВЗ: "+v.pvz_code+"]"
                        };

                    }
                    divPoints.append($("<div/>", params).html("<p>" + v.name + "<br/>" + v.address + "</p>"))
                    selectPoints.append($("<option/>",sparams));
                });
                $(".modalChangePVZ").modal();

                selectPoints.select2({ width: '100%', placeholder: "Выберите ПВЗ", dropdownParent: $(".modalChangePVZ")});

            } else {
                return false;
            }            
        });
        return false;
    });



    function selectPoint(dsCode){

        $(".point").css({"border": "1px solid #ddd"});
        $(".point[dscode='"+dsCode+"']").css({"border": "1px solid #0054ab"});

        // $("select.selectPoint option").attr("selected", false);
        $("select.selectPoint>option[dscode='"+dsCode+"']").prop("selected",true);

        // console.log(pvzList);
        var tbl = "table.pointFullDescription ",
            pointArr = pvzList.data[dsCode];
        $("input[name='receiver[pvzcode]']").val(pointArr.pvz_code);
        $(".betaNewOrderChangePVZ p").html(pointArr.name + "<br/>");

        $(tbl + "td.pointName").text(pointArr.name);
        $(tbl + "td.pointCity").text(pointArr.city);
        $(tbl + "td.pointRegion").text(pointArr.region);
        $(tbl + "td.pointAdress").text(pointArr.address);
        $(tbl + "td.pointFullAddress").text(pointArr.full_address);
        $(tbl + "td.pointWeightLimit").text(pointArr.weight_limit);
        $(tbl + "td.pointPayment").html((pointArr.prepayment === "Y" ? "Да" : "<b>НЕТ</b>"));
        $(tbl + "td.pointWorkShedule").text(pointArr.schedule);
        $(tbl + "td.pointDescription").text(pointArr.desctiption);
        $(tbl + "td.pointAcquiring").html((pointArr.acquiring === "Y" ? "Да" : "<b>НЕТ</b>"));
        $(".pointFullDescriptionDiv").show();

    }


    $(document).delegate(".point", "click", function () {
        selectPoint($(this).attr("dsCode"));
    });

    $("select.selectPoint").on('change', function (e) {
        selectPoint($("select.selectPoint option:selected").attr("dsCode"));
    });


    /**
     * Ниже идёт диф.стоимость доставки
     **/
    $(".btnDeliveryDiff").on("click", function(){
        $(".modalDeliveryDiff").modal();
        return false;
    });
});

