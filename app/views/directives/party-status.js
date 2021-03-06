define(['app', 'text!views/directives/party-status.html', 'js/common'], function (app, template) {
app.directive('ngPartyStatus', function () {
        return {
            restrict: 'EAC',
            template : template,
           
            scope : {
                    code : '=',
                    government : '='
                },
            link: function ($scope, element, attrs) {
                
            },
            controller: [ "$scope", '$rootScope', '$filter', '$timeout', 'commonjs', '$q',
					 function ($scope, $rootScope, $filter, $timeout, commonjs, $q) 
					{
					var iso_code;
                    
                    // if($scope.code)
                    //     getStatus($scope.code);
                        
                    // if($scope.government)
                    //     getStatus($scope.government.identifier);
                     
                    function getStatus(code){ 
                        if(!code)return;
                        code = code.toUpperCase();
                        $q.when(commonjs.getCountry(code))
                            .then(function(country){
                                $scope.partyStatus = country;
                            });
                    }
                   
                     $scope.$watch('code', function(newValue, oldValue){
                            //if(newValue && newValue != oldValue){
                                getStatus($scope.code); 
                            //}
                        });
                        
                        $scope.$watch('government', function(newValue, oldValue){
                            //if(newValue && newValue != oldValue){
                             if($scope.government)
                                getStatus($scope.government.identifier); 
                            //}
                        });
            
                    

					}
				]
        };
    });
});

