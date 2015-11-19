(function() {
    'use strict';
    
    angular.module('mainApp', ['loader', 'common'])
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
        
        $scope.navLink = function(arr) {
        		if (arr.type != null) {
        			$scope.blog.options.type = arr.type;        			
        		} 
        		
        		if (arr.user != null) {
        			$scope.blog.user = arr.user;        		
        		}
        		
        		$scope.blog.options.offset = 0;
        		
            $rootScope.$emit("changeColumns");
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
                if (data.response.posts === undefined) {  
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
    }]);
}());
