angular.module('ng-walkthrough', [])
    .directive("walkthrough", ['$log', '$timeout', '$window', '$injector', '$compile',
        function($log, $timeout, $window, $injector, $compile) {
            var DOM_WALKTHROUGH_CLASS = "walkthrough-background";
            var DOM_WALKTHROUGH_TRANSPARENCY_TEXT_CLASS = ".walkthrough-text";
            var DOM_WALKTHROUGH_TIP_TEXT_CLASS = ".walkthrough-tip-text-box";
            var DOM_WALKTHROUGH_HOLE_CLASS = ".walkthrough-hole";
            var DOM_WALKTHROUGH_TRANSPARENCY_ICON_CLASS = ".walkthrough-icon";
            var DOM_WALKTHROUGH_TIP_ICON_CLASS = ".walkthrough-tip-icon-text-box";
            var DOM_WALKTHROUGH_ARROW_CLASS = ".walkthrough-arrow";
            var DOM_WALKTHROUGH_DONE_BUTTON_CLASS = "walkthrough-done-button";
            var DOM_TRANSCLUDE = "walkthrough-transclude";
            var BUTTON_CAPTION_DONE = "Got it!";
            var PADDING_HOLE = 5;
            var PADDING_ARROW_START = 5;
            var hasIonic = false;
            var canTouch = true; //Used to prevent issue where onWalkthroughHide fired twice when have angular and ionic
                                 //due to ontouch being called and then on-click called.
                                 //issue can be seen at:
                                 //https://github.com/angular/angular.js/issues/6251
            var ngWalkthroughTapIcons = null;

            var template = [
                '<div class= "' + DOM_WALKTHROUGH_CLASS + '" ng-class="{\'walkthrough-active\': isVisible}" ng-click="onCloseClicked($event)" on-touch="onCloseTouched($event)">',
                '<div class="walkthrough-container walkthrough-container-transparency" ng-show="walkthroughType==\'transparency\'">',
                '<div class="walkthrough-inner" >',
                '<div class="'+ DOM_TRANSCLUDE + '"></div>',
                '<div class="walkthrough-non-transclude-template" ng-show="!hasTransclude">',
                '<div class="walkthrough-text-container" ng-class="{\'walkthrough-top\': (!forceCaptionLocation || forceCaptionLocation==\'TOP\'), \'walkthrough-bottom\': forceCaptionLocation==\'BOTTOM\'}">',
                '<pre class="walkthrough-element walkthrough-text" ng-bind="mainCaption">',
                '</pre>',
                '</div>',
                '<img class="walkthrough-element walkthrough-icon" ng-show="icon && icon!=\'arrow\'" ng-src="{{walkthroughIcon}}">',
                '<div class="walkthrough-element walkthrough-arrow" ng-show="icon==\'arrow\'"></div>',
                '<button class="walkthrough-element walkthrough-button-positive walkthrough-done-button" type="button" ng-if="useButton" ng-click="onCloseClicked($event)" on-touch="onCloseTouched($event)">',
                '{{buttonCaption}}',
                '</button>',
                '</div>',
                '</div>',
                '</div>',
                '<div class="walkthrough-container walkthrough-container-tip" ng-show="walkthroughType==\'tip\'">',
                '<div class="walkthrough-inner" ng-class="{\'walkthrough-top\': ((!forceCaptionLocation && !tipLocation) || forceCaptionLocation==\'TOP\' || tipLocation ==\'TOP\'), \'walkthrough-bottom\': (forceCaptionLocation==\'BOTTOM\' || tipLocation ==\'BOTTOM\')}">',
                '<img class="walkthrough-element walkthrough-tip-icon-text-box" ng-class="{\'walkthrough-tip-icon-image-front\': tipIconLocation==\'FRONT\', \'walkthrough-tip-icon-image-back\': tipIconLocation==\'BACK\'}" ng-show="icon!=\'arrow\'" ng-src="{{walkthroughIcon}}" alt="icon">',
                '<button class="walkthrough-done-button walkthrough-tip-done-button-text-box" type="button" ng-if="useButton" ng-click="onCloseClicked($event)" on-touch="onCloseTouched($event)">',
                '<img class="walkthrough-tip-button-image-text-box" ng-src="{{closeIcon}}" alt="x">',
                '</button>',
                '<div class="walkthrough-element walkthrough-tip-text-box" ng-class="{\'walkthrough-tip-text-box-color-black\': tipColor==\'BLACK\', \'walkthrough-tip-text-box-color-white\': tipColor==\'WHITE\'}">',
                '<pre ng-bind="mainCaption">',
                '</pre>',
                '<div class="'+ DOM_TRANSCLUDE + '"></div>',
                '</div>',
                '</div>',
                '</div>',
                '<!-- Always show as this gives us the gray background -->',
                '<div ng-show="hasBackdrop" class="walkthrough-hole" ng-class="{\'walkthrough-hole-round\': isRound}">',
                '</div>',
                '<div ng-show="hasGlow && (focusElementSelector)" class="walkthrough-hole walkthrough-hole-glow" ng-class="{\'walkthrough-hole-round\': isRound}">',
                '</div>',
                '</div>'
            ].join('');

            return {
                restrict: 'E',
                transclude: true,
                scope: {
                    walkthroughType: '@',
                    isActive: '=',
                    icon: '@',
                    wid: '@?',
                    focusElementSelector: '@?',
                    mainCaption: '@?',
                    forceCaptionLocation: '@?',
                    isRound: '=?',
                    hasBackdrop: '=?',
                    hasGlow: '=?',
                    useButton: '=?',
                    iconPaddingLeft: '@?',
                    iconPaddingTop: '@?',
                    tipIconLocation: '@?',
                    tipColor: '@?',
                    onWalkthroughShow: '&',
                    onWalkthroughHide: '&'
                },
                link: function (scope, element, attrs, ctrl, $transclude) {
                    var getIcon = function(icon){
                        var retval = null;
                        if (ngWalkthroughTapIcons) {
                            switch (icon) {
                                case ("single_tap"):
                                    retval = ngWalkthroughTapIcons.single_tap;
                                    break;
                                case ("double_tap"):
                                    retval = ngWalkthroughTapIcons.double_tap;
                                    break;
                                case ("swipe_down"):
                                    retval = ngWalkthroughTapIcons.swipe_down;
                                    break;
                                case ("swipe_left"):
                                    retval = ngWalkthroughTapIcons.swipe_left;
                                    break;
                                case ("swipe_right"):
                                    retval = ngWalkthroughTapIcons.swipe_right;
                                    break;
                                case ("swipe_up"):
                                    retval = ngWalkthroughTapIcons.swipe_up;
                                    break;
                                case ("arrow"):
                                    retval = ""; //Return nothing, using other dom element for arrow
                                    break;
                            }
                        }
                        if (retval === null && icon && icon.length > 0){
                            retval = icon;
                        }
                        return retval;
                    };

                    var attemptTouchEvent = function(e){
                        if (scope.clickEvent === 'touch' && canTouch) { //We need this in case both angular and ionic are for some reason loaded
                            if ((!scope.useButton) ||
                                (e.currentTarget.className.indexOf(DOM_WALKTHROUGH_DONE_BUTTON_CLASS) > -1)) {
                                canTouch = false;
                                $timeout(function() {//This timeout added to avoid event propagation happening outside of directive bug
                                    scope.closeWalkthrough();
                                    $timeout(function () {
                                        canTouch = true;
                                    }, 500);
                                }, 200);
                            }
                        }
                    };

                    var resizeHandler = function(){
                        if (attrs.focusElementSelector) {
                            scope.setFocusOnElement(attrs.focusElementSelector);
                        }
                    };

                    var bindScreenResize = function(){
                        angular.element($window).on('resize', resizeHandler);
                    };

                    var unbindScreenResize = function(){
                        angular.element($window).off('resize', resizeHandler);
                    };

                    var init = function(scope){
                        try {
                            var ionic = $injector.get("$ionicPosition");
                            hasIonic = true;
                        } catch(err) {
                            hasIonic = false;
                        }

                        try {
                            ngWalkthroughTapIcons = $injector.get("ngWalkthroughTapIcons");
                        } catch(err) {
                            ngWalkthroughTapIcons = null;
                        }

                        scope.clickEvent = 'click';
                        //noinspection JSUnresolvedVariable
                        if (hasIonic) { //Might need to comment this out if fails build on angular only machine
                            scope.clickEvent = 'touch';
                        }

                        //Event to close the walkthrough
                        scope.closeWalkthrough = function(){
                            scope.isActive = false;
                            scope.onWalkthroughHide();
                        };

                        //Event used when background clicked, if we use button then do nothing
                        scope.onCloseClicked = function($event) {
                            $event.stopPropagation();

                            //if Angular only
                            if (scope.clickEvent === 'click') {
                                if ((!scope.useButton) ||
                                    ($event.currentTarget.className.indexOf(DOM_WALKTHROUGH_DONE_BUTTON_CLASS) > -1)) {
                                    scope.closeWalkthrough();
                                }
                            } else { //We need this in case both angular an ionic are for some reason loaded
                                attemptTouchEvent($event);
                            }
                        };

                        scope.onCloseTouched = function($event) {
                            $event.stopPropagation();
                            attemptTouchEvent($event);
                        };

                        $timeout(function(){
                            scope.closeIcon = close_icon;
                        },100);
                        scope.walkthroughIcon = getIcon(scope.icon);
                        scope.buttonCaption = BUTTON_CAPTION_DONE;
                        if (scope.hasBackdrop === undefined){
                            scope.hasBackdrop = (scope.walkthroughType !== "tip");
                        }
                    };

                    //Sets the walkthrough focus hole on given params with padding
                    var setFocus = function(left, top, width, height){
                        var holeDimensions =
                            "left:" + (left - PADDING_HOLE) + "px;" +
                            "top:" + (top - PADDING_HOLE) + "px;" +
                            "width:" + (width + (2 * PADDING_HOLE)) + "px;" +
                            "height:" + (height + (2 * PADDING_HOLE)) + "px;";
                        scope.walkthroughHoleElements.attr('style', holeDimensions);
                    };

                    //Check if given icon covers text
                    var isItemOnText = function(iconLeft, iconTop, iconRight, iconBottom) {
                        var offsetCoordinates = getOffsetCoordinates(scope.walkthroughTextElement);
                        var textLeft = document.body.clientWidth/4;//needs to be calculated differently due to being a 'pre'. //offsetCoordinates.left;
                        var textRight = document.body.clientWidth/4*3;//offsetCoordinates.left + offsetCoordinates.width;
                        var textTop = offsetCoordinates.top;
                        var textBottom = offsetCoordinates.top + offsetCoordinates.height;
                        return !(iconRight < textLeft ||
                        iconLeft > textRight ||
                        iconBottom < textTop ||
                        iconTop > textBottom);
                    };

                    //Sets the icon displayed according to directive argument
                    var setIconAndText = function(iconLeft, iconTop, paddingLeft, paddingTop){
                        var offsetCoordinates = getOffsetCoordinates(scope.walkthroughIconElement);
                        var iconHeight = offsetCoordinates.height;
                        var iconWidth = offsetCoordinates.width;
                        var iconLeftWithPadding = iconLeft + paddingLeft - (iconWidth/4);
                        var iconTopWithPadding = iconTop + paddingTop - (iconHeight/6);
                        var iconRight = iconLeftWithPadding + iconWidth;
                        var iconBottom = iconTopWithPadding + iconHeight;
                        //Check if text overlaps icon or user explicitly wants text at bottom, if does, move it to bottom
                        if (scope.forceCaptionLocation === undefined && isItemOnText(iconLeftWithPadding, iconTopWithPadding, iconRight, iconBottom)){
                            scope.forceCaptionLocation = "BOTTOM";
                        }

                        var iconLocation =
                            "position: absolute;" +
                            "left:" + iconLeftWithPadding + "px;" +
                            "top:" + iconTopWithPadding + "px;";
                        scope.walkthroughIconElement.attr('style', iconLocation);
                    };

                    var setArrowAndText = function(pointSubjectLeft, pointSubjectTop, pointSubjectWidth, pointSubjectHeight, paddingLeft){
                        var offsetCoordinates = getOffsetCoordinates(scope.walkthroughTextElement);
                        var startLeft = offsetCoordinates.left + offsetCoordinates.width /2;
                        var startTop = offsetCoordinates.top + offsetCoordinates.height + PADDING_ARROW_START;

                        var endLeft = 0;

                        if (startLeft > pointSubjectLeft){//If hole left to text set arrow to point to middle right
                            endLeft = pointSubjectLeft + paddingLeft + pointSubjectWidth;
                        } else if (startLeft < pointSubjectLeft){//If hole right to text set arrow to point to middle left
                            endLeft = pointSubjectLeft - paddingLeft;
                        }
                        var endTop = pointSubjectTop + (pointSubjectHeight/2);

                        var arrowLeft,arrowRight,arrowTop,arrowBottom;
                        //Check if text overlaps icon or user explicitly wants text at bottom, if does, move it to bottom
                        arrowLeft = (startLeft<endLeft)?startLeft:endLeft;
                        arrowRight = (startLeft<endLeft)?endLeft:startLeft;
                        arrowTop = (startTop<endTop)?startTop:endTop;
                        arrowBottom = (startTop<endTop)?endTop:startTop;

                        if (scope.forceCaptionLocation === undefined && isItemOnText(arrowLeft, arrowTop, arrowRight, arrowBottom)){
                            scope.forceCaptionLocation = "BOTTOM";
                        }

                        if (scope.forceCaptionLocation === "BOTTOM"){
                            startTop -= offsetCoordinates.height;
                        }

                        var arrowSvgDom =
                            '<svg width="100%" height="100%">' +
                            '<defs>' +
                            '<marker id="arrow" markerWidth="13" markerHeight="13" refx="2" refy="6" orient="auto">' +
                            '<path d="M2,1 L2,10 L10,6 L2,2" style="fill:#fff;" />' +
                            '</marker>' +
                            '</defs>' +
                            '<path d="M' + startLeft + ',' + startTop + ' Q' + startLeft + ',' + endTop + ' ' + endLeft + ',' + endTop + '"' +
                            'style="stroke:#fff; stroke-width: 2px; fill: none;' +
                            'marker-end: url(#arrow);"/>' +
                            '/>' +
                            '</svg>';


                        scope.walkthroughArrowElement.append(arrowSvgDom);
                    };

                    var setTipIconPadding = function(iconPaddingLeft, iconPaddingTop){
                        var iconLocation = "";
                        if (iconPaddingTop){
                            iconLocation += "margin-top:" + iconPaddingTop + "px;";
                        }
                        if (iconPaddingLeft){
                            iconLocation += "right:" + iconPaddingLeft + "%;";
                        }
                        scope.walkthroughIconElement.attr('style', iconLocation);
                    };

                    //Check once
                    var getSameAncestor = function(walkthroughElement, focusElement){
                        var retval = null;
                        var walkthroughElementParent = element[0].offsetParent;
                        var focusElementParent = focusElement[0].offsetParent;
                        var walkthroughAncestorIter = walkthroughElementParent;
                        var focusElementAncestorIter = focusElementParent;

                        while (walkthroughAncestorIter && !retval){
                            focusElementAncestorIter = focusElementParent; //reset
                            while (focusElementAncestorIter && !retval) {
                                if (focusElementAncestorIter === walkthroughAncestorIter){
                                    retval = walkthroughAncestorIter;
                                } else{
                                    focusElementAncestorIter = focusElementAncestorIter.offsetParent;
                                }
                            }
                            walkthroughAncestorIter = walkthroughAncestorIter.offsetParent;
                        }
                        return retval;
                    };

                    var getOffsetCoordinates = function(focusElement){
                        var width;
                        var height;
                        var left;
                        var top;
                        if (hasIonic) { //Might need to comment this out if fails build on angular only machine
                            var $ionicPosition = $injector.get('$ionicPosition');
                            var ionicElement = $ionicPosition.offset(focusElement);
                            width = ionicElement.width;
                            height = ionicElement.height;
                            left = ionicElement.left;
                            top = ionicElement.top;
                        } else {
                            width = focusElement[0].offsetWidth;
                            height = focusElement[0].offsetHeight;
                            left = focusElement[0].getBoundingClientRect().left;
                            top = focusElement[0].getBoundingClientRect().top;
                            //var parent = focusElement[0].offsetParent;

                            //while (parent) {
                            //    left = left + parent.offsetLeft;
                            //    top = top + parent.offsetTop;
                            //    parent = parent.offsetParent;
                            //}
                        }
                        var sameAncestorForFocusElementAndWalkthrough = getSameAncestor(element, focusElement);
                        while (sameAncestorForFocusElementAndWalkthrough) {
                            left = left - sameAncestorForFocusElementAndWalkthrough.offsetLeft;
                            top = top - sameAncestorForFocusElementAndWalkthrough.offsetTop;
                            sameAncestorForFocusElementAndWalkthrough = sameAncestorForFocusElementAndWalkthrough.offsetParent;
                        }
                        return { top:top, left: left, height: height, width: width};
                    };

                    var setWalkthroughElements = function(){
                        var holeElements = document.querySelectorAll(DOM_WALKTHROUGH_HOLE_CLASS);
                        scope.walkthroughHoleElements = angular.element(holeElements);
                        var textClass = (scope.walkthroughType === "tip")? DOM_WALKTHROUGH_TIP_TEXT_CLASS: DOM_WALKTHROUGH_TRANSPARENCY_TEXT_CLASS;
                        scope.walkthroughTextElement = angular.element(document.querySelector(textClass));
                        var iconClass = (scope.walkthroughType === "tip")? DOM_WALKTHROUGH_TIP_ICON_CLASS: DOM_WALKTHROUGH_TRANSPARENCY_ICON_CLASS;
                        scope.walkthroughIconElement = angular.element(document.querySelector(iconClass));
                        scope.walkthroughArrowElement = angular.element(document.querySelector(DOM_WALKTHROUGH_ARROW_CLASS));
                        $transclude(function(clone){
                            init(scope);
                            var transcludeContent = clone.text().trim();
                            if (!(transcludeContent.length === 0 && clone.length <= 1)) { //Transcluding
                                var transclude = document.querySelectorAll('.' + DOM_TRANSCLUDE);
                                var transcludeIndex = (scope.walkthroughType && scope.walkthroughType.toUpperCase()==="TIP")?1:0;
                                angular.element(transclude[transcludeIndex]).append(clone);
                                scope.hasTransclude = true;
                            }
                        });
                    };

                    //Attempts to highlight the given element ID and set Icon to it if exists, if not use default - right under text
                    var setElementLocations = function(walkthroughIconWanted, focusElementSelector, iconPaddingLeft, iconPaddingTop){
                        var focusElement = (focusElementSelector)?document.querySelectorAll(focusElementSelector): null;
                        if (focusElement && focusElement.length>0) {
                            if (focusElement.length > 1) {
                                $log.warn('Multiple items fit selector, displaying first visible as focus item');
                                for (var i=0;i<focusElement.length;i++) {
                                    if (focusElement[i].offsetHeight) {//offsetHeight not of 0 means visible
                                        focusElement = focusElement[i];
                                        i = focusElement.length;
                                    }
                                }
                            } else{
                                focusElement = focusElement[0];
                            }
                        } else{
                            $log.error('No element found with selector: ' + focusElementSelector);
                            focusElement = null;
                        }
                        var angularElement = (focusElement)?angular.element(focusElement):null;
                        if (angularElement && angularElement.length > 0) {
                            var offsetCoordinates = getOffsetCoordinates(angularElement);
                            var width = offsetCoordinates.width;
                            var height = offsetCoordinates.height;
                            var left = offsetCoordinates.left;
                            var top = offsetCoordinates.top;

                            setFocus(left, top, width, height);
                            var paddingLeft = parseFloat(iconPaddingLeft);
                            var paddingTop = parseFloat(iconPaddingTop);
                            if (!paddingLeft) { paddingLeft = 0;}
                            if (!paddingTop) { paddingTop = 0;}

                            //If Gesture icon given bind it to hole as well
                            if (walkthroughIconWanted && walkthroughIconWanted !== "arrow" && scope.walkthroughType === "transparency"){
                                $timeout(function(){
                                    setIconAndText(left + width/2, top  + height/2, paddingLeft, paddingTop);
                                }, 10);
                            }
                            if (walkthroughIconWanted === "arrow"){
                                //Need to update text location according to conditional class added 'walkthrough-transparency-bottom'
                                $timeout(function(){
                                    setArrowAndText(left, top + paddingTop, width, height, paddingLeft);
                                }, 10);
                            }
                            //if tip mode with icon that we want to set padding to, set it
                            if (scope.walkthroughType === "tip" &&
                                walkthroughIconWanted && walkthroughIconWanted.length > 0 &&
                                (iconPaddingLeft || iconPaddingTop)){
                                setTipIconPadding(iconPaddingLeft, iconPaddingTop);
                            }
                        } else {
                            if (focusElementSelector) {
                                $log.info('Unable to find element requested to be focused: ' + focusElementSelector);
                            } else{
                                //if tip mode with icon that we want to set padding to, set it
                                if (scope.walkthroughType === "tip" &&
                                    walkthroughIconWanted && walkthroughIconWanted.length > 0 &&
                                    (iconPaddingLeft || iconPaddingTop)){
                                    setTipIconPadding(iconPaddingLeft, iconPaddingTop);
                                }
                            }
                        }
                    };

                    scope.setFocusOnElement = function(focusElementSelector){
                        setElementLocations(scope.icon, focusElementSelector, scope.iconPaddingLeft, scope.iconPaddingTop);
                    };

                    var createDomElement = function(){
                        angular.element(document.body).append(template);
                        setWalkthroughElements();
                        var walkthroughElement = angular.element(document.querySelectorAll('.' + DOM_WALKTHROUGH_CLASS));
                        if (scope.wid !== undefined && scope.wid !== null && scope.wid.length>0) {
                            walkthroughElement.attr('id', scope.wid);
                        }
                        $compile(walkthroughElement)(scope);
                    };

                    var removeDomElement = function(){
                        var walkthroughElement = angular.element(document.querySelectorAll('.' + DOM_WALKTHROUGH_CLASS));
                        if (walkthroughElement && walkthroughElement.length > 0) {
                            walkthroughElement.remove();
                        }
                    };

                    scope.$watch('isActive', function(newValue){
                        if(newValue){
                            bindScreenResize();
                            createDomElement();
                            $timeout(function(){
                                scope.isVisible = true;
                            }, 300);

                            //if (!scope.hasTransclude){//remarked, caused focusing issues
                            try {
                                if (attrs.focusElementSelector) {
                                    scope.setFocusOnElement(attrs.focusElementSelector);
                                }
                            } catch(e){
                                $log.warn('failed to focus on element prior to timeout: ' + attrs.focusElementSelector);
                            }
                            //Must timeout to make sure we have final correct coordinates after screen totally load
                            if (attrs.focusElementSelector) {
                                $timeout(function () {
                                    scope.setFocusOnElement(attrs.focusElementSelector);
                                }, 100);
                            }
                            //}
                            scope.onWalkthroughShow();
                        } else{
                            scope.isVisible = false;
                            unbindScreenResize();
                            removeDomElement();
                        }
                    });

                    var close_icon = "data:image/png;base64,"+
                        "iVBORw0KGgoAAAANSUhEUgAAAG4AAABuCAYAAADGWyb7AAAAAXNSR0IArs4c6QAAAAlwSFlzAAAL"+
                        "EwAACxMBAJqcGAAABCZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6"+
                        "eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYg"+
                        "eG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4K"+
                        "ICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6dGlm"+
                        "Zj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOmV4aWY9"+
                        "Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIgogICAgICAgICAgICB4bWxuczpkYz0iaHR0"+
                        "cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0"+
                        "cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyI+CiAgICAgICAgIDx0aWZmOlJlc29sdXRpb25Vbml0"+
                        "PjE8L3RpZmY6UmVzb2x1dGlvblVuaXQ+CiAgICAgICAgIDx0aWZmOkNvbXByZXNzaW9uPjU8L3Rp"+
                        "ZmY6Q29tcHJlc3Npb24+CiAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjcyPC90aWZmOlhSZXNv"+
                        "bHV0aW9uPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgog"+
                        "ICAgICAgICA8dGlmZjpZUmVzb2x1dGlvbj43MjwvdGlmZjpZUmVzb2x1dGlvbj4KICAgICAgICAg"+
                        "PGV4aWY6UGl4ZWxYRGltZW5zaW9uPjExMDwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgICAg"+
                        "IDxleGlmOkNvbG9yU3BhY2U+MTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgICA8ZXhpZjpQaXhl"+
                        "bFlEaW1lbnNpb24+MTEwPC9leGlmOlBpeGVsWURpbWVuc2lvbj4KICAgICAgICAgPGRjOnN1Ympl"+
                        "Y3Q+CiAgICAgICAgICAgIDxyZGY6U2VxLz4KICAgICAgICAgPC9kYzpzdWJqZWN0PgogICAgICAg"+
                        "ICA8eG1wOk1vZGlmeURhdGU+MjAxNTowNzowNSAyMTowNzo0NzwveG1wOk1vZGlmeURhdGU+CiAg"+
                        "ICAgICAgIDx4bXA6Q3JlYXRvclRvb2w+UGl4ZWxtYXRvciAzLjIuMTwveG1wOkNyZWF0b3JUb29s"+
                        "PgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4K36AZ"+
                        "FwAAETZJREFUeAHtnWuMVdUZhvcMMBeRQXGmSrVemqaUHyUabERIoWhQE02alKYk+qdNS38Apoht"+
                        "YiwQo3hJEwaVgm3AWmM0ATvxR5tGodSMSVtsQGlrSjFNtVYFC1IHEZgZZk7fZ3v2zN5nX9ba5+xz"+
                        "G/aXLPZl3d93f2t961vrDI6TS1Mi0NKUrXacNrW7XWFKMUzWlTBJgT61Fq+6OAWF0eJ1RNezxTCs"+
                        "K2FQYUihqaQZiIOETl/o0H3W7YbcMwqnfQGyG1ayBiCrjqI95xcDpNW6nRAJiScVPlZAUxtKag1I"+
                        "UudpyzSFLoXzkhLWOA4SP1E4UbzyXHdpBOLQrgsVIIw5qpEFzYPA/ykwV9ZN6kkchsVFCmhZPdtR"+
                        "DvhoHUPohwoYODWXegCGhkEYGlaP+rMEGQLRQAisqQbWEjjqYkicoYClOJEEC/S4AkNoTebAWhGH"+
                        "ZXixAuuviSysBz9QwCKtqlSbOMrvVkDTspK21tbWRW1tbYtU4OyWlhbK7ywUCm26n6SANvs1elRx"+
                        "aAHXEcUzJ53W/TFdDw4NDfWPjo726z7LRTiaR/lV075qEodn4xIFrpXK9Z2dnUtVyNzh4eGekZGR"+
                        "KZ9yUWmxmmRbWpxJkyYNT5ky5ahK23/69Ok+Xf9UecmuR+aIysEzk7lUizgsRYZG/5eftvFf6ujo"+
                        "WCFtmCeypmdFlKkRECkSB6TVe8+cObNV6f9hypMQz9zH0IkFmqlUg7getbDsobG9vf1GacCawcHB"+
                        "z0uzKiG+YqDUjlG1519qR6/as6eCAhk60ejMJEviKIuhEW1LLQLoZgF1t77yy6VlWbYrdVtKM0j7"+
                        "CtL+d0TgRhH4Umm85TPus8MKmcx7WQGEZlyqgPWYSgTIQhG2VnPLFSIsVd5aJxaBjubaf4vADfrA"+
                        "XimjfqzN9xQq7mgWxOGmgjS89mmkRyD0yqr7ioDIoh1p6q4orT60gqzaffrY7lJBaYdAdiEgryLH"+
                        "daWAoWmXKaQiTcPiKmnXchkdqfKpnoYSGTFnpIXbNHz+NGXDIO9dhbI1rxLiyAtpaYbHLmnZkxpm"+
                        "5tTKSlT7qipYoRru/yrt+64qwv1lKwybkFfWnFeJN36mKp1q20oNL/M0vDwn0q6wzdMs6c6ePXux"+
                        "RpFvqb1v6IOEDBvByc4at6ylQrnE4a24wKZ1pJGWfUMd2qT5zJpo27IbJZ3m6Y7JkyffJgKPiMiD"+
                        "lu3CBcjIdcoy/ViycojD3P/MWAmGm6lTp35bc9k6BXYFJrRo3sbltlgf6ifq7wHLzjLV4G5L5XJL"+
                        "SxxfCPOa1dw4ffr072lo/JE6kbYeVdGcIvIw2BZMmzZNNsvga5a94JgG6zxrSzMNoJ4xYqU5Im35"+
                        "qVOnfijS6Mg5JSKvRWF+CvLAFs2zNm7SEIcriy/DKAyPRU0750jzwCmSNy/FsIlCgJfVfGdLHF8D"+
                        "TmOjYIhIy5jTbMs2ltmsCSBPbZ8vg+WwpcECzhBn3E23AZfK8YwY08rkv07W46MizWo4VZkTXkRe"+
                        "qwyWRQqvWS4VIG/ABIzNUIan32bnukuehMdEGuuTXHwIgInkUb3inI1JwNq4u2IiDs3hjIhRNBxs"+
                        "07xmrNBY0ARNADaaRrZZdg/ME0ct0/CHQYLqJopIW6XF9dcTE+WRjhbplwgrrn82wMH0hFJxEDdS"+
                        "kjSOIc9GtXs0di9XiKwgfzmOABgpfF9vUAiTgH3stJNEHGcfYT5RpP6PStua2suf2MGMI4VVu5ZL"+
                        "my2KBXs4iJQ44hhfjTvZ8oovUkPmRpacv4xFQPPd1cLua7EJxiPgIHKuiyMOI8OobexcN9sm6Dgm"+
                        "9bsDM2H3Y4sWwEGkwRdFHImNc5uGyNu0B3W5ReV5kggEwA4MI6JKX8FFSImiiEM9Tdamo53fNVpc"+
                        "llaSP1siAHZgaJEcLkLTVhRxRm2TSXuzvhi8KblUgAAYgqVFESFOSoljIjT+qFDj8w9ybbOA25AE"+
                        "DMHSkIxoOAkYKaXE2Xj/Z2uf6SqLyvIkFggUsZxtkTTATWriZMaulFVUms+i3jxJFAJgCaZRcSXv"+
                        "YomDDKN7S+p9XUmB+WOFCFhiCjdjCjN2o5dEhMxOf5s0Hs/XvlJoovSnye/TIwCmYGvICTdjilVK"+
                        "XGJeWUDfnGhGCcfKBVpiv6sdCaZga1FPecTJQdoQ7i2ArhRsCLvllluc559/3tm+fbt7bwFc1ZJY"+
                        "YjtGnN/ENDmK27QhGOv0rFqPSgoG7GXLljldXV1OX1+fs3PnTkdDTUmq5EdtajqrVq1yent7Awl3"+
                        "797NlkvgXa0eitiyiZp0TC/EERm+mBT0ha7U9jt7N3UL0rLCU089pY9zXDZu3FiQ68i6TTpNXVi3"+
                        "bt14AcU7fQQFyq9X/8AWjJM4KMbB1ZiVwlHoRNFXulh9TExT7UjqR9P8smbNGmfz5s3OeecZ/QaO"+
                        "SHPuvfde5/777/cX4d6jvfXSNhpA38A41LDwiwBXbJUnapyAeYPy6x00VBZ1JHh55plnCjrHGNs+"+
                        "Tf6FDRs2BDMVn9BaHR+PzVurPhcxTuRBbQkcJeHoXWIGDUdHatWBpHo0nBRWr14dScCuXbsKM2fO"+
                        "DBEgLS1s2bIlMo8Mk1RDbVLbKo0rYpzIg+oIHJPEYZyYQav7gUobllV+DSmR8xTMHD16tHDTTTcV"+
                        "enp63DBr1qzCnj17IkljvtRXHiI6q3amLaeIcSIPKtN17nsLGDbr/BamHoMisFbJektME8xRvSfW"+
                        "PXv37nX/1MXChQsDFTHX3XHHHa6lSbrHH3/cWbBgQSAND88++6yzYsUKR8fkQ3H1esFwLYx/Zqif"+
                        "vTSUyBWcxolMCxDM1Ib5OmkL81bcEChDo3Do0KFITWNITZoP69VPadywiQfFw9WYi+sLuvd7UYgL"+
                        "iIj7u75OT0MDcfV8wMp84YUXnBtuuMGqGceOHXPmzJnjHD582Cp9LRPJ6h3VGZ5rVCc/NY4TNO6f"+
                        "iWSV5MRX1nBy4sQJd8jbt2+fsW0MnQyjjUgajVf7wNjqB6Mecd41tvNaIBrTxGaucsTx48ed++67"+
                        "z0kiD9IeeeQR5/XXX69ya8ovXuM6xAW2byJKc3loWDIiGpy/8iHgEWc89aOvwZjGV25Nb2fMmOFq"+
                        "3LXXXhtbL07le+65x7nmGqaQxpSiS5FfpiaJy4NHXFJCLw6LsuEE42Tr1q1OEmleoyGPZYAW6d6r"+
                        "hrriXFCDPrJplEec0SXeiBqn5YDz8MMPR1qUzGlvvvlmCIPu7m7n6aefdrQcCMXV+4WIQ5uSLEqa"+
                        "6HKVhjgjubXsOA7jtWvXuhZlab2eIYIDOspgWbJkifPEE084OsNfmrXezzb7UwEecpdXAzgX0ri8"+
                        "vC8sdzI3AHHlOJnzbZ0m3dZhpk70Vepr6FOauvoqsbrYqS4VtmZsvPzsfmuhXprdfb799tvr2jew"+
                        "lbH1KxMPinetKs84Mf7BZ524/b3WGcpXP6F+XFx+4dzInXfeaeXllx/Qeeihh5z169f7i3Dvly5d"+
                        "WvEBpFChKV7QN507edkii8uVt02D5x9T1CMylF+WWr+2HYa17RD789ZQpoxfcLRgx44dbqms38o5"+
                        "LAR5uL5OnjwZOCxU+kFk3HRjcTrvArb9hoRw5B4m8qvQ5/Ry7PhXVAEaLvv1C5NLouJq+c47mlfJ"+
                        "GREW49pwdZYvX+5qMR/Eiy++WMtuBOrCMBG2iwIvww+n9eo/vPYT163nwHkGEvhF80ivtnZu9b9r"+
                        "9nsIZJiq5CPIAgNh+1the5ehrOOKP0Ya/9AIm4miea6Pjk4kYbFeb9LAVNhimJhkjCM/C7zEsooV"+
                        "dfAPOsIQtA5iU+cRtgiAKdga0sNNJHFMfGMRcYVofnk1Li5/Xx4ClpjCDRy54tc4Xpi2FDC7t6ii"+
                        "sQI+LSb/t1wEwBJMLfIHuElNnCo4qIXiWxYV5UksEChiedAiaSJxeKeN59U0Hj820YwUC+AyTwKG"+
                        "YGlRcOhvWJZqHGUMmAqSBfSS1h3vmdLl8ckICMP3wTI5lRsb4iSKOFQysOcTVbDM6E251kUhY/cO"+
                        "7IRh8Hde0VnhIjBMkiyKOMxOo8mvVf6vtWh0V/EUlEs6BMAODC1ywUVomRZFHGXx/52FEhPhF/nW"+
                        "HpBVZEznz5Pf6882CTM5lB+0wAJs4SIkccRhpHwcSl3yQn8Frl9W0f6S1/mjAQHtdP9Fc9vLhmRE"+
                        "w0HkcQa/r7K0HHYBrlRISkOeHu1z/U5e99DPXInMJYiAsBoUVjfq7dFgTOgJbXtbgd8ThCRO40hI"+
                        "BuNcpzRH5aR9EkdtLskIgJGGye1glpzSjQX7SNKINaHNft2VCkkEK1r7QZ2dOzTZXu0+5P9EIiCM"+
                        "DgijZZGRwZd4pt5WiBwmSWoijjQzFLq5MUiX5rvdGrutfrRgKGvCRQubj4TNEnXMZhRj64YtnFgx"+
                        "apJyYtW4u66xpXwacULrktXydMeqtyH/hI0GE7BRB21IA+tIS9IPkO3v3TjnMN2fMepejXtXX9YR"+
                        "jeWLdW/zUUQVM6HeibQRHflYJ23bbdkxPFKxQ6RXhi1xFAQRiUcbKFRru4Mydzn//lWRZzMUk21C"+
                        "ikgbVXhQ89pOyw6iaTZaaf4Tvr4K2Q86X8E7YOSLCt5qcfk3nc0fEnHXn6vkiTCODPbqUNIvg+jE"+
                        "PjGqWf9M1lbjvNogj78QY9QkDQ2vFcmbd66Rh6aJtE0DAwPbPOAMV6xIhkijj9grJy1xFIzx4R7K"+
                        "9AqJu4q8/fphxSmdOJ1/rpAHaZoqfqLjfk/G4RLxnr8hg1JYS1riKBirB40zzndu4qGhA/IWYLAs"+
                        "FHnl1EcxTSEibVgL7PXa0X4uRYMx+7EJUkm5QLKxh0us3aY2DBZ16IA6tlgbhxPSNSZrekAjy0q5"+
                        "s3bZYFJMgyHy3xTpx5Ia56qxlOEb8l6qYP7rZ+N5+Q/cfyHn9JfVyfG3TXyHG0t9ekNa9h11w8oi"+
                        "LHaXj595rSwgytW4Yt3uBh/EGS3NYoZBad9OfZ2t0sA50j7bfF59DXXVFHBGa7Sf60O8Ww1zz/Rb"+
                        "NpBfnZZNGnVUonFeG1nfXaaQdgjs0ZfK/4Q1VwRm0Q6vPVW/6qMriLT9Wp/hDbFxGPvbBGnvKlR0"+
                        "Ui4rwCDvswpphk0lF9sdHQsFxDqBcLmMF/ddo/7DcQN9bO/oQ3tAWvZKGe1keHxfoeKOZkUcfaAs"+
                        "fhBitVQgg18EyG0CZo0IvLTRCCwS9p7a1av2/cbf7hT3bIpi9pc1p5XWkyVxXtnsJMzwHtJeNf8t"+
                        "kQbepTXgVfqy0eS6idoxqva8pXZsSuFrjGovJr/7Y42oyHLeVYM42oHWXaxQCfCz5X1YKWPmOoWu"+
                        "Wmkh2iWD44TCq8UTxgfpUJnCkPiBgvEYSNryq0Uc7WhTmKlgtdYjQ5zoy+c/QV+qJcRc+UG7pQFT"+
                        "slpOFHel+f+ej+l+vzSrT+X/Ma4tKd57vkccFplLNYmjsZTP0HkhDxlJm7Rikaw6/lP0WSKwW9ep"+
                        "urbryn+WzhJHl5ZWveOL18VdNI7wrPdDun6i6zFdD8mq7Zc29ytdlgDj5WdozGQ+UzkhqTZxXoUs"+
                        "FRg6K9Y+r8AGvaJlDI2Y/FWVWhFHJ6jrAoWLFCqZ+5S94QTN/lABn2PVtMzf61oS59WLtwSrkx31"+
                        "etTvtSOLKyRxrh+r0bhrnUWFXhn1BA4CmfsgsNk0EA2DMOaymhKm+lypJ3FeGzAmPAIr9Z16ZVbr"+
                        "yn6kR5j1pmc1GtMIxHn9oi0cjUADU7vOvEKqcGU4PKmA5x+XVU3mMNWTKI1EnL+haB6LeIhkw7bW"+
                        "7YQcdqRZOBMYGhtKag1IOZ2njWggBLKsIGQ9J0IMJjwBwhpGs9SWSGkG4qIa7u2+c/UCWkrwSPXm"+
                        "S28ughzuCZyb8QJrL+5zyRGoPgL/B+Nop/F9kw+nAAAAAElFTkSuQmCC";
                }
            };
        }]);
