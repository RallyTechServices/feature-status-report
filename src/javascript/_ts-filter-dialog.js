Ext.define('Rally.technicalservices.dialog.Filter',{
    extend: Rally.ui.dialog.Dialog,
    logger: new Rally.technicalservices.Logger(),
    autoShow: true,
    componentCls: "rly-popover dark-container",
    title: 'Filter Features by',
    validOperators: {
        TEXT: ['contains','!contains'],
        DECIMAL: ['=', '!=', '>', '<', '>=', '<='],
        INTEGER: ['=', '!=', '>', '<', '>=', '<='],
        BOOLEAN: ['=','!='],
        COLLECTION: ['contains','!contains','containsany'],
        OBJECT: ['=','!='],
        QUANTITY: ['=', '!=', '>', '<', '>=', '<='],
        STATE: ['=','!='],
        STRING: ['=','!=','contains','!contains'],
    },
    unfilterableAttributeTypes: ["BINARY_DATA","DATE", "WEB_LINK", "RAW","RATING"],
    validValues: {
        BOOLEAN: ["true","false"]
    },
    /**
     * model:  typePath that will be used to get filter fields
     */
    model: null,
    
    initComponent: function() {
        this.buttons = this._getButtons();

        this._getModel(this.model);
        this.callParent(arguments);
        this.addEvents('customFilter');
    },
    _getModel: function(model){
        
        Rally.data.ModelFactory.getModel({
            type: model,
            scope: this,
            success: this._onModelLoaded
        });
    },
    _onModelLoaded: function(model){
        var fields = model.getFields();
        var filterableFields = {};
        Ext.each(fields, function(field){
            if (field.attributeDefinition && 
                    field.attributeDefinition.Filterable && 
                    !field.attributeDefinition.Hidden){

                  if (_.indexOf(this.unfilterableAttributeTypes, field.attributeDefinition.AttributeType) < 0){
                      filterableFields[field.attributeDefinition.ElementName] = field;
                  }
            }
        },this);
        this.filterableFields = filterableFields; 

        this._addHeader();
        this._addRowsContainer();
        this._addFooter();

        
        this._initializeFilters(this.filters);

    },
    _addHeader: function() {
        this.headerContainer = this.add({
            xtype: "container",
            cls: "custom-filter-header",
            layout: {type: 'hbox'},
            defaults: {
                xtype: "component",
                cls: "filter-panel-label"
            },
            items: [{
                height: 1,
                width: 30
            }, {
                html: "Field",
                width: 155
            }, {
                html: "Operator",
                width:  80
            }, {
                html: "Value",
                width:  155
            }]
        });
    },
    _addRowsContainer: function(){
        
        this.rowsContainer = this.add({
            xtype: "container",
            itemId: "custom-filter-rows",
            layout: {type: 'vbox'}
        });
    },
    _addFooter: function(){
        this.footerContainer = this.add({
            xtype: "container",
            itemId: 'custom-filter-footer',
            items: [{
                xtype:'rallybutton',
                itemId: 'clearButton',
                cls: "secondary rly-small",
                text: 'Clear All',
                width: 90,
                align: 'right',
                margin: '5 5 5 220',
                scope: this,
                handler: this._onClearAll
            },{
                xtype:'rallybutton',
                itemId: 'btn-add',
                text: 'Add New',
                width: 90,
                cls: "primary rly-small",
                align: 'right',
                margin: 5,
                scope: this,
                handler: function(){this._addRow();}
            }]
        });
    },
    _getButtons: function() {
        return [{
            xtype: "rallybutton",
            itemId: "cancelButton",
            cls: "secondary rly-small",
            text: "Cancel",
            width: 90,
            handler: this._onCancelClick,
            scope: this
        }, {
            xtype: "rallybutton",
            itemId: "applyButton",
            cls: "primary rly-small",
            text: "Apply",
            width: 90,
            handler: this._onApplyClick,
            scope: this,
            disabled: true 
        }];
    },    
    _initializeFilters: function(filters){
        this.logger.log('_initializeFilters', filters);
        
        if (filters && filters.length > 0){
            Ext.each(filters, function(filter){
                this._addRow(filter.property, filter.operator, filter.value);
            },this);
        } else {
            this._addRow();
        }
    },

    _addRow: function(property, operator, value) {
        this.logger.log('_addRow', property, operator, value);
        
        var items = [];  
        items.push({
            xtype: "rallybutton",
            itemId: 'btn-remove',
            text: '-',
            scope: this,
            margin: 5,
            handler: function(btn){
                btn.bubble(this._removeRow, this);
            }
        });

        items.push({
            xtype: "rallycombobox",
            itemId: 'cb-filter-field',
            store: this._getFilterFieldStore(),
            displayField: 'Name',
            valueField: 'ElementName',
            queryMode: 'local',
            listeners: {
                scope: this,
                select: function(cb) {
                    this._updateFilterControls(cb, operator, value);
                },
                boxready: function(cb){
                    if (property){
                        cb.setValue(property);
                        this._updateFilterControls(cb, operator, value);
                    }
                }

            },
            allowNoEntry: true,
            noEntryText: 'Choose Field...',
            noEntryValue: null,
            margin: 5,
        });
        
        var row = Ext.create('Ext.Container',{
            layout: {type: 'hbox'},
            items: items
        });
        
        this.rowsContainer.add(row);
        
        this._validateFilters();
    },
    _updateFilterControls: function(cbField, operator, value){
        var field = cbField.getRecord();
        var parentContainer = cbField.up(null,1); 
        this.logger.log('_updateFilterControls',operator, value);
        if (parentContainer){
            if (parentContainer.down('#cb-filter-operator')) {
                parentContainer.down('#cb-filter-operator').destroy(); 
                parentContainer.down('#cb-filter-value').destroy(); 
            }
            
            var operatorControl = this._getOperatorControl(field, operator, 'cb-filter-operator');
            parentContainer.add(operatorControl);
            
            var value_val = value || null;
            var valueControl = this._getValueControl(field, value, 'cb-filter-value');
            parentContainer.add(valueControl);
        }
     },
    _getFilterFieldStore: function(){
        var data = _.map(this.filterableFields, function(obj, key){return obj.attributeDefinition});
        data = _.sortBy(data, function(obj){return obj.Name;});
        var fields = _.keys(data[0]);
        console.log(this.filterableFields, data,fields);
        return Ext.create('Ext.data.Store',{
            fields: fields,
            data: data
        });
    },
    _getFilterRowsContainer: function(){
        return this.down('#custom-filter-rows');
    },
    _removeRow: function(btn){
        var ct = btn.up(null,1); 
        if (ct){
            ct.destroy();
        }  
        this._validateFilters();
    },
    _onClearAll: function(){
        this._getFilterRowsContainer().removeAll(); 
        this._addRow();
    },
    _onCancelClick: function() {
        this.destroy()
    },
    _validateFilters: function(ct){
        var disabled = false; 
        var add_disabled = false; 
        
        var rows = this._getFilterRowsContainer().items.items;
        if (rows.length == 0){
            disabled = true; 
        }
        
        Ext.each(this._getFilterRowsContainer().items.items, function(item){
            item.down('#btn-remove').setDisabled(rows.length == 1);
            
            var property = null;  
            if (item.down('#cb-filter-field')){
                property = item.down('#cb-filter-field').getValue();
            }
            var operator = null;  
            if (item.down('#cb-filter-operator')){
                operator = item.down('#cb-filter-operator').getValue();
            }
            
            if (property == null || operator == null || property.length == 0 || operator.length == 0){
                disabled = true, add_disabled = true;  
            }
            
            var val = null;  
            if (item.down('#cb-filter-value')){
                val = item.down('#cb-filter-value').getValue() 
                if (item.down('#cb-filter-value').xtype == 'rallynumberfield'){
                    if (val == null || val.toString.length == 0){
                        disabled = true, add_disabled = true;
                    }
                }
            }; 
            if (rows.length == 1 && property == null && operator == null && val == null){
                disabled = false;   //clear filters 
            }
         }, this);
        this.logger.log('_validateFilters',disabled);
        this.down('#applyButton').setDisabled(disabled);
        this.down('#btn-add').setDisabled(add_disabled);
    },
    _onApplyClick: function() {
        var filters = [];  
       
        Ext.each(this._getFilterRowsContainer().items.items, function(item){
            if (this.down('#cb-filter-operator')){
                var propertyCombo = item.down('#cb-filter-field');
                property = propertyCombo.getValue();
                operator = item.down('#cb-filter-operator').getValue();
                val = item.down('#cb-filter-value').getValue(); 
                console.log(propertyCombo.getRecord());
                display_property = propertyCombo.getRecord().data.Name;
                if (property && operator) {
                    filters.push({
                        property: property,
                        operator: operator,
                        value: val,
                        displayProperty: display_property
                    });
                }
            }
        }, this);

        this.fireEvent("customfilter", filters);
        this.destroy()
    },


    _getOperatorControl: function(field, operatorValue, itemId){
        this.logger.log('_getOperatorControl',field, operatorValue);
 
        var data = this.validOperators[field.data.AttributeType];
        if (Array.isArray(field.data.AllowedQueryOperators)){
             data = _.map(field.data.AllowedQueryOperators, function(o){ return o.OperatorName});
         } 
        operatorValue = operatorValue || data[0];
        console.log(operatorValue);
        var op_ctl = {
            xtype: "combobox",
            itemId: itemId,
            store: data,
            queryMode: 'local',
            margin: 5,
            width: 80,
            allowNoEntry: false,
            value: operatorValue,
            listeners: {
                scope: this,
                change: this._validateFilters
            }
        };
        return op_ctl; 
    },
    _getValueControl: function(field, value, item_id){
        this.logger.log('_getValueControl',field)
        
        var data = this.validValues[field.data.AttributeType] || [];
        if (Array.isArray(field.data.AllowedValues)){
            data = _.map(field.data.AllowedValues, function(o){ return o.StringValue});
        } 
        
        if (data.length > 0){
            return {
                xtype: 'combobox',
                store: data, 
                itemId: item_id,
                queryMode: 'local',
                margin: 5,
                width: 80,
                allowNoEntry: false,
                length: 150,
                value: value || data[0],
                listeners: {
                    scope: this,
                    change: this._validateFilters,
                }

            }
        } else {
            return {
                xtype: 'rallytextfield',
                margin: 5,
                itemId: item_id,
                value: value || '',
                length: 150,
                listeners: {
                    scope: this,
                    change: this._validateFilters
                }

            }
        }
    },
});