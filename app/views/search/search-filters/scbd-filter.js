define(['app','text!views/search/search-filters/scbd-filter.html'
], function(app, template) {

    app.directive('scbdFilter', function() {
        return {
            restrict: 'EAC',
            replace: true,
            // transclude: true,
            require:'^searchDirective',
            template: template, 
            scope:false,
            link: function($scope, $element, $attrs, searchDirectiveCtrl) {
               $scope.sf_searchFilters = searchDirectiveCtrl.getSearchFilters('scbd');
            }//link
        };
    });
});
