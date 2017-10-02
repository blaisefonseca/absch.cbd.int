define(['app', 'text!views/forms/view/view-focalpoint.directive.html', 
'views/directives/record-options',
], function (app, template) {

app.directive('viewFocalPoint', [function() {
	return {
		restrict: 'EAC',
		template: template ,
		replace: true,
		transclude: false,
		scope: {
			document: "=ngModel",
			locale: "=",
			target: "@linkTarget"
		},
		controller: ['$scope','commonjs', function ($scope, commonjs) {
			$scope.getNFPText = commonjs.getNFPText;
		}]
	}
}]);
});
