define(['app','underscore',
  '/app/js/common.js',
  '/app/views/countries/countries-left-menu-directive.html.js',
  '/app/views/countries/country-map-list-directive.html.js', '/app/views/directives/help-directive.html.js',
  './search-map.js','scbd-map/ammap3-service',
], function(app, _) {

  app.controller("CountriesMapController", ["$scope", "$http", "$filter", "commonjs", "$q",
    function($scope, $http, $filter, commonjs, $q) {

    }
  ]);

});
