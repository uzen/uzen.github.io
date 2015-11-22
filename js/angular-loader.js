(function() {
    'use strict';
    angular.module('loader', [])
        .directive('columnHeader', function($rootScope, $compile, $window) {
            return {
                restrict: 'A',
                link: function($scope, $element, $attrs) {

                    if (!$scope[$attrs.columnHeader]) {
                        throw new Error("Can't find the column configuration object on the scope: " + $attrs.columnHeader);
                    }

                    var cols, pfx, windowElement, styleSheet;

                    windowElement = angular.element($window);

                    $scope.columns = [];

                    if (!$attrs.prefix) {
                        pfx = 'item';
                    } else {
                        pfx = $attrs.prefix;
                    }

                    $rootScope.$on("changeColumns", function() {
                        $scope.columns = [];
                        initialize();
                    });

                    initialize();

                    $scope.$watch($attrs.columnHeader, render);
                    $scope.$on('$destroy', onDestroy);
                    windowElement.on('resize', onResize);

                    function onResize() {
                        if (cols.width == getColumns($element[0], $attrs.cols).width) {
                            return;
                        }
                        var tmp = [];
                        tmp = $scope.columns;
                        $scope.columns = [];
                        initialize();
                        tmp.forEach(function onIteration(array) {
                            render(array);
                        });
                    }

                    function onDestroy() {
                        windowElement.off('resize', onResize);
                    }

                    function initialize() {
                        var rules, selector;

                        if ($element.children()) {
                            $element.children().remove();
                        }

                        cols = getColumns($element[0], $attrs.cols);
                        rules = [
                            ['width', cols.width + 'px']
                        ];
                        selector = addStylesheetRules(rules);
                        
                        $element.append($compile(createColumns(selector, pfx))($scope));
                    }

                    function createColumns(rules, _p) {
                        var elementString = '',
                            i;

                        for (i = 0; i < cols.length; i++) {
                            elementString += '<div class="columns ' + rules + '"><article ng-repeat="' + _p + ' in columns[' + i + '] track by $index" class="ng-include:' + _p + '.type; item-num"></article></div>';
                        }

                        return elementString;
                    }

                    function addStylesheetRules(rules) {

                        if (styleSheet == null) {
                            var styleEl = document.createElement('style')
                            $element.parent().append(styleEl);

                            // Grab style sheet
                            styleSheet = styleEl.sheet;
                        }

                        var selector, propStr = '';

                        selector = 'c' + Math.random().toString(36).slice(2, 6);

                        for (var i = 0, pl = rules.length; i < pl; i++) {
                            var prop = rules[i];
                            propStr += prop[0] + ':' + prop[1] + (prop[2] ? ' !important' : '') + ';\n';
                        }

                        // Insert CSS Rule    
                        if (styleSheet.addRule != null) {
                            styleSheet.addRule('.' + selector, propStr);
                        } else if (styleSheet.insertRule) {
                            styleSheet.insertRule('.' + selector + '{' + propStr + '}', styleSheet.cssRules.length);
                        }
                        
                        return selector;
                    }

                    function render(items) {
                        items.forEach(function onIteration(item, index) {
                            var column = (index % cols.length) | 0;
                            if (!$scope.columns[column]) {
                                $scope.columns[column] = [];
                            }
                            $scope.columns[column].push(item);
                        });
                    }

                    function getColumns(elem, count) {
                        var elemWidth, num = [500, 400, 250],
                            index = 0,
                            min, cue;
                        elemWidth = getWH(elem, "width", false);

                        min = num[index];
                        for (var key in num) {
                            cue = elemWidth % num[key];
                            if (min > cue) {
                                min = cue;
                                index = key;
                            }
                        }

                        if (count != null) {
                            cue = parseInt(attrs.cols);
                        } else {
                            cue = Math.floor(elemWidth / num[index]);
                        }

                        return {
                            length: cue,
                            width: Math.floor(elemWidth / cue)
                        };
                    };

                    function getWH(d, g, k) {
                        var f = "height" !== g,
                            c = f ? d.offsetWidth : d.offsetHeight,
                            e = f ? "Left" : "Top",
                            b = f ? "Right" : "Bottom",
                            f = window.getComputedStyle(d, null),
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
                }
            };
        })
        .factory('$tmblrService', function($sce) {

            var tumblrAPI = {
                process: function(data, type, params) {
                    tumblrAPI[type](data, params);
                    tumblrAPI.meta(data);

                    return data;
                },
                meta: function(data) {
                    var tags = '',
                        i = 0,
                        lenTags = data.tags.length;

                    if (data.source_title === undefined) {
                        data.source_title = data.blog_name;
                    }

                    while (i < lenTags) {
                        tags += '<a href="/' + data.tags[i] + '">' + data.tags[i] + '</a>';
                        i++;
                    }

                    data.tags = $sce.trustAsHtml(tags);

                    if (data.source_title.indexOf('.') != -1) {
                        data.avatar = '//placeimg.com/40/40/' + data.source_title;
                    } else {
                        data.avatar = '//api.tumblr.com/v2/blog/' + data.source_title + '.tumblr.com/avatar/40';
                    }


                },
                text: function(data) {
                    data.body = $sce.trustAsHtml(data['body']);
                },
                photo: function(data, size) {
                    data.photos.alt = getImage(data.photos[0], size);
                    data.caption = $sce.trustAsHtml(data['caption']);

                    function getImage(data, size) {
                        var alt_sizes = data.alt_sizes,
                            len = alt_sizes.length,
                            index = 0,
                            img_size;

                        while (index < len - 1) {
                            img_size = alt_sizes[index + 1].width;
                            if (img_size < size) {
                                break;
                            }
                            index++;
                        }

                        return {
                            url: alt_sizes[index].url,
                            width: alt_sizes[index].width,
                            height: alt_sizes[index].height
                        };
                    }
                },
                video: function(data) {
                    data.player = $sce.trustAsHtml(data.player[1]['embed_code']);
                    data.caption = $sce.trustAsHtml(data['caption']);
                },
                audio: function(data) {
                    data.player = $sce.trustAsHtml(data['player']);
                    data.caption = $sce.trustAsHtml(data['caption']);
                },
                link: function(data) {
                    data.description = $sce.trustAsHtml(data['description']);
                }
            };

            return {
                tumblr: tumblrAPI

            };
        })
        .provider('$dataRequest', function() {
            var httpOptions;

            this.httpOptions = function(val) {
                if (val) {
                    httpOptions = val;
                    return this;
                }
                return httpOptions;
            };

            this.$get = ['$http', '$q', function($http, $q) {

                function handleRequestFn(url, userOptions, debug) {
                    handleRequestFn.totalPendingRequests++;

                    if (userOptions != null) {
                        var options = new Object();
                        angular.extend(options.params = {}, userOptions, httpOptions.params);
                    } else {
                        var options = httpOptions;
                    }

                    return $http.jsonp(url, options)['finally'](function() {
                            handleRequestFn.totalPendingRequests--;
                        })
                        .then(function(response) {
                            return response.data;
                        }, handleError);

                    function handleError(resp) {
                        if (debug) {
                            throw Error('Failed to load JSON data: ', url, ' (HTTP status:', resp.status, resp.statusText, ')');
                        }
                        return $q.reject(resp);
                    }

                    function isFunction(func) {
                        return func != null && Object.prototype.toString.call(func) == '[object Function]';
                    }
                }

                handleRequestFn.totalPendingRequests = 0;

                return handleRequestFn;
            }];

        })
        .directive('scroller', function($rootScope, $window, $interval) {
            return {
                restrict: 'A',
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
                                return $scope.$apply($scope.hwnd());
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