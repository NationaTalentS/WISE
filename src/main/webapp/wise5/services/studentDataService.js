define(['configService', 'projectService'], function(configService, projectService) {

    var service = [
        '$http',
        '$injector',
        '$q',
        '$rootScope',
        'ConfigService',
        'ProjectService',
        function (
            $http,
            $injector,
            $q,
            $rootScope,
            ConfigService,
            ProjectService) {

        var serviceObject = {};
        
        serviceObject.studentData = null;
        serviceObject.stackHistory = [];  // array of node id's
        serviceObject.visitedNodesHistory = [];
        serviceObject.nodeStatuses = null;
        
        serviceObject.currentNode = null;

        serviceObject.getCurrentNode = function() {
            return this.currentNode;
        };

        serviceObject.getCurrentNodeId = function() {
            var currentNodeId = null;
            var currentNode = this.currentNode;

            if (currentNode != null) {
                currentNodeId = currentNode.id;
            }

            return currentNodeId;
        };

        serviceObject.getCurrentParentNode = function() {
            var currentNode = this.getCurrentNode();
            
            if (currentNode != null) {
                
            }
        };

        serviceObject.updateCurrentNode = function(latestNodeVisit) {
            if (latestNodeVisit != null) {
                nodeId = latestNodeVisit.nodeId;
                
                var node = ProjectService.getNodeById(nodeId);
                this.setCurrentNode(node);
            }
        };

        serviceObject.retrieveStudentData = function() {
            
            // get the mode
            var mode = ConfigService.getConfigParam('mode');
            
            if (mode === 'preview') {
                // we are previewing the project
                
                // initialize dummy student data
                this.studentData = {};
                this.studentData.componentStates = [];
                this.studentData.events = [];
                this.studentData.userName = 'Preview Student';
                this.studentData.userId = '0';
                
                // populate the student history
                this.populateHistories(this.studentData.componentStates);
                
                // update the node statuses
                this.updateNodeStatuses();
            } else {
                // we are in a run
                
                // get the url to get the student data
                var studentDataURL = ConfigService.getConfigParam('studentDataURL');
                
                var httpParams = {};
                httpParams.method = 'GET';
                httpParams.url = studentDataURL;
                
                // set the workgroup id and run id
                var params = {};
                params.workgroupId = ConfigService.getWorkgroupId();
                params.runId = ConfigService.getRunId();
                params.getComponentStates = true;
                params.getEvents = true;
                params.getAnnotations = true;
                params.toWorkgroupId = ConfigService.getWorkgroupId();
                httpParams.params = params;
                
                // make the request for the student data
                return $http(httpParams).then(angular.bind(this, function(result) {
                    var resultData = result.data;
                    if (resultData != null) {
                        
                        this.studentData = {};
                        
                        // get student work
                        this.studentData.componentStates = resultData.componentStates;

                        // get events
                        this.studentData.events = resultData.events;

                        // get annotations
                        this.studentData.annotations = resultData.annotations;

                        // load the student planning nodes
                        //this.loadStudentNodes();
                        
                        // TODO
                        // populate the student history
                        this.populateHistories(this.studentData.componentStates);
                        
                        // TODO
                        // update the node statuses

                        this.updateNodeStatuses();
                    }
                    return this.studentData;
                }));
            }
        };

        serviceObject.loadStudentNodes = function() {
            var nodes = ProjectService.getApplicationNodes();
            
            if (nodes != null) {
                for (var n = 0; n < nodes.length; n++) {
                    var node = nodes[n];
                    
                    if (node != null) {
                        if (node.type === 'Planning') {
                            var nodeId = node.id;
                            
                            var latestNodeState = this.getLatestNodeStateByNodeId(nodeId);
                            
                            if (latestNodeState != null) {
                                var latestStateStudentNodes = latestNodeState.studentNodes;
                                var latestTransitions = latestNodeState.studentTransition;
                                
                                ProjectService.loadNodes(latestStateStudentNodes);
                                ProjectService.loadTransitions(latestTransitions);
                            }
                        }
                    }
                }
            }
        };
        
        serviceObject.getNodeStatuses = function() {
            return this.nodeStatuses;
        };
        
        serviceObject.getNodeStatusByNodeId = function(nodeId) {
            var result = null;
            
            if (nodeId != null && this.nodeStatuses != null) {
                for (var n = 0; n < this.nodeStatuses.length; n++) {
                    var nodeStatus = this.nodeStatuses[n];
                    if(nodeStatus != null && nodeStatus.nodeId === nodeId) {
                        result = nodeStatus;
                        break;
                    }
                }
            }
            
            return result;
        };
        
        serviceObject.updateNodeStatuses = function() {
            //this.nodeStatuses = [];

            var nodes = ProjectService.getNodes();
            
            if (nodes != null) {

                var nodeStatuses = [];

                for (var n = 0; n < nodes.length; n++) {
                    var node = nodes[n];
                    
                    var nodeStatusesByNode = this.updateNodeStatusesByNode(node);
                    nodeStatuses.push(nodeStatusesByNode);
                }

                this.nodeStatuses = nodeStatuses;
            }
            
            $rootScope.$broadcast('nodeStatusesChanged');
        };

        serviceObject.updateNodeStatusesByNode = function(node) {
            var nodeStatus = null;

            if (node != null) {
                var nodeId = node.id;

                nodeStatus = {};
                nodeStatus.nodeId = nodeId;
                nodeStatus.isVisitable = false;
                nodeStatus.isCompleted = false;


                // get the constraints that affect this node
                var constraintsForNode = ProjectService.getConstraintsForNode(node);

                if (constraintsForNode == null || constraintsForNode.length == 0) {
                    // this node does not have any constraints so it is clickable
                    nodeStatus.isVisitable = true;
                } else {

                    var result = false;
                    var firstResult = true;

                    // loop through all the constraints that affect this node
                    for (var c = 0; c < constraintsForNode.length; c++) {
                        var constraintForNode = constraintsForNode[c];

                        if (constraintForNode != null) {
                            var tempResult = this.evaluateConstraint(constraintForNode);

                            if (firstResult) {
                                result = tempResult;
                                firstResult = false;
                            } else {
                                result = result && tempResult;
                            }
                        }
                    }

                    nodeStatus.isVisitable = result;
                }

                nodeStatus.isCompleted = this.isCompleted(nodeId);
            }

            return nodeStatus;
        };

        serviceObject.evaluateConstraint = function(constraintForNode) {
            var result = false;

            if (constraintForNode != null) {
                var constraintLogic = constraintForNode.constraintLogic;

                if (constraintLogic === 'node') {
                    result = this.evaluateNodeConstraint(constraintForNode);
                } else if (constraintLogic === 'transition') {

                } else if (constraintLogic === 'component') {

                } else if (constraintLogic === 'group') {

                }
            }

            return result;
        };

        serviceObject.evaluateNodeConstraint = function(constraintForNode) {
            var result = false;

            if (constraintForNode != null) {
                var constraintLogic = constraintForNode.constraintLogic;

                if (constraintLogic === 'node') {
                    var targetId = constraintForNode.targetId;
                    var criteria = constraintForNode.criteria;

                    if (criteria != null && criteria.length > 0) {

                        var firstResult = true;

                        for (var c = 0; c < criteria.length; c++) {
                            var tempCriteria = criteria[c];

                            if (tempCriteria != null) {
                                var functionName = tempCriteria.functionName;
                                var functionParams = tempCriteria.functionParams;

                                // get the service for the node type
                                var tempService = $injector.get('NodeService');
                                //var tempService = null;
                                if (tempService != null) {

                                    // call the function in the service
                                    var tempResult = tempService.callFunction(functionName, functionParams);

                                    if (firstResult) {
                                        result = tempResult;
                                        firstResult = false;
                                    } else {
                                        result = result && tempResult;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return result;
        };

        serviceObject.evaluateCriteria = function() {

        };
        
        serviceObject.updateNodeStatusesByNode0 = function(node) {
            return $q(angular.bind(this, function(resolve, reject) {
                
            var nodeStatus = null;
            var allPromises = [];
            
            if (node != null) {
                var nodeId = node.id;
                
                nodeStatus = {};
                nodeStatus.nodeId = nodeId;
                nodeStatus.isVisitable = false;
                
                // get the constraints that affect this node
                var constraintsForNode = ProjectService.getConstraintsForNode(node);
                
                if (constraintsForNode == null || constraintsForNode.length == 0) {
                    // this node does not have any constraints so it is clickable
                    nodeStatus.isVisitable = true;
                } else {
                    
                    // loop through all the constraints that affect this node
                    for (var c = 0; c < constraintsForNode.length; c++) {
                        var constraintForNode = constraintsForNode[c];
                        
                        if (constraintForNode != null) {
                            var constraintLogic = constraintForNode.constraintLogic;
                            
                            if (constraintLogic == 'guidedNavigation') {
                                if (this.isNodeVisited(nodeId)) {
                                    // the node has been visited before so it should be clickable
                                    nodeStatus.isVisitable = true;
                                } else {
                                    /*
                                     * the node has not been visited before so we will determine
                                     * if the node is clickable by looking at the transitions
                                     */
                                    var currentNode = this.currentNode;
                                    
                                    if (currentNode != null) {
                                        // there is a current node
                                        var currentNodeId = currentNode.id;
                                        
                                        // get the transitions from the current node
                                        var transitions = ProjectService.getTransitionsByFromNodeId(currentNodeId);
                                        
                                        if (transitions != null) {
                                            
                                            // get the transitions from the current node to the node status node
                                            var transitionsToNodeId = ProjectService.getTransitionsByFromAndToNodeId(currentNodeId, nodeId);
                                            
                                            if (transitionsToNodeId != null && transitionsToNodeId.length > 0) {
                                                // there is a transition between the current node and the node status node

                                                // check if the current node has branches
                                                
                                                if (transitions.length > 1) {
                                                    // the current node has branches so the node status node is not clickable
                                                    nodeStatus.isVisitable |= false;
                                                } else {
                                                    // the current node does not have branches so the node status node is clickable
                                                    nodeStatus.isVisitable = true;
                                                }
                                            } else {
                                                /*
                                                 * there is no transition between the current node and the node status node
                                                 * so the node we will set the node to be not clickable
                                                 */
                                                nodeStatus.isVisitable |= false;
                                            }
                                        }
                                    } else {
                                        // there is no current node because the student has just started the project
                                    }
                                    
                                    if (ProjectService.isStartNode(node)) {
                                        /*
                                         * the node is the start node of the project or a start node of a group
                                         * so we will make it clickable
                                         */
                                        nodeStatus.isVisitable = true;
                                    }
                                }
                            } else if (constraintLogic === 'transition') {
                                var criteria = constraintForNode.criteria;
                                if (criteria != null && criteria.length > 0) {
                                    var firstCriteria = criteria[0];
                                    var criteriaNodeId = firstCriteria.nodeId;
                                    
                                    var nodeVisits = this.getNodeVisitsByNodeId(criteriaNodeId);
                                    if (nodeVisits != null && nodeVisits.length > 0) {
                                        var functionName = firstCriteria.functionName;
                                        var functionParams = firstCriteria.functionParams;
                                        functionParams.nodeVisits = nodeVisits;
                                        
                                        var result = null;
                                        
                                        // get the node type
                                        var nodeType = node.type;
                                        
                                        // get the service for the node type
                                        var service = $injector.get(nodeType + 'Service');
                                        
                                        if (service != null) {
                                            
                                            // call the function in the service
                                            result = service.callFunction(functionName, functionParams);
                                        }
                                        
                                        if (result) {
                                            nodeStatus.isVisitable = true;
                                        }
                                    }
                                }
                            } else if (constraintLogic === 'lockAfterSubmit') {
                                var targetId = constraintForNode.targetId;
                                var nodeVisits = this.getNodeVisitsByNodeId(targetId);
                                
                                if (nodeId === targetId) {
                                    var isWorkSubmitted = NodeService.isWorkSubmitted(nodeVisits);
                                    
                                    if (isWorkSubmitted) {
                                        
                                    }
                                }
                            }
                        }
                    }
                }
            }
            $q.all(allPromises).then(function() {
                resolve(nodeStatus);
            })
            }));
        };

        serviceObject.populateHistories = function(componentStates) {
            if (componentStates != null) {
                this.stackHistory = [];
                this.visitedNodesHistory = [];

                for (var i = 0; i < componentStates.length; i++) {
                    var componentState = componentStates[i];
                    
                    var componentStateNodeId = componentState.nodeId;
                    this.updateStackHistory(componentStateNodeId);
                    this.updateVisitedNodesHistory(componentStateNodeId);
                }
            }
        };
        
        serviceObject.getStackHistoryAtIndex = function(index) {
            if (index < 0) {
                index = this.stackHistory.length + index;
            }
            var stackHistoryResult = null;
            if (this.stackHistory != null && this.stackHistory.length > 0) {
                stackHistoryResult = this.stackHistory[index];
            }
            return stackHistoryResult;
        };
        
        serviceObject.getStackHistory = function() {
            return this.stackHistory;
        };
        
        serviceObject.updateStackHistory = function(nodeId) {
            var indexOfNodeId = this.stackHistory.indexOf(nodeId);
            if (indexOfNodeId === -1) {
                this.stackHistory.push(nodeId);
            } else {
                this.stackHistory.splice(indexOfNodeId + 1, this.stackHistory.length);
            }
        };
        
        serviceObject.updateVisitedNodesHistory = function(nodeId) {
            var indexOfNodeId = this.visitedNodesHistory.indexOf(nodeId);
            if (indexOfNodeId === -1) {
                this.visitedNodesHistory.push(nodeId);
            }
        };
        
        serviceObject.getVisitedNodesHistory = function() {
            return this.visitedNodesHistory;
        };
        
        serviceObject.isNodeVisited = function(nodeId) {
            var result = false;
            var visitedNodesHistory = this.visitedNodesHistory;
            
            if (visitedNodesHistory != null) {
                var indexOfNodeId = visitedNodesHistory.indexOf(nodeId);
                
                if (indexOfNodeId !== -1) {
                    result = true;
                }
            }
            
            return result;
        };

        serviceObject.getLatestStudentWorkForNodeAsHTML = function(nodeId) {
            var studentWorkAsHTML = null;
            
            var node = ProjectService.getNodeById(nodeId);
            
            if (node != null) {
                //var nodeType = node.type;
                //var latestNodeState = this.getLatestNodeStateByNodeId(nodeId);
                
                // TODO: make this dynamically call the correct {{nodeType}}Service
                if (nodeType === 'OpenResponse') {
                    //studentWorkAsHTML = OpenResponseService.getStudentWorkAsHTML(latestNodeState);
                }
            }
            
            return studentWorkAsHTML;
        };
        
        serviceObject.createComponentState = function() {
            var componentState = {};
            
            componentState.timestamp = Date.parse(new Date());
            
            return componentState;
        };

        serviceObject.createAnnotation = function(
            annotationId, runId, periodId, fromWorkgroupId, toWorkgroupId,
            nodeId, componentId, componentStateId,
            annotationType, data, clientSaveTime) {

            var annotation = {};
            annotation.id = annotationId;
            annotation.runId = runId;
            annotation.periodId = periodId;
            annotation.fromWorkgroupId = fromWorkgroupId;
            annotation.toWorkgroupId = toWorkgroupId;
            annotation.nodeId = nodeId;
            annotation.componentId = componentId;
            annotation.componentStateId = componentStateId;
            annotation.type = annotationType;
            annotation.data = data;
            annotation.clientSaveTime = clientSaveTime;

            return annotation;
        };

        serviceObject.addComponentState = function(componentState) {
            if (this.studentData != null && this.studentData.componentStates != null) {
                this.studentData.componentStates.push(componentState);

                this.updateNodeStatuses();
            }
        };

        serviceObject.addEvent = function(event) {
           if (this.studentData != null && this.studentData.events != null) {
               this.studentData.events.push(event);
           }
        };

        serviceObject.addAnnotation = function(annotation) {
            if (this.studentData != null && this.studentData.annotations != null) {
                this.studentData.annotations.push(annotation);
            }
        };

       /**
        * Generates and returns a random key of the given length if
        * specified. If length is not specified, returns a key 10
        * characters in length.
        */
        serviceObject.generateKey = function(length) {
            this.CHARS = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r", "s","t",
                          "u","v","w","x","y","z","0","1","2","3","4","5","6","7","8","9"];

            /* set default length if not specified */
            if (!length) {
                length = 10;
            }

            /* generate the key */
            var key = '';
            for (var a = 0; a < length; a++) {
                key += this.CHARS[Math.floor(Math.random() * (this.CHARS.length - 1))];
            };

            /* return the generated key */
            return key;
        };

        serviceObject.saveComponentEvent = function(component, category, event, data) {
            if (component == null || category == null || event == null) {
                console.error("StudentDataService.saveComponentEvent: component, category, event args must not be null");
                return;
            }
            var context = "Component";
            var nodeId = component.nodeId;
            var componentId = component.componentId;
            var componentType = component.componentType;
            if (nodeId == null || componentId == null || componentType == null) {
                console.error("StudentDataService.saveComponentEvent: nodeId, componentId, componentType must not be null");
                return;
            }
            this.saveEvent(context, nodeId, componentId, componentType, category, event, data);
        };

        serviceObject.saveVLEEvent = function(nodeId, componentId, componentType, category, event, data) {
           if (category == null || event == null) {
               console.error("StudentDataService.saveVLEEvent: category and event args must not be null");
               return;
           }
           var context = "VLE";
           this.saveEvent(context, nodeId, componentId, componentType, category, event, data);
        };

        serviceObject.saveEvent = function(context, nodeId, componentId, componentType, category, event, data) {
            var events = [];
            var newEvent = this.createNewEvent();
            newEvent.context = context;
            newEvent.nodeId = nodeId;
            newEvent.componentId = componentId;
            newEvent.componentType = componentType;
            newEvent.category = category;
            newEvent.event = event;
            newEvent.data = data;
            events.push(newEvent);
            var componentStates = null;
            var annotations = null;
            this.saveToServer(componentStates, events, annotations);
        };

        /**
        * Create a new empty event
        * @return a new empty event
        */
        serviceObject.createNewEvent = function() {
            var event = {};

            event.runId = ConfigService.getRunId();
            event.periodId = ConfigService.getPeriodId();
            event.workgroupId = ConfigService.getWorkgroupId();
            event.clientSaveTime = Date.parse(new Date());

            return event;
        };

        serviceObject.saveToServer = function(componentStates, events, annotations) {
            
            if (componentStates != null && componentStates.length > 0) {
                for (var c = 0; c < componentStates.length; c++) {
                    var componentState = componentStates[c];

                    if (componentState != null) {
                        componentState.requestToken = this.generateKey(); // use this to keep track of unsaved componentStates.
                        this.addComponentState(componentState);
                    }
                }
            }

            if (events != null && events.length > 0) {
                for (var e = 0; e < events.length; e++) {
                    var event = events[e];

                    if (event != null) {
                        event.requestToken = this.generateKey(); // use this to keep track of unsaved events.
                        this.addEvent(event);
                    }
                }
            }

            if (annotations != null && annotations.length > 0) {
                for (var a = 0; a < annotations.length; a++) {
                    var annotation = annotations[a];

                    if (annotation != null) {
                        annotation.requestToken = this.generateKey(); // use this to keep track of unsaved annotations.
                        this.addAnnotation(annotation);
                    }
                }
            }

            // get the url to POST the student data
            var httpParams = {};
            httpParams.method = 'POST';
            httpParams.url = ConfigService.getConfigParam('studentDataURL');

            // set the workgroup id and run id
            var params = {};
            params.runId = ConfigService.getRunId();
            params.workgroupId = ConfigService.getWorkgroupId();
            params.data = {};
            params.data.componentStates = componentStates;
            params.data.events = events;
            params.data.annotations = annotations;
            httpParams.params = params;

            // make the request to post the student data
            return $http(httpParams).then(angular.bind(this, function(result) {

                var savedStudentDataResponse = result.data;

                // get the local references to the component states that were posted and set their id and serverSaveTime
                if (result != null &&
                        result.config != null &&
                        result.config.params != null &&
                        result.config.params.data != null) {

                    // handle saved componentStates
                    if (result.config.params.data.componentStates != null &&
                        savedStudentDataResponse.componentStates != null) {
                        var localComponentStates = result.config.params.data.componentStates;

                        var savedComponentStates = savedStudentDataResponse.componentStates;

                        // set the id and serverSaveTime in the local componentState
                        for (var i = 0; i < savedComponentStates.length; i++) {
                            var savedComponentState = savedComponentStates[i];

                            /*
                             * loop through all the component states that were posted
                             * to find the one with the matching request token
                             */
                            for (var l = 0; l < localComponentStates.length; l++) {
                                var localComponentState = localComponentStates[l];
                                if (localComponentState.requestToken != null &&
                                    localComponentState.requestToken === savedComponentState.requestToken) {
                                    localComponentState.id = savedComponentState.id;
                                    localComponentState.serverSaveTime = savedComponentState.serverSaveTime;
                                    localComponentState.requestToken = null; // requestToken is no longer needed.

                                    $rootScope.$broadcast('componentStateSavedToServer', {componentState: localComponentState});
                                    break;
                                }
                            }
                        }
                    }
                    // handle saved events
                    if (result.config.params.data.events != null &&
                        savedStudentDataResponse.events != null) {
                        var localEvents = result.config.params.data.events;

                        var savedEvents = savedStudentDataResponse.events;

                        // set the id and serverSaveTime in the local event
                        for (var i = 0; i < savedEvents.length; i++) {
                            var savedEvent = savedEvents[i];

                            /*
                             * loop through all the events that were posted
                             * to find the one with the matching request token
                             */
                            for (var l = 0; l < localEvents.length; l++) {
                                var localEvent = localEvents[l];
                                if (localEvent.requestToken != null &&
                                    localEvent.requestToken === savedEvent.requestToken) {
                                    localEvent.id = savedEvent.id;
                                    localEvent.serverSaveTime = savedEvent.serverSaveTime;
                                    localEvent.requestToken = null; // requestToken is no longer needed.

                                    $rootScope.$broadcast('eventSavedToServer', {event: localEvent});
                                    break;
                                }
                            }
                        }
                    }

                    // handle saved annotations
                    if (result.config.params.data.annotations != null &&
                        savedStudentDataResponse.annotations != null) {
                        var localAnnotations = result.config.params.data.annotations;

                        var savedAnnotations = savedStudentDataResponse.annotations;

                        // set the id and serverSaveTime in the local annotation
                        for (var i = 0; i < savedAnnotations.length; i++) {
                            var savedAnnotation = savedAnnotations[i];

                            /*
                             * loop through all the events that were posted
                             * to find the one with the matching request token
                             */
                            for (var l = 0; l < localAnnotations.length; l++) {
                                var localAnnotation = localAnnotations[l];
                                if (localAnnotation.requestToken != null &&
                                    localAnnotation.requestToken === savedAnnotation.requestToken) {
                                    localAnnotation.id = savedAnnotation.id;
                                    localAnnotation.serverSaveTime = savedAnnotation.serverSaveTime;
                                    localAnnotation.requestToken = null; // requestToken is no longer needed.

                                    $rootScope.$broadcast('annotationSavedToServer', {annotation: localAnnotation});
                                    break;
                                }
                            }
                        }
                    }

                }


                return savedStudentDataResponse;
            }));
        };
        
        serviceObject.retrieveComponentStates = function(runId, periodId, workgroupId) {
            
        };
        
        serviceObject.getLatestComponentState = function() {
            var latestComponentState = null;
            
            var studentData = this.studentData;
            
            if (studentData != null) {
                var componentStates = studentData.componentStates;
                
                if (componentStates != null) {
                    latestComponentState = componentStates[componentStates.length - 1];
                }
            }
            
            return latestComponentState;
        };
        
        /**
         * Get the latest component state for the given node id and component
         * id.
         * @param nodeId the node id
         * @param componentId the component id
         * @return the latest component state with the matching node id and
         * component id or null if none are found
         */
        serviceObject.getLatestComponentStateByNodeIdAndComponentId = function(nodeId, componentId) {
            var latestComponentState = null;
            
            if (nodeId != null && componentId != null) {
                var studentData = this.studentData;
                
                if (studentData != null) {
                    
                    // get the component states
                    var componentStates = studentData.componentStates;
                    
                    if (componentStates != null) {
                        
                        // loop through all the component states from newest to oldest
                        for (var c = componentStates.length - 1; c >= 0; c--) {
                            var componentState = componentStates[c];
                            
                            if (componentState != null) {
                                var componentStateNodeId = componentState.nodeId;
                                var componentStateComponentId = componentState.componentId;
                                
                                // compare the node id and component id
                                if (nodeId == componentStateNodeId &&
                                        componentId == componentStateComponentId) {
                                    latestComponentState = componentState;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            
            return latestComponentState;
        };
        
        /**
         * Get the component states for the given node id
         * @param nodeId the node id
         * @return an array of component states for the given node id
         */
        serviceObject.getComponentStatesByNodeId = function(nodeId) {
            var componentStatesByNodeId = [];
            
            if (nodeId != null) {
                var studentData = this.studentData;
                
                if (studentData != null) {
                    
                    // get the component states
                    var componentStates = studentData.componentStates;
                    
                    if (componentStates != null) {
                        
                        // loop through all the component states
                        for (var c = 0; c < componentStates.length; c++) {
                            var componentState = componentStates[c];
                            
                            if (componentState != null) {
                                var componentStateNodeId = componentState.nodeId;
                                
                                // compare the node id
                                if (nodeId == componentStateNodeId) {
                                    
                                    componentStatesByNodeId.push(componentState);
                                }
                            }
                        }
                    }
                }
            }
            
            return componentStatesByNodeId;
        };
        
        /**
         * Get the component states for the given node id and component id
         * @param nodeId the node id
         * @param componentId the component id
         * @return an array of component states for the given node id and 
         * component id
         */
        serviceObject.getComponentStatesByNodeIdAndComponentId = function(nodeId, componentId) {
            var componentStatesByNodeIdAndComponentId = [];
            
            if (nodeId != null && componentId != null) {
                var studentData = this.studentData;
                
                if (studentData != null) {
                    
                    // get the component states
                    var componentStates = studentData.componentStates;
                    
                    if (componentStates != null) {
                        
                        // loop through all the component states
                        for (var c = 0; c < componentStates.length; c++) {
                            var componentState = componentStates[c];
                            
                            if (componentState != null) {
                                var componentStateNodeId = componentState.nodeId;
                                var componentStateComponentId = componentState.componentId;
                                
                                // compare the node id and component id
                                if (nodeId == componentStateNodeId &&
                                        componentId == componentStateComponentId) {
                                    
                                    componentStatesByNodeIdAndComponentId.push(componentState);
                                }
                            }
                        }
                    }
                }
            }
            
            return componentStatesByNodeIdAndComponentId;
        };

        /**
         * Get the events for a node id
         * @param nodeId the node id
         * @returns the events for the node id
         */
        serviceObject.getEventsByNodeId = function(nodeId) {
            var eventsByNodeId = [];

            if (nodeId != null) {

                if (this.studentData != null && this.studentData.events != null) {

                    // get all the events
                    var events = this.studentData.events;

                    // loop through all the events
                    for (var e = 0; e < events.length; e++) {
                        var event = events[e];

                        if (event != null) {
                            var eventNodeId = event.nodeId;

                            if (nodeId === eventNodeId) {
                                // this event is for the node id we are looking for
                                eventsByNodeId.push(event);
                            }
                        }
                    }
                }
            }

            return eventsByNodeId;
        };


        /**
         * Get the events for a component id
         * @param nodeId the node id
         * @param componentId the component id
         * @returns an array of events for the component id
         */
        serviceObject.getEventsByNodeIdAndComponentId = function(nodeId, componentId) {
            var eventsByNodeId = [];

            if (nodeId != null) {

                if (this.studentData != null && this.studentData.events != null) {

                    // get all the events
                    var events = this.studentData.events;

                    // loop through all the events
                    for (var e = 0; e < events.length; e++) {
                        var event = events[e];

                        if (event != null) {
                            var eventNodeId = event.nodeId;
                            var eventComponentId = event.componentId;

                            if (nodeId === eventNodeId && componentId === eventComponentId) {
                                // this events is for the component id we are looking for
                                eventsByNodeId.push(event);
                            }
                        }
                    }
                }
            }

            return eventsByNodeId;
        };

        /**
         * Create a copy of a JSON object
         * @param jsonObject the JSON object to get a copy of
         * @return a copy of the JSON object that was passed in
         */
        serviceObject.makeCopyOfJSONObject = function(jsonObject) {
            var copyOfJSONObject = null;
            
            if (jsonObject != null) {
                // create a JSON string from the JSON object
                var jsonObjectString = JSON.stringify(jsonObject);
                
                // create a JSON object from the JSON string
                copyOfJSONObject = JSON.parse(jsonObjectString);
            }
            
            return copyOfJSONObject;
        };

        /**
         * Check if the student can visit the node
         * @param nodeId the node id
         * @returns whether the student can visit the node
         */
        serviceObject.canVisitNode = function(nodeId) {

            var result = false;

            if (nodeId != null) {

                // get the node status for the node
                var nodeStatus = this.getNodeStatusByNodeId(nodeId);

                if (nodeStatus != null) {
                    if (nodeStatus.isVisitable) {
                        result = true;
                    }
                }
            }

            return result;
        };

        /**
         * Get the node status by node id
         * @param nodeId the node id
         * @returns the node status object for a node
         */
        serviceObject.getNodeStatusByNodeId = function(nodeId) {
            var nodeStatuses = this.nodeStatuses;
            var nodeStatus = null;

            if (nodeStatuses != null) {

                // loop through all the node statuses
                for (var n = 0; n < nodeStatuses.length; n++) {

                    // get a node status
                    var tempNodeStatus = nodeStatuses[n];

                    if (tempNodeStatus != null) {

                        var tempNodeStatusNodeId = tempNodeStatus.nodeId;

                        if (nodeId === tempNodeStatusNodeId) {
                            // we have found the node status we want
                            nodeStatus = tempNodeStatus;
                        }
                    }
                }
            }

            return nodeStatus;
        };

        /**
         * Listen for the currentNodeChanged event
         */
        $rootScope.$on('currentNodeChanged', angular.bind(serviceObject, function(event, args) {
            // update the node statuses when the student moves to a new node
            this.updateNodeStatuses();
        }));

        /**
         * Check if the given node or component is completed
         * @param nodeId the node id
         * @param componentId (optional) the component id
         * @returns whether the node or component is completed
         */
        serviceObject.isCompleted = function(nodeId, componentId) {

            var result = false;

            if (nodeId != null && componentId != null) {
                // check that the component is completed

                // get the component states for the component
                var componentStates = this.getComponentStatesByNodeIdAndComponentId(nodeId, componentId);

                // get the component events
                var componentEvents = this.getEventsByNodeIdAndComponentId(nodeId, componentId);

                // get the node events
                var nodeEvents = this.getEventsByNodeId(nodeId);

                // get the component object
                var component = ProjectService.getComponentByNodeIdAndComponentId(nodeId, componentId);

                if (component != null) {

                    // get the component type
                    var componentType = component.componentType;

                    if (componentType != null) {

                        // get the service for the component type
                        var service = $injector.get(componentType + 'Service');

                        // check if the component is completed
                        if (service.isCompleted(component, componentStates, componentEvents, nodeEvents)) {
                            result = true;
                        }
                    }
                }
            } else if (nodeId != null && componentId == null) {
                // check that all the components in the node are completed

                // get all the components in the node
                var components = ProjectService.getComponentsByNodeId(nodeId);

                var tempResult = false;
                var firstResult = true;

                /*
                 * All components must be completed in order for the node to be completed
                 * so we will loop through all the components and check if they are
                 * completed
                 */
                for (var c = 0; c < components.length; c++) {
                    var component = components[c];

                    if (component != null) {
                        var componentId = component.id;
                        var componentType = component.componentType;

                        if (componentType != null) {
                            try {

                                // get the service name
                                var serviceName = componentType + 'Service';

                                if ($injector.has(serviceName)) {

                                    // get the service for the component type
                                    var service = $injector.get(serviceName);

                                    // get the component states for the component
                                    var componentStates = this.getComponentStatesByNodeIdAndComponentId(nodeId, componentId);

                                    // get the component events
                                    var componentEvents = this.getEventsByNodeIdAndComponentId(nodeId, componentId);

                                    // get the node events
                                    var nodeEvents = this.getEventsByNodeId(nodeId);

                                    // check if the component is completed
                                    var isComponentCompleted = service.isCompleted(component, componentStates, componentEvents, nodeEvents);

                                    if (firstResult) {
                                        // this is the first component we have looked at
                                        tempResult = isComponentCompleted;
                                        firstResult = false;
                                    } else {
                                        // this is not the first component we have looked at
                                        tempResult = tempResult && isComponentCompleted;
                                    }
                                }
                            } catch (e) {
                                console.log('Error: Could not calculated isCompleted() for a component');
                            }
                        }
                    }
                }

                result = tempResult;
            }

            return result;
        };

        return serviceObject;
    }];
    
    return service;
});