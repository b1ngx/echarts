(function(B){
    var SyncMethod=[
        function(name,dName,opt){
            opt||(opt={});
            return function(Collection,option){
                var data=this.get(dName);
                option=_.extend(opt,option);
                var collection=this[name]=new Collection(null,option);
                if(!collection){
                    ErrObj(ErrCode.system,'同步collection不存在:',collection);
                    return;
                }
                //liuhao 添加一个关联Model的引用
                collection.relatedModel = this;
                if(_.isFunction(collection.syncParse)){
                    data=collection.syncParse(data);
                }
                collection.reset(data, {silent: true, parse: true});

                //监听底层模型变化，同步Foods数据
                this.listenTo(collection,'add remove change reset',this[name+'Trigger']);
                this.on('change:'+dName,this[dName+'Change']);
                return collection;
            }
        },
        function(name,dName,opt){
            opt||(opt={});
            return function(){
                var collection=this[name];
                var data=this.get(dName);
                if(_.isFunction(collection.syncParse)){
                    data=collection.syncParse(data);
                }
                collection.reset(data, _.extend({parse: true},opt));
            }
        },
        function(name,dName){
            return function(){
                var collection=this[name];
                var hasConvert= _.isFunction(collection.syncJSON);
                var data=hasConvert?
                    collection.syncJSON():
                    collection.toJSON();

                this.set(dName,data,{silent:true});
                //触发'change:Food_food' list model
                this.trigger('change:'+dName+'-'+name,collection,this);
            }
        },
        function(name,dName){
            return function(){
                var collection=this[name];
                collection.relatedModel = null;
                this.stopListening(collection);
                this.stopListening();
            }
        }
    ];
    var EvChangeReg=/change:/i;
    var Elq=B.Elq={
        /**
         * 同步映射model中某一属性到collection
         * @param {String} name model中额为存储的collection引用名
         * @param {String} dName model中的属性名字
         * @returns {Object} 生成的方法，使用_.extend扩展到原始model中即可
         */
        syncCollection:function(Model,name,dName,opt){
            var methods=[name+'Init',dName+'Change',name+'Trigger',name+'Destroy'];
            Model||(Model={});
            for(var i= 0,il=methods.length;i<il;i++){
                Model[methods[i]]=SyncMethod[i](name,dName,opt);
            }
            return Model;
        },
        isEvChange:function(event){
            return EvChangeReg.test(event);
        },
        superMethod:function(_super,method){
            return _super.prototype[method];
        },
        superExtend:function(_super,key,attr){
            return _.extend({},Elq.superMethod(_super,key),attr);
        },
        superRun:function(_super,context,args){
            return _super.apply(context,args);
        },
        superMethodRun:function(_super,method,context,args){
            return _super.prototype[method].apply(context,args);
        },
        backboneTrigger:function(ev,This,retain){
            var arg=Array.prototype.slice.call(arguments,3);
            return function(){
                var args= Array.prototype.slice.call(arguments,0);
                This.trigger.apply(This,[ev].concat(arg).concat(args));
                if(retain)return;
                ev=null;
                This=null;
                retain=null;
                arg=null;
            }
        },
        domEvTrigger:function(ev,key){
            return function(e){
                var jqObj=$(e.currentTarget);
                var args= Array.prototype.slice.call(arguments,0);
                var arg=toolLq.upFindAttr(jqObj,key);
                this.trigger.apply(this,[ev,arg,jqObj].concat(args));
            }
        },
        domEvTriggerRun:function(method,key,ev,context){
            return function(e){
                var jqObj=$(e.currentTarget);
                var args= Array.prototype.slice.call(arguments,0);
                var arg=toolLq.upFindAttr(jqObj,key);
                var This=context||this;

                if(!(method in This))return;//未找到处理函数
                This[method].apply(This,[arg,jqObj].concat(args));
                ev&&This.trigger.apply(This,[ev,arg,jqObj].concat(args));
            }
        },
        getViewEvData:function(view,e){
            var jqObj=$(e.currentTarget);
            var id=jqObj.attr('data-id');
            var list=view.collection;
            var model;
            if(!id){
                id=toolLq.upFindAttr(jqObj,'data-id');
            }
            if(!id||!(model=list.get(id)))return false;
            return {
                jqObj:jqObj,
                id:id,
                model:model
            }
        },
        falseFilter:{
            falseFilter:function(){
            return false;
        }},
        trueFilter:{
            trueFilter:function(){
            return true;
        }},
        updateDomData:function(jqP,data){
            var jqObj;
            var tagName;
            var dom;
            var defaultVal;
            for (var k in data) {
                jqObj = jqP.find('.' + k + 'Tpl');
                if (jqObj.length < 1)continue;
                for(var j= 0,jl=jqObj.length;j<jl;j++){
                    dom=jqObj[j];
                    defaultVal = $(dom).data('defaultval'); //liuhao 2014-12-02 data中值为空时显示标签上设置的默认值
                    tagName=dom.tagName.toLowerCase();
                    if (tagName==='input'||tagName==='textarea') {
                        if(dom.type.toLowerCase()=='checkbox'){
                            dom.checked=!!data[k];
                        }else{
                            $(dom).val(data[k]||defaultVal);
                        }
                    } else {
                        $(dom).html(data[k]||defaultVal);
                    }
                }
            }
        },
        setInputValue:function(input){
            if(input.type.toLowerCase()=='checkbox'){
                input.checked=!!data[name];
            }else{
                input.value=data[name];
            }
        },
        updateFormData:function(jqP,data){
            var input;
            var elements=jqP[0].elements;
            for (var name in data) {
                input = elements[name];
                if(!input)continue;
                //liuhao 2014-12-02 input可能没有type属性（多个元素，比如单选框，多选框）
                if(input.type && input.type.toLowerCase()=='checkbox'){
                    input.checked=!!data[name];
                }else if(input.length && input[0].type && input[0].type.toLowerCase()=='checkbox'){ //多个多选框
                    var items = data[name],
                        $inputs = $(input);
                    items = items.split(CheckboxValueSeparator);
                    if(items.length){
                        //TODO 使用了嵌套循环，效率较低
                        for(var i= 0;i<items.length;i++){
                            for(var j=0;j<input.length;j++){
                                if(input[j].value==items[i]){
                                    input[j].checked=true;
                                    break;
                                }
                            }
                        }
                    }
                }else{
                    input.value=data[name];
                }
            }
            //liuhao 2014-12-02 对含有'data-input'的标签，更新数据时，同时更新data-<%name%>的值
            var dataInput = jqP.find('.data-input'),
                attr_name;
            _.each(dataInput, function(ele){
                ele = $(ele);
                attr_name = ele.attr('name');
                ele.data(attr_name.toLowerCase(), data[attr_name]);
            });
        },
        triggerChangeKey:function(model,key,opt){
            var event=key?'change:'+key:'change';
            opt||(opt={});
            model.trigger(event,model,model[key],opt);
        },
        forceSet:function(model,key,val,opt){
            model.set(key,val,opt);
            Elq.triggerChangeKey(model,key,opt);
        },

        removeFilter:function(filters,key){
            if(!key){
                filters._filter={};
                filters._index=[];
            }
            if(key in filters){
                delete filters._filter[key];
                filters._index.splice(_.indexOf(filters._index,key),1);
            }
            return filters;
        },
        wrapFilter:function(attrs){
            return function(model) {
                for (var key in attrs) {
                    if (attrs[key] !== model.get(key)) return false;
                }
                return true;
            }
        },
        /**
         * 生成filters数据结构 {key:filter,key1:filter} ['key','key1']
         * @param [Array] filters 数组存放的filter,可保证顺序过滤[filter,[filter,key]]
         * @returns {*}
         */
        createFilter:function(filters,rst){
            var filter,key;
            var rstFilter={},rstIndex=[];
            if(rst){
                rstFilter=rst._filter;
                rstIndex=rst._index;
            }
            if(filters&&!(filters instanceof Array)){
                filters=[filters];
            }

            for(var i= 0,il=filters.length;i<il;i++){
                filter=filters[i];
                if(filter instanceof Array){
                    key=filter[1];
                    filter=filter[0];
                }
                key||(key= _.uniqueId('filter_'));
                $.isPlainObject(filter)&&(filter=Elq.wrapFilter(filter));
                if(!filter||!key)continue;

                rstFilter[key]=filter;
                rstIndex.push(key);
                key='';
                filter=null;
            }
            return {
                _filter:rstFilter,
                _index:rstIndex
            };
        },
        checkFilter:function(model,filter){
            var tempFilter;
            var index=filter._index;
            filter=filter._filter;

            for(var i= 0,il=index.length;i<il;i++){
                tempFilter=filter[index[i]];
                if(tempFilter&&_.isFunction(tempFilter)&&!tempFilter(model)){
                    return false;
                }
            }
            return true;
        },
        getFilterArray:function(collection,filters){
            var filterArray;
            if(!collection)return [];
            if(!filters|| _.isEmpty(filters)){
                return collection.models.slice(0);
            }
            filterArray=collection.filter(function(model){
                return Elq.checkFilter(model,filters);
            })||[];
            filters=null;
            return filterArray;
        },

        willRunWhen:function(total){
            var cur=0;
            var cbs=[];
            var rst;
            total||(total=1);

            rst=function(fn,context,args){
                var cb={};
                if(_.isFunction(fn)){
                    cb.fn=fn;
                    cb.context=context||null;
                    cb.args=Array.prototype.slice.call(arguments,2);
                    cbs.push(cb);
                    return;
                }
                rst.done();
            };
            rst.done=function(){
                var cb;
                cur++;
                if(cur<total)return;
                for(var i= 0,il=cbs.length;i<il;i++){
                    cb=cbs[i];
                    cb.fn.apply(cb.context,cb.args);
                }
                cbs=[];
                cur=0;
            };
            return rst;
        },
        strBuild:function(){
            var rst=[];
            var arg=Array.prototype.slice.call(arguments,0);
            var item;
            for(var i= 0,il=arg.length;i<il;i++){
                item=arg[i];
                if(typeof item=='object'){
                    item=JSON.stringify(item);
                }
                rst.push(item);
            }
            return rst.join('');
        },
        postJsonData:function(data,opt){
            var rst={
                contentType:'application/json',
                data: JSON.stringify(data)
            };
            if(opt){
                opt.contentType =rst.contentType;
                opt.data = rst.data
            }
            return rst;
        },
        postFormData:function(data,opt){
            var rst={
                processData:true,
                contentType:'application/x-www-form-urlencoded',
                data: data
            };
            if(opt){
                opt.contentType =rst.contentType;
                opt.data = rst.data;
                opt.processData=rst.processData;
            }
            return rst;
        },
        createShareModel:function(shareC,models,opt,extra){
            var model;
            var modelRef;
            var shareModels=[];
            var newModels=[];
            extra=_.extend({
                method:'create'
            },extra);
            !_.isArray(models)&&(models=[models]);
            var idAttribute=Elq.getIdAttribute(model);
            for(var i= 0,il=models.length;i<il;i++){
                model=models[i];
                //todo kule model方法自身提供 getIdAttribute;
                modelRef=shareC.get(model[idAttribute]||model);
                if(!modelRef){
                    modelRef=shareC[extra.method](model);
                    newModels.push(modelRef);
                }
                shareModels.push(modelRef);
            }
            return {
                shared:shareModels,
                news:newModels,
                raw:models
            };
        },
        tpl:function(jqSelc){
            return _.template($(jqSelc).html());
        },
        getModelData:function(model,map){
            var rst={};
            for(var k in map){
                rst[k]=model.get(map[k]);
            }
            return rst;
        },
        changeDataKey:function(data,map){
            var rst={};
            if(!map)return null;
            for(var k in map){
                rst[map[k]]=data[k];
            }
            return rst;
        },
        loopChangeDataKey:function(datas,map){
            var data;
            var rst=[];
            for(var i= 0,il=datas.length;i<il;i++){
                data=datas[i];
                rst.push(Elq.changeDataKey(data,map));
            }
            return rst;
        },
        createEvName:function(event,keys){
            var rst=[];
            event||(event='change');
            for(var i= 0,il=keys.length;i<il;i++){
                rst.push(event+':'+keys[i]);
            }
            return rst.length>0?
                rst.join(' '):
                event;
        },
        getListModel:function(list){
            if(_.isFunction(list)){//构造函数
                return list.prototype.model
            }
            return list.model;
        },
        getFetchModel:function(list){
            var args=toolLq.args(arguments,1);
            var model=list.get(args);
            if(!model)return model;

        },
        modelPluginOpen:function(fn){
            return function(e){
                var jqObj=$(e.currentTarget);
                if(jqObj.hasClass('disableJs')){
                    return;
                }
                var model=toolLq.getDomModel(jqObj);
                var keyMap=jqObj.data('keymap');
                var data=keyMap?
                    Elq.getModelData(model,keyMap):
                    model._toJSON();
                function getResult(data){
                    return Elq.changeDataKey(data,keyMap);
                }
                fn.call(this,e,jqObj,model,data,keyMap,getResult);
            }
        },
        disablePlugin:function(jqObj,isEnable){
            jqObj[isEnable?'removeClass':'addClass']('disableJs');
        },
        listPluginFn:function(fn){
            return function(e){
                var jqObj=$(e.currentTarget);
                if(jqObj.hasClass('disableJs')){
                    return;
                }
                var list=toolLq.getDomList(jqObj);
                if(list.list instanceof B.Collection){
                    fn.call(this,e,jqObj,list.jqP,list.list);
                }
            };
        },
        modelSaveParam:function(args){
            return Elq._modelSaveParam.apply(Elq,args);
        },
        _modelSaveParam:function(key, val, options){
            var attrs, method, xhr, attributes = this.attributes;

            // Handle both `"key", value` and `{key: value}` -style arguments.
            if (key == null || typeof key === 'object') {
                attrs = key;
                options = val;
            } else {
                (attrs = {})[key] = val;
            }
            options = _.extend({validate: true}, options);
            return {
                attrs:attrs,
                options:options,
                args:[attrs,options]
            }
        },
        maxView:function(jqSelc){
            $(jqSelc).trigger('maxView');
        },
        recoverView:function(jqSelc){
            $(jqSelc).trigger('recoverView');
        },
        localSync:function(method,model,opt){
            opt.success();
        },
        btnMethod: function (jqBtn, dataName, view, args) {
            var method = jqBtn.data(dataName);
            method = view[method];
            typeof method == 'function' && method.apply(view, args);
        },
        getIdAttribute:function(obj){
            if(obj instanceof B.Model)
                return obj.idAttribute;
            if(obj instanceof B.Collection)
                return toolLq.getSafeValue(obj,'model.prototype.idAttribute');
        },
        batchDestroy:function(models,opt){
            _.invoke(models,'destroy',opt);
        }
    };
    //todo:与其他domTriggerRun合并
    Elq.domModelPlugin=function(fn){
        return function(e){
            var jqObj=$(e.currentTarget);
            if(jqObj.hasClass('disableJs')){
                return;
            }
            var model=toolLq.getDomModel(jqObj);
            var keyMap=jqObj.data('keymap');
            var data=keyMap?
                Elq.getModelData(model,keyMap):
                model._toJSON();
            function getResult(data){
                return Elq.changeDataKey(data,keyMap);
            }
            fn.call(this,e,jqObj,model,data,keyMap,getResult);
        }
    };

    B._View= B.View;
    B.View= B.View.extend({
        constructor:function(opt){
            opt||(opt={});
            this._helper=opt.helper||{};
            this._param=new BaseVM();
            B._View.apply(this,arguments);
        },
        setParam:function(key,val){
            this._param.set(key,val);
        },
        getParam:function(key){
            return key?
                this._param.get(key):
                this._param;
        },
        clearParam:function(){
            this._param.off();
            this._param=new BaseVM();
        },
        enableMax:function(){
            var evName=this.eventName('maxView');
            var recoverView=this.eventName('recoverView');
            this.$el.off(evName).on(evName, _.bind(this.evMaxView,this));
            this.$el.off(recoverView).on(recoverView, _.bind(this.evRecoverView,this));
        },
        eventName:function(event){
            return event+'.'+event+'_'+this.cid;
        },
        //todo kule 必须实现树状层级结构的views才能做穿透getHelper
        //要求View必须通过addSubview parentView的 subviews的方式方可正确管理
        //参考苹果UI框架
        setHelper:function(helper){
            var key;
            if(_.isString(helper)&&arguments.length>1){
                key=helper;
                helper={};
                helper[key]=arguments[1];
            }
            _.extend(this._helper,helper);
        },
        getHelper:function(key) {
            return key ?
                (_.result(this._helper, key) || '') :
                (this._helper || {});
        },
        clearHelper:function(){
            this._helper={};
        },
        destroy:function(){
            this.clearHelper();
            this.clearParam();
        },
        evMaxView:function(e){
            toolLq.log('视图最大化处理代码,e=',e,'this=',this);
        },
        evRecoverView:function(e){
            toolLq.log('视图回复正常处理代码,e=',e,'this=',this);
        },
        initScroll:function(scrollBar,scrollBarClass,opt){
            opt||(opt={});
            this.scrollBar=scrollBar;
            this.scrollBarClass=scrollBarClass;
            scrollBar(scrollBarClass, _.extend({
                jqP:this.$el
            },opt));
        },
        destroyScroll:function(){
            var scrollBar=this.scrollBar;
            var scrollBarClass=this.scrollBarClass;
            if(!scrollBar||!scrollBarClass)return;
            scrollBar.destroy(scrollBarClass,this.$el);
        },
        updateScroll: _.debounce(function(){
            var scrollBar=this.scrollBar;
            var scrollBarClass=this.scrollBarClass;
            if(!scrollBar||!scrollBarClass)return;
            scrollBar.update(scrollBarClass,this.$el);
        },100)
    });

    B.ajax = function(options) {
        var success=options.success;
        options.success=function(res,state,xhr){
            var flag;
            if(options.dataType!='json'&&
                !toolLq.isJsonResponse(xhr)){
                success&&success.apply(this,arguments);
                return;
            }
            flag=res.Flag;
            res=res.Content;
            if(flag){
                success&&success.apply(this,arguments);
            }
            success=null;
        };

        return $.ajax.call($,options);
    };

    /**
     * 循环中的子视图列表
     *
     */
    var BaseMV=B.BaseMV= B.View.extend({
        constructor:function(opt){
            opt||(opt={});
            this._opt=opt;
            B.View.apply(this,arguments);
        },
        attributes:function(){
            var model=this.model;
            return {
                'data-id':model.id||model.cid
            }
        },
        initialize:function(opt){
            opt||(opt={});
            var model=this.model;
            this.parentView=null;
            //todo kule 实现toggleTemplate实例方法
            opt.template&&(this.template=opt.template);
            this.changeModel(model);
        },
        setOpt:function(opt){
            _.extend(this._opt,opt);
        },
        getOpt:function(key){
            return this._opt[key];
        },
        render:function(model){
            model||(model=this.model);
            var data=model._toJSON();
            this.$el.html(this.template(data));
            this.renderDom(model,data);
            return this;
        },
        renderDom:function(){

        },
        changeModel:function(model){
            if(!model)return;
            var oldModel=this.model;
            this.model=model;
            oldModel&&this.stopListening(oldModel);
            this.listenTo(model,'change', this.render);
            this.listenTo(model,'destroy', this.destroy);
            this.listenTo(model, 'change:'+model.idAttribute,this._updateId);

            this.$el.attr('data-model','lq').
                attr('data-id',model.id||model.cid).
                data('modelref',model)
        },
        showModel:function(model) {
            if (this.model != model) {
                this.changeModel(model);
                model.fetchMore();
                this.render();
            }
            return;
        },
        _updateId:function(model){
            this.$el.attr('data-id',model.id);
        },
        destroy:function(){
            this.stopListening(this.model);
            Elq.superMethodRun(B.View,'destroy',this,arguments);
        },
        getDomIndex:function(){
            return this.$el.prevAll().size();
        },
        getIndex:function(){
            return this.parentView.getIndexByView(this);
        },
        getParentHelper:function(key){
            return this.parentView.getHelper(key);
        },
        loading:function(){},
        loaded:function(){},
        /**
         * 该视图是否在可见区域内
         */
        isVisible:function(){},
        /**
         * 视图进入可见区域的回调方法，用于实现延时加载等功能
         */
        enterVisible:function(){},
        /**
         * 视图离开可见区域的回调方法，用户实现不再屏幕内移除dom，优化渲染速度
         */
        leaveVisible:function(){}
    });
    //简单列表视图
    var BaseCVEvents={
        'click .itemRemove':Elq.domEvTriggerRun('removeItem','data-id','removeItem'),
        'click .itemDestroy':Elq.domEvTriggerRun('destroyItem','data-id','destroyItem')
    };
    var BaseCV=B.BaseCV= B.View.extend({
        appendEl:function(){
            return null;
        },
        model:null,
        //todo：重构事件方法，走domModelPlugin方法，自动获取model
/*        events:{

        },*/
        MView:BaseMV,
        removeItem:function(id,jqObj,e){
            e.stopImmediatePropagation();
            var list=this.collection;
            var model;
            if(!list||!(model=list.get(id)))return;
            list.remove(model);
        },
        //TODO 此处需要确认服务器正确删除后再将Model从Collection中移除
        destroyItem:function(id,jqObj,e){
            e.stopImmediatePropagation();
            var list=this.collection;
            var model;
            if(!list||!(model=list.get(id)))return;
            //todo kule全局添加确认操作,与全局的modelDestroy
            model.destroy();
        },
        addItem:function(value,jqObj,e){
            var list=this.collection;
            var data=toolLq.getFormData(jqObj);
            if(_.isEmpty(data))return;
            list.add(data);
        },
        initialize: function(opt){
            opt||(opt={});
            opt.MView&&(this.MView=opt.MView);
            opt.MVOpt&&(this.MVOpt=opt.MVOpt);//存放子View初始化的参数
            this.filter=Elq.createFilter(opt.filter||[]);//存储过滤器
            this._Views=[];//存储view引用
            this._ViewsHasId={};//存储view引用
            this.events= _.extend({},BaseCVEvents,_.result(this, 'events'));
            this.changeCollection(this.collection);
            this.refresh();
        },
        changeCollection:function(collection){
            var old=this.collection;
            if(!collection)return;
            old&&this.stopListening(old);
            this.listenTo(collection, 'add', this.addOne);
            this.listenTo(collection, 'reset', this.refresh);
            this.listenTo(collection, 'remove', this.remove);
            this.listenTo(collection, 'change:'+Elq.getIdAttribute(collection),this._updateId);
            this.listenTo(collection,'request',this._listEv('loading'));
            this.listenTo(collection,'sync',this._listEv('loaded'));
            this.collection=collection;

            this.$el.attr('data-model','lqList').
                data('modelref',collection)
        },
        _updateId:function(model){
            var idAttribute=Elq.getIdAttribute(model);
            var oid=model.previous(idAttribute);
            var id=model.get(idAttribute);
            if(oid===id)return;

            oid||(oid=model.cid);
            var view=this.getViewById(oid);
            delete this._ViewsHasId[oid];
            this._ViewsHasId[id]=view;
        },
        setFilter:function(filter,isAdd){
            this.filter=isAdd?
                Elq.createFilter(filter,this.filter):
                Elq.createFilter(filter);
            this.refresh();
        },
        removeFilter:function(key){
            Elq.removeFilter(this.filter,key);
            this.refresh();
        },
        addOne: function(model,list,opt){
            if(!this.checkFilter(model)){
                return;
            }
            var mvOpt= _.extend({},{
                model:model
            },this.MVOpt);
            var view=new this.MView(mvOpt);
            view.parentView=this;

            this._Views.push(view);
            this._ViewsHasId[model.id||model.cid]=view;

            view.render(model);
            this.addView(view,model,opt);
        },
        addView:function(view,model,opt){
            opt||(opt={});
            var method=opt.extAppend||'append';
            this.$el[method](view.el);
            opt.extClassName&&
                view.$el.addClass(opt.extClassName);
        },
        getIndexByView:function(view){
            return _.indexOf(this._Views,view);
        },
        getViewById:function(id){
            return this._ViewsHasId[id];
        },
        getViews:function(isSet){
            return isSet?
                this._ViewsHasId:
                this._Views;
        },
        getViewByIndex:function(index){
            return this._Views[index];
        },
        emptyList:function(){
            var views=this._Views;
            var model,view;
            this.$el.empty();//快速清空dom减少重绘
            //某些异步操作的代码可能会导致错误
            for(var i=views.length-1;i>=0;i--){
                if(!(view=views[i]))continue;
                model=view.model;
                model&&this.remove(model);
            }
        },
        refresh:function(){
            var collection=this.collection;
            this.emptyList();
            if(!collection)return;
            for(var i= 0,il=collection.length;i<il;i++){
                this.addOne(collection.at(i),i);
            }
        },
        getFilterArray:function(){
            var collection=this.collection;
            var filter = this.filter;
            if(!collection)return [];
            if(!filter|| _.isEmpty(filter)){
                return collection.models.slice(0);
            }
            return Elq.getFilterArray(collection,filter);
        },
        remove:function(model){
            var id=model.id||model.cid;
            var view,index;
            if(!id||!(view=this.getViewById(id)))return;
            index=this.getIndexByView(view);

            view.parentView=null;
            delete this._ViewsHasId[id];
            this._Views.splice(index,1);
            this.removeView(view,model);
        },
        removeView:function(view){
            //liuhao 2014-11-05 此处应该调用destroy方法执行自定义的清理方法
            view.destroy();
            view.remove();
            view.model=null;
            view=null;
        },
        checkFilter:function(model,filter){
            filter||(filter=this.filter);
            return Elq.checkFilter(model,filter);
        },
        //清空所有的子view
        destroy:function(){
            var list=this.collection;
            if(list){
                //todo:后期去掉该部分，视图destroy不能影响collection
                //通过触发model.remove来触发view.destroy();
                list.reset([]);
                this.stopListening(list);
            }
            this.$el.remove();
            this.el=null;
            this.$el=null;
            Elq.superMethodRun(B.View,'destroy',this,arguments);
        },
        destroyNoReset:function(){
            var list=this.collection;
            if(list){
                this.stopListening(list);
            }
            this.emptyList();
            this.$el.remove();
            this.el=null;
            this.$el=null;
            this.clearHelper();
        },
        _listEv:function(method){
            return function(list){
                if(this.collection===list){
                    this[method].apply(this,arguments);
                }
            };
        },
        loading:function(){

        },
        loaded:function(){

        }
    });
    //排序的列表视图
    var SortCV=B.SortCV=BaseCV.extend({
        changeCollection:function(collection){
            Elq.superMethodRun(BaseCV,'changeCollection',this,arguments);
            this.stopListening(this.collection,'add remove reset');
            this.enableSort();
        },
        disableSort:function(){
            this.stopListening(this.collection, 'add remove reset', this.refresh);
        },
        enableSort:function(){
            this.listenTo(this.collection, 'add remove reset', this.refresh);
        }
    });

    /**
     * 自定义FormView
     */
    var BaseFMV= B.BaseFMV=BaseMV.extend({
        el:'.backboneForm',
        formEl:'.backboneForm',
        initialize:function(opt){
            var jqP=this.$el;
            this.jqForm=toolLq.formEnable(jqP,this.formEl||'.backboneForm');
            this.opt=opt||{};

            this.jqForm.on(this.eventName('submit'),Elq.domEvTriggerRun('save','class','save',this));
            Elq.superMethodRun(BaseMV,'initialize',this,arguments);
        },
        destroy:function(model){
            //TODO 子类中要重写此方法，都需要对参数类型进行判断，可以将销毁流程分离为方法，子类中只需要重写对应流程的方法
            //liuhao 2014-10-28 destroy方法没有对该视图进行清理，只针对Form元素进行了处理
            var attr = this._attr;
            if(model instanceof BaseM){
                //Model销毁，重置表单
                this.changeModel(this.collection, attr);
                return ;
            }
            Elq.superMethodRun(B.View, 'remove', this, arguments);
        },
        render:function(model){
            var data;
            model||(model=this.model);

            data=model._toJSON();
            Elq.updateFormData(this.jqForm,data);
        },
        resetData:function(data){
            data||(data=_.result(this.model,'defaults'));
            if(!data)return;
            Elq.updateFormData(this.jqForm,data);
        },
        changeModel:function(model,attr){
            if(!model)return;
            if(model instanceof B.Collection){
                this.collection=model;
                this._attr=attr;
                model=new model.model(attr);
            }else{
                this.collection=model.collection;
                this._attr=null;
            }
            var oldModel=this.model;
            Elq.superMethodRun(BaseMV,'changeModel',this,[model]);
            //TODO 此处传入的是model的attributes属性，后续方法中进行修改时会影响到model的值
            this.resetData(_.result(model, 'attributes'));
        },
        save:function(data,jqForm,ev){
            var This = this;
            var _data=toolLq.getFormData(this.jqForm,this.formEl||'.backboneForm');
            var model=this.model;
            var list=this.collection;
            var _attr=this._attr;
            var modelIsNew = model.isNew();
            this.model.save(_data, {
                success: function (model, resp, options) {
                    if(modelIsNew && list){
                        list.add(model);
                    }
                    if(This.opt.autoReset){
                        This.jqForm[0].reset();
                    }
                    if(This.opt.autoAdd&&list){
                        _attr?This.changeModel(list,_attr):
                            This.changeModel(list)
                    }
                    typeof This._cbSaved === 'function' && This._cbSaved.apply(This, arguments);
                },
                error:function(){
                    typeof This._cbError === 'function' && This._cbError.apply(This, arguments);
                }
            });
        },
        _cbSaved: null,
        _cbError:null
    });

    /**
     * 带弹出行为的View
     */
    var BasePopV= B.BasePopV=B.View.extend({
        events:{
            'click .viewCloseBtn':'evHide'
        },
        initialize:function(opt){
            this._isShow=false;
            Elq.superMethodRun(B.View,'initialize',this,arguments);
        },
        isShow:function(){
            return this._isShow;
        },
        show:function(){
            this._isShow=true;
            this.$el.addClass('state-show').
                removeClass('fn-vhid');
            this.trigger('state:isShow');
        },
        evHide:function(){
            this.hide();
        },
        hide:function(isFast){
            var jqP=this.$el;
            this._isShow=false;
            if(isFast){
                jqP.addClass('fn-notrans fn-vhid').removeClass('state-show');
                //强制更新样式
                toolLq.refreshStyle(jqP[0],'transition');
                jqP.removeClass('fn-notrans');
            }
            else{
                jqP.removeClass('state-show').addClass('fn-vhid');
            }
            this.trigger('change:isShow');
        }
    });

    var dateKeys=/Time$/;
    var BaseM= B.BaseM= B.Model.extend({
        waitOpt:true,//默认等待服务器响应
        idAttribute:'Id',
        url:function(){
            if(!this.Url)return '';
            var data=this.toJSON();
            var url=toolLq.htmlTemplate(this.Url,data,true);
            if(this.isNew())
                return url;
            return toolLq.pathJoin(url,this.get(this.idAttribute));
        },
/*        //对于不支持restful的api，分别设定url
        sync:function(method,model,opt){
            var url='';
            switch(method) {
                case 'create'://默认post操作
                    url = '';
                    break;
                case 'update'://默认 PUT
                    url = '';
                    break;
                case 'patch'://默认 PATCH
                    url = '';
                    break;
                case 'delete'://默认 DELETE
                    url = this.url(method, model);
                    break;
                case 'read'://默认 GET
                    url = '';
                    break;
            }
            opt.url=toolLq.htmlTemplate(url,this.toJSON());
            Elq.superMethodRun(BaseM,'sync',this,arguments);
        },*/
        initialize:function(){
            this._fetched=false;
            this._keys= _.keys(this.defaults());
            Elq.superMethodRun(B.Model,'initialize',this,arguments);
        },
        parse: function (data) {
            if(typeof data !== 'object'){ //liuhao 2014-12-10 后台返回值不是简单对象时不设置到Model中
                return {};
            }
            toolLq.convertJsonDate(data,dateKeys);
            return Elq.superMethodRun(B.Model,'parse',this,arguments);
        },
        toJSON:function(){
            var data=this._toJSON();
            var _keys=this._keys;
            if(_keys){
                data= _.pick(data,_keys);
            }
            toolLq.convertDateJson(data,dateKeys);
            return data;
        },
        _toJSON:function(){
            var data=Elq.superMethodRun(B.Model,'toJSON',this,arguments);
            return data;
        },
        //更多数据通过二次获取来加快速度
        fetchMore:function(opt){
            opt= _.extend({},opt);
            var success=opt.success;
            if(this._fetched){
                success&&success(this);
                return;
            }
            opt.success=function(model){
                model._fetched=true;
                success&&success(model);
                success=null;
            };
            return this.fetch(opt);
        },
        createNew:function(){
        }
    });

    var BaseC= B.BaseC= B.Collection.extend({
        waitOpt:true,//默认等待服务器响应
        initialize:function(models,opt){
            this._fetchOpt={};//为加载下一页存储
            //this.MOpt=opt.MOpt||{};//会向下传递opt
            Elq.superMethodRun(B.Collection,'initialize',this,arguments);
        },
        createNewCollection:function(models,opt){
            return new this.constructor(models,opt);
        },
        createNewModel:function(attrs,opt){
            return new this.model(attrs,opt);
        },
        /**
         *  从服务器分批获取数据添加到本地collection中
         *
         * @param {string} cid 请求列表数据的关联id
         * @param {object} opt backbone原始fetch的参数，其中url会被重写掉
         * @param {object} urlSetting url配置参数默认page=1，pageSize=10
         */
        fetchSection:function(opt,urlSetting){
            opt||(opt={});
            var xhr;
            urlSetting= _.extend({
                page:1,
                pageSize:10
            },urlSetting);

            this._fetchOpt={
                opt: _.clone(opt),
                urlSetting: _.clone(urlSetting)
            };

            opt.url=urlSetting.url||this.url;
            toolLq.convertDateToStr(urlSetting);
            opt.remove=false;//批量添加数据
            opt.url=toolLq.htmlTemplate(opt.url,urlSetting,true);

            //opt.urlSetting=urlSetting;
            opt.context=this;
            xhr=Elq.superMethodRun(B.Collection,'fetch',this,[opt]);
            return xhr.then(function(res){
                return [this].concat(_.toArray(arguments));
            });
        },
        getPage:function(){
            return {
                page:this._fetchOpt.urlSetting.page,
                ref:this._fetchOpt.urlSetting
            }
        },
        _toJSON:function(){
            return this.invoke('_toJSON');
        },
        getUrlSetting:function(){
            return this._fetchOpt.urlSetting
        },
        getFetchOpt:function(){
            return this._fetchOpt.opt;
        },
        goPage:function(opt,page,urlSetting,evName){
            opt||(opt={});
            var success=opt.success;
            var pageOpt=this._fetchOpt;
            var This=this;
            if(!opt.urlSetting&&!pageOpt.urlSetting){//未进行首次请求
                return;
            }
            opt= _.extend({},pageOpt.opt,opt);
            urlSetting= _.extend({},pageOpt.urlSetting,urlSetting,{
                page:page||(this.getPage().ref.page)||1
            });
            opt.success=function(collection, resp, options){
                if(success)success(collection,resp,options);
                page||(This.getPage().ref.page=page);
                collection.trigger('goPageDone '+(evName?evName+'Done':''),collection,resp,options);
            };
            var xhr=this.fetchSection(opt,urlSetting);
            this.trigger('goPageStart '+(evName?evName+'Start':''),this,xhr,opt);
        },
        nextPage:function(opt,urlSetting){
            var page=this.getPage().page+1;
            this.goPage(opt,page,urlSetting,'nextPage');
        },
        prevPage:function(opt,urlSetting){
            var page=this.getPage().page-1;
            this.goPage(opt,page,urlSetting,'prevPage');
        },
        getWithCreate:function(id){
            var model=this.get(id);
            if(!model){
                model=this.add({
                    Id:id
                });
            }
            return model;
        },
        getWithFetchMore:function(id, opt){
            var model=this.getWithCreate(id);
            model.fetchMore(opt);
            return model;
        },
        getDefaults:function(){
            var model=this.model;
            return Elq.superMethodRun(model,'defaults',model,arguments);
        },
        //循环调用model的destroy，调用时慎重，该方法可能执行数据删除操作
        //一般调用，请重载model.destroy方法，禁用请求操作
        //todo：kule:参数尚未处理，且应使用继承链判断
        destroy:function(){
            var model=this.first();
            if(model.destroy===BaseVM.prototype.destroy){
                this.each(function(model){
                    model.destroy();
                });
                return;
            }
            this._fetchOpt=null;
        }
    });

    var BaseVM= B.BaseVM= B.Model.extend({
        idAttribute:'Id',
        url:'',
        sync:toolLq.emptyFun,
        //todo kule 移动到Model基类中
        _toJSON:function(){
            var data=Elq.superMethodRun(B.Model,'toJSON',this,arguments);
            return data;
        },
        //不同步服务器
        destroy:function(opt){
            opt||(opt={});
            this.trigger('destroy', this, this.collection, opt);
            _.isFunction(opt.success)&&opt.success();
        }
    });
    var BaseVC= B.BaseVC= B.Collection.extend({
        url:'',
        sync:toolLq.emptyFun,
        createModel:function(attrs,opt){
            return new this.model(attrs,opt);
        }
    },{
        create:function(optM,optL){
            return BaseVC.extend(_.extend({
                model:BaseVM.extend(optM)
            },optL));
        }
    });
})(Backbone);