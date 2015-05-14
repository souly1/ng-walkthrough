describe('ng-walkthrough Directive', function() {
    var $compile;
    var $rootScope;
    var $scope;
    var $httpBackend;
    var $timeout;

    var scripts = document.getElementsByTagName("script");
    var currentScriptPath = scripts[scripts.length-1].src;
    var templateUrl = currentScriptPath.replace(new RegExp("test\/ng-walkthroughSpec.js.*"), 'ng-walkthrough.html');
    // Load the myApp module, which contains the directive
    beforeEach(module('ng-walkthrough', 'ng-walkthrough.html'));

    // Store references to $rootScope and $compile
    // so they are available to all tests in this describe block
    beforeEach(inject(function(_$compile_, _$rootScope_, _$timeout_, _$httpBackend_, $templateCache){
        jasmine.getStyleFixtures().fixturesPath = 'base';
        loadStyleFixtures('css/ng-walkthrough.css');

        //assign the template to the expected url called by the directive and put it in the cache
        var template = $templateCache.get('ng-walkthrough.html');
        $templateCache.put(templateUrl, template);

        $httpBackend = _$httpBackend_;
        $httpBackend.when('GET', new RegExp('/\\.*')).respond(200, {
            result: 'Mocked $http'
        });

        // The injector unwraps the underscores (_) from around the parameter names when matching
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        $timeout = _$timeout_;
    }));

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('Should display the walkthough once display flag set', function(){
        //Arrange
        setFixtures('<walkthrough' +
        ' is-active="isActive">' +
        '</walkthrough>');
        $compile($("body"))($scope);
        $scope.$digest();
        var walkthrough = $('.walkthrough-background');

        expect(walkthrough).not.toHaveClass('walkthrough-active');

        //Act
        $scope.isActive = true;
        $scope.$digest();

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
    it("Should display the text from attribute 'main-caption'", function(){
        //Arrange
        var expectedText = "mocked walk-through text";
        setFixtures('<walkthrough' +
        ' is-active="isActive"' +
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
            expect(walkthroughText[0].innerText).toBe(expectedText);
        }, 100);
    });

    it("Should create highlight/focus on element with the given DOM id set in attribute 'focus-element-id'", function(){
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
        ' focus-element-id="' + mockedFocusItemId + '">' +
        '</walkthrough>');

        jasmine.getFixtures().appendSet('<div id="' + mockedFocusItemId  + '" style="margin-left:' + marginLeft + 'px;width:' + width + 'px;margin-top:' + marginTop + 'px;height:' + height + 'px;display: inline-block;"></div>');

        $compile($("body"))($scope);

        //Act
        $scope.isActive = true;
        $timeout.flush();
        var walkthroughFocusedItem = angular.element($("#"+mockedFocusItemId));
        var walkthroughFocusedHole = angular.element($(walkthroughHole));

        //Assert
        expect(walkthroughFocusedHole[0].offsetHeight).toBe(walkthroughFocusedItem[0].offsetHeight + 2* padding);
        expect(walkthroughFocusedHole[0].offsetLeft).toBe(walkthroughFocusedItem[0].offsetLeft - padding);
        expect(walkthroughFocusedHole[0].offsetTop).toBe(walkthroughFocusedItem[0].offsetTop - padding);
        expect(walkthroughFocusedHole[0].offsetWidth).toBe(walkthroughFocusedItem[0].offsetWidth + 2* padding);
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
        ' focus-element-id="' + mockedFocusItemId + '"' +
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
        expect((displayedIcon[0].attributes['src'].value).indexOf(expectedImage)).toBeGreaterThan(-1);
    };

    it("Should display icon from 'icons' folder given attribute 'icon' is legal icon name", function(){
        testIconLoadedWithExpectedImage("single_tap", "/icons/Single_Tap.png");
        testIconLoadedWithExpectedImage("double_tap", "/icons/Double_Tap.png");
        testIconLoadedWithExpectedImage("swipe_left", "/icons/Swipe_Left.png");
        testIconLoadedWithExpectedImage("swipe_right", "/icons/Swipe_Right.png");
        testIconLoadedWithExpectedImage("swipe_down", "/icons/Swipe_Down.png");
        testIconLoadedWithExpectedImage("swipe_up", "/icons/Swipe_Up.png");
    });

    it("Should display icon on focus element given it is set by 'focus-element-id'", function(){
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
        ' focus-element-id="' + mockedFocusItemId + '"' +
        ' icon="' + iconWanted + '">' +
        '</walkthrough>');

        jasmine.getFixtures().appendSet('<div id="' + mockedFocusItemId  + '" style="margin-left:' + marginLeft + 'px;width:' + width + 'px;margin-top:' + marginTop + 'px;height:' + height + 'px;display: inline-block;"></div>');
        $compile($("body"))($scope);

        //Act
        $scope.isActive = true;
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
        }, 100);
    });

    it("Should add left and top padding to icon selected in 'icon' attribute with attribute values 'icon-padding-left' and 'icon-padding-top'", function(){
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
        ' focus-element-id="' + mockedFocusItemId + '"' +
        ' icon-padding-left="' + paddingLeft + '"' +
        ' icon-padding-top="' + paddingTop + '"' +
        ' icon="' + iconWanted + '">' +
        '</walkthrough>');

        jasmine.getFixtures().appendSet('<div id="' + mockedFocusItemId  + '" style="margin-left:' + marginLeft + 'px;width:' + width + 'px;margin-top:' + marginTop + 'px;height:' + height + 'px;display: inline-block;"></div>');
        $compile($("body"))($scope);

        //Act
        $scope.isActive = true;
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
        ' focus-element-id="' + mockedFocusItemId + '"' +
        ' icon="' + arrowIcon + '">' +
        '</walkthrough>');

        jasmine.getFixtures().appendSet('<div id="' + mockedFocusItemId  + '" style="margin-left:' + marginLeft + 'px;width:' + width + 'px;margin-top:' + marginTop + 'px;height:' + height + 'px;display: inline-block;"></div>');
        $compile($("body"))($scope);

        //Act
        $scope.isActive = true;
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

    it("Should move text down if walkthrough image overlapping with it", function(){
        //Arrange
        var iconWanted = "single_tap";
        var walkthroughIconDOM = ".walkthrough-icon";
        var marginLeft = 50;
        var width = 150;
        var marginTop = 20;
        var height = 150;
        var mockedFocusItemId = "mockedFocusItem";
        var mockedCaption = "mockedCaption";
        setFixtures('<walkthrough' +
        ' is-active="isActive"' +
        ' focus-element-id="' + mockedFocusItemId + '"' +
        ' main-caption="' + mockedCaption + '"' +
        ' icon="' + iconWanted + '">' +
        '</walkthrough>');

        jasmine.getFixtures().appendSet('<div id="' + mockedFocusItemId  + '" style="margin-left:' + marginLeft + '%;width:' + width + 'px;margin-top:' + marginTop + 'px;height:' + height + 'px;display: inline-block;"></div>');
        $compile($("body"))($scope);

        //Act
        $scope.isActive = true;
        $timeout.flush();
        var displayedIcon = angular.element($(walkthroughIconDOM));
        var walkthroughCaption = angular.element(".walkthrough-text");



        //Assert
        //Timeout for  fails in Firefox => Travis
        window.setTimeout(function () {
            expect(displayedIcon[0].offsetTop + displayedIcon[0].offsetHeight).toBeLessThan(walkthroughCaption[0].offsetTop);
        }, 100);
    });

    it("Should use transcluded html if exists and disable rest of the predefined html", function(){
        //Arrange
        setFixtures('<walkthrough' +
        ' is-active="isActive">' +
        '<div id="new-transluded-data">transcluded data</div>' +
        '</walkthrough>');
        $compile($("body"))($scope);
        $scope.$digest();
        var walkthroughTransclude = $('.walkthrough-transclude > #new-transluded-data');
        var walkthroughNonTransclude = $('.walkthrough-non-transclude-template');

        //Act
        $scope.isActive = true;
        $scope.$digest();

        //Assert
        expect(walkthroughTransclude).toExist();
        expect(walkthroughNonTransclude).not.toBeVisible();
    });
});