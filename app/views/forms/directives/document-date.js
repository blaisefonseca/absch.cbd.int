﻿define(['app', 'text!views/forms/directives/document-date.html', 'moment'], function (app, template, moment) {
    app.directive('documentDate', function () {
        return {
            restrict: 'EAC',
            template: template,
            replace: true,
            link: function ($scope) {
                
                 if(($scope.document||{}).createdDate_dt ||
                    ($scope.$parent.internalDocumentInfo && $scope.$parent.internalDocumentInfo.documentID !== undefined  &&  $scope.$parent.internalDocumentInfo)){
                    
                        $scope.updatedOn = ($scope.document||{}).createdDate_dt || $scope.$parent.internalDocumentInfo.updatedOn;
                        if($scope.$parent.internalDocumentInfo.type=='absNationalReport'){
                            var createdOn = $scope.$parent.internalDocumentInfo.createdOn;
                            if(createdOn!=$scope.updatedOn && !moment.utc(createdOn).isSame(moment.utc($scope.updatedOn), 'day')){
                                $scope.createdOn = createdOn;
                            }
                        }
                }
            }
        }
    })
})
