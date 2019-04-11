'use strict';

goog.module('grrUi.forms.datetimeSecondsFormDirective');
goog.module.declareLegacyNamespace();



/**
 * Controller for DatetimeSecondsFormDirective.
 *
 * @constructor
 * @param {!angular.Scope} $scope
 * @ngInject
 */
const DatetimeSecondsFormController = function(
    $scope) {
  /** @private {!angular.Scope} */
  this.scope_ = $scope;

  /** @export {string} */
  this.valueString = '';

  /** @export {boolean} */
  this.isInvalid = false;

  /** @export {string} */
  this.format = 'YYYY-MM-DD HH:mm';

  /** @export {string} */
  this.example = moment.utc('1989-04-20T13:42:00.000Z').utc().format(
      this.format);

  this.scope_.$watch('value',
                     this.onValueChange_.bind(this));
  this.scope_.$watch('controller.valueString',
                     this.onValueStringChange_.bind(this));
};


/**
 * Handles changes in the value bound to be edited by this directive.
 * As the value may be changed in onValueStringChange handler (i.e. when
 * user types a symbol), we're only changing this.valueString if
 * the moment it represents is different from newValue.
 *
 * @param {number} newValue New time value.
 * @private
 */
DatetimeSecondsFormController.prototype.onValueChange_ = function(newValue) {
  if (angular.isNumber(newValue)) {
    var parsed = moment.utc(newValue * 1000);
    if (parsed.isValid()) {
      var newValueString = parsed.format(this.format);

      if (!moment.utc(this.valueString, this.format).isSame(parsed)) {
        this.valueString = newValueString;
      }
    } else {
      this.valueString = '';
    }
  }
};

/**
 * Handles changes in string representation of the time value being edited.
 * Called when user types or deletes a symbol. Updates the actual value
 * that's bound to this directive via "value" binding. Sets an "invalid"
 * flag and the value to null if the string can't be parsed for some reason.
 *
 * @param {string} newValue New string from the text input.
 * @private
 */
DatetimeSecondsFormController.prototype.onValueStringChange_ = function(newValue) {
  if (newValue == '') {
    this.scope_.value = null;
    this.isInvalid = false;
  } else {
    var parsed = moment.utc(newValue, this.format, true);
    if (parsed.isValid()) {
      this.scope_.value = parsed.valueOf() / 1000;
      this.isInvalid = false;
    } else {
      this.scope_.value = null;
      this.isInvalid = true;
    }
  }
};

/**
 * Sets value to the current time.
 *
 * @export
 */
DatetimeSecondsFormController.prototype.today = function() {
    this.scope_.value = moment().utc().valueOf() / 1000;
};



/**
 * DatetimeFormDirective renders RDFDatetime values..
 *
 * @return {!angular.Directive} Directive definition object.
 */
exports.DatetimeSecondsFormDirective = function() {
  return {
    restrict: 'E',
    scope: {
      value: '=',
      metadata: '='
    },
    templateUrl: '/static/angular-components/forms/datetime-form.html',
    controller: DatetimeSecondsFormController,
    controllerAs: 'controller'
  };
};


/**
 * Name of the directive in Angular.
 *
 * @const
 * @export
 */
exports.DatetimeSecondsFormDirective.directive_name = 'grrFormDatetimeSeconds';

/**
 * Semantic type corresponding to this directive.
 *
 * @const
 * @export
 */
exports.DatetimeSecondsFormDirective.semantic_type = 'RDFDatetimeSeconds';
