define(['app', 'underscore','angular', '/app/js/common.js'], function(app, _, angular) {

    app.directive("measureMatrixElements", function() {
        return {
            restrict: "EAC",
            templateUrl: "/app/views/search/measure-matrix-elements-derective.html",
            replace: true,
            transclude: false,
            require: "?ngModel",
            scope: {
                binding: "=ngModel",
                locales: "=",
                type: "@",
                layout: "@",
                document: "=document",
                api:      "=?"
            },
            link: function($scope, $element, $attr, ngModelController) {
                $scope.identifiers = null;
                $scope.sections = null;
                $scope.otherValues = null;
                $scope.terms = null;
                $scope.rootTerms = [];

                $scope.init();
                $scope.$watch("document", $scope.onTerms);
                $scope.$watch("binding", $scope.load);
                $scope.$watch("binding", function() {
                    ngModelController.$setViewValue($scope.binding);
                });


            },
            controller: ["$scope", "$q", "Thesaurus", "Enumerable", "$http", "guid","commonjs","$element",
            function($scope, $q, thesaurus, Enumerable, $http, guid, commonjs, $element) {

                var elementsForOthers = [
                                          "24E809DA-20F4-4457-9A8A-87C08DF81E8A","E3E5D8F1-F25C-49AA-89D2-FF8F8974CD63",
                                          "9847FA8A-16C3-4466-A378-F20AF9FF883B","08B2CDEC-786F-4977-AD0A-6A709695528D","01DA2D8E-F2BB-4E85-A17E-AB0219194A17"
                                        ];
                $scope.api = {
                    reloadMatrix : reloadMatrix
                }

                function reloadMatrix(callLoad){
                    $scope.identifiers = null;
                    $scope.sections = null;
                    $scope.otherValues = null;
                    $scope.terms = null;
                    $scope.rootTerms = [];

                    if(callLoad){
                        $scope.load();
                        $scope.onTerms($scope.document);
                    }
                }

                $scope.termsFn = function(){
                    return $http.get("/api/v2013/thesaurus/domains/50616B56-12F3-4C46-BC43-2DFC26679177/terms", { cache: true });
                 };



                //==============================
                //
                //==============================
                var other;
                $scope.init = function() {
                    var otherQuery = $http.get("/api/v2013/thesaurus/terms/5B6177DD-5E5E-434E-8CB7-D63D67D5EBED", { cache: true });
                    return $q.all([$scope.terms||$scope.termsFn(), other||otherQuery])
                        .then(
                        function(data) { // on success
                            $scope.terms = data[0].data||data[0];
                            other        = data[1].data||data[1];

                            _.each(elementsForOthers, function(element){

                                if(!_.some($scope.terms, {identifier:other.identifier + '#' + element})){

                                    var otherElement = angular.copy(other);

                                    otherElement.identifier = otherElement.identifier + '#' + element;
                                    otherElement.broaderTerms.push(element);
                                    $scope.terms.push(otherElement)

                                    var parentElement = _.find($scope.terms, {identifier:element})
                                    if(parentElement)
                                      parentElement.narrowerTerms.push(otherElement.identifier);
                                }

                              });
                        });
                }

                //==============================
                //
                //==============================
                $scope.load = function() {

                    return $q.when($scope.init())
                        .then(function(){
                            var oNewIdentifiers = {};
                            var oNewSections = {};
                            var oNewCustomValues = {};

                            if ($scope.binding) {

                                if (!$.isArray($scope.binding))
                                    throw "Type must be array";

                                for (var i = 0; i < $scope.binding.length; ++i) {
                                      var identifier = $scope.binding[i].identifier;
                                      //handle others
                                      if($scope.binding[i].parent || identifier == '5B6177DD-5E5E-434E-8CB7-D63D67D5EBED'){
                                          identifier += ('#' + $scope.binding[i].parent) || '';
                                          oNewCustomValues[identifier] = $scope.binding[i].customValue
                                      }
                                      oNewIdentifiers[identifier] = true;
                                      oNewSections[identifier] = $scope.binding[i].section||{};
                                }
                            }

                            if (!angular.equals(oNewIdentifiers, $scope.identifiers)) $scope.identifiers = oNewIdentifiers;
                            if (!angular.equals(oNewSections, $scope.sections)) $scope.sections = oNewSections;
                            if (!angular.equals(oNewCustomValues, $scope.otherCustomValues)) $scope.otherCustomValues = oNewCustomValues;
                        });
                }


                //==============================
                //
                //==============================
                $scope.onTerms = function(refTerms) {

                    $scope.rootTerms = [];

                    if (refTerms) {
                        $q.when($scope.load())
                        .then(function(){
                            if (!$.isArray($scope.document)){
                                if ($scope.document.measureAmendedBy) {

                                    var measureAmendedBy = _.map($scope.document.measureAmendedBy, function(item) {
                                        return $http.get('/api/v2013/documents/' + item.identifier_s);
                                    })
                                    $q.all(measureAmendedBy)
                                      .then(function(data) {
                                          _.each(data, function(measure){
                                            var measureId;
                                            measureId = _.findWhere($scope.document.measureAmendedBy, {'identifier_s': measure.data.header.identifier});
                                            if(measureId){
                                                measureId.measure = measure.data;
                                            }
                                         });
                                         return;
                                      })
                                      .then(function() {
                                            addMeasureToElements($scope.document);
                                            buildTree();
                                            updateProperties($scope.rootTerms, 1);
                                      });
                                } else {
                                        buildTree();
                                        updateProperties($scope.rootTerms, 1);
                                }
                            }
                            else if ($.isArray($scope.document)){

                                _.each($scope.document, function(measure){

                                    //var

                                    addMeasureToElements(measure.document ? measure.document : measure);
                                });
                                buildTree();
                                updateProperties($scope.rootTerms, 1);
                                // console.log($scope.terms, $scope.rootTerms,existing);
                            }
                        });
                    }
                };

                function buildTree() {

                    if (($scope.layout || "tree") == "tree") //Default layout
                        $scope.rootTerms = thesaurus.buildTree($scope.terms);
                    else
                        $scope.rootTerms = Enumerable.from($scope.terms).Select("o=>{identifier : o.identifier, name : o.name, title : o.title, description : o.description}").ToArray();
                  // console.log($scope.rootTerms)
                }
                //==============================
                //
                //==============================
                $scope.setError = function(error) {
                    if (!error) {
                        $scope.error = null;
                        return;
                    }

                    if (error.status == 404) $scope.error = "Terms not found";
                    else $scope.error = error.data || "unkown error";
                }

                function addMeasureToElements(measure) {
                    if(!measure)
                        return;
                    if($scope.type!='single'){
                        _.each(measure.absMeasures, function(measureElement) {
                            newMeasureElement(measureElement, measure);
                        });
                    }
                    if($scope.type=='single'){
                        _.each(measure.measureAmendedBy, function(measureElement) {
                            if(measureElement.measure)
                                _.each(measureElement.measure.absMeasures, function(element) {
                                    newMeasureElement(element, measureElement.measure, 'amended', measure.header.identifier);
                                });

                        });
                        // _.each(measure.linkedMeasures, function(measureElement) {
                        //     if(measureElement.measure)
                        //         _.each(measureElement.measure.absMeasures, function(element) {
                        //             newMeasureElement(element, measureElement.measure, 'linked', measure.header.identifier);
                        //         });
                        //
                        // });
                        // _.each(measure.amendedMeasures, function(measureElement) {
                        //     if(measureElement.measure)
                        //         _.each(measureElement.measure.absMeasures, function(element) {
                        //             newMeasureElement(element, measureElement.measure, 'amended', measure.header.identifier);
                        //         });
                        // });
                    }
                }
                var existing = [];
                function newMeasureElement(measureElement, measure, type, parentMeasure){
                    var identifier = measureElement.identifier;

                    if(measureElement.parent)
                        identifier = measureElement.parent + '#' + identifier;

                    var element = _.findWhere($scope.terms, {'identifier': identifier});

                    if(!element)
                        return;

                    var measureElementExists = _.some(existing, function(term){
                            return (term.measureId == measure.header.identifier || term.measureId == parentMeasure) &&
                                    term.elementId == measureElement.identifier && (term.type=='linked' || term.type=='amended');
                        });
                    // //measure is already added for the element ignore.
                    if(measureElementExists)
                        return;
                    if($scope.type=='single' && (type=='linked' || type=='amended')){
                        var parentMeasureElementExists = _.find($scope.terms, function(term){
                                                       return term.measureIdentifier == parentMeasure && term.name == identifier;
                                                   });
                        if(parentMeasureElementExists)
                            element = parentMeasureElementExists;
                    }

                    if (element) {
                        var elementMeasure = {};
                        elementMeasure.identifier = guid();
                        elementMeasure.measureIdentifier = measure.header.identifier;
                        elementMeasure.name = element.identifier;
                        elementMeasure.title = measure.title;
                        elementMeasure.measureType = type;

                        elementMeasure.broaderTerms = [];
                        elementMeasure.broaderTerms.push(element.identifier);
                        if(!element.narrowerTerms)
                            element.narrowerTerms = [];
                        element.narrowerTerms.push(elementMeasure.identifier);

                        $scope.terms.push(elementMeasure);

                        $scope.identifiers[elementMeasure.identifier] = true;
                        if(measureElement.section)
                            $scope.sections[elementMeasure.identifier] = measureElement.section||{};

                        existing.push({measureId:measure.header.identifier, elementId:element.identifier, type:type});
                    }
                }

                function updateProperties(terms, level) {

                    _.each(terms, function(term) {

                        var element = _.findWhere($scope.terms, {
                            identifier: term.identifier
                        });
                        term.level = level;

                        if (element.measureIdentifier) {
                            term.sortOrder = 'A';
                            term.isMeasure = true;
                            term.measure = {};
                            var doc;
                            var amendedForTitle;
                            if($scope.type=='multiple'){
                                doc = _.find($scope.document , function(measure){return measure.document.header.identifier==element.measureIdentifier;});
                                if(doc.document.amendedMeasures){
                                    amendedForTitle='';
                                    _.each(doc.document.amendedMeasures, function(msr){
                                        var amendedFor = _.find($scope.document , function(measure){return measure.document.header.identifier== msr.identifier;});
                                        amendedForTitle += amendedFor.title_t;
                                    });
                                }
                            }
                            else{
                                doc ={document: $scope.document};
                            }

                            term.measure = {identifier: doc.document.header.identifier,government : doc.document.government,
                                            documentID:commonjs.hexToInteger(doc.id),type: doc.document.header.schema, amendedFor:amendedForTitle};
                           term.measureType = element.measureType;

                            _.map(term.broaderTerms, function(brTerm) {
                                brTerm.hasMeasure = true;
                            });
                        }
                        else {
                            term.sortOrder = 'B';
                        }

                        if (term.narrowerTerms) {
                            term.isChildSelected = updateProperties(term.narrowerTerms, level + 1);
                        }
                        if(!term.isChildSelected) {
                            if($scope.sections[term.identifier])
                                term.isChildSelected = true;
                        }
                        if(term.isChildSelected){
                            _.map(term.broaderTerms, function(brTerm) {
                                brTerm.isChildSelected = true;
                            });
                        }

                    });
                    return _.some(terms, function(term){
                        return $scope.sections[term.identifier] || term.isChildSelected;
                    });
                }

                $scope.showHideNode = function(elementId){
                    $element.find('#'+elementId).toggle();
                };

                $scope.showHideAll = function(collapse){
                    _.each($scope.rootTerms, function(term){
                        term.showUp = collapse;
                        if(collapse)
                            $element.find('#'+term.identifier).hide();
                        else
                            $element.find('#'+term.identifier).show();
                    })
                };

                function getJurisdictionSortIndex(term){

                    switch (term) {
                        case '528B1187-F1BD-4479-9FB3-ADBD9076D361':
                            return 1;
                        case '7437F880-7B12-4F26-AA91-CED37250DD0A':
                            return 2;
                        case 'DEBB019D-8647-40EC-8AE5-10CA88572F6E':
                            return 3;
                        case '9627DF2B-FFAC-4F85-B075-AF783FF2A0B5':
                            return 4;
                        default:
                            return 5

                    }
                }

                function getDocumentTypeSortIndex(term){

                    switch (term) {
                        case '8165BF22-EEF0-4DF8-B3F2-8E0AEED13E2F':
                            return 1;
                        case '383BDFAC-7AD0-4A22-840D-086CC836EEF8':
                            return 2;
                        case '679A7709-05AF-4B03-8532-ABB425021D93':
                            return 3;
                        case '14CE4B07-ABF7-41C3-884A-5982C22690E0':
                            return 4;
                        case '6DD06795-ADF2-468E-A6C1-01399E5FF934':
                            return 5;
                        case '':
                            return 6;
                        case 'BF41B8A3-D653-4E1D-8C69-A5FE352D9957':
                            return 7;
                        case '':
                            return 8;
                        default:
                            return 9

                    }

                }
            }]
        };
    });


});


// var amendedMeasures = _.map($scope.document.amendedMeasures, function(item) {
//     return $http.get('/api/v2013/documents/' + item.identifier);
// })
// var linkedMeasures = _.map($scope.document.linkedMeasures, function(item) {
//     return $http.get('/api/v2013/documents/' + item.identifier)
// })
// $q.all(amendedMeasures)
//   .then(function(data) {
//       _.each(data, function(measure){
//         var measureId;
//         measureId = _.findWhere($scope.document.amendedMeasures, {'identifier': measure.data.header.identifier});
//         if(measureId){
//             measureId.measure = measure.data;
//         }
//      });
//      return;
//   })
//   .then(function() {
//         return $q.all(linkedMeasures)
//            .then(function(data) {
//                 _.each(data, function(measure){
//                     var measureId;
//                     measureId = _.findWhere($scope.document.linkedMeasures, {'identifier': measure.data.header.identifier});
//                     if(measureId){
//                         measureId.measure = measure.data;
//                     }
//                 });
//                 return;
//             });
//   })
