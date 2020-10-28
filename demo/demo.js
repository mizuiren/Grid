let gridData = {
    showHeader: true,
    dragable: false,
    header: [
        {
            value:'姓名', 
            id: 'name', 
            width: '20%', //缺省写auto,支持写百分比,注意如果数字和auto混合，所有数字之和不得等于或大于100%宽度，纯数字的话，所有之和应小于等于100%
            sort: function(a,b) {
                var _a = typeof a === 'object' ? a.value : a;
                var _b = typeof b === 'object' ? b.value : b;
                if(Number(_a) > Number(_b)) {
                    return 1;
                } else if(Number(_b) > Number(_a)) {
                    return -1;
                } else {
                    return 0;
                }
            },
            resizeable: false
        }, 
        {
            value:'年龄', 
            id: 'age', 
            width: '20%', 
            sort: false,
            resizeable: true
        }, 
        {
            value:'出生年月', 
            id: 'birth', 
            width: '20%', 
            sort: true,
            resizeable: true
        }, 
        {
            value:'性别', 
            id: 'sex', 
            width: '1fr', 
            sort: true,
            resizeable: true
        },
        {
            value:'昵称', 
            id: 'nickname', 
            width: '1fr', 
            sort: true,
            resizeable: true
        }],//表头
    freezeHeader: true,
    editable: true,
    multiSelect: true,
    selectable: true,
    selectWhenCheck: true,
    editWhenClick: false,
    border: 'dotted',//none solid dashed dotted
    rowGap: 0,
    columnGap: 0,
    width: '100%',
    rowHeight: '30px',
    height: 300,
    pageCount: 10,
    rows: [
        ['7.1','7.2','7.3','7.4', '7.5'],
        ['8.1','8.2','8.3','8.4', '8.5'],
        ['1.1','1.2','1.3','1.4', '1.5'],
        [{id: 'myRow', type: 'checkbox', checked:true, disabled:true}, '2.1','2.2','2.3','2.4', '2.5'],
        [{id: 'special-row', type: 'checkbox'},'3.1', '3.2','3.3','3.4', '3.5'],
        [{value: '4.1',editType: {type: 'select', options: [1,2,3,4,5,6]}},'4.2','4.3','4.4', '4.5'],
        ['5.1','5.2','5.3','5.4', '5.5'],
        ['6.1','6.2','6.3',{value:'6.4', style: 'color:red;'}, '6.5'],
        ['9.1','9.2','9.3','9.4', '9.5'],
        ['10.1','10.2','10.3','10.4', '10.5'],
        ['11.1','11.2','11.3','11.4', '11.5'],
        ['12.1','12.2','12.3','12.4', '12.5'],
    ],
    onSelect: function(rowData, evt) {
        //console.log('onSelect', rowData, evt);
    },
    onClick: function(rowData, cellData, evt) {
        //console.log('onClick', rowData, cellData, evt);
    },
    onUnSelect: function(rowData, evt) {
        //console.log('onUnSelect', rowData, evt);
    },
    onSelectAll: function(data, evt) {
        //console.log('onSelectAll', data, evt);
    },
    onBeforeSelect: function(rowData, evt) {
        //console.log('onBeforeSelect', cellData, evt);
    },
    onCheck: function(rowData) {
        //console.log('onCheck', rowData);
    },
    onUnCheck: function(rowData) {
        //console.log('onUnCheck', rowData);
    },
    onBeforEdit: function(rowNum, columnNum, oldValue) {
        //console.log('onBeforEdit', rowNum, columnNum, oldValue);
    },
    onEdit: function(rowNum, columnNum, oldValue, newValue) {
        //console.log('onEdit', rowNum, columnNum, oldValue, newValue);
    },
    onContextmenu: function(rowData, cellData, evt) {
        //console.log('onContextmenu', rowData, cellData, evt);
    },
    onDblclick: function(rowData, cellData, evt) {
        //console.log('onDblclick', rowData, cellData, evt);
    }
    //more...
}

let index = 0, grid, 
tips = [
    {
        title:'header字段sort: false或无sort',
        des: '关闭排序功能',
        id: -1
    },
    {
        title: 'checkbox: true',
        des: '',
        id: 1
    },
    {
        title: 'filter: true',
        des: '通过过滤框可以过滤数据了，支持并发过滤',
        id: 2
    },
    {
        title: 'freezeHeader:false 或 无freezeHeader',
        des: '试试拖动滚动条看效果吧，表头它会跟着内容滚动啦！',
        id: 3
    },
    {
        title: 'editable:false 或 无editable',
        des: '试试双击表格，编辑不了啦！',
        id: 4
    },
    {
        title: 'multiSelect: false 或 无multiSelect',
        des: '试试按住ctrl，左键点击多行表格，不能多选啦！即使勾选也不能哦。',
        id: 5
    },
    {
        title: 'selectable: false 或 无selectable',
        des: '试试单击表格，不能选择高亮所属表格行啦！',
        id: 6
    },
    {
        title: 'selectWhenCheck: false 或 无selectWhenCheck',
        des: '试试勾选复选框，不能通过勾选复选框来选择表格行啦！',
        id: 7
    },
    {
        title: 'editWhenClick: true',
        des: '试试点击表格，表格可以编辑啦！',
        id: 8
    },
    {
        title: "width: '50px 200px 1fr 1fr 1fr'",
        des: '1fr表示剩余可分配宽度/剩余待分配宽度的列的数量，具体看flex布局属性grid-template-columns说明哦！',
        id: 9
    },
    {
        title: "width: '100px auto auto 50px auto'",
        des: 'auto会被识别为1fr哦！',
        id: 10
    },
    {
        title: '无width',
        des: '没有定义宽度则平均分配哦！',
        id: 11
    },
    {
        title: 'border: none',
        des: '',
        id: 12
    },
    {
        title: 'border: solid',
        des: '',
        id: 13
    },{
        title: 'border: dashed',
        des: '',
        id: 14
    },
    {
        title: 'rowGap: 5px 或 rowGap: 5',
        des: '',
        id: 15
    },
    {
        title: 'columnGap: 2px 或 columnGap: 2',
        des: '',
        id: 16
    },
    {
        title: 'width: 500px 或 width: 500',
        des: '',
        id: 17
    },
    {
        title: "rowHeight: '100px'",
        des: '',
        id: 18
    },
    {
        title: 'height: "500px" 或 height:500',
        des: '',
        id: 19
    },
    {
        title: "height: 'auto'",
        des: '',
        id: 20
    },
    {
        title: '单元格支持任意样式',
        des: '',
        id: 21
    },
    {
        title: '单元格支持跨越多行',
        des: '',
        id: 22
    },
    {
        title: '单元格支持三种对齐方式',
        des: '',
        id: 23
    },{
        title: '计算得出列的数量',
        des: 'header里width注意设置足够或者设置不足的情况下已设置的总宽度小于100%哦, 要给不确定的列留出宽度，否则会看不见哦',
        id: 24
    },
    {
        title: 'showHeader:false 或 无showHeader',
        des: '',
        id: 25
    },
    {
        title: 'dragable:true',
        des: '试试鼠标拖动表格行，可任意拖拽哦！',
        id: 26
    }
];
$('#button').click(function() {
    if(!tips[index]) {
        return alert('没有了！请刷新页面！');
    }
    var _copyData = copyData(gridData);
    switch(tips[index].id) {
        case -1:
            _copyData.header.forEach(function(item) {
                delete item.sort;
            });           
            break;
        case 1:
            _copyData.checkbox = true;           
            break;
        case 2:
            _copyData.filter = true;           
            break;
        case 3:
            delete  _copyData.freezeHeader;           
            break;
        case 4:
            delete _copyData.editable;           
            break;
        case 5:
            _copyData.multiSelect = false;           
            break;
        case 6:
            _copyData.selectable = false;           
            break;
        case 7:
            _copyData.checkbox = true;
            _copyData.selectWhenCheck = false;
            break;
        case 8:
            _copyData.editWhenClick = true;
            break;
        case 9:
            _copyData.header[0].width = '50px';
            _copyData.header[1].width = '200px';
            _copyData.header[2].width = '1fr';
            _copyData.header[3].width = '1fr';
            _copyData.header[4].width = '1fr';
            break;
        case 10:
            _copyData.header[0].width = '100px';
            _copyData.header[1].width = 'auto';
            _copyData.header[2].width = 'auto';
            _copyData.header[3].width = '50px';
            _copyData.header[4].width = 'auto';
            break;
        case 11:
            delete _copyData.header[0].width;
            delete _copyData.header[1].width;
            delete _copyData.header[2].width;
            delete _copyData.header[3].width;
            delete _copyData.header[4].width;
            break;
        case 12:
            _copyData.border = 'none';
            break;
        case 13:
            _copyData.border = 'solid';
            break;
        case 14:
            _copyData.border = 'dashed';
            break;
        case 15:
            _copyData.rowGap = 5;
            break;
        case 16:
            _copyData.columnGap = 2;
            break;
        case 17:
            _copyData.width = 500;
            break;
        case 18:
            _copyData.rowHeight = 100;
            break;
       case 19:
            _copyData.height = 500;
            break;
        case 20:
            _copyData.height = 'auto';
            break;
        case 21:
            _copyData.rows[0][2] = {
                value: _copyData.rows[0][2],
                style: 'background:green;color:#fff;'
            };
            _copyData.rows[2][0] = {
                value: _copyData.rows[2][0],
                style: 'background:red;color:#fff;'
            };
            _copyData.rows[4][5] = {
                value: _copyData.rows[4][5],
                style: 'font-size:25px;font-weight: bold;'
            };
            _copyData.rows[6][1] = {
                value: _copyData.rows[6][1],
                style: 'text-decoration: underline;font-style: italic;color:red;'
            };
            break;
        case 22:
            _copyData.rows[3][1] = {
                value: _copyData.rows[3][1],
                size: 2
            };
            _copyData.rows[3].splice(3,1);
            break;
        case 23:
            _copyData.rows[2][2] = {
                value: _copyData.rows[2][2],
                align: 'left'
            };
            _copyData.rows[3][2] = {
                value: _copyData.rows[3][2],
                align: 'center'
            };
            _copyData.rows[4][2] = {
                value: _copyData.rows[4][2],
                align: 'right'
            };
            break;
        case 24:
            delete _copyData.header[0].width;
            delete _copyData.header[1].width;
            delete _copyData.header[2].width;
            delete _copyData.header[3].width;
            delete _copyData.header[4].width;
            _copyData.rows[0].push({value:'加1', id: 'add1'}, {value:'加2', id: 'add2'}, {value:'加3', id: 'add3'}, {value:'加4', id: 'add4'}, {value:'加5', id: 'add5'});
            break;
        case 25:
            delete _copyData.showHeader;
            break;
        case 26:
            _copyData.dragable = true;
            break;
            
    }
    grid = new Grid(_copyData, $('.container')), $textarea = $('#textarea');
    if(index >= 21) {
        $textarea.val(JSON.stringify(_copyData.rows, null, 2));
    } else {
        $textarea.val(JSON.stringify(_copyData, null, 2));
    }
    $textarea[0].scrollTop = 0;

    let next = tips[index + 1];
    let current = index + '. ' +tips[index];
    if(index === tips.length - 1) {
        next = tips[0];
    }
    $('#tip-current').html(tips[index].title + (tips[index].des ? '<span style="font-size:12px;">（'+tips[index].des+'）</span>':''));
    $('#tip-next').html('<span style="font-size:12px;">'+next.title+'</span>');
    index++;    
});
$('#button').trigger('click');
function copyData(data) {
  var t = type(data), o, i, ni;
  
  if(t === 'array') {
    o = [];
  }else if( t === 'object') {
    o = {};
  }else {
    return data;
  }
  
  if(t === 'array') {
    for (i = 0, ni = data.length; i < ni; i++) {
      o.push(copyData(data[i]));
    }
    return o;
  }else if( t === 'object') {
    for( i in data) {
      o[i] = copyData(data[i]);
    }
    return o;
  }
  function type(obj) {
      var toString = Object.prototype.toString;
      var map = {
        '[object Boolean]' : 'boolean', 
        '[object Number]'  : 'number', 
        '[object String]'  : 'string', 
        '[object Function]' : 'function', 
        '[object Array]'  : 'array', 
        '[object Date]'   : 'date', 
        '[object RegExp]'  : 'regExp', 
        '[object Undefined]': 'undefined',
        '[object Null]'   : 'null', 
        '[object Object]'  : 'object'
      };
      return map[toString.call(obj)];
    }
}