'use strict';

goog.module('grrUi.client.virtualFileSystem.fileTableDirective');
goog.module.declareLegacyNamespace();

const {REFRESH_FILE_EVENT, REFRESH_FOLDER_EVENT} = goog.require('grrUi.client.virtualFileSystem.events');
const {ServerErrorButtonDirective} = goog.require('grrUi.core.serverErrorButtonDirective');
const {ensurePathIsFolder, getFolderFromPath} = goog.require('grrUi.client.virtualFileSystem.utils');


var ERROR_EVENT_NAME = ServerErrorButtonDirective.error_event_name;

var OPERATION_POLL_INTERVAL_MS = 1000;


/**
 * Controller for FileTableDirective.
 *
 * @constructor
 * @param {!angular.Scope} $rootScope
 * @param {!angular.Scope} $scope
 * @param {!angular.$interval} $interval
 * @param {!grrUi.core.apiService.ApiService} grrApiService
 * @ngInject
 */
const FileTableController = function(
    $rootScope, $scope, $interval, grrApiService) {
    /** @private {!angular.Scope} */
    this.rootScope_ = $rootScope;

    /** @private {!angular.Scope} */
    this.scope_ = $scope;

    /** @private {!angular.$interval} */
    this.interval_ = $interval;

    /** @private {!grrUi.core.apiService.ApiService} */
    this.grrApiService_ = grrApiService;

    /** @private {string} */
    this.selectedDirPath_;

    /** @private {string} */
    this.selecteFilePath_;

    /** @type {?string} */
    this.lastRefreshOperationId;

    /**
     * Used for UI binding with a filter edit field.
     * @export {string}
     */
    this.filterEditedValue = '';

    /**
     * Currently used filter value.
     * @export {string}
     */
    this.filterValue = '';

    /** @type {!grrUi.client.virtualFileSystem.fileContextDirective.FileContextController} */
    this.fileContext;

    this.selectedRow = {};

    this.scope_.$watch('controller.fileContext.selectedRow',
                       this.onSelectedRowChange_.bind(this));
};

/**
 * @param {?string} newValue
 * @param {?string} oldValue
 *
 * @private
 */
FileTableController.prototype.onDirPathChange_ = function(newValue, oldValue) {
  var newFolder = getFolderFromPath(newValue);
  var oldFolder = getFolderFromPath(oldValue);

  if (newFolder !== oldFolder) {
    this.refreshFileList_();

    // Reset the "refresh directory" button state.
    this.lastRefreshOperationId = null;
  }
};


FileTableController.prototype.onSelectedRowChange_ = function(newValue, oldValue) {
  if (angular.isDefined(newValue) && angular.isDefined(newValue.Name)) {
    if (angular.isDefined(this.fileContext.selectedDirPath)) {
      this.fileContext.selectedFilePath = this.fileContext.selectedDirPath +
        "/" + newValue.Name;
    }
  }
};

/**
 * Is triggered whenever the client id or the selected folder path changes.
 *
 * @private
 */
FileTableController.prototype.refreshFileList_ = function() {
  var clientId = this.fileContext['clientId'];
  var selectedDirPath = this.fileContext['selectedDirPath'] || '';

    this.filter = '';
};

/**
 * Selects a file by setting it as selected in the context.
 *
 * @param {Object} file
 * @export
 */
FileTableController.prototype.selectFile = function(file) {
  // Always reset the version when the file is selected.
  this.fileContext.selectFile(file['path'], 0);
};

/**
 * Selects a folder by setting it as selected in the context.
 *
 * @param {Object} file
 * @export
 */
FileTableController.prototype.selectFolder = function(file) {
  var clientId = this.fileContext['clientId'];
  var filePath = file['path'];
  filePath = ensurePathIsFolder(filePath);

  // Always reset the version if the file is selected.
  this.fileContext.selectFile(filePath, 0);
};

/**
 * Refreshes the current directory.
 *
 * @export
 */
FileTableController.prototype.startVfsRefreshOperation = function() {
    var clientId = this.fileContext['clientId'];
  var selectedDirPath = this.fileContext['selectedDirPath'];

  var url = 'v1/VFSRefreshDirectory/' + clientId;
  var params = {
    vfs_path: selectedDirPath,
    depth: 0,
  };

  // Setting this.lastRefreshOperationId means that the update button
  // will get disabled immediately.
  this.lastRefreshOperationId = 'unknown';
  this.grrApiService_.post(url, params)
      .then(
          function success(response) {
            this.lastRefreshOperationId = response.data['flow_id'];
            var pollPromise = this.grrApiService_.poll(
              'v1/GetFlowDetails/' + clientId,
              OPERATION_POLL_INTERVAL_MS, {
                flow_id: this.lastRefreshOperationId,
              }, function(response) {
                if (response.data.context.state != 'RUNNING') {
                    this.lastRefreshOperationId = undefined;
                    return true;
                };
                return false;
              }.bind(this));
            this.scope_.$on('$destroy', function() {
              this.grrApiService_.cancelPoll(pollPromise);
            }.bind(this));

            return pollPromise;
          }.bind(this))
      .then(
          function success() {
            this.rootScope_.$broadcast(
                REFRESH_FOLDER_EVENT, selectedDirPath);
          }.bind(this));
};


/**
 * Updates the file filter.
 *
 * @export
 */
FileTableController.prototype.updateFilter = function() {
  this.filterValue = this.filterEditedValue;
};

/**
 * FileTableDirective definition.
 * @return {angular.Directive} Directive definition object.
 */
exports.FileTableDirective = function() {
  return {
    restrict: 'E',
    scope: {},
    require: '^grrFileContext',
    templateUrl: '/static/angular-components/client/virtual-file-system/file-table.html',
    controller: FileTableController,
    controllerAs: 'controller',
    link: function(scope, element, attrs, fileContextController) {
      scope.controller.fileContext = fileContextController;
    }
  };
};


/**
 * Name of the directive in Angular.
 *
 * @const
 * @export
 */
exports.FileTableDirective.directive_name = 'grrFileTable';
