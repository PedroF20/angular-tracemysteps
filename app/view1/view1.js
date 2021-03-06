'use strict';

angular.module('myApp.view1', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view1', {
    templateUrl: 'view1/view1.html',
    controller: 'View1Ctrl'
  });
}])

.controller('View1Ctrl', ['DataManagerService', '$scope', '$rootScope', function(DataManagerService, $scope, $rootScope) {

	/************* GET SLIDER DATES THROUGH SERVICE AND PARSE THEM *****************/

	var sliderMin = null;
	var sliderMax = null;

	DataManagerService.get('/slidermin', []).then(function(d) {
		sliderMin=d;
	});

	DataManagerService.get('/slidermax', []).then(function(d) {
		sliderMax=d;
	});

	// parse a date in yyyy_mm_dd format to present it in a nice yyyy/mm/dd format
	function parseDate(input) {
	  var parts = input.split('_');
	  // new Date(year, month [, day [, hours[, minutes[, seconds[, ms]]]]])
	  return new Date(parts[0], parts[1]-1, parts[2]); // Note: months are 0-based
	}

	// parse a date in yyyy/mm/dd format to broadcast in thr format for the vizs: yyyy-mm-dd
	function prepareDate(input) {
	  var parts = input.split('/');
	  if (parts[1].length < 2) parts[1] = '0' + parts[1];
      if (parts[2].length < 2) parts[2] = '0' + parts[2];
	  return [parts[2], parts[1], parts[0]].join('-');
	}

	/******************************************************************************/



	/******* RIGHT/LEFT PANEL FUNCTIONS *******/

	$scope.checkedRight = false; // This will be binded using the ps-open attribute

    $scope.toggleRight = function(){
        $scope.checkedRight = !$scope.checkedRight;  
    }


	$scope.checkedLeft = false; // This will be binded using the ps-open attribute

    $scope.toggleLeft = function(){
        $scope.checkedLeft = !$scope.checkedLeft;  
    }

    /*********************************************************************/



    /************ GRIDSTER AND SLIDER CONTEXT OPTIONS/VARIABLES ************/

	// this context has general data that every vis can fetch if they need
	// the specific data for each vis is in the directive: "widget.xxxxxx"

	// function that creates an array containing all the dates since the start
	// until the end of the LIFE file, with each step of the slider equivalent
	// to a single day
	function getAllDays() {
		var start = parseDate(sliderMin);
		var future = parseDate(sliderMax);
		var range = []
		var mil = 86400000 //24h
		//var mil = 2629743000 // one month *scalability*
		for (var i = start.getTime(); i < (future.getTime() + mil); i = i + mil) {
		  range.push(new Date(i).toLocaleDateString())
		}
		return range;
	};


	setTimeout(function() {

		var days_array = getAllDays();
		var slider_min_value = days_array[0];
		var slider_max_value = days_array[days_array.length-1];

		$scope.slider = {
		    minValue: slider_min_value,   // default min value where the slider starts
		    maxValue: slider_max_value, // default max value where the slider starts
		    options: {
		        stepsArray: getAllDays(), // allows the step of the slider to be non-numerical
		        noSwitching: true,
		        translate: function(value, sliderId, label) {
			      switch (label) {
			        case 'model':
			         	return '<b>Start date:</b> ' + value;
			        case 'high':
			         	return '<b>End date:</b> ' + value;
			        case 'floor':
			         	return '<b>Min date:</b> ' + value;
			        case 'ceil':
			        	return '<b>Max date:</b> ' + value;
			      }
			    }, 
			    onEnd: function (sliderId, modelValue, highValue) {
			    	$rootScope.$broadcast('rootScope:broadcast-timeline_slider', {min_time : prepareDate(modelValue), max_time : prepareDate(highValue)});
			    }
		    }
		};
	}, 100);


	$scope.gridsterOpts = {
	    columns: 6, // the width of the grid, in columns 
	    // 7 columns if we want to adjust grid placeholder to the window and thus
	    // remove initial page scrolling
	    // may need to adjust graphs widths, heights and margins, though
	    margins: [10, 10], // the pixel distance between each widget
	    pushing: true,
	    floating: true,
	    swapping: true,
	    rowHeight: 'match', // 120 if we want to adjust to the window
	    outerMargin: true, // whether margins apply to outer edges of the grid
	    minColumns: 1, // the minimum columns the grid must have
	    minRows: 3, // the minimum height of the grid, in rows
	    maxRows: 100,
	    maxSizeX: 6,
	    maxSizeY: 5,
	    resizable: {
	       enabled: true,
	       resize: function() {},
	       stop: function() {console.log('stop');} // no need to use gridster events and its scope for resizing (yet)
	    },
	    draggable: {
	       enabled: true,
	       handle: '.box-header',  // means the boxes can only be dragged when clicking the box header
	    }
	};

	/*********************************************************************/



	/******* WIDGET INITIALIZATION AND FUNCTIONS *******/

	$scope.widgets = [];

	// MEGA DIRECTIVE CAN BE COUNTER PRODUCTIVE, AS IT TAKES A BIG OPTIONS VARIABLE (CONTEXT)
	// AND EACH GRAPH MUST CONTROL WHAT THEY NEED
	// WE CAN END WITH AN OPTIONS CONTEXT CONTAINING DOZENS OF VARIABLES, WHICH CAN BE CONFUSING

	// MAYBE ADOPT A TYPED-PROGRAMMING APPROACH (EASIEST), WITH ONE DIRECTIVE PER GRAPH, AND THEN IN THE VIEW
	// LET THE TYPE ATTRIBUTE DECIDE WHICH GRAPH IS GOING TO BE DRAWN. THEN EACH GRAPH ONLY CONTROLS
	// ITS CONTEXT (AND THUS LESS VARIABLES, BECAUSE THEY ONLY OBSERVE WHAT IS IMPORTANT TO THEM)
	

	$scope.addHexbinWidget = function() {
		$scope.widgets.push({type: 'hexbin', name: "My all-time hexbin places", draggable: true, sizeX: 2, sizeY: 2});
	};

	$scope.addHexbinTracksWidget = function() {
		$scope.widgets.push({type: 'hexbintracks', name: "My hexbin tracks", draggable: true, sizeX: 2, sizeY: 2});
	};

	$scope.addGradientWidget = function() {
		$scope.widgets.push({type: 'areagradient', name: "My time (mins) spent moving", draggable: true, sizeX: 3, sizeY: 3, minSizeX: 2, minSizeY: 2});
	};

	$scope.addChordWidget = function() {
		$scope.widgets.push({type: 'chord', name: "My travels to or from a place", draggable: true, sizeX: 2, sizeY: 2});
	};

	$scope.addCalendarWidget = function() {
		$scope.widgets.push({type: 'calendar', name: "My last year calendar", draggable: true, sizeX: 5, sizeY: 1, minSizeX:5,
	 	maxSizeY:2, maxSizeX:5});
	};

	$scope.addTracksWidget = function() {
		$scope.widgets.push({type: 'tracks', name: "My tracks", draggable: true, sizeX: 2, sizeY: 2});
	};

	$scope.addBarChartWidget = function() {
		$scope.widgets.push({type: 'bar', name: "My places", draggable: true, sizeX: 1, sizeY: 3, maxSizeY:3, maxSizeX:1});
	};

	$scope.addStaysGraphWidget = function() {
		$scope.widgets.push({type: 'stays', name: "My stays heatmap (by day & hour)", draggable: true, sizeX: 4, sizeY: 2, maxSizeY:2, maxSizeX:5, minSizeY:2, minSizeX:4});
	};

	$scope.addArcDiagramWidget = function() {
		$scope.widgets.push({type: 'arc', name: "My all-time trip network", draggable: true, sizeX: 5, sizeY: 2, maxSizeY:2, maxSizeX:6, minSizeY:2, minSizeX:3});
	};

	$scope.clear = function() {
		$scope.widgets = [];
	};

	/*********************************************************************/



	/******* ROOTSCOPE VARIABLES AND TRIGGERS FOR DIRECTIVES *******/

	//$rootScope.selectedItem = false;
	$scope.frequency = true;
	$scope.timespent = false;

	$scope.frequencyDataset = function() {
		if($scope.frequency==true) {return;}
		if($scope.frequency==false && $scope.timespent==true) {
			$scope.frequency=true;
			$scope.timespent=false;
		}
	}

	$scope.timespentDataset = function() {
		if($scope.timespent==true) {return;}
		if($scope.timespent==false && $scope.frequency==true) {
			$scope.timespent=true;
			$scope.frequency=false;
		}
    }


	/*********************************************************************/


	// $scope.$watch('[limits]', function () {
	// }, true); // If there was no true flag (false by default), the check would be for "reference" equality, 
	// which asks if the two objects refer to the same thing, instead of the value itself. in this case they
	// always refer the same, so we need to check the values.

}]);