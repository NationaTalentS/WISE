'use strict';

import 'svg.js';
import 'svg.draggable.js';
import ConceptMapController from './conceptMapController';

class ConceptMapAuthoringController extends ConceptMapController {
  constructor($anchorScroll,
              $filter,
              $location,
              $mdDialog,
              $q,
              $rootScope,
              $scope,
              $timeout,
              AnnotationService,
              ConceptMapService,
              ConfigService,
              CRaterService,
              NodeService,
              NotebookService,
              ProjectService,
              StudentAssetService,
              StudentDataService,
              UtilService) {
    super($anchorScroll,
      $filter,
      $location,
      $mdDialog,
      $q,
      $rootScope,
      $scope,
      $timeout,
      AnnotationService,
      ConceptMapService,
      ConfigService,
      CRaterService,
      NodeService,
      NotebookService,
      ProjectService,
      StudentAssetService,
      StudentDataService,
      UtilService);

    this.allowedConnectedComponentTypes = [
      { type: 'ConceptMap' },
      { type: 'Draw' },
      { type: 'Embedded' },
      { type: 'Graph' },
      { type: 'Label' },
      { type: 'Table' }
    ];

    this.shouldOptions = [
      {
        value: false, label: this.$translate('conceptMap.should')
      },
      {
        value: true, label: this.$translate('conceptMap.shouldNot')
      }
    ];

    this.availableNodes = this.componentContent.nodes;
    this.availableLinks = this.componentContent.links;

    if (this.componentContent.showNodeLabels == null) {
      this.componentContent.showNodeLabels = true;
      this.authoringComponentContent.showNodeLabels = true;
    }

    $scope.$watch(function() {
      return this.authoringComponentContent;
    }.bind(this), function(newValue, oldValue) {
      this.componentContent = this.ProjectService.injectAssetPaths(newValue);
      this.isSaveButtonVisible = this.componentContent.showSaveButton;
      this.isSubmitButtonVisible = this.componentContent.showSubmitButton;
      this.availableNodes = this.componentContent.nodes;
      this.availableLinks = this.componentContent.links;
      this.width = this.componentContent.width;
      this.height = this.componentContent.height;
      this.setBackgroundImage(this.componentContent.background,
        this.componentContent.stretchBackground);

      /*
       * make sure the SVG element can be accessed. we need to
       * perform this check because this watch is getting fired
       * before angular sets the svgId on the svg element. if
       * setupSVG() is called before the svgId is set on the svg
       * element, we will get an error.
       */
      if (document.getElementById(this.svgId) != null) {
        this.setupSVG();
      }
    }.bind(this), true);

    /*
     * Listen for the assetSelected event which occurs when the user
     * selects an asset from the choose asset popup
     */
    this.$scope.$on('assetSelected', (event, args) => {

      if (args != null) {

        // make sure the event was fired for this component
        if (args.nodeId == this.nodeId && args.componentId == this.componentId) {
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
              var assetsDirectoryPath = this.ConfigService.getProjectAssetsDirectoryPath();
              var fullAssetPath = assetsDirectoryPath + '/' + fileName;

              var summernoteId = '';

              if (args.target == 'prompt') {
                // the target is the summernote prompt element
                summernoteId = 'summernotePrompt_' + this.nodeId + '_' + this.componentId;
              } else if (args.target == 'rubric') {
                // the target is the summernote rubric element
                summernoteId = 'summernoteRubric_' + this.nodeId + '_' + this.componentId;
              } else if (args.target == 'background') {
                // the target is the background image

                // set the background file name
                this.authoringComponentContent.background = fileName;

                // the authoring component content has changed so we will save the project
                this.authoringViewComponentChanged();
              } else if (args.target != null && args.target.indexOf('node') == 0) {
                // the target is a node image

                // get the concept map node
                var node = this.authoringViewGetNodeById(args.target);

                if (node != null) {
                  // set the file name of the node
                  node.fileName = fileName;
                }

                // the authoring component content has changed so we will save the project
                this.authoringViewComponentChanged();
              }

              if (summernoteId != '') {
                if (this.UtilService.isImage(fileName)) {
                  /*
                   * move the cursor back to its position when the asset chooser
                   * popup was clicked
                   */
                  $('#' + summernoteId).summernote('editor.restoreRange');
                  $('#' + summernoteId).summernote('editor.focus');

                  // add the image html
                  $('#' + summernoteId).summernote('insertImage', fullAssetPath, fileName);
                } else if (this.UtilService.isVideo(fileName)) {
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
            }
          }
        }
      }

      // close the popup
      this.$mdDialog.hide();
    });
  }

  /**
   * A node up button was clicked in the authoring tool so we will move the
   * node up
   * @param index the index of the node that we will move
   */
  authoringViewNodeUpButtonClicked(index) {

    // check if the node is at the top
    if (index != 0) {
      // the node is not at the top so we can move it up

      // get the nodes
      var nodes = this.authoringComponentContent.nodes;

      if (nodes != null) {

        // get the node at the given index
        var node = nodes[index];

        // remove the node
        nodes.splice(index, 1);

        // insert the node back in one index back
        nodes.splice(index - 1, 0, node);

        /*
         * the author has made changes so we will save the component
         * content
         */
        this.authoringViewComponentChanged();
      }
    }
  }

  /**
   * A node down button was clicked in the authoring tool so we will move the
   * node down
   * @param index the index of the node that we will move
   */
  authoringViewNodeDownButtonClicked(index) {

    // get the nodes
    var nodes = this.authoringComponentContent.nodes;

    // check if the node is at the bottom
    if (nodes != null && index != nodes.length - 1) {
      // the node is not at the bottom so we can move it down

      // get the node at the given index
      var node = nodes[index];

      // remove the node
      nodes.splice(index, 1);

      // insert the node back in one index ahead
      nodes.splice(index + 1, 0, node);

      /*
       * the author has made changes so we will save the component
       * content
       */
      this.authoringViewComponentChanged();
    }
  }

  /**
   * A node delete button was clicked in the authoring tool so we will remove
   * the node
   * @param index the index of the node that we will delete
   */
  authoringViewNodeDeleteButtonClicked(index) {

    // get the nodes
    var nodes = this.authoringComponentContent.nodes;

    if (nodes != null) {

      // get the node
      var node = nodes[index];

      if (node != null) {

        // get the file name and label
        var nodeFileName = node.fileName;
        var nodeLabel = node.label;

        // confirm with the author that they really want to delete the node
        var answer = confirm(this.$translate('conceptMap.areYouSureYouWantToDeleteThisNode', { nodeFileName: nodeFileName, nodeLabel: nodeLabel}));

        if (answer) {
          /*
           * the author is sure they want to delete the node so we
           * will remove it from the array
           */
          nodes.splice(index, 1);

          /*
           * the author has made changes so we will save the component
           * content
           */
          this.authoringViewComponentChanged();
        }
      }
    }
  }

  /**
   * A link up button was clicked in the authoring tool so we will move the
   * link up
   * @param index the index of the link
   */
  authoringViewLinkUpButtonClicked(index) {

    // check if the link is at the top
    if (index != 0) {

      // get the links
      var links = this.authoringComponentContent.links;

      if (links != null) {

        // get a link
        var link = links[index];

        if (link != null) {

          // remove the link
          links.splice(index, 1);

          // add the link back in one index back
          links.splice(index - 1, 0, link);

          /*
           * the author has made changes so we will save the component
           * content
           */
          this.authoringViewComponentChanged();
        }
      }
    }
  }

  /**
   * A link down button was clicked in the authoring tool so we will move the
   * link down
   * @param index the index of the link
   */
  authoringViewLinkDownButtonClicked(index) {

    // get the links
    var links = this.authoringComponentContent.links;

    // check if the link is at the bottom
    if (links != null && index != links.length - 1) {
      // the node is not at the bottom so we can move it down

      if (links != null) {

        // get the link
        var link = links[index];

        if (link != null) {

          // remove the link
          links.splice(index, 1);

          // add the link back in one index ahead
          links.splice(index + 1, 0, link);

          /*
           * the author has made changes so we will save the component
           * content
           */
          this.authoringViewComponentChanged();
        }
      }
    }
  }

  /**
   * A link delete button was clicked in the authoring tool so we remove the
   * link
   * @param index the index of the link
   */
  authoringViewLinkDeleteButtonClicked(index) {

    // get the links
    var links = this.authoringComponentContent.links;

    if (links != null) {

      // get a link
      var link = links[index];

      if (link != null) {

        // get the link label
        var linkLabel = link.label;

        // confirm with the author that they really want to delete the link
        var answer = confirm(this.$translate('conceptMap.areYouSureYouWantToDeleteThisLink', { linkLabel: linkLabel}));

        if (answer) {
          /*
           * the author is sure they want to delete the link so we
           * will remove it from the array
           */
          links.splice(index, 1);

          /*
           * the author has made changes so we will save the component
           * content
           */
          this.authoringViewComponentChanged();
        }
      }
    }
  }

  /**
   * Add a node in the authoring tool
   */
  authoringViewAddNode() {

    // get a new node id
    var id = this.authoringGetNewConceptMapNodeId();

    // create the new node
    var newNode = {};
    newNode.id = id;
    newNode.label = '';
    newNode.fileName = '';
    newNode.width = 100;
    newNode.height = 100;

    // get the nodes
    var nodes = this.authoringComponentContent.nodes;

    // add the new node
    nodes.push(newNode);

    /*
     * the author has made changes so we will save the component
     * content
     */
    this.authoringViewComponentChanged();
  }

  /**
   * Get the concept map node with the given id
   * @param nodeId the concept map node id
   * @return the concept map node with the given node id
   */
  authoringViewGetNodeById(nodeId) {

    if (nodeId != null &&
      this.authoringComponentContent != null &&
      this.authoringComponentContent.nodes != null) {

      // loop through all the concept map nodes
      for (var n = 0; n < this.authoringComponentContent.nodes.length; n++) {
        var node = this.authoringComponentContent.nodes[n];

        if (node != null) {
          if (nodeId === node.id) {
            // we have found the concept map node that we want
            return node;
          }
        }
      }
    }

    return null;
  }

  /**
   * Add a link in the authoring tool
   */
  authoringViewAddLink() {

    // get a new link id
    var id = this.authoringGetNewConceptMapLinkId();

    // create a new link
    var newLink = {};
    newLink.id = id;
    newLink.label = '';
    newLink.color = '';

    // get the links
    var links = this.authoringComponentContent.links;

    // add the new link
    links.push(newLink);

    /*
     * the author has made changes so we will save the component
     * content
     */
    this.authoringViewComponentChanged();
  }

  /**
   * Get a new ConceptMapNode id that isn't being used
   * @returns a new ConceptMapNode id e.g. 'node3'
   */
  authoringGetNewConceptMapNodeId() {

    var nextAvailableNodeIdNumber = 1;

    // array to remember the numbers that have been used in node ids already
    var usedNumbers = [];

    // loop through all the nodes
    for (var x = 0; x < this.authoringComponentContent.nodes.length; x++) {
      var node = this.authoringComponentContent.nodes[x];

      if (node != null) {

        // get the node id
        var nodeId = node.id;

        if (nodeId != null) {

          // get the number from the node id
          var nodeIdNumber = parseInt(nodeId.replace('node', ''));

          if (nodeIdNumber != null) {
            // add the number to the array of used numbers
            usedNumbers.push(nodeIdNumber);
          }
        }
      }
    }

    if (usedNumbers.length > 0) {
      // get the max number used
      var maxNumberUsed = Math.max.apply(Math, usedNumbers);

      if (!isNaN(maxNumberUsed)) {
        // increment the number by 1 to get the next available number
        nextAvailableNodeIdNumber = maxNumberUsed + 1;
      }
    }

    var newId = 'node' + nextAvailableNodeIdNumber;

    return newId;
  }

  /**
   * Get a new ConceptMapLink id that isn't being used
   * @returns a new ConceptMapLink id e.g. 'link3'
   */
  authoringGetNewConceptMapLinkId() {

    var nextAvailableLinkIdNumber = 1;

    // array to remember the numbers that have been used in link ids already
    var usedNumbers = [];

    // loop through all the nodes
    for (var x = 0; x < this.authoringComponentContent.links.length; x++) {
      var link = this.authoringComponentContent.links[x];

      if (link != null) {

        // get the node id
        var nodeId = link.id;

        if (nodeId != null) {

          // get the number from the node id
          var nodeIdNumber = parseInt(nodeId.replace('link', ''));

          if (nodeIdNumber != null) {
            // add the number to the array of used numbers
            usedNumbers.push(nodeIdNumber);
          }
        }
      }
    }

    if (usedNumbers.length > 0) {
      // get the max number used
      var maxNumberUsed = Math.max.apply(Math, usedNumbers);

      if (!isNaN(maxNumberUsed)) {
        // increment the number by 1 to get the next available number
        nextAvailableLinkIdNumber = maxNumberUsed + 1;
      }
    }

    var newId = 'link' + nextAvailableLinkIdNumber;

    return newId;
  }

  /**
   * A "with link" checkbox was checked
   * @param ruleIndex the index of the rule
   */
  authoringRuleLinkCheckboxClicked(ruleIndex) {

    // get the rule that was checked
    var rule = this.authoringComponentContent.rules[ruleIndex];

    if (rule != null) {
      if (rule.type == 'node') {
        /*
         * the rule has been set to 'node' instead of 'link' so we
         * will remove the link label and other node label
         */

        delete rule.linkLabel;
        delete rule.otherNodeLabel;
      }
    }

    // perform updating and saving
    this.authoringViewComponentChanged();
  }

  /**
   * Add a new rule
   */
  authoringAddRule() {

    // create the new rule
    var newRule = {};
    newRule.name = '';
    newRule.type = 'node';
    newRule.categories = [];
    newRule.nodeLabel = '';
    newRule.comparison = 'exactly';
    newRule.number = 1;
    newRule.not = false;

    // add the rule to the array of rules
    this.authoringComponentContent.rules.push(newRule);

    var showSubmitButton = false;

    if (this.authoringComponentContent.rules.length > 0) {
      // there are scoring rules so we will show the submit button
      showSubmitButton = true;
    }

    // set the value of the showSubmitButton field
    this.setShowSubmitButtonValue(showSubmitButton);

    // perform updating and saving
    this.authoringViewComponentChanged();
  }

  /**
   * Move a rule up
   * @param index the index of the rule
   */
  authoringViewRuleUpButtonClicked(index) {

    // check if the rule is at the top
    if (index != 0) {
      // the rule is not at the top so we can move it up

      // get the rules
      var rules = this.authoringComponentContent.rules;

      if (rules != null) {

        // get the rule at the given index
        var rule = rules[index];

        // remove the rule
        rules.splice(index, 1);

        // insert the rule back in one index back
        rules.splice(index - 1, 0, rule);

        /*
         * the author has made changes so we will save the component
         * content
         */
        this.authoringViewComponentChanged();
      }
    }
  }

  /**
   * Move a rule down
   * @param index the index of the rule
   */
  authoringViewRuleDownButtonClicked(index) {

    // get the rules
    var rules = this.authoringComponentContent.rules;

    // check if the rule is at the bottom
    if (rules != null && index != rules.length - 1) {
      // the rule is not at the bottom so we can move it down

      // get the rule at the given index
      var rule = rules[index];

      // remove the rule
      rules.splice(index, 1);

      // insert the rule back in one index ahead
      rules.splice(index + 1, 0, rule);

      /*
       * the author has made changes so we will save the component
       * content
       */
      this.authoringViewComponentChanged();
    }
  }

  /*
   * Delete a rule
   * @param index the index of the rule to delete
   */
  authoringViewRuleDeleteButtonClicked(index) {

    // get the rule
    var rule = this.authoringComponentContent.rules[index];

    if (rule != null) {

      // get the rule name
      var ruleName = rule.name;

      // confirm with the author that they really want to delete the rule
      var answer = confirm(this.$translate('conceptMap.areYouSureYouWantToDeleteThisRule', { ruleName: ruleName }));

      if (answer) {
        // remove the rule at the given index
        this.authoringComponentContent.rules.splice(index, 1);

        // perform updating and saving
        this.authoringViewComponentChanged();
      }
    }

    var showSubmitButton = false;

    if (this.authoringComponentContent.rules.length > 0) {
      // there are scoring rules so we will show the submit button
      showSubmitButton = true;
    }

    // set the value of the showSubmitButton field
    this.setShowSubmitButtonValue(showSubmitButton);
  }

  /**
   * Add a category to a rule
   * @param rule the rule
   */
  authoringViewAddCategoryClicked(rule) {

    if (rule != null) {
      // add an empty category name
      rule.categories.push('');
    }

    // perform updating and saving
    this.authoringViewComponentChanged();
  }

  /**
   * Delete a category from a rule
   * @param rule delete a category from this rule
   * @param index the index of the category
   */
  authoringViewDeleteCategoryClicked(rule, index) {

    if (rule != null) {

      // get the rule name
      var ruleName = rule.name;

      // get the category name
      var categoryName = rule.categories[index];

      // confirm with the author that they really want to delete the category from the rule
      var answer = confirm(this.$translate('conceptMap.areYouSureYouWantToDeleteTheCategory' , { ruleName: ruleName, categoryName: categoryName }));

      if (answer) {
        // remove the category at the index
        rule.categories.splice(index, 1);

        // perform updating and saving
        this.authoringViewComponentChanged();
      }
    }
  }

  /**
   * Save the starter concept map
   */
  saveStarterConceptMap() {

    let answer = confirm(this.$translate('conceptMap.areYouSureYouWantToSaveTheStarterConceptMap'));

    if (answer) {
      // get the concept map data
      var conceptMapData = this.getConceptMapData();

      // set the starter concept map data
      this.authoringComponentContent.starterConceptMap = conceptMapData;

      /*
       * the author has made changes so we will save the component
       * content
       */
      this.authoringViewComponentChanged();
    }
  }

  /**
   * Delete the starter concept map
   */
  deleteStarterConceptMap() {

    let answer = confirm(this.$translate('conceptMap.areYouSureYouWantToDeleteTheStarterConceptMap'));

    if (answer) {
      // set the starter concept map data
      this.authoringComponentContent.starterConceptMap = null;

      // clear the concept map
      this.clearConceptMap();

      /*
       * the author has made changes so we will save the component
       * content
       */
      this.authoringViewComponentChanged();
    }
  }

  /**
   * Show the asset popup to allow the author to choose the background image
   */
  chooseBackgroundImage() {

    // generate the parameters
    var params = {};
    params.isPopup = true;
    params.nodeId = this.nodeId;
    params.componentId = this.componentId;
    params.target = 'background';

    // display the asset chooser
    this.$rootScope.$broadcast('openAssetChooser', params);
  }

  /**
   * Show the asset popup to allow the author to choose an image for the node
   * @param conceptMapNodeId the id of the node in the concept map
   */
  chooseNodeImage(conceptMapNodeId) {
    // generate the parameters
    var params = {};
    params.isPopup = true;
    params.nodeId = this.nodeId;
    params.componentId = this.componentId;
    params.target = conceptMapNodeId;

    // display the asset chooser
    this.$rootScope.$broadcast('openAssetChooser', params);
  }

  /**
   * Automatically set the component id for the connected component if there
   * is only one viable option.
   * @param connectedComponent the connected component object we are authoring
   */
  authoringAutomaticallySetConnectedComponentComponentIdIfPossible(connectedComponent) {
    if (connectedComponent != null) {
      let components = this.getComponentsByNodeId(connectedComponent.nodeId);
      if (components != null) {
        let numberOfAllowedComponents = 0;
        let allowedComponent = null;
        for (let component of components) {
          if (component != null) {
            if (this.isConnectedComponentTypeAllowed(component.type) &&
              component.id != this.componentId) {
              // we have found a viable component we can connect to
              numberOfAllowedComponents += 1;
              allowedComponent = component;
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
          this.authoringSetImportWorkAsBackgroundIfApplicable(connectedComponent);
        }
      }
    }
  }

  /**
   * The connected component component id has changed
   * @param connectedComponent the connected component that has changed
   */
  authoringConnectedComponentComponentIdChanged(connectedComponent) {

    if (connectedComponent != null) {

      // default the type to import work
      connectedComponent.type = 'importWork';
      this.authoringSetImportWorkAsBackgroundIfApplicable(connectedComponent);

      // the authoring component content has changed so we will save the project
      this.authoringViewComponentChanged();
    }
  }

  /**
   * If the component type is a certain type, we will set the importWorkAsBackground
   * field to true.
   * @param connectedComponent The connected component object.
   */
  authoringSetImportWorkAsBackgroundIfApplicable(connectedComponent) {
    let componentType = this.authoringGetConnectedComponentType(connectedComponent);
    if (componentType == 'Draw' ||
      componentType == 'Embedded' ||
      componentType == 'Graph' ||
      componentType == 'Label' ||
      componentType == 'Table') {
      connectedComponent.importWorkAsBackground = true;
    } else {
      delete connectedComponent.importWorkAsBackground;
    }
  }

  /**
   * The "Import Work As Background" checkbox was clicked.
   * @param connectedComponent The connected component associated with the
   * checkbox.
   */
  authoringImportWorkAsBackgroundClicked(connectedComponent) {
    if (!connectedComponent.importWorkAsBackground) {
      delete connectedComponent.importWorkAsBackground;
    }
    this.authoringViewComponentChanged();
  }

  submit(submitTriggeredBy) {
    super.submit(submitTriggeredBy);

    /*
     * set values appropriately here because the 'componentSubmitTriggered'
     * event won't work in authoring mode
     */
    this.isDirty = false;
    this.isSubmitDirty = false;
    this.createComponentState('submit');
  }
}

ConceptMapAuthoringController.$inject = [
  '$anchorScroll',
  '$filter',
  '$location',
  '$mdDialog',
  '$q',
  '$rootScope',
  '$scope',
  '$timeout',
  'AnnotationService',
  'ConceptMapService',
  'ConfigService',
  'CRaterService',
  'NodeService',
  'NotebookService',
  'ProjectService',
  'StudentAssetService',
  'StudentDataService',
  'UtilService'
];

export default ConceptMapAuthoringController;
