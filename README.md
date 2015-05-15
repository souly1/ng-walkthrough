[![Build Status](https://travis-ci.org/souly1/ng-walkthrough.svg?branch=master)](https://travis-ci.org/souly1/ng-walkthrough)

# ng-walkthrough

After not finding a walkthrough/on-boarding/tour guide/learning page directive which was responsive, dynamic, easy to use and thus good for our [Fitness Meal Planner](http://www.fitnessmealplanner.com) mobile web App I decided to create one.

One of the most common design challenges emerging in mobile design is that of 'invitation' - creating an explanation walk through during user first interaction with the app so to engage the customer.
Following Theresa Neil's design pattern from [Mobile Design Pattern Gallery] (http://www.amazon.com/gp/product/1449314325/ref=as_li_ss_tl?ie=UTF8&tag=uxbo09-20&linkCode=as2&camp=217145&creative=399373&creativeASIN=1449314325)

This directive implements a walkthrough via the transparency pattern (an explanation about the different patterns can be found online at [ux booth](http://www.uxbooth.com/articles/mobile-design-patterns/))

# Special features
 - Either use transclude or given attributes which contain basics such as text, gesture image, 'got it' button
 - Automatically leave a given DOM element highlighted. For better explanation see demo.
 - Use any image you want or gesture image from the given collection (such as swipe with direction or tap) and place it bound to the element mentioned above.
 - move text to bottom if item is covering the text with icon or arrow

## ScreenShots
Classic, Classic with arrow and Totally customizable respectively:

![alt tag](/screenshots/screenshot1.png)
![alt tag](/screenshots/screenshot2.png)
![alt tag](/screenshots/screenshot3.png)

# Demo

A demo was created to show the 2 basic overlay types in 3 demoes fitting the screenshot examples -  one basic template, one with arrows, and the last freestyle one using transclude.
[Demo can be found here](http://plnkr.co/edit/kHM9zHCxAA3gPYvedmdw?p=preview)

## Requirements

- AngularJS
- No need for JQuery as JQLite is used

## Notes

This directive has been originally developed for the [Ionic Framework](http://ionicframework.com), so it supports both angular and ionic apps.

## Installation

* **Bower**: `bower install ng-walkthrough`

## Usage

- Copy the gesture icon files to folder 'icons' under where you placed the directive javascript
- Load the script files in your application:

Leave the template html aside the directive's javascript

```html
<link rel="stylesheet" href="wherever-you-put-it/ng-walkthrough.css">

<script type="text/javascript" src="wherever-you-put-it/ng-walkthrough.js"></script>
```

Add dependencies on the `ng-walkthrough` AngularJS module:

```javascript
angular.module('myApp', ['ng-walkthrough']);
```
You can now use the directive, add the element to your HTML:
```html
<walkthrough>
  ...
</walkthrough>
```
and use one of the two configurations:
    1> Place any HTML code as you like instead of the three dotes as this uses the Angular transclude ability. This will be displayed once walkthrough loaded
    2> Use the additional optional properties the directive has to quickly create a walkthrough screen.

## Usage Example 1 - Non transclude option

```html
<walkthrough
            is-round=true
            focus-element-id="focusItem"
            icon="single_tap"
            main-caption="This is some text"
            is-active="isActive"
            use-button=true>
</walkthrough>
```

## Usage Example 2 - Using transclude option

```html
<walkthrough is-active="isActive">
  <img src="images/ImageTutorialExample.png" style="height: 100vh; width: 100%;">
</walkthrough>
```

## Directive Attributes

- `is-active` (mandatory) - bound element controls display the directive. Set 'true' to bound element in order to display.
- `focus-element-id` (optional) - ID of DOM element we want to give focus to, without it all screen will be grayed out
- `is-round` (optional) - Set to 'true' if you want the focused area to be round, otherwise it will be square set to the size of the DOM element
- `icon` (optional) - if set to any of the predefined values ("single_tap", "double_tap", "swipe_down", "swipe_left", "swipe_right", "swipe_up"), in such case the image will be bound to focus element (if exists). if giving any other icon then is not bound to focus element
- `main-caption` (optional) - This is the text that will be displayed in the walk-through. Text can be formatted
- `use-button` (optional) - set to 'true' you want a button displayed that most be clicked in order to close walkthrough, otherwise clicking anywhere while walkthrough displayed will close it
- `onWalkthroughShow` (optional) - Bind method to be called when walkthrough is displayed
- `onWalkthroughHide` (optional) - Bind method to be called when walkthrough is hidden

## Testing

Ran on Chrome, Safari, Iphone 4 Emulator and Android S3,
For continuous integration with Karma with Jasmine, run on Travis CI for FireFox

## License

As AngularJS itself, this module is released under the permissive [MIT license](http://revolunet.mit-license.org). Your contributions are always welcome.