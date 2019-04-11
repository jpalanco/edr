'use strict';

goog.module('grrUi.artifact.artifactsListFormDirective');
goog.module.declareLegacyNamespace();



/**
 * Controller for ArtifactsListFormDirective.
 *
 * @constructor
 * @param {!angular.Scope} $scope
 * @param {!grrUi.artifact.artifactDescriptorsService.ArtifactDescriptorsService} grrArtifactDescriptorsService
 * @ngInject
 */
const ArtifactsListFormController =
      function($scope, grrArtifactDescriptorsService, $rootScope) {
  /** @private {!angular.Scope} */
          this.scope_ = $scope;
          this.rootScope_ = $rootScope;

  /** @private {!grrUi.artifact.artifactDescriptorsService.ArtifactDescriptorsService} */
  this.grrArtifactDescriptorsService_ = grrArtifactDescriptorsService;

  /** @export {Array<Object>} */
  this.descriptorsList = [];

  /** @export {Object<string, Object>} */
  this.descriptors;

  /** @export {string} */
  this.descriptorsError;

  /** @export {Object} */
  this.selectedName;

  /** @export {string} */
  this.search = '';

  /** @export {Function} Bound function to be used as a filter. */
  this.searchFilterRef = this.searchFilter.bind(this);

  this.grrArtifactDescriptorsService_.listDescriptors().then(
      this.onArtifactsResponse_.bind(this),
      this.onArtifactsRequestFailure_.bind(this));

  this.scope_.$watch('controller.descriptors',
                     this.onDescriptorsOrValueChange_.bind(this));

  this.scope_.$watch('controller.selectedName',
                     this.onSelectedNameChange_.bind(this));

  this.scope_.$watchCollection('value',
                               this.onDescriptorsOrValueChange_.bind(this));
  this.scope_.value = {names:[]};
};

ArtifactsListFormController.prototype.onSelectedNameChange_ = function(newValue) {
    if (angular.isDefined(this.descriptors)) {
        this.rootScope_["selectedArtifact"] = this.descriptors[this.selectedName];
    }
};


/**
 * Filters artifacts by search string (case-insenstive).
 *
 * @param {!Object} descriptor Artifact descriptor to check.
 * @return {boolean} True if artifacts's name matches current search
 *     string, false otherwise.
 * @export
 */
ArtifactsListFormController.prototype.searchFilter = function(descriptor) {
  return !this.search ||
      descriptor.name
      .toLowerCase().indexOf(this.search.toLowerCase()) != -1;
};

/**
 * Handles server's response with a list of artifacts.
 *
 * @param {!Object<string, Object>} descriptors
 * @private
 */
ArtifactsListFormController.prototype.onArtifactsResponse_ = function(
    descriptors) {
  this.descriptors = descriptors;
};


/**
 * Handles errors that happen when requesting list of available artifacts.
 *
 * @param {string} error
 * @private
 */
ArtifactsListFormController.prototype.onArtifactsRequestFailure_ = function(
    error) {
  this.descriptorsError = error;
};

/**
 * Adds artifact with a given name to the list of selected names and
 * removes artifact descriptor with this name from selectable artifacts
 * list.
 *
 * @param {!Object} name Typed name of the artifact to add to the selected
 *     list.
 * @export
 */
ArtifactsListFormController.prototype.add = function(name) {
  var index = -1;
  for (var i = 0; i < this.scope_.value.names.length; ++i) {
    if (this.scope_.value.names[i] == name) {
      index = i;
      break;
    }
  }
  if (index == -1) {
    this.scope_.value.names.push(name);
  }
};

/**
 * Removes given name from the list of selected artifacts names and
 * adds artifact descriptor with this name back to the list of selectable
 * artifacts.
 *
 * @param {!Object} name Typed name to be removed from the list of selected
 *     names.
 * @export
 */
ArtifactsListFormController.prototype.remove = function(name) {
  var index = -1;
  for (var i = 0; i < this.scope_.value.names.length; ++i) {
    if (this.scope_.value.names[i] == name) {
      index = i;
      break;
    }
  }

  if (index != -1) {
    this.scope_.value.names.splice(index, 1);
  }
};

/**
 * Removes all names from the list of selected artifacts names.
 *
 * @export
 */
ArtifactsListFormController.prototype.clear = function() {
  angular.forEach(angular.copy(this.scope_.value.names), function(name) {
    this.remove(name);
  }.bind(this));
};

/**
 * Handles either controller.descriptors or value bindings updates.
 *
 * This function keeps controller.descriptorsList up to date.
 * controller.descriptorsList is used to show list of artifacts available for
 * selection. So whenever selection list changes we have to regenerate this
 * list.
 *
 * @private
 **/
ArtifactsListFormController.prototype.onDescriptorsOrValueChange_ = function() {
    if (angular.isDefined(this.descriptors) &&
        angular.isDefined(this.scope_.value) &&
        angular.isDefined(this.scope_.value.names)) {
    this.descriptorsList = [];
    angular.forEach(this.descriptors, function(descriptor, name) {
      var index = -1;
      for (var i = 0; i < this.scope_.value.names.length; ++i) {
        if (this.scope_.value.names[i] == name) {
          index = i;
          break;
        }
      }

      if (index == -1) {
        this.descriptorsList.push(descriptor);
      }
    }.bind(this));
  }
};

/**
 * OutputPluginDescriptorFormDirective definition.
 *
 * @return {angular.Directive} Directive definition object.
 */
exports.ArtifactsListFormDirective = function() {
  return {
    restrict: 'E',
    scope: {
      descriptor: '=',
      value: '='
    },
    templateUrl: '/static/angular-components/artifact/' +
        'artifacts-list-form.html',
    controller: ArtifactsListFormController,
    controllerAs: 'controller'
  };
};


/**
 * Directive's name in Angular.
 *
 * @const
 * @export
 */
exports.ArtifactsListFormDirective.directive_name = 'grrArtifactsListForm';


/**
 * Semantic type corresponding to this directive.
 *
 * @const
 * @export
 */
exports.ArtifactsListFormDirective.semantic_type = 'Artifacts';
