Ext.define('Rally.technicalservices.data.FeatureStatusModel',{
    extend: 'Ext.data.Model',

    emptyString: '(Empty)',
    fields: [
             {name: 'FeatureStatus' },
             {name: 'FeatureRef', type:'string'},
             {name: 'ObjectID', type: 'int'},
             {name: 'CodeDeploymentSchedule', type: 'string'},
             {name: 'FeatureFormattedID', type: 'string'},
             {name: 'FeatureName', type:'string'},
             {name: 'BlockedChildren', type: 'auto'},
             {name: 'Comments', type:'string'},
             {name: 'FormattedFeature', type: 'string', 
                 convert: function(v, rec){
                     return Ext.String.format('{0}:{1}',rec.get('FeatureFormattedID'), rec.get('FeatureName')); 
                 }
             },
             {name: 'BlockerReasons', type: 'string', 
                 convert: function(v, rec){
                     var blocked_reason = '';
                     Ext.each(rec.get('BlockedChildren'), function(child){
                         var reason = child.get('BlockedReason') || rec.emptyString;
                         blocked_reason += reason + '<br/>';
                     });
                     return blocked_reason;  
                 }
              },
             {name: 'BlockerOwner', type: 'string', 
                  convert: function(v, rec){
                      var blocked_owner = '';
                      Ext.each(rec.get('BlockedChildren'), function(child){
                          var owner = child.get('c_BlockerOwnerFirstLast') || rec.emptyString;
                          blocked_owner += owner + '<br/>';
                      });
                      return blocked_owner;  
                  }
             },
             {name: 'BlockerDate', type: 'string', 
                 convert: function(v, rec){
                     var blocked_date = '';
                     Ext.each(rec.get('BlockedChildren'), function(child){
                         var date = child.get('c_BlockerCreationDate');
                         if (date){
                             blocked_date += Rally.util.DateTime.formatWithDefault(Rally.util.DateTime.fromIsoString(date)) + '<br/>';
                         } else {
                             blocked_date += rec.emptyString + '<br/>';
                         }
                     });
                     return blocked_date;  
                 }
             }]
             
             /**
              * 
              * <?xml version="1.0"?>
<ss:Workbook xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
    <ss:Worksheet ss:Name="Sheet1">
        <ss:Table>
            <ss:Row>
                <ss:Cell>
                    <ss:Data ss:Type="String">First Name</ss:Data>
                </ss:Cell>
                <ss:Cell>
                    <ss:Data ss:Type="String">Last Name</ss:Data>
                </ss:Cell>
                <ss:Cell>
                    <ss:Data ss:Type="String">Phone Number</ss:Data>
                </ss:Cell>
            </ss:Row>
        </ss:Table>
    </ss:Worksheet>
</ss:Workbook>
              * 
              * 
              * 
              */
});