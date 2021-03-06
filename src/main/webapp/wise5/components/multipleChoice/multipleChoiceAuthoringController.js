'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _multipleChoiceController = require('./multipleChoiceController');

var _multipleChoiceController2 = _interopRequireDefault(_multipleChoiceController);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MultipleChoiceAuthoringController = function (_MultipleChoiceContro) {
  _inherits(MultipleChoiceAuthoringController, _MultipleChoiceContro);

  function MultipleChoiceAuthoringController($filter, $mdDialog, $q, $rootScope, $scope, AnnotationService, ConfigService, MultipleChoiceService, NodeService, NotebookService, ProjectService, StudentAssetService, StudentDataService, UtilService) {
    _classCallCheck(this, MultipleChoiceAuthoringController);

    // the component types we are allowed to connect to
    var _this = _possibleConstructorReturn(this, (MultipleChoiceAuthoringController.__proto__ || Object.getPrototypeOf(MultipleChoiceAuthoringController)).call(this, $filter, $mdDialog, $q, $rootScope, $scope, AnnotationService, ConfigService, MultipleChoiceService, NodeService, NotebookService, ProjectService, StudentAssetService, StudentDataService, UtilService));

    _this.allowedConnectedComponentTypes = [{
      type: 'MultipleChoice'
    }];

    $scope.$watch(function () {
      return this.authoringComponentContent;
    }.bind(_this), function (newValue, oldValue) {
      this.componentContent = this.ProjectService.injectAssetPaths(newValue);
      this.isSaveButtonVisible = this.componentContent.showSaveButton;
      this.isSubmitButtonVisible = this.componentContent.showSubmitButton;
    }.bind(_this), true);

    /*
     * Listen for the assetSelected event which occurs when the user
     * selects an asset from the choose asset popup
     */
    _this.$scope.$on('assetSelected', function (event, args) {

      if (args != null) {

        // make sure the event was fired for this component
        if (args.nodeId == _this.nodeId && args.componentId == _this.componentId) {
          // the asset was selected for this component
          var assetItem = args.assetItem;

          if (assetItem != null) {
            var fileName = assetItem.fileName;

            if (fileName != null) {
              /*
               * get the assets directory path
               * e.g.
               * /wise/curriculum/3/
               */
              var assetsDirectoryPath = _this.ConfigService.getProjectAssetsDirectoryPath();
              var fullAssetPath = assetsDirectoryPath + '/' + fileName;

              if (args.target == 'prompt' || args.target == 'rubric') {
                var summernoteId = '';

                if (args.target == 'prompt') {
                  // the target is the summernote prompt element
                  summernoteId = 'summernotePrompt_' + _this.nodeId + '_' + _this.componentId;
                } else if (args.target == 'rubric') {
                  // the target is the summernote rubric element
                  summernoteId = 'summernoteRubric_' + _this.nodeId + '_' + _this.componentId;
                }

                if (summernoteId != '') {
                  if (_this.UtilService.isImage(fileName)) {
                    /*
                     * move the cursor back to its position when the asset chooser
                     * popup was clicked
                     */
                    $('#' + summernoteId).summernote('editor.restoreRange');
                    $('#' + summernoteId).summernote('editor.focus');

                    // add the image html
                    $('#' + summernoteId).summernote('insertImage', fullAssetPath, fileName);
                  } else if (_this.UtilService.isVideo(fileName)) {
                    /*
                     * move the cursor back to its position when the asset chooser
                     * popup was clicked
                     */
                    $('#' + summernoteId).summernote('editor.restoreRange');
                    $('#' + summernoteId).summernote('editor.focus');

                    // insert the video element
                    var videoElement = document.createElement('video');
                    videoElement.controls = 'true';
                    videoElement.innerHTML = '<source ng-src="' + fullAssetPath + '" type="video/mp4">';
                    $('#' + summernoteId).summernote('insertNode', videoElement);
                  }
                }
              } else if (args.target == 'choice') {
                // the target is a choice

                /*
                 * get the target object which should be a
                 * choice object
                 */
                var targetObject = args.targetObject;

                if (targetObject != null) {

                  // create the img html
                  var text = '<img src="' + fileName + '"/>';

                  // set the html into the choice text
                  targetObject.text = text;

                  // save the component
                  _this.authoringViewComponentChanged();
                }
              }
            }
          }
        }
      }

      // close the popup
      _this.$mdDialog.hide();
    });
    return _this;
  }

  /**
   * Get the available choices from component content
   * @return the available choices from the component content
   */


  _createClass(MultipleChoiceAuthoringController, [{
    key: 'getAuthoringChoices',
    value: function getAuthoringChoices() {
      var choices = null;

      // get the component content
      var authoringComponentContent = this.authoringComponentContent;

      if (authoringComponentContent != null) {

        // get the choices
        choices = authoringComponentContent.choices;
      }

      return choices;
    }
  }, {
    key: 'authoringViewFeedbackChanged',


    /**
     * The author has changed the feedback so we will enable the submit button
     */
    value: function authoringViewFeedbackChanged() {

      var show = true;

      if (this.componentHasFeedback()) {
        // this component has feedback so we will show the submit button
        show = true;
      } else {
        /*
         * this component does not have feedback so we will not show the
         * submit button
         */
        show = false;
      }

      // show or hide the submit button
      this.setShowSubmitButtonValue(show);

      // save the component
      this.authoringViewComponentChanged();
    }

    /**
     * Check if this component has been authored to have feedback or has a
     * correct choice
     * @return whether this component has feedback or has a correct choice
     */

  }, {
    key: 'componentHasFeedback',
    value: function componentHasFeedback() {

      // get the choices
      var choices = this.authoringComponentContent.choices;

      if (choices != null) {

        // loop through all the choices
        for (var c = 0; c < choices.length; c++) {
          var choice = choices[c];

          if (choice != null) {

            if (choice.feedback != null && choice.feedback != '') {
              // the choice has feedback
              return true;
            }

            if (choice.isCorrect) {
              // the choice is correct
              return true;
            }
          }
        }
      }

      return false;
    }

    /**
     * Add a choice from within the authoring tool
     */

  }, {
    key: 'addChoice',
    value: function addChoice() {

      // get the authored choices
      var choices = this.authoringComponentContent.choices;

      // make the new choice
      var newChoice = {};
      newChoice.id = this.UtilService.generateKey(10);
      newChoice.text = '';
      newChoice.feedback = '';
      newChoice.isCorrect = false;

      // add the new choice
      choices.push(newChoice);

      // save the component
      this.authoringViewComponentChanged();
    }

    /**
     * Delete a choice from within the authoring tool
     * @param choiceId
     */

  }, {
    key: 'deleteChoice',
    value: function deleteChoice(choiceId) {

      // ask the author if they are sure they want to delete the choice
      var answer = confirm(this.$translate('multipleChoice.areYouSureYouWantToDeleteThisChoice'));

      if (answer) {
        // the author answered yes to delete the choice

        // get the authored choices
        var choices = this.authoringComponentContent.choices;

        if (choices != null) {

          // loop through all the authored choices
          for (var c = 0; c < choices.length; c++) {
            var choice = choices[c];

            if (choice != null) {
              var tempChoiceId = choice.id;

              if (choiceId === tempChoiceId) {
                // we have found the choice that we want to delete so we will remove it
                choices.splice(c, 1);
                break;
              }
            }
          }
        }

        this.authoringViewComponentChanged();
      }
    }

    /**
     * Move a choice up
     * @param choiceId the choice to move
     */

  }, {
    key: 'moveChoiceUp',
    value: function moveChoiceUp(choiceId) {

      // get the authored choices
      var choices = this.authoringComponentContent.choices;

      if (choices != null) {

        // loop through all the authored choices
        for (var c = 0; c < choices.length; c++) {
          var choice = choices[c];

          if (choice != null) {
            var tempChoiceId = choice.id;

            if (choiceId === tempChoiceId) {

              if (c == 0) {
                /*
                 * the choice is the first choice so we can't move
                 * it up
                 */
              } else {
                // we have found the choice that we want to move up

                // remove the choice
                choices.splice(c, 1);

                // add the choice one index back
                choices.splice(c - 1, 0, choice);
              }

              break;
            }
          }
        }
      }

      this.authoringViewComponentChanged();
    }

    /**
     * Move a choice down
     * @param choiceId the choice to move
     */

  }, {
    key: 'moveChoiceDown',
    value: function moveChoiceDown(choiceId) {
      // get the authored choices
      var choices = this.authoringComponentContent.choices;

      if (choices != null) {

        // loop through all the authored choices
        for (var c = 0; c < choices.length; c++) {
          var choice = choices[c];

          if (choice != null) {
            var tempChoiceId = choice.id;

            if (choiceId === tempChoiceId) {

              if (c == choices.length - 1) {
                /*
                 * the choice is the last choice so we can't move
                 * it down
                 */
              } else {
                // we have found the choice that we want to move down

                // remove the choice
                choices.splice(c, 1);

                // add the choice one index forward
                choices.splice(c + 1, 0, choice);
              }

              break;
            }
          }
        }
      }
    }

    /**
     * Clean up the choice objects. In the authoring tool this is required
     * because we use the choice objects as ng-model values and inject
     * fields into the choice objects such as showFeedback and feedbackToShow.
     */

  }, {
    key: 'cleanUpChoices',
    value: function cleanUpChoices() {

      // get the authored choices
      var choices = this.getAuthoringChoices();

      if (choices != null) {

        // loop through all the authored choices
        for (var c = 0; c < choices.length; c++) {
          var choice = choices[c];

          if (choice != null) {
            // remove the fields we don't want to be saved
            delete choice.showFeedback;
            delete choice.feedbackToShow;
          }
        }
      }
    }

    /**
     * Show the asset popup to allow the author to choose an image for the
     * choice
     * @param choice the choice object to set the image into
     */

  }, {
    key: 'chooseChoiceAsset',
    value: function chooseChoiceAsset(choice) {
      // generate the parameters
      var params = {};
      params.isPopup = true;
      params.nodeId = this.nodeId;
      params.componentId = this.componentId;
      params.target = 'choice';
      params.targetObject = choice;

      // display the asset chooser
      this.$rootScope.$broadcast('openAssetChooser', params);
    }

    /**
     * Automatically set the component id for the connected component if there
     * is only one viable option.
     * @param connectedComponent the connected component object we are authoring
     */

  }, {
    key: 'authoringAutomaticallySetConnectedComponentComponentIdIfPossible',
    value: function authoringAutomaticallySetConnectedComponentComponentIdIfPossible(connectedComponent) {
      if (connectedComponent != null) {
        var components = this.getComponentsByNodeId(connectedComponent.nodeId);
        if (components != null) {
          var numberOfAllowedComponents = 0;
          var allowedComponent = null;
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = components[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var component = _step.value;

              if (component != null) {
                if (this.isConnectedComponentTypeAllowed(component.type) && component.id != this.componentId) {
                  // we have found a viable component we can connect to
                  numberOfAllowedComponents += 1;
                  allowedComponent = component;
                }
              }
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }

          if (numberOfAllowedComponents == 1) {
            /*
             * there is only one viable component to connect to so we
             * will use it
             */
            connectedComponent.componentId = allowedComponent.id;
            connectedComponent.type = 'importWork';
            this.copyChoiceTypeAndChoicesFromConnectedComponent(connectedComponent);
          }
        }
      }
    }

    /**
     * The connected component component id has changed
     * @param connectedComponent the connected component that has changed
     */

  }, {
    key: 'authoringConnectedComponentComponentIdChanged',
    value: function authoringConnectedComponentComponentIdChanged(connectedComponent) {

      if (connectedComponent != null) {

        // default the type to import work
        connectedComponent.type = 'importWork';
        this.copyChoiceTypeAndChoicesFromConnectedComponent(connectedComponent);

        // the authoring component content has changed so we will save the project
        this.authoringViewComponentChanged();
      }
    }
  }, {
    key: 'copyChoiceTypeAndChoicesFromConnectedComponent',
    value: function copyChoiceTypeAndChoicesFromConnectedComponent(connectedComponent) {
      var nodeId = connectedComponent.nodeId;
      var componentId = connectedComponent.componentId;
      if (this.ProjectService.getComponentByNodeIdAndComponentId(nodeId, componentId).type == "MultipleChoice") {
        this.copyChoiceTypeFromComponent(nodeId, componentId);
        this.copyChoicesFromComponent(nodeId, componentId);
      }
    }
  }, {
    key: 'copyChoiceTypeFromComponent',
    value: function copyChoiceTypeFromComponent(nodeId, componentId) {
      var component = this.ProjectService.getComponentByNodeIdAndComponentId(nodeId, componentId);
      this.authoringComponentContent.choiceType = component.choiceType;
    }
  }, {
    key: 'copyChoicesFromComponent',
    value: function copyChoicesFromComponent(nodeId, componentId) {
      this.authoringComponentContent.choices = this.getCopyOfChoicesFromComponent(nodeId, componentId);
    }
  }, {
    key: 'getCopyOfChoicesFromComponent',
    value: function getCopyOfChoicesFromComponent(nodeId, componentId) {
      var component = this.ProjectService.getComponentByNodeIdAndComponentId(nodeId, componentId);
      return this.UtilService.makeCopyOfJSONObject(component.choices);
    }
  }]);

  return MultipleChoiceAuthoringController;
}(_multipleChoiceController2.default);

;

MultipleChoiceAuthoringController.$inject = ['$filter', '$mdDialog', '$q', '$rootScope', '$scope', 'AnnotationService', 'ConfigService', 'MultipleChoiceService', 'NodeService', 'NotebookService', 'ProjectService', 'StudentAssetService', 'StudentDataService', 'UtilService'];

exports.default = MultipleChoiceAuthoringController;
//# sourceMappingURL=multipleChoiceAuthoringController.js.map
