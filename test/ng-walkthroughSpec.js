describe('ng-walkthrough Directive', function() {
    var $compile;
    var $rootScope;
    var $scope;
    var $httpBackend;
    var $timeout;
    var ngWalkthroughTapIcons;

    beforeEach(module('ng-walkthrough'));

    //For the new Jasmine 2.0
    beforeEach(function(done) {
        done();
    });

    // Store references to $rootScope and $compile
    // so they are available to all tests in this describe block
    beforeEach(inject(function(_$compile_, _$rootScope_, _$timeout_, _$httpBackend_, _ngWalkthroughTapIcons_){
        jasmine.getStyleFixtures().fixturesPath = 'base';
        loadStyleFixtures('css/ng-walkthrough.css');

        $httpBackend = _$httpBackend_;
        $httpBackend.when('GET', new RegExp('/\\.*')).respond(200, {
            result: 'Mocked $http'
        });

        // The injector unwraps the underscores (_) from around the parameter names when matching
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        $timeout = _$timeout_;
        ngWalkthroughTapIcons = _ngWalkthroughTapIcons_;
    }));

    afterEach(function() {
        removeWalkthroughElement();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    var removeWalkthroughElement = function(){
        var walkthroughElement = angular.element(document.querySelectorAll('.walkthrough-background'));
        if (walkthroughElement && walkthroughElement.length > 0) {
            walkthroughElement.remove();
        }
    };

    it('Should display the walkthough once display flag set', function(){
        //Arrange
        setFixtures('<walkthrough' +
        ' is-active="isActive">' +
        '</walkthrough>');
        $compile($("body"))($scope);
        $scope.$digest();
        var walkthrough = $('.walkthrough-background');

        expect(walkthrough.length).toBe(0);

        //Act
        $scope.isActive = true;
        $scope.$digest();
        $timeout.flush();

        walkthrough = $('.walkthrough-background');

        //Assert
        expect(walkthrough).toHaveClass('walkthrough-active');
    });

    it("Should turn off 'isActive'' flag once walkthrough is closed/hidden", function(){
        //Arrange
        setFixtures('<walkthrough' +
        ' is-active="isActive">' +
        '</walkthrough>');
        $compile($("body"))($scope);
        $scope.isActive = true;
        $scope.$digest();

        var walkthrough = $('.walkthrough-background');

        //Act
        walkthrough.click();
        $scope.$digest();

        //Assert
        expect($scope.isActive).toBe(false);
    });

    it("Should close the walkthrough upon click anywhere when attribute 'use-button' not set to 'true'", function(){
        //Arrange
        setFixtures('<walkthrough' +
        ' is-active="isActive"' +
        ' use-button=true>' +
        '</walkthrough>');
        $compile($("body"))($scope);
        $scope.isActive = true;
        $scope.$digest();

        var walkthrough = $('.walkthrough-background');

        //Act
        walkthrough.click();
        $scope.$digest();

        //Assert
        expect($scope.isActive).toBe(true);
    });

    it("Should close the walkthrough upon click on close button when attribute 'use-button' set to 'true'", function(){
        //Arrange
        setFixtures('<walkthrough' +
        ' walkthrough-type="transparency"' +
        ' is-active="isActive"' +
        ' use-button=true>' +
        '</walkthrough>');
        $compile($("body"))($scope);
        $scope.isActive = true;
        $scope.$digest();

        var walkthroughButton = $('.walkthrough-done-button');

        //Act
        walkthroughButton.click();
        $scope.$digest();

        //Assert
        expect($scope.isActive).toBe(false);
    });

    it("Should not close the walkthrough upon click anywhere other than close button when attribute 'use-button' set to 'true'", function(){
        //Arrange
        //Arrange
        setFixtures('<walkthrough' +
        ' is-active="isActive"' +
        ' use-button=true>' +
        '</walkthrough>');
        $compile($("body"))($scope);
        $scope.isActive = true;
        $scope.$digest();

        var walkthrough = $('.walkthrough-background');

        //Act
        walkthrough.click();
        $scope.$digest();

        //Assert
        expect($scope.isActive).toBe(true);
    });

    //Test fails in Firefox => Travis
    it("Should display the text from attribute 'main-caption'", function(done){
        //Arrange
        var expectedText = "mocked walk-through text";
        setFixtures('<walkthrough' +
        ' is-active="isActive"' +
        ' walkthrough-type="transparency"' +
        ' main-caption="{{caption}}">' +
        '</walkthrough>');
        $compile($("body"))($scope);

        //Act
        $scope.isActive = true;
        $scope.caption = expectedText;
        $scope.$digest();
        var walkthroughText = $('.walkthrough-text');

        //Assert
        window.setTimeout(function () {
            expect(walkthroughText[0].textContent).toBe(expectedText);
            done();
        }, 100);
    });

    it("Should create highlight/focus on element with the given DOM id set in attribute 'focus-element-selector'", function(){
        //Arrange
        var marginLeft = 50;
        var width = 150;
        var marginTop = 50;
        var height = 150;
        var padding = 5;

        var walkthroughHole = ".walkthrough-hole";
        var mockedFocusItemId = "mockedFocusItem";
        setFixtures('<walkthrough' +
        ' is-active="isActive"' +
        ' walkthrough-type="transparency"' +
        ' focus-element-selector="#' + mockedFocusItemId + '">' +
        '</walkthrough>');

        jasmine.getFixtures().appendSet('<div id="' + mockedFocusItemId  + '" style="margin-left:' + marginLeft + 'px;width:' + width + 'px;margin-top:' + marginTop + 'px;height:' + height + 'px;display: inline-block;"></div>');

        $compile($("body"))($scope);

        //Act
        $scope.isActive = true;
        $timeout.flush();
        $timeout.flush();
        var walkthroughFocusedItem = angular.element($("#"+mockedFocusItemId));
        var walkthroughFocusedHole = angular.element($(walkthroughHole));

        //Assert
        expect(walkthroughFocusedHole[0].offsetHeight).toBe(walkthroughFocusedItem[0].offsetHeight + 2* padding);
        expect(walkthroughFocusedHole[0].offsetLeft).toBe(walkthroughFocusedItem[0].offsetLeft - padding);
        expect(walkthroughFocusedHole[0].offsetTop).toBe(walkthroughFocusedItem[0].offsetTop - padding);
        expect(walkthroughFocusedHole[0].offsetWidth).toBe(walkthroughFocusedItem[0].offsetWidth + 2* padding);
    });

    it("Should create highlight/focus on element with the given DOM selector set in attribute 'focus-element-selector'", function(){
        //Arrange
        var marginLeft = 50;
        var width = 150;
        var marginTop = 50;
        var height = 150;
        var padding = 5;

        var walkthroughHole = ".walkthrough-hole";
        var mockedFocusItemClass = "mockedFocusItemClass";
        var mockedFocusItemSelector = "div." + mockedFocusItemClass;
        setFixtures('<walkthrough' +
        ' is-active="isActive"' +
        ' walkthrough-type="transparency"' +
        ' focus-element-selector="' + mockedFocusItemSelector + '">' +
        '</walkthrough>');

        jasmine.getFixtures().appendSet('<div class="' + mockedFocusItemClass  + '" style="margin-left:' + marginLeft + 'px;width:' + width + 'px;margin-top:' + marginTop + 'px;height:' + height + 'px;display: inline-block;"></div>');

        $compile($("body"))($scope);

        //Act
        $scope.isActive = true;
        $timeout.flush();
        var walkthroughFocusedItem = angular.element($(mockedFocusItemSelector));
        var walkthroughFocusedHole = angular.element($(walkthroughHole));

        //Assert
        expect(walkthroughFocusedHole[0].offsetHeight).toBe(walkthroughFocusedItem[0].offsetHeight + 2* padding);
        expect(walkthroughFocusedHole[0].offsetLeft).toBe(walkthroughFocusedItem[0].offsetLeft - padding);
        expect(walkthroughFocusedHole[0].offsetTop).toBe(walkthroughFocusedItem[0].offsetTop - padding);
        expect(walkthroughFocusedHole[0].offsetWidth).toBe(walkthroughFocusedItem[0].offsetWidth + 2* padding);
    });
    
    it("Should add glow around highlight/focus element when attribute 'has-glow' set to 'true'", function(){
        //Arrange
        var marginLeft = 50;
        var width = 150;
        var marginTop = 50;
        var height = 150;
        var padding = 5;

        var walkthroughHoleGlowClass = ".walkthrough-hole-glow";
        var mockedFocusItemId = "mockedFocusItem";
        setFixtures('<walkthrough' +
        ' is-active="isActive"' +
        ' has-glow="true"'+
        ' walkthrough-type="transparency"' +
        ' focus-element-selector="#' + mockedFocusItemId + '">' +
        '</walkthrough>');

        jasmine.getFixtures().appendSet('<div id="' + mockedFocusItemId  + '" style="margin-left:' + marginLeft + 'px;width:' + width + 'px;margin-top:' + marginTop + 'px;height:' + height + 'px;display: inline-block;"></div>');

        $compile($("body"))($scope);

        //Act
        $scope.isActive = true;
        $timeout.flush();
        $timeout.flush();
        var walkthroughFocusedItem = angular.element($("#"+mockedFocusItemId));
        var walkthroughHoleGlow = angular.element($(walkthroughHoleGlowClass));

        //Assert
        expect(walkthroughHoleGlow[0]).toBeVisible();
        expect(walkthroughHoleGlow[0].offsetHeight).toBe(walkthroughFocusedItem[0].offsetHeight + 2* padding);
        expect(walkthroughHoleGlow[0].offsetLeft).toBe(walkthroughFocusedItem[0].offsetLeft - padding);
        expect(walkthroughHoleGlow[0].offsetTop).toBe(walkthroughFocusedItem[0].offsetTop - padding);
        expect(walkthroughHoleGlow[0].offsetWidth).toBe(walkthroughFocusedItem[0].offsetWidth + 2* padding);
    });

    it("Should make highlighted area shaped as circle  when attribute 'is-round' set to 'true'", function(){
        //Arrange
        var marginLeft = 50;
        var width = 150;
        var marginTop = 50;
        var height = 150;
        var walkthroughHole = ".walkthrough-hole";
        var mockedFocusItemId = "mockedFocusItem";
        setFixtures('<walkthrough' +
        ' is-active="isActive"' +
        ' focus-element-selector="#' + mockedFocusItemId + '"' +
        ' is-round=true>' +
        '</walkthrough>');

        jasmine.getFixtures().appendSet('<div id="' + mockedFocusItemId  + '" style="margin-left:' + marginLeft + 'px;width:' + width + 'px;margin-top:' + marginTop + 'px;height:' + height + 'px;display: inline-block;"></div>');

        $compile($("body"))($scope);

        //Act
        $scope.isActive = true;
        $timeout.flush();
        var walkthroughFocusedHole = angular.element($(walkthroughHole));

        //Assert
        expect(walkthroughFocusedHole).toHaveClass('walkthrough-hole-round');
    });

    var testIconLoadedWithExpectedImage = function(iconWanted, expectedImage){
        //Arrange
        var walkthroughIconDOM = ".walkthrough-icon";

        setFixtures('<walkthrough' +
        ' is-active="isActive"' +
        ' icon="' + iconWanted + '">' +
        '</walkthrough>');
        $compile($("body"))($scope);

        //Act
        $scope.isActive = true;
        $timeout.flush();
        var displayedIcon = angular.element($(walkthroughIconDOM));

        //Assert
        expect(displayedIcon[0].attributes['src'].value).toBe(expectedImage);
    };

    it("Should display single tap icon from 'icons' folder given attribute 'icon' is legal icon name", function(){
        testIconLoadedWithExpectedImage("single_tap", ngWalkthroughTapIcons.single_tap);
    });

    it("Should display double tap icon from 'icons' folder given attribute 'icon' is legal icon name", function(){
        testIconLoadedWithExpectedImage("double_tap", ngWalkthroughTapIcons.double_tap);
    });

    it("Should display swipe left icon from 'icons' folder given attribute 'icon' is legal icon name", function(){
        testIconLoadedWithExpectedImage("swipe_left", ngWalkthroughTapIcons.swipe_left);
    });

    it("Should display swipe right icon from 'icons' folder given attribute 'icon' is legal icon name", function(){
        testIconLoadedWithExpectedImage("swipe_right", ngWalkthroughTapIcons.swipe_right);
    });

    it("Should display swipe down icon from 'icons' folder given attribute 'icon' is legal icon name", function(){
        testIconLoadedWithExpectedImage("swipe_down", ngWalkthroughTapIcons.swipe_down);
    });

    it("Should display swipe up icon from 'icons' folder given attribute 'icon' is legal icon name", function(){
        testIconLoadedWithExpectedImage("swipe_up", ngWalkthroughTapIcons.swipe_up);
    });

    it("Should display icon on focus element given it is set by 'focus-element-selector'", function(done){
        //Arrange
        var iconWanted = "single_tap";
        var walkthroughIconDOM = ".walkthrough-icon";
        var marginLeft = 50;
        var width = 150;
        var marginTop = 50;
        var height = 150;
        var mockedFocusItemId = "mockedFocusItem";

        setFixtures('<walkthrough' +
        ' is-active="isActive"' +
        ' walkthrough-type="transparency"' +
        ' focus-element-selector="#' + mockedFocusItemId + '"' +
        ' icon="' + iconWanted + '">' +
        '</walkthrough>');

        jasmine.getFixtures().appendSet('<div id="' + mockedFocusItemId  + '" style="margin-left:' + marginLeft + 'px;width:' + width + 'px;margin-top:' + marginTop + 'px;height:' + height + 'px;display: inline-block;"></div>');
        $compile($("body"))($scope);

        //Act
        $scope.isActive = true;
        $timeout.flush();
        $timeout.flush();
        var displayedIcon = angular.element($(walkthroughIconDOM));
        var walkthroughFocusedItem = angular.element($("#"+mockedFocusItemId));

        var expectedIconLeftOffset = walkthroughFocusedItem[0].offsetLeft + walkthroughFocusedItem[0].offsetWidth/2
            - displayedIcon[0].offsetWidth/4; //Middle of focus item
        var expectedIconTopOffset = walkthroughFocusedItem[0].offsetTop + walkthroughFocusedItem[0].offsetHeight/2
            - displayedIcon[0].offsetHeight/6; //Middle of focus item

        //Assert
        expect(displayedIcon[0].offsetLeft).toBe(Math.round(expectedIconLeftOffset));
        //Timeout or fails in Firefox => Travis
        window.setTimeout(function () {
            expect(displayedIcon[0].offsetTop).toBe(Math.round(expectedIconTopOffset));
            done();
        }, 100);
    });

    it("Should add left and top padding to icon selected in 'icon' attribute with attribute values 'icon-padding-left' and 'icon-padding-top'", function(done){
        //Arrange
        var iconWanted = "single_tap";
        var walkthroughIconDOM = ".walkthrough-icon";
        var marginLeft = 50;
        var width = 150;
        var marginTop = 50;
        var height = 150;
        var paddingLeft = 20;
        var paddingTop = 30;
        var mockedFocusItemId = "mockedFocusItem";

        setFixtures('<walkthrough' +
        ' is-active="isActive"' +
        ' walkthrough-type="transparency"' +
        ' focus-element-selector="#' + mockedFocusItemId + '"' +
        ' icon-padding-left="' + paddingLeft + '"' +
        ' icon-padding-top="' + paddingTop + '"' +
        ' icon="' + iconWanted + '">' +
        '</walkthrough>');

        jasmine.getFixtures().appendSet('<div id="' + mockedFocusItemId  + '" style="margin-left:' + marginLeft + 'px;width:' + width + 'px;margin-top:' + marginTop + 'px;height:' + height + 'px;display: inline-block;"></div>');
        $compile($("body"))($scope);

        //Act
        $scope.isActive = true;
        $timeout.flush();
        $timeout.flush();
        var displayedIcon = angular.element($(walkthroughIconDOM));
        var walkthroughFocusedItem = angular.element($("#"+mockedFocusItemId));

        var expectedIconLeftOffset = walkthroughFocusedItem[0].offsetLeft + walkthroughFocusedItem[0].offsetWidth/2
        - displayedIcon[0].offsetWidth/4 + paddingLeft; //Middle of focus item
        var expectedIconTopOffset = walkthroughFocusedItem[0].offsetTop + walkthroughFocusedItem[0].offsetHeight/2
            - displayedIcon[0].offsetHeight/6 + paddingTop; //Middle of focus item

        //Assert
        expect(displayedIcon[0].offsetLeft).toBe(Math.round(expectedIconLeftOffset));
        //Timeout for fails in Firefox => Travis
        window.setTimeout(function () {
            expect(displayedIcon[0].offsetTop).toBe(Math.round(expectedIconTopOffset));
            done();
        }, 100);
    });

    it("Should display arrow directing to focus element from text area if attribute 'icon' is set to 'arrow'", function(){
        //Arrange
        var arrowIcon = "arrow";
        var walkthroughArrowDOM = "svg > path";
        var marginLeft = 50;
        var width = 150;
        var marginTop = 50;
        var height = 150;
        var mockedFocusItemId = "mockedFocusItem";

        setFixtures('<walkthrough' +
        ' is-active="isActive"' +
        ' walkthrough-type="transparency"' +
        ' focus-element-selector="#' + mockedFocusItemId + '"' +
        ' icon="' + arrowIcon + '">' +
        '</walkthrough>');

        jasmine.getFixtures().appendSet('<div id="' + mockedFocusItemId  + '" style="margin-left:' + marginLeft + 'px;width:' + width + 'px;margin-top:' + marginTop + 'px;height:' + height + 'px;display: inline-block;"></div>');
        $compile($("body"))($scope);

        //Act
        $scope.isActive = true;
        $timeout.flush();
        $timeout.flush();
        var displayedArrow = angular.element($(walkthroughArrowDOM));
        var walkthroughFocusedItem = angular.element($("#"+mockedFocusItemId));

        var expectedArrowLeftOffset = walkthroughFocusedItem[0].offsetLeft + walkthroughFocusedItem[0].offsetWidth;
        var expectedArrowTopOffset = walkthroughFocusedItem[0].offsetTop + walkthroughFocusedItem[0].offsetHeight/2; //Middle of focus item

        var arrowPath = displayedArrow[0].attributes['d'].textContent;
        var arrowPathPoints = arrowPath.split(/[\s,]+/);
        //Assert
        expect(arrowPathPoints[4]).toBe(Math.round(expectedArrowLeftOffset).toString());
        expect(arrowPathPoints[5]).toBe(Math.round(expectedArrowTopOffset).toString());
    });

    it("Should load external image file if attribute 'icon' is set to path to a file", function(){
        //Arrange
        var iconWanted = "www.mocked.icon.com";
        var walkthroughIconDOM = ".walkthrough-icon";
        var marginLeft = 50;
        var width = 150;
        var marginTop = 50;
        var height = 150;
        var mockedFocusItemId = "mockedFocusItem";

        setFixtures('<walkthrough' +
                        ' walkthrough-type="transparency"' +
                        ' is-active="isActive"' +
                        ' icon="' + iconWanted + '">' +
                    '</walkthrough>');

        jasmine.getFixtures().appendSet('<div id="' + mockedFocusItemId  + '" style="margin-left:' + marginLeft + 'px;width:' + width + 'px;margin-top:' + marginTop + 'px;height:' + height + 'px;display: inline-block;"></div>');
        $compile($("body"))($scope);

        //Act
        $scope.isActive = true;
        $timeout.flush();
        var displayedIcon = angular.element($(walkthroughIconDOM));

        //Assert
        expect((displayedIcon[0].attributes['src'].value).indexOf(iconWanted)).toBeGreaterThan(-1);
    });

    it("Should fire event set in attribute 'on-walkthrough-show' once walkthrough opened", function(){
        //Arrange
        $scope.onWalkthroughShow = function(){};
        spyOn($scope, 'onWalkthroughShow').and.callFake(function(){});
        setFixtures('<walkthrough' +
        ' is-active="isActive"' +
        ' on-walkthrough-show="onWalkthroughShow()">' +
        '</walkthrough>');
        $compile($("body"))($scope);

        //Act
        $scope.isActive = true;
        $timeout.flush();

        //Assert
        expect($scope.onWalkthroughShow).toHaveBeenCalled();
    });

    it("Should fire event set in attribute 'on-walkthrough-hide' once walkthrough closed", function(){
        //Arrange
        $scope.onWalkthroughHide = function(){};
        spyOn($scope, 'onWalkthroughHide').and.callFake(function(){});
        setFixtures('<walkthrough' +
        ' is-active="isActive"' +
        ' on-walkthrough-hide="onWalkthroughHide()">' +
        '</walkthrough>');
        $compile($("body"))($scope);
        $scope.isActive = true;
        $scope.$digest();
        var walkthrough = $('.walkthrough-background');

        //Act
        walkthrough.click();
        $scope.$digest();

        //Assert
        expect($scope.onWalkthroughHide).toHaveBeenCalled();
    });

    it("Should move text down if walkthrough image overlapping with it", function(done){
        //Arrange
        var iconWanted = "single_tap";
        var walkthroughIconDOM = ".walkthrough-icon";
        var marginLeft = 25;//cover text with icon
        var width = 150;
        var marginTop = 20;
        var height = 70;
        var mockedFocusItemId = "mockedFocusItem";
        var mockedCaption = "mockedCaption, a bit long";
        setFixtures('<walkthrough' +
        ' is-active="isActive"' +
        ' walkthrough-type="transparency"' +
        ' focus-element-selector="#' + mockedFocusItemId + '"' +
        ' main-caption="' + mockedCaption + '"' +
        ' icon="' + iconWanted + '">' +
        '</walkthrough>');

        jasmine.getFixtures().appendSet('<div id="' + mockedFocusItemId  + '" style="margin-left:' + marginLeft + '%;width:' + width + 'px;margin-top:' + marginTop + 'px;height:' + height + 'px;display: inline-block;">Focus On Me</div>');
        $compile($("body"))($scope);
        $scope.isActive = true;

        //Act
        $scope.$digest();
        $timeout.flush();
        loadStyleFixtures('css/ng-walkthrough.css');
        var displayedIcon = angular.element($(walkthroughIconDOM));
        var walkthroughCaption = angular.element(".walkthrough-text");


        //Assert
        //Timeout for fails in Firefox => Travis
        window.setTimeout(function () {
            expect(displayedIcon.offset().top + displayedIcon.height()).toBeLessThan(walkthroughCaption.offset().top);
            done();
        }, 100);
    });

    it("Should use transcluded html if exists and disable rest of the predefined html", function(){
        //Arrange
        setFixtures('<walkthrough' +
        ' walkthrough-type="transparency"' +
        ' is-active="isActive">' +
        '<div id="new-transluded-data">transcluded data</div>' +
        '</walkthrough>');
        $compile($("body"))($scope);
        $scope.$digest();

        //Act
        $scope.isActive = true;
        $scope.$digest();

        var walkthroughTransclude = $('.walkthrough-transclude > #new-transluded-data');
        var walkthroughNonTransclude = $('.walkthrough-non-transclude-template');

        //Assert
        expect(walkthroughTransclude).toExist();
        expect(walkthroughNonTransclude).not.toBeVisible();
    });

    it("Should display tip walkthrough text box without any icon", function(){
        //Arrange
        var mockedCaption = "mockedCaption";
        setFixtures('<walkthrough' +
        ' is-active="isActive"' +
        ' walkthrough-type="tip"' +
        ' main-caption="' + mockedCaption + '">' +
        '</walkthrough>');
        $compile($("body"))($scope);
        $scope.$digest();

        //Act
        $scope.isActive = true;
        $scope.$digest();

        var walkthroughTipTextBox = $('.walkthrough-tip-text-box');

        //Assert
        expect(walkthroughTipTextBox[0]).toBeVisible();
    });

    it("Should display tip walkthrough text box with white text on black background", function(){
        //Arrange
        var mockedCaption = "mockedCaption";
        setFixtures('<walkthrough' +
        ' is-active="isActive"' +
        ' walkthrough-type="tip"' +
        ' tip-color="BLACK"' +
        ' main-caption="' + mockedCaption + '">' +
        '</walkthrough>');
        $compile($("body"))($scope);
        $scope.$digest();

        //Act
        $scope.isActive = true;
        $scope.$digest();

        var walkthroughTipTextBox = $('.walkthrough-tip-text-box-color-black');

        //Assert
        expect(walkthroughTipTextBox[0]).toExist();
    });

    it("Should display tip walkthrough text box with white text on white background", function(){
        //Arrange
        var mockedCaption = "mockedCaption";
        setFixtures('<walkthrough' +
        ' is-active="isActive"' +
        ' walkthrough-type="tip"' +
        ' tip-color="WHITE"' +
        ' main-caption="' + mockedCaption + '">' +
        '</walkthrough>');
        $compile($("body"))($scope);
        $scope.$digest();

        //Act
        $scope.isActive = true;
        $scope.$digest();

        var walkthroughTipTextBox = $('.walkthrough-tip-text-box-color-white');

        //Assert
        expect(walkthroughTipTextBox[0]).toExist();
    });

    it("Should display tip walkthrough text box at bottom part of screen", function(){
        //Arrange
        var mockedCaption = "mocked caption at bottom";
        setFixtures('<walkthrough' +
        ' is-active="isActive"' +
        ' walkthrough-type="tip"' +
        ' force-caption-location="BOTTOM"' +
        ' main-caption="' + mockedCaption + '">' +
        '</walkthrough>');
        $compile($("body"))($scope);
        $scope.$digest();

        //Act
        $scope.isActive = true;
        $scope.$digest();

        var documentRectangle = document.body.getBoundingClientRect();
        var walkthroughTipTextBox = $('.walkthrough-container-tip > .walkthrough-bottom');

        //Assert
        expect(walkthroughTipTextBox[0]).toExist();
    });

    it("Should display transparency walkthrough text at bottom part of screen", function(){
        //Arrange
        var mockedCaption = "mocked caption at bottom";
        setFixtures('<walkthrough' +
            ' is-active="isActive"' +
            ' walkthrough-type="transparency"' +
            ' force-caption-location="BOTTOM"' +
            ' main-caption="' + mockedCaption + '">' +
            '</walkthrough>');
        $compile($("body"))($scope);
        $scope.$digest();

        //Act
        $scope.isActive = true;
        $scope.$digest();

        var walkthroughTransparencyTextBox = $('.walkthrough-container-transparency .walkthrough-bottom');

        //Assert
        expect(walkthroughTransparencyTextBox[0]).toExist();
    });

    it("Should display tip walkthrough text box at top part of screen", function(){
        //Arrange
        var mockedCaption = "mocked caption at top";
        setFixtures('<walkthrough' +
        ' is-active="isActive"' +
        ' walkthrough-type="tip"' +
        ' force-caption-location="TOP"' +
        ' main-caption="' + mockedCaption + '">' +
        '</walkthrough>');
        $compile($("body"))($scope);
        $scope.$digest();

        //Act
        $scope.isActive = true;
        $scope.$digest();

        var walkthroughTipTextBox = $('.walkthrough-container-tip > .walkthrough-top');

        //Assert
        expect(walkthroughTipTextBox[0]).toExist();
    });

    it("Should display tip walkthrough text box with icon on top of it", function(){
        //Arrange
        var mockedCaption = "mockedCaption";
        var iconWanted = "single_tap";
        setFixtures('<walkthrough' +
        ' is-active="isActive"' +
        ' icon="' + iconWanted + '"' +
        ' walkthrough-type="tip"' +
        ' tip-icon-location="FRONT"' +
        ' main-caption="' + mockedCaption + '">' +
        '</walkthrough>');
        $compile($("body"))($scope);
        $scope.$digest();

        //Act
        $scope.isActive = true;
        $scope.$digest();

        var walkthroughTipTextBoxIcon = $('.walkthrough-tip-icon-image-front');

        //Assert
        expect(walkthroughTipTextBoxIcon[0]).toExist();
    });

    it("Should display tip walkthrough text box with icon behind it", function(){
        //Arrange
        var mockedCaption = "mockedCaption";
        var iconWanted = "single_tap";
        setFixtures('<walkthrough' +
        ' is-active="isActive"' +
        ' icon="' + iconWanted + '"' +
        ' walkthrough-type="tip"' +
        ' tip-icon-location="BACK"' +
        ' main-caption="' + mockedCaption + '">' +
        '</walkthrough>');
        $compile($("body"))($scope);
        $scope.$digest();

        //Act
        $scope.isActive = true;
        $scope.$digest();

        var walkthroughTipTextBoxIcon = $('.walkthrough-tip-icon-image-back');

        //Assert
        expect(walkthroughTipTextBoxIcon[0]).toExist();
    });

    it("Should update hole location in 'transparency' walkthrough when screen resizes", function(done) {
        //Arrange
        var walkthroughHole = ".walkthrough-hole";
        var mockedFocusItemId = "mockedFocusItem";
        var mockedCaption = "mockedCaption";
        var iconWanted = "single_tap";
        var marginLeft = 50;
        var width = 150;
        var height = 150;
        var padding = 5;
        var expectedFocusOnElementCalls = 1;

        setFixtures('<walkthrough' +
        ' id="walkthrough"' +
        ' is-active="isActive"' +
        ' icon="' + iconWanted + '"' +
        ' focus-element-selector="#' + mockedFocusItemId + '"' +
        ' walkthrough-type="transparency"' +
        ' main-caption="' + mockedCaption + '">' +
        '</walkthrough>');
        jasmine.getFixtures().appendSet("<div id='" + mockedFocusItemId  + "' style='margin-left:" + marginLeft + "px;width:" + width + "px;background-color:green;height:" + height + "px;display: inline-block;'></div>");

        $compile($("body"))($scope);
        $scope.$digest();
        $scope.isActive = true;
        $scope.$digest();
        $timeout.flush();
        var callCount = 0;
        var directiveScope = angular.element('body').find('#walkthrough').isolateScope();
        spyOn(directiveScope, 'setFocusOnElement').and.callFake(function() {
            callCount++;
        });
        expect(callCount).toBe(0);

        $(window).on('resize', function(){
            //Assert
            expect(callCount).toBe(expectedFocusOnElementCalls);
            done();
        });

        //Act
        $(window).resize();
        $scope.isMoved = true;
        $scope.$digest();
    });
});
