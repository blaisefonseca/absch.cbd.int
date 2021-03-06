define(['app' , 'text!views/directives/internal-record-details.html', 'scbd-angularjs-services', 'scbd-angularjs-filters', 	'views/forms/view/view-history-directive',

    ], function (app, template) {
	app.directive('internalRecordDetails', function($http){
		return{
			restrict: 'EAC',
			replace:true,
			template: template,
            scope       : {
                doc  : '=',
                docInfo  : '='
            },
			controller: ['$scope','$filter', function($scope, $filter){
                  
                   $scope.getUserCountry = function(id){
                        var term = {};
                        term.identifier = id
                        return $filter('term')(term);
                   }
                    
			}]
		};

	});
});
