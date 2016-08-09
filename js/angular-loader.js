(function() {
    'use strict';
    angular.module('loader', [])
        .directive('columnHeader', function($rootScope, $compile, $window) {
            return {
                restrict: 'A',
                link: function($scope, $element, $attrs) {
                    var cols, windowElement, styleSheet;

                    if ($attrs.columnHeader === undefined || $scope[$attrs.columnHeader] === undefined) {
                        throw new Exception("columnHeader hasn't been initialized");
                    }

                    windowElement = angular.element($window);
                    cols = getColumns($element[0], $attrs.cols);
                    handleReloadRows();

                    function reloadRows() {
                        var rules, selector;

                        if ($element.children()) {
                            $element.children().remove();
                        }

                        rules = [
                            ['width', cols.width + 'px']
                        ];

                        selector = addStyleSheet(rules, true);

                        $element.append($compile(createColumns(selector, $attrs.prefix))($scope));
                    };

                    function onResize() {
                        var _cols = cols;
                        cols = getColumns($element[0], $attrs.cols);

                        if (cols.length == _cols.length) {

                            var rules = [
                                ['width', cols.width + 'px']
                            ];

                            addStyleSheet(rules, false);
                        } else if (cols.width != _cols.width) {
                            var tmp = [];

                            for (var i = 0; i < _cols.length; i++)
                                render($scope.columns[i], tmp);

                            $scope.columns = tmp;

                            if ($scope.$$phase && $rootScope.$$phase) {
                                return reloadRows();
                            }
                            $scope.$apply(reloadRows);
                        }
                    }

                    function createColumns(rules, _prefix) {
                        var elementString = '',
                            i;

                        _prefix = _prefix || 'item';

                        for (i = 0; i < cols.length; i++) {
                            elementString += '<div class="columns ' + rules + '"><article ng-repeat="' + _prefix + ' in columns[' + i + '] track by $index" class="ng-include:' + _prefix + '.type; item-num"></article></div>';
                        }

                        return elementString;
                    }

                    function addStyleSheet(rules, ns) {

                        if (styleSheet === undefined) {
                            styleSheet = document.createElement('style');

                            document.getElementsByTagName('head')[0].appendChild(styleSheet);
                            styleSheet = document.styleSheets[document.styleSheets.length - 1];

                            if (typeof styleSheet.cssRules === undefined && typeof styleSheet.rules !== undefined)
                                styleSheet.cssRules = styleSheet.rules;
                            if (typeof styleSheet.insertRule === undefined && typeof styleSheet.addRule !== undefined)
                                styleSheet.insertRule = _insertRule;
                            if (typeof styleSheet.deleteRule === undefined && typeof styleSheet.removeRule !== undefined)
                                styleSheet.deleteRule = styleSheet.removeRule;
                        }

                        return makeStyleSheet(styleSheet, rules, ns);
                    }

                    function _insertRule(rule, index) {
                        if (rule.match(/^([^{]+)\{(.*)\}\s*$/)) {
                            this.addRule(RegExp.$1, RegExp.$2, index);
                            return index;
                        }
                    }

                    function makeStyleSheet(style, rules, ns) {

                        var selector, propStr = '',
                            rlen;

                        if (ns === false && (rlen = style.cssRules.length) > 0) {
                            selector = style.cssRules[rlen - 1].selectorText;
                            selector = selector.substr(1);
                            style.deleteRule(rlen - 1);
                        } else {
                            selector = 'c' + Math.random().toString(36).slice(2, 6);
                        }

                        for (var i = 0, pl = rules.length; i < pl; i++) {
                            propStr += rules[i][0] + ':' + rules[i][1] + ';';
                        }

                        style.insertRule('.' + selector + '{' + propStr + '}', style.cssRules.length);

                        return selector;
                    }

                    function render(src, dist) {
                        angular.forEach(src, function onIteration(item, index) {
                            var column = (index % cols.length) || 0;
                            if (!dist[column]) {
                                dist[column] = [];
                            }
                            item.$index = index;
                            dist[column].push(item);
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
                            cue = parseInt($attrs.cols);
                        } else {
                            cue = Math.floor(elemWidth / num[index]);
                        }

                        cue = Math.max(cue, 1);

                        return {
                            length: cue,
                            width: Math.floor(elemWidth / cue)
                        };
                    };

                    function getWH(d, g, k) {
                        var l, n, p, q, f = "height" !== g,
                            c = f ? d.offsetWidth : d.offsetHeight,
                            e = f ? "Left" : "Top",
                            b = f ? "Right" : "Bottom";
                        f = windowElement[0].getComputedStyle(d, null);
                        l = parseFloat(f["padding" + e]) || 0;
                        n = parseFloat(f["padding" + b]) || 0;
                        p = parseFloat(f["border" + e + "Width"]) || 0;
                        q = parseFloat(f["border" + b + "Width"]) || 0;
                        b = f["margin" + b];
                        e = parseFloat(f["margin" + e]) || 0;
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
                        return c;
                    }

                    function handleLoadElements(item) {
                        return render(item, $scope.columns);
                    }

                    function handleReloadRows() {
                        $scope.columns = [];
                        reloadRows();
                    }
                    $scope.$watch($attrs.columnHeader, handleLoadElements);
                    $rootScope.$on("changeColumns", handleReloadRows);
                    windowElement.on('resize', onResize);
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
                    if (data.source_title === undefined) {
                        data.source_title = data.blog_name;
                    }

                    data.date = data.timestamp * 1000;

                    if (testURL(data.source_title)) {
                        data.avatar = '//placeimg.com/40/40/' + data.source_title;
                    } else {
                        data.avatar = '//api.tumblr.com/v2/blog/' + data.source_title + '.tumblr.com/avatar/40';
                    }
                    //url or name
                    function testURL(url) {
                        var objRE = /^[a-zA-Z0-9\-]+$/i;
                        return objRE.test(url);
                    }
                },
                text: function(data) {
                    data.body = $sce.trustAsHtml(data.body);
                },
                photo: function(data, params) {
                    for (var i = 0; i < data.photos.length; i++) {
                        data.photos[i].alt = getImage(data.photos[i], params.SIZE);
                    }

                    data.caption = $sce.trustAsHtml(data.caption);

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
                    data.player = $sce.trustAsHtml(data.player[1].embed_code);
                    data.caption = $sce.trustAsHtml(data.caption);
                },
                audio: function(data) {
                    data.player = $sce.trustAsHtml(data.player);
                    data.caption = $sce.trustAsHtml(data.caption);
                },
                link: function(data) {
                    data.description = $sce.trustAsHtml(data.description);
                },
                quote: function(data) {
                    data.text = $sce.trustAsHtml(data.text);
                    data.source = $sce.trustAsHtml(data.source);
                },
                answer: function() {
                    data.answer = $sce.trustAsHtml(data.answer);
                },
                chat: function() {
                    data.body = $sce.trustAsHtml(data.body);
                },
                ads: function() {
                    return null;
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

                function handleRequestFn(url, options, callFn) {
                    handleRequestFn.totalPendingRequests++;

                    if (options != null) {
                        var _options = {
                            params: {}
                        }
                        angular.extend(_options.params, options, httpOptions.params);
                        options = _options;
                    } else {
                        options = httpOptions;
                    }

                    return $http.jsonp(url, options)['finally'](function() {
                            handleRequestFn.totalPendingRequests--;
                        })
                        .then(function(response) {
                            if (callFn != null) {
                                return $q.resolve(callFn(response.data));
                            }
                            return $q.resolve(response.data);
                        }, handleError);

                    function handleError(resp) {
                        return $q.reject(resp);
                    }
                }

                handleRequestFn.totalPendingRequests = 0;

                return handleRequestFn;
            }];

        })     
        .directive('scroller', [
        	'$window', '$interval', ($window, $interval) =>
            ({
                restrict: 'A',
                scope: {
                    hwnd: '&',
                    bufferStatus: '=?'
                },
                link($scope, $elem, $attrs) {
               	const win = angular.element($window);
               	
               	let container = null;
                var scrollDistance, scrollEnabled, checkWhenEnabled, immediateCheck;

                /*	if set as false, the first call of manually 
                	(eg scrolling or pressing the button) 	*/
                immediateCheck = true;
                let checkInterval = false;

                function getElemByHeight(elem) {
                    const _elem = elem[0] || elem;
                    
                    if (isNaN(_elem.offsetHeight)) {
                        return _elem.document.documentElement.clientHeight;
                    }        
                    return _elem.offsetHeight;
                };

                function offsetTop(elem) {
                    if (!elem[0].getBoundingClientRect || elem.css('none')) {
                        return undefined;
                    }
                    return elem[0].getBoundingClientRect().top + pageYOffset(elem);
                };

                function pageYOffset(elem) {
                    const _elem = elem[0] || elem;
                    if (isNaN(window.pageYOffset)) {
                        return _elem.document.documentElement.scrollTop;
                    }  
                    return _elem.ownerDocument.defaultView.pageYOffset;
                };
                
                function handler() {
                    var containerBottom, elementBottom, remaining, shouldScroll, containerTopOffset;

                    if (container === win) {
                        containerBottom = getElemByHeight(container) + pageYOffset(container[0].document.documentElement);
                        elementBottom = offsetTop($elem) + getElemByHeight($elem);
                    } else {
                        containerBottom = getElemByHeight(container);
                        containerTopOffset = 0;
                        if (offsetTop(container) !== undefined) {
                            containerTopOffset = offsetTop(container);
                        }
                        elementBottom = offsetTop($elem) - containerTopOffset + getElemByHeight($elem);
                    }

                    remaining = elementBottom - containerBottom;
                    shouldScroll = remaining < getElemByHeight(container) * scrollDistance + 1;

                    if (shouldScroll) {
                        checkWhenEnabled = true;
                        if (scrollEnabled) {
                            return $scope.hwnd();
                        }
                    } else {
                        if (checkInterval) {
                            $interval.cancel(checkInterval);
                        }
                        return checkWhenEnabled = false;
                    }
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
                    } else {
                        throw new Exception("invalid container element.");
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
                
                checkInterval = $interval(function() {
                    if (immediateCheck) {
                        handler();
                    }
                    return $interval.cancel(checkInterval);
                });
                
                return checkInterval;
            }
        })
     ]);
}());