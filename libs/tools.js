/**
常用工具函数
 by：kule
 2012-06-06 gagamatch项目
 2012-11-20 美丽人生项目
 2013-02-26 IM
 */
var tools = {
    //记录错误信息及调试信息
    //TODO: 对log,info,warn,debug分开设置
    _log: function (type) {
        if(typeof TOOLS_DEBUG!=='undefined'&&!TOOLS_DEBUG)return;
        if ('console' in window) {
            for (var i = 1, il = arguments.length; i < il; i++) {
                console[type](arguments[i]);
            }
            toolLq[type].last=arguments[i-1];
        } else {
            alert(Array.prototype.slice.call(arguments, 0).join(' '));
        }
    },
    _trace: function (){
        if(typeof TOOLS_DEBUG!=='undefined'&&!TOOLS_DEBUG)return;
        console.trace();
    },
    //通过覆盖该方法，实现全局用户提醒
    warn:function(msg){
        toolLq.log('warn','未设置全局用户提醒，当前信息为：',msg);
    },
    //toolLq.checkParam('id','name',arguments)
    checkParam:function(){
        if(arguments<2){
            toolLq.log('warn','无参数需要校验');
            return false;
        }
        var args=arguments[arguments.length-1];
        //检测是否为arguments
        if(typeof args!=='array'){
            toolLq.log('warn','最后一个参数必须为数组');
            return false;
        }
        return true;
    },
    sLog:function(){
        if ('console' in window) {
            for (var i = 0, il = arguments.length; i < il; i++) {
                $.isPlainObject(arguments[i])?
                    console.log(JSON.stringify(arguments[i])):
                    console.log(arguments[i]);
            }
            toolLq.log.last=arguments[i-1];
        } else {
            alert(Array.prototype.slice.call(JSON.stringify(arguments[i]), 0).join(' '));
        }
    },
    pathJoin:function(){
        var path=Array.prototype.join.call(arguments,'/');
        return path.replace(/\/{2,}/g,'/');
    },
    post: function (tip, res, url, data, fn,type) {
        toolLq.log(tip + 'url', url);
        toolLq.log(tip + 'data', data);
/*        setTimeout(function () {
            fn(res);
        }, 200);*/
        $.post(url,data,fn,type);
    },
    get: function (tip, url, data, fn, type) {
        toolLq.log(tip + 'url', url);
        toolLq.log(tip + 'data', $.extend(true, {}, data));
        /*        setTimeout(function(){
        $.get(url,data,fn,type);
        },1000);*/
        $.get(url, data, fn, type);
    },
    //返回存储的key:value,格式内容。value可为字符串，但是不能含有英文逗点，
    //英文逗点请用&dlq;代替
    getStrValue: function (key, str) {
        str = [',', str, ','].join('');
        var regExp = new RegExp(',' + key + ':([^,]*),');
        str = str.match(regExp);
        return str ? str[1].replace(/&dlq;/g, ',') : str;
    },
    //设置存储的key:value,格式内容。value可为字符串，但是不能含有英文逗点，
    //英文逗点请用&dlq;代替
    setStrValue: function (key, value, str) {
        value = value.replace(/,/, '&dlq;');
        str = str ? [',', str, ','].join('') : '';
        var regExp = new RegExp([',', key, ':([^,]*),'].join(''));
        return [str.replace(regExp, ',').slice(1), key, ':', value].join('');
    },
    //str转换成json对象，不使用eval
    //英文逗点请用&dlq;代替
    strToJson: function (jsonStr) {
        jsonStr = [',', jsonStr, ','].join('');
        var rstArray, rstObj = {};
        var regExp = new RegExp(',("?[_\\w]+[\\w\\d_]+"?):([^,]+),', 'g');
        while ((rstArray = regExp.exec(jsonStr)) != null) {
            regExp.lastIndex--;
            rstObj[rstArray[1]] = rstArray[2].replace(/&dlq;/g, ',');
        }
        rstArray = regExp = null;
        return rstObj;
    },
    //json转str对象
    jsonToStr:function(obj){
        var rst=[];
        for(var k in obj){
            rst.push([k,':',obj[k]+''].join(''));
        }
        return rst.join(',');
    },
    //HTML模板替换
    htmlTemplate: function (template, data, allowEmpty) {
        //替换符号为${xxx}
        return template.replace(/\$\{([_\w]+[\w\d_]?)\}/g,
            function (s, s1) {
                if (data[s1] != null && data[s1] != undefined) {
                    return data[s1];
                } else {
                    return allowEmpty ? '' : s;
                }
            });
    },
    //"\/Date(1339264818000)\/"json时间解析
    //"2014-08-30T11:32:00" json时间
    jsonDateParse: function (str,rtDate) {
        var regExp = toolLq.constant.jsonDate;
        var date;
        var _str = (str +'').replace(/-/g,'/');
        if(rtDate){
            date = _str.match(regExp);
            if (!date) {
                regExp = toolLq.constant.apiDate;
                date = _str.match(regExp);
                return date ? new Date(date[1] + ' ' + date[2]) :
                    str;

            }
            return new Date(date[1] - 0);
        }
        return _str.replace(toolLq.constant.jsonDateGlobal, 'new Date($1)');
    },
    fillArray:function(count,val){
        var rst=new Array(count);
        for(var i= 0;i<count;i++){
            rst[i]=val;
        }
        return rst;
    },
    parseDate:function(str){
        return new Date(str.replace(/-/ig,'/'));
    },
    convertJsonDate:function(data,keys,fn,args){
        var item;
        if(!fn){
            fn=toolLq.jsonDateParse;
            args||(args=[true]);
        }
        args||(args=[]);
        if(keys instanceof Array){
            for(var i= 0,il=keys.length;i<il;i++){
                item=data[keys[i]];
                data[keys[i]]=fn.apply(null,[item].concat(args));
            }
            return;
        }
        if(keys instanceof RegExp){
            for(var k in data){
                item=data[k];
                if(keys.test(k)&&item)
                try{
                    data[k]=fn.apply(null,[item].concat(args));
                }catch(e){
                    continue;
                }
            }
        }
    },
    convertDateJson:function(data,key,format){
        format||(format='yyyy-MM-dd HH:mm:ss');
        toolLq.convertJsonDate(data,key,toolLq.dateFormat,[format]);
    },
    convertDateToStr:function(model){
        var item;
        if(model instanceof Date){
            return toolLq.dateFormat(model,'yyyy-MM-dd');
        }
        for(var k in model){
            item=model[k];
            if(item instanceof Date){
                model[k]=toolLq.dateFormat(item,'yyyy-MM-dd');
            }
        }
        return model;
    },
    //utc时间解析，将utc时间解析为本地时间，返回date对象，date.str为字串
    utcStrParse: function (dateStr, format) {
        var tempArray = [],
            date = new Date(),
            srcDate = new Date(),
            funQueue = {
                'y': 'FullYear',
                'M': 'Month',
                'd': 'Date',
                'h': 'Hours',
                'm': 'Minutes',
                's': 'Seconds'
            },
            patt = /(\d+)([\D]+)/g,
            i = 0,
            formatArr = [false];
        //格式推断
        if (!format) {
            formatArr = [['y', 'M', 'd'], //年月日
                ['M', 'd', 'y'], //月日年
                ['d', 'M', 'y'], //日月年
                ['y', 'd', 'M']]; //年日月
        }
        dateStr += ';';
        for (var k = 0; k < formatArr.length; k++) {
            format = formatArr[k] ? formatArr[k].concat(['h', 'm', 's']) : format;
            i = 0;
            date.str = [];
            srcDate.str = [];
            while ((tempArray = patt.exec(dateStr)) != null) {
                tempArray.l = tempArray[1].length;
                if (funQueue[format[i]] == 'Month') tempArray[1] = tempArray[1] - 0 - 1;
                srcDate['set' + funQueue[format[i]]](tempArray[1] - 0);
                date['setUTC' + funQueue[format[i]]](tempArray[1] - 0);
                srcDate.temp = srcDate['get' + funQueue[format[i]]]();
                date.temp = date['get' + funQueue[format[i]]]();
                if (funQueue[format[i]] == 'Month') {
                    srcDate.temp++;
                    date.temp++;
                }
                srcDate.str.push(tempArray.l > (srcDate.temp + '').length ? '0' + srcDate.temp : srcDate.temp, tempArray[2]);
                date.str.push(tempArray.l > (date.temp + '').length ? '0' + date.temp : date.temp, tempArray[2]);
                i++;
            }
            srcDate.str = srcDate.str.slice(0, -1).join('');
            date.str = date.str.slice(0, -1).join('');
            if (srcDate.str + ';' == dateStr) break;
        }
        delete date.temp;
        date.toString = function () {
            return date.str;
        };
        return date;
    },
    getUTCMi: function (date) {
        return Date.UTC(date.getFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
    },
    getUTCStr: function (date) {
        return [date.getFullYear(), '/', date.getUTCMonth() + 1, '/', date.getUTCDate()].join('');
    },
    dateToString:function(date){
        if(typeof date==='string')date=new Date(date);
        return ['/Date(',date.getTime(),')/'].join('');
    },
    //日期格式化，参数为yyyy-MM-dd，HH:mm:ss
    dateFormat: function (date, format) {
        if(!date)return date;
        format||(format='yyyy-MM-dd HH:mm:ss');
        date = typeof date === 'string' ? new Date(date) : date;
        var _weekName = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        var _monthName = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
        var formatStr = {
            "M+": date.getMonth() + 1,
            "d+": date.getDate(),
            "h+": date.getHours() > 12 ? date.getHours() - 12 : date.getHours(),
            "H+": date.getHours(),
            "m+": date.getMinutes(),
            "s+": date.getSeconds(),
            "q+": Math.floor((date.getMonth() + 3) / 3),
            "w": '0123456'.indexOf(date.getDay()),
            "t": date.getHours() < 12 ? 'am' : 'pm',
            "W": _weekName[date.getDay()],
            "L": _monthName[date.getMonth()] //non-standard
        };
        if (/(y+)/.test(format)) {
            format = format.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
        }
        for (var k in formatStr) {
            if (new RegExp('(' + k + ')').test(format))
                format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? formatStr[k] : ('00' + formatStr[k]).substr(('' + formatStr[k]).length));
        }
        return format;
    },
    getTimeZone:function(start,end){
        return Math.ceil((end-start)/(24*60*60*1000));
    },
    getDayZone:function(start,end){
        var dayTime=toolLq.constant.dayTime;
        return Math.ceil((end-start)/dayTime)
    },
    getDayZoneWithoutCeil:function(start,end){
        var dayTime=toolLq.constant.dayTime;
        return (end-start)/dayTime;
    },
    getNextDate:function(dateStr,count){
        var date=new Date(dateStr);
        count||(count=1);
        date=new Date(date.setHours(0,0,0)+count*tools.constant.dayTime);
        return date;
    },
    getTodayLast:function(date){
        return new Date((new Date(date)).setHours(23,59,59));
    },
    getWeekZone:function(date,dateFormat){
        date=new Date(date);
        date.setHours(0,0,0);
        var day=date.getDay();
        var dayTime=24*60*60*1000;
        var start,end;

        day==0&&(day=7);
        day--;
        start=new Date(date-day*dayTime);
        end=new Date(start.getTime()+7*dayTime);
        return {
            start:dateFormat?toolLq.dateFormat(start,dateFormat):start,
            end:dateFormat?toolLq.dateFormat(end,dateFormat):end
        }
    },
    getMonthZone:function(date,dateFormat){
        var start=new Date(date);
        var end=new Date(date);
        var month=date.getMonth();

        start.setDate(1);
        start.setHours(0,0,0);
        end.setMonth(month+1,1);
        end.setHours(0,0,0);
        return {
            start:dateFormat?toolLq.dateFormat(start,dateFormat):start,
            end:dateFormat?toolLq.dateFormat(end,dateFormat):end
        }
    },
    getYearZone:function(date,dateFormat){
        var year=date.getFullYear();
        var start=new Date(year+'/01/01 00:00:00');
        var end=new Date((year+1)+'/01/01 00:00:00');
        return {
            start:dateFormat?toolLq.dateFormat(start,dateFormat):start,
            end:dateFormat?toolLq.dateFormat(end,dateFormat):end
        }
    },
    getMonthLastDay:function(date){
        var end=new Date(date);
        var month=date.getMonth();

        end.setMonth(month+1,1);
        end.setHours(0,0,0);
        end=new Date(end.getTime()-8*60*60*1000);
        return end.getDate();
    },
    //得到好友生日
    utcBirth: function (dateStr, format) {
        var day = [x18n.today, x18n.tomorrow];
        var friendDate = new Date(toolLq.utcStrParse(dateStr, format).setHours(8, 0, 0, 0));
        var now = new Date(new Date().setHours(8, 0, 0, 0));
        var zone = Math.floor((friendDate - now) / 86400000);
        return zone >= 0 ? day[zone] : friendDate.str;
    },
    //json过滤特殊字符，防止单双引号破坏
    filterJsonChar: function (str, code) {
        switch (code) {
            case '1':
                return str.replace(/([^\\])(?=['"])/g, '$1$-\\');
            case '-1':
                return str.replace(/\$\-\\(['"])/g, '$1');
        }
        return str.replace(/['"]/g, '');
    },
    filterCRLF: function (str, code) {
        switch (code) {
            case '1':
                return str.replace(/(\r\n|\r|\n)/gi, '$-n');
            case '-1': //转换html换行
                return str.replace(/\$\-n/g, '<br />');
            case '-1.1':
                return str.replace(/\$\-n/g, '\n');
        }
        return str.replace(/(\r\n|\r|\n)/gi, '\\n');
    },
    //去空格ltrim()，rtrim(),trim()
    ltrim: function (str) {
        return str.replace(/^\s+/, '');
    },
    rtrim: function (str) {
        return str.replace(/\s+$/, '');
    },
    trim: function (str) {
        return toolLq.rtrim(toolLq.ltrim(str));
    },
    //去单引号，filterChar()
    //若是特殊字符需要转义，未来实现自动判断
    filterChar: function (str, cha) {
        var regExp = new RegExp(cha, 'gi');
        return str.replace(regExp, '');
    },
    //过滤<>符号
    filterLt: function (str) {
        return str.replace(/(<|>)/gi, function (s, s1) {
            if (s1 == '<') {
                return '&lt;';
            } else {
                return '&gt;';
            }
        });
    },
    //过滤script
    filterScript: function (str, tagName) {
        tagName = tagName || 'script';
        var regExp = new RegExp(['<\\s*(', tagName, '[^>]*)>|<\\*s(\/)\\s*(', tagName, '[^>]*)>'].join(''), 'gi');
        return str.replace(regExp, function (s, s1, s2, s3) {
            return ['&lt;', s1, s2, s3, '&gt;'].join('');
        });
    },
    getCharsImgs: function (str, imgs, width, height, words) {
        var tempDom = $(['<div>', str, '</div>'].join(''));
        var imgDom, rst = {};
        var regExp = new RegExp('^' + location.protocol + '//' + location.host, 'i');

        words = words || 100;
        //若需要获取图片
        if (imgs !== 0 && imgs) {
            imgDom = tempDom.find('img:lt(' + imgs + ')');
            rst.imgs = [];
            imgDom.each(function () {
                rst.imgs.push(['<img src="', this.src.replace(regExp, ''), '" width="', width, '" height="', height, '" />'].join(''));
            });
            rst.str = tempDom.text().replace(/\s{2,}/g, ' ').slice(0, words);
        } else {
            rst = tempDom.text().replace(/\s{2,}/g, ' ').slice(0, words);
        }
        return rst;
    },
    //过滤HTML
    filterHtml: function (str, noTagName, hasTagName) {
        noTagName = noTagName ||
            ['(html|head|body|iframe|a|area|b|big|br|button|dd|dl|dt|div|dd|fieldset|font|',
                'form|frame|frameset|h1|h2|h3|h4|h5|h6|hr|img|input|label|li|link|map|meta|object|',
                'ol|option|p|script|select|span|style|table|tbody|td|textarea|tfoot|th|thead|title|tr|',
                'tt|ul|img|i|s|u)'].join('');
        noTagName = hasTagName ? noTagName.replace(hasTagName, '') : noTagName;
        var regExp = new RegExp(['<\\s*\/?', noTagName, '\\b[^>]*>'].join(''), 'gi');
        return str.replace(regExp, function (s, s1) {
            return '';
        });
    },
    //过滤标签，firefox等会以xml解析自定义标签,如pa,故需要过滤所有被<>包围的内容
    filterTag: function (str, hasTagName) {
        hasTagName = hasTagName || '';
        var regExp = hasTagName ? new RegExp(['<\\s*\/?(?!', hasTagName, '\\b)\\w+\\b[^>]*>'].join(''), 'gi') :
            new RegExp('<\\s*\/?\\w+\\b[^>]*>', 'gi');
        return str.replace(regExp, function (s, s1) {
            return '';
        });
    },
    //标记图片
    filterMarkImgs: function (str, flag) {
        flag = flag || '${imgs}';
        var imgs = [],
            regExp = new RegExp('<\\s*\/?img\\b[^>]*(src\\s*=(?:[^>=](?!http:))*\\.(?:png|jpg|gif))[^>]*>', 'gi');
        str = str.replace(regExp, function (s, s1) {
            imgs.push(s1);
            return flag;
        });
        return { str: str, imgs: imgs };
    },
    filterRecoverImgs: function (str, imgs, flag, property) {
        flag = flag || '\\$\\{imgs\\}';
        property = property || {};
        var pos = 0,
            regExp = new RegExp(flag, 'gi');
        return str.replace(regExp, function () {
            if (pos >= imgs.length) return '';
            var str = ['<img ', imgs[pos], '" ',
                property.width ? 'width="' + property.width + '" ' : '',
                property.height ? 'height="' + property.height + '" ' : '',
                property.alt ? 'alt="' + property.alt + '" ' : '',
                ' />'].join('');
            pos++;
            return str;
        });
    },
    filterOnlyImg: function (str, flag, property) {
        var strObj = toolLq.filterMarkImgs(str, flag);
        str = toolLq.filterTag(strObj.str);
        return toolLq.filterRecoverImgs(str, strObj.imgs, flag, property);
    },
    getOnlyImgHtml:function(str){
        var html=toolLq.filterTag(str,'img');
        var jqHtml=$('<div>'+html+'</div>');
        $('img',jqHtml).each(function(){
            var jqImg=$(this);
            var newImg=$('<img />',{
                id:jqImg.attr('id'),
                width:jqImg.attr('width'),
                height:jqImg.attr('height'),
                style:jqImg.attr('style'),
                src:jqImg.attr('src'),
                alt:jqImg.attr('alt')
            });
            newImg[0].className=jqImg[0].className;

            jqImg.replaceWith(newImg);
        });
        return jqHtml.html();
    },
    //liuhao 2014-12-12 过滤html，只保留font标签
    getOnlyFontHtml: function (str) {
        var html=toolLq.filterTag(str,'font');
        var jqHtml=$('<div>'+html+'</div>');
        $('font',jqHtml).each(function(){
            var jqFont=$(this);
            var newFont=$('<font></font>',{
                color:jqFont.attr('color'),
                text: jqFont.text()
            });
            newFont[0].className=newFont[0].className;

            jqFont.replaceWith(newFont);
        });
        return jqHtml.html();
    },
    //过滤邮箱和QQ
    filterEmail: function (str) {
        var regExp = new RegExp(['@|([\\d零一二三四五六七八九十]\\s?){6,}|', //数字号码
            'q\\s?q|', //qq
            'm\\s?s\\s?n|', //msn
            'f\\s?a\\s?c\\s?e\\s?b\\s?o\\s?o\\s?k|', //facebook
            'F\\s?B|y\\s?a\\s?h\\s?o\\s?o|', //FB yahoo
            'h\\s?o\\s?t\\s?m\\s?a\\s?i\\s?l|', //hotmail
            's\\s?k\\s?y\\s?p\\s?e|', //skype
            'g\\s?m\\s?a\\s?i\\s?l|', //gmail
            '\\.\\s?c\\s?o\\s?m|163.\\s?c\\s?o\\s?m|', //.com 163.com
            'h\\s?t\\s?t\\s?p.*\\.\\w{2,4}(\\/\\w*)?\\b'//http:
            ].join(''), 'gi');
        return str.replace(regExp, '');
    },
    //获得指定节点相对父节点的偏移量，若无指定父节点或父节点错误则指定父节点为html
    //参数node,parentID；返回{left:offsety,top;offsety}
    //by kule 2012-3-3 9:24:50
    offsetParent: function (node, parentId) {
        var offsetParent = null; //用来存储offsetParent
        var offsetFlag = true; //用来决定是否offset累加
        var offsetLeft = Math.max(document.documentElement.scrollLeft,
            document.body.scrollLeft); //兼容不同浏览器对body.scroll的解释
        var offsetTop = Math.max(document.documentElement.scrollTop,
            document.body.scrollLeft);
        offsetLeft += node.offsetLeft;
        offsetTop += node.offsetTop;
        //循环累加offsetParent的offset,直到指定父对象
        //循环累加父级的scroll,直到html元素
        offsetParent = node.offsetParent;
        while ((node = node.parentNode) && node.tagName) {
            //if(node.scrollLeft||node.scrollTop){
            //offsetLeft-=node.scrollLeft;
            //offsetTop+=node.scrollTop;
            //}
            if (node===parentId||node.id==parentId)offsetFlag = false;
            if (node == offsetParent && offsetFlag) {
                offsetLeft += node.offsetLeft;
                offsetTop += node.offsetTop;
                offsetParent = offsetParent.offsetParent;
            }
        }
        node = offsetParent = offsetFlag = null;
        return { left: offsetLeft, top: offsetTop };
    },
    getChildrenHeight:function(jqChildren,jqP){
        var jqObj;
        var maxH=0,jqMax;
        var h;
        var domP=jqP[0];
        for(var i= 0,il=jqChildren.length;i<il;i++){
            jqObj=jqChildren.eq(i);
            h=toolLq.offsetParent(jqChildren[i],domP).top;
            h+=jqObj.outerHeight();
            if(maxH<h){
                maxH=h;
                jqMax=jqObj;
            }
        }
        return {
            h:maxH,
            jqObj:jqMax
        }
    },
    objToRuleArr: function (obj, rule) {
        var ret = [];
        for (var i = 0; i < rule.length; i++) {
            ret.push(obj[rule[i]]);
        }
        return ret;
    },
    emptyFun: function () { },
    charTran: function (str) {
        var tranSet = {
            lt: '<',
            gt: '>'
        };
        return str.replace(/&([^;]+);/gi, function (s, s1) { return tranSet[s1] || s });
    },
    getPop:function(jqObj){
        var jqP=jqObj.offsetParent();
        var offsetP=jqP.offset();
        var offsetObj=jqObj.offset();
        return {
            top:offsetObj.top-offsetP.top,
            left:offsetObj.left-offsetP.left
        }
    },
    getJqPop: function (popObj, jqObj, userOffset) {
        var Objoffset = jqObj.offset(),
            popOffset = {},
            parentWindow = {},
            jqParent = popObj.parent(),
            jqWin=$(window);
        var rstFlag = [];
        userOffset = $.extend({ top: 0, left: 0 }, userOffset);
        //查找第一个非static定位父级
        while (jqParent.css('position') == 'static') {
            if (jqParent[0].tagName.toLowerCase() == 'body') break;
            jqParent = jqParent.parent();
        }
        jqParent.oft = jqParent.offset();
        //矫正弹出位置，防止出现在窗口之外
        Objoffset.outHeight = jqObj.outerHeight();
        Objoffset.outWidth = jqObj.outerWidth();
        parentWindow.height = document.documentElement.clientHeight;
        parentWindow.width = document.documentElement.clientWidth;
        parentWindow.scrollTop = jqParent[0].tagName.toLowerCase() === 'body' ? jqWin.scrollTop() : 0;
        parentWindow.scrollLeft = jqParent[0].tagName.toLowerCase() === 'body' ? jqWin.scrollLeft() : 0;
        popOffset.height = popObj.outerHeight();
        popOffset.width = popObj.outerWidth();
        if (parentWindow.height + parentWindow.scrollTop - Objoffset.top - Objoffset.outHeight - userOffset.top > popOffset.height) {//屏幕够用
            popOffset.top = Objoffset.top + Objoffset.outHeight + userOffset.top;
            rstFlag.push('t');
        } else {
            popOffset.top = Objoffset.top - popOffset.height;
            rstFlag.push('b');
        }
        popOffset.left = parentWindow.width + parentWindow.scrollLeft - Objoffset.left - userOffset.left > popOffset.width ?
            Objoffset.left + userOffset.left :
            Objoffset.left - (popOffset.width - Objoffset.outWidth) + userOffset.left;
        rstFlag={
            direction:rstFlag.join(''),
            top: Math.floor(popOffset.top - jqParent.oft.top),
            left: Math.floor(popOffset.left - jqParent.oft.left)
        };
        return rstFlag;
    },
    //弹出
    jqPop: function (popObj, jqObj, userOffset) {
        var pos=toolLq.getJqPop(popObj,jqObj,userOffset);
        popObj.css({ top:pos.top, left:pos.left});
        return pos.direction;
    },
    //jquery插件执行命令
    //if(typeof options==='string')return toolLq.jqRunDataFun(options,this,arg);
    jqRunDataFun: function (key, jqObj, arg) {
        if (typeof jqObj.data(key) == 'function') {
            return jqObj.data(key)(arg);
        }
        return null;
    },

    //jquery插件执行命令
    //if(typeof settings==='string')return toolLq.jqRunDataFun1.apply(this,arguments);
    jqRunDataFun1: function (key) {
        if (typeof this.data(key) == 'function') {
            return this.data(key).apply(this, Array.prototype.slice.call(arguments, 1));
        }
        return this.data(key);
    },

    getStyle: function (dom, name) {
        return dom.style[name].replace(/\D/gi, '') - 0;
    },
    checkType: {
        email: /^([a-zA-Z0-9_\.\-])+@(([a-zA-Z0-9\-])+\.)+[a-zA-Z]{2,6}$/,
        phone: /1[0-9]{10}/
    },
    //check函数
    check: function (str, type) {
        if (type === 'empty') return true;
        return this.checkType[type].test(str);
    },
    prefixNumFormat:function(number,len){
        var str=number+'';
        if(str.length>=len)return str;
        return (new Array(len-str.length+1)).join('0')+str;
    },
    constant: {
        imgHtml:'<img src="${src}" width="${width}" height="${height}" alt="${alt}" />',
        jsonContentType:'application/json',
        regUrlParam: /\?[^=]+=/,
        dayTime: 24 * 60 * 60 * 1000,
        //"\/Date(1339264818000)\/"json时间解析
        jsonDate: /\/Date\((\d+)[^)]*\)\//,
        jsonDateGlobal: /\/Date\((\d+)[^)]*\)\//g,
        //"2014-08-30T11:32:00" json时间
        apiDate: /(\d{4}\/\d{2}\/\d{2})\D(\d{2}:\d{2}:\d{2})/,
        day:['日','一','二','三','四','五','六'],
        monthName:[ '一',
            '二',
            '三',
            '四',
            '五',
            '六',
            '七',
            '八',
            '九',
            '十',
            '十一',
            '十二'],
        numMonth: ['1','2','3','4','5','6','7','8','9','10','11','12'],
//        pathReg:/https?:\/\/[^/]+(\/.+)$/ig
        //liuhao 2014-11-13 匹配hash时过滤掉最后的参数字串
        pathReg:/https?:\/\/[^/]+(\/[^?]+)(\?.*)?$/ig,
        evTransitionEnd:'transitionend webkitTransitionEnd',
        evAnimationEnd:'animationend webkitAnimationEnd',
        humanSizeString:['KB','MB','GB','TB']
    },
    getRestfulPara:function(opt){
        return $.extend(opt,{
            data:JSON.stringify(opt.data),
            contentType:toolLq.constant.jsonContentType,
            dataType:'json',
            processData:false
        });
    },
    getWeekDay:function(date){
        return toolLq.constant.day[date.getDay()];
    },
    /*参数添加*/
    setUrlParam: function (url, param) {
        var params=[];
        if($.isPlainObject(param)){
            for(var key in param){
                params.push(key+'='+param[key]);
            }
            param=params.join('&');
        }
        if (typeof param === 'string') {
            return toolLq.constant.regUrlParam.test(url) ? [url, '&', param].join('') :
                [url, '?', param].join('');
        }
        return url;
    },
    //等比缩放
    resizeImg: function (width, height, maxw, maxh) {
        // 等比例缩小
        var hRatio,
            wRatio,
            Ratio = 1;

        wRatio = maxw / width;
        hRatio = maxh / height;
        if (wRatio < 1 || hRatio < 1) {
            Ratio = (wRatio <= hRatio ? wRatio : hRatio);
        }
        if (Ratio < 1) {
            width = width * Ratio;
            height = height * Ratio;
        }
        return {
            width: width,
            height: height
        };
    },
    //属性链判断
    checkObjChain:function(obj,proStr,val){
        var proArr=proStr.split('.');
        var rst=false;
        var isFn=typeof val==='function';
        obj||(obj=window);
        for(var i= 0,il=proArr.length;i<il;i++){
            rst=obj[proArr[i]];
            if(typeof rst==='undefined')return rst;
            obj=rst;
        }
        if(arguments.length<3)return obj;
        return isFn?
            val(rst):
            rst===val;
    },

    //安全获取某个属性值 如a.b.c.d.e  getSafeValue(a,'b.c.d.e','默认值');
    getSafeValue:function(obj,proStr,def){
        var proArr=proStr.split('.');
        var rst=false;
        var len=proArr.length;
        obj||(obj=window);
        for(var i= 0,il=len;i<il;i++){
            rst=obj[proArr[i]];
            if(typeof rst==='undefined')
                return (i==len-1)?rst:def;
            obj=rst;
        }
        return rst;
    },
    //添加样式表
    addStyleSheet:function(text,id){
        var style=document.createElement('style');
        style.type='text/css';
        if(id){
            $('#'+id).remove();
            style.id=id;
        }
        if(toolLq.checkObjChain(style,'styleSheet.cssText')){
            style.styleSheet.cssText=text;
        }else{
            style.appendChild(document.createTextNode(text));
        }
        document.head.appendChild(style);
    },
    removeStyleSheet:function(id){
        $('#'+id).remove();
    },
    //collapse 键值相同的属性是否合并，为true时进行合并（进行拼接）为false时进行覆盖
    collectionToObj:function(collection,key,valueKey,collapse){
        var rst={};
        var item;
        var rstVal;
        var itemVal;
        key||(key='name');
        valueKey||(valueKey='value');
        for(var i= 0,il=collection.length;i<il;i++){
            item=collection[i];
            rstVal = rst[item[key]];
            itemVal = item[valueKey];
            if(collapse){
                rst[item[key]]=rstVal?rstVal+CheckboxValueSeparator+itemVal:itemVal;
            }else{
                rst[item[key]]=item[valueKey];
            }
        }
        return rst;
    },
    collectionMergeToObj:function(collection,name,value){
        var rst={};
        var item;
        name||(name='name');
        value||(value='value');
        for(var i= 0,il=collection.length;i<il;i++){
            item=collection[i];
            rst[item[name]]=item[value];
        }
        return rst;
    },
    getFormData:function(jqForm,jqSelc,isDeep){
        jqForm=$(jqForm);
        if(jqSelc){
            jqForm=toolLq.findJqSelc(jqForm,jqSelc,isDeep);
        }
        //对class中带有 'data-input' 的标签进行特殊处理
        //<div class="progress data-input" name="" data-name=""></div>

        var dataInput = jqForm.find('.data-input'),
            data = {},
            dataName,
            name;
        _.each(dataInput, function(ele, index, list){
            ele = $(ele);
            name = ele.attr('name');
            dataName = name.length>1?(name[0].toLowerCase() + name.substring(1)):name.toLowerCase();
            data[name] = ele.data(dataName);
        });
        return _.extend(toolLq.collectionToObj(jqForm.serializeArray(), null, null, true), data);
    },
    getDuration:function(start,end){
        start=(new Date(start)).getTime();
        end=(new Date(end)).getTime();
        return Math.abs(((end-start)/(24*60*60*1000)).toFixed(1)-0);
    },
    getUpJqobj:function(jqThis,jqSelc){
        jqThis=$(jqThis);
        var jqObj=jqThis.filter(jqSelc);
        if(jqObj.length<1){
            jqObj=jqThis.closest(jqSelc);
        }
        return jqObj;
    },
    getUpFormData:function(jqObj,jqSelc){
        jqObj=$(jqObj);
        jqSelc||(jqSelc='form');
        var jqForm=toolLq.getUpJqobj(jqObj,jqSelc);
        var data=jqForm.serializeArray();
        return toolLq.collectionMergeToObj(data);
    },
    setUpFormData:function(jqForm,data){
        jqForm=toolLq.getUpJqobj(jqForm,'form');
        toolLq.setFormData(jqForm,data);
    },
    setFormData:function(jqForm,data){
        var html=[];
        var jqInput;
        for(var k in data){
            jqInput=$('input[name="'+k+'"]',jqForm);
            if(jqInput.length>1){
                jqInput.val(data[k]);
            }else{
                html.push('<input type="hidden" name="'+k+'" value="'+data[k]+'" />');
            }
        }
        html=html.join('');
        html&&jqForm.append(html);
    },
    setFormModel:function(jqForm,model){
        jqForm=toolLq.findJqSelc(jqForm,'.autoForm');
        jqForm.data('formImodel',model);
    },
    domDeferrd:function() {

    },
    upFindAttr:function(jqObj,key,isSet){
        var jqP=$(jqObj);
        var rst;
        if(_.isUndefined(rst=jqP.attr(key))){
            jqP=jqP.closest('['+key+']');
            rst=jqP.attr(key);
        }
        return isSet?
            {jqP:jqP,attr:rst}:
            rst;
    },
    //优先过滤当前或向下寻找jqSelc，若开启深度查找，则从从父级元素开始递归该过程
    findJqSelc:function(jqP,jqSelc,isDeep,method){
        var jqObj=jqP.filter(jqSelc);
        if(jqObj.length>0)
            return jqObj;

        method||(method='find');
        if((jqObj=jqP[method](jqSelc)).length>0){
            return jqObj;
        }
        //Todo：后期改为null
//        if(!isDeep) return null;
        if(!isDeep) return jqObj;

        return toolLq.findJqSelc(jqP.parent(),jqSelc,isDeep,method);
    },
    //递归向前查找指定元素
    prevJqSelc:function(jqObj,jqSelc,isNext){
        var method=isNext?'next':'prev';
        method+='All';
        jqObj=toolLq.findJqSelc(jqObj,jqSelc,true,method);
        return jqObj.last();
    },
    formEnable:function(jqP,jqSelc,isDeep){
        //恢复默认的禁用
        var jqSubmit=toolLq.findJqSelc(jqP,jqSelc,isDeep);
        if(!jqSubmit)return null;
        jqSubmit=jqSubmit.on('submit',function(e){
            e.preventDefault();
        }).find('input[type="submit"]');

        return jqSubmit.removeProp('disabled').end();
    },
    preAnimStyle:function(jqObj,style){
        jqObj.addClass('fn-notrans').
            css(style);
        toolLq.refreshStyle(jqObj[0],'transition');
        jqObj.removeClass('fn-notrans');
        toolLq.refreshStyle(jqObj[0],'transition');
    },
    //url http://www.web-tinker.com/article/20286.html
    refreshStyle:function(dom,attr){
        return getComputedStyle(dom)[attr];
    },
    reflowCss:function(jqObj,name,prevStyle,lastStype){
        lastStype||(lastStype='');
        jqObj.css(name,prevStyle);
        toolLq.refreshStyle(jqObj[0],name);
        jqObj.css(name,lastStype);
        toolLq.refreshStyle(jqObj[0],name);
    },
    args:function(args,start,len){
        return Array.prototype.slice.call(args,start,len);
    },
    /**
     * 实现继承
     * @param {Object} proto 子类型的新proto方法，可覆盖父类,
     * proto.constructor为新子类方法的构造器
     * @param {Object} static 子类的静态方法
     */
    Extend:function(protoProps, staticProps) {
        var parent = this;
        var child;

        // The constructor function for the new subclass is either defined by you
        // (the "constructor" property in your `extend` definition), or defaulted
        // by us to simply call the parent's constructor.
        if (protoProps && _.has(protoProps, 'constructor')) {
            child = protoProps.constructor;
        } else {
            child = function () {
                return parent.apply(this, arguments);
            };
        }

        // Add static properties to the constructor function, if supplied.
        _.extend(child, parent, staticProps);

        // Set the prototype chain to inherit from `parent`, without calling
        // `parent`'s constructor function.
        var Surrogate = function () {
            this.constructor = child;
        };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate;

        // Add prototype properties (instance properties) to the subclass,
        // if supplied.
        if (protoProps) _.extend(child.prototype, protoProps);

        // Set a convenience property in case the parent's prototype is needed
        // later.
        child.__super__ = parent.prototype;

        return child;
    },
    extend:function(parent){
        return toolLq.Extend.apply(parent,Array.prototype.slice.call(arguments,1));
    },
    isModel:function(model,key){
        var Backbone=window.Backbone;
        key||(key='Model');
        if(Backbone&&Backbone[key]){
            return model instanceof Backbone[key];
        }
        return false;
    },
    isList:function(list){
        return toolLq.isModel(list,'Collection');
    },
    parseJSON:function(str){
        return typeof str==='object'?
            str:
            JSON.parse(str);
    },
    getDomModel:function(jqObj,list){
        var data;
        if(list instanceof Backbone.Collection){
            data=toolLq.upFindAttr(jqObj,'data-id');
            return list.get(data);
        }
        data=toolLq.upFindAttr(jqObj,'data-model',true);
        return data.jqP.data('modelref');
    },
    getDomList:function(jqObj,isNext){
        var list;
        if(jqObj.attr('data-model')=='lqList'){
            list=jqObj.data('modelref');
        }
        if(list instanceof Backbone.Collection){
            return list;
        }
        jqObj=toolLq.prevJqSelc(jqObj,'[data-model="lqList"]');
        return {
            jqP:jqObj,
            list:jqObj.data('modelref')
        };
    },
    revertKeyValue:function(data){
        var rst={};
        for(var k in data){
            rst[data[k]]=k;
        }
        return rst;
    },
    getMinMaxFromList:function(list,key){
        var rst={
            start:list[0][key],
            end:list[0][key]
        };
        var item;
        for(var i= 1,il=list.length;i<il;i++){
            item=list[i];
            if(!item||(item=item[key]))continue;
            if(item<rst.start){
                rst.start=list[i];
            }else if(item>rst.end){
                rst.end=list[i];
            }
        }
        return rst;
    },
    isJsonResponse:function(xhr){
        var type=xhr.getResponseHeader('Content-Type');
        return /application\/json/i.test(type);
    },
    addCalcWHClass:function(jqP,isReset){
        if(isReset){
            jqP.parent().removeClass('calc-wh-box');
            jqP.removeClass('calc-wh');
            return;
        }
        jqP.parent().addClass('calc-wh-box');
        jqP.addClass('calc-wh');
    },
    heightAnimate:function(jqP,time){
        var height;
        if(!time){
            height=jqP.height();
            jqP.addClass('fn-ohid').css({
                height:height
            });
            return;
        }
        height=jqP[0].scrollHeight;
        jqP.removeClass('fn-ohid').stop(true).animate({
            height:height
        },time,function(){
            jqP.css('height','auto');
            jqP=null;
        });
    },
    toggleHover:function(jqObj,className,isReverse){
        className||(className='hover');
        if(isReverse){
            jqObj.siblings().addClass(className);
            jqObj.removeClass(className);
        }else{
            jqObj.siblings('.'+className).removeClass(className);
            jqObj.addClass(className);
        }
    },
    animate:function(jqObj,css,autoRemove){
        var defer;
        if(jqObj.length<1){
            toolLq.warn('参数为空');
            return;
        }
        jqObj.addClass('fn-notrans');
        toolLq.refreshStyle(jqObj[0],'transition');
        toolLq.refreshStyle(jqObj[0],'webkitTransition');
        toolLq.refreshStyle(jqObj[0],'animation');
        toolLq.refreshStyle(jqObj[0],'webkitAnimation');
        jqObj.removeClass(css+' fn-notrans');
        toolLq.refreshStyle(jqObj[0],'transition');
        toolLq.refreshStyle(jqObj[0],'webkitTransition');
        toolLq.refreshStyle(jqObj[0],'animation');
        toolLq.refreshStyle(jqObj[0],'webkitAnimation');
        if(autoRemove){
            var ev=toolLq.constant;
            ev=ev.evTransitionEnd+' '+ev.evAnimationEnd;
            defer= $.Deferred();
            jqObj.off(ev).on(ev,function(){
                var jqThis=$(this);
                if(!jqThis)return;
                jqThis.off(ev);
                jqThis.removeClass('animated'+' '+css);
                typeof autoRemove=='string'&&
                    jqThis.addClass(autoRemove);
                css=null;
                ev=null;
                defer.resolveWith(null,[jqThis]);
            });
        }
        jqObj.addClass('animated'+' '+css);
        return defer;
    },
    removeAnimate:function(jqObj,css,cb){
        var ev=toolLq.constant;
        ev=ev.evTransitionEnd+' '+ev.evAnimationEnd;
        jqObj.on(ev,function(){
            var jqThis=$(this);
            if(!jqThis)return;
            if(typeof cb=='string'){
                jqThis.addClass(cb);
            }else if(typeof cb=='function'){
                cb.apply(null,arguments);
            }
            jqThis.off(ev);
            css=null;
            cb=null;
            ev=null;
        });
        jqObj.removeClass(css);
        toolLq.refreshStyle(jqObj[0],'transition');
    },
    getUrlParam:function(str){
        str=decodeURIComponent(str);
        str=str.split('&');
        var item,key,val;
        var rst={};
        for(var i= 0,il=str.length;i<il;i++){
            item=str[i].split('=');
            key=item[0];
            val=item[1];
            if(key){
                rst[key]=val;
            }
        }
        return rst;
    },
    getHashParam:function(){
        var param=location.hash.replace(/^[^?]*\?/i,'');
        if(!param)return {};
        return toolLq.getUrlParam(param);
    },
    tabToggleClass:function(jqObj,className){
        className||(className='cur');
        jqObj.addClass(className).siblings('.'+className).
            not(jqObj).removeClass(className);
    },
    getPathHash:function(url){
        var reg=toolLq.constant.pathReg;
        url||(url=location.href);
        return url.replace(reg,'$1');
    },
    setCaretPosition:function(ctrl, pos){
        if(ctrl.setSelectionRange)
        {
            ctrl.focus();
            ctrl.setSelectionRange(pos,pos);
        }
        else if (ctrl.createTextRange) {
            var range = ctrl.createTextRange();
            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
    },
    ajaxLoadingStart:function(){},
    ajaxLoadingEnd:function(){},
    /**
     * @description 将后台返回的经纬字符串转化为{lng: ,lat: }形式
     * @param addr
     */
    parseAddrToLngLat: function (addr, lngAtFirst) {
        if(!addr){
            return addr;
        }else{
            addr = addr.split(',');
            return lngAtFirst?{
                lng: addr[0],
                lat: addr[1]
            }:{
                lng: addr[1],
                lat: addr[0]
            };
        }
    },
    getDomain:function(){
        return location.protocol+'//'+location.host;
    },
    objEscape:function(obj){
        var item;
        for(var k in obj){
            item=obj[k];
            if(typeof item=='string'){
                obj[k]=_.escape(item);
            }
        }
    },
    getAjaxOrgRes:function(opt){
        var xhr=opt.xhr;
        if(!xhr)return null;
        return toolLq.isJsonResponse(xhr)?
            xhr.responseJSON:
            xhr.responseText;
    },
    //obj的属性值都为字串，为函数或其他对象引用时，可能报错
    getUniqTrueValues:function(obj,keys){
        var map={};
        var rst=[];
        if(keys&&!(keys instanceof Array)){
            keys=Array.prototype.slice.call(arguments,1);
        }
        keys||(keys=obj);

        for(var k in keys){
            obj[k]&&(map[obj[k]]=k);
        }
        for(var val in map){
            rst.push(val);
        }
        return rst;
    },
    checkEvTrace:function(jqSelc,event){
        if(arguments.length<1){
            $(jqSelc).parents().off(event+'.checkEventTrace');
            return;
        }
        var lookJqEvent=_.debounce(toolLq.lookJqEvent,400);
        $(jqSelc).parents().off(event+'.checkEventTrace').
            on(event+'.checkEventTrace',function(e){
            toolLq.log.checkEvTrace={
                dom: e.currentTarget,
                event:event
            };
            toolLq.log('事件可以冒泡至当前dom:', e.currentTarget);
            lookJqEvent();
        });
    },
    lookJqEvent:function(event,dom,noDebug){
        var ev=toolLq.log.checkEvTrace;
        dom||(dom=ev&&ev.dom);
        event||(event=ev&&ev.event);
        var events=$._data(dom).events[event];
        if(!events|| _.isEmpty(events)){
            console.log('未找到事件');
            return;
        }
        if(noDebug){
            console.log('dom事件为：');
            console.log(events);
            return;
        }
        _.each(events,function(fn,index){
            fn=fn.handler;
            if(dom!=window&&dom.tagName.toLowerCase()==='html'){
                console.log('当前dom为Document，在console中敲击fn查看事件处理函数地址');
                debugger;
            }else{
                console.log('请在console中敲击fn查看事件处理函数地址');
                debugger;
            }
        });
    },
    /**
     *
     * @returns {{}} 返回检测结果 {[NavigatorName]:[Version]}
     */
    navigatorTest: function () {
        var Sys = {};
        var ua = navigator.userAgent.toLowerCase();
        var s;
        if(MstConfig.NavigatorTest != null){
            Sys = MstConfig.NavigatorTest;
        }else{
            MstConfig.NavigatorTest = Sys;
            (s = ua.match(/msie ([\d.]+)/)) ? Sys.ie = s[1] :
                (s = ua.match(/firefox\/([\d.]+)/)) ? Sys.firefox = s[1] :
                    (s = ua.match(/chrome\/([\d.]+)/)) ? Sys.chrome = s[1] :
                        (s = ua.match(/opera.([\d.]+)/)) ? Sys.opera = s[1] :
                            (s = ua.match(/version\/([\d.]+).*safari/)) ? Sys.safari = s[1] : 0;
        }
        return Sys;
    },
    loadMVModule:function(name,cb){
        var path='views/'+name+'/main.';
        var view=path+'v.js';
        var model=path+'m.js';
        seajs.use([model,view],cb);
    },
    values:function(obj,keys){
        var rst=[];
        if(!(keys instanceof Array)){
            keys=toolLq.args(arguments,1);
        }
        for(var i= 0,il=keys.length;i<il;i++){
            rst.push(obj[keys[i]]);
        }
        return rst;
    },
    /**
     * 设置某个Date对象的小时和分钟为当前时间
     * @param date 要设置的Date
     * @return {Date}
     */
    setCurrentTime: function (date) {
        var now = new Date(),
            currentHour = now.getHours(),
            currentMinute = now.getMinutes();
        date.setHours(currentHour);
        date.setMinutes(currentMinute);
        return date;
    },
    /**
     * 走马灯title效果
     * @param text 显示内容
     * @param {Number} [times=3] 数值小于100时，
     *      表示循环显示times次后关闭，大于100时则times毫秒后关闭
     * @param {Number} [interval=200] 字符滚动频率，单位毫秒数
     */
    noticeTitle:function(text,times,interval){
        if(!text)return toolLq.emptyFun;
        var notice=toolLq.noticeTitle;
        if(!notice.timer){
            notice.title=document.title;
        }else{//若已经存在notice，则直接播放下一条
            toolLq.noticeTitleClose(true);
        }
        text=text.split('');
        interval||(interval=400);
        times||(times=1);
        var len=null;
        if(times<100){
            len=text.length*times;
        }
        var pos=0;
        notice.timer= setInterval(function(){
            if(len&&(len--)<0){//次数达到
                toolLq.noticeTitleClose();
                return;
            }
            if(!len&&(times-=interval)<0){//时间超时
                toolLq.noticeTitleClose();
                return;
            }
            pos>=text.length&&(pos=0);
            document.title=text.slice(pos++).join('');
        },interval);
    },
    noticeTitleStack:function(text,times,interval){

    },
    noticeTitleClose:function(noTitle){
        var notice=toolLq.noticeTitle;
        if(!notice.timer)return;
        clearInterval(notice.timer);
        notice.timer=null;
        if(noTitle||notice.stack){//队列或禁止title
            return;
        }
        notice.title&&(document.title=notice.title);
    },
    getAutoWinH:function(jqObj,offsetH){
        return $(window).height() - jqObj.offset().top-(offsetH||0);
    },
    setAutoWinH:function(jqObj,offsetH){
        var height=toolLq.getAutoWinH(jqObj,offsetH);
        jqObj.height(height);
    },
    result:function(fn){
        if(typeof fn==='string'){
            return fn;
        }
        var args;
        if(typeof fn==='function'){
            args=Array.prototype.slice.call(arguments,2);
            return fn.apply(arguments[1],args);
        }
    },
    //liuhao 获取IM中消息的简略显示，主要对表示文件和图片的字符串进行替换
    getShortIMMsg: function (str) {
        return str.replace(MstConfig.RegExp.IMFileAndImg, function(s, $1, $2){
             if($1 == 'img'){
                 return "[图片]";
             }else{
                 return "[文件]";
             }
        });
    },
    //判断是否处于全屏模式
    isFullScreenMode: function () {
        return !!$('.full-screen-dialog').length;
    },
    //@description 设置Date的时间为预定义的上下班时间
    //@param {Date} date
    //@param {Boolean} isOff 是否是下班时间
    //@return {Date}
    setWorkTime: function (date, isOff) {
        var key = isOff?'off':'on';
        date.setMinutes(WorkTime['minute'][key]);
        date.setHours(WorkTime['hour'][key]);
        return date;
    },
    unescape: function (str) {
        var escapeEle = document.createElement('DIV');
        escapeEle.innerHTML = toolLq.filterLt(str);
        //bugfix firefox不支持innerText属性
        return escapeEle.innerText || escapeEle.textContent;
    },
    updateTaskCount: function(collection) {
        if (!collection) return;
        var taskCount = collection.filter(MstFilter.todayTodo).length;
        $('#undertakingTaskCount').text(taskCount || 0);
    },
    getFileTypeIcon: function (fileType) {
        var FileTypeIcon = MstConfig.FileTypeIcon,
            iconPath = MstConfig.getStaticPath('images/filetype/'),
            iconName;
        iconName = FileTypeIcon.hasOwnProperty(fileType)?FileTypeIcon[fileType]:'def.png';
        return iconPath + iconName;
    },
    isImg: function (fileType) {
        return {jpg: "", jpeg: "", png: "", gif: "", bmp: ""}.hasOwnProperty(fileType);
    },
    getFileInfo: function (fileUrl) {
        var match = fileUrl.match(/[^\?]+\?[a-zA-Z]+=([^&\.]+(\.[^&]+))/);
        if(!match || !match.length) return null;
        return {
            Url: fileUrl,
            Name: match[1],
            Postfix: match[2]
        };
    },
    getFileExt:function(path){
        if(!path)return '';
        var ext=path.match(/\.([^.]+)$/);
        return ext?ext[1]:'';
    },
    clearFileExt:function(path){
        if(!path)return '';
        return path.replace(/\.([^.]+)$/,'');
    },
    setFileExt:function(path,ext){
        if(!ext)return path;
        path||(path='');
        if(ext[0]!='.'){
            ext='.'+ext;
        }
        path+=ext;//(\.exe){2,}$ ext
        var reg=new RegExp('('+ext.replace('.','\\\.')+'){2}$','i');
        return path.replace(reg,ext);
    },
    humanFileSize:function(size,fixNumber){
        fixNumber||(fixNumber=0);
        var humanSize=size-0;
        var humanSizeString=['KB','MB','GB','TB'];
        for(var i= 0,il=humanSizeString.length;i<il;i++){
            humanSize=humanSize/1024;
            if(humanSize<1000)break;
        }
        if(i>3)i=3;
        var rst=[humanSize.toFixed(fixNumber),humanSizeString[i]];
        rst.toString=function(){
            return this[0]+this[1];
        };
        return rst;
    },
    /**
     * 检查指定元素是否可用，显示在页面中、
     * @param selector
     * @param jqP
     * @param cb
     */
    targetAvailable: function (selector, jqP, cb) {
        var cnt = 0, maxCnt = 5, intervalId, lastDimensions;
        function checkTarget(){
            var target = $(selector, jqP), dimensions;
            if(cnt == maxCnt){
                clearInterval(intervalId);
                cb.call(null, false);
                return;
            }
            if(target.length && target.css('display') != 'none'){
                dimensions = _.extend({
                    width: target.width(),
                    height: target.height()
                }, target.offset());
                if(_.isEqual(dimensions, lastDimensions)){
                    clearInterval(intervalId);
                    cb.call(null, true);
                }else{
                    lastDimensions = dimensions;
                }
            }
            cnt++;
        }
        checkTarget();
        intervalId = setInterval(checkTarget, 300);
    },
    cVar:function(obj){
        for(var k in obj){
            obj[k]=null;
        }
        return null;
    },
    /*
    * 管理与某个dom相关的所有deferred，实现异步队列功能
    *
    * */
    /**
     * 添加deferred
     *
     * @param jqObj
     * @param deferred
     * @param {String} key 将deferred与key关联，用于remove和get
     */
    addDeferred:function(jqObj,deferred,key){
        var deferreds=jqObj.data('DomDeferredMgr');
        if(!deferreds){
            deferreds={};
        }
        if(!key){
            key= _.uniqueId('defer_');
        }



    },
    //getDeferred:fun
    //disable状态参考html规范 input、button中设置 disabled
    //同时支持className为disable
    documentPluginOn: function (evName, className, fn) {
        evName = evName + '.' + className;
        $(document).off(evName).on(evName, '.' + className, function (e) {
            var jqPlugin = $(e.currentTarget);
            if (jqPlugin.hasClass('disabled') ||
                jqPlugin.hasClass('disable')) {
                toolLq.warn('插件禁用！');
                return;
            }
            fn.call(this, jqPlugin, e);
        });
    },
    disablePlugin: function (jqPlugin, otherClass) {
        jqPlugin.addClass('disable disabled ' + otherClass);
    },
    enablePlugin: function (jqPlugin, otherClass) {
        jqPlugin.removeClass('disable disabled ' + otherClass);
    },
    documentPlugin:function(plugins){
        var param;
        for(var k in plugins){
            param= k.split(' ');
            toolLq.documentPluginOn(param[0],param[1],plugins[k]);
        }
    }
};
$.each(['log','info','warn','error'],function(index,method){
    tools[method]= function(){
        var args=Array.prototype.slice.call(arguments,0);
        args.unshift(method);
        tools._log.apply(this,args);
        tools._trace.call(this);
    }
});
var toolLq=tools;
var toolDate={
    //返回当年的第几周
    getYearWeek:function(date){
        var start=new Date(date.getFullYear()+'/01/01 00:00:00');
        var days=(date-start)/(24*60*60*1000);
        var startDay=start.getDay();
        var rst=1;
        //第一天是周一的情况
        if(startDay==1){
            return Math.ceil(days/7);
        }
        //第一天是周日的情况
        if(startDay==0){
            return Math.ceil((days-1)/7)+1;
        }
        return Math.ceil((days-(8-startDay))/7)+1;
    }
};

/*避免泄漏的方法，声明变量后同时在函数中置null,其他闭包引用后会发生null的错误
 然后再采取措施避免变量泄漏（设置defer变量后在引用函数中置null或将闭包变量注册到
 collectGarbage中）
 */
var collectGarbage={
    fns:{},
    add:function(fn,key){
        var fsn='fn'+(new Date()).getTime()+Math.floor(Math.random()*1000);
        this.fns[fsn]=fn;
    },
    clear:function(){
        for(var k in this.fns){
            if(typeof this.fns[k]==='function'){
                this.fns[k]();
                delete this.fns[k];
            }
        }
        typeof window.CollectGarbage==='function' && CollectGarbage();
    }
};

/**
 * Events类 子类中必须实现events成员，用于存储处理函数，结构如下：<br />
 * events:{
    onMessage:[]
   }
 * 暂时没做event type限制
 * @class
 */
function LqEvents(config){
    this.events={
/*        message:[],//收到消息
        msgChange:[],//消息变更
        stateChange:[],//状态变更
        winParamChange:[],//窗体参数变更
        noReadChange:[]//未读消息变更*/
    };
}
(function(c,p){
    /**
     * 事件触发器
     * @param {String} type 事件类型，暂不支持函数命名空间click.xxx
     * @param {Object} event 需要传递的event对象
     * @param {Object} [event.stop=false] 设为true时阻止之后的处理函数运行，按照处理函数注册先后排列
     */
    p.trigger=function(type,event){
        event= $.extend(true,{stop:false},event);

        for(var i= 0,il=this.events[type].length;i<il;i++){
            this.events[type][i](event);
            if(event.stop)return;
        }
    };
    /**
     * 事件绑定
     * @param {String} type 事件类型，暂不支持函数命名空间click.xxx.xxx
     * @param {Function} fn 事件处理函数
     */
    p.bind=function(type,fn){
        if(arguments.length<2||typeof fn!== 'function')return;
        if(!(type in this.events))this.events[type]=[];
        this.events[type].push(fn);
    };
    /**
     * 移除事件绑定 无参数时，移除所有事件；
     * @param {String} [type] 事件类型，暂不支持函数命名空间click.xxx.xxx
     * @param {Function} [fName] 函数引用，不能为函数直接量
     */
    p.unbind=function(type,fName){
        if(arguments.length<1){//无参数
            this.events={};
            return this;
        }
        if(typeof type==='string'&&!fName){//参数只有一个
            this.events[type]=[];
            return this;
        }
        if(typeof type!=='string'||typeof fName!=='function')return this//第一或第二参数无效

        for(var i=this.events[type].length;i>=0;i--){
            if(this.events[type][i]===fName){
                this.events[type].splice(i,1);
                return this;
            }
        }
    };
})(LqEvents,LqEvents.prototype);

function StaticType(types){
    var _types=toolLq.revertKeyValue(types);
    types.getName=function(index){
        return _types[index];
    };
    return types;
}

(function($){
    $.ajaxSetup({
        cache:false
    });
})(jQuery);