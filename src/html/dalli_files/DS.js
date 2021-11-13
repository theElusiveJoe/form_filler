  $(document).ready(function(){
// маскединпут 
//$("#phone").mask("+7 (999) 999-9999");


	var today = new Date();
	$('.datepicker-neworder').datepicker({
		format: 'dd.mm.yyyy',
		startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
		endDate:new Date(today.getFullYear(), today.getMonth(), today.getDate()+14),
		autoclose: true,
		language: 'ru'
	});	
	$('.datepicker-tracking-from').datepicker({
		format: 'dd.mm.yyyy',
		// startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()-30),
		endDate: today,
		autoclose: true,
		language: 'ru'
	});
	$('.datepicker-tracking-to').datepicker({
		format: 'dd.mm.yyyy',
		// startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()-30),
		endDate: today,
		autoclose: true,
		language: 'ru'
	});

	$('.datepicker-cron').datepicker({
		format: 'dd.mm.yyyy',
		startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()+1),
		endDate: new Date(today.getFullYear(), today.getMonth()+1, today.getDate()),
		multidate: true,
		autoclose: false,
		disableTouchKeyboard: true,
		maxViewMode:1,
		container:".dpicker",
		language: 'ru'
	});
	$('.datepicker-cron').datepicker('show');
	$('.datepicker-cron').datepicker()
	    .on("hide", function(e) {
	        $('.datepicker-cron').datepicker('show');
	    });

// калькулятор
	$("form#calc_form").submit(function(){
		$("div.response").html("<span style='color: green; font-size: 16px;'>Подождите...</span>");
		$.post("/calk/handler/core.php", $("form#calc_form").serialize(),function(data){
			$("div.response").html(data);
		});
		return false;
	});

// список пвз
	$("form#showpvz").submit(function(){
		$.post("/json/getPVZlist.php", $( "form" ).serialize(), function(data){
			$("div#showlist").html(data);
		});
		return false;
	});
	// галки отслеживани
$("#maincheck").click( function() {
	var isCheck = $(this).is(':checked'); 	
	$(isCheck ? '.mc:not(:checked)' : '.mc:checked').trigger('click');
});
/**
*  UPD 28.11.2016 aspect
**/
function autoCompleteAddress(){
	$("input[name='address']:not(:read-only)").suggestions({
		serviceUrl: "https://suggestions.dadata.ru/suggestions/api/4_1/rs",
		token: "c6cb47251923c2dbad8d854fd2dc193ff594cbc2",
		type: "ADDRESS",
		count: 5,
		onSelect: function(suggestion) {
			var sug = suggestion.data;
			var arr = [sug.street_with_type,sug.house_type,sug.house,sug.block_type,sug.block,sug.flat_type,sug.flat];
			var address = arr.join(" ");
			$(this).val($.trim(address));
			// console.log(suggestion);
			arr = [sug.city,sug.city_type_full];
			var word = arr.join(" ");
			if(word.trim()){
				$("input[name='word']").val(word);
			}
		}
	});
}


// autoCompleteAddress();

var isBoxberry = false;
var isPickUp = false;
function change_zakaz_form(){
	$("div.newOrderCalk input").val($("select[name='status'] option:selected").html());
	var currentTypeDelivery = $("select[name='status'] option:selected").val();

	if($("[name='address']").is("select") || ($("div.AddressInput").find("input, select").length == 0)){
		str = '<input name="address" class="form-control" placeholder="ул. Академика Янгеля д.1, к.2, кв.3" value="" type="text">';
		$(".AddressInput").html(str);
		isBoxberry = false;
		isPickUp = false;
		$(".pointInfo").hide();
		AHanterSuggestions();
	}



	switch(parseInt(currentTypeDelivery)){
		case 4:
			$("[name='address']").val("ул Складочная, дом 1, стр 18, подъезд 1");
		break;
		case 12:
			$("[name='address']").val("пр-кт Лиговский, дом 50, корп 12, офис 116");
		break;
		case 13:

			isBoxberry = true;
			isPickPoint = false;
			$.ajax({
			  type: "POST",
			  url: "/json/getPvz.php?type=13",
			  data: $("form#zakaz_form").serialize(),
			  success: function(data){
					$(".AddressInput").html(data);
					$(".select2").select2({
							language: "ru"
					});
				}
			});

		break;
		case 15:

			isPickPoint = true;
			isBoxberry = false;
			$.ajax({
			  type: "POST",
			  url: "/json/getPvz.php?type=15",
			  data: $("form#zakaz_form").serialize(),
			  success: function(data){
					$(".AddressInput").html(data);
					$(".select2").select2({
							language: "ru"
					});
				}
			});

		break;
		default:
		break;
	}










	// if(currentTypeDelivery == 13){
	// 	isBoxberry = true;
	// 	isPickUp = false;
	// 	$.ajax({
	// 	  type: "POST",
	// 	  url: "/json/getPvz.php?type=13",
	// 	  data: $("form#zakaz_form").serialize(),
	// 	  success: function(data){
	// 			$(".AddressInput").html(data);
	// 			$(".select2").select2({
	// 					language: "ru"
	// 			});
	// 		}
	// 	});
	// }else{
		// if(currentTypeDelivery == 14){
		// 	isPickUp = true;
		// 	isBoxberry = false;
		// 	$.ajax({
		// 	  type: "POST",
		// 	  url: "/json/getPvz.php?type=14",
		// 	  data: $("form#zakaz_form").serialize(),
		// 	  success: function(data){
		// 			$(".AddressInput").html(data);
		// 			$(".select2").select2({
		// 					language: "ru"
		// 			});
		// 		}
		// 	});
		// }else{
			/**
			 * 20.03.2017 aspect 
			 * ФИКС замены инпутов.
			 */
			// if($("[name='address']").is("select") || ($("div.AddressInput").find("input, select").length == 0)){
			// 	str = '<input name="address" class="form-control" placeholder="ул. Академика Янгеля д.1, к.2, кв.3" value="" type="text">';
			// 	$(".AddressInput").html(str);
			// 	isBoxberry = false;
			// 	isPickUp = false;
			// 	$(".pointInfo").hide();
			// 	AHanterSuggestions();
			// }else{
			// 	// console.log("СЕЙЧАС input");
			// }
		// }
		// if(isBoxberry == true){
		// 	// autoCompleteAddress();
		// }
	// }
}
/**
 * 6.03.2017 aspect
 * Удаление вложений в корзине
 */
$(document).delegate("a.btnBoxesRemove", "click", function() {
	$("#"+$(this).attr('href')).remove();
	boxesRecalculation();
	return false;
});

/**
 * Добавление строки.
 */
$("a.btnBoxesAdd").click(function() {
	var num = $(this).attr("href"),
	tr = "<tr id='boxI"+num+"'>";
	tr += "<td><input type='text' name='box["+num+"][article]'/></td>";
	tr += "<td><input type='text' name='box["+num+"][name]'/></td>";
	tr += "<td><input type='hidden' name='box["+num+"][id]' value='new'/><input type='text' name='box["+num+"][barcode]'/></td>";
	tr += "<td class='quantitytd'><input type='text' name='box["+num+"][quantity]' class='boxesQuantityInput' style='width: 50px;'/> ед.</td>";
	 // tr += "<td><input type='text' name='box["+num+"][VATrate]' style='width: 50px;'/> %</td>";
	tr += "<td><input type='text' name='box["+num+"][mass]' style='width: 60px;'/></td>";
	tr += "<td><input type='text' name='box["+num+"][retprice]' class='boxesSummInput' style='width: 60px;'/> руб/шт</td>";
	tr += "<td><a href='boxI"+num+"' class='btn btnBoxesRemove'><i class='fa fa-trash-o' aria-hidden='true' style='font-size: 25px;'></i></a></td>";
	tr += "</tr>";
	$("table.BoxesTable").append(tr);
	if(num == 0){
		$(".BoxesTable").show();
		$(".boxesContainer").show();
	}
	$(this).attr('href', num+1);
	return false;
});


/**
 * 20.04.17 aspect
 * Сумма вложений.
 */
$(document).delegate("input.boxesSummInput","change",function (){
	boxesRecalculation();
});

$(document).delegate("input.boxesQuantityInput","change",function (){
	boxesRecalculation();
});


function boxesRecalculation(){
	var summs = 0;
	$('input.boxesSummInput').each(function(i,el){
		var tr = $(el).parent().parent(),
		trId = $(tr).attr("id");
		var quantityEl = $("tr#"+trId + " > td.quantitytd > input.boxesQuantityInput");
		if(quantityEl.val() == ""){
			quantityEl.val("1");
		}
		var quantity = parseInt(quantityEl.val());
		quantityEl.val(quantity);
		summs += parseFloat($(el).val() * quantity);
	});
	$("td.boxesSummValue").html(summs + " руб.");
	$("input[name='boxesSummValue']").val(summs);
}

// });
// ДЛЯ БОКСБЕРРИ
$("select[name='address']").on('change', function(){
	// console.log("новое");
	change_zakaz_form();
	setTimeout(function(){
		getPointInfo();
	}, 500);
});
$("select[name='status']").change(function() {
	// console.log("старое");
	change_zakaz_form();
	setTimeout(function(){
		getPointInfo();
	}, 500);
	return true;
});
$("input#city").change(function() {
	setTimeout(function(){
		if($("input#city").val() == "Санкт-Петербург город (Санкт-Петербург город)"){
			$("select[name='status'] option[value='11']").attr("selected", "selected");
			// console.log("Пойман");
		}
   		change_zakaz_form();
	}, 500);
	setTimeout(function(){
		getPointInfo();
	}, 700);
});

});
function getPointInfo(){
	if($("[name='address']").is("select")){
	$.ajax({
			type: "POST",
			url: "/json/pointInfo.php",
		  	data: $("form#zakaz_form").serialize(),
		  	success: function(data){
		  		var point = $.parseJSON(data);
		  		// console.log(data);
		  		$(".pointInfo").show();
		  		var tbl = ".pointInfo table td";
		  		// console.log(point.Name == 0);
		  		// console.log(point.AddressReduce == null);
		  		$(tbl+".Name").html(point.Name);
		  		if(point.AddressReduce == null)
		  			$(tbl+".AddressReduce").html(point.Address);
		  		else	
		  			$(tbl+".AddressReduce").html(point.AddressReduce);
		  		$(tbl+".PrepaidOrdersOnly").html((point.PrepaidOrdersOnly == "0" ? "Да" : "Нет"));
		  		$(tbl+".CodePoint").html(point.CodePoint);
		  		$(tbl+".LoadLimit").html(point.LoadLimit + " кг.");
		  		$(tbl+".WorkShedule").html(point.WorkShedule);
		  		$(tbl+".TripDescription").html(point.TripDescription);
		  		$(tbl+".GPS").html(point.GPS);
		  		$(tbl+".VolumeLimit").html(point.VolumeLimit + " см.");
		  		// console.debug(point.Name);
		  	}
		});
	}
}
$(document).delegate("input[name='address']","change",function (){
// $("input[name='address']").on('change', function(){
	getZone();
});

function getZone(){
	var form = $("form#zakaz_form").serialize();
	$.post("/json/zone.php",form,function (response){
		var a = $.parseJSON(response), zone;
		switch (a.zone) {
			case 1:
				zone = "Доставка внутри МКАДа";
				break;
			case 2:
			case 3:
			case 4:
			case 5:
				zone = "Зона: " + (a.zone - 1);
				break;
			default:
				zone = "Доставка возможно только через партнеров";
				break;
		}
		$("div.newOrderCalk input").val(zone);
		// console.log(zone);
	});
}





// $(".betaNewOrderInputPhone").mask("+7 (999) 999 99-99",{placeholder:" "});



var typeDelivery = [];
typeDelivery["KURds"] = "KUR";
typeDelivery["PVZds"] = "PVZ";
typeDelivery["KURspb"] = "KUR";
typeDelivery["PVZsdek"] = "PVZ";
typeDelivery["KURsdek"] = "KUR";
typeDelivery["PVZboxberry"] = "PVZ";
typeDelivery["PVZpickup"] = "PVZ";


$(".betaNewOrderTypeDelivery").click(function(){
	$(".betaNewOrderTypeDelivery").css({borderColor : "#ddd"});
	$(this).css({borderColor : "#0054ab"})
	// console.log($(this).attr("typedelivery"));
});

$(".betaNewOrderInputTypeDelivery").change(function(){
	var val = $($(".betaNewOrderInputTypeDelivery option:selected")).val();
	// console.log(val);
	if(val == ""){
		$(".betaNewOrderTypeDelivery").parent().show();
		return;
	}
	$(".betaNewOrderTypeDelivery").parent().hide();
	for(var name in typeDelivery){
		if(typeDelivery[name] == val){
			$(".betaNewOrderTypeDelivery.betaNewOrderTypeDelivery"+name).parent().show();
			// console.log(name);
		}
	}
});

function AHanterSuggestions(){
	var AHoptions = { 
		serviceUrl:'https://ahunter.ru/site/suggest/address',
		params: { output: "json" },
		noCache: true,
		triggerSelectOnValidInput: false,
		paramName: "query",
		maxHeight: 500
	};
	$('input[name=address]').autocomplete( AHoptions );
}
AHanterSuggestions();


$('#myModal').on('hidden.bs.modal', function (e) {
	$.post("/json/hideModalOpros.php",function(data){
		console.log(data);
	});
});


$("form#form_zabor select[name='address']").on('change', function(){
	// console.log();
	var currentAddress = $(this).find("option:selected").val();
	$.ajax({
		type: "POST",
		url: "/json/getTimeZabor.php",
	  	data: "address="+currentAddress,
	  	success: function(data){
	  		var result = $.parseJSON(data);
	  		// console.log("time_min: "+result.time_min);
	  		// console.log("time_max: "+result.time_max);
	  		// console.log("address: "+result.address);
	  		var time_min = $("<option>",{value:result.time_min,text:result.time_min});
	  		var time_max = $("<option>",{value:result.time_max,text:result.time_max});
	  		$("select[name='time_min']").html(time_min);
	  		$("select[name='time_max']").html(time_max);

	  		// console.log(data);
	  		// $(".pointInfo").show();
	  		// var tbl = ".pointInfo table td";
	  		// console.log(point.Name == 0);
	  		// console.log(point.AddressReduce == null);
	  		// $(tbl+".Name").html(point.Name);
	  		// if(point.AddressReduce == null)
	  		// 	$(tbl+".AddressReduce").html(point.Address);
	  		// else	
	  		// 	$(tbl+".AddressReduce").html(point.AddressReduce);
	  		// $(tbl+".PrepaidOrdersOnly").html((point.PrepaidOrdersOnly == "0" ? "Да" : "Нет"));
	  		// $(tbl+".CodePoint").html(point.CodePoint);
	  		// $(tbl+".LoadLimit").html(point.LoadLimit + " кг.");
	  		// $(tbl+".WorkShedule").html(point.WorkShedule);
	  		// console.debug(point.Name);
	  	}
	});
});