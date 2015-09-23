var app = angular.module('myApp', ['ng-walkthrough']);

app.controller('MainCtrl', function($scope) {
    $scope.demoCaption1 = "This is demoing the first classic transparency walk-through.\nit has a caption, " +
        "round marking of DOM element\n and 'single-tap' icon";
    $scope.demoCaption2 = "This is demoing the second classic transparency walk-through.\nit has a caption, " +
        "regular marking of DOM element,\n 'arrow' to DOM element as icon\n and a button to close the walkthrough";
    $scope.demoCaption4 = "This is demoing the tip walk-through.\nit has a caption in a text box, \n" +
        "an icon attached to the text box \n and a button to close the walkthrough";

    $scope.onClick = function(demoId){
        switch (demoId){
            case 1:
                $scope.demoActive1 = true;
                break;
            case 2:
                $scope.demoActive2 = true;
                break;
            case 3:
                $scope.demoActive3 = true;
                break;
            case 4:
                $scope.demoActive4 = true;
                break;
            case 5:
                $scope.demoActive5 = true;
                break;
        }
    };
});
