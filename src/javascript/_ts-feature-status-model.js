Ext.define('Rally.technicalservices.data.FeatureStatusModel',{
    extend: 'Ext.data.Model',
    emptyString: '(Empty)',
    fields: [
             {name: 'FeatureStatus' },
             {name: 'FeatureRef', type:'string'},
             {name: 'State', type:'string'},
           //  {name: 'InitiativeRef'},
             {name: 'ObjectID', type: 'int'},
             {name: 'FeatureTargetSchedule', type: 'string'},
             {name: 'FeatureFormattedID', type: 'string'},
             {name: 'FeatureName', type:'string'
             },{
                 name: 'BlockedChildren', 
                 convert: function(v, rec){
                     var obj_hash = {};
                     var date_regex = new RegExp(/([0-9]+-[0-9]+-[0-9]+)T[0-9]+:[0-9]+:[0-9]+\.[0-9]+Z/);
                     Ext.each(v, function(obj){
                         var obj_hash_code  = JSON.stringify(obj, function(key, value) {
                             if (key == 'FormattedID'){
                                 return '';
                             }
                             //De-dup dates to the day
                             var matcher = date_regex.exec(value);
                             if (matcher && matcher[1]){
                                 return matcher[1];
                             }
                             return value;
                         });
                         obj_hash[obj_hash_code] = obj;  
                     }, this);
                     var dedupedObjects = _.values(obj_hash);
                     return dedupedObjects;
                 }
             },{
                 name: 'Comments',type:'string'},
             {
                 name: 'FormattedFeature', 
                 type: 'string', 
                 convert: function(v, rec){
                     return Ext.String.format('{0}:{1}',rec.get('FeatureFormattedID'), rec.get('FeatureName')); 
                 }
             },
             {
                 name: 'BlockerReasons', 
                 convert: function(v, rec){
                     return _.map(rec.get('BlockedChildren'), function(child){return child.BlockedReason || rec.emptyString;});
                 }
              },
             {
                  name: 'BlockerOwner', 
                  convert: function(v, rec){
                      return _.map(rec.get('BlockedChildren'), function(child){return child.c_BlockerOwnerFirstLast || rec.emptyString;});
                  }
             },
             {
                 name: 'BlockerDate',  
                 convert: function(v, rec){
                     return _.map(rec.get('BlockedChildren'), function(child){
                         var date = child.c_BlockerCreationDate;
                         if (date){
                             return Rally.util.DateTime.formatWithDefault(Rally.util.DateTime.fromIsoString(date));
                         }
                         return rec.emptyString;
                      });
                 }
             },{
               name: 'BlockerArtifact', 
               convert: function(v, rec){
                   var objs = rec.get('BlockedChildren');
                   return _.map(rec.get('BlockedChildren'), function(child){return child.FormattedID || rec.emptyString});
               }
             }]
});