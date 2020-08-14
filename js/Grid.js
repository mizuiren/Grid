/**
 * by 秋叶(Author blog: https://www.mizuiren.com)
 * [Grid description]
 * @param {[type]} data       [渲染表格用到的数据]
 * @param {[type]} $container [渲染到得容器（jq对象）]
 */
function Grid(data, $container) {
    this.data = data;
    this.container = $container;
    this.columLength = this.getColumLength();
    this.bindEvent(data);
    this.renderGrid(data, $container);  
}
Grid.prototype = {
    minHeight: '30px',
    rowIndexAttrName: 'data-row-index',
    columnIndexAttrName: 'data-cell-index',
    updateTimer: null,
    updateData: function(rowsData) {
        this.data.rows = rowsData;
        var _this = this;
        if(this.updateTimer) {
            clearTimeout(this.updateTimer);
        }
        return new Promise(function(resolve, reject) {
            _this.updateTimer = setTimeout(function(){
                new Grid(_this.data, _this.container);
                resolve
            },30);
        });
    },
    deleteRow: function(rownum) {
        this.data.rows.splice(rownum, 1);
        new Grid(this.data, this.container);
    },
    appendRow: function(rowData) {
        this.data.rows.push(rowData);
        new Grid(this.data, this.container);
    },
    updateCell: function($cell, newValue) {
        newValue = this.htmlEncode(newValue);
    	var rowIndex = $cell.attr(this.rowIndexAttrName);
    	var columnIndex = $cell.attr(this.columnIndexAttrName);
    	var rowData = this.data.rows[rowIndex];
    	if(rowData) {
    		if(rowData[0].type === 'checkbox') {
                if(typeof rowData[columnIndex] === 'string') {
                    rowData[columnIndex] = newValue;
                } else {
                    rowData[columnIndex].value = newValue;
                }
    		} else {
    			if(typeof rowData[columnIndex-1] === 'string') {
                    rowData[columnIndex-1] = newValue;
                } else {
                    rowData[columnIndex-1].value = newValue;
                }
    		}
    	}
    	$cell.text(newValue);
        $cell.attr('title', newValue);
        if($cell.hasClass('i18n')) {
            $cell.attr('i18n', newValue);
        }
    },
    getColumnWidth: function() {
        //每列的宽度
        var cwidth = new Array(this.columLength).fill('1fr');

        this.data.header.forEach(function(item, index) {
            if(item.width !== undefined && item.width !== 'auto') {
                cwidth[index + 1] = item.width;
            }
        });
        cwidth[0] = this.data.checkbox ? '30px' : '0px';
        return cwidth.join(' ');
    },
    renderGrid: function() {
        this.container.empty().css('min-height', this.numberToPx(this.data.height, this.minHeight));
        if(!this.data.freezeHeader) {
            this.container.css({'overflow-y': 'auto'});
            this.container.css({'overflow-y':'overlay'});
        }
        this.gridStyles = [];
        var gridBoxStyles = ['width:100%;height: 100%'];
        if(!this.data.freezeHeader) {
            gridBoxStyles.push('overflow-y:overlay');
        } 
        this.gridBox = $('<div class="q-grid-box" style="' + gridBoxStyles.join(';') + '"></div>');
        this.container.append(this.gridBox);
        this.columLength = this.columLength + 1;//checkbox多一列
        
        this.gridStyles.push('grid-template-columns:' + this.getColumnWidth());
        //表格间隙
        this.data.rowGap = this.numberToPx(this.data.rowGap, '0px');
        this.gridStyles.push('grid-row-gap: ' + this.data.rowGap);

        this.data.columnGap = this.numberToPx(this.data.columnGap, '0px');
        this.gridStyles.push('grid-column-gap: ' + this.data.columnGap);

        //表格宽度
        this.data.width = this.numberToPx(this.data.width, '100%');
        this.gridStyles.push('width: ' + this.data.width);

        var header;
        if(this.data.showHeader) {
            var newHeader = JSON.parse(JSON.stringify(this.data.header));
            newHeader.unshift({value:'<input type="checkbox" class="check-all"/><span></span>', id: 'id'});

            header = $('<header class="q-grid header" style="' + this.gridStyles.join(';') + '"></header>');
            header.append(this.renderCell(newHeader, 0, true));
            this.gridBox.append(header);
        }
        this.gridStyles.push('padding-bottom: 1px');
        if(this.data.rows && this.data.rows.length) {
            var bodyGridStyles = JSON.parse(JSON.stringify(this.gridStyles));
            if(this.data.rowHeight) {
                bodyGridStyles.push('grid-template-rows: repeat(' + this.data.rows.length + ',' + this.numberToPx(this.data.rowHeight, '30px') + ')');
            }
            if(this.data.showHeader) {
                bodyGridStyles.push('margin-top:-1px');
            }
            var scrolBoxStyles = [];
            if(!this.data.width || this.data.width !== '100%') {
                scrolBoxStyles.push('width: ' + (parseInt(this.data.width)) + 'px');
            }
            if(this.data.freezeHeader) {
                if(this.data.height && this.data.height !== 'auto') {
                    scrolBoxStyles.push('max-height: ' + (parseInt(this.data.height) - (header ? header.outerHeight() : 0)) +'px;overflow-y: auto;overflow-y:overlay;');
                } else {
                    scrolBoxStyles.push('max-height: calc(100% - ' + (header ? header.outerHeight() : 0) +'px);overflow-y: auto;overflow-y:overlay;');
                }
            }
            var scrolBox = $('<div style="' + scrolBoxStyles.join(';') + '" class="q-grid-scroll"></div>');
            var contentBox = $('<div class="q-grid body" style="' + bodyGridStyles.join(';') + '"></div>');
            contentBox.css('width', '100%');
            contentBox.append(this.renderRow(this.data.rows, 'body'));
            scrolBox.append(contentBox);
            this.gridBox.append(scrolBox);

            //判断有没有滚动条，有滚动条火狐要特殊处理，保证表头和表体单元格对齐
            if(this.isFirefox()) {
                scrolBox.scrollTop(10);//控制滚动条下移10px
                if(scrolBox.scrollTop() > 0){
                    var fixWidth = 'calc(' + this.data.width + ' - 17px)';//火狐下滚动条宽度固定为17px
                    header.css('width', fixWidth);
                }
                scrolBox.scrollTop(0);//滚动条返回顶部
            }
            
            var _this = this, needDisabledHeader = true;
            this.data.rows.forEach(function(arr, index) {
                if(typeof arr[0] === 'object' && arr[0].type === 'checkbox') {
                    if(_this.data.checkbox && arr[0].checked) {
                        _this.checkOne(index);
                    }
                    if(_this.data.selectable && arr[0].selected) {
                        _this.selectRow(index, {}, _this.data.multiSelect);
                    }
                    if(!arr[0].disabled) {
                        needDisabledHeader = false;
                    }
                } else {
                    needDisabledHeader = false;
                }
            });
            if(needDisabledHeader) {
                $('.check-all', this.container).prop('disabled', true);
            }
        }
    },
    renderCell: function(columData, rowIndex, isHeader) {
        var cellsHtml = '';
        var _this = this;
        var id = '', hadRowId = typeof columData[0] === 'object' && columData[0].type === 'checkbox';
        columData.forEach(function(item, index) {
            var cellStyles = [];
            if(hadRowId && index === 0) {
                id = 'data-id="' + columData[0].id + '"';
            } else if(index !== 0) {
                id = _this.data.header[index - 1] && _this.data.header[index - 1].id ? 'data-id="' + _this.data.header[index - 1].id + '"' : 'data-id="' + index + '"';
            } else {
                id = 'data-id="0"';
            }
            if(!isHeader) {
				cellStyles.push('margin-bottom: -1px');
            }
            
            if(index !== 0) {
                cellStyles.push('margin-left: -1px');
            }
            var classes = ['cell'], needSort;
            if(typeof item === 'object') {
                if(item.size) {
                    cellStyles.push('grid-column-start: ' + (index + 1) + ';grid-column-end: ' + (index + 1 + item.size));
                }
                if(item.style) {
                    cellStyles.push(item.style);
                }
                if(item.align) {
                    cellStyles.push('justify-content: ' + (item.align === 'right' ? 'flex-end' : item.align));
                }
                if(item.class) {
                    classes.push(item.class);
                }
            }
            var resizeLine = '';
            if(isHeader && _this.data.header[index - 1] && index !== 0) {
                if(_this.data.header[index - 1].sort) {
                    classes.push('sort');
                    needSort = true;
                    if(_this.data.sortClassRecord && _this.data.sortClassRecord[index - 1]) {
                        classes.push(_this.data.sortClassRecord[index - 1]);
                    }
                }
                if(_this.data.header[index - 1].resizeable) {
                    resizeLine = '<span class="resizebar"></span>';
                }
            }
            if(_this.data.header[index - 1] && parseInt(_this.data.header[index - 1].width) === 0) {
                cellStyles.push('height:0');
            }
            if(index === 0) {
                classes.push('checkbox');
            }
            if(!_this.data.border) {
                _this.data.border = 'dotted';
            }
            var value = typeof item !== 'object' ? item : item.value;
            cellStyles.push('border: ' + (_this.data.border === 'none' ? '0' : 1) + 'px ' + _this.data.border + ' #ccc');
            cellsHtml += '<div ' + id + ' class="' + classes.join(' ') + '" data-cell-index="' + index + '" data-row-index="' + rowIndex + '" style="' + cellStyles.join(';') + '" title="' +(index === 0 ? '' : _this.htmlEncode(value)) + '">' + resizeLine + value + (needSort ? ' <span class="sort-icon"> </span>' : '') +'</div>';  
        });
        return cellsHtml;
    },
    htmlEncode:function (html){
        var temp = document.createElement ("div");
        (temp.textContent != undefined ) ? (temp.textContent = html) : (temp.innerText = html);
        var output = temp.innerHTML;
        temp = null;
        return output;
    },
    renderRow: function(rowData, isBody) {
        var rowsHtml = '';
        var _this = this;
        var cloneData = JSON.parse(JSON.stringify(rowData));
        cloneData.forEach(function(item, index) {
            if(isBody) {
                if(typeof item[0] === 'object' && item[0].type === 'checkbox') {
                    item[0].value = '<input type="checkbox" ' + (item[0].disabled ? 'disabled' : '') + '/><span></span>';
                } else {
                    item.unshift({value:'<input type="checkbox" ' + (item[0].disabled ? 'disabled' : '') + '/><span></span>', id: index, type: 'checkbox'});
                } 
            }
            if(getCellLength(item) < _this.columLength) {
                item = item.concat(new Array(_this.columLength - item.length).fill(''));
            }
            rowsHtml += _this.renderCell(item, index, !isBody);
        });
        function getCellLength(arr) {
            var count = 0;
            arr.forEach(function(item) {
                if(typeof item !== 'object') {
                    count++;
                } else if(item.size && item.size > 1) {
                    count += item.size;
                } else {
                    count++;
                }
            });
            return count;
        }
        return rowsHtml;
    },
    selectRow: function(rowNum, evt, multiSelect) {
        evt = evt || {};
        var _this = this, $parent = $('.body', _this.container);
        if(_this.data.onBeforeSelect) {
            let needSelect = _this.data.onBeforeSelect(_this.data.rows[parseInt(rowNum)], evt);
            if(needSelect === false) {
                return;
            }
        }
        if(!multiSelect) {
            _this.unSelectAll();
        }
        $('.cell[data-row-index="' + rowNum + '"]', $parent).addClass('selected');
        if(_this.data.onSelect) {
            _this.data.onSelect(_this.data.rows[parseInt(rowNum)], evt);
        }
        if(_this.data.onSelectAll) {
            if(!$('.cell:not(".seleted")', $parent).length) {
                _this.data.onSelectAll(_this.data.rows, evt);
            }
        }
    },
    toggleSelectById: function(rowId, selectStatu, multiSelect) {
        var $cell = $('.cell[data-id="' + rowId + '"]', this.container), _this = this;
        if($cell.length) {
            $cell.each(function() {
                var rowNum = $(this).attr(_this.rowIndexAttrName);
                if(_this.data.selectable) {
                    let selectFn = selectStatu ? _this.selectRow : _this.unSelectRow;
                    selectFn.call(_this, rowNum, {}, multiSelect === undefined ? _this.data.multiSelect : multiSelect);
                }
            });
        }
    },
    selectRowById: function(rowId, multiSelect) {
        this.toggleSelectById(rowId, true, multiSelect);
    },
    unSelectRowById: function(rowId, multiSelect) {
        this.toggleSelectById(rowId, false, multiSelect);
    },
    unSelectRow: function(rowNum) {
        $('.q-grid.body .cell.selected[data-row-index="' + rowNum + '"]', this.container).removeClass('selected');
    },
    selectAll: function() {
        var hadSelectRow = {}, rowNum;
        var _this = this;
        $('.body .cell', this.container).each(function() {
            rowNum = $(this).attr(_this.rowIndexAttrName);
            if(!hadSelectRow[rowNum]) {
                _this.selectRow(rowNum, {}, true);
                hadSelectRow[rowNum] = true;
            }
        });
    },
    unSelectAll: function(filterRows) {
        var hadUnSelectRow = {}, rowNum, _this = this;
        $('.body .cell.selected', this.container).each(function() {
            rowNum = $(this).attr(_this.rowIndexAttrName);
            if(filterRows && filterRows.length && filterRows.indexOf(+rowNum) > -1) {
                return;
            } else {
                if(!hadUnSelectRow[rowNum]) {
                    _this.unSelectRow(rowNum);
                    hadUnSelectRow[rowNum] = true;
                }
            }
        });
    },
    checkRowById: function(rowId) {
        var $cell = $('.cell[data-id="' + rowId + '"]', this.container), _this = this;
        if($cell.length) {
            $cell.each(function() {
                var rowNum = $(this).attr(_this.rowIndexAttrName);
                _this.checkOne(rowNum);
            });
        }
    },
    checkAll: function() {
        var rowNum, _this = this;
        $('.body .checkbox input', this.container).each(function() {
            rowNum = $(this).closest('.cell').attr(_this.rowIndexAttrName);
            _this.checkOne(rowNum);
        });
    },
    unCheckAll: function() {
        var rowNum, _this = this;
        $('.body .checkbox input', this.container).each(function() {
            rowNum = $(this).closest('.cell').attr(_this.rowIndexAttrName);
            _this.unCheckOne(rowNum);
        });
    },
    isAllChecked: function() {
        let isAllChecked = true, allcheckInput = $('.q-grid.body .checkbox input', this.container), length = allcheckInput.length;
        for(var i = 0; i < length; i++) {
            if(!allcheckInput.eq(i).prop('checked')) {
                isAllChecked = false;
                break;
            }
        }
        return isAllChecked;
    },
    checkOne: function(rowNum) {
        var $input = $('.q-grid.body .checkbox[data-row-index="' + rowNum + '"] input', this.container);
        if($input.prop('disabled')) {
            return;
        }
        $input.prop('checked', true);
        if(this.isAllChecked()) {
            $('.check-all', this.container).prop('checked', true);
        }
        
        if(this.data.onCheck) {   
            this.data.onCheck(this.data.rows[parseInt(rowNum)]);
        }
        if(this.data.selectWhenCheck && this.data.selectable) {
            this.selectRow(rowNum, {},  !!this.data.multiSelect);
        }
        if(this.data.editable) {
            this.endEdit();
        }
    },
    unCheckOne: function(rowNum) {
        $('.q-grid.body .checkbox[data-row-index="' + rowNum + '"] input', this.container).prop('checked', false);
        if(!this.isAllChecked()) {
            $('.check-all', this.container).prop('checked', false);
        }

        if(this.data.onUnCheck) {   
            this.data.onUnCheck(this.data.rows[parseInt(rowNum)]);
        }
        if(this.data.selectWhenCheck) {
            this.unSelectRow(rowNum);
        }
    },
    isRowSelected: function(rowNum) {
        return !!$('.body .cell.checkbox.selected[data-row-index="' + rowNum + '"]', this.container).length;
    },
    bindEvent: function() {
        var _this = this;
        _this.container.off('click').on('click', '.body .cell', function(evt) {
            var rowNum = +$(this).attr(_this.rowIndexAttrName);
            var $cell = $(evt.target).closest('.cell');
            if(evt.target.tagName === 'INPUT' || evt.target.tagName === 'SELECT' || $cell.hasClass('editing')) {
                return;
            }
            if($cell.hasClass('checkbox')) {               
                var $input = $(evt.target).closest('.cell').find('input');
                if(!$input.prop('disabled')) {
                    if($input.prop('checked') === true) {
                        _this.unCheckOne(rowNum);
                    } else {
                        _this.checkOne(rowNum);
                    }
                }
                return;
            }
            var columnNum = $(this).attr(_this.columnIndexAttrName);
            if(evt.target.tagName !== 'INPUT') {
                _this.endEdit();
            }
            if(_this.data.onClick) {
                var cellNum = typeof _this.data.rows[rowNum][0] === 'object' && _this.data.rows[rowNum][0].type === 'checkbox' ? columnNum : columnNum - 1;
                _this.data.onClick(_this.data.rows[rowNum], _this.data.rows[rowNum][cellNum] || '', evt);
            }
            
            if(_this.data.editable && !$(this).hasClass('editing') && _this.data.editWhenClick) {
                _this.editCell($(this));
            }
            
            if(_this.data.selectable) {
                if(!evt.shiftKey) {
                    _this.continuSelectStartRowNum = rowNum;
                }            
                
                if(!evt.ctrlKey && !evt.shiftKey) {
                    _this.unSelectAll([rowNum]);
                    if(!$cell.hasClass('selected')) {
                       _this.selectRow(rowNum, evt); 
                    }
                } else if(evt.ctrlKey) {
                    if(!$cell.hasClass('selected')) {
                        _this.selectRow(rowNum, evt, _this.data.multiSelect);
                    } else {
                        _this.unSelectRow(rowNum, evt);
                    }
                } else if(evt.shiftKey) {
                    if(!_this.getSelectedData().length) {
                        _this.continuSelectStartRowNum = rowNum;
                    }
                    if(_this.data.multiSelect) {
                        var needSelects = [], notNeedSelects = [], i;
                        if(_this.continuSelectStartRowNum > rowNum) {
                            for(i = rowNum; i <= _this.continuSelectStartRowNum; i++) {
                                if(_this.isRowSelected(i)) {
                                    notNeedSelects.push(i);
                                } else {
                                    needSelects.push(i);
                                }
                            }
                        } else {
                            for(i = _this.continuSelectStartRowNum; i <= rowNum; i++) {
                                if(_this.isRowSelected(i)) {
                                    notNeedSelects.push(i);
                                } else {
                                    needSelects.push(i);
                                }
                            }
                        }
                        _this.unSelectAll(notNeedSelects);
                        needSelects.forEach(function(item) {
                            _this.selectRow(item, evt, true);
                        });
                    }      
                }
            }
        }).off('mousedown.grid').on('mousedown.grid', 'header.q-grid .cell .resizebar', function(evt) {
            var $cell = $(this).parent(), cellLeft = $cell.offset().left;
            var cellIndex = $cell.attr(_this.columnIndexAttrName) - 1;
            var $header = $('.q-grid.header', _this.container);
            var $body = $('.q-grid.body', _this.container);
            var $resizeBar = $(this);
            var columnWidths = _this.getColumnWidth().split(' ');
            var currentX;
            $resizeBar.addClass('isDraging');
            $(document).on('mousemove.grid', function(e) {
                currentX = e.pageX;
                if(currentX > cellLeft + 10) {
                    columnWidths[cellIndex + 1] = (currentX - cellLeft) + 'px';
                    $header.css('grid-template-columns', columnWidths.join(' '));
                    $body.css('grid-template-columns', columnWidths.join(' '));
                }
            });
            
            $(document).on('mouseup.grid', function(e) {             
                $(document).off('mousemove.grid');
                $(document).off('mouseup.grid');
                $resizeBar.removeClass('isDraging');
            });
        }).on('mousedown.grid', 'header.q-grid .cell.sort', function(evt) {
            _this.endEdit();
            var cellIndex = $(this).attr(_this.columnIndexAttrName) - 1;
            if($(evt.target).hasClass('resizebar')) {    
                return;
            }
            var useUserFn = typeof _this.data.header[cellIndex].sort === 'function';
            _this.data.sortClassRecord = {};
            $(this).siblings('.sort').removeClass('sort-1').removeClass('sort-2');
       		var sortType;
       		if($(this).hasClass('sort-1')) {
       			$(this).removeClass('sort-1');
                $(this).addClass('sort-2');
                _this.data.sortClassRecord[cellIndex] = 'sort-2';
                sortType = 1;
       		} else {
       			$(this).addClass('sort-1');
                $(this).removeClass('sort-2');
                _this.data.sortClassRecord[cellIndex] = 'sort-1';
                sortType = 2;
       		}
       		if(_this.data.sortByCloud) {
       			return _this.data.header[cellIndex].sort();
       		}
            if(sortType === 1) {                                
                _this.data.rows.sort(function(a, b) {
                    var _a = JSON.parse(JSON.stringify(a));
                    var _b = JSON.parse(JSON.stringify(b));
                    if(typeof _a[0] === 'object' && _a[0].type === 'checkbox') {
                        _a.splice(0, 1);
                    }
                    if(typeof _b[0] === 'object' && _b[0].type === 'checkbox') {
                        _b.splice(0, 1);
                    }
                    if(useUserFn) {
                        var _return = _this.data.header[cellIndex].sort(_a[cellIndex], _b[cellIndex]);
                        return _return === -1 ? 1 : (_return === 1 ? -1 : 0);
                    } else {
                        var _return = (typeof a[cellIndex] === 'object' ? a[cellIndex].value : a[cellIndex]).localeCompare(typeof b[cellIndex] === 'object' ? b[cellIndex].value : b[cellIndex]);
                        return _return === -1 ? 1 : (_return === 1 ? -1 : 0);
                    }                    
                });    
            } else {
                _this.data.rows.sort(function(a, b) {
                    var _a = JSON.parse(JSON.stringify(a));
                    var _b = JSON.parse(JSON.stringify(b));
                    if(typeof _a[0] === 'object' && _a[0].type === 'checkbox') {
                        _a.splice(0,1);
                    }
                    if(typeof _b[0] === 'object' && _b[0].type === 'checkbox') {
                        _b.splice(0,1);
                    }
                    if(useUserFn) {
                        return _this.data.header[cellIndex].sort(_a[cellIndex], _b[cellIndex]); 
                    } else {
                        return (typeof _a[cellIndex] === 'object' ? _a[cellIndex].value : _a[cellIndex]).localeCompare(typeof _b[cellIndex] === 'object' ? _b[cellIndex].value : _b[cellIndex]);
                    } 
                });
            }
            _this.updateData(_this.data.rows);
        }).off('change').on('change', '.checkbox input[type="checkbox"]', function(evt) {
            var $cell = $(this).closest('.cell');
            if($(this).prop('checked') === true) {
                if($(this).hasClass('check-all')) {
                    _this.checkAll();
                } else {
                    var rowNum = $cell.attr(_this.rowIndexAttrName);
                    _this.checkOne(rowNum);
                }
            } else {
                if($(this).hasClass('check-all')) {
                    _this.unCheckAll();
                } else {
                    var rowNum = $cell.attr(_this.rowIndexAttrName);
                    _this.unCheckOne(rowNum);
                }
            }            
        }).off('dblclick').on('dblclick', '.body .cell', function(evt) {
            if($(this).hasClass('checkbox')) {
                return;
            }
            if(_this.data.editable) {
                var rowNum = $(this).attr(_this.rowIndexAttrName);
                $('.q-grid.body .cell[data-row-index="' + rowNum + '"]:not(.checkbox)', _this.container).each(function() {
                    _this.editCell($(this), true);
                });
            }
            if(_this.data.onDblclick) {
                var rowNum = $(this).attr(_this.rowIndexAttrName);
                var columnNum = $(this).attr(_this.columnIndexAttrName);
                var cellNum = typeof _this.data.rows[parseInt(rowNum)][0] === 'object' && _this.data.rows[parseInt(rowNum)][0].type === 'checkbox' ? columnNum : columnNum - 1;
                _this.data.onDblclick(_this.data.rows[parseInt(rowNum)], _this.data.rows[parseInt(rowNum)][cellNum] || '', evt);
            }
        }).off('contextmenu').on('contextmenu', '.body .cell', function(evt) {
            if(evt.target.tagName === 'INPUT') {
                return;
            }
            if(_this.data.onContextmenu) {
                var rowNum = $(this).attr(_this.rowIndexAttrName);
                var columnNum = $(this).attr(_this.columnIndexAttrName);
                var cellNum = typeof _this.data.rows[parseInt(rowNum)][0] === 'object' && _this.data.rows[parseInt(rowNum)][0].type === 'checkbox' ? columnNum : columnNum - 1;
                _this.data.onContextmenu(_this.data.rows[parseInt(rowNum)], _this.data.rows[parseInt(rowNum)][cellNum] || '', evt);
            }
            return false;
        }).on('mousedown.grid', '.body .cell', function(evt) {   
            if(!_this.data.dragable) {
                return;
            }
            var rowNum = $(this).attr(_this.rowIndexAttrName);
            var rowCells = $('.body .cell[data-row-index="' + rowNum + '"]', _this.container);
            var offsetY = evt.pageY - $(this).offset().top;
            var beginDrag = false;
            var thisCell = $(this);
            var cacheY = {}, hadReadRow = {}, tipLine;
            var timer = setTimeout(function() {
                var thisRowNum;
                $('.body .cell', _this.container).each(function() {
                    thisRowNum = $(this).attr(_this.rowIndexAttrName);
                    if(!hadReadRow[thisRowNum]) {
                        cacheY[thisRowNum] = {
                            top: $(this).offset().top,
                            height: $(this).height()
                        };
                        hadReadRow[thisRowNum] = true;
                    }
                });

                var lastCell = $(rowCells[rowCells.length - 1]);
                var lastTop = lastCell.offset().top;
                var cloneNode = lastCell.clone(true).empty();
                cloneNode.attr({
                    'class': 'placeholder',
                    'data-row-index': 'null'
                }).css({
                    'grid-column-start': 1,
                    'grid-column-end': _this.columLength + 1, 
                    'border': 'none'
                });
                lastCell.after(cloneNode);

                tipLine = $('<div></div>').css({
                    'width': thisCell.parent().width(),
                    'height': '1px',
                    'border-top': '1px dotted rgb(228, 108, 108)',
                    'position': 'absolute',
                    'top': lastTop,
                    'z-index': 6
                }).attr('class', 'baseline');
                lastCell.after(tipLine);
                
                rowCells.each(function() {
                    $(this).css({
                        'left': $(this).offset().left, 
                        'width': $(this).width(), 
                        'height': $(this).height(), 
                        'opacity': .7,
                        'z-index': 5,
                        'top': lastTop
                    }).addClass('draging');
                });
                rowCells.css({'position': 'absolute'});//这个必须单独写， 否则获取宽度异常
                beginDrag = true; 
            }, 200);
            
            var lastY = evt.pageY, currentY;
            $(document).on('mousemove.grid', function(e) {
                if(!beginDrag) {
                    return;
                }
                currentY = e.pageY;
                for(var index in cacheY) {
                    if(currentY - lastY > 0) {//往下拖
                        if(currentY < cacheY[index].top + cacheY[index].height / 2) {
                            tipLine.css('top', cacheY[index].top).attr('index', index);
                            break;
                        }
                    } else {//往上拖
                        if(currentY < cacheY[index].top + cacheY[index].height) {
                            tipLine.css('top', cacheY[index].top).attr('index', index);
                            break;
                        }
                    }
                }
                
                rowCells.each(function() {
                    $(this).css({
                        'top': e.pageY - offsetY
                    });
                });

                lastY = e.pageY;
            });
            
            $(document).on('mouseup.grid', function(e) {                
                $(document).off('mousemove.grid');
                $(document).off('mouseup.grid');
                clearTimeout(timer);
                rowCells.each(function() {
                    $(this).css({
                        'position': 'relative', 
                        'left': 0, 
                        'opacity': 1, 
                        'top': 0,
                        'z-index': 0
                    });
                    $(this).removeClass('draging');
                });
                $('.placeholder', _this.container).remove();
                var finalIndex = $('.baseline', _this.container).attr('index');
                if(finalIndex && rowNum !== finalIndex) {
                    $('.body .cell[data-row-index="' + finalIndex + '"]', _this.container).eq(0).before(rowCells);
                    var _rowNum;
                    $('.body .cell', _this.container).each(function() {
                        _rowNum = $(this).attr(_this.rowIndexAttrName);
                        if(finalIndex - rowNum > 0) {
                            if(+_rowNum > +rowNum && +_rowNum < +finalIndex) {
                                $(this).attr(_this.rowIndexAttrName, _rowNum - 1);
                            }
                        } else {
                            if(+_rowNum >= +finalIndex && +_rowNum < +rowNum) {
                                $(this).attr(_this.rowIndexAttrName, _rowNum * 1 + 1);
                            }
                        }
                    });
                    if(finalIndex - rowNum > 0) {
                        rowCells.attr(_this.rowIndexAttrName, finalIndex - 1);
                        _this.data.rows.splice(finalIndex, 0, _this.data.rows[rowNum]);
                        _this.data.rows.splice(rowNum, 1);
                    } else {
                        rowCells.attr(_this.rowIndexAttrName, finalIndex);
                        _this.data.rows.splice(finalIndex, 0, _this.data.rows[rowNum]);
                        _this.data.rows.splice(rowNum * 1 + 1, 1);
                    }
                }
                $('.baseline', _this.container).remove();
                beginDrag = false;                
            });
        });
        $(document).off('click.grid').on('click.grid', function(evt) {
            if(!$(evt.target).closest('.cell').length) {
                _this.endEdit();
            }       
        });
    },
    endEditOne: function($cell) {
        var _this = this;
        var $input = $cell.find('input');
        var $select = $cell.find('select');
        if(!$input.length && !$select.length) {
            return;
        }
        var value = _this.htmlEncode($input.length ? $input.val() : $select.length ? $select.val() : '');
        var rowNum = $cell.attr(_this.rowIndexAttrName);
        var columnNum = $cell.attr(_this.columnIndexAttrName);
        var cellNum = typeof _this.data.rows[parseInt(rowNum)][0] === 'object' && _this.data.rows[parseInt(rowNum)][0].type === 'checkbox' ? columnNum : columnNum - 1;
        var oldValue;
        if(_this.data.rows[rowNum] && _this.data.rows[rowNum][cellNum]) {
            if(typeof _this.data.rows[rowNum][cellNum] !== 'object') {
                oldValue = _this.data.rows[rowNum][cellNum];
                _this.data.rows[rowNum][cellNum] = value;
            } else {
                oldValue = _this.data.rows[rowNum][cellNum].value;
                _this.data.rows[rowNum][cellNum].value = value;
            }
        } 
        $cell.html(value).removeClass('editing');
        $cell.attr('title', value);
        if($cell.hasClass('i18n')) {
            $cell.attr('i18n', value);
        }
        if(_this.data.onEdit) {
            _this.data.onEdit(rowNum, cellNum, oldValue, value);
        }
    },
    endEdit: function() {
        var _this = this;
        $('.body.q-grid .cell.editing', this.container).each(function() {
            _this.endEditOne($(this));
        });      
    },
    editCell: function($cell, multiEdit) {
        if($cell.hasClass('editing') || $cell.hasClass('checkbox')) {
            return;
        }
        var text = $cell.text() || '', _this = this;
        if(!multiEdit) {
            _this.endEdit();
        }
        var rowNum = $cell.attr(_this.rowIndexAttrName);
        var columnNum = $cell.attr(_this.columnIndexAttrName);
        if(_this.data.onBeforEdit) {
            var _edit = _this.data.onBeforEdit(rowNum, columnNum, text);
            if(_edit === false) {
                return;
            }
        }
        var editType = 'input', options = '';
        if(_this.data.rows[rowNum]) {
            var targetCellObj;
            if(typeof _this.data.rows[rowNum][0] !== 'string' && _this.data.rows[rowNum][0].type === 'checkbox') {
                targetCellObj = _this.data.rows[rowNum][columnNum];
            } else {
                targetCellObj = _this.data.rows[rowNum][columnNum - 1];
            }
            if(typeof targetCellObj !== 'string' && targetCellObj.editType) {
                editType = targetCellObj.editType.type || 'input';
                options = targetCellObj.editType.options;
            }
        }
        $cell.addClass('editing');
        if(editType === 'input') {
            var align = $cell.css('justify-content');
            $cell.html('<input value="' + text + '" type="text" style="text-align:' + align + '">');
            if(!multiEdit) {
                $cell.find('input').select().focus();
            }
        } else if(editType === 'select') {
            var select = $('<select style="width:100%;"></select>');
            if(options && $.isArray(options)) {
                options.forEach(function(v, index) {
                    select.append('<option class="i18n" value="' + v + '">' + v + '</option>');
                    options[index] = v + '';
                });
                if(options.indexOf(text) > -1) {
                    select.val(text);
                }
            }
            $cell.html('').append(select);   
        }  
    },
    getData: function() {
        var data = JSON.parse(JSON.stringify(this.data.rows));
        return data;
    },
    getSelectedData: function() {
        let data = [], hadGetData = {}, rowIndex, rowData, _this = this;
        $('.q-grid.body .cell.selected', this.container).each(function() {
            rowIndex = $(this).attr(_this.rowIndexAttrName);
            if(!hadGetData[rowIndex]) {
                hadGetData[rowIndex] = true;
                rowData = JSON.parse(JSON.stringify(_this.data.rows[parseInt(rowIndex)]));
                data.push(rowData);
            }
        });
        return data;
    },
    getCheckedData: function() {
        let data = [], rowIndex, rowData, _this = this;
        $('.q-grid.body .cell.checkbox', this.container).each(function() {
            if($(this).find('input').prop('checked') === true) {
                rowIndex = $(this).attr(_this.rowIndexAttrName);
                rowData = JSON.parse(JSON.stringify(_this.data.rows[parseInt(rowIndex)]));
                data.push(rowData);
            }   
        });
        return data;
    },
    getColumLength: function() {
        let count = 1;
        if(this.data.header && this.data.header.length) {
            if(this.data.header.length > count) {
                count = this.data.header.length;
            }
        }
        if(this.data.rows) {
            this.data.rows.forEach(function(item) {
                var leng = item.length;
                item.forEach(function(_item, index) {
                    if(index === 0 && typeof _item === 'object' && _item.type === 'checkbox') {
                        leng = leng - 1;
                    }
                    if(typeof _item === 'object' && _item.size) {
                        leng += _item.size - 1;
                    }
                });
                if(leng > count) {
                    count = leng;
                }
            });
        }
        return count;
    },
    isFirefox: function() {
        return navigator.userAgent.indexOf('Firefox/') > -1;
    },
    numberToPx: function(num, _default) {
        if(num) {
            if(!isNaN(num)) {
                return num + 'px';
            } else {
                return num;
            }   
        } else {
            return _default;
        }
    },
};