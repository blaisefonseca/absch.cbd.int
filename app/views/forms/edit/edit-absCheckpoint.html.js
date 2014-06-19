define(['app', '/app/views/forms/edit/edit.js'], function (app) {

  app.controller("editAbsCheckpoint", ["$scope", "authHttp", "$filter", "$q", "$routeParams", "$controller", function ($scope, $http, $filter, $q, $routeParams, $controller) {
    $controller('editController', {$scope: $scope});

    $scope.options  = {
      countries		: function () { return $http.get("/api/v2013/thesaurus/domains/countries/terms",							{ cache: true }).then(function(o){ return $filter("orderBy")(o.data, "name"); }); },
      jurisdictions : function () {return $q.all([$http.get("/api/v2013/thesaurus/domains/D7BD5BDE-A6B9-4261-B788-16839CCC4F7E/terms", { cache: true }), 
                                 $http.get("/api/v2013/thesaurus/terms/5B6177DD-5E5E-434E-8CB7-D63D67D5EBED",   { cache: true })]).then(function(o) {
                                var data = o[0].data;
                                data.push(o[1].data)
                                return  data;
                                })
      }
    };

    //==================================
    //
    //==================================
    $scope.isSubNational = function(document) {

      document = document || $scope.document;

      return document &&
           document.jurisdiction &&
           document.jurisdiction.identifier == "DEBB019D-8647-40EC-8AE5-10CA88572F6E";
    };

    //==================================
    //
    //==================================
    $scope.isCommunity = function (document) {

      document = document || $scope.document;

      return document &&
           document.jurisdiction &&
           document.jurisdiction.identifier == "DEEEDB35-A34B-4755-BF77-D713017195E3";
    };
    //==================================
    //
    //==================================
    $scope.isOthers = function(document) {

      document = document || $scope.document;

      return document &&
           document.jurisdiction &&
           document.jurisdiction.identifier == "5B6177DD-5E5E-434E-8CB7-D63D67D5EBED";
    };
    //==================================
    //
    //==================================
    $scope.getCleanDocument = function(document) {

        document = document || $scope.document;

        if (!document)
          return undefined;

        document = angular.fromJson(angular.toJson(document));

        if (!$scope.isSubNational(document) && !$scope.isCommunity(document) && !$scope.isOthers(document)) {
          document.jurisdictionName = undefined;
        }
        if (document.informAllAuthorities !== false) {
          document.authoritiesToInform = undefined;
        }

        if (/^\s*$/g.test(document.notes))
          document.notes = undefined;

        return document;
      };

    $scope.setDocument();
  }]);
});