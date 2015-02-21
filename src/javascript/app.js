Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    items: [
        {xtype:'container',itemId:'selection_box', layout: {type: 'hbox'}},
        {xtype:'container',itemId:'display_box'},
        {xtype:'tsinfolink'}
    ],
    featureModel: 'PortfolioItem/Feature',
    featureFetchFields: ['FormattedID','Name','c_CodeDeploymentSchedule','Notes','DisplayColor'],
    childrenFetchFields: ['FormattedID','Name','_ItemHierarchy','Blocked','BlockedReason','c_BlockerCreationDate','c_BlockerOwnerFirstLast'],
    
    launch: function() {
        this._initialize();
    },
    _initialize: function(){
        this.logger.log('_initialize');
        var margin = 10; 
        this.down('#selection_box').add({
            xtype: 'rallyreleasecombobox',
            itemId: 'cb-release',
            fieldLabel: 'Release Filter',
            labelAlign: 'right',
            width: 250,
            margin: margin,
            context: {project: this.getContext().getProjectRef(), projectScopeDown: false}
        });
        this.down('#selection_box').add({
            xtype: 'rallybutton',
            text: 'Run',
            scope: this,
            margin: margin,
            handler: this._run
        });
        this.down('#selection_box').add({
            xtype: 'rallybutton',
            text: 'Export',
            scope: this,
            margin: margin,
            handler: this._export
        });
    },
    _export: function(){
        var store = this.down('#grd-report').getStore(); 
        this.logger.log('_export', store.getData());
        
        var xml_text = '';
        Ext.each(store.getData().items, function(r){
//            if (xml_text.length == 0){
//                xml_text = r.getHeaderRow();  
//            }
            xml_text += Ext.String.format('<ss:Row><ss:Cell><ss:Data ss:Type="String">{0}</ss:Data></ss:Cell>' +
                    '<ss:Cell><ss:Data ss:Type="String">{1}</ss:Data></ss:Cell>' +
                    '<ss:Cell><ss:Data ss:Type="String">{2}</ss:Data></ss:Cell>' +
                    '<ss:Cell><ss:Data ss:Type="String">{3}</ss:Data></ss:Cell>' +
                    '<ss:Cell><ss:Data ss:Type="String">{4}</ss:Data></ss:Cell>' +
                    '<ss:Cell><ss:Data ss:Type="String">{5}</ss:Data></ss:Cell>' +
                    '<ss:Cell><ss:Data ss:Type="String">{6}</ss:Data></ss:Cell>' +
                    '</ss:Row>',r.get('FeatureStatus'),
                    r.get('CodeDeploymentSchedule'),r.get('FormattedFeature'),r.get('BlockerReasons'),r.get('BlockerDate'), 
                    r.get('BlockerOwner'), 
                    r.get('Comments'));
        });
        


        var text = Ext.String.format('<?xml version="1.0"?>' +
        '<ss:Workbook xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' +
        '<ss:Worksheet ss:Name="' + this.getContext().getProject().Name + '">' +
        '<ss:Table>{0}</ss:Table></ss:Worksheet></ss:Workbook>',xml_text);
        console.log(text);
 //       html_text = Ext.String.format('<table>{0}</table>', html_text);
        Rally.technicalservices.FileUtilities.saveTextAsFile(text,'feature-report.html');
        
    },
    _run: function(){
        var release = this.down('#cb-release').getValue();
        
        this._fetchFeatures(release).then({
            scope: this,
            success: function(featureRecords){
                this._fetchChildren(featureRecords).then({
                    scope: this,
                    success: function(data){
                        var store = this._buildDataStore(data);
                        this._buildGrid(store);
                    }
                });
            }
        });
    },
    _buildDataStore: function(data){
       this.logger.log('_buildDataStore',data);
       return Ext.create('Rally.data.custom.Store',{
           data: data
       });
    },
    _buildGrid: function(store){
        if (this.down('#grd-report')){
            this.down('#grd-report').destroy();
        }
        
        this.down('#display_box').add({
            xtype: 'rallygrid',
            itemId: 'grd-report',
            store: store,
            columnCfgs: this._getColumnCfgs()
        });
    },
    _getColumnCfgs: function(){
        return [{
            text: 'Status',
            dataIndex: 'FeatureStatus',
            renderer: function(v,m,r){
                m.style = "background-color: " + v + ";";
                return '';
            },
            width: 25
        },{
            text: 'Code Deployment Schedule',
            dataIndex: 'CodeDeploymentSchedule'
        },{
            text: 'Feature',
            dataIndex: 'FeatureRef',
            renderer: function(v,m,r){
                var link_text = Ext.String.format('{0}: {1}', r.get('FeatureFormattedID'), r.get('FeatureName')); 
                if (v){
                    return Rally.nav.DetailLink.getLink({record: v, text: link_text});
                }
                return link_text;
            },
            flex: 1
        },{
            text: 'Blocker Reasons',
            dataIndex: 'BlockerReasons',
            flex: 1
        },{
            text: 'Blocker Date',
            dataIndex: 'BlockerDate'
        },{
            text: 'Blocker Owner',
            dataIndex: 'BlockerOwner',
            flex: 1
        },{
            text: 'Comments',
            dataIndex: 'Comments',
            flex: 1
        }];
    },  
    _fetchChildren: function(featureRecords){
        var deferred = Ext.create('Deft.Deferred');
        this.logger.log('_fetchChildren',featureRecords);
        
        var fetch = this.childrenFetchFields;
        var find = {
                '_TypeHierarchy': {$in: ['HierarchicalRequirement']},
                '__At': "current",
                'Blocked': true
        }; 
        
        var object_ids = _.map(featureRecords, function(f){return f.get('ObjectID');});
        
        var chunker = Ext.create('Rally.technicalservices.data.Chunker',{
            fetch: fetch,
            find: find,
            chunkField: '_ItemHierarchy',
            chunkOids: object_ids    
        });
        chunker.load().then({
            scope: this,
            success: function(records){
                this.logger.log('Chunking complete', records);
                var models = this._createModels(featureRecords, records);
                deferred.resolve(models);
            }
        });
        return deferred;  
    },
    _createModels: function(featureRecords, records){

        var models = []; 
        Ext.each(featureRecords, function(f){
            var feature_oid = f.get('ObjectID');
            var blocked_children = [];  
            Ext.each(records, function(r){
                if (Ext.Array.contains(r.get('_ItemHierarchy'),feature_oid)){
                    blocked_children.push(r);
                }
            });
            var model = Ext.create('Rally.technicalservices.data.FeatureStatusModel',{
                ObjectID: feature_oid,
                FeatureRef: f.get('_ref'),
                FeatureStatus: f.get('DisplayColor') || '#C0C0C0',
                CodeDeploymentSchedule: f.get('c_CodeDeploymentSchedule'),
                FeatureFormattedID: f.get('FormattedID'),
                FeatureName: f.get('Name'),
                BlockedChildren: blocked_children,  
                Comments: f.get('Notes')
            });
            models.push(model);
        }, this);
        return models; 
    },
    _fetchFeatures: function(releaseRef){
        var deferred = Ext.create('Deft.Deferred');
        Ext.create('Rally.data.wsapi.Store',{
            fetch: this.featureFetchFields,
            model: this.featureModel,
            limit: 'Infinity',
            filters: [{
                property: 'Release',
                value: releaseRef
            }],
            autoLoad: true,
            context: {project: this.getContext().getProjectRef(), projectScopeDown: this.getContext().getProjectScopeDown()},
            listeners: {
                scope: this,
                load: function(store, records, success){
                    this.logger.log('_fetchFeatures load',records.length, success);
                    deferred.resolve(records);
                }
            }
        });
        return deferred;
    }
    
});