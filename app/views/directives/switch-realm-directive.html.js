define(['app','underscore','ionsound'], function(app,_) {
    app.directive('switchRealm', function() {
        return {
            restrict: 'EAC',
            replace: true,
            templateUrl: '/app/views/directives/switch-realm-directive.html',
            controller: ['$scope', '$location','realmConfiguration','realm',
                function($scope, $location, realmConfiguration, realm) {

                    console.log(realm);

                    $scope.realmList = [{identifier:'ABS', value:'ABS', message:'ABS-CH PRODUCTIONN/LIVE environment.'}
                                        ,{identifier:'ABS-DEV', value:'ABS-DEV', message:'ABS-CH DEVELOPMENT environment.'},
                                        {identifier:'ABS-TRG', value:'ABS-TRG', message:'ABS-CH TRAINING environment.'}]

                    $scope.currentRealm = function(){
                        var realmConfig = _.find(realmConfiguration,{host:$location.$$host});
                        return realmConfig.realm;
                    }

                    $scope.currentRealmMessage = function(){
                        var realmConfig = _.find(realmConfiguration,{host:$location.$$host});
                        return _.find($scope.realmList,{identifier:realmConfig.realm}).message;
                    }
                    $scope.switchRealm = function(){

                        var realmConfig = _.find(realmConfiguration,{host:$location.$$host});
                        realmConfig.realm = $scope.selectedRealm;
                        realm.value = realmConfig.realm;
                    }
                }]

        };
    });
});