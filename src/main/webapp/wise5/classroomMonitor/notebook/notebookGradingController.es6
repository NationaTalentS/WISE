'use strict';

class NotebookGradingController {

    constructor($rootScope,
                $scope,
                $state,
                ConfigService,
                NotebookService,
                ProjectService,
                StudentStatusService,
                TeacherDataService,
                TeacherWebSocketService) {
        this.$rootScope = $rootScope;
        this.$scope = $scope;
        this.$state = $state;
        this.ConfigService = ConfigService;
        this.NotebookService = NotebookService;
        this.ProjectService = ProjectService;
        this.StudentStatusService = StudentStatusService;
        this.TeacherDataService = TeacherDataService;
        this.TeacherWebSocketService = TeacherWebSocketService;

        this.themePath = this.ProjectService.getThemePath();

        this.teacherWorkgroupId = this.ConfigService.getWorkgroupId();

        // get the workgroups sorted alphabetically
        this.workgroups = this.ConfigService.getClassmateUserInfos();

        this.noteFilter = "note";
        this.reportFilter = "report";

        this.showAllNotes = false;
        this.showAllReports = false;
        this.showNoteForWorkgroup = {};
        this.showReportForWorkgroup = {};
        for (let i = 0; i < this.workgroups.length; i++) {
            let workgroup = this.workgroups[i];
            this.showNoteForWorkgroup[workgroup.workgroupId] = false;
            this.showReportForWorkgroup[workgroup.workgroupId] = false;
        }

        this.canViewStudentNames = true;
        this.canGradeStudentWork = true;

        // get the role of the teacher for the run e.g. 'owner', 'write', 'read'
        let role = this.ConfigService.getTeacherRole(this.teacherWorkgroupId);

        if (role === 'owner') {
            // the teacher is the owner of the run and has full access
            this.canViewStudentNames = true;
            this.canGradeStudentWork = true;
        } else if (role === 'write') {
            // the teacher is a shared teacher that can grade the student work
            this.canViewStudentNames = true;
            this.canGradeStudentWork = true;
        } else if (role === 'read') {
            // the teacher is a shared teacher that can only view the student work
            this.canViewStudentNames = false;
            this.canGradeStudentWork = false;
        }

        // save event when notebook grading view is displayed
        let context = "ClassroomMonitor", nodeId = null, componentId = null, componentType = null,
            category = "Navigation", event = "notebookViewDisplayed", data = {};
        this.TeacherDataService.saveEvent(context, nodeId, componentId, componentType, category, event, data);
    }

    toggleDisplayNoteForWorkgroup(workgroupId) {
        this.showNoteForWorkgroup[workgroupId] = !this.showNoteForWorkgroup[workgroupId];
    }

    toggleDisplayReportForWorkgroup(workgroupId) {
        this.showReportForWorkgroup[workgroupId] = !this.showReportForWorkgroup[workgroupId];
    }

    toggleDisplayAllNotes() {
        this.showAllNotes = !this.showAllNotes;

        for (let workgroupId in this.showNoteForWorkgroup) {
            this.showNoteForWorkgroup[workgroupId] = this.showAllNotes;
        }
    }

    toggleDisplayAllReports() {
        this.showAllReports = !this.showAllReports;

        for (let workgroupId in this.showReportForWorkgroup) {
            this.showReportForWorkgroup[workgroupId] = this.showAllReports;
        }
    }

    /**
     * Handle request to view notes for the specified workgroup
     * @param workgroupId
     */
    viewNotes(workgroupId) {
        alert(workgroupId);
    }

    /**
     * Handle request to view report for the specified workgroup
     * @param workgroupId
     */
    viewReport(workgroupId) {
        alert(workgroupId);
    }

    /**
     * Get the current period
     */
    getCurrentPeriod() {
        return this.TeacherDataService.getCurrentPeriod();
    };

}

NotebookGradingController.$inject = [
    '$rootScope',
    '$scope',
    '$state',
    'ConfigService',
    'NotebookService',
    'ProjectService',
    'StudentStatusService',
    'TeacherDataService',
    'TeacherWebSocketService'
];

export default NotebookGradingController;
