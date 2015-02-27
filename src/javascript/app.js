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
    featureFetchFields: ['FormattedID','Name','c_CodeDeploymentSchedule','Notes','DisplayColor','Discussion'],
    childrenFetchFields: ['FormattedID','Name','_ItemHierarchy','Blocked','BlockedReason','c_BlockerCreationDate','c_BlockerOwnerFirstLast'],
    releaseField: 'c_CodeDeploymentSchedule',
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
            itemId: 'btn-export',
            scope: this,
            margin: margin,
            disabled: true,
            handler: this._export
        });
    },
    _export: function(){
        var store = this.down('#grd-report').getStore(); 
        this.logger.log('_export', store.getData());
        var xml_text = '', style_xml = '';
        var counter = 0; 
        
        Ext.each(this.exportData, function(r){
            counter++;
            style_xml +=  Ext.String.format('<ss:Style ss:ID="s{0}"> <ss:Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1" /><ss:Interior ss:Color="{1}" ss:Pattern="Solid"/></ss:Style>',counter, r.get('FeatureStatus'));
            
            
            var blocker_reasons = Rally.technicalservices.FileUtilities.scrubStringForXML(r.get('BlockerReasons').replace('<br/>','|','g')).replace('<br/>','|','g');
            var blocker_owner = Rally.technicalservices.FileUtilities.scrubStringForXML(r.get('BlockerOwner').replace('<br/>','|','g')).replace('<br/>','|','g'); //.replace('<br/>','&#10;','g'));
            var blocker_dates = Rally.technicalservices.FileUtilities.scrubStringForXML(r.get('BlockerDate').replace('<br/>','|','g')).replace('<br/>','|','g');
            var feature = Rally.technicalservices.FileUtilities.scrubStringForXML(r.get('FormattedFeature'));
            var comments = Rally.technicalservices.FileUtilities.scrubStringForXML(r.get('Comments')).replace('<br/>','|','g');
            var cd_schedule = Rally.technicalservices.FileUtilities.scrubStringForXML(r.get('CodeDeploymentSchedule'));
            
            xml_text += Ext.String.format('<ss:Row><ss:Cell ss:StyleID="s{0}"><ss:Data ss:Type="String"></ss:Data></ss:Cell>' +
                    '<ss:Cell><ss:Data ss:Type="String">{1}</ss:Data></ss:Cell>' +
                    '<ss:Cell><ss:Data ss:Type="String">{2}</ss:Data></ss:Cell>' +
                    '<ss:Cell><ss:Data ss:Type="String">{3}</ss:Data></ss:Cell>' +
                    '<ss:Cell><ss:Data ss:Type="String">{4}</ss:Data></ss:Cell>' +
                    '<ss:Cell><ss:Data ss:Type="String">{5}</ss:Data></ss:Cell>' +
                    '<ss:Cell><ss:Data ss:Type="String">{6}</ss:Data></ss:Cell>' +
                    '</ss:Row>',counter,
                    cd_schedule,feature,blocker_reasons,blocker_dates, 
                    blocker_owner, 
                    comments);
        });
        


        var text = Ext.String.format('<?xml version="1.0"?>' +
        '<ss:Workbook xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' +
        '<ss:Styles>{0}</ss:Styles>' +
        '<ss:Worksheet ss:Name="' + this.getContext().getProject().Name + '">' +
        '<ss:Table>{1}</ss:Table></ss:Worksheet></ss:Workbook>',style_xml, xml_text);
        console.log(text);
        
//        Rally.technicalservices.FileUtilities.saveTextAsFile(html_text, 'features.html');
 //       html_text = Ext.String.format('<table>{0}</table>', html_text);
        Rally.technicalservices.FileUtilities.saveTextAsFile(text,'feature-report.html');
        
    },
    _run: function(){
        var release = this.down('#cb-release').getValue();
        this.logger.log('_run');
        
        this._enableUI(false);
        this._fetchFeatures(release).then({
            scope: this,
            success: function(featureRecords){
                this._fetchChildren(featureRecords).then({
                    scope: this,
                    success: function(data){
                        this.exportData = data;  
                        var store = this._buildDataStore(data);
                        this._buildGrid(store);
                        this._enableUI(true);
                    }
                });
            }
        });
    },
    _enableUI: function(enable){
        this.setLoading(!enable);
        this.down('#btn-export').setDisabled(!enable)
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
            dataIndex: 'c_CodeDeploymentSchedule'
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
        this.logger.log('_fetchChildren',featureRecords.features, featureRecords.discussions);
        
        var fetch = this.childrenFetchFields;
        var find = {
                '_TypeHierarchy': {$in: ['HierarchicalRequirement']},
                '__At': "current",
                'Blocked': true
        }; 
        
        var object_ids = _.map(featureRecords.features, function(f){return f.get('ObjectID');});
        this.logger.log('_fetchChildren', object_ids.length, object_ids);
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

        var discussion_hash = {};
        Ext.each(featureRecords.discussions, function(d){
            discussion_hash[d.get('Artifact').ObjectID] = d.get('Text');
        });
        
        
        var models = []; 
        Ext.each(featureRecords.features, function(f){
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
                CodeDeploymentSchedule: f.get(this.releaseField),
                FeatureFormattedID: f.get('FormattedID'),
                FeatureName: f.get('Name'),
                BlockedChildren: blocked_children,  
                Comments: discussion_hash[feature_oid] || ''
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
                    this._fetchDiscussions(records).then({
                        scope: this,
                        success: function(discussions){
                            deferred.resolve({features: records, discussions: discussions});
                        }
                    });

                }
            }
        });
        return deferred;
    },
    _fetchDiscussions: function(records){
        var deferred = Ext.create('Deft.Deferred');
        var promises = []; 
        
        Ext.each(records, function(r){
            var discussions = r.get('Discussion').Count;
            if (discussions > 0){
                promises.push(r.getCollection('Discussion').load({
                    fetch: ['Text'],
                    filters: [{
                        property: 'PostNumber',
                        value: discussions - 1 //Get the latest post
                    }]
                }));
            }
        });
        
        if (promises.length > 0){
            Deft.Promise.all(promises).then({
                scope: this,
                success: function(returnVal){
                    var discussions = _.flatten(returnVal);
                    this.logger.log('_fetchDiscussions discussions returned', discussions);
                    deferred.resolve(discussions);
                }
            });
        } else {
            deferred.resolve([]);
        }
        return deferred;
    }
    
});