define(['app', './common-routes', 'angular-route'], function (app,commonRoutes) { 'use strict';

    app.config(['$routeProvider', function ($routeProvider) {
               
        $routeProvider.
               whenAsync('/',                                { templateUrl: 'views/home/bch.html',              controller: function() { return commonRoutes.importQ('views/home/bch'); }, label:'The BCH'}).
               whenAsync('/register/CNA/new',           {templateUrl: 'views/forms/edit/edit-authority.html',                 label:'New',  param:'true', resolveController: true,documentType :'CNA' , resolve : { securized : commonRoutes.securize(null,true, true) }, }).
               whenAsync('/register/NDB/new',           {templateUrl: 'views/forms/edit/edit-database.html',                  label:'New',  param:'true', resolveController: true,documentType :'NDB' , resolve : { securized : commonRoutes.securize(null,true, true) }, }).
               whenAsync('/register/CBI/new',           {templateUrl: 'views/forms/edit/edit-capacityBuildingInitiative.html',label:'New',  param:'true', resolveController: true,documentType :'CBI' , resolve : { securized : commonRoutes.securize(null, null, true) }, }).
               
               whenAsync('/register/CNA/:identifier/edit',           {templateUrl: 'views/forms/edit/edit-authority.html',                 label:'Edit',  param:'true', resolveController: true, documentType :'CNA' , resolve : { securized : commonRoutes.securize(null,true, true) }, }).
               whenAsync('/register/NDB/:identifier/edit',           {templateUrl: 'views/forms/edit/edit-database.html',                  label:'Edit',  param:'true', resolveController: true, documentType :'NDB' , resolve : { securized : commonRoutes.securize(null,true, true) }, }).
               whenAsync('/register/CBI/:identifier/edit',           {templateUrl: 'views/forms/edit/edit-capacityBuildingInitiative.html',label:'Edit',  param:'true', resolveController: true, documentType :'CBI' , resolve : { securized : commonRoutes.securize(null, null, true) }, }).
               whenAsync('/register/ORG/:identifier/edit',           {templateUrl: 'views/forms/edit/edit-organization.html',              label:'Edit',  param:'true', resolveController: true, documentType :'ORG' , resolve : { securized : commonRoutes.securize(null, null, true) }, }).
          
               whenAsync('/database/reports*',               { redirectTo:  '/reports' }).

               // BCH4 PAGES
               whenAsync('/about/countryprofile.shtml',      { redirectTo:  '/countries/:country' }).
               whenAsync('/countries/:country',              { templateUrl: 'views/shared/cms-content.html', target:'https://bch.cbd.int/about/countryprofile.shtml?country=:country', controller: function() { return commonRoutes.importQ('views/shared/cms-content'); } }).
               whenAsync('/about/:subpath*?',                { templateUrl: 'views/shared/cms-content.html', target:'https://bch.cbd.int/about/:subpath',                              controller: function() { return commonRoutes.importQ('views/shared/cms-content'); } }).
               whenAsync('/protocol/:subpath*?',             { templateUrl: 'views/shared/cms-content.html', target:'https://bch.cbd.int/protocol/:subpath',                           controller: function() { return commonRoutes.importQ('views/shared/cms-content'); } }).
               whenAsync('/onlineconferences/:subpath*?',    { templateUrl: 'views/shared/cms-content.html', target:'https://bch.cbd.int/onlineconferences/:subpath',                  controller: function() { return commonRoutes.importQ('views/shared/cms-content'); } }).

               whenAsync('/help/forbidden',   { templateUrl: 'views/shared/403.html', label:'Forbidden'}).
               whenAsync('/help/not-found',   { templateUrl: 'views/shared/404.html', label:'Not found'}).     
               
               otherwise({ templateUrl: commonRoutes.baseUrl+'views/shared/404.html', label:'Page not found'});
    }]);

    
    
});