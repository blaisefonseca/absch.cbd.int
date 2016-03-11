 define(['app','underscore','linqjs', 'ngMaterial','ngAria','angular-animate',
   '/app/views/search/measure-matrix-countries-directive.html.js',
   '/app/js/common.js', 
   '/app/views/search-new/search-results/result-grouped-national-record.js',
 ], function(app, _, linqjs) {

    app.directive('countryProfile', function() {
        return {
            restrict: 'EAC',
            templateUrl: '/app/views/countries/country-profile-directive.html',
            replace: true,
            scope: {
                api : '=?',
                code : '='
            },
            controller: ["$scope", "$http", "$routeParams", "linqjs", "$filter", "realm",
                "commonjs", "$q", '$element', '$timeout','commonjs','IStorage','$rootScope','$mdSidenav',
                '$mdUtil', '$mdMedia','schemaTypes','breadcrumbs','smoothScroll','$location',
                function($scope, $http, $routeParams, linqjs, $filter, realm, commonjs, $q,
                            $element, $timeout, countriescommonjs, IStorage,$rootScope, $mdSidenav, $mdUtil, $mdMedia, schemaTypes, breadcrumbs,smoothScroll,$location) {

                $scope.api = {
                    loadCountryDetails : $scope.loadCountryDetails
                }
                $scope.$watch('code', function(newVal){
                    if(newVal){
                        $scope.loadCountryDetails(newVal);
                    }
                })
                //**********************************************************
                function resetList(){
                        $scope.showCPC = false;
                        $scope.showIRCC = false;
                        $scope.showMSR = false;
                        $scope.showNFP = false;
                        $scope.showNDB = false;
                        $scope.showCNA = false;
                        $scope.showCP = false;
                        $scope.showCPCRecv = false;

                        $scope.sortMeasure="[jurisdiction_sort, type_sort, status_sort, createdDate_dt, title_t]";
                        $scope.reverseMeasure=false;
                        $scope.sortPermit='title_t';
                        $scope.reversePermit=false;
                        $scope.sortCPC='title_t';
                        $scope.reverseCPC=false;
                        $scope.sortCPCReceived='title_t'
                        $scope.reverseCPCReceived=false;
                        $scope.filterSchema=null;
                }

                    resetList();

                    //facet counts
                    $scope.cpcReceivedCount = 0;
                    $scope.nfpCount= 0;
                    $scope.nationalMeasure= 0;
                    $scope.Permit= 0;
                    $scope.absCheckpoint= 0;
                    $scope.absCheckpointCommunique = 0;
                    $scope.database= 0;
                    $scope.showMatrix = false;

                    if ($location.absUrl().toLowerCase().indexOf("://dev-absch.cbd.int") > 0 || $location.absUrl().toLowerCase().indexOf("localhost:2010") > 0 ||
                        $location.absUrl().toLowerCase().indexOf("://training-absch.cbd.int") > 0) {
                        $scope.showMatrix = true;
                    }
                    
                    //**********************************************************
                    $scope.loadCountryDetails = function(countryCode) {

                    $scope.code = countryCode || $routeParams.code;

                    $scope.documentCount = 0;
                    $scope.currentPage = 0;
                    $scope.searchText = '';
                    $scope.autocompleteData = [];
                    $scope.absch_nfp = null;

                    if ($scope.code) {

                    $q.when(commonjs.getCountry($scope.code.toUpperCase()))
                    .then(function(country) {
                        $scope.country = country;
                    });
                    
                    //*******************************************************
                    var schema = [ "absPermit", "absCheckpoint", "absCheckpointCommunique", "authority", "measure", "database"]
                    var schemQuery = ' (schema_s:' + schema.join(' OR schema_s:') + ' OR (schema_s:focalPoint AND (type_ss:NP-FP OR type_ss:ABS-IC OR type_ss:ABS-FP)))';
                    var queryURL = '/api/v2013/index/select?fl= id, rec_date:updatedDate_dt, identifier_s, uniqueIdentifier_s, url_ss, government_s, schema_s,'
                                    + 'rec_countryName:government_EN_t, rec_title:title_EN_t, rec_summary:description_t, rec_type:type_EN_t,' +
                                         '' +
                                        '&q=(realm_ss:' + realm.value.toLowerCase() + ' OR realm_ss:absch) AND ((' + schemQuery +
                                        ' AND government_s:' + $scope.code.toLowerCase() + ') OR (originCountries_ss:'+
                                        $scope.code.toLowerCase() + ' OR permitSourceCountry_ss:' + $scope.code.toLowerCase() + '))' +
                                        '&rows=100&sort=createdDate_dt+desc,+title_t+asc&start=0&wt=json';
                        var queryCPCRevURL = '/api/v2013/index/select?fl=id,identifier_s,title_t,keywords_CEN_ss'+
                                        'checkpoint_CEN_ss,createdDate_dt,geneticRessourceUsers_s,government_s,permit_ss,' +
                                        '&q=(realm_ss:' + realm.value.toLowerCase() + ' OR realm_ss:absch) AND schema_s:absCheckpointCommunique AND (originCountries_ss:'+
                                        $scope.code.toLowerCase() + ' OR permitSourceCountry_ss:' + $scope.code.toLowerCase() + ')' +
                                        '&rows=100&sort=createdDate_dt+desc,+title_t+asc&start=0&wt=json';
                    var queryProfile = $http.get(queryURL, {cache: true})
                    var queryCPCRecv = $http.get(queryCPCRevURL, {cache: true})

                    $q.all([queryProfile,queryCPCRecv])
                        .then(function(results) {

                        $scope.absch_nfp = results[0].data.response.docs;
                        $scope.cpcReceived = results[1].data.response.docs;
                        var measureMatrixDocuments = [];

                        $scope.absch_nfp.forEach(function(document){
                            document.identifier = document.identifier_s;

                            if(document.ownerGovernment_s)
                                document.ownerGovernment = {identifier:document.ownerGovernment_s};

                            if(document.schema_s == "focalPoint" ){
                                document.description_t = document.description_t.replace(/\n/g, '<br/>');
                                document.documentId = commonjs.hexToInteger(document.identifier_s);
                            }
                            else if(document.schema_s == "authority" || document.schema_s == "database" ||
                                document.schema_s == "absCheckpoint"){
                                    document.description_t = '';
                                    $q.when(IStorage.documents.get(document.identifier_s,{info:""}))
                                    .then(function(data) {
                                        var doc = data.data.body;
                                        var details = '';
                                        if(doc.address)
                                            details += $filter("lstring")(doc.address) + '<br/>';
                                        if(doc.city)
                                            details += $filter("lstring")(doc.city)  + '<br/>';
                                        if(doc.postalCode)
                                            details += $filter("lstring")(doc.postalCode)  + '<br/>';
                                        if(document.government_CEN_s)
                                            details += $filter("lstring")(JSON.parse(document.government_CEN_s));

                                        document.description_t = details;
                                        document.telephones = doc.phones;
                                        document.emails = doc.emails;
                                        document.doc = data.data;
                                    });
                            }
                            else if(document.schema_s=="absCheckpointCommunique"){

                                if(document.geneticRessourceUsers_s){
                                    document.geneticRessourceUsers = $scope.parseJSON(document.geneticRessourceUsers_s);
                                }
                            }
                            //create seprate collection for measure matrix
                            if(document.schema_s=='measure'){

                                 if(document.type_EN_t =="Strategy / Action Plan")
                                    document.type_sort = 1;
                                 if(document.type_EN_t =="Policy Document")
                                    document.type_sort = 2;
                                 if(document.type_EN_t =="Law")
                                    document.type_sort = 3;
                                 if(document.type_EN_t =="Regulatory or Administrative Measures")
                                    document.type_sort = 4;
                                 if(document.type_EN_t =="Guidelines")
                                    document.type_sort = 5;
                                 if(document.type_EN_t =="Explanatory Information")
                                    document.type_sort = 6;
                                 if(document.type_EN_t =="Other")
                                    document.type_sort = 7;

                                 if(document.status_EN_t =="Legally binding ")
                                    document.status_sort = 1;
                                 if(document.status_EN_t =="Not legally binding")
                                    document.status_sort = 2;
                                 if(document.status_EN_t =="Draft")
                                    document.status_sort = 3;
                                 if(document.status_EN_t =="Retired")
                                    document.status_sort = 4;

                                 if(document.jurisdiction_EN_t =="Regional / Multilateral")
                                    document.jurisdiction_sort = 1;
                                 if(document.jurisdiction_EN_t =="National / Federal")
                                    document.jurisdiction_sort = 2;
                                 if(document.jurisdiction_EN_t =="Sub-national")
                                    document.jurisdiction_sort = 3;
                                 if(document.jurisdiction_EN_t =="Community")
                                    document.jurisdiction_sort = 4;
                                 if(document.jurisdiction_EN_t =="Other")
                                    document.jurisdiction_sort = 5;

                                if(!document.retired_dt || moment() <= moment(document.retired_dt)){
                                    document.measureMatrix = true;
                                }
                                else{
                                    //retired measures
                                    document.jurisdiction_sort = 9;
                                }
                                measureMatrixDocuments.push(document);

                            }

                        });
                        $scope.measureMatrixDocuments = measureMatrixDocuments;
                        $scope.measureMatrixDocuments.selectAll = true;
                        $scope.cpcReceived.forEach(function(document){
                            if(document.geneticRessourceUsers_s){
                                document.geneticRessourceUsers = $scope.parseJSON(document.geneticRessourceUsers_s);
                            }
                            $scope.cpcReceivedCount++;
                        });
                        $scope.getFacets($scope.absch_nfp);
                        $('[data-toggle="tooltip"]').tooltip()

                        if($routeParams.countryCode && $routeParams.documentType){
                            if($routeParams.documentType.toLowerCase()=='measure-matrix'){
                                $scope.showMSR = true;
                            }else{
                                $scope['show' + $routeParams.documentType.toUpperCase()] = true;
                            }
                        }
                    });
                    }
                }

                //**********************************************************
                $scope.$watch('absch_nfp', function(value) {

                    if (!value) return;

                    $scope.getFacets(value);


                });


                //**********************************************************
                $scope.getFacets = function(data) {

                    var linqObj = linqjs.from(data);
                    $scope.nationalAuthority = linqObj.count(function(schema) {

                    return schema.schema_s.toLowerCase() == 'authority';
                    });
                    //console.log(response.data.response.docs);
                    $scope.nfpCount = linqObj.count(function(schema) {
                    // console.log(schema.schema_EN_t.toLowerCase() + ' ' + 'national focal point'.toLowerCase());
                    return schema.schema_s.toLowerCase() == 'focalpoint'.toLowerCase();
                    });

                    $scope.nationalMeasure = linqObj.count(function(schema) {
                    return schema.schema_s.toLowerCase() == 'measure';
                    });

                    $scope.Permit = linqObj.count(function(schema) {
                    return schema.schema_s.toLowerCase() == 'abspermit';
                    });

                    $scope.absCheckpoint = linqObj.count(function(schema) {
                    return schema.schema_s.toLowerCase() == 'abscheckpoint';
                    });

                    $scope.absCheckpointCommunique = linqObj.count(function(schema) {
                    return schema.schema_s.toLowerCase() == 'abscheckpointcommunique';
                    });

                    $scope.database = linqObj.count(function(schema) {
                    return schema.schema_s.toLowerCase() == 'database';
                    });
                    $scope.resource = linqObj.count(function(schema) {
                    return schema.schema_s.toLowerCase() == 'resource';
                    });
                }

                //    $scope.$watch('searchText.$', function(value) {
                //
                //      if (undefined == value || value == null || $scope.absch_nfp == null) return;
                //      $scope.getFacets($filter('filter')($scope.absch_nfp.response.docs, value));
                //
                //
                //    });

                $scope.showlist = false;

                //    $scope.$on('mapDetailsLoad', function(evt, data){
                //        $scope.mapDetails = data.mapDetails;
                //        $scope.type = 'party';
                //       if ($routeParams.code && $routeParams.code.toUpperCase() != 'RAT')
                //         $scope.show('profile');
                //       else
                //         $scope.show('map');
                //    })

                //**********************************************************
                $scope.countriescommonjs = countriescommonjs;
                $scope.$on('loadCountryProfile', function(evt, evtData){
                    $scope.loadCountryDetails(evtData.data.countryCode);
                })


                $scope.isContactInformation = function(entity){

                    return entity && (entity.schema_s == "focalPoint" ||
                                entity.schema_s == "authority" || entity.schema_s == "database" ||
                                entity.schema_s == "absCheckpoint")
                }

                $scope.isMeasure = function(entity){

                    return entity && entity.schema_s == "measure";
                }
                $scope.isCheckpointCommunique = function(entity){

                    return entity && entity.schema_s == "absCheckpointCommunique";
                }

                $scope.isPermit = function(entity){

                    return entity && entity.schema_s == "absPermit";
                }

                $scope.isCheckpointCommuniqueReceived = function(entity){
                    return entity && entity.schema_s == "absCheckpointCommunique"
                    && (entity.originCountries_ss==$scope.code  || entity.permitSourceCountry_ss==$scope.code);
                }

                $scope.isCheckpoint = function(entity){

                    return entity && entity.schema_s == "absCheckpoint";
                }
                $scope.isFocalpoint = function(entity){

                    return entity && entity.schema_s == "focalPoint";
                }
                $scope.isDatabase = function(entity){

                    return entity && entity.schema_s == "database";
                }
                $scope.isCNA = function(entity){

                    return entity && entity.schema_s == "authority";
                }

                $scope.showDetails = function(document){
                    //$scope.currentDocument = documentId;
                    if(!document.data){
                            var doc = IStorage.documents.get(document.identifier_s);
                            var docInfo = IStorage.documents.get(document.identifier_s,{ info: true});
                            $q.all([doc,docInfo])
                            .then(function(result){
                                document.data = result[0].data;
                                document.data.info = result[1].data;
                            });
                        }
                };

                //**********************************************************
                $scope.getTitle = function(schema,type, schemaFull){
                    if(schema == 'focalPoint'){

                            if(_.contains(type,'NP-FP') || _.contains(type,'ABS-FP'))
                                return 'ABS National Focal Point';
                            // else if(_.contains(type,'ABS-IC'))
                            //     return 'ABS ICNP Focal Point';
                            else if(_.contains(type,'CBD-FP1') ||  _.contains(type,'CBD-FP2'))
                                return 'CBD National Focal Point';
                            else
                                return 'National Focal Point';
                    }
                    else
                        return schemaFull;

                }

                //**********************************************************
                $scope.parseJSON = function(value){
                    if(value)
                        return JSON.parse(value);
                }

                function getCountriesFacets(){
                    var schema = _.clone(schemaTypes);
                    schema.push('focalPoint');
                        var queryFacetsParameters = {
                            'q': 'realm_ss:' + realm.value.toLowerCase() + ' AND NOT version_s:* AND schema_s:(' + schema.toString().replace(/,/g, ' ') + ')',
                            'fl': '', 		//fields for results.
                            'wt': 'json',
                            'rows': 0,		//limit
                            'facet': true,	//get counts back
                            'facet.field': ['government_s'],
                            'facet.mincount':1,
                            'facet.limit': 512
                        };

                        $http.get('/api/v2013/index/select', { params: queryFacetsParameters }).success(function (data) {
                            var solrArray = data.facet_counts.facet_fields.government_s;
                            for (var i = 0; i < solrArray.length; i += 2) {
                                var country = _.findWhere($scope.countries, {code:solrArray[i].toUpperCase()});
                                if(country){
                                    country.facetCount =  solrArray[i + 1];
                                }
                                else {
                                        console.log(solrArray[i]);
                                    }

                            }

                        }).error(function (error) {
                            console.log('onerror');
                            console.log(error);
                        });
                }

                $scope.isForMeasureMatrix = function(measure){

                    return measure.measureMatrix;

                }
                $scope.selectAllForMatrix = function(){

                    _.map($scope.measureMatrixDocuments,function(item){
                        item.measureMatrix = !$scope.measureMatrixDocuments.selectAll;
                    })
                }
            }]

        };
    });
});
