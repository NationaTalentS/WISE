'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ComponentDirective = function () {
    function ComponentDirective($injector, $compile, NodeService, ProjectService, StudentDataService) {
        _classCallCheck(this, ComponentDirective);

        this.restrict = 'E';
        this.$injector = $injector;
        this.$compile = $compile;
        this.NodeService = NodeService;
        this.ProjectService = ProjectService;
        this.StudentDataService = StudentDataService;
    }

    _createClass(ComponentDirective, [{
        key: 'link',
        value: function link($scope, element, attrs) {
            var nodeId = attrs.nodeid;
            var componentId = attrs.componentid;
            var componentState = attrs.componentstate;
            var workgroupId = null;
            var teacherWorkgroupId = null;

            $scope.mode = "student";
            if (attrs.mode) {
                $scope.mode = attrs.mode;
            }

            if (attrs.workgroupid != null) {
                try {
                    workgroupId = parseInt(attrs.workgroupid);
                } catch (e) {}
            }

            if (attrs.teacherworkgroupid) {
                try {
                    teacherWorkgroupId = parseInt(attrs.teacherworkgroupid);
                } catch (e) {}
            }

            if (componentState == null || componentState === '') {
                componentState = ComponentDirective.instance.StudentDataService.getLatestComponentStateByNodeIdAndComponentId(nodeId, componentId);
            } else {
                componentState = angular.fromJson(componentState);
                nodeId = componentState.nodeId;
                componentId = componentState.componentId;
            }

            var authoringComponentContent = ComponentDirective.instance.ProjectService.getComponentByNodeIdAndComponentId(nodeId, componentId);
            var componentContent = ComponentDirective.instance.ProjectService.injectAssetPaths(authoringComponentContent);

            $scope.componentContent = componentContent;
            $scope.authoringComponentContent = authoringComponentContent;
            $scope.componentState = componentState;
            $scope.componentTemplatePath = ComponentDirective.instance.NodeService.getComponentTemplatePath(componentContent.type);
            $scope.nodeId = nodeId;
            $scope.workgroupId = workgroupId;
            $scope.teacherWorkgroupId = teacherWorkgroupId;

            var componentHTML = "<div id=\"{{component.id}}\" class=\"component-content\" >" + "<div ng-include=\"componentTemplatePath\" style=\"overflow-x: auto;\"></div></div>";

            if (componentHTML != null) {
                element.html(componentHTML);
                ComponentDirective.instance.$compile(element.contents())($scope);
            }
        }
    }], [{
        key: 'directiveFactory',
        value: function directiveFactory($injector, $compile, NodeService, ProjectService, StudentDataService) {
            ComponentDirective.instance = new ComponentDirective($injector, $compile, NodeService, ProjectService, StudentDataService);
            return ComponentDirective.instance;
        }
    }]);

    return ComponentDirective;
}();

var ClassResponseDirective = function () {
    function ClassResponseDirective(StudentStatusService) {
        _classCallCheck(this, ClassResponseDirective);

        this.restrict = 'E';
        this.scope = {
            response: '=',
            submitbuttonclicked: '&',
            studentdatachanged: '&'
        };
        this.templateUrl = 'wise5/components/discussion/classResponse.html';
        this.StudentStatusService = StudentStatusService;
    }

    _createClass(ClassResponseDirective, [{
        key: 'link',
        value: function link($scope, $element, attrs) {
            $scope.element = $element[0];

            $scope.getAvatarColorForWorkgroupId = function (workgroupId) {
                return ClassResponseDirective.instance.StudentStatusService.getAvatarColorForWorkgroupId(workgroupId);
            };

            // handle the submit button click
            $scope.submitButtonClicked = function (response) {
                $scope.submitbuttonclicked({ r: response });
            };

            $scope.expanded = false;

            $scope.$watch(function () {
                return $scope.response.replies.length;
            }, function (oldValue, newValue) {
                if (newValue !== oldValue) {
                    $scope.toggleExpanded(true);
                }
            });

            $scope.toggleExpanded = function (open) {
                if (open) {
                    $scope.expanded = true;
                } else {
                    $scope.expanded = !$scope.expanded;
                }

                if ($scope.expanded) {
                    var $clist = $($scope.element).find('.discussion-comments__list');
                    setTimeout(function () {
                        $clist.animate({ scrollTop: $clist.height() }, 250);
                    }, 250);
                }
            };
        }
    }], [{
        key: 'directiveFactory',
        value: function directiveFactory(StudentStatusService) {
            ClassResponseDirective.instance = new ClassResponseDirective(StudentStatusService);
            return ClassResponseDirective.instance;
        }
    }]);

    return ClassResponseDirective;
}();

var CompileDirective = function () {
    function CompileDirective($compile) {
        _classCallCheck(this, CompileDirective);

        this.$compile = $compile;
    }

    _createClass(CompileDirective, [{
        key: 'link',
        value: function link(scope, ele, attrs) {
            scope.$watch(function (scope) {
                return scope.$eval(attrs.compile);
            }, function (value) {
                ele.html(value);
                CompileDirective.instance.$compile(ele.contents())(scope);
            });
        }
    }], [{
        key: 'directiveFactory',
        value: function directiveFactory($compile) {
            CompileDirective.instance = new CompileDirective($compile);
            return CompileDirective.instance;
        }
    }]);

    return CompileDirective;
}();

var AnnotationDirective = function () {
    function AnnotationDirective($compile, AnnotationService, ConfigService, ProjectService, UtilService) {
        _classCallCheck(this, AnnotationDirective);

        this.$compile = $compile;
        this.AnnotationService = AnnotationService;
        this.ConfigService = ConfigService;
        this.ProjectService = ProjectService;
        this.UtilService = UtilService;

        this.restrict = 'E';
        this.controller = 'AnnotationController';
        this.controllerAs = 'annotationController';
        this.bindToController = true;
        this.scope = {};
    }

    _createClass(AnnotationDirective, [{
        key: 'link',
        value: function link($scope, element, attrs) {

            var annotationHTML = '';

            var type = attrs.type;
            var mode = attrs.mode;
            var nodeId = attrs.nodeid;
            var componentId = attrs.componentid;
            var fromWorkgroupId = attrs.fromworkgroupid;
            var toWorkgroupId = attrs.toworkgroupid;
            var componentStateId = attrs.componentstateid;
            var active = attrs.active;
            var component = null;
            var maxScore = null;

            if (fromWorkgroupId == '') {
                fromWorkgroupId = null;
            } else if (fromWorkgroupId != null) {
                // convert the string to a number
                fromWorkgroupId = AnnotationDirective.instance.UtilService.convertStringToNumber(fromWorkgroupId);
            }

            if (toWorkgroupId == '') {
                toWorkgroupId = null;
            } else if (toWorkgroupId != null) {
                // convert the string to a number
                toWorkgroupId = AnnotationDirective.instance.UtilService.convertStringToNumber(toWorkgroupId);
            }

            if (componentStateId == '') {
                componentStateId = null;
            } else if (componentStateId != null) {
                // convert the string to a number
                componentStateId = AnnotationDirective.instance.UtilService.convertStringToNumber(componentStateId);
            }

            if (active == 'true') {
                active = true;
            } else {
                active = false;
            }

            if (nodeId != null && componentId != null) {
                // get the component
                component = AnnotationDirective.instance.ProjectService.getComponentByNodeIdAndComponentId(nodeId, componentId);
            }

            if (component != null) {
                // get the max score
                maxScore = component.maxScore;
            }

            if (mode === 'student') {

                var annotationParams = {};
                annotationParams.nodeId = nodeId;
                annotationParams.componentId = componentId;
                annotationParams.fromWorkgroupId = fromWorkgroupId;
                annotationParams.toWorkgroupId = toWorkgroupId;
                annotationParams.type = type;
                annotationParams.studentWorkId = componentStateId;

                // get the latest annotation that matches the params
                annotation = AnnotationDirective.instance.AnnotationService.getLatestAnnotation(annotationParams);

                if (type === 'score') {

                    if (annotation != null) {
                        var data = annotation.data;
                        var dataJSONObject = angular.fromJson(data);

                        if (dataJSONObject) {
                            var value = dataJSONObject.value;

                            if (value != null && value != '') {
                                // display the score to the student
                                if (maxScore != null) {
                                    annotationHTML += '<span>Score: ' + value + ' / ' + maxScore + '</span>';
                                } else {
                                    annotationHTML += '<span>Score: ' + value + '</span>';
                                }
                            }
                        }
                    }
                } else if (type === 'comment') {
                    if (annotation != null) {
                        var data = annotation.data;
                        var dataJSONObject = angular.fromJson(data);

                        if (dataJSONObject) {
                            var value = dataJSONObject.value;

                            if (value != null && value != '') {
                                // display the comment to the student
                                annotationHTML += '<span>Comment: ' + value + '</span>';
                            }
                        }
                    }
                }
            } else if (mode === 'grading') {

                var annotationParams = {};
                annotationParams.nodeId = nodeId;
                annotationParams.componentId = componentId;
                annotationParams.fromWorkgroupId = fromWorkgroupId;
                annotationParams.toWorkgroupId = toWorkgroupId;
                annotationParams.type = type;
                annotationParams.studentWorkId = componentStateId;

                var annotation = null;

                if (active) {
                    /*
                     * this directive instance is the active annotation that the teacher can use to
                     * grade so we will get the latest annotation for the student work
                     */
                    annotation = AnnotationDirective.instance.AnnotationService.getLatestAnnotation(annotationParams);
                } else {
                    /*
                     * this directive instance is not the active annotation so we will get the
                     * annotation directly associated with the student work
                     */
                    annotation = AnnotationDirective.instance.AnnotationService.getAnnotation(annotationParams);
                }

                // set the values into the controller so we can access them in the controller
                $scope.annotationController.annotationId = null;
                $scope.annotationController.nodeId = nodeId;
                $scope.annotationController.periodId = null;
                $scope.annotationController.componentId = componentId;
                $scope.annotationController.fromWorkgroupId = fromWorkgroupId;
                $scope.annotationController.toWorkgroupId = toWorkgroupId;
                $scope.annotationController.type = type;
                $scope.annotationController.componentStateId = componentStateId;
                $scope.annotationController.isDisabled = !active;

                if (annotation != null) {
                    if (componentStateId == annotation.studentWorkId) {
                        /*
                         * the annotation is for the component state that is being displayed.
                         * sometimes the annotation may not be for the component state that
                         * is being displayed which can happen when student submits work,
                         * the teacher annotates it, and then the student submits new work.
                         * when this happens, we will show the teacher annotation but the
                         * annotation is associated with the first student work and not the
                         * second student work. setting the annotationId in the scope will
                         * cause the server to update the annotation as opposed to creating
                         * a new annotation row in the database.
                         */
                        $scope.annotationController.annotationId = annotation.id;
                    }
                }

                var toUserInfo = AnnotationDirective.instance.ConfigService.getUserInfoByWorkgroupId(toWorkgroupId);

                if (toUserInfo != null) {
                    // set the period id
                    $scope.annotationController.periodId = toUserInfo.periodId;
                }

                if (annotation != null) {
                    var data = annotation.data;

                    if (data != null) {
                        var dataJSONObject = angular.fromJson(data);

                        if (dataJSONObject != null) {
                            // set the annotation value
                            $scope.annotationController.value = dataJSONObject.value;
                        }
                    }
                }

                if (type === 'score') {
                    annotationHTML += 'Score: ';

                    annotationHTML += '<input size="10" ng-model="annotationController.value" ng-disabled="annotationController.isDisabled" ng-change="annotationController.postAnnotation()" ng-model-options="{ debounce: 2000 }"/>';

                    if (maxScore != null) {
                        annotationHTML += ' / ' + maxScore;
                    }
                } else if (type === 'comment') {
                    annotationHTML += 'Comment: ';
                    annotationHTML += '<br/>';
                    annotationHTML += '<textarea ng-model="annotationController.value" ng-disabled="annotationController.isDisabled" ng-change="annotationController.postAnnotation()" ng-model-options="{ debounce: 2000 }" rows="5" cols="30"/>';
                }
            }

            element.html(annotationHTML);
            AnnotationDirective.instance.$compile(element.contents())($scope);
        }
    }], [{
        key: 'directiveFactory',
        value: function directiveFactory($compile, AnnotationService, ConfigService, ProjectService, UtilService) {
            AnnotationDirective.instance = new AnnotationDirective($compile, AnnotationService, ConfigService, ProjectService, UtilService);
            return AnnotationDirective.instance;
        }
    }]);

    return AnnotationDirective;
}();

/**
 * A directive that asks the user if they are sure they want to change a
 * number input value to a lower value. We will not ask the user if they
 * change the number to a higher value. This directive is intended to
 * be used in cases when changing to a lower value will have a destructive
 * effect such as setting the number of rows in the authoring view of the
 * table component.
 */


var ConfirmNumberDecrease = function () {
    function ConfirmNumberDecrease() {
        _classCallCheck(this, ConfirmNumberDecrease);

        this.priority = -1;
        this.restrict = 'A';
        this.require = 'ngModel';
    }

    _createClass(ConfirmNumberDecrease, [{
        key: 'link',
        value: function link($scope, element, attrs, modelCtrl) {

            // get the message
            var message = attrs.confirmNumberDecrease;

            modelCtrl.$parsers.push(function (newValue) {

                // get the old value
                var oldValue = modelCtrl.$modelValue;

                // check if the new value is less than the old value
                if (newValue < oldValue) {
                    /*
                     * the new value is less than the old value so we will ask them to confirm
                     * the change since it may be destructive
                     */
                    var answer = confirm(message);

                    if (answer) {
                        // the user wants to change the value
                        return newValue;
                    } else {
                        // the user does not want to change the value so we will roll it back
                        modelCtrl.$setViewValue(oldValue);
                        modelCtrl.$render();
                        return oldValue;
                    }
                } else {
                    /*
                     * the new value is equal or greater than the old value so we do
                     * not need the user to confirm the change
                     */
                    return newValue;
                }
            });
        }
    }], [{
        key: 'directiveFactory',
        value: function directiveFactory() {
            ConfirmNumberDecrease.instance = new ConfirmNumberDecrease();
            return ConfirmNumberDecrease.instance;
        }
    }]);

    return ConfirmNumberDecrease;
}();

var DisableDeleteKeypress = function () {
    function DisableDeleteKeypress($document) {
        _classCallCheck(this, DisableDeleteKeypress);

        this.restrict = 'A';
        this.$document = $document;
    }

    _createClass(DisableDeleteKeypress, [{
        key: 'link',
        value: function link($document) {
            DisableDeleteKeypress.instance.$document.bind('keydown', function (e) {

                // check for the delete key press
                if (e.keyCode === 8) {
                    // the delete key was pressed

                    // get the name of the node e.g. body, input, div, etc.
                    var nodeName = e.target.nodeName;

                    // get the type if applicable e.g. text, password, file, etc.
                    var targetType = e.target.type;

                    if (nodeName != null) {
                        nodeName = nodeName.toLowerCase();
                    }

                    if (targetType != null) {
                        targetType = targetType.toLowerCase();
                    }

                    if (nodeName === 'input' && targetType === 'text' || nodeName === 'input' && targetType === 'password' || nodeName === 'input' && targetType === 'file' || nodeName === 'input' && targetType === 'search' || nodeName === 'input' && targetType === 'email' || nodeName === 'input' && targetType === 'number' || nodeName === 'input' && targetType === 'date' || nodeName === 'textarea') {
                        /*
                         * the user is typing in a valid input element so we will
                         * allow the delete key press
                         */
                    } else {
                            /*
                             * the user is not typing in an input element so we will
                             * not allow the delete key press
                             */
                            e.preventDefault();
                        }
                }
            });
        }
    }], [{
        key: 'directiveFactory',
        value: function directiveFactory($document) {
            DisableDeleteKeypress.instance = new DisableDeleteKeypress($document);
            return DisableDeleteKeypress.instance;
        }
    }]);

    return DisableDeleteKeypress;
}();

var ListenForDeleteKeypress = function () {
    function ListenForDeleteKeypress($document) {
        _classCallCheck(this, ListenForDeleteKeypress);

        this.restrict = 'A';
        this.$document = $document;
    }

    _createClass(ListenForDeleteKeypress, [{
        key: 'link',
        value: function link($scope) {
            ListenForDeleteKeypress.instance.$document.bind('keydown', function (e) {

                // check for the delete key press
                if (e.keyCode === 8) {
                    // the delete key was pressed

                    // handle the delete key press in the scope
                    $scope.handleDeleteKeyPressed();
                }
            });
        }
    }], [{
        key: 'directiveFactory',
        value: function directiveFactory($document) {
            ListenForDeleteKeypress.instance = new ListenForDeleteKeypress($document);
            return ListenForDeleteKeypress.instance;
        }
    }]);

    return ListenForDeleteKeypress;
}();

var Directives = angular.module('directives', []);

AnnotationDirective.directiveFactory.$inject = ['$compile', 'AnnotationService', 'ConfigService', 'ProjectService', 'UtilService'];
ClassResponseDirective.directiveFactory.$inject = ['StudentStatusService'];
CompileDirective.directiveFactory.$inject = ['$compile'];
ComponentDirective.directiveFactory.$inject = ['$injector', '$compile', 'NodeService', 'ProjectService', 'StudentDataService'];
ConfirmNumberDecrease.directiveFactory.$inject = [];
DisableDeleteKeypress.directiveFactory.$inject = ['$document'];
ListenForDeleteKeypress.directiveFactory.$inject = ['$document'];

Directives.directive('annotation', AnnotationDirective.directiveFactory);
Directives.directive('classResponse', ClassResponseDirective.directiveFactory);
Directives.directive('compile', CompileDirective.directiveFactory);
Directives.directive('component', ComponentDirective.directiveFactory);
Directives.directive('confirmNumberDecrease', ConfirmNumberDecrease.directiveFactory);
Directives.directive('disableDeleteKeypress', DisableDeleteKeypress.directiveFactory);
Directives.directive('listenForDeleteKeypress', ListenForDeleteKeypress.directiveFactory);

exports.default = Directives;
//# sourceMappingURL=directives.js.map