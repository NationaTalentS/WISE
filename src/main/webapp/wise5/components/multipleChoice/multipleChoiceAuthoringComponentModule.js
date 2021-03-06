'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _multipleChoiceService = require('./multipleChoiceService');

var _multipleChoiceService2 = _interopRequireDefault(_multipleChoiceService);

var _multipleChoiceController = require('./multipleChoiceController');

var _multipleChoiceController2 = _interopRequireDefault(_multipleChoiceController);

var _multipleChoiceAuthoringController = require('./multipleChoiceAuthoringController');

var _multipleChoiceAuthoringController2 = _interopRequireDefault(_multipleChoiceAuthoringController);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var multipleChoiceAuthoringComponentModule = angular.module('multipleChoiceAuthoringComponentModule', ['pascalprecht.translate']).service(_multipleChoiceService2.default.name, _multipleChoiceService2.default).controller(_multipleChoiceController2.default.name, _multipleChoiceController2.default).controller(_multipleChoiceAuthoringController2.default.name, _multipleChoiceAuthoringController2.default).config(['$translatePartialLoaderProvider', function ($translatePartialLoaderProvider) {
  $translatePartialLoaderProvider.addPart('components/multipleChoice/i18n');
}]);

exports.default = multipleChoiceAuthoringComponentModule;
//# sourceMappingURL=multipleChoiceAuthoringComponentModule.js.map
