define(['app','text!views/directives/document-metadata-directive.html', 'js/common'
    ], function (app, template) {
	app.directive('documentMetadata', function($http){
		return{
			restrict: 'EAC',
			replace:true,
			template: template,
            controller: ['$scope', '$filter','commonjs','$element', '$compile', '$timeout', '$route',
                function($scope, $filter, commonjs, $element, $compile, $timeout, $route){

				$scope.getUniqueID = function(document){
					if(!document)
						return;
                    var uid
					// if(!document.id)
					// 	uid = $filter("uniqueIDWithoutRevision")(document.info);
					// else
					uid = $filter("uniqueID")(document);

                    if(!uid)
                     return "[new draft]";

                    return uid;
				}

                $scope.getUniqueIDForUrl = function(document){
                    if(!document)
						return;
                    var uid

                    if(!document.id)
						uid = $filter("uniqueIDWithoutRevision")(document);
					else
					    uid = $filter("uniqueID")(document);

                    if(document.revision || document.info && document.info.revision){
                        var revision = (document.revision || document.info.revision);
                        //temporary till revision data is migrated
                        var tempUId = $filter("uniqueID")(document);
                        if(tempUId == uid+'-'+revision)
                            return uid

                        return  uid + '/' + revision;
                    }

                    return  uid;
                }

				$scope.loadReportRecord = function(schema, identifier){

                    require(['views/directives/report-record'], function() {

                        var directiveHtml = "<div report-record uid='"+ identifier + "' schema='" +  schema + "'></div>";

                        $scope.$apply(function() {
                            $element.find('#divReportRecord')
                                .empty()
                                .append($compile(directiveHtml)($scope));
                        });
                    });
                }
                
                $scope.print = function(){
                    $scope.printing = true;
                    require(['printThis', 'text!views/forms/view/print-header.html', 'text!views/forms/view/print-footer.html',
                            'css!/app/css/print-friendly'], function(printObj, header, footer){						
                        $element.parent().parent().parent().find('#schemaView').printThis({
                            debug:false,
                            printContainer:true,
                            importCSS:true,
                            importStyle : true,
                            pageTitle : $route.current.params.documentID+$('title').text(),
                            loadCSS : 'css/print-friendly.css',
                            header : header,
                            footer : footer
                        });	
                        $timeout(function(){$scope.printing = false;},100);
                    });
                    
                }
			}]
		};

	});
});
