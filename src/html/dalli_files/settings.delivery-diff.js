$(document).ready(function(){

});

/**
 * Добавление строки с указанием условия
 **/
$("a.addNewBelow").click(function(){
	$("table.below").show();
	$("table.below > tbody").append(
		$("<tr/>").append(
			$("<td>").append(
				$("<input/>", {type: "text", name: "deliveryDiff[below_sum][]", placeholder: "1000",pattern: "^[.0-9]+$"})
			).add(
				$("<td>").append(
					$("<input/>", {type: "text", name: "deliveryDiff[price][]", placeholder: "100",pattern: "^[.0-9]+$"})
				)
			).add(
				$("<td>").append(
					$("<a/>", {class: "removeIT", href: "#", text: "удалить"})
				)
			)
		)
	);
	return false;
});

/**
 * Удаление строки с указанием условия
 **/
$("table.below > tbody").on("click", "a.removeIT",function(){
	$(this).parent().parent().remove();
	if($("table.below tbody").children().length == 0) $("table.below").hide();
	return false;
});