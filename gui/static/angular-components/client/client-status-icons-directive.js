'use strict';

goog.module('grrUi.client.clientStatusIconsDirective');
goog.module.declareLegacyNamespace();



/**
 * Controller for ClientStatusIconsDirective.
 *
 * @param {!angular.Scope} $scope
 * @param {!grrUi.core.timeService.TimeService} grrTimeService
 * @constructor
 * @ngInject
 */
const ClientStatusIconsController = function(
    $scope, grrTimeService) {
  /** @private {!angular.Scope} */
  this.scope_ = $scope;

  /** @private {!grrUi.core.timeService.TimeService} */
  this.grrTimeService_ = grrTimeService;

  /** @export {?string} */
  this.iconName;

  /** @export {?number} */
  this.crashTime;

  /** @export {Array<Object>} */
  this.diskWarnings = [];

  /** @export {?number} */
  this.lastPing;

  this.scope_.$watch('::client', this.onClientChange_.bind(this));
};


/**
 * Handles changes of scope.client attribute.
 *
 * @param {number} newValue Client object (with types or without)
 * @private
 */
ClientStatusIconsController.prototype.onClientChange_ = function(newValue) {
  if (angular.isUndefined(newValue)) {
    return;
  }

  this.iconName = this.showCrashIcon = null;
  this.diskWarnings = [];

  if (angular.isObject(newValue)) {
    this.lastPing = /** @type {number} */ (this.scope_.$eval(
        'client.last_seen_at'));
    if (angular.isUndefined(this.lastPing)) {
      this.lastPing = 0;
    }

    var currentTimeMs = this.grrTimeService_.getCurrentTimeMs();
    var timeLastSeenSecs = (currentTimeMs - this.lastPing / 1000) / 1000;

    if (timeLastSeenSecs < 60 * 15) {
      this.iconName = 'online';
    } else if (timeLastSeenSecs < 60 * 60 * 24) {
      this.iconName = 'online-1d';
    } else {
      this.iconName = 'offline';
    }

    var crashTime = /** @type {number} */ (this.scope_.$eval(
        'client.last_crash_at'));
    if (angular.isDefined(crashTime) &&
        (currentTimeMs / 1000 - crashTime / 1000000) < 60 * 60 * 24) {
      this.crashTime = crashTime;
    }

    if (angular.isDefined(newValue) && angular.isDefined(newValue.volumes))  {
      angular.forEach(newValue['volumes'] || [], function(volume) {
        if (volume['windowsvolume'] &&
            volume['windowsvolume']['drive_type'] ==
            'DRIVE_CDROM') {
          return;
        }

        if (angular.isDefined(volume['actual_available_allocation_units']) &&
            angular.isDefined(volume['total_allocation_units'])) {
          var percent = (
            volume['actual_available_allocation_units'] /
              volume['value']['total_allocation_units']) * 100;
          if (percent <= 5) {
            var volumeName = '';
            if (volume['name']) {
              volumeName = volume['name'];
            }
            this.diskWarnings.push([volumeName, percent]);
          }
        }
      }.bind(this));
    }
  }
};


/**
 * Directive that displays client status icons for a given client.
 *
 * @return {!angular.Directive} Directive definition object.
 * @ngInject
 * @export
 */
exports.ClientStatusIconsDirective = function() {
  return {
    scope: {client: '='},
    restrict: 'E',
    templateUrl: '/static/angular-components/client/' +
        'client-status-icons.html',
    controller: ClientStatusIconsController,
    controllerAs: 'controller'
  };
};


/**
 * Name of the directive in Angular.
 */
exports.ClientStatusIconsDirective.directive_name = 'grrClientStatusIcons';
