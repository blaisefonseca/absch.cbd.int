define(['app', '/app/js/common.js',
    '/app/views/directives/search-filter-dates.partial.html.js'
	], function (app,commonjs) {

app.directive("existingPermit", [ function () {

	return {
		restrict   : "EA",
		templateUrl: "/app/views/forms/edit/permit-selection-directive.html",
		replace    : true,
		transclude : false,
		scope      : {
			model : "=ngModel",
			locales : "=locales",
			caption : "@caption",
			disabled : "=ngDisabled"
		},
		link : function($scope, $element, $attrs) {

        },
		controller : ["$scope", "authHttp", "Thesaurus", "$filter", "underscore", "guid",
                    "$timeout", "$q","IStorage","commonjs","realm",
		 function ($scope, $http, Thesaurus, $filter, _, guid, $timeout, $q,
                storage,commonjs, realm)
		{
	            $scope.options  = {
	           	   keywords : function () { return $http.get("/api/v2013/thesaurus/domains/1A22EAAB-9BBC-4543-890E-DEF913F59E98/terms", { cache: true })
	                                                                    .then(function (o) {return Thesaurus.buildTree(o.data) ; })},
	               usage    : function () { return $http.get("/api/v2013/thesaurus/domains/A7B77788-8C90-4849-9327-E181E9522F3A/terms", { cache: true })
	                                                                    .then(function (o) { return o.data; })},
				   government: function() {
				        return $http.get("/api/v2013/thesaurus/domains/countries/terms", { cache: true }).then(function(o){
				          var countries = $filter("orderBy")(o.data, "name");
				          return countries;
				        });
				      }
	            };


        		var queryCanceler = null;
            	function query () {
					$scope.isLoading = true;
                    var q = '(realm_ss:' + realm.value.toLowerCase() + ' ) AND NOT version_s:*';

                    if($scope.uniqueId)
                        q += ' AND ( uniqueIdentifier_ss:*' + $scope.uniqueId.toLowerCase() + '*)';

                    q += ' AND (schema_s:absPermit)';

                    if($scope.queryGovernment)
						q += getQuery($scope.queryGovernment,'government_s');

					if($scope.permitusage){
						q += getQuery($scope.permitusage, 'usage_REL_ss')
					}

					if($scope.permitkeywords){
						q += getQuery($scope.permitkeywords, 'keyword_ss')
					}
					if($scope.amendmentIntent){
						if($scope.amendmentIntent!=undefined && parseInt($scope.amendmentIntent) != -2){
                            if(parseInt($scope.amendmentIntent) == -1)
                                q += ' AND NOT amendmentIntent_i:*';
                            else
                                q += ' AND (amendmentIntent_i:'+ $scope.amendmentIntent + ')';
                        }
					}
					if($scope.permitIssuanceDate){
						q += ' AND ' +$scope.permitIssuanceDate
					}


                    var queryParameters = {
                        'q': q,
                        'sort': 'createdDate_dt desc, title_t asc',
                        'fl': 'id,identifier_s,title_t,createdDate_dt,government_s,amendmentIntent_i,' +
                                'resourceLinksLanguage_ss,',
                        'wt': 'json',
                        'start': 1,
                        'rows': 25,
                        'cb': new Date().getTime()
                    };

                    if (queryCanceler) {
		                queryCanceler.resolve(true);
		            }

		            queryCanceler = $q.defer();

		            $http.get('/api/v2013/index/select', { params: queryParameters, timeout: queryCanceler }).success(function (data) {

						 queryCanceler = null;						
                         $scope.rawPermitDocs = [];
                         $scope.rawPermitDocs = data.response.docs;
						 $scope.isLoading = false;
						 loaded = true;

                    }).error(function (error) {
                        console.log('onerror'); console.log(error);
                    });
                };

				function getQuery(collection, fieldName){
					selectedValues = _.pluck(collection, "identifier");
					return ' AND ('+ fieldName + ':' + selectedValues.join(' OR ' + fieldName + ':') + ')';
				}
				var loaded = false;
				$scope.$watch('permitusage', function(newValue){
					if(loaded){
						query()
					}
				})
				$scope.$watch('permitkeywords', function(newValue){
					if(loaded){
						query()
					}
				})
				$scope.$watch('permitIssuanceDate', function(newValue){
					if(loaded){
						query()
					}
				})
				$scope.$watch('amendmentIntent', function(newValue){
					if(loaded){
						query()
					}
				})
				$scope.$watch('queryGovernment', function(newValue){
					if(loaded){
						query()
					}
				})
				$scope.$watch('uniqueId', function(newValue){
					if(loaded){
						query()
					}
				})

				$scope.openDialog = function(){

					$('#existingPermits').modal('show');
					if(!loaded)
						$scope.queryGovernment = [{identifier : 'ht'}]
                	query();
				}

				$scope.rawPermitSelected = [];
				$scope.savePermits = function(){

					angular.forEach($scope.rawPermitDocs, function(doc){
						if(doc.__checked){
							if(_.where($scope.rawPermitSelected, {identifier: doc.identifier_s}).length==0)
								$scope.rawPermitSelected.push(doc);
								if(!$scope.model)
									$scope.model = [];
								$scope.model.push({identifier:doc.identifier_s});
						}
					});

					$('#existingPermits').modal('hide');

				}

				$scope.isSelected = function(permit){

					if($scope.rawPermitSelected &&
						_.where($scope.rawPermitSelected, {identifier_s: permit.identifier_s}).length>0)
						return false;

					return true;
				}

				$scope.loadReference = function(){

					//angular.forEach($scope.model, function(document){
					if($scope.model){
						var q = 'identifier_s :' + _.pluck($scope.model, 'identifier').join(' OR identifier_s:')
						var queryParameters = {
                        'q': q,
                        'sort': 'createdDate_dt desc, title_t asc',
                        'fl': 'id,identifier_s,title_t,createdDate_dt,government_s,amendmentIntent_i,' +
                                'resourceLinksLanguage_ss,',
                        'wt': 'json',
                        'start': 0,
                        'rows': 25,
                        'cb': new Date().getTime()
	                    };


	                    $http.get('/api/v2013/index/select', { params: queryParameters })
						.success(function (data) {
							console.log(data);
	                       $scope.rawPermitSelected = data.response.docs;
	                    }).error(function (error) {
	                        console.log('onerror'); console.log(error);
	                    });
					}
						// var query = storage.documents.get(document.identifier, {body:true});
						//
						// 	$q.when(query, function(data){
						// 	$timeout(function(){
						// 		$scope.rawPermitSelected.push(data.data);
						// 	},10);
						// 	console.log(data.data);
						// })

				//	})
				}
				$scope.$watch('model', function(newValue){
					if(newValue && $scope.rawPermitSelected.length==0){
						console.log(newValue);
						$scope.loadReference();
					}
				});

				$scope.removePermit = function(permit){
					$scope.model = _.filter($scope.model, function(per){
						return per.identifier != permit.identifier_s;
					});
					$scope.rawPermitSelected = _.filter($scope.rawPermitSelected, function(per){
						return per.identifier_s != permit.identifier_s;
					})
				}
		}]
	};
}]);

});