define(['app', 'underscore', '/app/views/forms/view/record-loader.directive.html.js',
'/app/views/search-new/search-results/record-viewer.js',
        '/app/js/common.js', '/app/services/role-service.js', 'toastr',
          'scbd-branding/directives/xuser-notifications-panel', '/app/views/directives/block-region-directive.js',
], function(app, _) {
 "use strict";
    app.controller("recordDetailsController", ["$rootScope", "$scope", "$filter", "$routeParams", "IStorage", "$q",
     "IWorkflows", "IUserNotifications", "commonjs", "$element", "$timeout", "roleService", "toastr", "$location",
        function($rootScope, $scope, $filter, $routeParams, IStorage, $q, IWorkflows,
            IUserNotifications, commonjs, $element, $timeout, roleService, toastr, $location) {


            if ($routeParams.document_type) {
                $scope.document = {
                    schema : $filter("mapSchema")($routeParams.document_type),
                    identifier : $routeParams.documentID
                };
                $scope.loading = true;

                $q.when(IStorage.drafts.locks.get($routeParams.documentID,{lockID:''}))
                .then(function(data){
                        var doc = data.data[0];
                        if(doc && doc.lockID){
                            doc.workflowId = doc.lockID.replace('workflow-','');
                            $scope.showRequestHistory = true;
                           _.extend($scope.document, doc);
                            if(doc.lockedBy.userID == $rootScope.user.userID)
                                $scope.canRecall = true;
                        }

                }).finally(function() {
                    delete $scope.loading;
                });;
            }


            $scope.refreshworkflowRecord = function(document, workflowInfo) {

               $scope.loading = true;

               if (workflowInfo.workflowId) {
                   IWorkflows.get(workflowInfo.workflowId).then(function(data) {
                       if (data.state == 'completed') {
                           // var currentDocument = _.first(_.filter($scope.records, function(doc) {
                           //     return doc.documentId == document.header.documentId;
                           // }));
                           $scope.showRequestHistory = false;
                       } else {
                           $timeout(function() {
                               $scope.refreshworkflowRecord(document, workflowInfo);
                                $scope.loading = false;
                           }, 500);
                       }
                   }).finally(function() {
                       delete $scope.loading;
                   });
               }
            }

            $scope.showButton = function() {

                return roleService.isAbsPublishingAuthority() ||
                    roleService.isAbsNationalAuthorizedUser() ||
                    roleService.isAbsNationalFocalPoint() ||
                    roleService.isabschiac() ||
                    roleService.isAbsAdministrator() ||
                    roleService.isAdministrator() ||
                    _.contains(['resource', 'modelContractualClause','communityProtocol','capacityBuildingResource','capacityBuildingInitiative'],$scope.schema);

            }

            $scope.askDelete = function(record) {

                if(!(commonjs.isUserInRole($rootScope.getRoleName('AbsPublishingAuthorities')) ||
                        commonjs.isUserInRole($rootScope.getRoleName('AbsNationalFocalPoint')) ||
                        commonjs.isUserInRole($rootScope.getRoleName('AbsAdministrator')) ||
                        commonjs.isUserInRole($rootScope.getRoleName('Administrator')))){
                   $scope.cantDelete = false;
                   $scope.iacCantDelete = true;
                    $scope.recordToDelete = "0";
                }
                else{
                    if (record.type == 'absPermit' && $scope.isPublished(record)) {
                        //cant delete only modify
                        $scope.pilotDelete = true;
                        $scope.cantDelete = true;
                        $scope.recordToDelete = "0"; //TODO:only for pilot phase
                    } else {
                        $scope.recordToDelete = record;
                        $scope.cantDelete = false;

                    }
                }

            };

            $scope.deleteDraft = function(record) {
                $scope.loading = true;

                return $q.when(IStorage.drafts.delete(record.identifier)).then(function() {

                    recordDeleted(record);
                    $scope.recordToDelete = null;

                }).finally(function() {
                    delete $scope.loading;
                });
            };

            $scope.deleteRecord = function(record) {

                $scope.loading = true;

                return $q.when(IStorage.documents.delete(record.identifier)).then(function() {
                    $scope.recordToDelete = null;
                    toastr.info('<h1>Record deleted.</h1>', {
                        allowHtml: true
                    });
                    $location.path("/register/" + record.schema);
                }).finally(function() {
                    delete $scope.loading;
                });
            };


            $scope.askDeleteWorkflowRequest = function(){
                $scope.recordForDeleteWorkflowRequest = $scope.document;
            };
            $scope.deleteWorkflowRequest = function(record){

                $scope.loading = true;
                IWorkflows.cancel(record.workflowId, {'action':'cancel'})
                .then(function(data){
                    $scope.recordForDeleteWorkflowRequest = null;
                    $scope.canRecall = false;
                    $scope.showRequestHistory = false;

                    toastr.info('The request was successfully recalled');
                }).finally(function() {
                    delete $scope.loading;
                });
            };


            var deleteRecordModal = $element.find("#deleteRecordModal");
            var deleteWorkflowRequestMadal = $element.find("#deleteWorkflowRequestModal");

            $scope.$watch("recordToDelete", function(val) {
                if (val && !deleteRecordModal.is(":visible")) {
                    deleteRecordModal.appendTo('body').modal("show");
                }
                if (!val && deleteRecordModal.is(":visible")) {
                    deleteRecordModal.modal("hide");
                }
            });

            $scope.$watch("recordForDeleteWorkflowRequest", function(val) {
                if (val && !deleteWorkflowRequestMadal.is(":visible")) {
                    deleteWorkflowRequestMadal.appendTo('body').modal("show");
                }
                if (!val && deleteWorkflowRequestMadal.is(":visible")) {
                    deleteWorkflowRequestMadal.modal("hide");
                }
            });

            deleteRecordModal.on("hidden.bs.modal", function() {
                $timeout(function() {
                    $scope.recordToDelete = null; //clear on backdrop click
                });
            });
            deleteWorkflowRequestMadal.on("hidden.bs.modal", function() {
                $timeout(function() {
                    $scope.recordForDeleteWorkflowRequest = null; //clear on backdrop click
                });
            });


            $scope.$on('$destroy', function(){
                $('#deleteRecordModal').remove();
                $('#deleteWorkflowRequestModal').remove();
            });

        }
    ]);
});