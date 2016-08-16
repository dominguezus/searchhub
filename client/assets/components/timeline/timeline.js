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
        console.log("These are the facets range counts!");
        console.log(data.facet_counts.facet_ranges.date.counts);
        vm.timeline_data = data.facet_counts.facet_ranges.date.counts
        console.log("Date Conversion Time!");
        
        var num_dates = vm.timeline_data.length;
        console.log(num_dates);

        vm.data_vals = [];

        for (var i = 0; i <= num_dates/2; i+=2) {
          var date = new Date(vm.timeline_data[i]);
          console.log(date);
          var milliseconds = date.getTime();
          vm.timeline_data[i] = milliseconds
          console.log(milliseconds);
          console.log("Got the time in ms");
          var sub_array = [milliseconds, vm.timeline_data[i + 1]];
          vm.data_vals.push(sub_array);
        }
        console.log(vm.timeline_data);
        console.log(vm.data_vals);
        populate_timeline(vm.data_vals);
      });

      function populate_timeline(data_info){
        vm.d3options = {
          chart: {
            type: 'historicalBarChart',
            height:300,
            margin: {
              top:20,
              right:20,
              bottom:65,
              left:50
            },
            x: function(d) {return d[0];},
            y: function(d) {return d[1];},
            showValues: true,
            duration: 100,
            xAxis: {
              axisLabel: 'X Axis',
              tickFormat: function(d) {
                return d3.time.format('%x')(new Date(d))
              },
              showMaxMin: true
            },
            yAxis: {
              axisLabel: "Y Axis",
              tickFormat: function(d) {
                return d3.format('.1f')(d);
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
            "values" : data_info
            //"values" : [ [ 100 , 100 ], [ 200 , 200 ], [ 300 , 300 ] ]
          }
        ];
      }
      // vm.d3options = {
      //     chart: {
      //       type: 'discreteBarChart',
      //       height: 100,
      //       margin: {
      //         top: 20,
      //         right: 20,
      //         bottom: 60,
      //         left: 55
      //       },
      //       x: function (d) {
      //         return d.label;
      //       },
      //       y: function (d) {
      //         return d.value;
      //       },
      //       showValues: true,
      //       valueFormat: function (d) {
      //         return d3.format(',.4f')(d);
      //       },
      //       transitionDuration: 500,
      //       xAxis: {
      //         axisLabel: 'X Axis'
      //       },
      //       yAxis: {
      //         axisLabel: 'Y Axis',
      //         axisLabelDistance: 30
      //       }
      //     }
      // };
      // vm.d3data = [{
      //   key: "Cumulative Return",
      //   values: [
      //     {"label": "A", "value": -29.765957771107},
      //     {"label": "B", "value": 0},
      //     {"label": "C", "value": 32.807804682612},
      //     {"label": "D", "value": 196.45946739256},
      //     {"label": "E", "value": 0.19434030906893},
      //     {"label": "F", "value": -98.079782601442},
      //     {"label": "G", "value": -13.925743130903},
      //     {"label": "H", "value": -5.1387322875705}
      //   ]
      // }];
    }
  }
})();
