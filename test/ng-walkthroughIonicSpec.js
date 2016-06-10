describe('ionic specific Tests', function() {
    var $compile;
    var $rootScope;
    var $scope;
    var $httpBackend;
    var $timeout;
    var $ionicPosition;

    beforeEach(module('ionic'));
    beforeEach(module('ng-walkthrough'));

    //For the new Jasmine 2.0
    beforeEach(function (done) {
        done();
    });

    // Store references to $rootScope and $compile
    // so they are available to all tests in this describe block
    beforeEach(inject(function (_$compile_, _$rootScope_, _$timeout_, _$httpBackend_, $templateCache, _$ionicPosition_) {
        jasmine.getStyleFixtures().fixturesPath = 'base';
        loadStyleFixtures('test/css/ionic.css', 'css/ng-walkthrough.css');

        $httpBackend = _$httpBackend_;
        $httpBackend.when('GET', new RegExp('/\\.*')).respond(200, {
            result: 'Mocked $http'
        });

        // The injector unwraps the underscores (_) from around the parameter names when matching
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        $timeout = _$timeout_;
        $ionicPosition = _$ionicPosition_;
    }));

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it("Should adjust hole height given ionic navigation bar exists", function () {
        var walkthroughHoleDOM = ".walkthrough-hole";
        var walkthroughFocusItemDOM = "focus-item";
        var marginLeft = 50;
        var width = 150;
        var height = 80;
        var padding = 5;
        var html =
            '<div ng-view>'+
                '<walkthrough walkthrough-type="transparency" focus-element-selector="#' + walkthroughFocusItemDOM + '" icon="single_tap" main-caption="This is some text"' +
                    'is-active="isActive">' +
                '</walkthrough>' +
                '<ion-nav-bar class="bar-positive">' +
                '</ion-nav-bar>' +
                '<ion-nav-view>' +
                    '<ion-view view-title="title">' +
                        '<ion-content class="has-header">' +
                            '<div id="' + walkthroughFocusItemDOM + '" style="margin-left:' + marginLeft + 'px;width:' + width + 'px;background-color:blue;margin-top:100px;height:' + height + 'px;display: inline-block;">Focus Element</div>' +
                        '</ion-content>' +
                    '</ion-view>' +
                '</ion-nav-view>' +
            '</div>';
        setFixtures(html);
        $compile($("body"))($scope);
        $scope.$digest();

        //Act
        $scope.isActive = true;
        $scope.$digest();

        var walkthroughFocusedItem = $ionicPosition.offset($("#" + walkthroughFocusItemDOM));
        var walkthroughFocusedHole = $ionicPosition.offset($(walkthroughHoleDOM));

        //Assert
        expect(walkthroughFocusedHole.height).toBe(walkthroughFocusedItem.height + 2 * padding);
        expect(walkthroughFocusedHole.left).toBe(walkthroughFocusedItem.left - padding);
        expect(walkthroughFocusedHole.top).toBe(walkthroughFocusedItem.top - padding);
        expect(walkthroughFocusedHole.width).toBe(walkthroughFocusedItem.width + 2 * padding);
    });
});