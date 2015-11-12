(function() {
    'use strict';

    angular.module('loader', [])
        .constant('API_KEY', 'fuiKNFp9vQFvjLNvx4sUwti4Yb5yGutBN4Xh10LXZhhRKjWlV4')
        .directive('contentItem', function($window, tumblrService) {
            return {
                require: '^scroller',
                restrict: 'E',
                template: tempFn,
                scope: {
                    user: "=",
                    format: "=",
                },
                link: linkFn
            }

            function linkFn($scope, $element, $attrs, $scroller) {
                var win, customCols;
                
                win = angular.element($window);
                customCols = $attrs.cols != null;
                
                $scope.tumblr = tumblrService;

                $scope.tumblr.setting({
                    user: $scope.user,
                    format: $scope.format,
                    offset: $attrs.offset,
                    limit: $attrs.limit,
                    cols: getCols($element[0]),
                });
                
                $scroller.setStatus($scope.tumblr.busy);
                $scroller.setHandler($scope.tumblr.nextPage.bind($scope.tumblr));
                
                var updateView = function(data) {
	                 $scope.tumblr.config[this.exp] = data;
	                 if (!$scope.tumblr.busy) {
		                 $scope.tumblr.config.offset = 0;
		                 $scope.tumblr.destroy();
		                 $scope.tumblr.nextPage();
	                 } 
                }

                function onResizeGrid() {
                    var arr = [], self = $scope.tumblr;
                    
                    self.config.cols = getCols($element[0]);
                    
                    for (var k in self.items) {
	                		arr = arr.concat(self.items[k]);
	                 }
	                 
                    self.items = [];
	                 self.create(arr);
	                 
                    if (!$scope.$$phase) {
                      $scope.$digest();
                   }
                }

                function getCols(elem) {
                    var elemWidth, num = [500, 400, 250], index = 0, min, cue;
                    elemWidth = getWH(elem, "width", false);

                    min = num[index];                    
                    for (var key in num) {
                    		cue = elemWidth % num[key];
                    		if (min > cue) {
                    			min = cue;
                    			index = key;
                    		}
                    }
                    
                    if (customCols) {
                        cue = parseInt($attrs.cols);
                    } else {
                    		cue = Math.floor(elemWidth / num[index]);
                        return [cue, Math.floor(elemWidth / cue)];
                    }
                    return [cue, Math.floor(elemWidth / cue)];
                };

                function getWH(d, g, k) {
                    var f = "height" !== g,
                        c = f ? d.offsetWidth : d.offsetHeight,
                        e = f ? "Left" : "Top",
                        b = f ? "Right" : "Bottom",
                        f = win[0].getComputedStyle(d, null),
                        l = parseFloat(f["padding" + e]) || 0,
                        n = parseFloat(f["padding" + b]) || 0,
                        p = parseFloat(f["border" + e + "Width"]) || 0,
                        q = parseFloat(f["border" + b + "Width"]) || 0,
                        b = f["margin" + b],
                        e = parseFloat(f["margin" + e]) || 0,
                        b = parseFloat(b) || 0;

                    if (0 < c)
                        c = k ? c + (e + b) : c - (l + n + p + q);
                    else {
                        c = f[g];
                        if (0 > c || null === c)
                            c = d.style[g] || 0;
                        c = parseFloat(c) || 0;
                        k && (c += l + n + e + b + p + q)
                    }
                    return c
                }
                
             	 $scope.$watch('user', updateView);
                $scope.$watch('format', updateView);
                win.bind('resize', onResizeGrid);
            }

            function tempFn() {
                return '<div data-ng-repeat="column in tumblr.items" style="width:{{tumblr.config.cols[1]}}px"><article data-ng-repeat="item in column track by $index"><div class="item-num" data-ng-include="item.type"><div></article></div>';
            }
        })
        .service('tumblrService', function($http, API_KEY, DataService) {
            this.config = null;
            this.items = [];
            this.busy = false;

            this.setting = function(opt) {
                var ln = location.hostname,
                    lh = location.href,
                    n = 0,
                    p = lh.lastIndexOf('/page/'),
                    limit = opt.limit > 0 ? opt.limit : 10;

                if (-1 != p) {
                    n = parseInt(lh.slice(p + 6));
                }
                
                this.config = {
                    user: opt.user || this.tools.getName(ln),
                    format: opt.format || undefined,
                    limit: limit,
                    offset: getOffset(n, opt.offset, limit) || 0,
                    cols: [
                        opt.cols[0] > 0 ? opt.cols[0] : 1,
                        opt.cols[1] > 0 ? opt.cols[1] : 400
                    ]
                }
                
                DataService.changeContainer(this.config.cols[1]);

                function getOffset(n, offset, limit) {
                    return n * limit + offset;
                }

                function getName(ln) {
                    if (ln.indexOf('www.') != -1) {
                        return ln.substr(4, ln.indexOf('.', 4));
                    }
                    return ln.substr(0, ln.indexOf('.'));
                }
            }

            this.nextPage = function(url, params) {

                if (this.busy) {
                    return;
                }

                this.busy = true;
                
                if (url == null) {
                    url = '//api.tumblr.com/v2/blog/' + this.config.user + '.tumblr.com/posts';
                    params = {
                        params: {
                            api_key: API_KEY,
                            callback: "JSON_CALLBACK",
                            type: this.config.format,
                            limit: this.config.limit,
                            offset: this.config.offset
                        }
                    }
                }
                
                $http.jsonp(url, params).success(function(data, status) {
                    if (data.response.posts == null) {
                        return;
                    }
                    this.create(data.response.posts, DataService.process);
                    this.config.offset += data.response.posts.length;
                    this.busy = false;
                }.bind(this));
            };

            this.create = function(posts, sce) {

                var self = this;

                angular.forEach(posts, function onIteration(item, index) {
                    var column = (index % self.config.cols[0]) | 0;

                    if (!self.items[column]) {
                        self.items[column] = [];
                    }
                    if (Object.prototype.toString.call(sce) == '[object Function]') {
                        sce(item);
                    }
                    
                    self.items[column].push(item);
                });
            };
            
            this.destroy = function () {
            	this.busy = false;
            	this.items = [];
            }
        })
        .factory('DataService', function($sce) {

            var tumblrAPI = {
                postSize: null,
                process: function(data) {
                    tumblrAPI.getData(data.type)(data);
                    convertMeta(data);
                    
                    return data;
                },
                container: function (size) {
                    tumblrAPI.postSize = size;
                },
                getData: function(type) {

                    var callback;

                    switch (type) {
                        case "text":
                            callback = tumblrAPI.textCallback;
                            break;
                        case "photo":
                            callback = tumblrAPI.photoCallback;
                            break;
                        case "video":
                            callback = tumblrAPI.videoCallback;
                            break;
                        case "audio":
                            callback = tumblrAPI.audioCallback;
                            break;                     
                        case "link":
                            callback = tumblrAPI.linkCallback;
                            break;
                    }
                    return callback;
                },
                convertMeta: function (data) {
                    data.timestamp = data.timestamp * 1000;
                    if(data.link_url != null) {
                    		data.blog_name = data.source_title;
                    }
                    
                    data.avatar = '//api.tumblr.com/v2/blog/' + data.blog_name + '.tumblr.com/avatar/64';
                },
                dataHtml: function(data, obj) {
                    return $sce.trustAsHtml(data[obj]);
                },
                dataImage: function(data) {
                    var alt_sizes = data.alt_sizes,
                        len = alt_sizes.length,
                        index = 0,
                        size;

                    while (index < len - 1) {
                        size = alt_sizes[index + 1].width;
                        if (size < tumblrAPI.postSize) {
                            break;
                        }
                        index++;
                    }

                    return {
                        url: alt_sizes[index].url,
                        width: alt_sizes[index].width,
                        height: alt_sizes[index].height
                    };
                },
                textCallback: function(data) {
                    data.body = tumblrAPI.dataHtml(data, "body");
                },
                photoCallback: function(data) {
                    data.photos.alt = tumblrAPI.dataImage(data.photos[0]);
                    data.caption = tumblrAPI.dataHtml(data, "caption");
                },
                videoCallback: function(data) {
                    data.player = tumblrAPI.dataHtml(data.player[1], "embed_code");
                },
                audioCallback: function(data) {
                    data.player = tumblrAPI.dataHtml(data, "player");
                },
                linkCallback: function(data) {
                    data.description = tumblrAPI.dataHtml(data, "description");
                }
            }

            return {
                process: tumblrAPI.process,
                changeContainer: tumblrAPI.container
            };
        })
        .directive('scroller', function($rootScope, $window, $interval) {
            return {
                restrict: 'A',
                controller: function($scope, $element, $attrs) {
                    this.setStatus = function(status) {
                        $scope.bufferStatus = status;
                    };
                    this.setHandler = function(callback) {
                        $scope.hwnd = callback;
                    };
                },
                scope: {
                    hwnd: '&',
                    bufferStatus: '=?'
                },
                link: linkFn
            }

            function linkFn($scope, $elem, $attrs) {
                var win, container, scrollDistance, scrollEnabled, checkWhenEnabled, throttle_ms, immediateCheck;

                win = angular.element($window);
                //scroll events a maximum of once every x milliseconds, optimal 250ms
                throttle_ms = null;
                /*	if set as false, the first call of manually 
                	(eg scrolling or pressing the button) 	*/
                immediateCheck = true;

                var getElemByHeight = function(elem) {
                    elem = elem[0] || elem;
                    if (isNaN(elem.offsetHeight)) {
                        return elem.document.documentElement.clientHeight;
                    } else {
                        return elem.offsetHeight;
                    }
                };

                var offsetTop = function(elem) {
                    if (!elem[0].getBoundingClientRect || elem.css('none')) {
                        return;
                    }
                    return elem[0].getBoundingClientRect().top + pageYOffset(elem);
                };

                var pageYOffset = function(elem) {
                    elem = elem[0] || elem;
                    if (isNaN(window.pageYOffset)) {
                        return elem.document.documentElement.scrollTop;
                    } else {
                        return elem.ownerDocument.defaultView.pageYOffset;
                    }
                };
                var handler = function() {
                    var containerBottom, elementBottom, remaining, shouldScroll, containerTopOffset;

                    if (container === win) {
                        containerBottom = getElemByHeight(container) + pageYOffset(container[0].document.documentElement);
                        elementBottom = offsetTop($elem) + getElemByHeight($elem);
                    } else {
                        containerBottom = getElemByHeight(container);
                        containerTopOffset = 0;
                        if (offsetTop(container) !== void 0) {
                            containerTopOffset = offsetTop(container);
                        }
                        elementBottom = offsetTop($elem) - containerTopOffset + getElemByHeight($elem);
                    }

                    remaining = elementBottom - containerBottom;
                    shouldScroll = remaining < getElemByHeight(container) * scrollDistance + 1;

                    if (shouldScroll) {
                        checkWhenEnabled = true;
                        if (scrollEnabled) {
                            if ($scope.$$phase || $rootScope.$$phase) {
                                return $scope.hwnd();
                            } else {
                                return $scope.$digest($scope.hwnd());
                            }
                        }
                    } else {
                        return checkWhenEnabled = false;
                    }
                };

                var throttle = {
                    timeout: null,
                    previous: 0,
                    later: function(callback) {
                        this.previous = new Date().getTime();
                        $interval.cancel(this.timeout);
                        this.timeout = null;
                        callback.call();
                        return null;
                    },
                    func: function(callback, wait) {
                        var now, remaining, timeout = this.timeout;
                        now = new Date().getTime();
                        remaining = wait - (now - this.previous);
                        if (remaining <= 0) {
                            $interval.cancel(timeout);
                            timeout = null;
                            this.previous = now;
                            return callback.call();
                        } else {
                            if (!timeout) {
                                return timeout = $interval(this.later(callback), remaining, 1);
                            }
                        }
                    },
                    get: function(callback, wait) {
                        return function() {
                            throttle.func(callback, wait);
                        }
                    }
                };

                if (throttle_ms != null) {
                    handler = throttle.get(handler, throttle_ms);
                };

                $scope.$on('$destroy', function() {
                    container.unbind('scroll', handler);
                });

                var handleScrollDistance = function(v) {
                    return scrollDistance = parseFloat(v) || 0;
                };
                handleScrollDistance($attrs.distance);

                var changeContainer = function(newContainer) {
                    if (container != null) {
                        container.unbind('scroll', handler);
                    }
                    container = newContainer;
                    if (newContainer != null) {
                        return container.bind('scroll', handler);
                    }
                };
                /*
                	tracking the parent element or global window
                	<div class="parent" scroll-parent="1" style="height: 150px; overflow: scroll...
                */
                if ($attrs.scrollParent != null) {
                    changeContainer(angular.element($elem.parent()));
                } else {
                    changeContainer(win);
                };

                var handleScrollDisabled = function(v) {
                    scrollEnabled = !v;
                    if (scrollEnabled && checkWhenEnabled) {
                        checkWhenEnabled = false;
                        return handler();
                    }
                };

                $scope.$watch('bufferStatus', handleScrollDisabled);
                handleScrollDisabled($scope.bufferStatus);

                if ($attrs.immediateCheck != null) {
                    immediateCheck = $scope.$eval($attrs.immediateCheck);
                };

                return $interval((function() {
                    if (immediateCheck)
                        return handler();
                }), 0, 1);
            }
        });
}());