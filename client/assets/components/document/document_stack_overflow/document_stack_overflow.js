(function() {
  'use strict';

  angular
    .module('searchHub.components.document_stack_overflow', ['lucidworksView.services.signals'])
    .directive('documentStackOverflow', documentStackOverflow);

  function documentStackOverflow() {
    'ngInject';
    var directive = {
      restrict: 'EA',
      templateUrl: 'assets/components/document/document_stack_overflow/document_stack_overflow.html',
      scope: true,
      controller: Controller,
      controllerAs: 'vm',
      bindToController: {
        doc: '=',
        highlight: '=',
        expanded: "="
      }
    };

    return directive;

  }

  function Controller(SnowplowService, PerDocumentService, $log) {
    'ngInject';
    var vm = this;
    activate();

    function activate() {
      vm.postSignal = SnowplowService.postSignal;
      vm.postClickSignal = processClick;
      vm.doc = processDocument(vm.doc);
    }

    function processClick(element, docId, position, score, threadId, subjectSimple){
      SnowplowService.postClickSignal(element, docId, position, score);
      PerDocumentService.processPerDocument(docId, threadId, subjectSimple);
    }

    function processDocument(doc) {
      if (doc.content){
        doc.content = doc.content.trim();
      } else if (doc.content_txt){
        doc.content_txt = doc.content_txt.trim();
      }
      return doc;
    }

  }
})();
