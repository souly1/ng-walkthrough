var scripts = document.getElementsByTagName("script");
var currentScriptPath = scripts[scripts.length-1].src;
var templateUrl = currentScriptPath.replace(new RegExp("ng-walkthrough.js.*"), 'ng-walkthrough.html');
var iconsUrl = currentScriptPath.replace(new RegExp("ng-walkthrough.js.*"), 'icons/');

angular.module('ng-walkthrough', [])
	.directive("walkthrough", ['$log', '$timeout', '$window', '$injector',
	function($log, $timeout, $window, $injector) {
        var DOM_WALKTHROUGH_TRANSPARENCY_TEXT_CLASS = ".walkthrough-text";
        var DOM_WALKTHROUGH_TIP_TEXT_CLASS = ".walkthrough-tip-text-box";
        var DOM_WALKTHROUGH_HOLE_CLASS = ".walkthrough-hole";
        var DOM_WALKTHROUGH_TRANSPARENCY_ICON_CLASS = ".walkthrough-icon";
        var DOM_WALKTHROUGH_TIP_ICON_CLASS = ".walkthrough-tip-icon-text-box";
        var DOM_WALKTHROUGH_ARROW_CLASS = ".walkthrough-arrow";
        //var DOM_WALKTHROUGH_BACKGROUND_CLASS = "walkthrough-background";
        var DOM_WALKTHROUGH_DONE_BUTTON_CLASS = "walkthrough-done-button";
        var BUTTON_CAPTION_DONE = "Got it!";
        var PADDING_HOLE = 5;
        var PADDING_ARROW_START = 5;
        var gestureIcons = ["single_tap", "double_tap", "swipe_down", "swipe_left", "swipe_right", "swipe_up"];
        var hasIonic = false;
        var canTouch = true; //Used to prevent issue where onWalkthroughHide fired twice when have angular and ionic
                             //due to ontouch being called and then on-click called.
                             //issue can be seen at:
                             //https://github.com/angular/angular.js/issues/6251

        return {
            restrict: 'E',
            transclude: true,
            scope: {
                walkthroughType: '@',
                isActive: '=',
                icon: '@',
                focusElementSelector: '@',
                mainCaption: '@',
                forceCaptionLocation: '@',
                isRound: '=',
                hasGlow: '=',
                useButton: '=',
                iconPaddingLeft: '@',
                iconPaddingTop: '@',
                /**
                 * @deprecated Since version 0.3.1. Will be deleted in next versions. Use property forceCaptionLocation instead.
                 */
                tipLocation: '@',
                tipIconLocation: '@',
                tipColor: '@',
                isBindClickEventToBody: '=',
                onWalkthroughShow: '=',
                onWalkthroughHide: '=',
                doneButtonClass:"@"
            },
            link: function (scope, element, attrs, ctrl, $transclude) {
                var getIcon = function(icon){
                    var retval = null;
                    switch (icon){
                        case ("single_tap"):
                            retval = iconsUrl + "Single_Tap.png";
                            break;
                        case ("double_tap"):
                            retval = iconsUrl + "Double_Tap.png";
                            break;
                        case ("swipe_down"):
                            retval = iconsUrl + "Swipe_Down.png";
                            break;
                        case ("swipe_left"):
                            retval = iconsUrl + "Swipe_Left.png";
                            break;
                        case ("swipe_right"):
                            retval = iconsUrl + "Swipe_Right.png";
                            break;
                        case ("swipe_up"):
                            retval = iconsUrl + "Swipe_Up.png";
                            break;
                        case ("arrow"):
                            retval = ""; //Return nothing, using other dom element for arrow
                            break;
                    }
                    if (retval === null && icon && icon.length > 0){
                        retval = icon;
                    }
                    return retval;
                };

                var clickFunction = function clickFunction(e){
                    if (scope.clickEvent == 'click') {
                        if (!scope.useButton){
                            e.stopPropagation();
                            e.preventDefault();
                            scope.onCloseClicked(e);
                            $timeout(function () {
                                unbindClickEvents();
                            }, 1000);
                        }
                    }
                };

                var touchFunction = function touchFunction(e){
                    if (scope.clickEvent == 'touch') {
                        if (!scope.useButton) {
                            e.stopPropagation();
                            e.preventDefault();
                            scope.onCloseTouched(e);
                            $timeout(function () {
                                unbindClickEvents();
                            }, 1000);
                        }
                    }
                };

                var attemptTouchEvent = function(e){
                    if (scope.clickEvent == 'touch' && canTouch) { //We need this in case both angular an ionic are for some reason loaded
                        if ((!scope.useButton) ||
                            (e.currentTarget.className.indexOf(DOM_WALKTHROUGH_DONE_BUTTON_CLASS) > -1)) {
                            scope.closeWalkthrough();
                            canTouch = false;
                            $timeout(function(){
                                canTouch = true;
                            }, 500);
                        }
                    }
                };

                var resizeHandler = function(){
                    scope.setFocusOnElement(attrs.focusElementSelector);
                };

                var unbindClickEvents = function(){
                    angular.element(document.body).off('mousedown', clickFunction);
                    angular.element(document.body).off('mouseup', clickFunction);
                    angular.element(document.body).off('click', clickFunction);
                    angular.element(document.body).off('touch', touchFunction);
                };

                var bindClickEvents = function(){
                    $timeout(function(){
                        angular.element(document.body).on('mousedown', clickFunction);
                        angular.element(document.body).on('mouseup', clickFunction);
                        angular.element(document.body).on('click', clickFunction);
                        angular.element(document.body).on('touch', touchFunction);
                    }, 1000);
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

                    scope.clickEvent = 'click';
                    //noinspection JSUnresolvedVariable
                    if (hasIonic) { //Might need to comment this out if fails build on angular only machine
                        scope.clickEvent = 'touch';
                    }

                    //Event to close the walkthrough
                    scope.closeWalkthrough = function(){
                        scope.isActive = false;
                        if(scope.onWalkthroughHide)
                            scope.onWalkthroughHide();
                    };

                    //Event used when background clicked, if we use button then do nothing
                    scope.onCloseClicked = function($event) {
                        $event.stopPropagation();

                        //if Angular only
                        if (scope.clickEvent == 'click') {
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

                    scope.closeIcon = iconsUrl + "Hotspot-close.png";
                    scope.walkthroughIcon = getIcon(scope.icon);
                    scope.buttonCaption = BUTTON_CAPTION_DONE;
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

                var moveTextToBottom = function(newTop){
                    var textLocation =
                        "top:" + newTop + "px;" +
                        "margin-top: 10px;";
                    scope.walkthroughTextElement.attr('style', textLocation);
                };

                //Check if given icon covers text
                var isItemOnText = function(iconLeft, iconTop, iconRight, iconBottom) {
                    var offsetCoordinates = getOffsetCoordinates(scope.walkthroughTextElement);
                    var retval = false;
                    var textLeft = offsetCoordinates.left;
                    var textRight = offsetCoordinates.left + offsetCoordinates.width;
                    var textTop = offsetCoordinates.top;
                    var textBottom = offsetCoordinates.top + offsetCoordinates.height;
                    if (!(textRight < iconLeft ||
                        textLeft > iconRight ||
                        textBottom < iconTop ||
                        textTop > iconBottom)) {
                        retval = true;
                    }
                    return retval;
                };

                //Sets the icon displayed according to directive argument
                var setIconAndText = function(iconLeft, iconTop, paddingLeft, paddingTop){
                    var offsetCoordinates = getOffsetCoordinates(scope.walkthroughIconElement);
                    var iconHeight = offsetCoordinates.height;
                    var iconWidth = offsetCoordinates.width;
                    var iconLeftWithPadding = iconLeft + paddingLeft;
                    var iconTopWithPadding = iconTop + paddingTop;
                    var iconRight = iconLeftWithPadding + iconWidth;
                    var iconBottom = iconTopWithPadding + iconHeight;

                    //Check if text overlaps icon or user explicitly wants text at bottom, if does, move it to bottom
                    if (isItemOnText(iconLeftWithPadding, iconTopWithPadding, iconRight, iconBottom)){
                        moveTextToBottom(iconBottom);
                    }

                    var iconLocation =
                        "position: absolute;" +
                        "left:" + iconLeftWithPadding + "px;" +
                        "top:" + iconTopWithPadding + "px;" +
                        "margin-top:-" + iconHeight/6 + "px;" +
                        "margin-left:-" + iconWidth/4 + "px;";
                    scope.walkthroughIconElement.attr('style', iconLocation);
                };

                var setArrowAndText = function(pointSubjectLeft, pointSubjectTop, pointSubjectWidth, pointSubjectHeight, paddingLeft){
                    var offsetCoordinates = getOffsetCoordinates(scope.walkthroughTextElement);
                    var startLeft = offsetCoordinates.left + offsetCoordinates.width /2;
                    var startTop = offsetCoordinates.top + PADDING_ARROW_START;

                    if (scope.forceCaptionLocation === "TOP"){
                        startTop += offsetCoordinates.height;
                    }
                    var endTop = 0;
                    var endLeft = 0;

                    if (startLeft > pointSubjectLeft){//If hole left to text set arrow to point to middle right
                        endLeft = pointSubjectLeft + paddingLeft + pointSubjectWidth;
                        endTop = pointSubjectTop + (pointSubjectHeight/2);
                    } else if (startLeft < pointSubjectLeft){//If hole right to text set arrow to point to middle left
                        endLeft = pointSubjectLeft - paddingLeft;
                        endTop = pointSubjectTop + (pointSubjectHeight/2);
                    }

                    //Check if text overlaps icon or user explicitly wants text at bottom, if does, move it to bottom
                    if (isItemOnText(startLeft, startTop, endLeft, endTop)){
                        moveTextToBottom(startTop);
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
                        left = focusElement[0].offsetLeft;
                        top = focusElement[0].offsetTop;
                        var parent = focusElement[0].offsetParent;

                        while (parent) {
                            left = left + parent.offsetLeft;
                            top = top + parent.offsetTop;
                            parent = parent.offsetParent;
                        }
                    }
                    return { top:top, left: left, height: height, width: width};
                };

                //Attempts to highlight the given element ID and set Icon to it if exists, if not use default - right under text
                var setElementLocations = function(walkthroughIconWanted, focusElementSelector, iconPaddingLeft, iconPaddingTop){
                    var focusElement = document.querySelector(focusElementSelector);
                    var angularElement = angular.element(focusElement);
                    if (angularElement.length > 0) {

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
                            scope.$applyAsync(function () {
                                setIconAndText(left + width/2, top  + height/2, paddingLeft, paddingTop);
                            });
                        }
                        if (walkthroughIconWanted == "arrow"){
                            //Need to update text location according to conditional class added 'walkthrough-transparency-bottom'
                            scope.$applyAsync(function () {
                                setArrowAndText(left, top + paddingTop, width, height, paddingLeft);
                            });
                        }
                        //if tip mode with icon that we want to set padding to, set it
                        if (scope.walkthroughType== "tip" &&
                            walkthroughIconWanted && walkthroughIconWanted.length > 0 &&
                            (iconPaddingLeft || iconPaddingTop)){
                            setTipIconPadding(iconPaddingLeft, iconPaddingTop);
                        }
                    } else {
                        if (focusElementSelector) {
                            $log.info('Unable to find element requested to be focused: ' + focusElementSelector);
                        } else{
                            //if tip mode with icon that we want to set padding to, set it
                            if (scope.walkthroughType== "tip" &&
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

                var holeElements = element[0].querySelectorAll(DOM_WALKTHROUGH_HOLE_CLASS);
                scope.walkthroughHoleElements = angular.element(holeElements);
                var textClass = (scope.walkthroughType== "tip")? DOM_WALKTHROUGH_TIP_TEXT_CLASS: DOM_WALKTHROUGH_TRANSPARENCY_TEXT_CLASS;
                scope.walkthroughTextElement = angular.element(element[0].querySelector(textClass));
                var iconClass = (scope.walkthroughType== "tip")? DOM_WALKTHROUGH_TIP_ICON_CLASS: DOM_WALKTHROUGH_TRANSPARENCY_ICON_CLASS;
                scope.walkthroughIconElement = angular.element(element[0].querySelector(iconClass));
                scope.walkthroughArrowElement = angular.element(element[0].querySelector(DOM_WALKTHROUGH_ARROW_CLASS));
                $transclude(function(clone){
                    init(scope);
                    var transcludeContent = clone.text().trim();
                    if (!(transcludeContent.length === 0 && clone.length <= 1)) { //Transcluding
                        scope.hasTransclude = true;
                    }
                });

                var handleTipLocationDeprecated = function(){
                    console.warn("Since version 0.3.1 tipLocation is deprecated and will be deleted in next versions. Use property 'forceCaptionLocation' instead.");
                    //noinspection JSDeprecatedSymbols
                    scope.forceCaptionLocation = scope.tipLocation;
                };

                //noinspection JSDeprecatedSymbols
                if (scope.tipLocation){
                    handleTipLocationDeprecated();
                }

                scope.$watch('isActive', function(newValue){
                    if(newValue){
                        bindScreenResize();
                        if (scope.isBindClickEventToBody){
                            bindClickEvents();
                        }
                        if (!scope.hasTransclude){
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
                                }, 300);
                            }
                        }
                        if(scope.onWalkthroughShow)
                            scope.onWalkthroughShow();
                    } else{
                        unbindScreenResize();
                    }
                });
            },
            templateUrl: templateUrl
        };
    }]);
