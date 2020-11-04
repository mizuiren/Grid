/**
 * by 秋叶(Author blog: https://www.mizuiren.com)
 * [Grid description]
 * @param {[type]} data       [渲染表格用到的数据]
 * @param {[type]} $container [渲染到的容器（jq对象）]
 */
function Grid(data, $container) {
    this.data = data;
    this.data.borderColor = this.data.borderColor || '#ddd';
    this.container = $container;
    this.columLength = this.getColumnLength();
    if(this.data.pageCount) {
        this.page = 1;
    }
    this.bindEvent();
    this.renderGrid();
}
Grid.prototype = {
    minHeight: '30px',
    rowIndexAttrName: 'data-row-index',
    columnIndexAttrName: 'data-cell-index',
    updateTimer: null,
    updateData: function(rowsData) {
        this.data.rows = rowsData;
        var rowsHtml = '';
        var _this = this;
        rowsHtml += this.getFilterRow();
        this.data.rows.forEach(function(rowData, index) {
            if(!_this.validRowData(rowData)) {
                return;
            }
            if(_this.data.pageCount) {
                if((_this.page - 1) * _this.data.pageCount - 1 >= index || index > _this.page * _this.data.pageCount - 1) {
                    return;
                }
            }
            rowsHtml += _this.renderRow(rowData, index, false, index === _this.data.rows.length - 1  && _this.data.pageCount && _this.data.pageCount >= _this.data.rows.length);
        });
        var $gridBody = $('.q-grid.body', this.container);
        if(!$gridBody.length) {
            this.columLength = this.getColumnLength();
            this.renderGrid();
        } else {
            rowsHtml += this.getPageControlHtml();
            $gridBody.html(rowsHtml);
            this.updateRowHeight();
        }
        this.initUi();
    },
    updateRowHeight: function() {
        var $gridBody = $('.q-grid.body', this.container);
        if(this.data.rowHeight) {
            var rowLength;
            if(this.data.pageCount && this.data.pageCount < this.data.rows.length) {
                if(this.data.rows.length - (this.page - 1) * this.data.pageCount <= this.data.pageCount) {
                    rowLength = this.data.rows.length - (this.page - 1) * this.data.pageCount + 1;
                } else {
                    rowLength = this.data.pageCount + 1;
                }
            } else {
                rowLength = this.data.rows.length;
            }
            $gridBody.css('grid-template-rows', 'repeat(' + rowLength + ', '+this.numberToPx(this.data.rowHeight, '30px')+')');
        }
    },
    appendRow: function(rowData, index) {
        if(!this.validRowData(rowData)) {
            return;
        }
        this.clearSortData();
        if(index === undefined || index > this.data.rows.length) {
            index = this.data.rows.length;
        }
        if(index < 0) {
            index = 0;
        }
        var $gridBody = $('.q-grid.body', this.container);
        var $lastRows = $('.cell[' + this.rowIndexAttrName +'="'+ (this.data.rows.length - 1) +'"]', $gridBody);
        $lastRows.css('border-bottom', '1px ' + this.data.border + ' ' + this.data.borderColor);
        this.data.rows.splice(index, 0, rowData);   
        var newRowHtml = this.renderRow(rowData, index, false, true);
        
        var _this = this;
        if(index < this.data.rows.length) {
            $('.cell['+this.rowIndexAttrName+']', $gridBody).each(function() {
                var oldIndex = +$(this).attr(_this.rowIndexAttrName);
                if(oldIndex >= index) {
                    $(this).attr(_this.rowIndexAttrName, oldIndex + 1);
                }
            });
        }
        if(index === 0) {
            $gridBody.prepend(newRowHtml);
        } else if(index === this.data.rows.length) {
            $gridBody.append(newRowHtml);
        } else {
            var $after = $('['+this.rowIndexAttrName+'="'+(index - 1)+'"]:last', $gridBody);
            $after.after(newRowHtml);
        }
        this.updateRowHeight();
        this.initUi();
    },
    deleteRow: function(rowIndex) {
        this.clearSortData();
        var $gridBody = $('.q-grid.body', this.container);
        if(rowIndex === this.data.rows.length - 1) {
            var $nextLastRows = $('.cell[' + this.rowIndexAttrName +'="'+ (this.data.rows.length - 2) +'"]', $gridBody);
            debugger;
            $nextLastRows.css('border-bottom','none');
        }
        this.data.rows.splice(rowIndex, 1);
        
        var _this = this;
        $('.cell['+this.rowIndexAttrName+'="'+rowIndex+'"]', $gridBody).remove();
        if(rowIndex < this.data.rows.length) {
            $('.cell['+this.rowIndexAttrName+']', $gridBody).each(function() {
                var oldIndex = +$(this).attr(_this.rowIndexAttrName);
                if(oldIndex >= rowIndex) {
                    $(this).attr(_this.rowIndexAttrName, oldIndex - 1);
                }
            });
        }
        this.updateRowHeight();
    },
    updateRow: function(rowData, rowIndex) {
        if(!this.validRowData(rowData) || rowIndex === undefined || rowIndex < 0 ||  rowIndex > this.data.rows.length - 1) {
            return;
        }
        var $body = $('.q-grid.body', this.container);
        var isSelected = $('.cell['+this.rowIndexAttrName+'="'+rowIndex+'"]', $body).hasClass('selected');
        this.deleteRow(rowIndex);
        this.appendRow(rowData, rowIndex);
        if(isSelected) {
            $('.cell['+this.rowIndexAttrName+'="'+rowIndex+'"]', $body).addClass('selected');
        }
    },
    validRowData: function(rowData) {
        if(!$.isArray(rowData)) {
            console.error('Invalid data format!');
            return false;
        }
        var realLength = this.getCellLength(rowData);
        if(!this.isCheckboxCell(rowData[0])) {
            realLength = realLength + 1;
        }
        if(realLength > this.columLength) {
            console.error('Cell length exceed!');
            return false;
        }
        for(var i = 0; i < rowData.length; i++) {
            if(typeof rowData[i] !== 'number' && typeof rowData[i] !== 'string' && typeof rowData[i] !== 'object') {//简单粗暴判断下
                console.error('Invalid data format!');
                return false;
            }
        }
        return true;
    },
    updateCell: function($cell, newValue) {
        this.clearSortData();
        newValue = this.htmlEncode(newValue);
    	var rowIndex = $cell.attr(this.rowIndexAttrName);
    	var columnIndex = $cell.attr(this.columnIndexAttrName);
    	var rowData = this.data.rows[rowIndex];
    	if(rowData) {
    		if(this.isCheckboxCell(rowData[0])) {
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
    	$cell.html(newValue);
        if(!this.isContainTag(newValue)) {
            $cell.attr('title', newValue);
        }
        if($cell.hasClass('i18n')) {
            $cell.attr('i18n', newValue);
        }
    },
    isContainTag: function(string) {
        return (string + '').match(/<[a-zA-Z]+\s?.*?>/);
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
            newHeader.unshift({value:'<input type="checkbox" class="check-all"/><span></span>', id: 'id', type: 'checkbox'});

            header = $('<header class="q-grid header" style="' + this.gridStyles.join(';') + '"></header>');
            header.append(this.renderRow(newHeader, 0, 'header'));
            this.gridBox.append(header);
        }
        this.gridStyles.push('padding-bottom: 1px');
        if(this.data.rows && this.data.rows.length) {
            var bodyGridStyles = JSON.parse(JSON.stringify(this.gridStyles));
            if(this.data.showHeader) {
                bodyGridStyles.push('margin-top:-1px');
            }
            var scrolBoxStyles = ['border-bottom: 1px ' + (this.data.border || 'solid') + this.data.borderColor];
            if(!this.data.width || this.data.width !== '100%') {
                scrolBoxStyles.push('width: ' + (parseInt(this.data.width)) + 'px');
            }
            if(this.data.freezeHeader) {
                var defaultHeaderHeight = 24; //dom不可兼得情况下渲染表格header.outerHeight()取不到高度，所以这种情况暂时给个默认高度
                if(this.data.height && this.data.height !== 'auto') {
                    scrolBoxStyles.push('max-height: ' + (parseInt(this.data.height) - (header ? (header.outerHeight() || defaultHeaderHeight) : 0)) +'px;overflow-y: auto;overflow-y:overlay;');
                } else {
                    scrolBoxStyles.push('max-height: calc(100% - ' + (header ? (header.outerHeight() || defaultHeaderHeight) : 0) +'px);overflow-y: auto;overflow-y:overlay;');
                }
            }
            var scrolBox = $('<div style="' + scrolBoxStyles.join(';') + '" class="q-grid-scroll"></div>');
            var contentBox = $('<div class="q-grid body" style="' + bodyGridStyles.join(';') + '"></div>');
            contentBox.css('width', '100%');

            var rowsHtml = '';
            var _this = this;
            rowsHtml += this.getFilterRow();
            this.data.rows.forEach(function(rowData, index) {
                if(_this.data.pageCount) {
                    if((_this.page - 1) * _this.data.pageCount - 1 >= index || index > _this.page * _this.data.pageCount - 1) {
                        return;
                    }
                }
                rowsHtml += _this.renderRow(rowData, index, false, index === _this.data.rows.length - 1 && _this.data.pageCount && _this.data.pageCount >= _this.data.rows.length);
            });
            rowsHtml += this.getPageControlHtml();
            contentBox.append(rowsHtml);

            scrolBox.append(contentBox);
            this.gridBox.append(scrolBox);
            this.updateRowHeight();
            this.initUi();
        }
    },
    getPageControlHtml: function() {
        var _this = this;
        function pageInit(current, total, link){
           current = parseInt(current);
           total = parseInt(total);
           var count = 6;
           var i;
           var preLink = current > 1 ? link + (current-1) : "javascript:void(0)";
           var nextLink = current < total ? link + (current + 1) : "javascript:void(0)";
           var html = '<div class="pages">共 <b>' + _this.data.rows.length + '</b> 条记录 <a page="' + preLink + '" '+(current > 1 ? "" : "class=\"no-link\"") +'>&lt;&lt;</a>';
           if(total <= count){
              for(i = 1; i <= total; i++){
                 var pageTag = i == current ? '<span class="act">' + current + '</span>' : '<a page="' + link + i + '">' + i + '</a>'
                 html += pageTag;
              }
           }else{
              i = current - count / 2 < 2 ? 2 : current - count / 2;
              var end = (parseInt(current + count / 2) > (total - 1)) ? (total - 1) : parseInt(current + count / 2);
              html += (current == 1) ? '<span class="act">1</span>' : '<a page="' + link + '1">1</a> ' + (i > 2 ? "..." : "");
              for(; i <= end; i++){
                  var pageTag = (i == current) ? '<span class="act">' + current + '</span>' : '<a page="' + (link + i) + '">' + i + '</a>'
                  html += pageTag;
              }
              html += (end < (total - 2) ? "..." : "") + ((current == total) ? '<span class="act">' + total + '</span>' : ' <a page="' + link + total + '">' + total + '</a>');
           }
           html += '<a page="' + nextLink + '" ' + (current < total ? "" : "class=\"no-link\"") + '>&gt;&gt;</a></div>';
           return html;
        }

        var rowsHtml = '';
        if(this.data.pageCount && !isNaN(this.data.pageCount)) {
            if(this.data.pageCount < this.data.rows.length) {
                rowsHtml += '<div style="display: flex;align-items: center;justify-content: flex-end;margin-bottom: -1px;grid-column-start: 1;grid-column-end: ' + (this.columLength + 1) + ';border: 1px ' + this.data.border + ' ' + this.data.borderColor +';border-bottom: none;border-top: none">';
                rowsHtml += pageInit(this.page, Math.ceil(this.data.rows.length / this.data.pageCount), '');
                rowsHtml += '&nbsp;&nbsp;&nbsp;&nbsp;</div>';
            }
        }
        return rowsHtml;
    },
    getFilterRow: function() {
        if(this.data.filter) {
            let filterInputs = new Array(this.columLength - 1).fill('<input class="filter" placeholder="Filter" type="text"/>');
            return this.renderRow(filterInputs, 'filterRow');
        } else {
            return '';
        }
    },
    initUi:function() {
        var scrolBox = $('.q-grid-scroll', this.container);
        var header = $('.q-grid.header', this.container);
        var scrollTop = scrolBox.scrollTop();
        var _this = this;
        //判断有没有滚动条，有滚动条火狐要特殊处理，保证表头和表体单元格对齐
        if(this.isFirefox()) {
            var fixWidth = 'calc(' + this.data.width + ' - 17px)';//火狐下滚动条宽度固定为17px
            if(scrollTop > 0) {
                header.css('width', fixWidth);
            } else {
                 scrolBox.scrollTop(10);//控制滚动条下移10px
                if(scrolBox.scrollTop() > 0){
                    header.css('width', fixWidth);
                }
                scrolBox.scrollTop(scrollTop);//滚动条返回原位
            }           
        }
        
        var needDisabledHeader = true;
        this.data.rows.forEach(function(arr, index) {
            if(_this.isCheckboxCell(arr[0])) {
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
    },
    renderRow: function(rowData, rowIndex, isHeader, isLastRow) {
        var cellsHtml = '';
        if(!this.validRowData(rowData)) {
            return cellsHtml;
        }
        var _this = this;
        var id = '', hadRowId = _this.isCheckboxCell(rowData[0]);
        var cloneColumnData = JSON.parse(JSON.stringify(rowData));
        if(!isHeader) {
            if(hadRowId) {
                cloneColumnData[0].value = '<input type="checkbox" ' + (cloneColumnData[0].disabled ? 'disabled' : '') + '/><span></span>';
            } else {
                cloneColumnData.unshift(rowIndex === 'filterRow' ? '' : {value:'<input type="checkbox" ' + (cloneColumnData[0].disabled ? 'disabled' : '') + '/><span></span>', id: rowIndex, type: 'checkbox'});
            } 
        }
        if(_this.getCellLength(cloneColumnData) < _this.columLength) {
            cloneColumnData = cloneColumnData.concat(new Array(_this.columLength - cloneColumnData.length).fill(''));
        }
        var cellStyles, classes, needSort, resizeLine, value, columnSeting;
        cloneColumnData.forEach(function(item, index) {
            cellStyles = [];
            needSort = false;
            columnSeting = _this.data.header && index !== 0 && _this.data.header[index - 1];
            if(hadRowId && index === 0) {
                id = 'data-id="' + cloneColumnData[0].id + '"';
            } else if(index !== 0) {
                id = columnSeting && columnSeting.id ? 'data-id="' + columnSeting.id + '"' : 'data-id="' + index + '"';
            } else {
                id = 'data-id="0"';
            }
            if(!isHeader) {
				cellStyles.push('margin-bottom: -1px');
            }
            if(_this.checkbox) {
                if(index !== 0) {
                    cellStyles.push('margin-left: -1px');
                } 
            } else {
                if(index !== 1 && index !== 0) {
                    cellStyles.push('margin-left: -1px');
                }
            }
            
            classes = ['cell'];
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
            resizeLine = '';
            if(isHeader && columnSeting) {
                if(columnSeting.sort) {
                    classes.push('sort');
                    needSort = true;
                }
                if(columnSeting.resizeable) {
                    resizeLine = '<span class="resizebar"></span>';
                }
            }
            if(columnSeting && parseInt(columnSeting.width) === 0) {
                cellStyles.push('height:0');
            }
            if(index === 0) {
                classes.push('checkbox');
            }
            if(!_this.data.border) {
                _this.data.border = 'dotted';
            }
            value = typeof item !== 'object' ? item : item.value;
            cellStyles.push('border: ' + (_this.data.border === 'none' ? '0' : 1) + 'px ' + _this.data.border + ' ' + _this.data.borderColor);
            if(isLastRow) {
                cellStyles.push('border-bottom: none');
            }
            //ellipsis
            cellsHtml += '<div ' + id + ' class="' + (isHeader || (columnSeting && columnSeting.ellipsis) ? classes.join(' ').replace(item.class, '') : classes.join(' ')) + '" data-cell-index="' + index + '" data-row-index="' + rowIndex + '" style="' + cellStyles.join(';') + '" title="' +(index === 0 || rowIndex === 'filterRow' ? '' : _this.isContainTag(value) ? '' : value) + '">';
            if(isHeader) {
                cellsHtml += resizeLine;
            }
            if(isHeader || (columnSeting && columnSeting.ellipsis)) {
                cellsHtml += '<span class="' + (item.class || '') + ' txt '+(columnSeting && columnSeting.ellipsis ? 'ellipsis' : '')+'">' + value +'</span> ' + (needSort ? '<span class="sort-icon"> </span>' : '');
            } else {
                cellsHtml += value;
            }
            cellsHtml += '</div>'
        });
        return cellsHtml;
    },
    getCellLength: function(arr) {
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
    },
    htmlEncode:function (html){
        var temp = document.createElement ("div");
        (temp.textContent != undefined ) ? (temp.textContent = html) : (temp.innerText = html);
        var output = temp.innerHTML;
        temp = null;
        return output;
    },
    selectRow: function(rowNum, evt, multiSelect) {
        if(this.isRowSelected(rowNum)) {
            return;
        }
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
            _this.data.onSelect(_this.data.rows[parseInt(rowNum)]);
        }
        if(_this.data.onSelectAll) {
            if(!$('.cell:not(".seleted")', $parent).length) {
                _this.data.onSelectAll(_this.data.rows);
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
        if(!this.isRowSelected(rowNum)) {
            return;
        }
        $('.q-grid.body .cell.selected[data-row-index="' + rowNum + '"]', this.container).removeClass('selected');
        if(this.data.onUnSelect) {
            this.data.onUnSelect(this.data.rows[parseInt(rowNum)]);
        }
        if(this.data.onUnSelectAll) {
            if(!$('.cell.seleted', $('.body', this.container)).length) {
                this.data.onUnSelectAll(this.data.rows);
            }
        }
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
    checkAll: function(fromEvent) {
        var rowNum, _this = this;
        $('.body .checkbox input', this.container).each(function() {
            rowNum = $(this).closest('.cell').attr(_this.rowIndexAttrName);
            _this.checkOne(rowNum, fromEvent);
        });
    },
    unCheckAll: function(fromEvent) {
        var rowNum, _this = this;
        $('.body .checkbox input', this.container).each(function() {
            rowNum = $(this).closest('.cell').attr(_this.rowIndexAttrName);
            _this.unCheckOne(rowNum, fromEvent);
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
    checkOne: function(rowNum, fromEvent) {
        var $input = $('.q-grid.body .checkbox[data-row-index="' + rowNum + '"] input', this.container);
        if(isNaN(rowNum) || $input.prop('checked') || (fromEvent && $input.prop('disabled'))) {
            return;
        }
        $input.prop('checked', true);
        var checkObj = this.isCheckboxCell(this.data.rows[rowNum][0]);
        if(checkObj) {
            this.data.rows[rowNum][0].checked = true;
        }

        if(this.isAllChecked()) {
            $('.check-all', this.container).prop('checked', true);
        }
        
        if(this.data.onCheck) {   
            this.data.onCheck(this.data.rows[parseInt(rowNum)]);
        }
        if(this.data.onCheckAll) {
            if(!$('.cell.checkbox input:not(":checked")', $('.body', this.container)).length) {
                this.data.onCheckAll(this.data.rows);
            }
        }
        if(this.data.selectWhenCheck && this.data.selectable) {
            this.selectRow(rowNum, {},  !!this.data.multiSelect);
        }
        if(this.data.editable) {
            this.endEdit();
        }
    },
    unCheckOne: function(rowNum, fromEvent) {
        var $input = $('.q-grid.body .checkbox[data-row-index="' + rowNum + '"] input', this.container);
        if(!$input.prop('checked') || (fromEvent && $input.prop('disabled'))) {
            return;
        }
        $input.prop('checked', false);
        var checkObj = this.isCheckboxCell(this.data.rows[rowNum][0]);

        if(checkObj) {
            this.data.rows[rowNum][0].checked = false;
        }
        if(!this.isAllChecked()) {
            $('.check-all', this.container).prop('checked', false);
        }

        if(this.data.onUnCheck) {   
            this.data.onUnCheck(this.data.rows[parseInt(rowNum)]);
        }
        if(this.data.onUnCheckAll) {
            if(!$('.cell.checkbox input:checked', $('.body', this.container)).length) {
                this.data.onUnCheckAll(this.data.rows);
            }
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
            if(isNaN(rowNum) || evt.target.tagName === 'INPUT' || evt.target.tagName === 'SELECT' || $cell.hasClass('editing')) {
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
                var cellNum =  _this.isCheckboxCell( _this.data.rows[rowNum][0]) ? columnNum : columnNum - 1;
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
        }).on('click.grid', '.pages a', function(evt) {
            var page = $(this).attr('page');
            if(isNaN(page)) {
                return false;
            }
            _this.page = page * 1;
            if(_this.data.onPageChange) {
                if(!_this.data.onPageChange(_this.page)) {
                    return;
                }
            }
            _this.updateData(_this.data.rows);
            return false;
        }).on('keyup', '.editting-ele', function(evt) {
            if(evt.keyCode === 13) {
                _this.endEditOne($(this).closest('.cell'));
            }
        }).on('click.grid', '.header .cell', function(evt) {
            var $cell = $(evt.target).closest('.cell');
            if($cell.hasClass('checkbox')) {               
                var $input = $(evt.target).closest('.cell').find('input');
                if(!$input.prop('disabled')) {
                    if($input.closest('.header').length) {
                        if($input.prop('checked') === true) {
                            $input.prop('checked', false).trigger('change');
                        } else {
                            $input.prop('checked', true).trigger('change');
                        }
                    }
                }
            }
        }).off('input.grid').on('input.grid', '.cell input.filter', function() {
            $('.q-grid.body .cell['+_this.rowIndexAttrName+']', _this.container).show();
            var $filterInputs = $('.cell input.filter', _this.container);
            var matched, cellIndex, val, string, shouldMatchData;
            _this.data.rows.forEach(function(rowData, index) {
                matched = true;
                for (var i = 0; i < $filterInputs.length; i++) {
                    cellIndex = $filterInputs.eq(i).parent().attr(_this.columnIndexAttrName) - 1;
                    shouldMatchData = _this.isCheckboxCell(rowData[0]) ? rowData[cellIndex + 1] : rowData[cellIndex];
                    string = typeof shouldMatchData === 'string' ||  typeof shouldMatchData === 'number' ? shouldMatchData + '' : shouldMatchData.value;
                    val = $filterInputs.eq(i).val();
                    if(!val) {
                        continue;
                    }
                    if(string.indexOf(val) === -1) {
                        matched = false;
                        break;
                    }
                }

                if(matched) {
                    $('.q-grid.body .cell['+_this.rowIndexAttrName+'="'+index+'"]', _this.container).show();
                } else {
                    $('.q-grid.body .cell['+_this.rowIndexAttrName+'="'+index+'"]', _this.container).hide();
                }
            });
        }).off('mousedown.grid').on('mousedown.grid', 'header.q-grid .cell .resizebar', function(evt) {
            var $cell = $(this).parent(), cellLeft = $cell.offset().left;
            var cellIndex = $cell.attr(_this.columnIndexAttrName) - 1;
            var $header = $('.q-grid.header', _this.container);
            var $body = $('.q-grid.body', _this.container);
            var $resizeBar = $(this);
            var columnWidths = _this.getColumnWidth().split(' ');
            var originX = evt.pageX;
            var currentX;
            $resizeBar.addClass('isDraging');
            var width;
            if(_this.data.width) {
                if((_this.data.width + '').match(/\d+%$/)) {
                    width = (parseFloat(_this.data.width)) / 100 * _this.container.width();
                } else {
                    width = parseFloat(_this.data.width)
                }
            } else {
                width = _this.container.width();
            }
            $(document).on('mousemove.grid', function(e) {
                currentX = e.pageX;
                if(currentX > cellLeft + 10) {
                    var pxWidth = currentX - cellLeft;
                    var allPxWidth = 0;
                    if(currentX - originX > 0) {
                        columnWidths.forEach(function(setting, index) {
                            if(typeof setting === 'number' || !isNaN(setting)) {
                                allPxWidth += setting * 1;
                            } else if(setting.match(/\d+%$/)) {
                                allPxWidth += (parseFloat(setting)) / 100 * width;
                            } else  if(setting.match(/\d+px$/)) {
                                allPxWidth += parseFloat(setting);
                            }
                        });
                    }
                    if(allPxWidth < (cellIndex + 2 === _this.columLength ? width : width - 5)) {
                        var percent = (pxWidth / width * 100) + '%';
                        columnWidths[cellIndex + 1] = percent;
                        _this.data.header[cellIndex].width = percent;
                        $header.css('grid-template-columns', columnWidths.join(' '));
                        $body.css('grid-template-columns', columnWidths.join(' ')); 
                    }
                    
                }
            });
            
            $(document).on('mouseup.grid', function(e) {             
                $(document).off('mousemove.grid');
                $(document).off('mouseup.grid');
                $resizeBar.removeClass('isDraging');
            });
        }).off('dblclick.grid').on('dblclick.grid', 'header.q-grid .cell .resizebar', function(evt) {
            var $cell = $(this).parent();
            var cellIndex = $cell.attr(_this.columnIndexAttrName) - 1;
            if(_this.data.rows.length) {
                var maxLength = 0, maxLengthValue = 'xxx', cellValue;
                _this.data.rows.forEach(function(rowData, index) {
                    cellValue = _this.isCheckboxCell(rowData[0]) ? rowData[cellIndex + 1] : cellValue = rowData[cellIndex];
                    if(cellValue) {
                        if(typeof cellValue !== 'string') {
                            cellValue = cellValue.value;
                        }
                        cellValue = cellValue + '';
                        if(!_this.isContainTag(cellValue)) {
                            if(cellValue.length > maxLength) {
                                maxLength = cellValue.length;
                                maxLengthValue = cellValue;
                            }
                        }
                    }
                });
                var spanContainer = $('<span>' + maxLengthValue + '</span>');
                $('body').append(spanContainer);
                var maxLengthWidth = spanContainer.width();
                $(spanContainer).remove();
                var $header = $('.q-grid.header', _this.container);
                var headerWidth = $header.width();
                var percent = (maxLengthWidth / headerWidth * 100) + '%';
                _this.data.header[cellIndex].width = percent;
                var columnWidths = _this.getColumnWidth().split(' ');
                $header.css('grid-template-columns', columnWidths.join(' '));
                $('.q-grid.body', _this.container).css('grid-template-columns', columnWidths.join(' '));
            }
            
        }).on('mousedown.grid', 'header.q-grid .cell.sort', function(evt) {
            _this.endEdit();
            var cellIndex = $(this).attr(_this.columnIndexAttrName) - 1;
            if($(evt.target).hasClass('resizebar')) {    
                return;
            }
            var useUserFn = typeof _this.data.header[_this.isCheckboxCell(_this.data.header[0]) ? cellIndex + 1 : cellIndex].sort === 'function';
            $(this).siblings('.sort').removeClass('sort-1').removeClass('sort-2');
       		var sortType;
       		if($(this).hasClass('sort-1')) {
                $(this).removeClass('sort-1');
                sortType = 0;
                var originData = _this.container.data('originData');
                if(originData) {
                    _this.updateData(originData);
                    if(_this.data.onSort) {
                        _this.data.onSort(sortType);
                    }
                    return;
                }
       		} else if($(this).hasClass('sort-2')) {
       			$(this).addClass('sort-1');//顺序
                $(this).removeClass('sort-2');
                sortType = 2;
       		} else {
                $(this).addClass('sort-2');//倒序
                sortType = 1;
                _this.container.data('originData', JSON.parse(JSON.stringify(_this.data.rows)));
            }
       		if(_this.data.sortByCloud) {
       			return _this.data.header[_this.isCheckboxCell(_this.data.header[0]) ? cellIndex + 1 : cellIndex].sort(sortType);
       		}
            var _return;
            _this.data.rows.sort(function(a, b) {
                var _a = JSON.parse(JSON.stringify(a));
                var _b = JSON.parse(JSON.stringify(b));
                if(_this.isCheckboxCell(_a[0])) {
                    _a.splice(0, 1);
                }
                if(_this.isCheckboxCell(_b[0])) {
                    _b.splice(0, 1);
                }
                if(useUserFn) {
                    _return = _this.data.header[cellIndex].sort(_a[cellIndex], _b[cellIndex]);
                } else {
                    var aCellIndex = _this.isCheckboxCell(a[0]) ? cellIndex + 1 : cellIndex;
                    var bCellIndex = _this.isCheckboxCell(b[0]) ? cellIndex + 1 : cellIndex;
                    var value1 = (typeof a[aCellIndex] === 'object' ? a[aCellIndex].value : a[aCellIndex]) + '';//转成字符串
                    var value2 = (typeof b[bCellIndex] === 'object' ? b[bCellIndex].value : b[bCellIndex]) + '';//转成字符串
                    _return = (value1).localeCompare(value2);
                }
                return _return * (sortType === 1 ? -1 : 1);
            });
            _this.updateData(_this.data.rows);
            if(_this.data.onSort) {
                _this.data.onSort(sortType);
            }
        }).off('change').on('change', '.checkbox input[type="checkbox"]', function(evt) {
            var $cell = $(this).closest('.cell');
            if($(this).prop('checked') === true) {
                if($(this).hasClass('check-all')) {
                    _this.checkAll(true);
                } else {
                    var rowNum = $cell.attr(_this.rowIndexAttrName);
                    _this.checkOne(rowNum, true);
                }
            } else {
                if($(this).hasClass('check-all')) {
                    _this.unCheckAll(true);
                } else {
                    var rowNum = $cell.attr(_this.rowIndexAttrName);
                    _this.unCheckOne(rowNum, true);
                }
            }            
        }).on('dblclick', '.body .cell', function(evt) {
            if($(this).hasClass('checkbox')) {
                return;
            }
            if(_this.data.editable) {
                var rowNum = $(this).attr(_this.rowIndexAttrName);
                if(!isNaN(rowNum)) {
                    $('.q-grid.body .cell[data-row-index="' + rowNum + '"]:not(.checkbox)', _this.container).each(function() {
                        _this.editCell($(this), true);
                    });
                }
            }
            if(_this.data.onDblclick) {
                var rowNum = $(this).attr(_this.rowIndexAttrName);
                if(!isNaN(rowNum)) {
                    var columnNum = $(this).attr(_this.columnIndexAttrName);
                    var cellNum = _this.isCheckboxCell(_this.data.rows[parseInt(rowNum)][0]) ? columnNum : columnNum - 1;
                    _this.data.onDblclick(_this.data.rows[parseInt(rowNum)], _this.data.rows[parseInt(rowNum)][cellNum] || '', evt);
                }
            }
        }).off('contextmenu').on('contextmenu', '.body .cell', function(evt) {
            if(evt.target.tagName === 'INPUT') {
                return;
            }
            if(_this.data.onContextmenu) {
                var rowNum = $(this).attr(_this.rowIndexAttrName);
                var columnNum = $(this).attr(_this.columnIndexAttrName);
                var cellNum = _this.isCheckboxCell(_this.data.rows[parseInt(rowNum)][0]) ? columnNum : columnNum - 1;
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
        var $textContain = $cell.find('.txt').length ? $cell.find('.txt') : $cell;
        var $input = $textContain.find('.editting-ele');
        if(!$input.length) {
            return;
        }

        _this.clearSortData();
        var value = _this.htmlEncode($input.val() || '');
        var rowNum = $cell.attr(_this.rowIndexAttrName);
        var columnNum = $cell.attr(_this.columnIndexAttrName);
        var cellNum = _this.isCheckboxCell(_this.data.rows[parseInt(rowNum)][0]) ? columnNum : columnNum - 1;
        var oldValue;
        if(_this.data.rows[rowNum] && _this.data.rows[rowNum][cellNum] !== undefined) {
            if(typeof _this.data.rows[rowNum][cellNum] !== 'object') {
                oldValue = _this.data.rows[rowNum][cellNum];
                _this.data.rows[rowNum][cellNum] = value;
            } else {
                oldValue = _this.data.rows[rowNum][cellNum].value;
                _this.data.rows[rowNum][cellNum].value = value;
            }
        } 
        $textContain.html(value).removeClass('contents');
        $cell.removeClass('editing');
        if(!this.isContainTag(value)) {
            $cell.attr('title', value);
        }
        if($textContain.hasClass('i18n')) {
            $textContain.attr('i18n', value);
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
    clearSortData: function() {
        var originData = this.container.data('originData');
        if(originData) {
            this.container.data('originData', null);//清除排序原始数据，否则会造成维护不当
        }
        $('.cell.sort', this.container).removeClass('sort-1').removeClass('sort-2');
    },
    editCell: function($cell, multiEdit) {
        if($cell.hasClass('editing') || $cell.hasClass('checkbox')) {
            return;
        }
        var $txt = $cell.find('.txt');
        var $textContain = $txt.length ? $txt : $cell;
        var text = $textContain.text() || '', _this = this;
        if(!multiEdit) {
            _this.endEdit();
        }
        var rowNum = $cell.attr(_this.rowIndexAttrName);
        var columnNum = $cell.attr(_this.columnIndexAttrName);
        if(_this.data.onBeforeEdit) {
            var _edit = _this.data.onBeforeEdit(rowNum, columnNum, text);
            if(_edit === false) {
                return;
            }
        }
        var editType = 'input', options = '';
        if(_this.data.rows[rowNum]) {
            var targetCellObj;
            if(_this.isCheckboxCell(_this.data.rows[rowNum][0])) {
                targetCellObj = _this.data.rows[rowNum][columnNum];
            } else {
                targetCellObj = _this.data.rows[rowNum][columnNum - 1];
            }
            if(targetCellObj && typeof targetCellObj !== 'string' && targetCellObj.editType) {
                editType = targetCellObj.editType.type || 'input';
                options = targetCellObj.editType.options;
            }
        }
        $cell.addClass('editing');
        $txt.addClass('contents');
        var justify = $cell.css('justify-content');
        var align = justify === 'flex-end' ? 'right' : justify || 'center';
        if(editType === 'input') {
            $textContain.html('<input class="editting-ele" value="' + text + '" type="text" style="text-align:' + align + '">');
            if(!multiEdit) {
                $textContain.find('input').select().focus();
            }
        } else if(editType === 'select') {
            var select = $('<select class="editting-ele" style="width:100%;text-align-last:' + align + '"></select>');
            if(options && $.isArray(options)) {
                options.forEach(function(v, index) {
                    select.append('<option class="i18n" value="' + v + '">' + v + '</option>');
                    options[index] = v + '';
                });
                if(options.indexOf(text) > -1) {
                    select.val(text);
                }
            }
            $textContain.html('').append(select);   
        }  
    },
    getData: function() {
        var data = JSON.parse(JSON.stringify(this.data.rows));
        return data;
    },
    getRowDataById: function(id) {
        return this.data.rows.filter(function(row) {
            return typeof row[0] === 'object' && row[0].id === id;
        })[0];
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
                rowData = _this.data.rows[parseInt(rowIndex)];
                rowData && data.push(JSON.parse(JSON.stringify(rowData)));
            }   
        });
        return data;
    },
    isCheckboxCell: function(obj) {
        return typeof obj === 'object' && obj.type === 'checkbox'
    },
    getColumnLength: function() {
        let count = 1;
        if(this.data.header && this.data.header.length) {
            if(this.data.header.length > count) {
                count = this.data.header.length;
            }
        }
        var _this = this;
        if(this.data.rows) {
            this.data.rows.forEach(function(item) {
                var leng = item.length;
                item.forEach(function(_item, index) {
                    if(index === 0 && _this.isCheckboxCell(_item)) {
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