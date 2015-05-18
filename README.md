#Feature Status Report

Displays the status of features associated with the selected release.  Specific status fields include
blockers (from child Stories and tasks) and the last discussion thread for the feature (Comments).

![ScreenShot](/images/feature-status-report.png)

App Assumptions:
The lowest level portfolio item is a Feature.

The presence of the following custom fields on user stories and tasks:
c_BlockerCreationDate (Blocker Date)
c_BlockerOwnerFirstLast (Blocker Owner)

The presence of the following custom fields on features:
c_FeatureTargetSprint
c_CodeDeploymentSchedule

This app uses Rally App SDK 2.0 and makes use of the Lookback API (LBAPI) to retrieve ItemHierarchy information. 
