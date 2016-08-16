(function () {
  'use strict';

  angular
      .module('searchHub.components.timeline', ['lucidworksView.services.config',
        'ngOrwell',
      ])
      .directive('timeline', timeline);

    function timeline() {
    'ngInject';
      var directive = {
        restrict: 'EA',
        templateUrl: 'assets/components/timeline/timeline.html',
        scope: true,
        controller: Controller,
        controllerAs: 'vm',
        bindToController: {}
      };
      return directive;
    };


  function Controller($sce, $anchorScroll, Orwell, SnowplowService, IDService, QueryService, $log, $scope) {
    'ngInject';
    var vm = this;
    activate();

    ////////

    function activate() {
      var resultsObservable = Orwell.getObservable('queryResults');
      resultsObservable.addObserver(function (data) {
        //Every time a query is fired and results come back, this section gets called
        var queryObject = QueryService.getQueryObject();
        //let's make sure we can track individual query/result pairs by assigning a UUID to each unique query
        queryObject["uuid"] = IDService.generateUUID();
        
        // Add logic here to use the published on date if not the actual date and vice versa
        console.log(data);
        console.log("These are the facets range counts!");
        console.log(data.facet_counts.facet_ranges.publishedOnDate.counts);
        vm.timeline_data = data.facet_counts.facet_ranges.publishedOnDate.counts
        console.log("Date Conversion Time!");
        
        var num_dates = vm.timeline_data.length;
        console.log(num_dates);

        vm.data_vals = [];

        for (var i = 0; i <= num_dates/2; i+=2) {
          var date = new Date(vm.timeline_data[i]);
          // console.log(date);
          var milliseconds = date.getTime();
          vm.timeline_data[i] = milliseconds
          // console.log(milliseconds);
          // console.log("Got the time in ms");
          var sub_array = [milliseconds, vm.timeline_data[i + 1]];
          vm.data_vals.push(sub_array);
        }
        // console.log(vm.timeline_data);
        // console.log(vm.data_vals);
        populate_timeline(vm.data_vals);
      });

      function populate_timeline(data_info){
        var chart_height = 300;
        vm.d3options = {
          chart: {
            type: 'historicalBarChart',
            height: chart_height,
            margin: {
              top:0.04*chart_height,
              right:0.20*chart_height,
              bottom:0.20*chart_height,
              left:0.20*chart_height
            },
            x: function(d) {return d[0];},
            y: function(d) {return d[1];},
            showValues: true,
            duration: 100,
            xAxis: {
              axisLabel: 'Date',
              tickFormat: function(d) {
                return d3.time.format('%x')(new Date(d))
              },
              rotateLabels:30,
              showMaxMin: true,
            },
            yAxis: {
              axisLabel: "Event Count",
              axisLabelDistance: -10,
              tickFormat: function(d) {
                return d3.format('.1f')(d);
              }
            },
            tooltip: {
              keyFormatter: function(d) {
                  return d3.time.format('%x')(new Date(d));
              }
            },
            zoom: {
              enabled: true,
              scaleExtent: [1,10],
              usefixedDomain:false, 
              useNiceScale: false,
              horizontalOff: false,
              verticalOff: true,
              unzoomEventType: 'dblclick.zoom'
            }
          }
        };
        vm.d3data = [
          {
            "key" : "Quantity",
            "bar" : true, 
            "values" : data_info
            //"values" : [ [ 100 , 100 ], [ 200 , 200 ], [ 300 , 300 ] ]
          }
        ];
      }
    }
  }
})();
