define(['text!./questions-selector.html', 'app', 'lodash', 'require', '../selectors/terms-dialog', '../intermediate', 
'scbd-angularjs-services/locale', 'js/common'], 
function(templateHtml, app, _, require) {

    var baseUrl = require.toUrl('').replace(/\?v=.*$/,'');

    var DefaultRegions = [
        "D50FE62D-8A5E-4407-83F8-AFCAAF708EA4", // CBD Regional Groups - Africa
        "5E5B7AA4-2420-4147-825B-0820F7EC5A4B", // CBD Regional Groups - Asia and the Pacific
        "942E40CA-4C23-4D3A-A0B4-736CD0EFCD54", // CBD Regional Groups - Central and Eastern Europe
        "3D0CCC9A-A0A1-4399-8FA2-41D4D649DB0E", // CBD Regional Groups - Latin America and the Caribbean
        "0EC2E5AE-25F3-4D3A-B71F-8019BB62ED4B"  // CBD Regional Groups - Western Europe and Others
    ];

    //==============================================
    //
    //
    //==============================================
    app.directive('nationalReportQuestionsSelector', ['$http', 'locale', 'commonjs', '$q', function($http, locale, commonjs, $q) {
        return {
            restrict : 'E',
            replace : true,
            template : templateHtml,
            scope :  {
                selectedReportType : '=reportType',
                selectedQuestions : '=questions',
                selectedRegions : '=regions',
                selectedRegionsPreset : '=regionsPreset',
                selectedRegionsPresetFilter : '=regionsPresetFilter'
            },
            link: function ($scope) {

                $scope.selectedReportType = $scope.selectedReportType || 'npInterimNationalReport1';
                $scope.selectedRegions    = $scope.selectedRegions    || DefaultRegions.concat();
                $scope.allSelected = true;
                $scope.regionsMap = {};

                getRegions();
                getCountries();
                mapNPParties();
                ///////////////////////////////////////
                // REPORT TYPE
                ///////////////////////////////////////

                //====================================
                //
                //
                //====================================
                $scope.reportTypeChanged = function() {

                    // Reset selection when user change reportType from UI

                    delete $scope.sections;
                    delete $scope.selectedQuestions;
                };

                //====================================
                //
                //
                //====================================
                $scope.$watch('selectedReportType', function (reportType) {

                    if(!reportType)
                        return;

                    require(['json!'+baseUrl+'app-data/report-analyzer/'+reportType+'.json'], function(res){

                        $scope.sections = res;

                        if($scope.selectedQuestions) {

                            setSelectedQuestions();

                        } else {

                            $scope.allSelected = true;
                            $scope.allSectionsClicked();

                        }
                    });
                });

                ///////////////////////////////////////
                // REGIONS
                ///////////////////////////////////////

                //====================================
                //
                //
                //====================================
                $scope.$watchCollection('selectedRegions', function() {
                    // console.log( $scope.selectedRegionsPreset)
                    if(_.includes(['npParties', 'npNonParties'], $scope.selectedRegionsPreset))
                        return;

                    $scope.selectedRegions = $scope.selectedRegions || DefaultRegions.concat();

                    var selection = $scope.selectedRegions;

                    var hasCountry = _.any(selection, function(id) { return id.length<=3; });
                    var cbdRegions = selection.length == DefaultRegions.length && _.intersection(selection, DefaultRegions).length == DefaultRegions.length;

                         if(hasCountry) $scope.selectedRegionsPreset = "countries";
                    else if(cbdRegions) $scope.selectedRegionsPreset = "cbdRegions";
                    else                $scope.selectedRegionsPreset = "regions";
                });

                //====================================
                //
                //
                //====================================
                $scope.removeRegions = function(id){

                    var index = $scope.selectedRegions.indexOf(id);

                    if(index>=0)
                        $scope.selectedRegions.splice(index,1);
                };

                //====================================
                //
                //
                //====================================
                $scope.regionsPresetChanged = function () {

                    var preset = $scope.selectedRegionsPreset;
                    $scope.selectedRegionsPresetFilter = [];
                    if(preset=="cbdRegions" || preset=="npParties" || preset=="npNonParties") { $scope.selectedRegions = DefaultRegions.concat(); }
                    if(preset=="countries")  { $scope.selectedRegions = []; $scope.showCountries = true; }
                    if(preset=="regions")    { $scope.selectedRegions = []; $scope.showRegions = true; }
                    if(preset=="npParties")  { 
                        _.each(_.sortBy(_.values($scope.npCountries), "title."+locale), function(country){
                            if(country.isNPParty)
                                $scope.selectedRegionsPresetFilter.push(country.code)
                        }); 
                    }
                    if(preset=="npNonParties")  { 
                        _.each(_.sortBy(_.values($scope.npCountries), "title."+locale), function(country){
                            if(!country.isNPParty)
                                $scope.selectedRegionsPresetFilter.push(country.code)
                        }); 
                    }
                    // console.log($scope.selectedRegions)
                };

                //====================================
                //
                //
                //====================================
                $scope.getCountries = getCountries;

                function getCountries() {

                    return $http.get("/api/v2013/thesaurus/domains/countries/terms", { cache : true }).then(function (res) {
                        res.data = _.map(res.data, fixEUR);
                        mapRegions(res.data);
                        return res.data;
                    });
                }

                //====================================
                //
                //
                //====================================
                $scope.getRegions = getRegions;

                function getRegions() {

                    return $http.get("/api/v2013/thesaurus/domains/regions/terms", { cache : true }).then(function (res) {
                        res.data = _.map(res.data, fixEUR);
                        mapRegions(res.data);
                        return res.data;
                    });
                }

                //====================================
                //
                //
                //====================================
                function fixEUR(term) {
                    if(term.identifier=="eu")
                        term.identifier = 'eur';
                    return term;
                }

                //====================================
                //
                //
                //====================================
                function mapRegions(terms) {

                    if(!$scope.regionsMap[terms[0].identifier]) {
                        terms.forEach(function(t){
                            $scope.regionsMap[t.identifier] = t;
                        });
                    }
                }

                //====================================
                //
                //
                //====================================
                function mapNPParties() {
                    
                   $q.when(commonjs.getCountries())
                   .then(function(data){
                       $scope.npCountries = [];
                       _.each(data, function(country){
                            $scope.npCountries[country.code.toLowerCase()] = {
                                title : country.name, isNPParty : country.isNPParty, code : country.code.toLowerCase()
                            }
                       });
                   })
                }

                ///////////////////////////////////////
                // SECTIONS & QUESTIONS
                ///////////////////////////////////////

                //====================================
                //
                //
                //====================================
                $scope.$watchCollection('selectedQuestions', setSelectedQuestions);

                function setSelectedQuestions() {

                    if(!$scope.sections)
                        return;

                    var sections = $scope.sections;
                    var selection = $scope.selectedQuestions || [];
                    var selectionMap = _(selection || []).reduce(function(ret, q) {
                        ret[q] = true;
                        return ret;
                    }, {});

                    var refreshState = false;

                    sections.forEach(function(section){

                        section.questions.forEach(function(question) {

                            refreshState = refreshState || question.selected !== selectionMap[question.key];

                            question.selected = !!selectionMap[question.key];

                        });
                    });

                    if(refreshState)
                        applyIntermediateState();
                }

                //====================================
                //
                //
                //====================================
                $scope.sectionClicked = function(section, applyIntermediate) {

                    section.questions.forEach(function(question){
                        question.selected = section.selected;
                    });

                    if(applyIntermediate || applyIntermediate===undefined)
                        applyIntermediateState();
                };

                //====================================
                //
                //
                //====================================
                $scope.allSectionsClicked = function() {

                    if(!$scope.sections)
                    return;

                    $scope.sections.forEach(function(section){
                        section.selected = $scope.allSelected;
                        $scope.sectionClicked(section, false);
                    });

                    applyIntermediateState();
                };

                //====================================
                //
                //
                //====================================
                $scope.questionClicked = applyIntermediateState;

                function applyIntermediateState() {

                    if(!$scope.sections)
                        return;

                    var on  = 0, off = 0, int = 0;

                    $scope.sections.forEach(function(section){
                        section.selected = getIntermediateState(section.questions);

                        if(section.selected===null ) ++int;
                        if(section.selected===true ) ++on;
                        if(section.selected===false) ++off;
                    });

                    if((on && off) || int) $scope.allSelected = null;
                    else                   $scope.allSelected = !!on;

                    $scope.selectedQuestions = [];

                    $scope.sections.forEach(function(section){
                        section.questions.forEach(function(question){
                            if(question.selected)
                            $scope.selectedQuestions.push(question.key);
                        });
                    });
                }

                //====================================
                //
                //
                //====================================
                function getIntermediateState(items) {

                    var on  = 0;
                    var off = 0;

                    items.forEach(function(e) {
                        if(e.selected) ++on;
                        else           ++off;
                    });

                    return (on && off) ? null : !!on;
                }
            }
        };
    }]);
});
