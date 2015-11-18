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
    .config(function($dataRequestProvider) {
            $dataRequestProvider.httpOptions({
            	params: {
                api_key: 'fuiKNFp9vQFvjLNvx4sUwti4Yb5yGutBN4Xh10LXZhhRKjWlV4',
                callback: "JSON_CALLBACK"
               }
            });
    })
    .controller('tmblrCtrl',['$rootScope', '$scope', '$dataRequest', '$tmblrService', function($rootScope, $scope, $dataRequest, $tmblrService) {

        $scope.blog = {
        		user: 'esc001', // short name used to uniquely identify a blog
        		options: {
        			type: null, // (null = all), text, photo, audio, video, links
        			limit: 10, // number of results to return: 1–20, inclusive
        			offset: 0 // post number to start at [0 (first post)]
        		}
        }
        $scope.content = [];
        $scope.buffer = false;
        
        $scope.columnChanged = function(type) {
        		$scope.blog.options.type = type;
        		$scope.blog.options.offset = 0;
        		
            $rootScope.$emit("changeColumns", type);
            $scope.nextPage($scope.blog.user);
        };
        
        var SIZE = 500; //maximum image size
        	
        $scope.nextPage = function (user) {
             if ($dataRequest.totalPendingRequests > 0) {   
             	return;
             }   
             $scope.buffer = true;
	
             var url = '//api.tumblr.com/v2/blog/' + user + '.tumblr.com/posts';
             
             $dataRequest(url, $scope.blog.options).then(function(data) {
                if (data.response.posts != null) {  
                	$scope.content = jsonFormatter(data.response.posts);
                	$scope.blog.options.offset += $scope.blog.options.limit;
                	
                	if (data.response.posts.total_posts < $scope.blog.options.offset) {
                		return;
                	}
                	
                	$scope.buffer = false;
                }    
             }, function (resp) {
             	 //nothing
             });   
        }
        
        var jsonFormatter = function (data) {
				for (var i in data) {
					if (data[i].type == 'photo') {
						$tmblrService.tumblr.process(data[i], 'photo', SIZE);
						continue;
					}
					$tmblrService.tumblr.process(data[i], data[i].type);
				}
				return data;
        };       
    }])
}());
