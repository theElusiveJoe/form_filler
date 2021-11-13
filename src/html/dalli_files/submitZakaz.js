function Basket(eventsubmit){
    this.target = eventsubmit.target;
    this.alert = this.target.getElementsByClassName('newOrderError')[0];
    this.url = '/lol.json';
    this.method = null;
    this.errcount = 0;
    
    this.createData = function(){
        return {'orders': [$(this.target).serializeJSON()]};
    };
    this.editData = function(){
        return $(this.target).serializeJSON();
    };
}

Basket.prototype.Columns = function(){
    return {
        'order.source': '',
        'order.order': '[name="order"]',
        'order.receiver': '',
        'order.service': '[name="service"]',
        'order.paytype': '[name="paytype"]',
        'order.declaredPrice': '[name="declaredPrice"]',
        'order.priced': '[name="priced"]',
        'order.price': '[name="price"]',
        'order.weight': '[name="weight"]',
        'order.quantity': '[name="quantity"]',
        'order.message': '[name="instruction"]',
        'order.return': '[name="return"]',
        'order.items': '.boxesContainer',
        'receiver.pvzcode': '[name="receiver[pvzcode]"]',
        'receiver.address': '[name="receiver[address]"]',
        'receiver.date': '[name="receiver[date]"]',
        'receiver.timeMax': '[name="receiver[timeMax]"]',
        'receiver.timeMin': '[name="receiver[timeMin]"]',
        'receiver.town': '[name="receiver[town]"]',
        'receiver.person': '[name="receiver[person]"]',
        'receiver.phone': '[name="receiver[phone]"]',
        'item.quantity': '.boxesContainer',
        'item.name': '.boxesContainer',
        'item.retprice': '.boxesContainer',
        'item.mass': '.boxesContainer'
    };
};

Basket.prototype.Localize = function(message){
    // Справочник
    var book = {
        'order': 'номер заказа',
        'pvz or address': 'ПВЗ или адрес',
        'priced': 'cтоимость доставки',
        'double': 'числом с плавающей точкой (например 2345.00)',
        'declaredPrice': 'объявленная ценность',
        'items': 'Товарные позиции',
        'receiver.date': 'Дата доставки',
        'mass': 'вес',
        'float': 'числом с плавающей точкой (например 50.3)'
    };
    message = message.replace('$','');
    $.each(book, function(k,v){
        message = message.replace(k,v);
    });
    
    return message;
};

Basket.prototype.ErrorsReset = function(){
    $('.alert', this.alert).removeClass('alert-danger').removeClass('alert-success');
    $('.alert p', this.alert).html('');
    $('.has-error', this.target).each(function(){
        $(this).removeClass('has-error');
    });
    $('td.danger', this.target).removeClass('danger');
    $('td[validation-error]', this.target).removeAttr('validation-error');
    $('.text-danger, .item-error, .items-errors, .service-errors', this.target).remove();
    $('.alert-danger p', this.alert).html('');
    $(this.alert).hide();
};

/**
 * Удалить пустые вложения и сброс счётчиков
 * @param {node} container
 * @returns {undefined}
 */
Basket.prototype.RemoveEmptyItems = function(container){
    $('tr', container).each(function(){ // удаление вложений в которых не указано название
        if (!$(this).hasClass('.item-error')){
            var index = Number($(this).attr('id').replace('boxI',''));
            if ($.trim($('input[name="items['+index+'][name]"]', this).val()).length === 0){
                $(this).remove();
                $('#ErrBoxI'+index).remove();
            }
        }
    });
};

/**
 * Отрисовка ошибок вложений
 * @param {string} arg - название поля input атрибут name
 * @param {jquery} container - родительский объект 
 * @param {string} message - сообщение ошибки
 * @param {int} rowId - порядковый номер вложения
 * @returns {undefined} - ничего не возвращает
 */
Basket.prototype.ErrorItem = function(arg, container, message, rowId){
    if ($('.items-errors', container).length === 0){
        container.prepend($('<div/>',{'class': 'alert alert-danger items-errors', 'text': 'Обнаружены ошибки'}));
    }    
    var row = $('#boxI'+rowId, container), // строка вложения
        cell = $('input[name="items['+rowId+']['+arg+']"]', row).closest('td').addClass('danger'); // ячейка вложения в которой обнаружена ошибка
        
    // если нет строки для ошибок создать
    if ($('tr#ErrBoxI'+rowId, container).length === 0){
        $('<tr class="item-error" id="ErrBoxI'+rowId+'"><td colspan="'+$('#boxI'+rowId+' td').length+'" class="alert alert-danger"></td></tr>').insertAfter(row);
    }
    // если нет атрибута с ошибкой
    if (cell.attr('validation-error') === undefined){
        cell.attr('validation-error', message);// добавить атрибут с ошибкой
        $('#ErrBoxI'+rowId+' td').append('<p>'+message+'</p>');// добавить строку с текстом ошибки
    }
};

/**
 * Отрисовка ошибок
 * @param {string} arg
 * @param {string} message
 * @param {int} rowId
 * @returns {undefined}
 */
Basket.prototype.Error = function(arg, message, rowId){
    var selectors = this.Columns();
    if (selectors[arg] !== undefined){
        if ($(selectors[arg], this.target).length !== 0){
            var o = $(selectors[arg], this.target),
                formGroup = o.closest('.form-group'),
                $parent = o.parent('div');
                
            if (arg.search(/^item\./) !== -1 && (rowId !== null || rowId !== undefined)){ // вывод ошибок для вложений
                this.ErrorItem(arg.replace(/^item\./, ''), o, message, rowId);
            } else {
                if (arg === 'order.items'){
                    $parent = o;
                } else
                if ($parent.hasClass('input-group')){
                    $parent = $parent.parent('div');
                } else
                if (o.attr('type') === 'hidden' && !$('.service-errors', this.target).length){
                    return $('<div/>',{'class': 'alert alert-danger service-errors', 'text': message}).insertBefore(o);
                }
                
                if (arg === 'order.items' && !$('.items-errors', $parent).length){
                    return $parent.prepend($('<div/>',{'class': 'alert alert-danger items-errors', 'text': message}));
                }
                
                formGroup.addClass('has-error');
                if ($parent.is(':visible') && $('.text-danger', $parent).length === 0){
                    return $parent.append('<div class="text-danger" style="font-size: 1.4rem;">'+message+'</div>');
                }
            }
        }
    }
};

/**
 * Обработка и вывод ошибок
 * @param {array} errors
 * @returns {undefined}
 */
Basket.prototype.Errors = function(errors){
    if (this.errcount > 0){
        this.errcount = 0;
    }
    var $ths = this;
    var errorText = "";
    errors.map(function(o,i){
        if (o.args.length > 0){
            var rowId = null; // если вложение
            for (var i in o.args){
                if (typeof o.args[i].search === 'function' && o.args[i].search(/^rowId[0-9]+$/) !== -1){
                    rowId = Number(o.args[i].replace('rowId', ''));
                    break;
                }
                continue;
            }
            o.args.map(function(argnm, argi){
                if (typeof argnm.search === 'function' && argnm.search(/^\$/) !== -1 && o['full-message'] !== 'FATAL ERROR'){
                    $ths.Error(argnm.replace(/^\$/, ''), $ths.Localize(o['full-message']), rowId);
                }
            });
            errorText+=o['full-message']+"<br/>";
        }
        $ths.errcount++;
    });
    if ($ths.errcount > 0){
        $('.alert',this.alert).addClass('alert-danger');
        $('.alert p', this.alert).html('<i class="fa fa-warning"></i> Обнаружены ошибки устраните их и попробуйте снова<br/>'+errorText);
        $(this.alert).show();
    }
};

Basket.prototype.Success = function(data){
    var html = '<i class="fa fa-warning"></i> Ваша заявка '+data.order+' успешно '+(data.message !== undefined ? data.message : 'добавлена в корзину');
    $('.alert',this.alert).removeClass('alert-danger').addClass('alert-success');
    $('.alert p', this.alert).html(html);
    $(this.alert).show();
    if ($('.modalBasketSuccess').length){
        $('.modalBasketSuccess .modal-body').html(html);
        $('.modalBasketSuccess a[href="/edit"]').attr('href', '/edit?order='+data.order);
        $('.modalBasketSuccess').modal({
            'backdrop': 'static',
            'keyboard': false,
            'show': true
        });
    }
    return;
};

Basket.prototype.Create = function(){
    loader($(this.target), 'show');
    this.method = 'basketCreate';
    this.ErrorsReset();
    this.RemoveEmptyItems($('.BoxesTable tbody', this.target));
    boxesRecalculation();
    
    var $ths = this;
    api_method(this.method, {'data': this.createData()}, function(response){
        loader($($ths.target), 'hide', function(){
            if (response.success === true){
                $ths.Success(response.data[0] !== undefined ? response.data[0] : {});
            } else
            if (response.success === false && $.inArray(response.errors, [null, false]) === -1){
                $ths.ErrorsReset();
                $ths.Errors(response.errors);
                $('html, body').animate({scrollTop: $(".content").offset().top - 100}, 500);
            }
        });
    });
    
    return;
};

Basket.prototype.Edit = function(){
    loader($(this.target), 'show');
    this.method = 'basketEdit';
    this.ErrorsReset();
    this.RemoveEmptyItems($('.BoxesTable tbody', this.target));
    boxesRecalculation();
    
    var $ths = this;
    api_method(this.method, {'data': this.editData()}, function(response){
        loader($($ths.target), 'hide', function(){
            if (response.success === true){
                $ths.Success({
                    'order': $('[name=order]',$ths.target).val(),
                    'message': 'сохранена'
                });
                $('html, body').animate({scrollTop: $(".content").offset().top - 100}, 500);
            } else
            if (response.success === false && $.inArray(response.errors, [null, false]) === -1){
                $ths.ErrorsReset();
                $ths.Errors(response.errors);
                $('html, body').animate({scrollTop: $(".content").offset().top - 100}, 500);
            }
        });
    });
    
    return;
};
