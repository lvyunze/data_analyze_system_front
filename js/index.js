$(document).ready(function(){
  
    var txt= $(window).height();
    $("#result").height(txt);
});

function pageClick(k) {
	$(k).parent().find("div").removeClass("active");
	$(k).addClass("active");
	$("#flTitle").text($(k).text());
}


//初始化Excel导入的文件
        function InitExcelFile() {
            //记录GUID
            $("#AttachGUID").val(newGuid());

            $("#excelFile").fileinput({
                uploadUrl: "/FileUpload/Upload",//上传的地址
                uploadAsync: true,              //异步上传
                language: "zh",                 //设置语言
                showCaption: true,              //是否显示标题
                showUpload: true,               //是否显示上传按钮
                showRemove: true,               //是否显示移除按钮
                showPreview : true,             //是否显示预览按钮
                browseClass: "btn btn-primary", //按钮样式 
                dropZoneEnabled: false,         //是否显示拖拽区域
                allowedFileExtensions: ["xls", "xlsx"], //接收的文件后缀
                maxFileCount: 1,                        //最大上传文件数限制
                previewFileIcon: '<i class="glyphicon glyphicon-file"></i>',
                allowedPreviewTypes: null,
                previewFileIconSettings: {
                    'docx': '<i class="glyphicon glyphicon-file"></i>',
                    'xlsx': '<i class="glyphicon glyphicon-file"></i>',
                    'pptx': '<i class="glyphicon glyphicon-file"></i>',
                    'jpg': '<i class="glyphicon glyphicon-picture"></i>',
                    'pdf': '<i class="glyphicon glyphicon-file"></i>',
                    'zip': '<i class="glyphicon glyphicon-file"></i>',
                },
                uploadExtraData: {  //上传的时候，增加的附加参数
                    folder: '数据导入文件', guid: $("#AttachGUID").val()
                }
            })  //文件上传完成后的事件
           .on('fileuploaded', function (event, data, previewId, index) {
                var form = data.form, files = data.files, extra = data.extra,
                    response = data.response, reader = data.reader;

                var res = data.response; //返回结果
                if (res.Success) {
                    showTips('上传成功');
                    var guid = $("#AttachGUID").val();

                    //提示用户Excel格式是否正常，如果正常加载数据
                    $.ajax({
                        url: '/TestUser/CheckExcelColumns?guid=' + guid,
                        type: 'get',
                        dataType: 'json',
                        success: function (data) {
                            if (data.Success) {
                                InitImport(guid); //重新刷新表格数据
                                showToast("文件已上传，数据加载完毕！");

                                //重新刷新GUID，以及清空文件，方便下一次处理
                                RefreshExcel();
                            }
                            else {
                                showToast("上传的Excel文件检查不通过。请根据页面右上角的Excel模板格式进行数据录入。", "error");
                            }
                        }
                    });
                }
                else {
                    showTips('上传失败');
                }
           });
        }

//根据条件查询并绑定结果
        var $import;
        function InitImport(guid) {
            var url = "/TestUser/GetExcelData?guid=" + guid;
            $import = $('#gridImport').bootstrapTable({
                url: url,                           //请求后台的URL（*）
                method: 'GET',                      //请求方式（*）
                striped: true,                      //是否显示行间隔色
                cache: false,                       //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
                pagination: false,                  //是否显示分页（*）
                sidePagination: "server",           //分页方式：client客户端分页，server服务端分页（*）
                pageNumber: 1,                      //初始化加载第一页，默认第一页,并记录
                pageSize: 100,                     //每页的记录行数（*）
                pageList: [10, 25, 50, 100],        //可供选择的每页的行数（*）
                search: false,                      //是否显示表格搜索
                strictSearch: true,
                showColumns: true,                  //是否显示所有的列（选择显示的列）
                showRefresh: true,                  //是否显示刷新按钮
                minimumCountColumns: 2,             //最少允许的列数
                clickToSelect: true,               //是否启用点击选中行
                uniqueId: "ID",                     //每一行的唯一标识，一般为主键列
                queryParams: function (params) { },
                columns: [{
                    checkbox: true,
                    visible: true                  //是否显示复选框  
                }, {
                    field: 'Student',
                    title: '师范生'
                }, {
                    field: 'Biogenicland',
                    title: '生源地'
                }, {
                    field: 'Type',
                    title: '单位类型',
                    formatter: emailFormatter
                }, {
                    field: 'Information',
                    title: '单位所属行业',
                    formatter: linkFormatter
                }, {
                    field: 'Area',
                    title: '单位所属地区'
                }, {
                    field: 'Intention',
                    title: '使用意图',
                    formatter: sexFormatter
                }, {
                    field: 'Occupation',
                    title: '职业类型'
                } 
                ],
                onLoadSuccess: function () {
                },
                onLoadError: function () {
                    showTips("数据加载失败！");
                },
            });
        }

//保存导入的数据
        function SaveImport() {
            
            var list = [];//构造集合对象
            var rows = $import.bootstrapTable('getSelections');
            for (var i = 0; i < rows.length; i++) {
                list.push({
                    'Student': rows[i].Student, 'Biogenicland': rows[i].Biogenicland, 'Type': rows[i].Type, 'Information': rows[i].Information,
                    'Area': rows[i].Area, 'Intention': rows[i].Intention, 'Occupation': rows[i].Occupation
                });
            }

            if (list.length == 0) {
                showToast("请选择一条记录", "warning");
                return;
            }

            var postData = { 'list': list };//可以增加其他参数，如{ 'list': list, 'Rucanghao': $("#Rucanghao").val() };
            postData = JSON.stringify(postData);

            $.ajax({
                url: '/TestUser/SaveExcelData',
                type: 'post',
                dataType: 'json',
                contentType: 'application/json;charset=utf-8',
                traditional: true,
                success: function (data) {
                    if (data.Success) {
                        //保存成功  1.关闭弹出层，2.清空记录显示 3.刷新主列表
                        showToast("保存成功");

                        $("#import").modal("hide");
                        $(bodyTag).html("");
                        Refresh();
                    }
                    else {
                        showToast("保存失败:" + data.ErrorMessage, "error");
                    }
                },
                data: postData
            });
        }   
        

