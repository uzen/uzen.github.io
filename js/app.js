(function() {
    'use strict';
    
    angular.module('tmblrApp', ['loader', 'common'])
    .run(function($templateCache) {
        		var templates, footer;
            templates = {
                text: '<div class="post-info" ng-bind-html="item.body"></div>',
                photo: '<a href="{{::item.image_permalink}}"><img data-ng-src="{{::item.photos.alt.url}}" src="" class="previmg" alt=""></a><div class="post-info" ng-bind-html="item.caption"></div>',
                video: '<div class="post-info" ng-bind-html="item.player"></div>',
                music: '<div>Music</div>',
                link: '<div class="link-text"><a href="{{::item.source_url}}" data-ng-bind="item.title"></a><p data-ng-bind="item.source_title"></p></div><div class="post-info" ng-bind-html="item.description"></div>'
            };
            footer = '<div class="meta"><a href="" class="notes">{{::item.note_count}}</a><a href="{{::item.post_url}}#comments" class="comments">Сomments</a><div>{{::item.timestamp|date:"dd MMM yyyy"}}@{{::item.blog_name}}<img data-ng-src="{{::item.avatar}}"></div></div>';
            for (var index in templates) {
                $templateCache.put(index, templates[index] + footer);
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