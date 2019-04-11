'use strict';

goog.module('grrUi.sidebar.clientSummaryDirective');
goog.module.declareLegacyNamespace();



/**
 * Controller for ClientSummaryDirective.
 *
 * @constructor
 * @param {!angular.Scope} $scope
 * @param {!grrUi.core.apiService.ApiService} grrApiService
 * @param {!grrUi.core.timeService.TimeService} grrTimeService
 * @ngInject
 */
const ClientSummaryController =
    function($scope, grrApiService, grrTimeService) {
  /** @private {!angular.Scope} */
  this.scope_ = $scope;

  /** @private {!grrUi.core.apiService.ApiService} */
  this.grrApiService_ = grrApiService;

  /** @private {!grrUi.core.timeService.TimeService} */
  this.grrTimeService_ = grrTimeService;

  /** @type {string} */
  this.approvalReason;

    /** @type {object} */
  this.clientInfo;

  this.scope_.$watch('client', this.onClientChange_.bind(this));
};



/**
 * Handles changes to the client.
 *
 * @private
 */
ClientSummaryController.prototype.onClientChange_ = function() {
  if (!this.scope_['client'])  {
    return;
  }

  // Check for the last crash.
  if (this.scope_['client']['last_crash_at']){
    var currentTimeMs = this.grrTimeService_.getCurrentTimeMs();
    var crashTime = this.scope_['client']['last_crash_at'];
    if (angular.isDefined(crashTime) &&
        (currentTimeMs / 1000 - crashTime / 1000000) < 60 * 60 * 24) {
      this.crashTime = crashTime;
    }
  }

  var clientId = this.scope_['client']['client_id'];
  var clientInfoUrl = 'v1/GetClient/' + clientId;
  this.grrApiService_.get(clientInfoUrl, {'lightweight': true}).then(
    function(response) {
      this.clientInfo = response.data;
    }.bind(this));

  var approvalUrl = 'v1/GetApprovals/' + clientId;
  this.grrApiService_.get(approvalUrl).then(function(response) {
    var approvals = response.data['items'];
    if (approvals && approvals.length) {
      // Approvals are returned from newest to oldest, so the first item
      // holds the most recent approval reason.
      this.approvalReason = approvals[0]['reason'];
    }
  }.bind(this));
};


/**
 * Directive for displaying a client summary for the navigation.
 *
 * @return {!angular.Directive} Directive definition object.
 * @ngInject
 * @export
 */
exports.ClientSummaryDirective = function() {
  return {
    scope: {
      client: '='
    },
    restrict: 'E',
    templateUrl: '/static/angular-components/sidebar/client-summary.html',
    controller: ClientSummaryController,
    controllerAs: 'controller'
  };
};


/**
 * Directive's name in Angular.
 *
 * @const
 * @export
 */
exports.ClientSummaryDirective.directive_name = 'grrClientSummary';
