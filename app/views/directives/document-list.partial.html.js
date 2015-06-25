define(['app', 'ngMaterial', 'ngAria', 'angular-animate',
    './document-metadata-directive.html.js',
    '/app/js/common.js',
    '/app/views/directives/infinite-scroll-directive.js'
], function(app) {

    app.directive('documentList', function($http, $filter) {
        return {
            restrict: 'EAC',
            templateUrl: '/app/views/directives/document-list.partial.html',
            replace: true,
            scope: {
                documents: '=',
                filter: '@',
                advanceFilter: '=',
                showPagination: '@',
                currentPage: '=',
                documentCount: '=',
                orderBy: '=',
                previewType: '='
            },
            controller: ['$scope', '$sce', "underscore", "commonjs", "authentication", '$q', "$filter", "$compile", "$element", "$timeout", 'schemaTypes',
                function($scope, $sce, _, commonjs, authentication, $q, $filter, $compile, $element, $timeout, schemaTypes) {

                    $scope.schemaTypes = schemaTypes;
                    $scope.schemaTypes.push('focalPoint');
                    $scope.loading = true;

                    $scope.getDocumentId = function(document) {

                        if ((document.recordtype == "referenceRecord" && document.schema != "resource") || document.schema.toLowerCase() == "focalpoint") {
                            return commonjs.hexToInteger(document.id || document.identifier_s);
                        } else {
                            //console.log(document)
                            return $filter("uniqueIDWithoutRevision")(document.doc);
                        }
                    }

                    //   $scope.formatDate = function formatDate(date) {
                    //     return moment(date).format('MMMM Do YYYY');
                    //   };
                    //console.log($scope.advanceFilter) ;
                    if ($scope.advanceFilter && $scope.advanceFilter.$ == null) {
                        $scope.advanceFilter.$ = '';
                        // console.log($scope.advanceFilter) ;
                    }

                    $scope.loaded = false;
                    $scope.itemsPerPage = 25;
                    $scope.pageCount = 0;
                    $scope.currentPage = 0;
                    $scope.transformedDocuments = [];
                    $scope.descriptionLimit = 50;

                    $scope.load = function(item, displayDetails) {

                        //occours when a user actions collapses the detail section.
                        if (!displayDetails)
                            return;
                        if (item.data)
                            return;
                        if (!item.schema && item.schema_s)
                            item.schema = item.schema_s;
                        item.data = {
                            'schema': item.schema || item.schema_s,
                            'url_ss': item.url_ss,
                            //'data': item
                        };
                        //console.log(item.schema);
                        if (item.schema && (item.schema.toUpperCase() == "FOCALPOINT" ||
                                item.schema.toUpperCase() == "MEETING" ||
                                item.schema.toUpperCase() == "NOTIFICATION" || item.schema.toUpperCase() == "PRESSRELEASE" || item.schema.toUpperCase() == "STATEMENT" || item.schema.toUpperCase() == "NEWS")) {
                            commonjs.getReferenceRecordIndex(item.schema.toUpperCase(), item.id).then(function(data) {
                                item.data = data.data;
                            });
                        } else {
                            //   $http.get("/api/v2013/documents/" + item.identifier_s).then(function(result) {
                            //     item.data = result.data;
                            //
                            $http.get("/api/v2013/documents/" + item.identifier_s + "?info").then(function(result) {
                                item.data = angular.copy(result.data.body);
                                item.data.info = result.data;
                                delete item.data.info.body;
                            });
                            //
                            //   });
                        }
                    }

                    $scope.filterCategory = function(item) {
                        //console.log($scope.filter);
                        if ($scope.filter && ($scope.filter == '*' || item.schema.toUpperCase() == $scope.filter.toUpperCase()))
                            return true;

                        return false;


                    }

                    $scope.actionSetPage = function(pageNumber) {
                        //debugger;
                        $scope.currentPage = Math.min($scope.pageCount - 1, Math.max(0, pageNumber));
                    };

                    $scope.range = function(start, end) {

                        var ret = [];
                        if (!end) {
                            end = start;
                            start = 0;
                        }

                        var maxCount = 10;
                        var middle = 5;
                        var count = end - start;

                        if (count > maxCount) {
                            if ($scope.currentPage > middle)
                                start = $scope.currentPage - middle;

                            end = Math.min(count, start + maxCount);
                            start = Math.max(0, end - maxCount);
                        }

                        for (var i = start; i < end; i++) {
                            ret.push(i);
                        }
                        return ret;
                    };

                    $scope.$watch('currentPage', function(newValue, oldValue) {
                        if (newValue != oldValue) {
                            //console.log('current page changed');
                            $scope.currentPage = newValue;
                        }
                    });

                    var countryList;
                    $scope.$watch('documents', function(newValue, oldValue) {

                        // if (!newValue && oldValue) {
                        //     $scope.transformedGroupDocuments = [];
                        // }
                        if (newValue && newValue != oldValue) {
                            $scope.pageCount = Math.ceil($scope.documentCount / $scope.itemsPerPage);
                            $scope.transformedDocuments = [];

                            if ($scope.previewType == 'list') {
                                $scope.documents.forEach(function(doc) {
                                    $scope.transformedDocuments.push(transformDocument(doc));
                                });
                                $scope.loading = false;

                            } else if ($scope.previewType == 'group') {

                                if(!$scope.transformedGroupDocuments || $scope.currentPage == 0)
                                    $scope.transformedGroupDocuments = [];

                                getCountries()
                                    .then(function(countries) {

                                        $scope.documents.forEach(function(doc) {

                                            var existingDocument = _.find($scope.transformedGroupDocuments, {code: doc.groupValue == 'eur' ? 'EU' : doc.groupValue.toUpperCase()});
                                            if(existingDocument)
                                                return;

                                            if(doc.newRecord){

                                                var country = _.clone(_.find(countries, {
                                                                        code: doc.groupValue == 'eur' ? 'EU' : doc.groupValue.toUpperCase()
                                                                    }));

                                                country.schemaList = {};
                                                if (doc.doclist.docs.length > 0) {
                                                    //addSchema(country);
                                                    _.each(doc.doclist.docs, function(document) {


                                                        if (!country.schemaList[document.schema_s]){
                                                            // country.schemaList[document.schema_s] = {};
                                                            // country.schemaList[document.schema_s].orderKey = getSortOrderKey(document.schema_s);
                                                            country.schemaList[document.schema_s]  = [];
                                                        }
                                                        country.schemaList[document.schema_s].push({
                                                            id          :   document.id,
                                                            identifier_s:   document.identifier_s,
                                                            title       :   document.title_t,
                                                            schema      :   document.schema_s,
                                                            type        :   document.type_ss,
                                                            government  :   {identifier:country.code}
                                                        });
                                                    });
                                                    //removeEmptySchema(country);
                                                    // var sorted =  _.sortBy(country.schemaList, function (a, b) {
                                                    //                                     	      return (a['orderKey'] > b['orderKey'] ? 1 : -1);
                                                    //                                     	    });
                                                    // country.schemaList = sorted;
                                                }
                                                $scope.transformedGroupDocuments.push(country);
                                            }
                                        });
                                        $scope.loading = false;
                                        console.log($scope.transformedGroupDocuments);
                                    });
                            }
                        }
                    });
                    function removeEmptySchema(country){
                        _.each(country.schemaList, function(schema){
                            if(schema.length==0)
                                schema = undefined;
                        })
                    }
                    function addSchema(country){
                        //country.schemaList
                        country.schemaList['focalPoint'] = [];
                        country.schemaList['authority'] = [];
                        country.schemaList['measure'] = [];
                        country.schemaList['absPermit'] = [];
                        country.schemaList['absCheckpoint'] = [];
                        country.schemaList['absCheckpointCommunique'] = [];
                    }

                    function getSortOrderKey(schema){
                            switch (schema) {
                                case 'focalPoint':
                                    return 1;
                                case 'authority':
                                    return 2;
                                case 'measure':
                                    return 3;
                                case 'absPermit':
                                    return 4;
                                case 'absCheckpoint':
                                    return 5;
                                case 'absCheckpointCommunique':
                                    return 6;
                                default : 10;

                            }
                    }

                    function getCountries() {

                        if (!countryList)
                            return commonjs.getCountries();

                        var promise = $q.defer();
                        promise.resolve(countriesList);

                        return promise;
                    }

                    function transformDocument(document) {

                        var output = {};
                        var locale = "en"; //$scope.$root.locale;

                        var formatDate = function formatDate(date) {
                            return date + ''; //moment(date).format('MMMM Do YYYY');
                        };
                        output.id = document.id;
                        output.schema = document.schema_s.toLowerCase();
                        output.schemaForEdit = document.schema_s;
                        output.title = document.title_t;
                        output.description = document.description_t;
                        output.source = document.government_EN_t;
                        output.url_ss = document.url_ss;
                        output.identifier_s = document.identifier_s;
                        output.doc = document;
                        output.createdDateOn = document.createdDate_dt;
                        output.metadata = [];
                        output.amendmentIntent = 'none';

                        if (!document.identifier_s) {
                            output.identifier_s = output.id;
                        }

                        if (document.government_s) {
                            getCountries()
                            .then(function(countries) {
                                var cd = _.where(countries, {
                                    code: document.government_s.substring(0, 2).toUpperCase()
                                })
                                if (cd.length > 0) {
                                    output.isNPParty = cd[0].isNPParty;
                                    output.isSignatory = cd[0].isSignatory;
                                    output.isRatified = cd[0].isRatified;
                                    output.isInbetweenParty = cd[0].isInbetweenParty;
                                    output.entryIntoForce = cd[0].entryIntoForce;
                                }
                            });
                        }

                        output.recordtype = "referenceRecord";

                        if (document.schema_s == 'focalPoint') {
                            output.description = document.function_t || '';
                            output.description += (document.function_t && document.department_t) ? ', ' : '';
                            output.description += document.department_t || '';
                            output.description += (output.description && document.organization_t) ? ', ' : '';
                            output.description += document.organization_t || '';
                        }

                        if (document.schema_s == 'decision' && document.body_s == 'XXVII8-COP') output.source = 'COP TO THE CONVENTION';
                        if (document.schema_s == 'decision' && document.body_s == 'XXVII8b-MOP') output.source = 'COP-MOP TO THE CARTAGENA PROTOCOL ON BIOSAFETY';
                        if (document.schema_s == 'decision') output.title = 'Decision ' + document.code_s;
                        if (document.schema_s == 'decision') output.description = document.title_t;

                        if (document.schema_s == 'recommendation' && document.body_s == 'XXVII8-SBSTTA') {
                            output.source = 'SBSTTA';
                            output.sourceTooltip = 'Subsidiary Body on Scientific, Technical and Technological Advice';
                        }
                        if (document.schema_s == 'recommendation' && document.body_s == 'XXVII8-WGRI') {
                            output.source = 'WGRI';
                            output.sourceTooltip = 'Working Group on the Review of Implementation';
                        }
                        if (document.schema_s == 'recommendation' && document.body_s == 'XXVII8b-ICCP') {
                            output.source = 'ICCP';
                            output.sourceTooltip = 'Intergovernmental Committee for the Cartagena Protocol on Biosafety';
                        }
                        if (document.schema_s == 'recommendation' && document.body_s == 'XXVII8c-ICNP') {
                            output.source = 'ICNP';
                            output.sourceTooltip = 'Intergovernmental Committee for the Nagoya Protocol on ABS';
                        }
                        if (document.schema_s == 'recommendation') output.title = 'Recommendation ' + document.code_s;
                        if (document.schema_s == 'recommendation') output.description = document.title_t;

                        if (document.schema_s == 'meetingDocument') output.source = document.meeting_s;
                        if (document.schema_s == 'meetingDocument') output.title = document.symbol_s;
                        if (document.schema_s == 'meetingDocument') output.description = document.title_t;
                        if (document.schema_s == 'meetingDocument' && document.group_s == 'INF') output.source += ' - INFORMATION';
                        if (document.schema_s == 'meetingDocument' && document.group_s == 'OFC') output.source += ' - PRE-SESSION';

                        if (document.schema_s == 'nationalReport') output.description = document.summary_EN_t;
                        if (document.schema_s == 'nationalReport') output.type = document.reportType_EN_t;

                        if (document.schema_s == 'implementationActivity') output.type = document.jurisdiction_EN_t + ' - ' + document.completion_EN_t;

                        if (document.schema_s == 'marineEbsa') output.schema = 'ECOLOGICALLY OR BIOLOGICALLY SIGNIFICANT AREA';

                        if (document.schema_s == 'event') {
                            output.dates = formatDate(document.startDate_s) + ' to ' + formatDate(document.endDate_s);
                            output.venue = document.eventCity_EN_t + ', ' + document.eventCountry_EN_t;
                        }

                        if (document.schema_s == 'resource') {
                            output.Year = document.publicationYear_is;
                            output.Types = getString(document.resourceTypes_CEN_ss, locale);
                            output.Regions = getString(document.regions_CEN_ss, locale);

                            if (document.resourceLinksLanguage_ss) {
                                output.Languages = [];
                                document.resourceLinksLanguage_ss.forEach(function(language) {
                                    output.Languages.push(language)
                                });
                            }

                            output.recordtype = "referenceRecord";
                            // TODO: add summary as output.description and limit to 200 chars

                            if (output.Types) output.metadata.push(output.Types);
                            if (output.Year) output.metadata.push(output.Year);
                            if (output.Regions) output.metadata.push(output.Regions);
                            //if(output.Languages)output.metadata.push({"metadata":output.Languages,"filter":"term"});


                        } else if (document.schema_s == 'authority') {
                            output.responsibleForAll = document.absResposibleForAll_b;
                            output.jurisdiction = document.absJurisdiction_EN_t;
                            //output.cnaScope = document.thematicAreas_CEN_ss;


                            if (document.thematicAreas_CEN_ss) {
                                output.thematicAreas_CEN_ss = document.thematicAreas_CEN_ss;
                                output.cnaScope = "";
                                output.thematicAreas_CEN_ss.forEach(function(item) {
                                    output.cnaScope += (output.cnaScope.length > 0 ? ", " : "") + JSON.parse(item).en;
                                });
                            }

                            output.recordtype = "nationalRecord";

                            if (output.responsibleForAll) {
                                output.description = "This CNA is responsible for all functions under the Nagoya Protocol.";
                            } else {
                                output.description = document.description_t;
                                if (output.jurisdiction)
                                    output.metadata.push(output.jurisdiction);
                                if (output.cnaScope)
                                    output.metadata.push(output.cnaScope);
                            }

                        } else if (document.schema_s == 'absCheckpoint') {
                            output.jusrisdiction = document.jurisdiction_EN_t;
                            output.informAllAuthorities = (document.informAllAuthorities_b);
                            output.recordtype = "nationalRecord";

                            if (output.jusrisdiction) output.metadata.push(output.jusrisdiction);

                            //TODO: output.description should be the summary of responsibilities
                        } else if (document.schema_s == 'absPermit') {

                            if (document.usage_CEN_ss) {
                                output.usage = '';
                                document.usage_CEN_ss.forEach(function(usage) {
                                    output.usage += (output.usage.length > 0 ? ", " : "") + JSON.parse(usage).en;
                                });
                            }
                            // console.log(output.usage);
                            output.keywords = getString(document.keywords_CEN_ss, locale);
                            output.recordtype = "nationalRecord";
                            //
                            if (document.amendmentIntent_i != undefined) {
                                output.amendmentIntent = String(document.amendmentIntent_i) + 's';

                            }
                            if (output.amendmentIntent == "1s") output.metadata.push($sce.trustAsHtml("<span style='color:red'>REVOKED</span>"));
                            if (output.amendmentIntent == "0s") output.metadata.push("AMENDED");
                            //TODO: output.description should be the subjectmatter
                            //TODO: keywords should show up in the metadata. if(output.keywords)output.metadata.push(output.keywords);
                            //TODO: the metadata should be a link to download the pdf
                            if (output.usage) output.metadata.push(output.usage);

                        } else if (document.schema_s == 'absCheckpointCommunique') {
                            output.recordtype = "nationalRecord";
                            output.originCountries = (document.originCountries_CEN_ss);
                            // output.title = "Checkpoint communiqué - "+ moment(document.createdDate_dt).format('MM/DD/YYYY hh:mm') ;

                            //TODO: output.description should be the summary of utilization
                            //TODO: the metadata should include a link to download the pdf

                        } else if (document.schema_s == 'database') {
                            output.recordtype = "nationalRecord";
                            output.description = document.description_t;
                            output.metadata.push(document.website);
                            //TODO: output.description should be the description
                            //TODO: metadata should be the url opening to a new window
                        } else if (document.schema_s == 'measure') {
                            if (document.adoption_dt)
                                output.metadata.push('Adopted on ' + $filter('formatDate')(document.adoption_dt));
                            output.adoption = document.adoption_dt;
                            output.recordtype = "nationalRecord";

                            output.jusrisdiction = document.jurisdiction_EN_t;

                            if (output.jusrisdiction)
                                output.metadata.push(output.jusrisdiction);

                            if (document.type_EN_t) {
                                output.type = document.type_EN_t;
                                if (output.type) output.metadata.push(output.type);
                            }

                            if (document.status_EN_t) {
                                output.status = document.status_EN_t;
                                if (output.status) output.metadata.push(output.status);
                            }
                        } else if (document.schema_s == 'focalPoint' || document.schema_s == 'database') {
                            output.recordtype = "nationalRecord";
                            output.typeList = document.type_ss;
                            if (document.type_EN_t) {
                                output.type = document.type_EN_t;
                                if (output.type) output.metadata.push(output.type);
                            }

                            if (document.status_EN_t) {
                                output.status = document.status_EN_t;
                                if (output.status) output.metadata.push(output.status);
                            }
                        } else if (document.schema_s == 'meeting') {
                            output.createdDateOn = document.startDate_s;
                            output.recordtype = "referenceRecord";
                            output.eventCity = document.eventCity_EN_t;
                            output.eventCountry = document.eventCountry_EN_t;
                            output.description = document.eventCity_EN_t + ' from ' + moment(document.startDate_dt).format('Do MMM YYYY') + ' to ' + moment(document.endDate_dt).format('Do MMM YYYY');

                        }
                        $q.when(canUserEdit(document), function(canedit) {
                            output.canEdit = canedit;
                        });

                        return output;
                    }

                    function getString(source, key) {
                        var lstring = [];
                        if (source != undefined) {
                            source.forEach(function(record) {
                                lstring.push(JSON.parse(record)[key]);
                            });
                            return lstring.toString();
                        }
                    }

                    $scope.getNFPText = commonjs.getNFPText;
                    //==================================
                    //
                    //==================================
                    $scope.user = null;
                    $scope.orderByField = 'createdDate_dt';
                    $scope.reverse = true;
                    $scope.$watch('orderByField', function(newVal, oldVal) {

                        if (oldVal && newVal)
                            $scope.orderBy = newVal + ($scope.reverse ? ' desc' : '  asc')
                    });

                    $scope.$watch('reverse', function(newVal, oldVal) {
                        if (oldVal != undefined)
                            $scope.orderBy = $scope.orderByField + (newVal ? ' desc' : '  asc')
                    });

                    $scope.updateScrollPage = function() {
                        console.log($scope.currentPage);
                        $scope.loading = true;
                        // if (!$scope.currentPage)
                        //     $scope.currentPage = 1;
                        // else
                            $scope.currentPage = $scope.currentPage + 1;
                    }

                    function canUserEdit(document) {

                        if (!$scope.user) {
                            $scope.user = authentication.getUser();
                        }
                        return $q.when($scope.user, function(user) {
                            $scope.user = user;

                            if (!user.isAuthenticated)
                                return false;

                            if (!document)
                                return false;

                            return user.government == document.government_s && (document.schema_s == 'absPermit' ||
                                document.schema_s == 'absCheckpoint' ||
                                document.schema_s == 'absCheckpointCommunique' ||
                                document.schema_s == 'authority' ||
                                document.schema_s == 'measure' ||
                                document.schema_s == 'database' ||
                                document.schema_s == 'resource');
                        });
                    }


                    //           var originalLeave = $.fn.popover.Constructor.prototype.leave;
                    //           $.fn.popover.Constructor.prototype.leave = function(obj) {
                    //             var self = obj instanceof this.constructor ?
                    //               obj : $(obj.currentTarget)[this.type](this.getDelegateOptions()).data('bs.' + this.type)
                    //             var container, timeout;
                    //
                    //             originalLeave.call(this, obj);
                    //
                    //             if (obj.currentTarget) {
                    //               container = $(obj.currentTarget).siblings('.popover')
                    //               timeout = self.timeout;
                    //               container.one('mouseenter', function() {
                    //                 //We entered the actual popover – call off the dogs
                    //                 clearTimeout(timeout);
                    //                 //Let's monitor popover content instead
                    //                 container.one('mouseleave', function() {
                    //                   $.fn.popover.Constructor.prototype.leave.call(self, self);
                    //                 });
                    //               })
                    //             }
                    //           };
                    //
                    //           $scope.addFilter = function(type, value, operation) {
                    //             $scope.$emit('externalFilter', {
                    //               'operation': operation,
                    //               'type': type,
                    //               'value': value
                    //             });
                    //           }
                    //
                    //           $scope.popOverHTML = function(type, value) {
                    //             var addFilter = "<span ng-click=\"addFilter('" + type + "','" + value + "','add');\"><i class='fa fa-plus' /> Add filter</span>";
                    //             var removeFilter = "<span ng-click=\"addFilter('" + type + "','" + value + "','remove');\"><i class='fa fa-remove' /> remove filter</span>";
                    //
                    //             return "<div class=\"blaisePopOver\">" + (hasFilter(type, value) ? removeFilter : addFilter) + "</div>";
                    //           }
                    //
                    //           function hasFilter(type, value) {
                    //
                    //             if (type == "country") {
                    //
                    //               if (underscore.indexOf($scope.$parent.countryResultFilter, value) >= 0)
                    //                 return true;
                    //
                    //               return false;
                    //             }
                    //             return false;
                    //           }
                    //
                    //           $element.popover({
                    //             content: function(data) {
                    //               // console.log($(this).attr('type'), $(this).attr('data-value'));
                    //               var currentObj = $(this);
                    //               $timeout(function() {
                    //                 $compile($('.blaisePopOver').contents())($scope);
                    //               });
                    //               return $scope.popOverHTML($(this).attr('type'), $(this).attr('data-value'));
                    //             },
                    //             selector: '[data-popover]',
                    //             trigger: 'click hover',
                    //             placement: 'auto',
                    //             delay: {
                    //               show: 50,
                    //               hide: 400
                    //             }
                    //           })
                    //             .on('shown.bs.popover', function(evt, data) {
                    //               console.log(evt, data);
                    //               // $compile($('.blaisePopOver').contents())($scope);
                    //             });
                    //
                    //             var parentContainerId = ".textDescription"
                    //
                    //              if(!window.CurrentSelection){
                    //               CurrentSelection = {}
                    //              }
                    //
                    //              CurrentSelection.Selector = {}
                    //
                    //              //get the current selection
                    //              CurrentSelection.Selector.getSelected = function(){
                    //               var sel = '';
                    //               if(window.getSelection){
                    //                sel = window.getSelection()
                    //               }
                    //               else if(document.getSelection){
                    //                sel = document.getSelection()
                    //               }
                    //               else if(document.selection){
                    //                sel = document.selection.createRange()
                    //               }
                    //               //console.log(sel);
                    //               return sel
                    //              }
                    //              //function to be called on mouseup
                    //              CurrentSelection.Selector.mouseup = function(){
                    //
                    //               var st = CurrentSelection.Selector.getSelected()
                    //               if(document.selection && !window.getSelection){
                    //                 var range = st;
                    //                 range.pasteHTML("<span class=\"selectedText\">Blaise Fonseca" + range.htmlText + "</span>");
                    //               }
                    //               else{
                    //                   if(st.type=='None')
                    //                   return;
                    //                 var range = st.getRangeAt(0)
                    //                 var newNode = document.createElement("span");
                    //                 newNode.setAttribute("class", "selectedText");
                    //                 range.surroundContents(newNode);
                    //                 //
                    //                 var getTitle = newNode.innerHTML;
                    //                 newNode.setAttribute("title", getTitle);
                    //
                    //                 //
                    //                 var popDiv = document.createElement('span');
                    //                 popDiv.setAttribute('class', 'popDiv');
                    //                 popDiv.setAttribute("title", getTitle);
                    //                 popDiv.innerHTML = getTitle;
                    //                 popDiv.innerHTML += '</br><button type="button" id=\'btn\' class="btn btn-primary" >Filter</button>';
                    // // console.log($('#selectedTextDiv'));
                    //                 if(newNode.innerHTML.length > 0) {
                    //                  newNode.appendChild(popDiv);
                    //                  $compile($('#btn').contents())($scope);
                    //                  $('#btn').on('click', function(e){
                    //                      e.stopPropagation();
                    //                      $scope.add($(this));
                    //                  })
                    //                 }
                    //                 //Remove Selection: To avoid extra text selection in IE
                    //                 if (window.getSelection) {
                    //                   window.getSelection().removeAllRanges();
                    //                 }
                    //                 else if (document.selection){
                    //                  document.selection.empty();
                    //                 }
                    //                     //
                    //               }
                    //              }
                    //              $scope.add = function(e){
                    //                  $scope.addFilter('keyword',e.parent().attr('title'),'add')
                    //                  $('span.selectedText').contents().unwrap();
                    //                  $('body').find('span.popDiv').remove();
                    //              }
                    //             function addTooltipEvents() {
                    //                 $timeout(function(){
                    //                     $('body').on('mousedown', function(e, data){
                    //
                    //                         if(e.target.innerText=='Filter')
                    //                             return;
                    //
                    //                       $('span.selectedText').contents().unwrap();
                    //                       $(this).find('span.popDiv').remove();
                    //                     });
                    //                     $(parentContainerId).bind("mouseup",CurrentSelection.Selector.mouseup);
                    //                 },100);
                    //              }




                }
            ]

        };
    });
});
