[TOC]
# grid-table

author blog: 秋叶博客[https://www.mizuiren.com](https://www.mizuiren.com)

    Responsive table grid to meet various usage scenarios, with: width and height settings, drag and drop sorting, adjustment of column width, editing of cells (check, click, single double-click editing), fixed table header, etc...
    满足各种使用场景的响应式表格组件(Responsive table grid)，具备：宽高设置、拖拽排序、调节列宽、编辑单元格（勾选、点选、单双击编辑）、表头固定等...

    Some of the features it contains are:
    它包含的一些特性有：


**1.参数数据易配置性，简单的列数据只需要字符串即可。**

**2.列宽自由化绝对化，不像table的td难以控制**

**3.dom结构简易化**

**4.单元格样式全自定义化**

**5.响应式宽度，宽度变更不需要重新渲染。宽度取决于容器宽度，容器宽度是页面负责。**

**6.列数自动根据数据变化**

**7.排序icon**

**8.flex布局，更加美观紧凑**

声明：支持主流前沿浏览器，不支持IE浏览器！

如何使用？
如渲染一个表格：
```
let myGrid = new Grid(data, container);
```
myGrid.data绑定了所有渲染表格所要用到的数据，可灵活手动更新

data是表格的数据，为一个对象。container为表格的容器，为jq对象。

## 参数设置（data）：

### 1.header:
表头数据（每列的配置），数组，数组里面每一项就是对应每一列，
```
[
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
        }
    },
    {
        value:'年龄', 
        id: 'age', 
        width: '20%', 
        sort: false,
    }
]
```
列的配置数据如下：

##### value:该列表头显示的文字

##### id:该列绑定的id,便于dom搜索，如未配置，则默认是列的索引

##### width: 该列的宽度，支持百分比，auto, 和flex布局的css值，如fr，可没有，没有按1fr计算。注：1fr，类似分蛋糕，分剩余空间的多少份

需要值得注意的是:

1.auto会被认为fr;

2.所有列所设置的宽度（确定的宽度如百分比或具体数值）应小于等于总宽度，未设置宽度的才会有空间生存。

3.如总宽度为300px的5列数据：100px 30% 100px 10px, 缺省设置了一列的宽度，那么最后一列的宽度则是0，不会显示。

4.如果列不需要特殊化，那就等宽设置，都不需要设置width

5.如果只是某部分列需要特殊宽度，其它可以用auto代替：auto auto 100px auto auto

##### sort:该列需不需要排序，如果需要把这个设置为true,如果不需要则不要设置，或者false。排序规则默认本地排序。

如果需要自定义排序。可以写排序的方法：

sort: function(a,b) {}

参数a，b是每一行该列对应的数据，返回值需要是1或者-1或者0

##### resizeable:该列需不需要调节列宽，true/false

### 2.checkbox:
显示勾选框：checkbox:true

不显示勾选框：checkbox:false或者不配置checkbox

### 3.showHeader:
显示表头：showHeader:true

不显示表头：showHeader:false或者不配置showHeader

### 4.freezeHeader:
冻格表头：freezeHeader:true, 表头不会随着内容滚动

不冻格表头：freezeHeader:false或者不配置freezeHeader, 表头会随着内容滚动

### 5.editable:
打开编辑模式：editable:true, 双击可编辑行

关闭编辑模式：editable:false或者不配置editable, 单双击都不可编辑行或列

### 6.editWhenClick:
单击的时候编辑单元格：editWhenClick:true, 前提是editable:true

单击的时候不会编辑单元格：editWhenClick:false或者不配置editWhenClick

### 7.selectable:
单击可选择行，勾选可选择行，ctrl+单击可选择行：selectable:true

任何时候都不可以选择行：selectable:false

### 8.selectWhenCheck:
勾选复选框的时候选择行selectWhenCheck:true或者不设置selectWhenCheck，默认为true。前提是selectable:true

勾选复选框的时候不可以选择行selectWhenCheck:false

### 9.multiSelect:
开启多选：multiSelect:true

关闭多选：multiSelect:false或者不设置multiSelect

### 10.border:
单元格边框，支持三种样式：

dotted: 点线

dashed:短划线

solid:实线

### 11.rowGap:
行间距，支持纯数字和任意css单位，纯数字默认为px

### 12.columnGap:
列间距，支持纯数字和任意css单位，纯数字默认为px

### 13.width:
表格的宽度，支持纯数字和任意css单位，以及百分比和auto,纯数字默认为px

### 14.rowHeight:
行高，支持纯数字和任意css单位和auto，不设置默认是auto, 纯数字默认为px

### 15.height:
表格高度，此高度包含表头。支持纯数字和任意css单位

### 16.dragable:
是否可拖拽调整表格行顺序，数据也会进行排序

### 17.rows:
表格的数据，数组，数组的每一项为表格的每一行数据

表格行数据：

1.数组，数组每一项为每一个单元格数据, 可以为纯数字，对象，任意字符串（包括dom字符串）

2.如果是个对象, 对象的键值对应的参数意义：
```
{
    value：实际展示到单元格的数据，可以为纯数字，对象，任意字符串（包括dom字符串）
    size:(可选)，数字，表示单元格占几格，默认1格，大部分情况无需设置
    style: 单元格样式，可以设置背景，颜色等，如"background:#ccc;font-size:16px;color:white;"
    align: (可选)，字符串，单元格对齐方式，'left|center|right',默认是center
    id: (可选)，单元格识别码。便于查找行用于选中。
    class:(可选)， 指定class。
    type:(可选)， 当type为"checkbox"时, 此项会被当作一个隐含的识别元素，相应的属性会绑到该行的勾选框上
    selected:(可选)， 此行是否需要选上，前提是type:checkbox才有效果
    checked:(可选)， 此行是否需要勾选，前提是type:checkbox才有效果
    disable:(可选)， 此行是否需要禁用勾选，前提是type:checkbox才有效果
    editType: {(可选)，此单元格的编辑模式
        type: 'select',目前支持input和select, 默认input
        options: ['a','b','c','d','e'] 如果type是select的话，这是下拉框的选项（数组）
    }
}
```
id只有当有通过数据去选中表格行的需求情况下才需要用到，大部分情况下不需要这个。

样例：

1.[['5.1','5.2','5.3','5.4', '5.5'],['6.1','6.2','6.3','6.4', '6.5']]

2.[[{value: 'aaa', id: 'xxx', type: 'checkbox'},'3.1', '3.2','3.3','3.4', '3.5']]

3.[[{value: 'aaa', id: 'name',size:2, style:'background:#ccc;font-size:16px;color:white;'},{value: 'aaa', id: 'sex',size:2},'3.3','3.4', '3.5']]

4.rows可以没有或者为空数组，后续再单独updateData渲染数据:

let grid = new Grid(data, div);

grid.updateData(rowsData);

## 事件监听：

### 1.onSelect: function(rowData) {}
选中表格行触发

rowData选中行的数据

### 2.onClick: function(rowData, cellData, evt) {}
点击单元格触发

rowData选中行的数据

cellData单元格数据

evt事件对象

### 3.onUnSelect: function(rowData) {}
取消选中表格行触发

rowData选中行的数据

### 4.onSelectAll: function(data) {}
全选触发

data表格的数据

evt事件对象

### 5.onUnSelectAll: function(data) {}
取消全选触发

data表格的数据

### 6.onBeforeSelect: function(rowData, evt) {}
选中表格行之前触发，可以终止选择，只需要return false,适用与一些定制化表格行不让选择的情景

rowData选中行的数据

evt事件对象

### 7.onCheck: function(rowData) {}
勾选的时候触发

rowData表格行的数据

### 8.onUnCheck: function(rowData) {}
取消勾选的时候触发

rowData表格行的数据

### 9.onCheckAll: function(rowData) {}
勾选全部的时候触发

rowData表格行的数据

### 10.onUnCheckAll: function(rowData) {}
取消勾选全部的时候触发

rowData表格行的数据

### 11.onBeforEdit: function(rowNum, columnNum, oldValue) {}
编辑前触发，可以终止编辑，只需要return false,适用与一些定制化表格行不让编辑的情景

rowNum行号

columnNum列号

oldValue编辑前的旧值

### 12.onEdit: function(rowNum, columnNum, oldValue, newValue) {}
编辑结束触发

rowNum行号

columnNum列号

oldValue编辑前的旧值

### 13.onContextmenu: function(rowData, cellData, evt) {}
右键的时候触发

rowData选中行的数据

cellData单元格数据

evt事件对象

### 14.onDblclick: function(rowData, cellData, evt) {}
双击的时候触发

rowData选中行的数据

cellData单元格数据

evt事件对象

## 方法函数

### 1.getData()
获取表格数据

### 2.updateData([[1,2,3,4,5,6,7,8,9]]);
更新表格数据

### 3.updateCell($cell, newValue);
$cell: 单元格对象

newValue: 新的值

### 4.selectRow(rowNum, evt, multiSelect);
rowNum：行号

evt：事件对象，没有的话可传空对象

multiSelect：此参数为true则不会清除已经选择的行，反之

### 5.selectRowById(id, isMulti);
id:id值，指的是渲染数据所绑定的id

isMulti: 是否要保留之前的选择

比如数据：

1.[[5,5,5,5,5,5], [1,2,3,4,5,{id: 'firstRow',value: 6},7,8,9]]

myGrid.selectRowById('firstRow');则会选中第二行

2.[[5,5,5,5,5,5], [{id: 'secondRow',type: 'checkbox'},2,3,4,5,6,7,8,9]]

myGrid.selectRowById('secondRow', true);则会选中第二行

注意：一般会用在第二种情况，就是通过隐藏的唯一id(不受编辑影响)进行选中。当然其它非隐藏的也可以，但不太推荐这么做，因为相应值编辑后就会变了，也很难保证唯一性，除非配置不可编辑且唯一，若不是唯一则会选中多行，前提是selectable:true以及multiselect:true

### 6.unSelectRowById(id, isMulti);
根据id取消选中

跟selectRowById类似

### 7.unSelectRow(rowNum);
取消选择某一行

rowNum：行号

### 8.selectAll()
选择全部

### 9.unSelectAll(filterRows)
filterRows: 可选，意为排除哪些行，没有则取消全部

取消除filterRows之外的全部选择

### 10.checkAll()
勾选全部

### 11.unCheckAll()
取消勾选全部

### 12.checkOne(rowNum)
勾选某条数据

rowNum：行号

### 13.unCheckOne(rowNum)
取消勾选某条数据

rowNum：行号

### 14.endEdit()
结束并应用编辑

### 15.editCell($cell, multiEdit)
$cell：单元格jq对象

multiEdit：是否需要取消上一个编辑状态， multiEdit为true则不取消，multiEdit为false则取消

### 16.getSelectedData()
获取选中行的数据

### 17.getCheckedData()
获取勾选行的数据

### 18.getColumLength()
获取列的数据

### 19.appendRow(rowData, index)
新增行数据

rowData:行数据，数组

index: 插在第几行

### 20.deleteRow(rowNum)
删除行

rowNum:行数

### 21.updateRow(rowData, rowIndex);
更新行

rowData：行新数据

rowIndex: 行号

### 22.checkRowById(id);
id:id值，指的是渲染数据所绑定的id

比如数据：

1.[[5,5,5,5,5,5], [1,2,3,4,5,{id: 'firstRow',value: 6},7,8,9]]

myGrid.checkById('firstRow');则会选中第二行

2.[[5,5,5,5,5,5], [{id: 'secondRow',type: 'checkbox'},2,3,4,5,6,7,8,9]]

myGrid.checkById('secondRow', true);则会选中第二行
