(function() {
    'use strict';
    
    angular.module('tmblrApp', ['loader', 'common'])
    .run(function($templateCache) {
        		var templates, header, footer;
            templates = {
                text: '<div class="cover-caption" ng-bind-html="::item.body"></div>',
                photo: '<a href="{{::item.image_permalink}}"><img src="{{::item.photos.alt.url}}" class="previmg" alt=""></a><div class="cover-caption" ng-bind-html="::item.caption"></div>',
                video: '<div ng-bind-html="::item.player"></div><div class="cover-caption" ng-bind-html="::item.caption"></div>',
                music: '<div ng-bind-html="::item.player"></div><div class="cover-caption" ng-bind-html="::item.caption"></div>',
                link: '<div class="link-text"><a href="{{::item.source_url}}" ng-bind="::item.title"></a><p ng-bind="::item.source_title"></p></div><div ng-bind-html="::item.description"></div>'
            };

            header = '<header class="cover-user-wrap"><div class="avt"><img src="{{::item.avatar}}" alt=""></div><div class="iu"><h3 class="hu">@{{::item.source_title}}</h3><span class="dt">{{::item.timestamp*1000|date:"dd MMM yyyy"}}</span></div></header>';      
            footer = '<div class="cover-fields" ng-bind-html="::item.tags"></div><div class="cover-stat-wrap"><span class="cover-stat stat-notes" ng-bind="::item.note_count"></span> Notes<span onclick="window.open("{{::item.post_url}}#comments"); return false;" class="cover-stat stat-reblog">Reblog</span><span onclick="window.open("{{::item.post_url}}#comments"); return false;" class="cover-stat stat-comments">Commens</span></div>';
            
            for (var index in templates) {
                $templateCache.put(index, header + templates[index] + footer);
            }
    })
    .controller('TumblrController', function($scope) {
        $scope.user = "esc001";
        
        $scope.eff = function(f) {
            $scope.format = f;
        };
        $scope.euf = function(u) {
            $scope.user = u;
        };
    })
}());
