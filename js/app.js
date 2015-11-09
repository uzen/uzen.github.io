(function() {
    'use strict';
    
    var app = angular.module('app.tumblr', ['loader', 'common']);
    
    app.controller('isController', function($scope) {
        $scope.user = "esc001";
        
        $scope.eff = function(f) {
            $scope.format = f;
        };
        $scope.euf = function(u) {
            $scope.user = u;
        };
    })
}());