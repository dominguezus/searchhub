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


  function Controller($sce, $anchorScroll, Orwell, SnowplowService, IDService, QueryService, $log, $scope, URLService) {
    'ngInject';
    var vm = this;
    var chart_height = 200;

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

        vm.timeline_data = data.facet_counts.facet_ranges.date.counts
        // console.log("Date Conversion Time!");
        
        var num_dates = vm.timeline_data.length;
        // console.log(num_dates);

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

        /**
       * Check if the facet key and transformer match with the passed in key and the appropriate key syntax
       * @param  {object}  val The facet object
       * @param  {string}  key The name of the facet
       * @return {Boolean}
       */
      function checkFacetExists(val, key){
        //CASE 1: facet is a field facet without local params
        //CASE 2: facet is a field facet with local params. The local param is present in the key of the facet. Eg: {!tag=param}keyName
        return (val.key === key && val.transformer === 'fq:field') ||
         (val.key === ('{!tag='+vm.facetTag+'}' + key) && val.transformer === 'localParams');
      }

      function toggleFacet(facet) {
        var key = vm.facetName;
        var query = QueryService.getQueryObject();
        console.log(query);

        // CASE: fq exists.
        if(!query.hasOwnProperty('fq')){
          query = addQueryFacet(query, key, facet.title);
        } else {
          // Remove the key object from the query.
          // We will re-add later if we need to.
          var keyArr = _.remove(query.fq, function(value){
            return checkFacetExists(value, key);
          });

          // CASE: facet key exists in query.
          if(keyArr.length > 0) {
            var keyObj = keyArr[0];
            var removed = _.remove(keyObj.values, function(value){return value === facet.title;});
            // CASE: value didn't previously exist add to values.
            if(removed.length === 0){
              if(!keyObj.hasOwnProperty('values')){
                keyObj.values = [];
              }
              keyObj.values.push(facet.title);
            }
            // CASE: there are still values in facet attach keyobject back to query.
            if(keyObj.values.length > 0){
              query.fq.push(keyObj);
            }
            // Delete 'fq' if it is now empty.
            if(query.fq.length === 0){
              delete query.fq;
            }
          } else { // CASE: Facet key doesnt exist ADD key AND VALUE.
            query = addQueryFacet(query, key, facet.title);
          }

        }
        // Set the query and trigger the refresh.
        updateFacetQuery(query);
      }

      /**
       * Sets the facet query and sets start row to beginning.
       * @param  {object} query The query object.
       */
      function updateFacetQuery(query){
        query.start = 0;
        console.log("The Query In the TImeline Is", query);
        URLService.setQuery(query);
      }

      function addQueryFacet(query, key, title){
        if(!query.hasOwnProperty('fq')){
          query.fq = [];
        }
        var keyObj = {
          key: key,
          values: [title],
          transformer: 'fq:field',
          tag: vm.facetTag
        };
        if(keyObj.tag){
          //Set these properties if the facet has localParams
          //concat the localParams with the key of the facet
          keyObj.key = '{!tag=' + keyObj.tag + '}' + key;
          keyObj.transformer = 'localParams';
          var existingMultiSelectFQ = checkIfMultiSelectFQExists(query.fq, keyObj.key);
          if(existingMultiSelectFQ){
            //If the facet exists, the new filter values are pushed into the same facet. A new facet object is not added into the query.
            existingMultiSelectFQ.values.push(title);
            return query;
          }
        }
        query.fq.push(keyObj);
        $log.debug('final query', query);
        return query;
    }


      function populate_timeline(data_info){
        vm.d3options = {
          chart: {
            type: 'historicalBarChart',
            bars: {
              dispatch: {
                elementClick: function(e) {
                  console.log("You Clicked on a Bar! Lets start a search.");
                  toggleFacet("date");
                }
              }
            },
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
            },
          }
        };
        vm.d3data = [
          {
            "key" : "Quantity",
            "bar" : true, 
            "values" : data_info
          }
        ];
      }
    }
  }
})();
