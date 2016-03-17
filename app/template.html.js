define(['app', 'underscore', 'ng-breadcrumbs','angular-animate',
    'angular-localizer', 'scbd-angularjs-services', 'scbd-angularjs-filters',
    'scbd-branding/directives/footer',
    '/app/views/directives/nav/portal-branding.js',
    'scbd-branding/directives/header/header',
    '/app/views/directives/nav/portal-nav.js',
    'ngAria', 'angular-animate', 'toastr', 'ionsound', '/app/services/app-config-service.js'
], function(app, _) {
    'use strict';

    app.controller('TemplateController', ['$scope', '$rootScope', 'showHelp',
        '$location','realmConfiguration','$anchorScroll', 'breadcrumbs', 'toastr', '$route',
        'cfgUserNotification','$window', '$element','localStorageService', 'appConfigService',
        function($scope, $rootScope, showHelp, $location, realmConfiguration,
            $anchorScroll, breadcrumbs, toastr, $route, cfgUserNotification, $window, $element, localStorageService,
            appConfigService) {
            $scope.controller = "TemplateController";
            $scope.breadcrumbs = breadcrumbs;
            $scope.$root.pageTitle = {
                text: ""
            };




            // $scope.goHome               = function() { $location.path('/'); };
            // $scope.currentPath          = function() { return $location.path(); };.
            //============================================================
            //
            //
            //============================================================
            $scope.toggleSideBar = function() {
                $element.find("#wrapper").toggleClass("toggled");
            }



            //============================================================
            //
            //
            //============================================================
            $scope.gotoAnchor = function(x) {
                var newHash = 'anchor' + x;
                if ($location.hash() !== newHash) {
                    // set the $location.hash to `newHash` and
                    // $anchorScroll will automatically scroll to it
                    $location.hash('anchor' + x);
                } else {
                    // call $anchorScroll() explicitly,
                    // since $location.hash hasn't changed
                    $anchorScroll();
                }
            };

            $scope.$root.getRoleName = function(roleName) {
                if (roleName) {
                    var realmConfig = _.where(realmConfiguration, {
                        host: $location.$$host
                    });
                    if (realmConfig.length > 0) {
                        var role = _.find(realmConfig[0].roles, function(key) {
                            return _.keys(key)[0] == roleName;
                        });
                        // console.log(realmConfig, role)
                        if (role)
                            return _.values(role)[0];
                        else
                            throw roleName + ' role is not configured for realm ' + realmConfig[0].realm + ', please update realm-configuration.js';
                    } else
                        throw 'Realm not configured, please update realm-configuration.js';
                }
            };

            //            $scope.updateStorage = function(){
            //                localStorageService.set('hideDisclaimer', true);
            //                $scope.hideDisclaimer=true;
            //            };
            //    	    $scope.hideDisclaimer = localStorageService.get('hideDisclaimer');
            //============================================================
            //
            //
            //============================================================
            $scope.getClass = function(path) {
                if ($location.path().substr(0, path.length) == path) {
                    return true;
                } else {
                    return false;
                }
            };

            //============================================================
            //
            //
            //============================================================
            $scope.env_name = "ABS-CH";
            $scope.production_env = true;
            $scope.development_env = false;
            $scope.training_env = false;

            if ($location.absUrl().toLowerCase().indexOf("://dev-absch.cbd.int") > 0 || $location.absUrl().toLowerCase().indexOf("localhost:2010") > 0) {
                $scope.development_env = true;
                $scope.training_env = false;
                $scope.production_env = false;
                $scope.env_name = "DEVELOPMENT";
            }
            if ($location.absUrl().toLowerCase().indexOf("://training-absch.cbd.int") > 0) {
                $scope.development_env = false;
                $scope.training_env = true;
                $scope.production_env = false;
                $scope.env_name = "TRAINING";
            }

            $scope.feedbackHelp = function() {
                if ($scope.showHelp.show)
                    showSimpleToast("Help information is turned on.");

                if (!$scope.showHelp.show)
                    showSimpleToast("Help information is turned off.");
            };

            $scope.feedbackGlossary = function() {
                if ($scope.showHelp.glossary)
                    showSimpleToast("Glossary is turned on.");

                if (!$scope.showHelp.glossary)
                    showSimpleToast("Glossary is turned off.");
            };


            //======================================================
            //
            //
            //======================================================


            $rootScope.$on("showSimpleToast", function(evt, msg) {
                showSimpleToast(msg);

            });

            $scope.$on('signOut', function(evt, data) {
                $window.location.reload();
            });

            if(cfgUserNotification){
                cfgUserNotification
                .notificationUrls = {
                                    documentNotificationUrl     : '/register/requests/',
                                    viewAllNotificationUrl      : '/register/requests',
                                    documentMessageUrl          : '/mailbox/'
                                };
            }

            function showSimpleToast(msg) {
                toastr.info(msg);
            }



            $rootScope.$on('event:server-pushNotification', function(evt,pushNotification){
                if(pushNotification.type == 'documentNotification'){
                    // toastr.info(data.message);
                    if(pushNotification.data && pushNotification.data.realm == appConfigService.currentRealm){
                        localStorageService.remove('governmentFacets');
                        localStorageService.remove('searchFilters');
                    }
                }
            });


            //============================================================
        //
        //
        //============================================================
        $rootScope.$watch('user', _.debounce(function(user) {

            if (!user)
                return;

            require(["_slaask"], function(_slaask) {

                if (user.isAuthenticated) {
                    _slaask.identify(user.name, {
                        'user-id' : user.userID,
                        'name' : user.name,
                        'email' : user.email,
                    });

                    if(_slaask.initialized) {
                        _slaask.slaaskSendUserInfos();
                    }
                }

                if(!_slaask.initialized) {
                    _slaask.init('4251dbad1118dbaf3ad67acbaa82e4b9');
                    _slaask.initialized = true;
                }
            });
        }, 1000));

        }
    ]);

});
