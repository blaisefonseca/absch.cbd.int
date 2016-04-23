define(['text!./home-map.html',
  'app',
  'lodash',
  'scbd-map/ammap3',
  'scbd-map/ammap3-service',
  './party-status.js', '/app/services/search-service.js',
  '/app/views/countries/search-map.js'
], function(template, app, _, popoverTemplate) {
  'use strict';

  app.directive('homeMap', ['ammap3Service', function(ammap3Service) {
    return {
      restrict: 'E',
      template: template,
      replace: true,
      scope: {},
      require: 'homeMap',
      link: function($scope, $element, $attr, homeMapCrl) { // jshint ignore:line

        $scope.showTagLine = 1;
        $scope.showPartyTagLine = 1;
        $element.find('[data-toggle="tooltip"]').tooltip();
        
        //=======================================================================
        $scope.toggleTooltip = function(){
             $element.find('[data-toggle="tooltip"]').tooltip('hide');
        }

      }, //link
      
      //=======================================================================
      //
      //=======================================================================
      controller: ['$scope', '$http', 'realm', '$q', '$filter', 'commonjs','$timeout', 'searchService',
      function($scope, $http, realm, $q, $filter, commonjs,$timeout, searchService) {

            $q.when(commonjs.getCountries(), function(countries) {

                $scope.numParty     = _.where(countries, {isNPParty:     true}).length;
                $scope.numNonParty  = countries.length -  $scope.numParty;
                $scope.numRatified  = _.where(countries, {isNPInbetweenParty:  true}).length;
                

            });

        }] //controlerr
    }; //return
  }]); //directive
}); //define