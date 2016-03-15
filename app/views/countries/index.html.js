define(['app','underscore',
  '/app/js/common.js',
  'scbd-angularjs-filters',
  './search-map.js','scbd-map/ammap3-service', '/app/services/search-service.js',
  '../directives/block-region-directive.js'
], function(app, _) {

  app.controller("CountriesMapController", ["$scope", "$element", "$location", "commonjs", "$q", 'searchService','$filter',
    function($scope, $element, $location, commonjs, $q, searchService, $filter) {
        $scope.sortTerm = "name.en";
        
        var headerCount = {	absCheckpoint		       : 0,
                                absCheckpointCommunique: 0,
                                absPermit:               0,
                                authority:               0,
                                database:                0,
                                focalPoint:              0,
                                measure:                 0
                            };
                            
        $scope.loading = true;
        
       
        $q.all([commonjs.getCountries(), searchService.governmentSchemaFacets()])
            .then(function(results){
                var countries = results[0];
                var countryFacets = results[1];
                $scope.countries = _.map(countries, function(country){
                                        var facets = _.findWhere(countryFacets, {government:country.code.toLowerCase()});
                                        if(!facets)
                                            facets = {};
                                        if(facets.schemas){
                                            headerCount.absCheckpoint           += facets.schemas.absCheckpoint||0;
        									headerCount.absCheckpointCommunique += facets.schemas.absCheckpointCommunique||0;
        									headerCount.absPermit               += facets.schemas.absPermit||0;
        									headerCount.authority               += facets.schemas.authority||0;
        									headerCount.database                += facets.schemas.database||0;
        									headerCount.focalPoint              += facets.schemas.focalPoint||0;
        									headerCount.measure                 += facets.schemas.measure||0;
                                        }
                                        return {
                                            code : country.code,
                                            name : country.name,
                                            isNPParty: country.isNPParty,
                                            isNPInbetweenParty: country.isNPInbetweenParty,
                                            isNPSignatory: country.isNPSignatory,
                                            entryIntoForce  : country.entryIntoForce,
                                            schemas : facets.schemas||{},
                                            totalCount : facets.recordCount
                                        };
                                    });
                $scope.headerCount = headerCount;
                $element.find('[data-toggle="tooltip"]').tooltip();
                $scope.loading = false;
              
            });
            
            
            
               //*************************************************************************************************************************************
               $scope.setPartyFilter = function(pfilter) {
                    $scope.partyFilter = pfilter;
               };
               
                var qs = $location.search();
                
                if(qs.f){
                    if(qs.f === 'party' || qs.f === 'inbetween' || qs.f === 'nonparty')
                        $scope.setPartyFilter(qs.f); 
                      
                    $location.search('f', null);
                }
                else
                     $scope.setPartyFilter('All');



               //*************************************************************************************************************************************
               $scope.hasStatus = function(item) {
                   
                   if(!$scope.partyFilter || $scope.partyFilter === 'All'){
                       return true;
                   }
                   if($scope.partyFilter ==='party'){
                       return item.isNPParty;
                   }
                   if($scope.partyFilter ==='nonparty'){
                       return !item.isNPParty;
                   }
                   if($scope.partyFilter ==='inbetween'){
                       return item.isNPInbetweenParty;
                   }
               };




            //==================================================================================
            $scope.sortTable = function(term, order) {

                    if ($scope.sortTerm == term) {
                        $scope.orderList = !$scope.orderList;
                    } else {
                        $scope.sortTerm = term;
                        $scope.orderList = true;
                    }

                    if(order == "ASC")
                        $scope.orderList = false;

                    if(order == "DESC")
                        $scope.orderList = true;

            };
            
            //==================================================================================
            $scope.sortTermFilter = function(data) {

                if ($scope.sortTerm == "isNPParty")
                    return data.isNPParty + ' ' + data.entryIntoForce;
                else if ($scope.sortTerm == "!isNPParty")
                    return !!data.isNPParty + ' ' + data.name.en;
                else if ($scope.sortTerm == "name.en")
                    return data.name.en;
                else if(!data.schemas)
                    return ($scope.orderList ? -9999999 : 999999);
                else if ($scope.sortTerm == "CNA") {
                    return data.schemas.authority ? data.schemas.authority : ($scope.orderList ? -9999999 : 999999);
                } else if ($scope.sortTerm == "CP") {
                    return data.schemas.absCheckpoint ? data.schemas.absCheckpoint : ($scope.orderList ? -9999999 : 999999);
                } else if ($scope.sortTerm == "CPC") {
                    return data.schemas.absCheckpointCommunique ? data.schemas.absCheckpointCommunique : ($scope.orderList ? -9999999 : 999999);
                } else if ($scope.sortTerm == "IRCC") {
                    return data.schemas.absPermit ? data.schemas.absPermit : ($scope.orderList ? -9999999 : 999999);
                } else if ($scope.sortTerm == "MSR") {
                    return data.schemas.measure ? data.schemas.measure : ($scope.orderList ? -9999999 : 999999);
                } else if ($scope.sortTerm == "NDB") {
                    return data.schemas.database ? data.schemas.database : ($scope.orderList ? -9999999 : 999999);
                } else if ($scope.sortTerm == "NFP") {
                    return data.schemas.focalPoint ? data.schemas.focalPoint : ($scope.orderList ? -9999999 : 999999);
                }
            };

             //==================================================================================
            $scope.gotoCountryProfile = function(code){
                $location.path('/countries/' + code);
            };

    }
  ]);

});
