define(['app', 'text!views/forms/view/view-pressrelease.directive.html',], function (app, template) {

app.directive('viewPressRelease', [function() {
	return {
		restrict: 'EAC',
		template: template, 
		replace: true,
		transclude: false,
		scope: {
			document: "=ngModel",
			locale: "=",
			target: "@linkTarget"
		},
		controller: ['$scope', function ($scope) {
		}]
	}
}]);
});
