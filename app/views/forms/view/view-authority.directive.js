require("app").directive("viewAuthority", [function () {
	return {
		restrict   : "EAC",
		templateUrl: "/app/views/forms/view/view-authority.directive.html",
		replace    : true,
		transclude : false,
		scope: {
			document: "=ngModel",
			locale  : "=",
			target  : "@linkTarget",
			allowDrafts : "@",
			hide : "@"
		},
		link : function ($scope)
		{
			$scope.contacts = undefined;
		},
		controller : ["$scope", "IStorage", function ($scope, storage)
		{
			//====================
			//
			//====================
			$scope.display = function(field) {
				
				if(!$scope.hide) return true; //show all fields

				return( $scope.hide.indexOf(field) >= 0 ? false : true);
			}


			//====================
			//
			//====================
			$scope.$watch("document.contacts", function(_new)
			{
				$scope.contacts = angular.fromJson(angular.toJson(_new||[]));

				if($scope.contacts)
					$scope.loadReferences($scope.contacts);
			});

			//====================
			//
			//====================
			$scope.loadReferences = function(targets) {

				angular.forEach(targets, function(ref){

					storage.documents.get(ref.identifier, { cache : true})
						.success(function(data){
							ref.document = data;
						})
						.error(function(error, code){
							if (code == 404 && $scope.allowDrafts == "true") {

								storage.drafts.get(ref.identifier, { cache : true})
									.success(function(data){
										ref.document = data;
									})
									.error(function(){
										ref.document  = undefined;
										ref.error     = error;
										ref.errorCode = code;
									});
							}

							ref.document  = undefined;
							ref.error     = error;
							ref.errorCode = code;

						});
				});
			};
		}]
	};
}]);