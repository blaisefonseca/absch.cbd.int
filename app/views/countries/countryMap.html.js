define(['app', 'jqvmap', 'jqvmapworld'], function (app,angucomplete) {

    app.controller("CountryMapController", ["$scope", "authHttp","underscore","$q","$filter","$timeout", "$location","realm",
     function ($scope, $http, _, $q,$filter,$timeout, $location, realm) {

    	//*******************************************************
        var queryFacetsParameters = {
                    'q': '(realm_ss:' + realm.value.toLowerCase() + ') AND NOT version_s:*',
                    'fl': '', 		//fields for results.
                    'wt': 'json',
                    'rows': 0,		//limit
                    'facet': true,	//get counts back
                    'facet.pivot': 'government_s,schema_s',
                    'limit':512
                };
    	var countryFacets = $http.get('/api/v2013/index/select', { params: queryFacetsParameters })
        var countries = $http.get('/api/v2013/countries');
        var countryColors = {};
        $q.all([countryFacets, countries]).then(function (response) {

             $scope.countryFacets = response[0].data.facet_counts.facet_pivot;
             $scope.countries = response[1].data;

             for (var i = 0; i < $scope.countries.length; i++) {

                    if ($scope.countries[i].treaties.XXVII8b.instrument == "ratification"
                    	|| $scope.countries[i].treaties.XXVII8b.instrument == "accession"
                    	|| $scope.countries[i].treaties.XXVII8b.instrument == "acceptance"
                        || $scope.countries[i].treaties.XXVII8b.instrument == "approval"
                        || $scope.countries[i].code == 'EU')
                    {
                        countryColors[$scope.countries[i].code.toLowerCase()] = "#428bca";
                    }
                    else if ($scope.countries[i].treaties.XXVII8b.signature != null ) {
                        countryColors[$scope.countries[i].code.toLowerCase()] = "#5bc0de";
                    }
                    else //if($scope.countries[i].treaties.XXVII8.party != null)
                    {
                        countryColors[$scope.countries[i].code.toLowerCase()] = "#808080";
                    }
            }
            loadMap(countryColors);
        });

         $scope.isPartyToCBD= function(entity){
            $scope.selected_circle="party";
            return entity && entity.treaties.XXVII8.party != null;
         }

         $scope.isSignatory = function(entity){
            $scope.selected_circle="signatory";
            return entity && entity.treaties.XXVII8b.signature != null;
         }

         $scope.isRatified= function(entity){
            $scope.selected_circle="ratified";
            return entity && (entity.treaties.XXVII8b.instrument == "ratification" ||
                              entity.treaties.XXVII8b.instrument == "accession" ||
                              entity.treaties.XXVII8b.instrument == "acceptance"
                              || entity.treaties.XXVII8b.instrument == "approval" );
         }

        function loadMap(countryColors){
                //console.log(sample_data)
                 jQuery('#vmap').vectorMap(
                    {
                        map: 'world_en',
                        backgroundColor: 'black',
                        selectedColor: '#666666',
            		    enableZoom: true,
            		    showTooltip: true,
            		    colors: countryColors,
                        hoverColor: false,
                        onRegionClick: function(event, code, region)
                        {
                            $('.jqvmap-label').html('');
                            $timeout(function(){
                                $location.path('countries/' + code.toUpperCase())},1)
                        },
                        onLabelShow: function(event, label, code)
                        {
                                //console.log($scope.countries["government_s,schema_s"]);

                                var country = _.where($scope.countries, {code: code.toUpperCase()})
                                var countryFacet = _.where($scope.countryFacets["government_s,schema_s"], {value: code})


                                var cfHtml = '';
                                if(countryFacet.length>0){
                                    countryFacet[0].pivot.forEach(function(document){
                                        cfHtml +=    '<li class="list-group-item" style="color:black">'+
                                                    '    <span class="badge">'+ document.count +'</span>'+
                                                    $filter("schemaShortName")(document.value.toLowerCase()) + ' </li>'
                                    });
                                }
                                var countryName = code;
                                var headerClass = "panel-default"
                                if(country.length > 0){
                                    countryName = country[0].name.en;

                                    if($scope.isRatified(country[0]))
                                        headerClass = "panel-primary"

                                    else if($scope.isSignatory(country[0]))
                                        headerClass = "panel-info"

                                    else if($scope.isPartyToCBD(country[0]))
                                        headerClass = "panel-default"
                                }

                            label.html(
                                '<div style="min-width:150px;" class="panel ' + headerClass + '"><div class="panel-heading"><h3 class="panel-title">' + countryName + '</h3>'+
                                '</div> <div class="panel-body"><ul class="list-group">'+ cfHtml +'</ul></div></div>'

                            );
                        }

                    }
                );
        }
    }]);
// });
});
