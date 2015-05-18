Ext.define('feature-status-report', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    
    items: [
        {xtype:'container',itemId: 'header_box'},
        {xtype:'container',itemId:'display_box'},
        {xtype:'tsinfolink'}
    ],
    featureTargetScheduleStore: [
         ['c_FeatureTargetSprint','Feature Target Sprint'],
         ['c_CodeDeploymentSchedule','Code Deployment Schedule']
    ],
    defaultFeatureTargetField: 'c_CodeDeploymentSchedule',
    featureModel: 'PortfolioItem/Feature',
    featureFetchFields: ['FormattedID','Name','DisplayColor','Discussion','Parent','State'],
    childrenFetchFields: ['FormattedID','Name','_ItemHierarchy','Blocked','BlockedReason','c_BlockerCreationDate','c_BlockerOwnerFirstLast'],
    reportBlockerFields: ['BlockedReason','c_BlockerCreationDate','c_BlockerOwnerFirstLast','FormattedID'],
    
    launch: function() {
        this._initialize();
    },
    _initialize: function(){
        var margin = 10; 

        this.down('#header_box').add({ 
            xtype: 'container',
            layout: {type: 'hbox'},
            items: [{
                xtype: 'rallyreleasecombobox',
                itemId: 'cb-release',
                fieldLabel: 'Release Filter',
                labelAlign: 'right',
                width: 250,
                margin: margin,
                context: {project: this.getContext().getProjectRef(), projectScopeDown: false}
            },{
               xtype: 'rallycombobox',
               itemId: 'cb-feature-target-schedule',
               fieldLabel: 'Feature Target Field',
               labelAlign: 'right',
               margin: margin,
               width: 300,
               labelWidth: 125,
               store: this.featureTargetScheduleStore
            },{
                xtype: 'rallybutton',
                itemId: 'btn-filter',
                margin: 10,
                cls: 'small-icon secondary rly-small',
                iconCls: 'icon-filter',
                scope: this,
                handler: this._filter
                
            },{
                xtype: 'rallybutton',
                text: 'Run',
                scope: this,
                margin: margin,
                handler: this._run
            },{ 
                xtype: 'rallybutton',
                text: 'Export',
                itemId: 'btn-export',
                scope: this,
                margin: margin,
                disabled: true,
                handler: this._export
            }]
        });
    },
    _filter: function(btn){
        Ext.create('Rally.technicalservices.dialog.Filter',{
            model: this.featureModel,
            filters: this.filters || [],
            listeners: {
                scope: this,
                customfilter: function(filters){
                    if (this.filters != filters){
                        this.filters = filters; 
                        if (filters.length == 0){
                            btn.removeCls('primary');
                            btn.addCls('secondary');
                        } else {
                            btn.removeCls('secondary');
                            btn.addCls('primary');
                        }
                        this._run();
                        
                    }
                }
            }
        });
    },
    _getFeatureTargetScheduleField: function(){
        return this.down('#cb-feature-target-schedule').getValue() || this.defaultFeatureTargetField;
    },
    _export: function(){
        var store = this.down('#grd-report').getStore(); 
        this.logger.log('_export', store.getData());
        var xml_text = '', style_xml = '';
        var counter = 0; 
        
        //Write headers
        var headers = ['CodeDeplymentSchedule','FormattedFeature','BlockerReasons','BlockerDate','BlockerOwner','Comments'];
        var xml_text = Ext.String.format('<ss:Row><ss:Cell><ss:Data ss:Type="String">Status</ss:Data></ss:Cell>' +
                '<ss:Cell><ss:Data ss:Type="String">{0}</ss:Data></ss:Cell>' +
                '<ss:Cell><ss:Data ss:Type="String">{1}</ss:Data></ss:Cell>' +
                '<ss:Cell><ss:Data ss:Type="String">{2}</ss:Data></ss:Cell>' +
                '<ss:Cell><ss:Data ss:Type="String">{3}</ss:Data></ss:Cell>' +
                '<ss:Cell><ss:Data ss:Type="String">{4}</ss:Data></ss:Cell>' +
                '<ss:Cell><ss:Data ss:Type="String">{5}</ss:Data></ss:Cell>' +
                '</ss:Row>',headers[0],headers[1],headers[2],headers[3],headers[4],headers[5]);
        
        Ext.each(this.exportData, function(r){
            counter++;
            style_xml +=  Ext.String.format('<ss:Style ss:ID="s{0}"> <ss:Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1" /><ss:Interior ss:Color="{1}" ss:Pattern="Solid"/></ss:Style>',counter, r.get('FeatureStatus'));

            var blocker_reasons = r.get('BlockerReasons').join('&#13;');
            var blocker_owner = r.get('BlockerOwner').join('&#13;');
            var blocker_dates = r.get('BlockerDate').join('&#13;');

            //var blocker_reasons = Rally.technicalservices.FileUtilities.scrubStringForXML(r.get('BlockerReasons')).replace('&lt;br/$gt;','&#13;');
            //blocker_reasons = blocker_reasons.replace('&lt;br/&gt;','&#13;',"g");
            
            //var blocker_owner = Rally.technicalservices.FileUtilities.scrubStringForXML(r.get('BlockerOwner')); //.replace('<br/>','&#10;','g'));
            //blocker_owner = blocker_owner.replace('&lt;br/&gt;','&#13;',"g");
            //
            //var blocker_dates = Rally.technicalservices.FileUtilities.scrubStringForXML(r.get('BlockerDate'));
            //blocker_dates = blocker_dates.replace('&lt;br/&gt;','&#13;',"g");

            var feature = Rally.technicalservices.FileUtilities.scrubStringForXML(r.get('FormattedFeature'));
            var comments = Rally.technicalservices.FileUtilities.scrubStringForXML(r.get('Comments'));
            var cd_schedule = Rally.technicalservices.FileUtilities.scrubStringForXML(r.get('FeatureTargetSchedule'));
            var state = Rally.technicalservices.FileUtilities.scrubStringForXML(r.get('State'));

            xml_text += Ext.String.format('<ss:Row><ss:Cell ss:StyleID="s{0}"><ss:Data ss:Type="String"></ss:Data></ss:Cell>' +
                    '<ss:Cell><ss:Data ss:Type="String">{1}</ss:Data></ss:Cell>' +
                    '<ss:Cell><ss:Data ss:Type="String">{2}</ss:Data></ss:Cell>' +
                    '<ss:Cell><ss:Data ss:Type="String">{3}</ss:Data></ss:Cell>' +
                    '<ss:Cell><ss:Data ss:Type="String">{4}</ss:Data></ss:Cell>' +
                    '<ss:Cell><ss:Data ss:Type="String">{5}</ss:Data></ss:Cell>' +
                    '<ss:Cell><ss:Data ss:Type="String">{6}</ss:Data></ss:Cell>' +
                    '<ss:Cell><ss:Data ss:Type="String">{7}</ss:Data></ss:Cell>' +
                    '</ss:Row>',counter,
                    cd_schedule,feature,state, blocker_reasons,blocker_dates,
                    blocker_owner, 
                    comments);
        });
        


        var text = Ext.String.format('<?xml version="1.0"?>' +
        '<ss:Workbook xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' +
        '<ss:Styles>{0}</ss:Styles>' +
        '<ss:Worksheet ss:Name="' + this.getContext().getProject().Name + '">' +
        '<ss:Table>{1}</ss:Table></ss:Worksheet></ss:Workbook>',style_xml, xml_text);
        
//        Rally.technicalservices.FileUtilities.saveTextAsFile(html_text, 'features.html');
 //       html_text = Ext.String.format('<table>{0}</table>', html_text);
        Rally.technicalservices.FileUtilities.saveHTMLToFile(text,'feature-report.html');
        
    },
    _getReleaseCombo: function(){
        return this.down('#cb-release');
    },
    _run: function(){
        var release = this._getReleaseCombo().getValue();
        this.logger.log('_run');
        
        this._enableUI(false);
        this._fetchFeatures(release).then({
            scope: this,
            success: function(featureRecords){
                this._fetchBlockedChildren(featureRecords).then({
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
                m.tdAttr = 'style = "background-color: ' + v + ';"';
                return '';
            },
            width: 25
        },{
            text: 'Feature Target Schedule',
            dataIndex: 'FeatureTargetSchedule'
        },{
        //    text: 'Initiative',
        //    dataIndex: 'InitiativeRef',
        //    renderer: function(v,m,r){
        //        if (v){
        //            var link_text = Ext.String.format('{0}: {1}', v.FormattedID, v.Name);
        //            if (v){
        //                return Rally.nav.DetailLink.getLink({record: v, text: link_text});
        //            }
        //            return link_text;
        //        }
        //        return '';
        //    },
        //    flex: 1
        //},{
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
            text: 'State',
            dataIndex: 'State'
        },{
            text: 'Blocker Reasons',
            dataIndex: 'BlockerReasons',
            flex: 1,
            renderer: this._arrayRenderer
        },{
            text: 'Blocker Date',
            dataIndex: 'BlockerDate',
                renderer: this._arrayRenderer
        },{
            text: 'Blocker Owner',
            dataIndex: 'BlockerOwner',
            renderer: this._arrayRenderer,
           flex: 1
        },{
            text: 'Comments',
            dataIndex: 'Comments',
            flex: 1
        }];
    },  
    _arrayRenderer: function(v,m,r){
        if (Array.isArray(v)){
            return v.join('<br/>');
        }
        return v;  
    },
    _fetchBlockedChildren: function(featureRecords){
        var deferred = Ext.create('Deft.Deferred');
        this.logger.log('_fetchChildren',featureRecords.features, featureRecords.discussions);
        
        var fetch = this.childrenFetchFields;
        var find = {
                '_TypeHierarchy': {$in: ['HierarchicalRequirement','Defect','Task']},
                '__At': "current",
                'Blocked': true,
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
    _getDiscussionHash: function(featureRecords){
        var discussion_hash = {};
        Ext.each(featureRecords.discussions, function(d){
            discussion_hash[d.get('Artifact').ObjectID] = d.get('Text');
        });
        return discussion_hash;  
    },
    _getBlockedChildrenForFeatureOid: function(blockedChildrenRecords, featureOid){
        var blockerFields = this.reportBlockerFields; 
        var blocked_children = [];  
        Ext.each(blockedChildrenRecords, function(r){
            
            if (Ext.Array.contains(r.get('_ItemHierarchy'),featureOid)){
                var obj = r.getData(); 
                var child = _.pick(obj, blockerFields);
                blocked_children.push(child);                      
            }
        }, this);
        return blocked_children;
    },
    /**
     * Called by _fetchBlockedChildren;  Creates the feature-status-model objects
     * 
     */
    _createModels: function(featureRecords, blockedChildRecords){

        var discussion_hash = this._getDiscussionHash(featureRecords);
        this.logger.log('_createModels',discussion_hash);
        var featureTargetScheduleField = this._getFeatureTargetScheduleField();
        var models = []; 
        Ext.each(featureRecords.features, function(f){
            var feature_oid = f.get('ObjectID');
            var blockedChildren = this._getBlockedChildrenForFeatureOid(blockedChildRecords, feature_oid);

            var state = '';
            if (f.get('State')){
                state = f.get('State').Name;
            }
            var model = Ext.create('Rally.technicalservices.data.FeatureStatusModel',{
                ObjectID: feature_oid,
                FeatureRef: f.get('_ref'),
               // InitiativeRef: f.get('Parent'),
                FeatureStatus: f.get('DisplayColor') || '#C0C0C0',
                FeatureTargetSchedule: f.get(featureTargetScheduleField),
                FeatureFormattedID: f.get('FormattedID'),
                State: state,
                FeatureName: f.get('Name'),
                BlockedChildren: blockedChildren,  
                Comments: discussion_hash[feature_oid] || ''
            });
            models.push(model);
            
        }, this);
        return models; 
    },
    _fetchFeatures: function(releaseRef){
        var deferred = Ext.create('Deft.Deferred');
        var fetch = Ext.Array.merge(this.featureFetchFields, [this._getFeatureTargetScheduleField()]);
        
        var filters = this.filters || []; 
        var tempFilters = _.map(filters, function(f){return f;});
        tempFilters.push({
            property: 'Release',
            value: releaseRef
        });
        this.logger.log('_fetchFeatures',fetch);
        Ext.create('Rally.data.wsapi.Store',{
            fetch: fetch,
            model: this.featureModel,
            limit: 'Infinity',
            filters: tempFilters,
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
                    fetch: ['Text','Artifact','ObjectID'],
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