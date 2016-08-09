(function(win) {
    'use strict';

    var main = null;
    var Provider = {
            Tumblr: 0,
            Vk: 1
        },
        temp = {
            posts: {
                text: null,
                photo: null,
                video: null,
                audio: null,
                link: null,
                quote: null,
                answer: null,
                chat: null,
                ads: null
            }
        };

    function LoaderAI() {
        this.provider = Provider.Tumblr;
        this.options = LoaderAI.parseOpt();
        this.version = "3.4";
    };

    LoaderAI.parseOpt = function(q_str) {
        var user, params = {}, lpArr;

        q_str = q_str || this.QueryString();

        if (q_str.hasOwnProperty("user") && q_str.user.length > 0) {
            user = q_str.user;
        } else {
            user = location.hostname.split('.', 1).join();
        }
        
        if(q_str.hasOwnProperty("id")) {
	            params.id = q_str.id; // post ID
        } else {
	        params.limit = parseInt(q_str.limit || 10);
	        params.offset = parseInt(q_str.offset || 0);
	
	        if (q_str.hasOwnProperty("type")) {
	            for (var type in temp.posts) {
	                if (type == q_str.type) {
	                    params.type = q_str.type;
	                    break;
	                }
	            }
	        }
	
	        if (q_str.hasOwnProperty("tag")) {
	            params.tag = q_str.tag;
	        } else if ((lpArr = win.location.pathname.split('/')) && lpArr[1] == "tagged") {
	            params.tag = lpArr[2];
	        }
        }
        
        return {
            user: user,
            params
        };
    };

    LoaderAI.QueryString = function() {

        var query_string = {},
            query = win.location.search.substring(1),
            vars = query.split("&");

        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (typeof query_string[pair[0]] === "undefined") {
                query_string[pair[0]] = decodeURIComponent(pair[1]);
            } else if (typeof query_string[pair[0]] === "string") {
                var arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
                query_string[pair[0]] = arr;
            } else {
                query_string[pair[0]].push(decodeURIComponent(pair[1]));
            }
        }

        return query_string;
    };

    function tmblrDataRequestConfig($dataRequestProvider) {
        $dataRequestProvider.httpOptions({
            params: {
                api_key: "fuiKNFp9vQFvjLNvx4sUwti4Yb5yGutBN4Xh10LXZhhRKjWlV4",
                callback: "JSON_CALLBACK"
            }
        });
    };
    
    /* Controllers */
    
    function tmblrController($scope, $dataRequest, $tmblrService) {

        $scope.buffer = [];
        $scope.status = false;

        var params = {
        			SIZE: 500 //maximum image size px
        		},
            options = main.options,
            url;

        var updateUrl = function(user) {
                url = '//api.tumblr.com/v2/blog/' + user + '.tumblr.com/posts';
            },
            jsonFormatter = function(data) {
                for (var i in data) {
                    if (data[i].type == 'photo') {
                        $tmblrService.tumblr.process(data[i], 'photo', params);
                        continue;
                    }
                    $tmblrService.tumblr.process(data[i], data[i].type);
                }
                return data;
            };

        $scope.updateOptions = function(opt, param) {
            if (param != null && options.hasOwnProperty(opt)) {
                options[opt] = param;
            } else {
                options = this.options;
            }

            updateUrl(options.user);
        }

        $scope.nextPage = function() {
            if ($dataRequest.totalPendingRequests > 0) {
                return;
            }

            $dataRequest(url, options.params).then(function(data) {
                $scope.buffer = jsonFormatter(data.response.posts);
                options.params.offset += options.params.limit;

                if (data.response.posts.total_posts < options.params.offset) {
                    $dataRequest.totalPendingRequests = -1;
                }
            }, function(resp) {
                //nothing
            });
        };
        updateUrl(options.user);
    };
   
    function templateCache($templateCache) {
        var bodyTemp = {
                text: '%3Cdiv%20class%3D%22article-content%22%3E%3Cdiv%20class%3D%22cover-caption%22%20ng-bind-html%3D%22%3A%3Aitem.body%22%3E%3C%2Fdiv%3E%3C%2Fdiv%3E',
                photo: '%3Ca%20href%3D%22%7B%7B%3A%3Aitem.short_url%7D%7D%22%20class%3D%22photoset%22%20itemphotos%3E%3C%2Fa%3E%3Cdiv%20class%3D%22article-content%22%3E%3Cdiv%20class%3D%22cover-fields%22%20itemtags%3E%3C%2Fdiv%3E%3Cdiv%20class%3D%22cover-caption%22%20ng-bind-html%3D%22%3A%3Aitem.caption%22%3E%3C%2Fdiv%3E%3C%2Fdiv%3E',
                video: '%3Cdiv%20ng-bind-html%3D%22%3A%3Aitem.player%22%3E%3C%2Fdiv%3E%3Cdiv%20class%3D%22article-content%22%3E%3Cdiv%20class%3D%22cover-fields%22%20itemtags%3E%3C%2Fdiv%3E%3Cdiv%20class%3D%22cover-caption%22%20ng-bind-html%3D%22%3A%3Aitem.caption%22%3E%3C%2Fdiv%3E%3C%2Fdiv%3E',
                audio: '%3Cdiv%20ng-bind-html%3D%22%3A%3Aitem.player%22%3E%3C%2Fdiv%3E%3Cdiv%20class%3D%22article-content%22%3E%3Cdiv%20class%3D%22cover-fields%22%20itemtags%3E%3C%2Fdiv%3E%3Cdiv%20class%3D%22cover-caption%22%20ng-bind-html%3D%22%3A%3Aitem.caption%22%3E%3C%2Fdiv%3E%3C%2Fdiv%3E',
                link: '%3Cdiv%20class%3D%22link-text%22%3E%3Ca%20href%3D%22%7B%7B%3A%3Aitem.source_url%7D%7D%22%20ng-bind%3D%22%3A%3Aitem.title%22%3E%3C%2Fa%3E%3Cp%20ng-bind%3D%22%3A%3Aitem.source_title%22%3E%3C%2Fp%3E%3C%2Fdiv%3E%3Cdiv%20class%3D%22cover-caption%20article-content%22%20ng-bind-html%3D%22%3A%3Aitem.description%22%3E%3C%2Fdiv%3E',
                quote: '%3Cdiv%20ng-bind-html%3D%22%3A%3Aitem.text%22%3E%3C%2Fdiv%3E%3Cdiv%20class%3D%22article-content%22%3E%3Cdiv%20class%3D%22cover-fields%22%20itemtags%3E%3C%2Fdiv%3E%3Cdiv%20class%3D%22cover-caption%22%20ng-bind-html%3D%22%3A%3Aitem.source%22%3E%3C%2Fdiv%3E%3C%2Fdiv%3E',
                answer: '',
                chat: ''
            },
            headerTemp = '%3Cheader%20class%3D%22cover-user-wrap%22%3E%3Cdiv%20class%3D%22vt%22%3E%3Cimg%20src%3D%22%7B%7B%3A%3Aitem.avatar%7D%7D%22%20alt%3D%22%22%3E%3C%2Fdiv%3E%3Cdiv%20class%3D%22iu%22%3E%3Ch3%20class%3D%22hu%22%3E%40%7B%7B%3A%3Aitem.source_title%7D%7D%3C%2Fh3%3E%3Cdiv%20class%3D%22dt%22%20itemdate%3E%3C%2Fdiv%3E%3C%2Fdiv%3E%3C%2Fheader%3E',
            footerTemp = '%3Cfooter%20class%3D%22cover-stat%22%3E%3Ca%20href%3D%22%7B%7B%3A%3Aitem.short_url%7D%7D%22%20class%3D%22stat-notes%22%3E%3Cb%3E%7B%7B%3A%3Aitem.note_count%7D%7D%3C%2Fb%3E%20shares%3C%2Fa%3E%3C%2Ffooter%3E';
        for (var index in temp.posts) {
            $templateCache.put(index, decodeURIComponent((headerTemp + bodyTemp[index] + footerTemp).replace(/\+/g, " ")));
        }
    };

    function templatePhotoset() {
        return {
            restrict: 'A',
            template: '<div ng-repeat="photo in ::item.photos"><img src="{{photo.alt.url}}" class="previmg"></div>'
        };
    }

    function templateTags() {
        return {
            restrict: 'A',
            template: '<a href="/?tag={{tag}}" ng-repeat="tag in ::item.tags">{{tag}}</a>'
        };
    }

    function templateDate() {
        return {
            restrict: 'A',
            template: '{{item.date|date:"dd MMM yyyy"}}'
        };
    }
    var _AngularJs = angular.module('tmblrApp', ['loader', 'common']),
        UserException = function(name, message) {
            this.name = '[' + name + ']';
            this.message = message;
        },
        init = function() {
            try {
                if (typeof win.LoaderAI === "undefined") {
                    throw new UserException("Unknown", "Don't initialize a global variable \'LoaderAI\'");
                } else if (win.LoaderAI.version < 3.1) {
                    throw new UserException("Version", "Initialization script needs to be updated");
                }
                LoaderAI.options = LoaderAI.parseOpt(LoaderAI.options);
                main = win.LoaderAI;
            } catch (e) {
                console.log(e.name, e.message);
                main = new LoaderAI();
            }

            switch (main.provider) {
                case Provider.Tumblr:
                    _AngularJs.config(tmblrDataRequestConfig);
                    _AngularJs.controller('loaderCtrl', tmblrController);
                    break;
                case Provider.Vk:
                    break;
            }
            _AngularJs.run(templateCache)
                .directive('itemphotos', templatePhotoset)
                .directive('itemtags', templateTags)
                .directive('itemdate', templateDate);
        }();
})(window);