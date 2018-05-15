define(['app', "text!views/forms/view/bch/view-lmo.directive.html", 
'views/directives/record-options', './view-lmo-reference.directive', './view-lmo-gene.directive',
'views/forms/view/view-reference-records.directive'
], function (app, template) {

app.directive("viewModifiedOrganism", [function () {
	return {
		restrict   : "EAC",
		template: template ,
		replace    : true,
		transclude : false,
		scope: {
			document: "=ngModel",
			locale  : "=",
			target  : "@linkTarget",
			hide	: "@"
		},
		controller : ["$scope", function ($scope)
		{
			
			
			
			//====================
			//
			//====================
			$scope.display = function(field) {
				
				if(!$scope.hide) return true; //show all fields

				return( $scope.hide.indexOf(field) >= 0 ? false : true);
			}
		}]
	};
}]);

});