app.directive('calendarHeatmap', ['DataManagerService', '$rootScope', function (DataManagerService, $rootScope) {

	//var delay=550; // scalability
  var data=null; // instead of jsonRes to avoid replacing the name of too many variables

  // **************************** EXAMPLE DATA ***********************

      // var now = moment().endOf('day').toDate();
      // var yearAgo = moment().startOf('day').subtract(1, 'year').toDate();
      // var data = d3.time.days(yearAgo, now).map(function (dateElement) {
      //   return {
      //       date: dateElement,
      //       details: Array.apply(null, new Array(Math.floor(Math.random() * 25))).map(function(e, i, arr) {
      //         return {
      //           'name': 'Place ' + Math.floor(Math.random() * 10),
      //           'date': function () {
      //             var projectDate = new Date(dateElement.getTime());
      //             projectDate.setHours(Math.floor(Math.random() * 24))
      //             projectDate.setMinutes(Math.floor(Math.random() * 60));
      //             return projectDate;
      //           }(),
      //           'value': 3600 * ((arr.length - i) / 5) + Math.floor(Math.random() * 3600)
      //         }
      //       }),
      //     init: function () {
      //       this.total = this.details.reduce(function (prev, e) {
      //         return prev + e.value;
      //       }, 0);
      //       return this;
      //     }
      //   }.init();
      // });

  // **************************** EXAMPLE DATA ***********************


    return {
      restrict: 'E',
      scope: true,
      replace: true,
      link: function ($scope, $elem, $attr) {


        if (data==null) {
            DataManagerService.get('/calendar', []).then(function(d) {
              data=d;
                // Get daily summary if that was not provided
                if ( !data[0].summary ) {
                  data.map(function (d) {
                    var summary = d.details.reduce( function(uniques, project) {
                      if ( !uniques[project.name] ) {
                        uniques[project.name] = {
                          'value': project.value
                        };
                      } else {
                        uniques[project.name].value += project.value;
                      }
                      return uniques;
                    }, {});
                    var unsorted_summary = Object.keys(summary).map(function (key) {
                      return {
                        'name': key,
                        'value': summary[key].value
                      };
                    });
                    d.summary = unsorted_summary.sort(function (a, b) {
                      return b.value - a.value;
                    });
                    return d;
                  });
                }
            });
        }

        var margin = {top: 20, right: 10, bottom: 20, left: 10};
        var gutter = 5;
        var item_gutter = 1;
        var initialWidth = 1000;
        var initialHeight = ($elem[0].parentNode.clientHeight);
        var item_size = 10;
        var label_padding = 40;
        var max_block_height = 20;
        var in_transition = false;
        var delay=350;
        var transition_duration = 500;

        // Tooltip defaults
        var tooltip_width = 250;
        var tooltip_padding = 15;

        // Initialize current overview type and history
        $scope.overview = $scope.overview || 'year';
        $scope.history = ['year'];
        $scope.selected = {};

        d3.select($elem[0]).selectAll("svg").remove()
        // Initialize svg element
        var svg = d3.select($elem[0]).append('svg')
          .attr('class', 'svg')

        // Initialize main svg elements
        var items = svg.append('g').attr("transform", "translate(" + 0 + "," + 0 + ")");
        var labels = svg.append('g').attr("transform", "translate(" + 0 + "," + 0 + ")");
        var buttons = svg.append('g');
       
        // Add tooltip to the same element as main svg
        var tooltip = d3.select($elem[0]).append('div')
          .attr('class', 'heatmap-tooltip')
          .style('opacity', 0);

        setTimeout(function() {
          $scope.$watch(function () {
            return $elem[0].parentNode.clientWidth;
          }, function ( w ) {
            if ( !w ) { return; }
            width = w < 1000 ? 1000 : w;
            item_size = ((width - label_padding) / (moment().subtract(1, 'year').weeksInYear() - moment().subtract(1, 'year').week() + moment().week() + 1) - gutter);
            height = label_padding + 7 * (item_size + gutter);
            svg.attr({'width': width, 'height': height});
            //if ( !!data && !!data[0].summary ) {
                drawChart();
              //}
          });

        }, delay);


        $scope.$on('$destroy', function() {

          });

        /**
         * Draw the chart based on the current overview type
         */
         function drawChart() {
          if ( !data ) { return; }

          if ( $scope.overview === 'year' ) {
              drawYearOverview();
            } else if ( $scope.overview === 'month' ) {
              drawMonthOverview();
            } else if ( $scope.overview === 'week' ) {
              drawWeekOverview();
            } else if ( $scope.overview === 'day' ) {
              drawDayOverview();
            }
        };

          /**
           * Draw year overview
           */
        function drawYearOverview() {

            $elem[0].svg = null;

            // Add current overview to the history
            if ( $scope.history[$scope.history.length-1] !== $scope.overview ) {
              $scope.history.push($scope.overview);
            }

            var year_ago = moment().startOf('day').subtract(1, 'year');
            var max_value = d3.max(data, function (d) {
              return d.total;
            });

            var color = d3.scale.linear()
              .range(['#ffffff', '#3b6427' || '#ff4500'])
              .domain([-0.15 * max_value, max_value * 1.1]); // test some different color domains
              // to see differences more easily in the year overview

            var calcItemX = function (d) {
              var date = moment(d.date);
              var week_num = date.week() - year_ago.week() + (year_ago.weeksInYear() * (date.weekYear() - year_ago.weekYear()));
              return week_num * (item_size + gutter) + label_padding;
            };
            var calcItemY = function (d) {
              return label_padding + moment(d.date).weekday() * (item_size + gutter);
            };
            var calcItemSize = function (d) {
              if ( max_value <= 0 ) { return item_size; }
              return item_size * 0.75 + (item_size * d.total / max_value) * 0.25;
            };

            items.selectAll('.item-circle').remove();
            items.selectAll('.item-circle')
              .data(data)
              .enter()
              .append('rect')
              .attr('class', 'item item-circle')
              .style('opacity', 0)
              .attr('rx', function (d) {
                return calcItemSize(d);
              })
              .attr('ry', function (d) {
                return calcItemSize(d);
              })
              .attr('x', function (d) {
                return calcItemX(d) + (item_size - calcItemSize(d)) / 2;
              })
              .attr('y', function (d) {
                return calcItemY(d) + (item_size - calcItemSize(d)) / 2;
              })
              .attr('width', function (d) {
                return calcItemSize(d);
              })
              .attr('height', function (d) {
                return calcItemSize(d);
              })
              .attr('fill', function (d) {
                return ( d.total > 0 ) ? color(d.total) : 'transparent';
              })
              .on('click', function (d) {
                if ( in_transition ) { return; }
  
                // Don't transition if there is no data to show
                if ( d.total === 0 ) { return; }
  
                in_transition = true;

                // Set selected date to the one clicked on
                $scope.selected = d;

                // Hide tooltip
                hideTooltip();

                // Remove all year overview related items and labels
                removeYearOverview();
  
                // Redraw the chart
                $scope.overview = 'day';
                drawChart();
              })
              .on('mouseover', function (d) {
                if ( in_transition ) { return; }

                // Pulsating animation
                var circle = d3.select(this);
                (function repeat() {
                  circle = circle.transition()
                    .duration(transition_duration)
                    .ease('ease-in')
                    .attr('x', function (d) {
                      return calcItemX(d) - (item_size * 1.1 - item_size) / 2;
                    })
                    .attr('y', function (d) {
                      return calcItemY(d) - (item_size * 1.1 - item_size) / 2;
                    })
                    .attr('width', item_size * 1.1)
                    .attr('height', item_size * 1.1)
                    .transition()
                    .duration(transition_duration)
                    .ease('ease-in')
                    .attr('x', function (d) {
                      return calcItemX(d) + (item_size - calcItemSize(d)) / 2;
                    })
                    .attr('y', function (d) {
                      return calcItemY(d) + (item_size - calcItemSize(d)) / 2;
                    })
                    .attr('width', function (d) {
                      return calcItemSize(d);
                    })
                    .attr('height', function (d) {
                      return calcItemSize(d);
                    })
                    .each('end', repeat);
                })();
  
                // Construct tooltip
                var tooltip_html = '';
                tooltip_html += '<div class="header"><strong>' + (d.total ? formatTime(d.total) : 'No time') + ' tracked</strong></div>';
                tooltip_html += '<div>on ' + moment(d.date).format('dddd, MMM Do YYYY') + '</div><br>';
  
                // Add summary to the tooltip
                angular.forEach(d.summary, function (d) {
                  tooltip_html += '<div><span><strong>' + d.name + '</strong></span>';
                  tooltip_html += '<span>' + formatTime(d.value) + '</span></div>';
                });

                // Calculate tooltip position
                var x = calcItemX(d) + item_size;
                if ( width - x < (tooltip_width + tooltip_padding * 3) ) {
                  x -= tooltip_width + tooltip_padding * 2;
                }
                var y = calcItemY(d) + item_size;
                // Show tooltip
                tooltip.html(tooltip_html)
                  .style('left', x + 'px')
                  .style('top', y + 'px')
                  .transition()
                    .duration(transition_duration / 2)
                    .ease('ease-in')
                    .style('opacity', 1);
              })
              .on('mouseout', function () {
                if ( in_transition ) { return; }
  
                // Set circle radius back to what it's supposed to be
                d3.select(this).transition()
                  .duration(transition_duration / 2)
                  .ease('ease-in')
                  .attr('x', function (d) {
                    return calcItemX(d) + (item_size - calcItemSize(d)) / 2;
                  })
                  .attr('y', function (d) {
                    return calcItemY(d) + (item_size - calcItemSize(d)) / 2;
                  })
                  .attr('width', function (d) {
                    return calcItemSize(d);
                  })
                  .attr('height', function (d) {
                    return calcItemSize(d);
                  });

                // Hide tooltip
                hideTooltip();
              })
              .transition()
                .delay(function () {
                  return (Math.cos(Math.PI * Math.random()) + 1) * transition_duration;
                })
                .duration(function () {
                  return transition_duration;
                })
                .ease('ease-in')
                .style('opacity', 1)
                .call(function (transition, callback) {
                  if ( transition.empty() ) {
                    callback();
                  }
                  var n = 0;
                  transition
                    .each(function() { ++n; })
                    .each('end', function() {
                      if ( !--n ) {
                        callback.apply(this, arguments);
                      }
                    });
                  }, function() {
                    in_transition = false;
                  });

            // Add month labels
            var today = moment().endOf('day');
            var today_year_ago = moment().startOf('day').subtract(1, 'year');
            var month_labels = d3.time.months(today_year_ago.startOf('month'), today);
            var monthScale = d3.scale.linear()
              .range([0, width])
              .domain([0, month_labels.length]);
            labels.selectAll('.label-month').remove();
            labels.selectAll('.label-month')
              .data(month_labels)
              .enter()
              .append('text')
              .attr('class', 'label label-month')
              .style('font-size', function () {
                return Math.floor(label_padding / 2.5) + 'px';
              })
              .text(function (d) {
                return d.toLocaleDateString('en-us', {month: 'short'});
              })
              .attr('x', function (d, i) {
                return monthScale(i) + (monthScale(i) - monthScale(i-1)) / 2;
              })
              .attr('y', label_padding / 2)
              .on('mouseenter', function (d) {
                if ( in_transition ) { return; }
                var selected_month = moment(d);
                items.selectAll('.item-circle')
                  .transition()
                  .duration(transition_duration)
                  .ease('ease-in')
                  .style('opacity', function (d) {
                    return moment(d.date).isSame(selected_month, 'month') ? 1 : 0.1;
                  });
              })
              .on('mouseout', function () {
                if ( in_transition ) { return; }
                items.selectAll('.item-circle')
                  .transition()
                  .duration(transition_duration)
                  .ease('ease-in')
                  .style('opacity', 1);
              })
              .on('click', function (d) {
                if ( in_transition ) { return; }
  
                // Check month data
                var month_data = data.filter(function (e) {
                  return moment(d).startOf('month') <= moment(e.date) && moment(e.date) < moment(d).endOf('month');
                });
  
                // Don't transition if there is no data to show
                if ( !month_data.length ) { return; }
  
                // Set selected month to the one clicked on
                $scope.selected = {date: d};

                in_transition = true;
 
                // Hide tooltip
                hideTooltip();
  
                // Remove all year overview related items and labels
                removeYearOverview();
  
                // Redraw the chart
                $scope.overview = 'month';
                drawChart();
              });

            // Add day labels
            var day_labels = d3.time.days(moment().startOf('week'), moment().endOf('week'));
            var dayScale = d3.scale.ordinal()
              .rangeRoundBands([label_padding, height])
              .domain(day_labels.map(function (d) {
                return moment(d).weekday();
              }));
            labels.selectAll('.label-day').remove();
            labels.selectAll('.label-day')
              .data(day_labels)
              .enter()
              .append('text')
              .attr('class', 'label label-day')
              .attr('x', label_padding / 3)
              .attr('y', function (d, i) {
                return dayScale(i) + dayScale.rangeBand() / 1.75;
              })
              .style('text-anchor', 'left')
              .style('font-size', function () {
                return Math.floor(label_padding / 2.5) + 'px';
              })
              .text(function (d) {
                return moment(d).format('dddd')[0];
              })
              .on('mouseenter', function (d) {
                if ( in_transition ) { return; }
                var selected_day = moment(d);
                items.selectAll('.item-circle')
                  .transition()
                  .duration(transition_duration)
                  .ease('ease-in')
                  .style('opacity', function (d) {
                    return (moment(d.date).day() === selected_day.day()) ? 1 : 0.1;
                  });
              })
              .on('mouseout', function () {
                if ( in_transition ) { return; }
                items.selectAll('.item-circle')
                  .transition()
                  .duration(transition_duration)
                  .ease('ease-in')
                  .style('opacity', 1);
              });

              $elem[0].svg = svg;

          };


          /**
           * Draw month overview
           */
          function drawMonthOverview () {
            
            $elem[0].svg = null;

            // Add current overview to the history
            if ( $scope.history[$scope.history.length-1] !== $scope.overview ) {
              $scope.history.push($scope.overview);
            }

            // Define beginning and end of the month
            var start_of_month = moment($scope.selected.date).startOf('month');
            var end_of_month = moment($scope.selected.date).endOf('month');

            // Filter data down to the selected month
            var month_data = data.filter(function (d) {
              return start_of_month <= moment(d.date) && moment(d.date) < end_of_month;
            });

            var max_value = d3.max(month_data, function (d) {
              return d3.max(d.summary, function (d) {
                return d.value;
              });
            });     

            // Define day labels and axis
            var day_labels = d3.time.days(moment().startOf('week'), moment().endOf('week'));
            var dayScale = d3.scale.ordinal()
              .rangeRoundBands([label_padding, height])
              .domain(day_labels.map(function (d) {
                return moment(d).weekday();
              }));
  
            // Define week labels and axis
            var week_labels = [start_of_month.clone()];
            while ( start_of_month.week() !== end_of_month.week() ) {
              week_labels.push(start_of_month.add(1, 'week').clone());
            }
  
            var weekScale = d3.scale.ordinal()
              .rangeRoundBands([label_padding, width], 0.05)
              .domain(week_labels.map(function(weekday) {
                return weekday.week();
              }));

            // Add month data items to the overview
            items.selectAll('.item-block-month').remove();
            var item_block = items.selectAll('.item-block-month')
              .data(month_data)
              .enter()
              .append('g')
              .attr('class', 'item item-block-month')
              .attr('width', function () {
                return (width - label_padding) / week_labels.length - gutter * 5;
              })
              .attr('height', function () {
                return Math.min(dayScale.rangeBand(), max_block_height);
              })
              .attr('transform', function (d) {
                return 'translate(' + weekScale(moment(d.date).week()) + ',' + ((dayScale(moment(d.date).weekday()) + dayScale.rangeBand() / 1.75) - 15)+ ')';
              })
              .attr('total', function (d) {
                return d.total;
              })
              .attr('date', function (d) {
                return d.date;
              })
              .attr('offset', 0)
              .on('click', function (d) {
                if ( in_transition ) { return; }
  
                // Don't transition if there is no data to show
                if ( d.total === 0 ) { return; }
  
                in_transition = true;
  
                // Set selected date to the one clicked on
                $scope.selected = d;
  
                // Hide tooltip
                hideTooltip();
  
                // Remove all month overview related items and labels
                removeMonthOverview();
  
                // Redraw the chart
                $scope.overview = 'day';
                drawChart();
              });
  
            var item_width = (width - label_padding) / week_labels.length - gutter * 5;
            var itemScale = d3.scale.linear()
              .rangeRound([0, item_width]);
  
            item_block.selectAll('.item-block-rect')
              .data(function (d) {
                return d.summary;
              })
              .enter()
              .append('rect')
              .attr('class', 'item item-block-rect')
              .attr('x', function (d) {
                var total = parseInt(d3.select(this.parentNode).attr('total'));
                var offset = parseInt(d3.select(this.parentNode).attr('offset'));
                itemScale.domain([0, total]);
                d3.select(this.parentNode).attr('offset', offset + itemScale(d.value));
                return offset;
              })
              .attr('width', function (d) {
                var total = parseInt(d3.select(this.parentNode).attr('total'));
                itemScale.domain([0, total]);
                return Math.max((itemScale(d.value) - item_gutter), 1)
              })
              .attr('height', function () {
                return Math.min(dayScale.rangeBand(), max_block_height);
              })
              .attr('fill', function (d) {
                var color = d3.scale.linear()
                  .range(['#ffffff', '#3b6427' || '#ff4500'])
                  .domain([-0.15 * max_value, max_value]);
                return color(d.value) || '#ff4500';
              })
              .style('opacity', 0)
              .on('mouseover', function(d) {
                if ( in_transition ) { return; }

                $rootScope.$broadcast('rootScope:broadcast-not_inside_calendar', { label : d.name});

                // Get date from the parent node
                var date = new Date(d3.select(this.parentNode).attr('date'));
  
                // Construct tooltip
                var tooltip_html = '';
                tooltip_html += '<div class="header"><strong>' + d.name + '</strong></div><br>';
                tooltip_html += '<div><strong>' + (d.value ? formatTime(d.value) : 'No time') + ' tracked</strong></div>';
                tooltip_html += '<div>on ' + moment(date).format('dddd, MMM Do YYYY') + '</div>';
  
                // Calculate tooltip position
                var x = weekScale(moment(date).week()) + tooltip_padding;
                while ( width - x < (tooltip_width + tooltip_padding * 3) ) {
                  x -= 10;
                }
                var y = dayScale(moment(date).weekday()) + tooltip_padding * 2;
  
                // Show tooltip
                tooltip.html(tooltip_html)
                  .style('left', x + 'px')
                  .style('top', y + 'px')
                  .transition()
                    .duration(transition_duration / 2)
                    .ease('ease-in')
                    .style('opacity', 1);
              })
              .on('mouseout', function () {
                if ( in_transition ) { return; }
                $rootScope.$broadcast('rootScope:broadcast-leave-not_inside_calendar', 'out'); 
                hideTooltip();
              })
              .transition()
                .delay(function () {
                  return (Math.cos(Math.PI * Math.random()) + 1) * transition_duration;
                })
                .duration(function () {
                  return transition_duration;
                })
               .ease('ease-in')
                .style('opacity', 1)
                .call(function (transition, callback) {
                  if ( transition.empty() ) {
                    callback();
                  }
                  var n = 0;
                  transition
                    .each(function() { ++n; })
                    .each('end', function() {
                      if ( !--n ) {
                        callback.apply(this, arguments);
                      }
                    });
                  }, function() {
                    in_transition = false;
                  });
 
            // Add week labels
            labels.selectAll('.label-week').remove();
            labels.selectAll('.label-week')
              .data(week_labels)
              .enter()
              .append('text')
              .attr('class', 'label label-week')
              .attr('font-size', function () {
                return Math.floor(label_padding / 3) + 'px';
              })
              .text(function (d) {
                return 'Week ' + d.week();
              })
              .attr('x', function (d) {
                return weekScale(d.week());
              })
              .attr('y', label_padding / 2)
              .on('mouseenter', function (weekday) {
                if ( in_transition ) { return; }
  
                items.selectAll('.item-block-month')
                  .transition()
                  .duration(transition_duration)
                  .ease('ease-in')
                  .style('opacity', function (d) {
                    return ( moment(d.date).week() === weekday.week() ) ? 1 : 0.1;
                  });
              })
              .on('mouseout', function () {
                if ( in_transition ) { return; }
  
                items.selectAll('.item-block-month')
                  .transition()
                  .duration(transition_duration)
                  .ease('ease-in')
                  .style('opacity', 1);
              })
              .on('click', function (d) {
                if ( in_transition ) { return; }

                // Check week data
                var week_data = data.filter(function (e) {
                  return d.startOf('week') <= moment(e.date) && moment(e.date) < d.endOf('week');
                });
  
                // Don't transition if there is no data to show
                if ( !week_data.length ) { return; }

                in_transition = true;
  
                // Set selected month to the one clicked on
                $scope.selected = { date: d };
  
                // Hide tooltip
                hideTooltip();
  
                // Remove all year overview related items and labels
                removeMonthOverview();
  
                // Redraw the chart
                $scope.overview = 'week';
                drawChart();
             });

            // Add day labels
            labels.selectAll('.label-day').remove();
            labels.selectAll('.label-day')
              .data(day_labels)
              .enter()
              .append('text')
              .attr('class', 'label label-day')
              .attr('x', label_padding / 3)
              .attr('y', function (d, i) {
                return dayScale(i) + dayScale.rangeBand() / 1.75;
              })
              .style('text-anchor', 'left')
              .attr('font-size', function () {
                return Math.floor(label_padding / 3) + 'px';
              })
              .text(function (d) {
                return moment(d).format('dddd')[0];
              })
              .on('mouseenter', function (d) {
                if ( in_transition ) { return; }
  
                var selected_day = moment(d);
                items.selectAll('.item-block-month')
                  .transition()
                  .duration(transition_duration)
                  .ease('ease-in')
                  .style('opacity', function (d) {
                    return (moment(d.date).day() === selected_day.day()) ? 1 : 0.1;
                  });
              })
              .on('mouseout', function () {
                if ( in_transition ) { return; }
  
                items.selectAll('.item-block-month')
                  .transition()
                  .duration(transition_duration)
                  .ease('ease-in')
                  .style('opacity', 1);
              });
              // Add button to switch back to year overview
              drawButton();

              $elem[0].svg = svg;

          };


          /**
           * Draw week overview
           */
          function drawWeekOverview() {
            // Add current overview to the history
            if ( $scope.history[$scope.history.length-1] !== $scope.overview ) {
              $scope.history.push($scope.overview);
            }
  
            // Define beginning and end of the week
            var start_of_week = moment($scope.selected.date).startOf('week');
            var end_of_week = moment($scope.selected.date).endOf('week');
  
            // Filter data down to the selected week
            var week_data = data.filter(function (d) {
              return start_of_week <= moment(d.date) && moment(d.date) < end_of_week;
            });
            var max_value = d3.max(week_data, function (d) {
              return d3.max(d.summary, function (d) {
                return d.value;
              });
            });
  
            // Define day labels and axis
            var day_labels = d3.time.days(moment().startOf('week'), moment().endOf('week'));
            var dayScale = d3.scale.ordinal()
              .rangeRoundBands([label_padding, height])
              .domain(day_labels.map(function (d) {
                return moment(d).weekday();
            }));
  
            // Define week labels and axis
            var week_labels = [start_of_week];
            var weekScale = d3.scale.ordinal()
              .rangeRoundBands([label_padding, width], 0.01)
              .domain(week_labels.map(function (weekday) {
                return weekday.week();
              }));
  
            // Add week data items to the overview
            items.selectAll('.item-block-week').remove();
            var item_block = items.selectAll('.item-block-week')
              .data(week_data)
              .enter()
              .append('g')
              .attr('class', 'item item-block-week')
              .attr('width', function () {
                return (width - label_padding) / week_labels.length - gutter * 5;
              })
              .attr('height', function () {
                return Math.min(dayScale.rangeBand(), max_block_height);
              })
              .attr('transform', function (d) {
                return 'translate(' + weekScale(moment(d.date).week()) + ',' + ((dayScale(moment(d.date).weekday()) + dayScale.rangeBand() / 1.75) - 15)+ ')';
              })
              .attr('total', function (d) {
                return d.total;
              })
              .attr('date', function (d) {
                return d.date;
              })
              .attr('offset', 0)
              .on('click', function (d) {
                if ( in_transition ) { return; }
  
                // Don't transition if there is no data to show
                if ( d.total === 0 ) { return; }
  
                in_transition = true;
  
                // Set selected date to the one clicked on
                $scope.selected = d;
  
                // Hide tooltip
                hideTooltip();
  
                // Remove all week overview related items and labels
                removeWeekOverview();
  
                // Redraw the chart
                $scope.overview = 'day';
                drawChart();
              });
  
            var item_width = (width - label_padding) / week_labels.length - gutter * 5;
            var itemScale = d3.scale.linear()
              .rangeRound([0, item_width]);
  
            item_block.selectAll('.item-block-rect')
              .data(function (d) {
                return d.summary;
              })
              .enter()
              .append('rect')
              .attr('class', 'item item-block-rect')
              .attr('x', function (d) {
                var total = parseInt(d3.select(this.parentNode).attr('total'));
                var offset = parseInt(d3.select(this.parentNode).attr('offset'));
                itemScale.domain([0, total]);
                d3.select(this.parentNode).attr('offset', offset + itemScale(d.value));
                return offset;
              })
              .attr('width', function (d) {
                var total = parseInt(d3.select(this.parentNode).attr('total'));
                itemScale.domain([0, total]);
                return Math.max((itemScale(d.value) - item_gutter), 1)
              })
              .attr('height', function () {
                return Math.min(dayScale.rangeBand(), max_block_height);
              })
              .attr('fill', function (d) {
                var color = d3.scale.linear()
                  .range(['#ffffff', '#3b6427' || '#ff4500'])
                  .domain([-0.15 * max_value, max_value]);
                return color(d.value) || '#ff4500';
              })
              .style('opacity', 0)
              .on('mouseover', function(d) {
                if ( in_transition ) { return; }

                $rootScope.$broadcast('rootScope:broadcast-not_inside_calendar', { label : d.name});
  
                // Get date from the parent node
                var date = new Date(d3.select(this.parentNode).attr('date'));
  
                // Construct tooltip
                var tooltip_html = '';
                tooltip_html += '<div class="header"><strong>' + d.name + '</strong></div><br>';
                tooltip_html += '<div><strong>' + (d.value ? formatTime(d.value) : 'No time') + ' tracked</strong></div>';
                tooltip_html += '<div>on ' + moment(date).format('dddd, MMM Do YYYY') + '</div>';
  
                // Calculate tooltip position
                var total = parseInt(d3.select(this.parentNode).attr('total'));
                itemScale.domain([0, total]);
                var x = parseInt(d3.select(this).attr('x')) + itemScale(d.value) / 4 + tooltip_width / 4;
                while ( width - x < (tooltip_width + tooltip_padding * 3) ) {
                  x -= 10;
                }
                var y = dayScale(moment(date).weekday()) + tooltip_padding * 1.5;
  
                // Show tooltip
                tooltip.html(tooltip_html)
                  .style('left', x + 'px')
                  .style('top', y + 'px')
                  .transition()
                    .duration(transition_duration / 2)
                    .ease('ease-in')
                    .style('opacity', 1);
              })
              .on('mouseout', function () {
                if ( in_transition ) { return; }
                $rootScope.$broadcast('rootScope:broadcast-leave-not_inside_calendar', 'out'); 
                hideTooltip();
              })
              .transition()
                .delay(function () {
                  return (Math.cos(Math.PI * Math.random()) + 1) * transition_duration;
                })
                .duration(function () {
                  return transition_duration;
                })
                .ease('ease-in')
                .style('opacity', 1)
                .call(function (transition, callback) {
                  if ( transition.empty() ) {
                    callback();
                  }
                  var n = 0;
                  transition
                    .each(function() { ++n; })
                    .each('end', function() {
                      if ( !--n ) {
                        callback.apply(this, arguments);
                      }
                    });
                  }, function() {
                    in_transition = false;
                  });
  
            // Add week labels
            labels.selectAll('.label-week').remove();
            labels.selectAll('.label-week')
              .data(week_labels)
              .enter()
              .append('text')
              .attr('class', 'label label-week')
              .attr('font-size', function () {
                return Math.floor(label_padding / 3) + 'px';
              })
              .text(function (d) {
                return 'Week ' + d.week();
              })
              .attr('x', function (d) {
                return weekScale(d.week());
              })
              .attr('y', label_padding / 2)
              .on('mouseenter', function (weekday) {
                if ( in_transition ) { return; }
  
                items.selectAll('.item-block-week')
                  .transition()
                  .duration(transition_duration)
                  .ease('ease-in')
                  .style('opacity', function (d) {
                    return ( moment(d.date).week() === weekday.week() ) ? 1 : 0.1;
                  });
              })
              .on('mouseout', function () {
                if ( in_transition ) { return; }
  
                items.selectAll('.item-block-week')
                  .transition()
                  .duration(transition_duration)
                  .ease('ease-in')
                  .style('opacity', 1);
              });
  
            // Add day labels
            labels.selectAll('.label-day').remove();
            labels.selectAll('.label-day')
              .data(day_labels)
              .enter()
              .append('text')
              .attr('class', 'label label-day')
              .attr('x', label_padding / 3)
              .attr('y', function (d, i) {
                return dayScale(i) + dayScale.rangeBand() / 1.75;
              })
              .style('text-anchor', 'left')
              .attr('font-size', function () {
                return Math.floor(label_padding / 3) + 'px';
              })
              .text(function (d) {
                return moment(d).format('dddd')[0];
              })
              .on('mouseenter', function (d) {
                if ( in_transition ) { return; }
  
                var selected_day = moment(d);
                items.selectAll('.item-block-week')
                  .transition()
                  .duration(transition_duration)
                  .ease('ease-in')
                  .style('opacity', function (d) {
                    return (moment(d.date).day() === selected_day.day()) ? 1 : 0.1;
                  });
              })
              .on('mouseout', function () {
                if ( in_transition ) { return; }
  
                items.selectAll('.item-block-week')
                  .transition()
                  .duration(transition_duration)
                  .ease('ease-in')
                  .style('opacity', 1);
              });
  
            // Add button to switch back to year overview
            drawButton();
          };
  

          /**
           * Draw day overview
           */
          function drawDayOverview(){

            $elem[0].svg = null;

            // Add current overview to the history
            if ( $scope.history[$scope.history.length-1] !== $scope.overview ) {
              $scope.history.push($scope.overview);
            }

            // Initialize selected date to today if it was not set
            if ( !Object.keys($scope.selected).length ) {
                $scope.selected = data[data.length - 1];
            }
  
            var project_labels = $scope.selected.summary.map(function (project) {
              return project.name;
            });
            var projectScale = d3.scale.ordinal()
              .rangeRoundBands([label_padding, height])
              .domain(project_labels);
  
            var itemScale = d3.time.scale()
              .range([label_padding*2, width])
              .domain([moment($scope.selected.date).startOf('day'), moment($scope.selected.date).endOf('day')]);
            items.selectAll('.item-block').remove();
            items.selectAll('.item-block')
              .data($scope.selected.details)
              .enter()
              .append('rect')
              .attr('class', 'item item-block')
              .attr('x', function (d) {
                return itemScale(moment(d.date));
              })
              .attr('y', function (d) {
                return (projectScale(d.name) + projectScale.rangeBand() / 2) - 15;
              })
              .attr('width', function (d) {
                var end = itemScale(d3.time.second.offset(moment(d.date), d.value));
                return Math.max((end - itemScale(moment(d.date))), 1);
               })
              .attr('height', function () {
                return Math.min(projectScale.rangeBand(), max_block_height);
              })
              .attr('fill', function () {
                return '#3b6427';
              })
              .style('opacity', 0)
              .on('mouseover', function(d) {
                if ( in_transition ) { return; }

                $rootScope.$broadcast('rootScope:broadcast-not_inside_calendar', { label : d.name});
  
                // Construct tooltip
                var tooltip_html = '';
                tooltip_html += '<div class="header"><strong>' + d.name + '</strong><div><br>';
                tooltip_html += '<div><strong>' + (d.value ? formatTime(d.value) : 'No time') + ' tracked</strong></div>';
                tooltip_html += '<div>on ' + moment(d.date).format('dddd, MMM Do YYYY HH:mm') + '</div>';
  
                // Calculate tooltip position
                var x = d.value * 100 / (60 * 60 * 24) + itemScale(moment(d.date));
                while ( width - x < (tooltip_width + tooltip_padding * 3) ) {
                  x -= 10;
                }
                var y = projectScale(d.name) + projectScale.rangeBand() / 2 + tooltip_padding / 2;
                // Show tooltip
                tooltip.html(tooltip_html)
                  .style('left', x + 'px')
                  .style('top', y + 'px')
                  .transition()
                    .duration(transition_duration / 2)
                    .ease('ease-in')
                    .style('opacity', 1);
              })
              .on('mouseout', function () {
                if ( in_transition ) { return; }
                $rootScope.$broadcast('rootScope:broadcast-leave-not_inside_calendar', 'out'); 
                // Hide tooltip
                hideTooltip();
              })
              .on('click', function (d) {
                console.log(d);
              })
              .transition()
                .delay( function () {
                  return (Math.cos(Math.PI * Math.random()) + 1) * transition_duration;
                })
                .duration(function () {
                  return transition_duration;
                })
                .duration(transition_duration)
                .ease('ease-in')
                .style('opacity', 0.5)
                .call(function (transition, callback) {
                  if ( transition.empty() ) {
                    callback();
                  }
                  var n = 0;
                  transition
                    .each(function() { ++n; })
                    .each('end', function() {
                      if ( !--n ) {
                        callback.apply(this, arguments);
                      }
                    });
                  }, function() {
                    in_transition = false;
                  });
  
            // Add time labels
            var timeLabels = d3.time.hours(moment($scope.selected.date).startOf('day'), moment($scope.selected.date).endOf('day'));
            var timeScale = d3.time.scale()
              .range([label_padding*2, width])
              .domain([0, timeLabels.length]);
            labels.selectAll('.label-time').remove();
            labels.selectAll('.label-time')
              .data(timeLabels)
              .enter()
              .append('text')
              .attr('class', 'label label-time')
              .attr('font-size', function () {
                return Math.floor(label_padding / 3) + 'px';
              })
              .text(function (d) {
                return moment(d).format('HH:mm');
              })
              .attr('x', function (d, i) {
                return timeScale(i);
              })
              .attr('y', label_padding / 2)
              .on('mouseenter', function (d) {
                if ( in_transition ) { return; }
                var selected = itemScale(moment(d));
                items.selectAll('.item-block')
                  .transition()
                  .duration(transition_duration)
                  .ease('ease-in')
                  .style('opacity', function (d) {
                    var start = itemScale(moment(d.date));
                    var end = itemScale(moment(d.date).add(d.value, 'seconds'));
                    return ( selected >= start && selected <= end ) ? 1 : 0.1;
                  });
              })
              .on('mouseout', function () {
                if ( in_transition ) { return; }
                items.selectAll('.item-block')
                  .transition()
                  .duration(transition_duration)
                  .ease('ease-in')
                  .style('opacity', 0.5);
              });
  
            // Add project labels
            labels.selectAll('.label-project').remove();
            labels.selectAll('.label-project')
              .data(project_labels)
              .enter()
              .append('text')
              .attr('class', 'label label-project')
              .attr('x', gutter)
              .attr('y', function (d) {
                return projectScale(d) + projectScale.rangeBand() / 2;
              })
              .attr('min-height', function () {
                return projectScale.rangeBand();
              })
              .style('text-anchor', 'left')
              .attr('font-size', function () {
                return Math.floor(label_padding / 3) + 'px';
              })
              .text(function (d) {
                return d;
              })
              .each(function () {
                var obj = d3.select(this),
                  text_length = obj.node().getComputedTextLength(),
                  text = obj.text();
                while (text_length > (label_padding * 1.5) && text.length > 0) {
                  text = text.slice(0, -1);
                  obj.text(text + '...');
                  text_length = obj.node().getComputedTextLength();
                }
              })
              .on('mouseenter', function (project) {
                if ( in_transition ) { return; }
                items.selectAll('.item-block')
                  .transition()
                  .duration(transition_duration)
                  .ease('ease-in')
                  .style('opacity', function (d) {
                    return (d.name === project) ? 1 : 0.1;
                  });
              })
              .on('mouseout', function () {
                if ( in_transition ) { return; }
                items.selectAll('.item-block')
                  .transition()
                  .duration(transition_duration)
                  .ease('ease-in')
                  .style('opacity', 0.5);
              });

              // Add button to switch back to year overview
              drawButton();
          };
  
  
          /**
           * Draw the button for navigation purposes
           */
          function drawButton() {
              buttons.selectAll('.button').remove();
              var button = buttons.append('g')
              .attr('class', 'button button-back')
              .style('opacity', 0)
              .on('click', function () {
                if ( in_transition ) { return; }
  
                // Set transition boolean
                in_transition = true;
                // Clean the canvas from whichever overview type was on
                if ( $scope.overview === 'month' ) {
                  removeMonthOverview();
                } else if ( $scope.overview === 'week' ) {
                  removeWeekOverview();
                } else if ( $scope.overview === 'day' ) {
                  removeDayOverview();
                }
  
          
                // Redraw the chart
                $scope.history.pop();
                $scope.overview = $scope.history.pop();
                drawChart();;
              });

              button.append('circle')
                .attr('cx', label_padding / 2.25)
                .attr('cy', label_padding / 2.5)
                .attr('r', item_size / 2);
              button.append('text')
                .attr('x', label_padding / 2.25)
                .attr('y', label_padding / 2.75)
                .attr('dy', function () {
                  return Math.floor(width / 100) / 2.5;
                })
                .attr('font-size', function () {
                  return Math.floor(label_padding / 3) + 'px';
                })
              .html('&#x2190;');
              button.transition()
                .duration(transition_duration)
                .ease('ease-in')
                .style('opacity', 1);
          };

          
          /**
           * Transition and remove items and labels related to year overview
           */
          function removeYearOverview() {

            $elem[0].svg = null;

            items.selectAll('.item-circle')
              .transition()
              .duration(transition_duration)
              .ease('ease')
              .style('opacity', 0)
              .remove();
            labels.selectAll('.label-day').remove();
            labels.selectAll('.label-month').remove();

            $elem[0].svg = svg;
          };

 
          /**
           * Transition and remove items and labels related to month overview
           */
          function removeMonthOverview() {
            $elem[0].svg = null;
            items.selectAll('.item-block-month').selectAll('.item-block-rect')
              .transition()
              .duration(transition_duration)
              .ease('ease-in')
              .style('opacity', 0)
              .attr('x', function (d, i) {
                return (i % 2 === 0) ? -width/3 : width/3;
              })
              .remove();
            labels.selectAll('.label-day').remove();
            labels.selectAll('.label-week').remove();
            hideBackButton();
            $elem[0].svg = svg;
          };
  
   
         /**
          * Transition and remove items and labels related to week overview
          */
          function removeWeekOverview() {
            items.selectAll('.item-block-week').selectAll('.item-block-rect')
              .transition()
              .duration(transition_duration)
              .ease('ease-in')
              .style('opacity', 0)
              .attr('x', function (d, i) {
                return ( i % 2 === 0) ? -width/3 : width/3;
              })
              .remove();
            labels.selectAll('.label-day').remove();
            labels.selectAll('.label-week').remove();
            hideBackButton();
          };


          /**
           * Transition and remove items and labels related to daily overview
           */
          function removeDayOverview() {

            $elem[0].svg = null;

            items.selectAll('.item-block')
              .transition()
              .duration(transition_duration)
              .ease('ease-in')
              .style('opacity', 0)
              .attr('x', function (d, i) {
                return ( i % 2 === 0) ? -width/3 : width/3;
              })
              .remove();
            labels.selectAll('.label-time').remove();
            labels.selectAll('.label-project').remove();
            hideBackButton();

            $elem[0].svg = svg;

          };


          /**
           * Helper function to hide the tooltip
           */
          function hideTooltip() {
            tooltip.transition()
              .duration(transition_duration / 2)
              .ease('ease-in')
              .style('opacity', 0);
          };

          /**
           * Helper function to hide the back button
           */
          function hideBackButton() {
            buttons.selectAll('.button')
              .transition()
              .duration(transition_duration)
              .ease('ease')
              .style('opacity', 0)
              .remove();
          };

          /**
           * Helper function to convert seconds to a human readable format
           * @param seconds Integer
           */
          function formatTime(seconds) {
            var sec_num = parseInt(seconds, 10);
            var hours = Math.floor(sec_num / 3600);
            var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
            var time = '';
            if ( hours > 0 ) {
              time += hours === 1 ? '1 hour ' : hours + ' hours ';
            }
            if ( minutes > 0 ) {
              time += minutes === 1 ? '1 minute' : minutes + ' minutes';
            }
            if ( hours === 0 && minutes === 0 ) {
              time = seconds + ' seconds';
            }
            return time;
          };
      }
    };
}]);
