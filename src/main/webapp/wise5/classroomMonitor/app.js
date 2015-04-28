define([
        'angular',
        'd3',
        'directives',
        'jquery',
        'jqueryUI',
        'angularAnimate',
        'angularDragDrop',
        'angularSortable',
        'angularUIRouter',
        'angularWebSocket',
        'annotationService',
        'configService',
        'currentNodeService',
        'multipleChoiceService',
        'nodeService',
        'openResponseService',
        'portfolioService',
        'projectService',
        'sessionService',
        'studentDataService',
        'studentStatusService',
        'teacherDataService',
        'teacherWebSocketService'
        ], function(
                angular,
                d3,
                directives,
                $, 
                jqueryUI,
                angularAnimate,
                angularDragDrop,
                angularSortable,
                angularUIRouter,
                angularWebSocket,
                annotationService,
                configService,
                currentNodeService,
                multipleChoiceService,
                nodeService,
                openResponseService,
                portfolioService,
                projectService,
                sessionService,
                studentDataService,
                studentStatusService,
                teacherDataService,
                teacherWebSocketService) {

	var app = angular.module('app', [
	                                 'directives',
	                                 'ui.router',
	                                 'ui.sortable',
	                                 'ngAnimate',
	                                 'ngDragDrop',
	                                 'ngWebSocket'
	                                 ]);
	
    // core services
	app.factory('AnnotationService', annotationService);
    app.factory('ConfigService', configService);
    app.factory('CurrentNodeService', currentNodeService);
    app.factory('NodeService', nodeService);
    app.factory('PortfolioService', portfolioService);
    app.factory('ProjectService', projectService);
    app.factory('SessionService', sessionService);
    app.factory('StudentDataService', studentDataService);
    app.factory('StudentStatusService', studentStatusService);
    app.factory('TeacherDataService', teacherDataService);
    app.factory('TeacherWebSocketService', teacherWebSocketService);
    
    // node services
    app.factory('MultipleChoiceService', multipleChoiceService);
    app.factory('OpenResponseService', openResponseService);
	
	app.filter('sanitizeHTML', ['$sce', function($sce) {
	    return function(htmlCode) {
	        return $sce.trustAsHtml(htmlCode);
	    };
	}]);
	
	app.init = function() {
		angular.bootstrap(document, ['app']);
	};
	
	app.loadController = function(controllerName) {
		return ['$q', function($q) {
			var deferred = $q.defer();
			require([controllerName], function() {
				deferred.resolve();
			});
			return deferred.promise;
		}];
	};
	
	app.config(['$urlRouterProvider', '$stateProvider', '$controllerProvider', 
	            function($urlRouterProvider, $stateProvider, $controllerProvider) {
		
		$urlRouterProvider.otherwise('/studentProgress');
		
		app.$controllerProvider = $controllerProvider;
		
		$stateProvider
    		.state('root', {
                url: '',
                abstract: true,
                templateUrl: 'wise5/classroomMonitor/classroomMonitor.html',
                resolve: {
                    classroomMonitorController: app.loadController('classroomMonitorController'),
                    portfolioController: app.loadController('portfolioController'),
                    config: function(ConfigService) {
                        var configUrl = window.configUrl;
                        
                        return ConfigService.retrieveConfig(configUrl);
                    },
                    project: function(ProjectService, config) {
                        return ProjectService.retrieveProject();
                    },
                    studentStatuses: function(StudentStatusService, config) {
                        return StudentStatusService.retrieveStudentStatuses();
                    },
                    webSocket: function(TeacherWebSocketService, config) {
                        return TeacherWebSocketService.initialize();
                    }
                }
            })
            .state('root.studentProgress', {
                url: '/studentProgress',
                templateUrl: 'wise5/classroomMonitor/studentProgress/studentProgress.html',
                controller: 'StudentProgressController',
                controllerAs: 'studentProgressController',
                resolve: {
                    loadController: app.loadController('studentProgressController')
                }
            })
            .state('root.nodeProgress', {
                url: '/nodeProgress',
                templateUrl: 'wise5/classroomMonitor/nodeProgress/nodeProgress.html',
                controller: 'NodeProgressController',
                controllerAs: 'nodeProgressController',
                resolve: {
                    loadController: app.loadController('nodeProgressController')
                }
            })
            .state('root.nodeGrading', {
                url: '/nodeGrading',
                templateUrl: 'wise5/classroomMonitor/nodeGrading/nodeGrading.html',
                controller: 'NodeGradingController',
                controllerAs: 'nodeGradingController',
                resolve: {
                    studentData: function(TeacherDataService, config) {
                        return TeacherDataService.retrieveStudentDataByNodeId();
                    },
                    annotations: function(AnnotationService, config) {
                        return AnnotationService.retrieveAnnotationsByNodeId();
                    },
                    loadController: app.loadController('nodeGradingController')
                }
            });
            
	}]);
	return app;
});