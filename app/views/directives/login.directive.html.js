require('app').directive('login', function ($http) {
        return {
            restrict: 'EAC',
            templateUrl: '/app/views/directives/login.directive.html?'+(new Date().getTime()),
            replace: true,
            scope: {
                
            },
            controller: ['$scope', '$http', '$window', '$location', '$cookies',  function ($scope, $http, $window, $location, $cookies) {

              $scope.email = null;
              $scope.password = null;
              $scope.show_feed_content= false;

              //============================================================
              //
              //
              //============================================================
              $scope.doSignIn = function doSignIn () {

                $scope.errorInvalid = false;
                    $scope.errorTimeout = false;
                    $scope.waiting      = true;

                    //

                    var credentials = { 'email': $scope.email, 'password': $scope.password };

                    $http.post('/api/v2013/authentication/token', credentials).then(function onsuccess(success) {

                  $cookies.authenticationToken = success.data.authenticationToken;
                        $cookies.email = $scope.rememberMe ? $scope.email : undefined;

                        var response = { type: 'setAuthenticationToken', authenticationToken: $cookies.authenticationToken, setAuthenticationEmail: $cookies.email };
                      
                      var authenticationFrame = angular.element(document.querySelector('#authenticationFrame'))[0];
                        authenticationFrame.contentWindow.postMessage(JSON.stringify(response), 'https://accounts.cbd.int');

                      $window.location.href = $window.location.href;

                    }, function onerror(error) {

                      $scope.password     = "";
                        $scope.errorInvalid = error.status == 403;
                        $scope.errorTimeout = error.status != 403;
                        $scope.waiting      = false;
                    });
              }

             $scope.actionSignup = function () { 
                  var redirect_uri = encodeURIComponent($location.protocol()+'://'+$location.host()+':'+$location.port()+'/');
                  $window.location.href = 'https://accounts.cbd.int/signup?redirect_uri='+redirect_uri;
              };

            }]

        };
    });