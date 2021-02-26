/**
 * by 秋叶(Author blog: https://www.mizuiren.com)
 * [Grid description]
 * @param {[type]} data       [渲染表格用到的数据]
 * @param {[type]} $container [渲染到的容器（jq对象）]
 */
function Grid(data, $container) {
    this.data = data;
    this.data.borderColor = this.data.borderColor || '#ddd';
    this.data.border = this.data.border || 'dotted';
    this.container = $container;
    this.columnLength = this.getColumnLength();
    if(this.data.pageCount) {
        this.page = 1;
    }

    var _this = this;
    this.container.each(function() {
        $.fn.extend(this, {grid: _this});
    });
    
    this.bindEvent();
    this.renderGrid();
}

Grid.prototype = {
    minHeight: '30px',
    rowIndexAttrName: 'data-row-index',
    columnIndexAttrName: 'data-cell-index',
    updateData: function(rowsData) {
        this.data.rows = rowsData;
        var rowsHtml = '';
        var _this = this;
        this.data.rows.forEach(function(rowData, index) {
            if(!_this.validRowData(rowData)) {
                return;
            }
            if(_this.data.pageCount) {
                if((_this.page - 1) * _this.data.pageCount - 1 >= index || index > _this.page * _this.data.pageCount - 1) {
                    return;
                }
            }
            rowsHtml += _this.renderRow(rowData, index, false);
        });
        var $gridBody = $('.q-grid.body', this.container);
        if(!$gridBody.length) {
            this.columnLength = this.getColumnLength();
            this.renderGrid();
        } else {
            rowsHtml += this.getPageControlHtml();
            $gridBody.html(rowsHtml);
            this.updateRowHeight();
        }
        var scrolBox = $('.q-grid-scroll', this.container);
        scrolBox.scrollTop(0);
        this.initUi();
    },
    updateRowHeight: function() {
        var $gridBody = $('.q-grid.body', this.container);
        if(this.data.rows && this.data.rows.length) {
            if(this.data.rowHeight) {
                var rowLength;
                if(this.data.pageCount && this.data.pageCount < this.data.rows.length) {
                    if(this.data.rows.length - (this.page - 1) * this.data.pageCount <= this.data.pageCount) {
                        rowLength = this.data.rows.length - (this.page - 1) * this.data.pageCount;
                    } else {
                        rowLength = this.data.pageCount;
                    }
                    if(this.data.showPage || this.data.showPage === undefined) {
                        rowLength += 1;
                    }
                } else {
                    rowLength = this.data.rows.length;
                }
                //目前过滤已经移到表头，所以以下代码不需要了
                /*if(this.data.filter) {
                    rowLength += 1;
                }*/
                $gridBody.css('grid-template-rows', 'repeat(' + rowLength + ', '+this.numberToPx(this.data.rowHeight, '30px')+')');
            }
        } else {
            $gridBody.css('grid-template-rows', 'repeat(0, 0)');
        }
    },
    solveBorder: function() {
        var $gridBody = $('.q-grid.body', this.container);
        if(this.data.rows && this.data.rows.length) {
            var lastIndex = this.data.pageCount ? (this.data.rows.length > this.page * this.data.pageCount ? this.page * this.data.pageCount : this.data.rows.length) : this.data.rows.length;
            var $lastRows = $('.cell[' + this.rowIndexAttrName +'="'+ (lastIndex - 1) +'"]', $gridBody);
            if($lastRows.length) {
                var bodyHeaderHeight = $('.q-grid.body',this.container).height() + $('.q-grid.header',this.container).height();
                if(this.container.height() < bodyHeaderHeight ||
                    (this.data.pageCount && this.data.showPage !== false)) {
                    $lastRows.css('border-bottom', 'none');
                    this.gridBox.css('border-bottom', '1px ' + this.data.border + ' ' + this.data.borderColor);
                } else {
                    this.gridBox.css('border-bottom', 'none');
                }
            } else {
                this.gridBox.css('border-bottom', 'none');
            }
        } else {
           this.gridBox.css('border-bottom', 'none');
        }
    },
    previousPage: function() {
        this.page--;
        if(this.page > 0) {
           if(this.data.onBeforePageChange) {
                if(!this.data.onBeforePageChange(this.page)) {
                    return;
                }
            }
            this.updateData(this.data.rows);
            if(this.data.onPageChange) {
                this.data.onPageChange(this.page);
            } 
        }
    },
    nextPage: function() {
        this.page++;
        if(this.page <= Math.ceil(this.data.rows.length / this.data.pageCount)) {
           if(this.data.onBeforePageChange) {
                if(!this.data.onBeforePageChange(this.page)) {
                    return;
                }
            }
            this.updateData(this.data.rows);
            if(this.data.onPageChange) {
                this.data.onPageChange(this.page);
            } 
        }
    },
    jumpToPage: function(page) {
        this.page = page * 1;
        if(this.page > 0 && this.page <= Math.ceil(this.data.rows.length / this.data.pageCount)) {
           if(this.data.onBeforePageChange) {
                if(!this.data.onBeforePageChange(this.page)) {
                    return;
                }
            }
            this.updateData(this.data.rows);
            if(this.data.onPageChange) {
                this.data.onPageChange(this.page);
            } 
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
        
        this.data.rows.splice(index, 0, rowData);   
        var newRowHtml = this.renderRow(rowData, index, false);
        
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
        this.initUi();
    },
    updateRow: function(rowData, rowIndex) {
        if(isNaN(rowIndex) || !this.validRowData(rowData) || rowIndex === undefined || rowIndex < 0 ||  rowIndex > this.data.rows.length - 1) {
            return;
        }
        rowIndex = +rowIndex;
        var $body = $('.q-grid.body', this.container);
        var isSelected = $('.cell['+this.rowIndexAttrName+'="'+rowIndex+'"]', $body).hasClass('selected');
        this.deleteRow(rowIndex);
        this.appendRow(rowData, rowIndex);
        if(isSelected) {
            $('.cell['+this.rowIndexAttrName+'="'+rowIndex+'"]', $body).addClass('selected');
        }
        this.solveBorder();
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
        if(realLength > this.columnLength) {
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
        if(!this.isContainTag(newValue) && this.data.hoverTitle !== false) {
            $cell.attr('title', newValue);
        }
    },
    isContainTag: function(string) {
        return (string + '').match(/<(\S*?) [^>]*>/);
    },
    getColumnWidth: function() {
        //每列的宽度
        var cwidth = new Array(this.columnLength).fill('1fr');
        var hadCheckedData = this.isCheckboxCell(this.data.header[0]);
        this.data.header.forEach(function(item, index) {
            if(item.width !== undefined && item.width !== 'auto') {
                cwidth[hadCheckedData ? index : index + 1] = item.width;
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
        var gridBoxStyles = ['width:100%;height: 100%','border-top:1px '+this.data.border+' '+this.data.borderColor];
        if(!this.data.freezeHeader) {
            gridBoxStyles.push('overflow-y:overlay');
        } 
        this.gridBox = $('<div class="q-grid-box" style="' + gridBoxStyles.join(';') + '"></div>');
        this.container.append(this.gridBox);
        this.columnLength = this.columnLength + 1;//checkbox多一列
        
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
            var checkboxHtml = '<input type="checkbox" class="check-all"/><span></span>';
            if(this.isCheckboxCell(newHeader[0])) {
                newHeader[0].value = checkboxHtml;
            } else {
                newHeader.unshift({value:checkboxHtml, id: 'id', type: 'checkbox'});
            }

            header = $('<header class="q-grid header" style="' + this.gridStyles.join(';') + '"></header>');
            header.append(this.renderRow(newHeader, 0, 'header'));
            header.append(this.getFilterRow());
            this.gridBox.append(header);
        }

        var bodyGridStyles = JSON.parse(JSON.stringify(this.gridStyles));
        if(this.data.showHeader) {
            bodyGridStyles.push('margin-top:-1px');
        }
        var scrolBoxStyles = [];
        if(!this.data.width || this.data.width !== '100%') {
            scrolBoxStyles.push('width: ' + (parseInt(this.data.width)) + 'px');
        }
        if(this.data.freezeHeader) {
            var defaultHeaderHeight = 24; //dom不可兼得情况下渲染表格header.outerHeight()取不到高度，所以这种情况暂时给个默认高度
            if(this.data.filter) {
                defaultHeaderHeight = defaultHeaderHeight * 2;
            }
            if(this.data.height && this.data.height !== 'auto') {
                scrolBoxStyles.push('max-height: ' + (parseInt(this.data.height) - (header ? (header.outerHeight() || defaultHeaderHeight) : 0)) +'px;overflow-y: auto;overflow-y:overlay;');
            } else {
                scrolBoxStyles.push('max-height: calc(100% - ' + (header ? (header.outerHeight() || defaultHeaderHeight) : 0) +'px);overflow-y: auto;overflow-y:overlay;');
            }
        }
        var scrolBox = $('<div style="' + scrolBoxStyles.join(';') + '" class="q-grid-scroll"></div>');
        var contentBox = $('<div class="q-grid body" tabindex="1" style="' + bodyGridStyles.join(';') + '"></div>');
        contentBox.css('width', '100%');

        if(this.data.rows && this.data.rows.length) {
            var rowsHtml = '';
            var _this = this;
            this.data.rows.forEach(function(rowData, index) {
                if(_this.data.pageCount) {
                    if((_this.page - 1) * _this.data.pageCount - 1 >= index || index > _this.page * _this.data.pageCount - 1) {
                        return;
                    }
                }
                rowsHtml += _this.renderRow(rowData, index, false);
            });
            rowsHtml += this.getPageControlHtml();
            contentBox.append(rowsHtml);
        }

        scrolBox.append(contentBox);
        this.gridBox.append(scrolBox);
        this.updateRowHeight();
        this.initUi();
    },
    getPageControlHtml: function() {
        if(this.data.showPage === false) {
            return '';
        }
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
                rowsHtml += '<div style="display: flex;align-items: center;justify-content: flex-end;grid-column-start: 1;grid-column-end: ' + (this.columnLength + 1) + ';border: 1px ' + this.data.border + ' ' + this.data.borderColor +';border-bottom: none">';
                rowsHtml += pageInit(this.page, Math.ceil(this.data.rows.length / this.data.pageCount), '');
                rowsHtml += '&nbsp;&nbsp;&nbsp;&nbsp;</div>';
            }
        }
        return rowsHtml;
    },
    getFilterRow: function() {
        if(this.data.filter) {
            var inputHtml = '<input class="filter" placeholder="Filter" type="text"/><span class="filter-cancel" style="display:none;"></span>';
            var filterInputs = new Array(this.columnLength - 1).fill(inputHtml);
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
        if(this.data.rows && this.data.rows.length) {
            var needDisabledHeader = true;
            this.data.rows.forEach(function(arr, index) {
                if(_this.isCheckboxCell(arr[0])) {
                    if(_this.data.checkbox && arr[0].checked) {
                        _this.checkOne(index, {notTriggerEvent: true});
                    }
                    if(_this.data.selectable && arr[0].selected) {
                        $('.q-grid.body .cell[data-row-index=' + index + ']', _this.container).addClass('selected');
                    }
                    if(!arr[0].disabled) {
                        needDisabledHeader = false;
                    }
                } else {
                    needDisabledHeader = false;
                }
            });
            $('.check-all', this.container).prop('disabled', needDisabledHeader);
        }
        if(this.data.header && this.isCheckboxCell(this.data.header[0]) && this.data.header[0].checked === true) {
            $('.check-all', this.container).prop('checked', true).trigger('change');
        }
        this.solveBorder();
    },
    renderRow: function(rowData, rowIndex, isHeader) {
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
        if(_this.getCellLength(cloneColumnData) < _this.columnLength) {
            cloneColumnData = cloneColumnData.concat(new Array(_this.columnLength - cloneColumnData.length).fill(''));
        }
        var cellStyles, classes, needSort, resizeLine, value, columnSeting, attrs;
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
				cellStyles.push('margin-top: -1px');
            }
            if(_this.data.checkbox) {
                if(index !== 0) {
                    cellStyles.push('margin-left: -1px');
                } 
            } else {
                if(index !== 1 && index !== 0) {
                    cellStyles.push('margin-left: -1px');
                }
            }
            
            classes = ['cell'];
            attrs = '';
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
                if(item.attributes) {
                    for(var name in item.attributes) {
                        if(item.attributes.hasOwnProperty(name)) {
                            attrs += ' ' + name + '="' + item.attributes[name] + '"';
                        }
                    }
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
            if(isHeader) {
                cellStyles.push('border-top: none');
            }
            var hoverTitle = _this.data.hoverTitle === false ? '': index === 0 || rowIndex === 'filterRow' ? '' : _this.isContainTag(value) ? '' : value;
            var needSpan = isHeader || (columnSeting && columnSeting.ellipsis);
            cellsHtml += '<div' + (needSpan ? '' : attrs) + ' ' + id + ' class="' + classes.join(' ') + '" data-cell-index="' + index + '" data-row-index="' + rowIndex + '" style="' + cellStyles.join(';') + '" title="' + hoverTitle + '">';
            
            if(needSpan) {
                cellsHtml += '<span' + (needSpan ? attrs : '') + ' class="' + (rowIndex === 'filterRow' ? 'contents ' : ' ')  + 'txt '+(columnSeting && columnSeting.ellipsis ? 'ellipsis' : '')+'">' + value +'</span> ' + (needSort ? '<span class="sort-icon"> </span>' : '');
            } else {
                cellsHtml += value;
            }
            if(isHeader) {
                if(index !== cloneColumnData.length - 1 && !_this.data.dilatationResize) {
                    cellsHtml += resizeLine;
                } else if(_this.data.dilatationResize) {
                    cellsHtml += resizeLine;
                }
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
            if(_this.data.rows && _this.data.rows.length && _this.data.rows[parseInt(rowNum)]) {
                var needSelect = _this.data.onBeforeSelect(_this.data.rows[parseInt(rowNum)], evt);
                if(needSelect === false) {
                    return;
                } 
            }
            
        }
        if(!multiSelect) {
            _this.unSelectAll();
        }
        var checkObj = this.isCheckboxCell(this.data.rows[rowNum][0]);

        if(checkObj) {
            this.data.rows[rowNum][0].selected = true;
        }
        $('.cell[data-row-index="' + rowNum + '"]', $parent).addClass('selected');
        if(!evt || !evt.notTriggerEvent) {
            if(_this.data.onSelect && _this.data.rows.length && _this.data.rows[parseInt(rowNum)]) {
                _this.data.onSelect(_this.data.rows[parseInt(rowNum)], rowNum);
            }
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
                    var selectFn = selectStatu ? _this.selectRow : _this.unSelectRow;
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
        var checkObj = this.isCheckboxCell(this.data.rows[rowNum][0]);

        if(checkObj) {
            this.data.rows[rowNum][0].selected = false;
        }
        $('.q-grid.body .cell.selected[data-row-index="' + rowNum + '"]', this.container).removeClass('selected');
        if(this.data.onUnSelect && this.data.rows.length && this.data.rows[parseInt(rowNum)]) {
            this.data.onUnSelect(this.data.rows[parseInt(rowNum)], rowNum);
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
        if(this.data.header && this.isCheckboxCell(this.data.header[0])) {
            this.data.header[0].checked = true;
        }
        $('.body .checkbox input', this.container).each(function() {
            rowNum = $(this).closest('.cell').attr(_this.rowIndexAttrName);
            _this.checkOne(rowNum, fromEvent);
        });
    },
    unCheckAll: function(fromEvent) {
        var rowNum, _this = this;
        if(this.data.header && this.isCheckboxCell(this.data.header[0])) {
            this.data.header[0].checked = false;
        }
        $('.body .checkbox input', this.container).each(function() {
            rowNum = $(this).closest('.cell').attr(_this.rowIndexAttrName);
            _this.unCheckOne(rowNum, fromEvent);
        });
    },
    isAllChecked: function() {
        var isAllChecked = true, allcheckInput = $('.q-grid.body .checkbox input', this.container), length = allcheckInput.length;
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
        if(isNaN(rowNum) || $input.prop('checked') || (fromEvent && !fromEvent.notTriggerEvent && $input.prop('disabled'))) {
            return;
        }
        $input.prop('checked', true);
        var checkObj = this.isCheckboxCell(this.data.rows[rowNum][0]);
        if(checkObj) {
            this.data.rows[rowNum][0].checked = true;
        }

        if(this.isAllChecked()) {
            $('.check-all', this.container).prop('checked', true);
            if(this.data.header && this.isCheckboxCell(this.data.header[0])) {
                this.data.header[0].checked = true;
            }
        }
        if(!fromEvent || !fromEvent.notTriggerEvent) {
            if(this.data.onCheck && this.data.rows.length && this.data.rows[parseInt(rowNum)]) {   
                this.data.onCheck(this.data.rows[parseInt(rowNum)]);
            }
            if(this.data.onCheckAll) {
                if(!$('.cell.checkbox input:not(":checked")', $('.body', this.container)).length) {
                    this.data.onCheckAll(this.data.rows);
                }
            }
        }
        
        if(this.data.selectWhenCheck && this.data.selectable) {
            this.selectRow(rowNum, {notTriggerEvent: fromEvent && fromEvent.notTriggerEvent},  !!this.data.multiSelect);
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
            if(this.data.header && this.isCheckboxCell(this.data.header[0])) {
                this.data.header[0].checked = false;
            }
        }

        if(this.data.onUnCheck && this.data.rows.length && this.data.rows[parseInt(rowNum)]) {   
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
            var columnNum = $(this).attr(_this.columnIndexAttrName);
            var __this = this;
            _this.shortTimer = setTimeout(function() {
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
                
                if(evt.target.tagName !== 'INPUT') {
                    _this.endEdit();
                }
                if(_this.data.onClick) {
                    if(_this.data.rows.length && _this.data.rows[rowNum]) {
                        var cellNum =  _this.isCheckboxCell(_this.data.rows[rowNum][0]) ? columnNum : columnNum - 1;
                        _this.data.onClick(_this.data.rows[rowNum], _this.data.rows[rowNum][cellNum] || '', evt);
                    }
                }
                
                if(_this.data.editable && !$(__this).hasClass('editing') && _this.data.editWhenClick) {
                    _this.editCell($(__this));
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
            }, 50);
        }).on('click.grid', '.pages a', function(evt) {
            var page = $(this).attr('page');
            if(isNaN(page)) {
                return false;
            }
            _this.page = page * 1;
            if(_this.data.onBeforePageChange) {
                if(!_this.data.onBeforePageChange(_this.page)) {
                    return;
                }
            }
            _this.updateData(_this.data.rows);
            if(_this.data.onPageChange) {
                _this.data.onPageChange(_this.page);
            }
            return false;
        }).off('focus.grid').on('focus.grid', '.cell input.filter', function() {
            $(this).closest('.cell').find('.filter-cancel').show();
        }).off('blur.grid').on('blur.grid', '.cell input.filter', function() {
            var eThis = this;
            setTimeout(function() {
                if(!$(eThis).val()) {
                    $(eThis).closest('.cell').find('.filter-cancel').hide();
                }
            }, 100);
        }).on('click', '.filter-cancel', function() {
            $(this).closest('.cell').find('input').val('').trigger('input');
            $(this).hide();
        }).off('keyup.grid').on('keyup.grid', '.editting-ele', function(evt) {
            if(evt.keyCode === 13) {//按enter键
                var thisContainer = $(this).closest('.q-grid-box').parent()[0];
                if(thisContainer) {
                    thisContainer.grid.endEditOne($(this).closest('.cell'));
                }
            }
        }).on('keyup.grid', function(evt) {
            if(evt.keyCode === 16) {//shift键抬起恢复到可选文字状态
                _this.container.removeClass('noneselect');
            }
        }).off('keydown.grid').on('keydown.grid', function(evt) {
            if(evt.keyCode === 16) {//shift键按下变成不可选文字状态
                _this.container.addClass('noneselect');
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
                    cellIndex = $filterInputs.eq(i).closest('.cell').attr(_this.columnIndexAttrName) - 1;
                    shouldMatchData = _this.isCheckboxCell(rowData[0]) ? rowData[cellIndex + 1] : rowData[cellIndex];
                    string = typeof shouldMatchData === 'string' ||  typeof shouldMatchData === 'number' ? shouldMatchData + '' : shouldMatchData.value;
                    val = $filterInputs.eq(i).val();
                    if(!val) {
                        continue;
                    }
                    if(string.toLowerCase().indexOf(val.toLowerCase()) === -1) {
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
            clearTimeout(_this.shortTimer);
            _this.container.addClass('noneselect');
            var $cell = $(this).parent(), cellLeft = $cell.offset().left;
            var cellIndex = $cell.attr(_this.columnIndexAttrName) - 1;
            var $header = $('.q-grid.header', _this.container);
            var $body = $('.q-grid.body', _this.container);
            var $resizeBar = $(this);
            var columnWidths = _this.getColumnWidth().split(' ');
            var originX = evt.pageX;
            var currentX, lastX = 0, minWidth = 30, maxWidth = 500;
            $resizeBar.addClass('isDraging');
            var gridBoxX = _this.gridBox.offset().left;
            var $resizeTipLine = $('<div class="resize-tip-line" style="left:' + ($resizeBar.offset().left - gridBoxX) + 'px;"></div>');
            _this.gridBox.append($resizeTipLine);
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
            var fixedColumnWidths = [], cellWidth;
            $('.q-grid.header .cell[data-row-index="0"]', _this.container).each(function() {
                cellWidth = $(this).outerWidth() - 1;
                if(cellWidth <= 2) {//小于2说明是隐藏的单元格，不能让其显示出来，哪怕漏出1px
                    cellWidth = 0;
                }
                fixedColumnWidths.push(cellWidth + 'px');
            });
            var $documentBody = $('body');
            var bodyCursor = $documentBody.css('cursor');
            $documentBody.attr('origin-cursor', bodyCursor || 'default').css('cursor', 'col-resize');
            var bodyWidth = $body.outerWidth();
            $(document).on('mousemove.grid', function(e) {
                currentX = e.pageX;
                if(Math.abs(currentX - originX) < 3) {//微距防抖，避免双击的时候抖动导致双击错主体
                    return;
                }
                var newWidth = currentX - cellLeft;
                if(_this.data.dilatationResize) {
                    var addWidth;
                    if((newWidth > minWidth && newWidth < maxWidth)) {
                        addWidth = currentX - originX; 
                    } else if((newWidth < minWidth && currentX - lastX > 0) || (newWidth > maxWidth && currentX - lastX < 0)) {
                        //在双击调节线的时候宽度可能会在范围之外，这个时候要使其能拖回去
                        addWidth = $resizeTipLine.offset().left - originX;
                    }
                    _this._addColumnWidth(addWidth, cellIndex + 1, JSON.parse(JSON.stringify(fixedColumnWidths)), bodyWidth);
                    $resizeTipLine.css('left', ($resizeBar.offset().left - gridBoxX) + 'px');
                } else {
                    if(newWidth < minWidth) {
                        newWidth = minWidth;
                    } else if(newWidth > maxWidth) {
                        newWidth = maxWidth;
                    }
                    var percent = (newWidth / width * 100) + '%';
                    columnWidths[cellIndex + 1] = percent;
                    if(newWidth > minWidth && newWidth < maxWidth) {//最小宽度30, 最大宽度500
                        var allPxWidth = 0, numberVal; 
                        columnWidths.forEach(function(setting, index) {
                            if(typeof setting === 'number' || !isNaN(setting)) {
                                numberVal = setting * 1;
                            } else if(setting.match(/\d+%$/)) {
                                numberVal = (parseFloat(setting)) / 100 * width;
                            } else  if(setting.match(/\d+px$/)) {
                                numberVal = parseFloat(setting);
                            } else {
                                numberVal = minWidth;
                            }
                            allPxWidth += numberVal > minWidth || numberVal === 0 ? numberVal : minWidth;
                        });
                        //重算该列的宽度，使其刚好撑满整个容器
                        if(allPxWidth > width) {
                           newWidth = width - (allPxWidth - newWidth);
                           percent = (newWidth / width) * 100 + '%';
                           columnWidths[cellIndex + 1] = percent;
                        }
                        _this.data.header[cellIndex].width = percent;
                    }
                    if(_this.listenResize) {
                        _this.gridBox.css('width', '100%');
                        clearInterval(_this.listenResize);
                        _this.listenResize = null;
                    }
                    $header.css('grid-template-columns', columnWidths.join(' '));
                    $body.css('grid-template-columns', columnWidths.join(' '));
                    $resizeTipLine.css('left', ($resizeBar.offset().left - gridBoxX) + 'px');
                }
                lastX = e.pageX;
            });
            
            $(document).on('mouseup.grid', function(e) {             
                $(document).off('mousemove.grid');
                $(document).off('mouseup.grid');
                $documentBody.css('cursor', $documentBody.attr('origin-cursor'));
                $resizeTipLine.remove();
                $resizeBar.removeClass('isDraging');
                _this.container.removeClass('noneselect');
            });
        }).off('dblclick.grid').on('dblclick.grid', 'header.q-grid .cell .resizebar', function(evt) {
            var $cell = $(this).parent();
            var fontSize = $cell.css('fontSize') || '12px';
            var oldWidth = $cell.outerWidth();
            var cellIndex = $cell.attr(_this.columnIndexAttrName) - 1;
            if(_this.data.rows.length) {
                var maxLength = 0, maxLengthValue = 'xxx', cellValue;
                _this.data.rows.forEach(function(rowData) {
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
                var spanContainer = $('<span style="font-size:' + fontSize + '">' + maxLengthValue  + '占位</span>');
                $('body').append(spanContainer);
                var maxLengthWidth = spanContainer.width();
                $(spanContainer).remove();
                _this._addColumnWidth(maxLengthWidth - oldWidth, cellIndex + 1);
            }  
        }).on('mousedown.grid', 'header.q-grid .cell.sort', function(evt) {
            if($(evt.target).hasClass('search-icon' || $(evt.target).hasClass('resizebar')) || evt.button !== 0) {
                return;
            }
            var eThis = this;
            _this.endEdit();
            _this.shortTimer = setTimeout(function() {
                var cellIndex = $(eThis).attr(_this.columnIndexAttrName) - 1;
                if($(evt.target).hasClass('resizebar')) {    
                    return;
                }
                var useUserFn = typeof _this.data.header[_this.isCheckboxCell(_this.data.header[0]) ? cellIndex + 1 : cellIndex].sort === 'function';
                $(eThis).siblings('.sort').removeClass('sort-1').removeClass('sort-2');
                var sortType;
                if($(eThis).hasClass('sort-1')) {
                    $(eThis).removeClass('sort-1');
                    sortType = 0;
                    var originData = _this.container.data('originData');
                    if(originData) {
                        _this.updateData(originData);
                        if(_this.data.onSort) {
                            _this.data.onSort(sortType);
                        }
                        return;
                    }
                } else if($(eThis).hasClass('sort-2')) {
                    $(eThis).addClass('sort-1');//顺序
                    $(eThis).removeClass('sort-2');
                    sortType = 2;
                } else {
                    $(eThis).addClass('sort-2');//倒序
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
            }, 200);
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
        }).on('dblclick.grid', '.body .cell', function(evt) {
            if($(this).hasClass('checkbox')) {
                return;
            }
            clearTimeout(_this.shortTimer);
            if(evt.target.tagName !== 'INPUT') {
                _this.endEdit();
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
                    if(_this.data.rows && _this.data.rows.length && _this.data.rows[parseInt(rowNum)]) {
                        _this.data.onDblclick(_this.data.rows[parseInt(rowNum)], _this.data.rows[parseInt(rowNum)][cellNum] || '', evt);
                    }
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
                if(_this.data.rows && _this.data.rows.length && _this.data.rows[parseInt(rowNum)]) {
                    _this.data.onContextmenu(_this.data.rows[parseInt(rowNum)], _this.data.rows[parseInt(rowNum)][cellNum] || '', evt);
                }
            }
            return false;
        }).on('mousedown.grid', '.body .cell', function(evt) {   
            if(!_this.data.dragable) {
                return;
            }
            _this.container.addClass('noneselect');
            var rowNum = +$(this).attr(_this.rowIndexAttrName);
            var rowCells = $('.body .cell[data-row-index="' + rowNum + '"]', _this.container);
            var offsetY = evt.pageY - $(this).offset().top;
            var beginDrag = false;
            var thisCell = $(this);
            var cacheY = {}, hadReadRow = {}, tipLine;
            _this.shortTimer = setTimeout(function() {
                var thisRowNum;
                $('.body .cell', _this.container).each(function() {
                    thisRowNum = $(this).attr(_this.rowIndexAttrName);
                    if(!hadReadRow[thisRowNum]) {
                        cacheY[thisRowNum] = {
                            top: $(this).offset().top,
                            height: $(this).outerHeight()
                        };
                        hadReadRow[thisRowNum] = true;
                    }
                });

                var lastCell = $(rowCells[rowCells.length - 1]);
                var lastTop = lastCell.offset().top;
                var placeholder = lastCell.clone(true).empty();
                placeholder.attr({
                    'class': 'placeholder',
                    'data-row-index': 'null'
                }).css({
                    'grid-column': '1 / ' + ( _this.columnLength + 1),
                    'border': 'none',
                    'background': '#ddd',
                    'height': lastCell.outerHeight(),
                });
                lastCell.after(placeholder);

                tipLine = $('<div></div>').css({
                    'width': thisCell.parent().width(),
                    'height': '1px',
                    'border-top': '1px dotted rgb(228, 108, 108)',
                    'position': 'fixed',
                    'top': lastTop,
                    'z-index': 6
                }).attr('class', 'baseline');
                lastCell.after(tipLine);
                
                rowCells.each(function() {
                    $(this).css({
                        'left': $(this).offset().left, 
                        'width': $(this).outerWidth(),
                        'height': $(this).outerHeight(), 
                        'opacity': .7,
                        'z-index': 5,
                        'top': lastTop,
                        'cursor': 'move'
                    }).addClass('draging');
                });
                rowCells.css({'position': 'fixed'});//这个必须单独写， 否则获取宽度异常
                beginDrag = true;
                var lastY = evt.pageY, currentY;
                var currentPageMaxRowNum = _this.data.pageCount ? (_this.page === Math.ceil(_this.data.rows.length / _this.data.pageCount) ? _this.data.rows.length - 1 : _this.data.pageCount * _this.page - 1) : _this.data.rows.length - 1;
                if(rowNum === currentPageMaxRowNum) {
                    $('.body .cell[data-row-index="' + (currentPageMaxRowNum - 1) + '"]', _this.container).css('border-bottom', '1px '+ _this.data.border + ' ' + _this.data.borderColor);
                }
                $(document).on('mousemove.grid', function(e) {
                    if(!beginDrag) {
                        return;
                    }
                    currentY = e.pageY;
                    if(currentY > cacheY[currentPageMaxRowNum].top + cacheY[currentPageMaxRowNum].height / 2) {
                        tipLine.css('top', cacheY[currentPageMaxRowNum].top + cacheY[currentPageMaxRowNum].height).attr('index', currentPageMaxRowNum);
                    } else {
                        for(var index in cacheY) {
                            if(currentY - lastY > 0) {//往下拖
                                if(currentY < cacheY[index].top + cacheY[index].height / 2) {
                                    tipLine.css('top', cacheY[index].top).attr('index', +index > rowNum ? index - 1 : index);
                                    break;
                                }
                            } else {//往上拖
                                if(currentY < cacheY[index].top + cacheY[index].height/2) {
                                    tipLine.css('top', cacheY[index].top).attr('index', index);
                                    break;
                                }
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
                    clearTimeout(_this.shortTimer);
                    var finalIndex = +tipLine.attr('index');
                    var delay = 100; 
                    placeholder.remove();
                   $('.body .cell', _this.container).each(function() {
                        thisRowNum = $(this).attr(_this.rowIndexAttrName);
                         var __this = this;
                        if(!isNaN(thisRowNum)) {
                            thisRowNum = +thisRowNum;
                            if(finalIndex > rowNum) {
                                if(thisRowNum > rowNum && thisRowNum <= finalIndex) {
                                    $(this).animate({'margin-top': -lastCell.outerHeight()}, delay, function() {
                                        $(__this).css('margin-top', '-1px');
                                    });
                                }
                            } else {
                                if(thisRowNum >= finalIndex && thisRowNum <= rowNum) {
                                    $(this).animate({'margin-bottom': -lastCell.outerHeight()}, delay, function() {
                                        $(__this).css('margin-bottom', '0px');
                                    });
                                }
                            }
                        } 
                    });
                    setTimeout(function() {
                        rowCells.each(function() {
                            $(this).css({
                                'position': 'relative', 
                                'left': 0, 
                                'opacity': 1, 
                                'top': 0,
                                'z-index': 0,
                                'cursor': 'default',
                                'width': '',
                                'height': ''
                            });
                            $(this).removeClass('draging');
                        });
                        
                        if(rowNum !== finalIndex) {
                            if(finalIndex <= 0) {
                                $('.body .cell:first', _this.container).before(rowCells);
                            } else {
                                $('.body .cell[data-row-index="' + (finalIndex > rowNum ? finalIndex : finalIndex - 1) + '"]:last', _this.container).after(rowCells);
                            }
                            
                            var _rowNum;
                            $('.body .cell', _this.container).each(function() {
                                _rowNum = +$(this).attr(_this.rowIndexAttrName);
                                if(finalIndex - rowNum > 0) {
                                    if(_rowNum > rowNum && _rowNum <= finalIndex) {
                                        $(this).attr(_this.rowIndexAttrName, _rowNum - 1);
                                    }
                                } else {
                                    if(_rowNum >= finalIndex && _rowNum < rowNum) {
                                        $(this).attr(_this.rowIndexAttrName, _rowNum + 1);
                                    }
                                }
                            });
                            if(finalIndex - rowNum > 0 || finalIndex - rowNum < 0) {
                                var adjustRowData = _this.data.rows[rowNum];
                                rowCells.attr(_this.rowIndexAttrName, finalIndex);
                                _this.data.rows.splice(rowNum, 1);
                                _this.data.rows.splice(finalIndex, 0, adjustRowData); 
                            }
                        }
                        tipLine.remove();
                        _this.container.removeClass('noneselect');
                        _this.solveBorder();
                        beginDrag = false;
                   }, delay);                  
                });
            }, 200);  
        }).on('mouseup.grid', '.body .cell', function(evt) {
            _this.container.removeClass('noneselect');
            clearTimeout(_this.shortTimer);
        });
        $(document).off('click.grid').on('click.grid', function(evt) {
            if(!$(evt.target).closest('.cell').length) {
                $('.q-grid.body .cell.editing').each(function() {
                    let $container = $(this).closest('.q-grid-box').parent();
                    $container[0] && $container[0].grid.endEditOne($(this));
                })
            }
        });
    },
    _addColumnWidth: function(addWidth, columnIndex, fixedColumnWidths, bodyWidth) {
        //把响应式列宽转为固定列宽
        var _this = this;
        var $header = $('.q-grid.header', _this.container);
        var $body = $('.q-grid.body', _this.container);
        var columnWidths = _this.getColumnWidth().split(' ');
        var cellWidth;
        var newBodyWidth = 0;
        if(fixedColumnWidths) {
            fixedColumnWidths[columnIndex] = (parseFloat(fixedColumnWidths[columnIndex]) + addWidth) + 'px';
            newBodyWidth += bodyWidth + addWidth;
        } else {
            fixedColumnWidths = [];
            $('.cell[data-row-index="0"]', $body).each(function(index) {
                cellWidth = $(this).outerWidth() - 1;
                if(cellWidth <= 2) {//小于2说明是隐藏的单元格，不能让其显示出来，哪怕漏出1px
                    cellWidth = 0;
                }
                if(columnIndex === index) {
                    cellWidth += addWidth;
                }
                newBodyWidth += cellWidth;
                fixedColumnWidths.push(cellWidth + 'px');
            });
        }
        
        
        _this.container.css({'overflow-x': 'auto', 'overflow-y': 'hidden', 'padding-bottom': '5px'});
        _this.gridBox.css('width', newBodyWidth - 1 + 'px');
        $header.css('grid-template-columns', fixedColumnWidths.join(' '));
        $body.css('grid-template-columns', fixedColumnWidths.join(' '));
        if(!_this.listenResize) {
            var beforeChangeWidth = _this.container.width();
           _this.listenResize = setInterval(function() {
                if(_this.container.width() !== beforeChangeWidth) {
                    _this.gridBox.css('width', '100%');
                    $header.css('grid-template-columns', columnWidths.join(' '));
                    $body.css('grid-template-columns', columnWidths.join(' '));
                    clearInterval(_this.listenResize);
                    _this.listenResize = null;
                }
            }, 30);
        }
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
        if(!this.isContainTag(value) && this.data.hoverTitle !== false) {
            $cell.attr('title', value);
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
                    select.append('<option value="' + v + '" ' + (text === v ? 'selected' : '') + '>' + v + '</option>');
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
    getSelectedrowNumbers: function() {
        var obj = {}, arr = [], rownum;
        var _this = this;
        $('.q-grid.body .cell.selected', this.container).each(function() {
            rownum = $(this).attr(_this.rowIndexAttrName);
            if(!obj[rownum]) {
                arr.push(+rownum);
                obj[rownum] = true;
            }
        });
        return arr;
    },
    getSelectedData: function() {
        var data = [], hadGetData = {}, rowIndex, rowData, _this = this;
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
        var data = [], rowIndex, rowData, _this = this;
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
        var count = 1;
        if(this.data.header && this.data.header.length) {
            var headerLength = this.isCheckboxCell(this.data.header[0]) ? this.data.header.length - 1 : this.data.header.length;
            if(headerLength > count) {
                count = headerLength;
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