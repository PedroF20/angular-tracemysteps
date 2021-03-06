app.directive('hexbinGraph', ['DataManagerService', '$rootScope', function (DataManagerService, $rootScope) {

	var maps = [];
  var delay=5000;
	var map = undefined;
	var center = [38.7, -9.1];
  var jsonRes_places=null;
	var mapCount=0;

	return {
        restrict: 'E',
        scope: true,
        link: function($scope, $elem, $attr) {

        if (jsonRes_places==null) {
          DataManagerService.get('/hexbinPlaces', []).then(function(d) {
            jsonRes_places=d;
          });
        }

        setTimeout(function() {

    				var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    			    osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    			    osm = L.tileLayer(osmUrl, {maxZoom: 18, attributionControl: false});

    				angular.element($elem[0]).append(angular.element('<div id="map_places'+ mapCount +'" style="width: 100%; height: calc(100% - 25px); border: 1px solid #ccc"></div>'));
    				console.log('map_places'+ mapCount +'');
    				maps[mapCount] = new L.Map('map_places'+ mapCount +'', {center: new L.LatLng(center[0], center[1]), zoom: 10});
    				var layer_hexbin_places = osm.addTo(maps[mapCount]);
            createHexbinGraph(maps[mapCount]);    				

            $scope.$watch(function () {
              return $elem[0].parentNode.clientWidth;
            }, function ( w ) {
              if ( !w ) { return; }
              for(var i = 0; i < mapCount; i++) {
                maps[i].invalidateSize();
              }
            });

            $scope.$watch(function () {
              return $elem[0].parentNode.clientHeight;
            }, function ( h ) {
              if ( !h ) { return; }
              for(var i = 0; i < mapCount; i++) {
                maps[i].invalidateSize();
              }
            });

            $scope.$on('$destroy', function() {
              rootScopeBroadcast1();
              rootScopeBroadcast2();
              rootScopeBroadcast3();
              rootScopeBroadcast4();
              rootScopeBroadcastLeave1();
              rootScopeBroadcastLeave2();
              rootScopeBroadcastLeave3();
            });


            var rootScopeBroadcast1 = $rootScope.$on('rootScope:broadcast-not_inside_bar_chart', function (event, data) {
              var lat;
              var lon;
              for(var j = 0; j < jsonRes_places.length; j++) {
                if (data.label == jsonRes_places[j][2]) {
                    lat = jsonRes_places[j][1];
                    lon = jsonRes_places[j][0]
                  }
              }
              for(var i = 0; i < mapCount; i++) {
                maps[i].setView(L.latLng(lat, lon), 16);
              }
            });

            var rootScopeBroadcast2 = $rootScope.$on('rootScope:broadcast-not_inside_chord', function (event, data) {
              var lat;
              var lon;
              for(var j = 0; j < jsonRes_places.length; j++) {
                if (data.label == jsonRes_places[j][2]) {
                    lat = jsonRes_places[j][1];
                    lon = jsonRes_places[j][0]
                  }
              }
              for(var i = 0; i < mapCount; i++) {
                maps[i].setView(L.latLng(lat, lon), 16);
              }
            });

            var rootScopeBroadcast3 = $rootScope.$on('rootScope:broadcast-not_inside_arc', function (event, data) {
              var lat;
              var lon;
              for(var j = 0; j < jsonRes_places.length; j++) {
                if (data.label == jsonRes_places[j][2]) {
                    lat = jsonRes_places[j][1];
                    lon = jsonRes_places[j][0]
                  }
              }
              for(var i = 0; i < mapCount; i++) {
                maps[i].setView(L.latLng(lat, lon), 16);
              }
            });

            var rootScopeBroadcast4 = $rootScope.$on('rootScope:broadcast-not_inside_calendar', function (event, data) {
              var lat;
              var lon;
              for(var j = 0; j < jsonRes_places.length; j++) {
                if (data.label == jsonRes_places[j][2]) {
                    lat = jsonRes_places[j][1];
                    lon = jsonRes_places[j][0]
                  }
              }
              for(var i = 0; i < mapCount; i++) {
                maps[i].setView(L.latLng(lat, lon), 16);
              }
            });


            var rootScopeBroadcastLeave1 = $rootScope.$on('rootScope:broadcast-leave', function (event, data) {
              console.log("Hexbin places broadcast leave");
              // for(var i = 0; i < mapCount; i++) {
              //   maps[i].setZoom(10);
              // }
            });

            var rootScopeBroadcastLeave2= $rootScope.$on('rootScope:broadcast-leave-not_inside_bar_chart', function (event, data) {
              console.log("Hexbin places broadcast leave");
              // for(var i = 0; i < mapCount; i++) {
              //   maps[i].setZoom(10);
              // }
            });

            var rootScopeBroadcastLeave3= $rootScope.$on('rootScope:broadcast-leave-not_inside_calendar', function (event, data) {
              console.log("Hexbin places broadcast leave");
              // for(var i = 0; i < mapCount; i++) {
              //   maps[i].setZoom(10);
              // }
            });

    	        	
            function createHexbinGraph (map) {

      					var options = {
      					    radius : 12,
      					    opacity: 0.5,
      					    duration: 500,
      					    lng: function(d){
      					        return d[0];
      					    },
      					    lat: function(d){
      					        return d[1];
      					    },
      					    value: function(d){
      					        return d.length;
      					    },
      					    valueFloor: 0,
      					    valueCeil: undefined,
                    onmouseover: function(d, node, layer) {
                      var maxFrequency = 0;
                      var mostVisited = null;
                      var coords = [];
                      for (var i = 0; i <d.length; i++) {
                        if (d[i].o[3]>maxFrequency) {
                          mostVisited = d[i].o[2];
                          coords[0] = d[i].o[0];
                          coords[1] = d[i].o[1];
                        }
                      };

                      $rootScope.$broadcast('rootScope:broadcast-not_inside_hexbinPlaces', { label : mostVisited, centroid : coords});
                      var tooltip = L.tooltip({
                          target: node,
                          map: map,
                          html: mostVisited,
                          minWidth: 40,
                          showDelay: 200,
                          hideDelay: 200
                      });
                    },
                    onmouseout: function(d, node, layer) {
                      $rootScope.$broadcast('rootScope:broadcast-leave', 'out');
                    }
      					};

      					var hexLayer_hexbin_places = L.hexbinLayer(options).addTo(maps[mapCount])
      					hexLayer_hexbin_places.colorScale().range(['white', 'blue']);

      					hexLayer_hexbin_places.data(jsonRes_places);
      					maps[mapCount].invalidateSize();
    	       }

	        	mapCount++;
            delay = 0;

          }, delay);
    		}
    	}
}]);



app.directive('hexbintracksGraph', ['DataManagerService', '$rootScope', function (DataManagerService, $rootScope) {

  var hextrackmaps = [];
  var delay=5000; // 10000 scalability
  var hextrackmap = undefined;
  var center = [38.7, -9.1];
  var jsonRes=null;
  var hexmapCount=0;
  var hexLayer_hexbin_tracks = [];

  function sliderProcessing (ldate, rdate, dataset) {
    var result = [];
    for (var i = 0; i < dataset.length; i++) {
      if (Date.parse(dataset[i].date) >= Date.parse(ldate) && Date.parse(dataset[i].date) <= Date.parse(rdate)) {
        result.push({ lon: dataset[i].lon, lat: dataset[i].lat });
      }
      else {}
    }
    return result;
  }


  return {
        restrict: 'E',
        scope: true,
        link: function($scope, $elem, $attr) {

        if (jsonRes==null) {
          DataManagerService.get('/hexbinTracks', []).then(function(d) {
            jsonRes=d;
          });
        }

        setTimeout(function() {

            var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
              osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              osm = L.tileLayer(osmUrl, {maxZoom: 18, attributionControl: false});


            angular.element($elem[0]).append(angular.element('<div id="hextrackmap'+ hexmapCount +'" style="width: 100%; height: calc(100% - 25px); border: 1px solid #ccc"></div>'));
            console.log('hextrackmap'+ hexmapCount +'');
            hextrackmaps[hexmapCount] = new L.Map('hextrackmap'+ hexmapCount +'', {center: new L.LatLng(center[0], center[1]), zoom: 10});
            var layer_hexbin_tracks = osm.addTo(hextrackmaps[hexmapCount]);  
            createHexbinTracksGraph(jsonRes, hexmapCount);

            $scope.$on('$destroy', function() {
              //rootScopeBroadcast();
              //rootScopeBroadcastLeave();
            });

            

            $scope.$watch(function () {
              return $elem[0].parentNode.clientWidth;
            }, function ( w ) {
              if ( !w ) { return; }
              for(var i = 0; i < hexmapCount; i++) {
                hextrackmaps[i].invalidateSize();
              }
            });

            $scope.$watch(function () {
              return $elem[0].parentNode.clientHeight;
            }, function ( h ) {
              if ( !h ) { return; }
              for(var i = 0; i < hexmapCount; i++) {
                hextrackmaps[i].invalidateSize();
              }
            });

             var rootScopeBroadcast = $rootScope.$on('rootScope:broadcast-timeline_slider', function (event, data) {
                for(var i = 0; i < hexmapCount; i++) {
                  hextrackmaps[i].removeLayer(hexLayer_hexbin_tracks[i]);
                }
                new_tracks = sliderProcessing(data.min_time, data.max_time, jsonRes)
                console.log(new_tracks)
                for(var i = 0; i < hexmapCount; i++) {
                  createHexbinTracksGraph(new_tracks, i);
                }
              });

                
              function createHexbinTracksGraph (data, hexmapNumber) {

                if (hexmapNumber >= 1) {
                  data = new_tracks;
                }

                  var options = {
                      radius : 12,
                      opacity: 0.5,
                      duration: 500,
                      lng: function(d){
                          return d.lon;
                      },
                      lat: function(d){
                          return d.lat;
                      },
                      value: function(d){
                          return d.length;
                      },
                      valueFloor: 0,
                      valueCeil: undefined,
                      onmouseover: function(d, node, layer) {
                      }
                  };

                  hexLayer_hexbin_tracks[hexmapNumber] = L.hexbinLayer(options).addTo(hextrackmaps[hexmapNumber])

                  hexLayer_hexbin_tracks[hexmapNumber].colorScale().range(['white', 'blue']);
                  hexLayer_hexbin_tracks[hexmapNumber].data(data);
                  hextrackmaps[hexmapNumber].invalidateSize();
              }

                
                hexmapCount++;
                delay = 0;

          }, delay);

        }
      }

}]);



app.directive('areaGradient', ['DataManagerService', '$rootScope', function (DataManagerService, $rootScope) {

  var delay=800;
  var jsonRes=null;
  var new_dataset_gradient_flag = 0;

  function sliderProcessing (ldate, rdate, dataset) {
    var result = [];
    for (var i = 0; i < dataset.length; i++) {
      if(Date.parse(dataset[i].date) >= Date.parse(ldate) && Date.parse(dataset[i].date) <= Date.parse(rdate)) {
        result.push([dataset[i].date, dataset[i].price]);
      }
      else {}
    }
    return result;
  }

  return {
        restrict: 'E',
        scope: true,
        link: function($scope, $elem, $attr) {

      if (jsonRes==null) {
        DataManagerService.get('/areagradient', []).then(function(d) {
          jsonRes=d;
          //createAreaGradientGraph(jsonRes);
        });
      }

      $scope.$watch(function () {
          return $elem[0].parentNode.clientWidth;
        }, function ( w ) {
          if ( !w ) { return; }
          if (new_dataset_gradient_flag == 0) {
            createAreaGradientGraph(jsonRes, new_dataset_gradient_flag);
          }
          if (new_dataset_gradient_flag == 1) {
            createAreaGradientGraph(new_dataset_gradient, new_dataset_gradient_flag)
          }
        });

      $scope.$watch(function () {
          return $elem[0].parentNode.clientHeight;
        }, function ( h ) {
          if ( !h ) { return; }
          if (new_dataset_gradient_flag == 0) {
            createAreaGradientGraph(jsonRes, new_dataset_gradient_flag);
          }
          if (new_dataset_gradient_flag == 1) {
            createAreaGradientGraph(new_dataset_gradient, new_dataset_gradient_flag)
          }
        });

      $scope.$on('$destroy', function() {
        //rootScopeBroadcast();
      });

      var rootScopeBroadcast = $rootScope.$on('rootScope:broadcast-timeline_slider', function (event, data) {
        new_dataset_gradient = sliderProcessing(data.min_time, data.max_time, jsonRes);
        new_dataset_gradient_flag = 1;
        createAreaGradientGraph(new_dataset_gradient, new_dataset_gradient_flag);
      });


      function createAreaGradientGraph (dataset, flag) {

        setTimeout(function() {

          $elem[0].svg = null;
          
          var parentHeigtht = angular.element($elem[0])[0].parentNode.clientHeight;
          
            var margin = {top: 20, right: 10, bottom: 220, left: 40},
                margin2 = {top: parentHeigtht-150, right: 10, bottom: 60, left: 40},
                width = ($elem[0].parentNode.clientWidth) - margin.left - margin.right,
                height = ($elem[0].parentNode.clientHeight) - (margin.top) - (margin.bottom),
                height2 = ($elem[0].parentNode.clientHeight) - (margin2.top) - (margin2.bottom);

            var parseDate = d3.time.format("%Y-%m-%d").parse;

            var x = d3.time.scale().range([0, width]),
              x2 = d3.time.scale().range([0, width]), // tamanho da escala mantem, qualquer q seja a qtd de info
              y = d3.scale.linear().range([height, 0]),
              y2 = d3.scale.linear().range([height2, 0]); 

          var xAxis = d3.svg.axis().scale(x).orient("bottom"),
              xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
              yAxis = d3.svg.axis().scale(y).orient("left");

          var brush = d3.svg.brush()
              .x(x2)
              .on("brush", brushed);

          var area = d3.svg.area()
              .interpolate("linear")
              .x(function(d) { return x(d.date); })
              .y0(height)
              .y1(function(d) { return y(d.price); });

          var area2 = d3.svg.area()
              .interpolate("linear")
              .x(function(d) { return x2(d.date); })
              .y0(height2)
              .y1(function(d) { return y2(d.price); });

          d3.select($elem[0]).selectAll("svg").remove()

          var svg = d3.select($elem[0]).append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)

            svg.append("defs").append("clipPath")
                .attr("id", "clip")
                .append("rect")
                .attr("width", width)
                .attr("height", height);

          var focus = svg.append("g")
              .attr("class", "focus")
              .attr("transform", "translate(" + margin.left + "," + (margin.top) + ")");

          var context = svg.append("g")
              .attr("class", "context")
              .attr("transform", "translate(" + margin2.left + "," + (margin2.top) + ")");

          var transformation = [];

          if (flag == 0) {
            var transformation = dataset.map(el => (
              { date: el.date, price: el.price }
            ));
          } if (flag == 1) {
            var transformation = dataset.map(el => (
              { date: el[0], price: el[1] }
            ));
          } 


          transformation.forEach(function(d) {
            d.date = parseDate(d.date);
            d.price = +d.price;
            return d;
          });

        
            x.domain(d3.extent(transformation.map(function(d) { return d.date; })));
            y.domain([0, d3.max(transformation.map(function(d) { return d.price; }))]);
            x2.domain(x.domain());
            y2.domain(y.domain());

          focus.append("path")
              .datum(transformation)
              .attr("class", "area")
              .attr("d", area);

          focus.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + height + ")")
              .call(xAxis);

          focus.append("g")
              .attr("class", "y axis")
              .call(yAxis);

          context.append("path")
              .datum(transformation)
              .attr("class", "area")
              .attr("d", area2);

          context.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + height2 + ")")
              .call(xAxis2);

          context.append("g")
            .attr("class", "x brush")
              .call(brush)
              .selectAll("rect")
              .attr("y", -6)
              .attr("height", height2 + 7);

            // create brush to also zoom in with + detail on the main graph

          $elem[0].svg = svg;

          function brushed() {
            x.domain(brush.empty() ? x2.domain() : brush.extent());
            focus.select(".area").attr("d", area);
            focus.select(".x.axis").call(xAxis);
          }

          delay = 350;

          }, delay);
      }

    }
    
  };

}]);




app.directive('gpsTracks', ['DataManagerService', '$rootScope', '$http',  function (DataManagerService, $rootScope, $http) {

  var jsonRes=null;
  var delay = 5000;
  var trackmaps = [];
  var trackmapCount=0;
  var geo = [];
  var geolayer = null;
  var center = [38.7, -9.1];
  var counter = 0;
  var runLayer = [];
  folderPath = "../ProcessedTracks/";


  function sliderProcessing (ldate, rdate, dataset) {
    var result = [];
    for (var i = 0; i < dataset.length; i++) {

      var parts = dataset[i].split('-');
      var temp_date = [parts[0], parts[1], parts[2]].join('-');
      var complete_name = [parts[0], parts[1], parts[2], parts[3]].join('-');

      if(Date.parse(temp_date) >= Date.parse(ldate) && Date.parse(temp_date) <= Date.parse(rdate)) {
        result.push(complete_name);
      }
      else {}
    }
    return result;
  }

  return {

        restrict: 'E',
        scope: true,
        link: function($scope, $elem, $attr, $http) {

        DataManagerService.get('/gpstracklist', []).then(function(d) {
          jsonRes=d;
        });

        setTimeout(function() {

          var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          osm = L.tileLayer(osmUrl, {maxZoom: 18, attributionControl: false});
          var ggl = new L.Google();

          angular.element($elem[0]).append(angular.element('<div id="trackmap'+ trackmapCount +'" style="width: 100%; height: calc(100% - 25px); border: 1px solid #ccc"></div>'));
          trackmaps[trackmapCount] = new L.Map('trackmap'+ trackmapCount +'', {center: new L.LatLng(center[0], center[1]), zoom: 10});
          trackmaps[trackmapCount].addControl(new L.Control.Layers( {'Google':ggl,'OSM':osm}, {}));
          console.log('map'+ trackmapCount +'');
          //trackmaps[trackmapCount].addLayer(ggl);
          // if both were active, the two layers would be active with one layer over the other,
          // depending on the order of call. this way the map initializes on the layer1 (leaflet)
          // layer, and then we can choose to change to the google layer
          var layer1 = osm.addTo(trackmaps[trackmapCount]);
          createTracks(jsonRes, trackmapCount);

          $scope.$watch(function () {
            return $elem[0].parentNode.clientWidth;
          }, function ( w ) {
            if ( !w ) { return; }
            for(var i = 0; i < trackmapCount; i++) {
              trackmaps[i].invalidateSize();
            }
          });

          $scope.$watch(function () {
            return $elem[0].parentNode.clientHeight;
          }, function ( h ) {
            if ( !h ) { return; }
            for(var i = 0; i < trackmapCount; i++) {
              trackmaps[i].invalidateSize();
            }
          });

          $scope.$on('$destroy', function() {
            //rootScopeBroadcast();
          });

          var rootScopeBroadcast = $rootScope.$on('rootScope:broadcast-timeline_slider', function (event, data) {
            for(var i = 0; i < trackmapCount; i++) {
              trackmaps[i].removeLayer(runLayer[i]);
            }
              new_tracks_list = sliderProcessing(data.min_time, data.max_time, jsonRes)
              for(var i = 0; i < trackmapCount; i++) {
              createTracks(new_tracks_list, i);
            }
              
          });


          function createTracks (track_list, n) {


            if (n >= 1) {
              track_list = new_tracks_list;
            }
              

              myStyle = {
                  "color": "#0033ff",
                  "weight": 1,
                  "opacity": 0.6,
                  "clickable": true
              };

              customLayer = L.geoJson(null, {
                  style: myStyle,
              });
              
              
                for (var i = 0; i < track_list.length; i += 1) {
            
                    runLayer[n] = omnivore.gpx(folderPath + track_list[i], null, customLayer) //local variables start with var
                                                                                      // global variables do not have var
                                                                                      // this way i can acess them in the broadcast
                      .on('ready', function() {
                          //runLayer.showExtremities('arrowM');
                      })
                      .addTo(trackmaps[n])
                      .on('click', function(d) {
                          console.log(d);
                      });
                  }
              

          }

          trackmapCount++;
          delay = 0;

          }, delay);
      }
    };

}]);


app.directive('barChart', ['DataManagerService', '$rootScope', function (DataManagerService, $rootScope) {

  var delay=600;

  var jsonResFrequency=null;
  var jsonResTime=null;

  var resizeFlag=1; // flag for the resize $watch in order to draw the correct graph when resing
                    // 1->draw frequency 2->draw timespent

  var new_dataset_flag = 0; // flag indicating the presence of a subset of the dataset

  function sliderProcessing (ldate, rdate, dataset) {
    var result = [];
    for (var i = 0; i < dataset.length; i++) {
      if(Date.parse(dataset[i].date) >= Date.parse(ldate) && Date.parse(dataset[i].date) <= Date.parse(rdate)) {
        result.push([dataset[i].label, dataset[i].value]);
      }
      else {}
    }
    return result;
  }

  function datasetSort (d) {
      result = d.sort(function(a, b) {  // function to sort the data descendingly
                        return a.value - b.value;
                    }).reverse();
      return result;
  }


  function concatenateStays(s) { 
      var results;
      var transformation = [];
      var final_array;

      if (new_dataset_flag == 0) {

        var transformation = s.map(el => (
          { label: el.label, value: el.value }
        ));
      }

      if (new_dataset_flag == 1) {
        var transformation = s.map(el => (
          { label: el[0], value: el[1] }
        ));
      }

      var transformation_sum = transformation.reduce(function(results, item) {
          if (!results.hasOwnProperty(item.label)) {
              results[item.label] = 0;
          }

          results[item.label] += item.value;
          return results;
      }, {});

      var processed_array = Object.keys(transformation_sum).map(key => (
        {label: key, value: transformation_sum[key]}
      ));

      final_array = datasetSort(processed_array);

      return final_array;

  }

  function isOdd(num) { return (num % 2)==1;}


  return {

      restrict: 'E',
      scope: false,
      link: function($scope, $elem, $attr, $http) {


          // as there are two requests in one directive, they need to be done only when the
          // storage variables are null (first call). if they were done both every time,
          // the data would get mixed, causing bugs
          if (jsonResFrequency==null) {
            DataManagerService.get('/barchartFrequency', []).then(function(d) {
              jsonResFrequency=d;
              createBarChart(datasetSort(jsonResFrequency), resizeFlag);
            });
          }

          if (jsonResTime==null) {
            DataManagerService.get('/barchartTime', []).then(function(d) {
             jsonResTime=d;
             createBarChart(concatenateStays(jsonResTime), resizeFlag);
            });
          }

          $scope.$watch(function () {
              return $elem[0].parentNode.clientWidth;
            }, function ( w ) {
              if ( !w ) { return; }
              if(resizeFlag==0) {return;}
              if(resizeFlag==1) {
                createBarChart(datasetSort(jsonResFrequency), resizeFlag, null, new_dataset_flag);
              }
              if (resizeFlag == 2) {
                if (new_dataset_flag == 1) {
                  createBarChart(concatenateStays(new_dataset), resizeFlag, null, new_dataset_flag);
                }
                if (new_dataset_flag == 0) {
                  createBarChart(concatenateStays(jsonResTime), resizeFlag, null, new_dataset_flag);
                }
              }
            });

          $scope.$watch(function () {
              return $elem[0].parentNode.clientHeight;
            }, function ( h ) {
              if ( !h ) { return; }
              if(resizeFlag==0) {return;}
              if(resizeFlag==1) {
                createBarChart(datasetSort(jsonResFrequency), resizeFlag, null, new_dataset_flag);
              }
              if (resizeFlag == 2) {
                if (new_dataset_flag == 1) {
                  createBarChart(concatenateStays(new_dataset), resizeFlag, null, new_dataset_flag);
                }
                if (new_dataset_flag == 0) {
                  createBarChart(concatenateStays(jsonResTime), resizeFlag, null, new_dataset_flag);
                }
              }
            });
        

          $scope.$watchGroup(['frequency', 'timespent'], function (val) {
              if(val[0]==true && val[1]==false) {
                resizeFlag=1;
                createBarChart(datasetSort(jsonResFrequency), resizeFlag, null, new_dataset_flag);
              }
              if(val[0]==false && val[1]==true) {
                resizeFlag=2;
                if (new_dataset_flag == 1) {
                  createBarChart(concatenateStays(new_dataset), resizeFlag, null, new_dataset_flag);
                }
                if (new_dataset_flag == 0) {
                  createBarChart(concatenateStays(jsonResTime), resizeFlag, null, new_dataset_flag);
                }
              }
          });


          $scope.$on('$destroy', function() {
            //rootScopeBroadcast1();
            rootScopeBroadcast2();
            rootScopeBroadcast3();
            rootScopeBroadcast4();
            rootScopeBroadcast5();
            rootScopeBroadcastLeave();
            rootScopeBroadcastLeave2();
          });

          var rootScopeBroadcast1 = $rootScope.$on('rootScope:broadcast-timeline_slider', function (event, data) {
            if (resizeFlag == 2) {
              new_dataset = sliderProcessing(data.min_time, data.max_time, jsonResTime);
              new_dataset_flag = 1;
              createBarChart(concatenateStays(new_dataset), resizeFlag, null, new_dataset_flag);
            }
            if (resizeFlag == 1) {}
          });

          var rootScopeBroadcast2 = $rootScope.$on('rootScope:broadcast-not_inside_chord', function (event, data) {
            console.log("bar chart broadcast: " + JSON.stringify(data)); // 'Broadcast!'
            if (resizeFlag == 1) {
              createBarChart(datasetSort(jsonResFrequency), resizeFlag, data.label, new_dataset_flag);
            }
            if (resizeFlag == 2) {
              if (new_dataset_flag == 1) {
                createBarChart(concatenateStays(new_dataset), resizeFlag, data.label, new_dataset_flag);
              }
              if (new_dataset_flag == 0) {
                createBarChart(concatenateStays(jsonResTime), resizeFlag, data.label, new_dataset_flag);
              }
            }
          });


          var rootScopeBroadcast3 = $rootScope.$on('rootScope:broadcast-not_inside_arc', function (event, data) {
            console.log("bar chart broadcast: " + JSON.stringify(data)); // 'Broadcast!'
            if (resizeFlag == 1) {
              createBarChart(datasetSort(jsonResFrequency), resizeFlag, data.label, new_dataset_flag);
            }
            if (resizeFlag == 2) {
              if (new_dataset_flag == 1) {
                createBarChart(concatenateStays(new_dataset), resizeFlag, data.label, new_dataset_flag);
              }
              if (new_dataset_flag == 0) {
                createBarChart(concatenateStays(jsonResTime), resizeFlag, data.label, new_dataset_flag);
              }
            }
          });

          var rootScopeBroadcast4 = $rootScope.$on('rootScope:broadcast-not_inside_hexbinPlaces', function (event, data) {
            console.log("bar chart broadcast: " + JSON.stringify(data)); // 'Broadcast!'
            if (resizeFlag == 1) {
              createBarChart(datasetSort(jsonResFrequency), resizeFlag, data.label, new_dataset_flag);
            }
            if (resizeFlag == 2) {
              if (new_dataset_flag == 1) {
                createBarChart(concatenateStays(new_dataset), resizeFlag, data.label, new_dataset_flag);
              }
              if (new_dataset_flag == 0) {
                createBarChart(concatenateStays(jsonResTime), resizeFlag, data.label, new_dataset_flag);
              }
            }
          });

          var rootScopeBroadcast5 = $rootScope.$on('rootScope:broadcast-not_inside_calendar', function (event, data) {
            console.log("bar chart broadcast: " + JSON.stringify(data)); // 'Broadcast!'
            if (resizeFlag == 1) {
              createBarChart(datasetSort(jsonResFrequency), resizeFlag, data.label, new_dataset_flag);
            }
            if (resizeFlag == 2) {
              if (new_dataset_flag == 1) {
                createBarChart(concatenateStays(new_dataset), resizeFlag, data.label, new_dataset_flag);
              }
              if (new_dataset_flag == 0) {
                createBarChart(concatenateStays(jsonResTime), resizeFlag, data.label, new_dataset_flag);
              }
            }
          });

          var rootScopeBroadcastLeave = $rootScope.$on('rootScope:broadcast-leave', function (event, data) {
            console.log("Bar chart broadcast leave"); // 'Broadcast!'
            // must know here which resize flag is on to draw the correct graph            
            if (resizeFlag == 1) {
              createBarChart(datasetSort(jsonResFrequency), resizeFlag, data.label, new_dataset_flag);
            }
            if (resizeFlag == 2) {
              if (new_dataset_flag == 1) {
                createBarChart(concatenateStays(new_dataset), resizeFlag, data.label, new_dataset_flag);
              }
              if (new_dataset_flag == 0) {
                createBarChart(concatenateStays(jsonResTime), resizeFlag, data.label, new_dataset_flag);
              }
            }
          });

          var rootScopeBroadcastLeave2 = $rootScope.$on('rootScope:broadcast-leave-not_inside_calendar', function (event, data) {
            console.log("Bar chart broadcast leave"); // 'Broadcast!'
            // must know here which resize flag is on to draw the correct graph            
            if (resizeFlag == 1) {
              createBarChart(datasetSort(jsonResFrequency), resizeFlag, data.label, new_dataset_flag);
            }
            if (resizeFlag == 2) {
              if (new_dataset_flag == 1) {
                createBarChart(concatenateStays(new_dataset), resizeFlag, data.label, new_dataset_flag);
              }
              if (new_dataset_flag == 0) {
                createBarChart(concatenateStays(jsonResTime), resizeFlag, data.label, new_dataset_flag);
              }
            }
          });

      
          function createBarChart(dataset_raw, resizeFlag, location_label, dataset_flag) {

            if (resizeFlag == 1) {
              var dataset = [];
              for (var i = 0; i < dataset_raw.length; i++) {
                if (dataset_raw[i].value < 10) {}  // default 10 (frequency of visit), scalability 90
                else {
                  dataset.push(dataset_raw[i]);
                }
              };
            }
            if (resizeFlag == 2) {
              var dataset = [];
              for (var i = 0; i < dataset_raw.length; i++) {
                if (dataset_raw[i].value < 200) {} // default 200 (hours spent), scalability 13260
                else {
                  dataset.push(dataset_raw[i]);
                }
              };
            }

            setTimeout(function() {

              $elem[0].svg = null;

              var margin = {top: 33, right: 10, bottom: 75, left: 10},
                  width = $elem[0].parentNode.clientWidth - margin.left - margin.right,
                  height = $elem[0].parentNode.clientHeight - margin.top - margin.bottom;

              var div = d3.select($elem[0]).append("div").attr("class", "toolTip");
              var formatPercent = d3.format("");

              var y = d3.scale.ordinal()
                .domain(dataset.map(function(d) { return d.label; }))
                .rangeRoundBands([0, height], 0.1, 0.3);
              var x = d3.scale.linear()
                .domain([0, d3.max(dataset, function(d) { return d.value; })])
                .range([0, width]);

              var xAxis = d3.svg.axis()
                      .scale(x)
                      //.tickSize(-height)
                      .orient("bottom");

              d3.select($elem[0]).selectAll("svg").remove()

              var svg = d3.select($elem[0]).append("svg")
                      .attr("width", width + margin.left + margin.right)
                      .attr("height", height + margin.top + margin.bottom)
                      .append("g")
                      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

              svg.append("g")
                      .attr("class", "x axis")
                      .attr("transform", "translate(0," + height + ")")
                      .call(xAxis)                
                      .style("opacity", 0);


              svg.append("g")
                      .attr("class", "x axis")
                      .attr("transform", "translate(0," + height + ")")
                      .call(xAxis)
                      .style("opacity", 0);

              svg.select(".y.axis").remove();
              svg.select(".x.axis").remove();

              if (resizeFlag==1) {
                svg.append("g")
                      .append("text")
                      .attr("transform", "rotate(0)")
                      .attr("x", 110)
                      .attr("dx", ".1em")
                      .style("text-anchor", "end")
                      .text("All-time frequency of visit");
              }
              if (resizeFlag==2) {
                svg.append("g")
                      .append("text")
                      .attr("transform", "rotate(0)")
                      .attr("x", 49)
                      .attr("dx", ".1em")
                      .style("text-anchor", "end")
                      .text("Time Spent");
              }

              var bar = svg.selectAll(".bar")
                        .data(dataset, function(d) {return d.label
                        })

              // new data:
              bar.enter().append("rect")
                      .attr("class", "bar")
                      .attr("x", function(d) { return 0; })
                      .attr("y", function(d) { return y(d.label); })
                      .attr("width", function(d) { return x(d.value); // decomment bar.transition AND here return 0 if want to animate
                      // for big dataset, limit the nr of bars shown!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                      // ex: bars with width under certain size or bars with d.value under certain value
                      })
                      .attr("height", y.rangeBand())
                      .text(function(d) { return d.label; });

              svg.selectAll(".bartext")
                      .data(dataset, function(d) { return d.label; })
                      .enter()
                      .append("text")
                      .attr("class", "bartext")
                      .attr("text-anchor", "middle")
                      .attr("fill", "white")
                      .attr("x", function(d,i) {
                          //if (d.value<=10) {return;}
                          return width/2;
                      })
                      .attr("y", function(d,i) {
                          //if (d.value<=10){return};
                          return y(d.label)+15; // default
                          //return y(d.label)+10; // scalability
                      })
                      .text(function(d){ return d.label;  //use together with limitation of the nr of bars shown
                      });

              if (location_label != null) {

                d3.selectAll(".bartext").text(function(d){
                  return (location_label != d.label ? d.label : null);
                })
                .attr("fill", "white");

                d3.selectAll(".bartext").text(function(d){
                  return (location_label == d.label ? d.label : null);
                })
                .attr("fill", "red")
                .style("font-size", "18px"); // maybe in this case also present the value of frequency/timespent
                                            // in the text as if it was the tooltip 
                                            // return d.label + hours + minutes
              } 

              var currentColor = "#1b6427";
              var nClicks = 0;

              
              bar.on("mouseover", function(d){
                div.style("left", (d3.event.layerX + 10) + "px");
                div.style("top", (d3.event.layerY + 10) + "px");
                div.style("display", "inline-block");
                if (resizeFlag==1) {
                  div.html((d.value)+" times");
                }
                if (resizeFlag==2) {
                  var hours = Math.floor(d.value / 60);          
                  var minutes = d.value % 60;
                  div.html(hours + " hours " + minutes + " minutes");
                }
              });
              bar.on("mouseout", function(d){
                      $rootScope.$broadcast('rootScope:broadcast-leave-not_inside_bar_chart', 'out');  
                      div.style("display", "none");
              });
              bar.on("click", function(d){
 
                  // Find previously selected, unselect
                  // d3.select(".selected").classed("selected", false);

                  // // Select current item
                  // d3.select(this).classed("selected", true);
                  // console.log(this)

                  // currentColor = currentColor == "#1b6427" ? "black" : "#1b6427";
                  // d3.select(this).style("fill", currentColor);
                  // console.log(this)

                  nClicks += 1;
                  if (isOdd(nClicks)) {
                    d3.select(this).classed("selected", true);
                    $rootScope.$broadcast('rootScope:broadcast-not_inside_bar_chart', { label : d.label});
                  }
                  if (!isOdd(nClicks)) {
                    $rootScope.$broadcast('rootScope:broadcast-leave-not_inside_bar_chart', 'out'); 
                    d3.select(".selected").classed("selected", false);
                  }

              });

              // removed data:
              bar.exit().remove();

              // ANIMATE updated data:
              // bar.transition()
              //         .duration(550)
              //         .attr("x", function(d) { return 0; })
              //         .attr("y", function(d) { return y(d.label); })
              //         .attr("width", function(d) { return x(d.value); })
              //         .attr("height", y.rangeBand());
              
              $elem[0].svg = svg;
              delay = 350;

            }, delay);

          }
      }
  };

}]);



app.directive('chordGraph', ['DataManagerService', '$rootScope', function (DataManagerService, $rootScope) {

  var delay=350;
  var jsonRes=null;
  var new_dataset_chord_flag = 0;

  function sliderProcessing (ldate, rdate, dataset) {
    var result = [];
    for (var i = 0; i < dataset.length; i++) {
      if(Date.parse(dataset[i].start) >= Date.parse(ldate) && Date.parse(dataset[i].start) <= Date.parse(rdate)) {
        result.push([dataset[i].from, dataset[i].to]);
      }
      else {}
    }
    return result;
  }

  return {
        restrict: 'E',
        scope: true,
        link: function($scope, $elem, $attr) {

          if (jsonRes==null) {
            DataManagerService.get('/chord', []).then(function(d) {
              jsonRes=d;
            });
          }

          $scope.$watch(function () {
              return $elem[0].parentNode.clientWidth;
            }, function ( w ) {
              if ( !w ) { return; }
              if (new_dataset_chord_flag == 0) {
                createChordGraph(null, jsonRes, new_dataset_chord_flag);
              }
              if (new_dataset_chord_flag == 1) {
                createChordGraph(null, new_dataset_chord, new_dataset_chord_flag)
              }
          });

          $scope.$watch(function () {
              return $elem[0].parentNode.clientHeight;
            }, function ( h ) {
              if ( !h ) { return; }
              if (new_dataset_chord_flag == 0) {
                 createChordGraph(null, jsonRes, new_dataset_chord_flag);
              }
              if (new_dataset_chord_flag == 1) {
                createChordGraph(null, new_dataset_chord, new_dataset_chord_flag)
              }
          });

          $scope.$on('$destroy', function() {
            rootScopeBroadcast1();
            rootScopeBroadcast2();
            rootScopeBroadcast3();
            rootScopeBroadcast4();
            rootScopeBroadcastLeave1();
            rootScopeBroadcastLeave2();
            rootScopeBroadcastLeave3();
          });

          
          var rootScopeBroadcast1 = $rootScope.$on('rootScope:broadcast-not_inside_bar_chart', function (event, data) { 
            console.log("chord broadcast: " + JSON.stringify(data)); // 'Broadcast!'
            if (new_dataset_chord_flag == 0) {
               createChordGraph(data.label, jsonRes, new_dataset_chord_flag);
            }
            if (new_dataset_chord_flag == 1) {
              createChordGraph(data.label, new_dataset_chord, new_dataset_chord_flag)
            }
          });

          var rootScopeBroadcast2 = $rootScope.$on('rootScope:broadcast-not_inside_arc', function (event, data) { 
            console.log("chord broadcast: " + JSON.stringify(data)); // 'Broadcast!'
            if (new_dataset_chord_flag == 0) {
               createChordGraph(data.label, jsonRes, new_dataset_chord_flag);
            }
            if (new_dataset_chord_flag == 1) {
              createChordGraph(data.label, new_dataset_chord, new_dataset_chord_flag)
            }
          });
          
          var rootScopeBroadcast3 = $rootScope.$on('rootScope:broadcast-not_inside_hexbinPlaces', function (event, data) {
            console.log("chord broadcast: " + JSON.stringify(data)); // 'Broadcast!'
            if (new_dataset_chord_flag == 0) {
               createChordGraph(data.label, jsonRes, new_dataset_chord_flag);
            }
            if (new_dataset_chord_flag == 1) {
              createChordGraph(data.label, new_dataset_chord, new_dataset_chord_flag)
            }
          });

          var rootScopeBroadcast4 = $rootScope.$on('rootScope:broadcast-not_inside_calendar', function (event, data) {
            console.log("chord broadcast: " + JSON.stringify(data)); // 'Broadcast!'
            if (new_dataset_chord_flag == 0) {
               createChordGraph(data.label, jsonRes, new_dataset_chord_flag);
            }
            if (new_dataset_chord_flag == 1) {
              createChordGraph(data.label, new_dataset_chord, new_dataset_chord_flag)
            }
          });

          var rootScopeBroadcastLeave1 = $rootScope.$on('rootScope:broadcast-leave', function (event, data) {
            console.log("Chord diagram broadcast leave"); // 'Broadcast!'
            if (new_dataset_chord_flag == 0) {
               createChordGraph(data.label, jsonRes, new_dataset_chord_flag);
            }
            if (new_dataset_chord_flag == 1) {
              createChordGraph(data.label, new_dataset_chord, new_dataset_chord_flag)
            }
          });

          var rootScopeBroadcastLeave2 = $rootScope.$on('rootScope:broadcast-leave-not_inside_bar_chart', function (event, data) {
            console.log("Chord diagram broadcast leave"); // 'Broadcast!'
            if (new_dataset_chord_flag == 0) {
               createChordGraph(data.label, jsonRes, new_dataset_chord_flag);
            }
            if (new_dataset_chord_flag == 1) {
              console.log(new_dataset_chord)
              createChordGraph(data.label, new_dataset_chord, new_dataset_chord_flag)
            }
          });

          var rootScopeBroadcastLeave3 = $rootScope.$on('rootScope:broadcast-leave-not_inside_calendar', function (event, data) {
            console.log("Chord diagram broadcast leave"); // 'Broadcast!'
            if (new_dataset_chord_flag == 0) {
               createChordGraph(data.label, jsonRes, new_dataset_chord_flag);
            }
            if (new_dataset_chord_flag == 1) {
              console.log(new_dataset_chord)
              createChordGraph(data.label, new_dataset_chord, new_dataset_chord_flag)
            }
          });

          var rootScopeBroadcast = $rootScope.$on('rootScope:broadcast-timeline_slider', function (event, data) {
            new_dataset_chord = sliderProcessing(data.min_time, data.max_time, jsonRes);
            new_dataset_chord_flag = 1;
            createChordGraph(null, new_dataset_chord, new_dataset_chord_flag);
          });

          function createChordGraph (location_label, dataset, flag) {

            setTimeout(function() {

              $elem[0].svg = null;

              var margin = {top: 20, right: 0, bottom: 20, left: 0},
                  width = $elem[0].parentNode.clientWidth - margin.left - margin.right,
                  height = $elem[0].parentNode.clientHeight - margin.top - margin.bottom,
                  // outerRadius = 400 / 2,
                  // innerRadius = outerRadius-130;
                  innerRadius = Math.min(width, height) * .41,
                  outerRadius = innerRadius * 1.1;

              var formatPercent = d3.format(".1%");

              var fill = d3.scale.category20();

              var chord = d3.layout.chord()
                  .padding(.04)
                  .sortSubgroups(d3.descending)
                  .sortChords(d3.descending);

              var arc = d3.svg.arc()
                  .innerRadius(innerRadius)
                  .outerRadius(outerRadius);

              var transformation = [];

              if (flag == 0) {
                var transformation = dataset.map(el => (
                  { from: el.from, to: el.to }
                ));
              }
              if (flag == 1) {
                var transformation = dataset.map(el => (
                  { from: el[0], to: el[1] }
                ));
              }

              d3.select($elem[0]).selectAll("svg").remove()

              var svg = d3.select($elem[0]).append("svg")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom - 25)
                  .append("g")
                  .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

              var indexByFromName = d3.map(),
                  fromNameByIndex = d3.map(),
                  matrix = [],
                  n = 0;

              // Compute a unique index for each trip.
              transformation.forEach(function(d) {
                if (!indexByFromName.has(d = d.from)) {
                  fromNameByIndex.set(n, d);
                  indexByFromName.set(d, n++);
                }
              });

              // Best to have the transformation used.
              // It secures all the data is processed first before used
              // Construct a square matrix counting trips.
              transformation.forEach(function(d) {
                  var source = indexByFromName.get(d.from),
                      row = matrix[source];
                  if (!row) {
                   row = matrix[source] = [];
                   for (var i = -1; ++i < n;) row[i] = 0;
                  }
                  //d.to.forEach(function(d) { row[indexByFromName.get(d)]++; });
                  row[indexByFromName.get(d.to)]++;

              });

              console.log(matrix)
              chord.matrix(matrix);

              var g = svg.selectAll(".group")
                .data(chord.groups)
                .enter().append("g")
                .attr("class", "group");

              g.append("path")
                  .attr("fill", function(d) { 
                    return fill(d.index); 
                  })
                  .attr("stroke", function(d) { return fill(d.index); })
                  .attr("d", arc)
                  .on("mouseover", fadeIn(.1)) //put counter for to decide which function the clicking calls
                  .on("mouseout", fadeOut(1));

              g.append("text")
                  .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
                  .attr("dy", ".35em")
                  .attr("transform", function(d) {
                    return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                        + "translate(" + (innerRadius + 26) + ")"
                        + (d.angle > Math.PI ? "rotate(180)" : "");
                  })
                  .style("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
                  .text(function(d) {
                   return fromNameByIndex.get(d.index);
                  });

                  // as labels não aparecem se o elemento tiver um nr de travels abaixo de um threshold
                  // ou elemento não aparece de todo

              svg.selectAll(".chord")
                  .data(chord.chords)
                  .enter().append("path")
                  .attr("class", "chord")
                  .attr("stroke", function(d) { return d3.rgb(fill(d.source.index)).darker(); })
                  .attr("fill", function(d) { return fill(d.source.index); })
                  .attr("d", d3.svg.chord().radius(innerRadius));

              svg.selectAll(".chord").append("title").text(function(d) {
                 return fromNameByIndex.get(d.source.index)
                 + " → " + fromNameByIndex.get(d.target.index)
                 + ": " + d.source.value + " travels"
                 + "\n" + fromNameByIndex.get(d.target.index)
                 + " → " + fromNameByIndex.get(d.source.index)
                 + ": " + d.target.value + " travels";
              });

              $elem[0].svg = svg;

              if (location_label != null) {
                  svg.selectAll(".chord")
                      .filter(function(d) { return d.source.index != indexByFromName.get(location_label) && d.target.index != indexByFromName.get(location_label); })
                      .transition()
                      .style("opacity", .1);
              }

              // Returns an event handler for fading a given chord group.
              function fadeIn(opacity) {
                return function(g, i) {
                  $rootScope.$broadcast('rootScope:broadcast-not_inside_chord', { label : fromNameByIndex.get(g.index)});
                  svg.selectAll(".chord")
                      .filter(function(d) {return d.source.index != i && d.target.index != i; })
                      .transition()
                      .style("opacity", opacity);
                };
              }

              function fadeOut(opacity) {
                return function(g, i) {
                  $rootScope.$broadcast('rootScope:broadcast-leave', 'out');
                  svg.selectAll(".chord")
                      .filter(function(d) { return d.source.index != i && d.target.index != i; })
                      .transition()
                      .style("opacity", opacity);
                };
              }

              delay = 350;

            }, delay);
          }
      }
    };
}]);



app.directive('arcDiagram', ['DataManagerService', '$rootScope', function (DataManagerService, $rootScope) {

  var delay=1500;
  var jsonResEdges=null;
  var jsonResNodes=null;

  function getPos(el) {
      // yay readability
      for (var lx=0, ly=0;
           el != null;
           lx += el.offsetLeft, ly += el.offsetTop, el = el.offsetParent);
      return {x: lx,y: ly};
  }

  function sortEdges(set) {
    temp = [];
    set.forEach(function(d) {
      if (d.frequency<50) {
        
      }
      else {
        temp.push(d);
      }
    });
    return temp;
  }

  function filterNodes(edge_list, node_list) {
    var result = [];
    //var start = 0;
    for (var i = 0; i < node_list.length; i++) {
      for (var j = 0; j < edge_list.length; j++) {
        if(edge_list[j].source.x == node_list[i].x || edge_list[j].target.x == node_list[i].x){
          result.push(node_list[i]);
        }
        else{}
      };
    };
    // for (var k = 0; k < result.length; k++) {
    //   result[k].x=start;
    //   start +=50;
    //   console.dir(result)
    // };
    return result;
  }


  return {
        restrict: 'E',
        scope: true,
        link: function($scope, $elem, $attr) {


          // as there are two requests in one directive, they need to be done only when the
          // storage variables are null (first call). if they were done both every time,
          // the data would get mixed, causing bugs
          if (jsonResEdges==null) {
            DataManagerService.get('/arcedges', []).then(function(d) {
              jsonResEdges=d;
              // temp = sortEdges(jsonResEdges);
              // console.log(sortEdges(jsonResEdges))
              // jsonResEdges = temp;
            });
          }

          if (jsonResNodes==null) {
            DataManagerService.get('/arcnodes', []).then(function(d) {
              jsonResNodes=d;
              //console.log(jsonResNodes)

              // para retirar nodes sem viagens, buscar o x de cada objecto e comparar com o x da
              // source e target de cada edge. se não existir, retirar o node da lista
            });
          }
          

          $scope.$watch(function () {
              return $elem[0].parentNode.clientWidth;
            }, function ( w ) {
              if ( !w ) { return; }
              createArcGraph(null);
            });

          $scope.$watch(function () {
              return $elem[0].parentNode.clientHeight;
            }, function ( h ) {
            if ( !h ) { return; }
            createArcGraph(null);
           });

          $scope.$on('$destroy', function() {
            rootScopeBroadcast1();
            rootScopeBroadcast2();
            rootScopeBroadcast3();
            rootScopeBroadcast4();
            rootScopeBroadcastLeave1();
            rootScopeBroadcastLeave2();
            rootScopeBroadcastLeave3();
          });
          
          var rootScopeBroadcast1 = $rootScope.$on('rootScope:broadcast-not_inside_bar_chart', function (event, data) {
            console.log("arc diagram broadcast: " + JSON.stringify(data)); // 'Broadcast!'
            createArcGraph(data.label);
          });

          var rootScopeBroadcast2 = $rootScope.$on('rootScope:broadcast-not_inside_chord', function (event, data) {
            console.log("arc diagram broadcast: " + JSON.stringify(data)); // 'Broadcast!'
            createArcGraph(data.label);
          });

          var rootScopeBroadcast3 = $rootScope.$on('rootScope:broadcast-not_inside_hexbinPlaces', function (event, data) {
            console.log("arc diagram broadcast: " + JSON.stringify(data)); // 'Broadcast!'
            createArcGraph(data.label);
          });

          var rootScopeBroadcast4 = $rootScope.$on('rootScope:broadcast-not_inside_calendar', function (event, data) {
            console.log("arc diagram broadcast: " + JSON.stringify(data)); // 'Broadcast!'
            createArcGraph(data.label);
          });

          var rootScopeBroadcastLeave1 = $rootScope.$on('rootScope:broadcast-leave', function (event, data) {
            console.log("Arc diagram broadcast leave"); // 'Broadcast!'
          });

          var rootScopeBroadcastLeave2 = $rootScope.$on('rootScope:broadcast-leave-not_inside_bar_chart', function (event, data) {
            console.log("Arc diagram broadcast leave"); // 'Broadcast!'
          });

          var rootScopeBroadcastLeave3 = $rootScope.$on('rootScope:broadcast-leave-not_inside_calendar', function (event, data) {
            console.log("Arc diagram broadcast leave"); // 'Broadcast!'
          });

          function createArcGraph (location_label) {


            setTimeout(function() {


              $elem[0].svg = null;
              // console.dir(filterNodes(jsonResEdges, jsonResNodes))
              // jsonResNodes = filterNodes(jsonResEdges, jsonResNodes);                                                

              expEdges = jsonResEdges;
              expNodes = jsonResNodes;
              
              var nodeHash = {};
              for (x in jsonResNodes) {
                nodeHash[jsonResNodes[x].id] = jsonResNodes[x];
                jsonResNodes[x].x = parseInt(x) * 50; //50
              }
              for (x in jsonResEdges) {
                if (typeof nodeHash[jsonResEdges[x].source] === "undefined" || typeof nodeHash[jsonResEdges[x].target] === "undefined") {}
                else {
                  jsonResEdges[x].source = nodeHash[jsonResEdges[x].source];
                  jsonResEdges[x].target = nodeHash[jsonResEdges[x].target];
                }
              }

              var margin = {top: 20, right: 10, bottom: 20, left: 25},
                  width = $elem[0].parentNode.clientWidth - margin.left - margin.right,
                  height = $elem[0].parentNode.clientHeight - margin.top - margin.bottom;
              
              d3.select($elem[0]).selectAll("svg").remove()

              var svg = d3.select($elem[0]).append("svg")
                      .attr("width", width + margin.left + margin.right)
                      .attr("height", height + margin.top + margin.bottom-25)
                      .append("g")
                      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

              var arrow = svg.append('g')

                  arrow.append('text')
                  .attr('class', 'button-direction-1')
                  .attr('x', width/2)
                  .attr('y', 1400/height)
                  .html('&#x2192;');

                  arrow.append('text')
                  .attr('class', 'button-direction-2')
                  .attr('x', width/2)
                  .attr('y', height/1.1)
                  .html('&#x2190;');

                  arrow.append("text")
                  .attr('x', (width/2)-90)
                  .attr('y', (height/1.1)-3)
                  .text("From-To Direction:")

                  arrow.append("text")
                  .attr('x', (width/2)-90)
                  .attr('y', (1400/height)-3)
                  .text("From-To Direction:")

              var tooltip = d3.select($elem[0]).append('div') 
                  .attr("class", "arc-tooltip")      
                  .style("opacity", 0);

              var arcG = svg.append("g")
                        .attr("id", "arcG")
                        .attr("transform", "translate(" + (2/-width) + "," + (height/3) + ")"); 
                        //.attr("transform", "translate(50,250)");

              var transformation = [];

              var transformation = jsonResNodes.map(el => (
                { id: el.id}
              ));

              arcG.selectAll("path")
                .data(jsonResEdges)
                .enter()
                .append("path")
                .attr("id", "arcpath")
                .style("stroke", "black")
                .style("stroke-width", function(d) {return d.frequency * 2})
                .style("opacity", .25)
                .style("fill", "none")
                .attr("d", arc)
                .on("mouseover", edgeOver)
                .on("mouseout", function(d) {    
                    tooltip.transition()    
                        .duration(100)    
                        .style("opacity", 0); 
                });

              arcG.selectAll("circle")
                .data(jsonResNodes)
                .enter()
                .append("circle")
                .attr("id", "arccircle")
                .attr("r", 10)
                .style("fill", "lightgray")
                .style("stroke", "black")
                .style("stroke-width", "1px")
                .attr("cx", function (d) {return d.x}) // fix width responsiveness
                .on("mouseover", function(d) {

                  $rootScope.$broadcast('rootScope:broadcast-not_inside_arc', { label : d.id});
                  return nodeOver(d);
                })
                .on("mouseout", function(d) {
                    tooltip.transition()    
                        .duration(100)    
                        .style("opacity", 0);
                    $rootScope.$broadcast('rootScope:broadcast-leave', 'out');     
                });


              function arc(d,i) {
                  var draw = d3.svg.line().interpolate("basis");
                  var midX = (d.source.x + d.target.x) / 2;
                  var midY = (d.source.x - d.target.x) / (1400/height); // divisao decide altura do arco
                  // console.log(midX);
                  // console.log(midY);
                  // colocar divisão diferente para cada intervalo de nr de elementos
                  // ex: elementos < 10, (1200/height)->(200/height)
                  return draw([[d.source.x,0],[midX,midY],[d.target.x,0]]);
              }
              
              if (location_label != null) {
                d3.selectAll("#arccircle").style("fill", function (p) {return p.id == location_label ? "#BF0000" : "lightgray"})
              }

              function nodeOver(d,i) {
                d3.selectAll("#arccircle").style("fill", function (p) {return p == d ? "#BF0000" : "lightgray"})
                d3.selectAll("#arcpath").style("stroke", function (p) {return p.source == d || p.target == d ? "red" : "black"})
                tooltip.transition()    
                .duration(0)    
                .style("opacity", .9);    
                tooltip.html(d.id)
                .style("height", 30 + "px") 
                .style("left", (d3.event.layerX+10) + "px")
                .style("top", (d3.event.layerY+10) + "px");
                //$rootScope.$broadcast('rootScope:broadcast', { label : d.id});
              }
          
              function edgeOver(d) {
                d3.selectAll("#arcpath").style("stroke", function(p) {return p == d ? "red" : "black"})
                d3.selectAll("#arccircle").style("fill", function(p) {return p == d.source ? "#000ED4" : p == d.target ? "#43941C" : "lightgray"})
                tooltip.transition()    
                .duration(100)    
                .style("opacity", .9);    
                tooltip.html("From: " + d.source.id + "<br>" + "To: " + d.target.id)
                .style("height", 50 + "px")
                .style("left", (d3.event.layerX+10) + "px")
                .style("top", (d3.event.layerY+10) + "px");
              }
              
              $elem[0].svg = svg;
              delay=350;

            // delay=0; test delay here on 0 for the other vizs
            // it is a way to delete the load time used on the first copy of the viz

            }, delay);
          }
        }
      };

}]);



app.directive('staysGraph', ['DataManagerService', '$rootScope', function (DataManagerService, $rootScope) {

  var delay=1500;
  var jsonRes=null;

  return {
        restrict: 'E',
        scope: true,
        link: function($scope, $elem, $attr) {

          if (jsonRes==null) {
            DataManagerService.get('/staysgraph', []).then(function(d) {
              jsonRes=d;
            });
          }
          
          function getNodePos(el) {
              var body = d3.select($elem[0]).node();

              for (var lx = 0, ly = 0;
                   el != null && el != body;
                   lx += (el.offsetLeft || el.clientLeft), ly += (el.offsetTop || el.clientTop), el = (el.offsetParent || el.parentNode))
                  ;
              return {x: lx, y: ly};
          }

          $scope.$watch(function () {
              return $elem[0].parentNode.clientWidth;
            }, function ( w ) {
              if ( !w ) { return; }
              createStaysGraph();
            });

          $scope.$watch(function () {
              return $elem[0].parentNode.clientHeight;
            }, function ( h ) {
            if ( !h ) { return; }
            createStaysGraph();
           });

          function createStaysGraph () {

            setTimeout(function() {

              $elem[0].svg = null;
              
              //var days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
              var days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
                  times = d3.range(24);

              var margin = {top: 70, right: 10, bottom: 20, left: 25},
                  width = $elem[0].parentNode.clientWidth - margin.left - margin.right,
                  //height = $elem[0].parentNode.clientHeight - margin.top - margin.bottom;
                  gridSize = Math.floor(width / times.length),
                  height = gridSize * (days.length);

              d3.select($elem[0]).selectAll("svg").remove()

              var svg = d3.select($elem[0]).append("svg")
                      .attr("width", width + margin.left + margin.right)
                      .attr("height", height + margin.top + margin.bottom)
                      .append("g")
                      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

              //Reset the overall font size
              var newFontSize = width * 62.5 / 900;
              d3.select("html").style("font-size", newFontSize + "%");

              var colorScale = d3.scale.linear()
                  .domain([0, d3.max(jsonRes, function(d) {return d.time_spent; })/2, d3.max(jsonRes, function(d) {return d.time_spent; })])
                  .range(["#FFFFDD", "#3E9583", "#1F2D86"])

              var dayLabels = svg.selectAll(".dayLabel")
                  .data(days)
                  .enter().append("text")
                  .text(function (d) { return d; })
                  .attr("x", 0)
                  .attr("y", function (d, i) { return i * gridSize; })
                  .style("text-anchor", "end")
                  .attr("transform", "translate(-6," + gridSize / 1.5 + ")")

              var timeLabels = svg.selectAll(".timeLabel")
                  .data(times)
                  .enter().append("text")
                  .attr("class", "hour-size")
                  .text(function(d) { return d + "h"; })
                  .attr("x", function(d, i) { return i * gridSize; })
                  .attr("y", 0)
                  .style("text-anchor", "middle")
                  .attr("transform", "translate(" + gridSize / 2 + ", -6)")

              var data = d3.nest()
              .key(function(d) { return d.day;})
              .key(function(d) { return d.hour;})
              .key(function(d) { return d.label;})
              .rollup(function(d) { 
               return d3.sum(d, function(g) {return g.time_spent; });
              })
              .entries(jsonRes);


              var heatMap = svg.selectAll(".hour")
                  .data(jsonRes)
                  .enter().append("rect")

                    //----attach data to rect---
                   .attr("data", function(d, i) {
                      // console.log(d.label.join(", "));
                      // return d.label;
                      return d.label.join(", ");
                    })
                   .attr("data2", function(d, i) {return d.time_spent;})
                   .attr("onmouseover","showData(evt)")
                   .attr("onmouseout","hideData(evt)")
                  .attr("x", function(d) { return (d.hour - 1) * gridSize; })
                  .attr("y", function(d) { return (d.day - 1) * gridSize; })
                  .attr("class", "hour bordered")
                  .attr("width", gridSize)
                  .attr("height", gridSize)
                  .style("stroke", "white")
                  .style("stroke-opacity", 0.6)
                  .style("stroke-width", 0.8)
                  .style("fill", function(d) { return colorScale(d.time_spent); });

                  window.showData = function(evt) {
                      var target=evt.target
                      target.setAttribute("opacity",".8")

                      //---locate dataDiv near cursor--
                      var x = evt.layerX;
                      var y = evt.layerY;

                      dataDiv.style.width=200+"px"
                      dataDiv.style.left=10+x+"px"
                      dataDiv.style.top=10+y+"px"
                      //---data--
                      var data=target.getAttribute("data")
                      var data2=target.getAttribute("data2")

                      //---format as desired---
                      var html=data
                      // var html2=data2
                      // dataDiv.innerHTML = '<div class="header"><strong>' + 'Stays' + ' </strong></div><br>'
                      //                       + '<div><span><strong>' + html + '</strong></span>' + '<span>' 
                      //                       + '&nbsp' + '&nbsp' + '&nbsp'+ '&nbsp' + '&nbsp'
                      //                       + html2 + ' minutes' + '</span></div>';
                      dataDiv.innerHTML = '<div class="header"><strong>' + 'Main stay(s) in: ' + ' </strong></div><br>'
                                            + '<div><span>' + html + '</span>' + '<span>';
                      dataDiv.style.visibility="visible"

                  }
                  window.hideData = function(evt) {
                      dataDiv.style.visibility="hidden"
                      var target=evt.target
                      target.removeAttribute("opacity")
                  }

              $elem[0].svg = svg;

              delay = 250;

            }, delay);
          }
        }
      };

}]);

