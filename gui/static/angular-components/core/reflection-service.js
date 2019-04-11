'use strict';

goog.module('grrUi.core.reflectionService');
goog.module.declareLegacyNamespace();



/**
 * Service for querying reflection data about RDFValues (and, in the future -
 * AFF4Objects).
 *
 * @param {!angular.$q} $q
 * @param {!grrUi.core.apiService.ApiService} grrApiService
 * @constructor
 * @ngInject
 * @export
 */
exports.ReflectionService = function($q, grrApiService) {
  /** @private {!angular.$q} */
  this.q_ = $q;

  /** @private {!grrUi.core.apiService.ApiService} */
  this.grrApiService_ = grrApiService;

  /** @private {Object.<string, Object>} */
  this.descriptorsCache_;

  /** @private {Array.<Object>} */
  this.requestsQueue_ = [];
};
var ReflectionService = exports.ReflectionService;


/**
 * Name of the service in Angular.
 */
ReflectionService.service_name = 'grrReflectionService';


/**
 * Processes requests that were queued while descriptors were being fetched.
 *
 * @private
 */
ReflectionService.prototype.processRequestsQueue_ = function() {
  angular.forEach(this.requestsQueue_, function(request) {
    var result = this.getRDFValueDescriptorFromCache_(request[1], request[2]);
    request[0].resolve(result);
  }.bind(this));

  this.requestsQueue_ = [];
};


/**
 * Returns descriptor of a given RDFValue (optionally with descriptors of all
 * nested fields).
 *
 * @param {string} valueType RDFValue type.
 * @param {boolean=} opt_withDeps If true, also return descriptors of all nested
 *                                fields.
 * @return {Object} If opt_withDeps is true, returns a dictionary of
 *                  "type -> descriptor" pairs. If opt_withDeps is false,
 *                   returns a requested descriptor.
 * @private
 */
ReflectionService.prototype.getRDFValueDescriptorFromCache_ = function(
    valueType, opt_withDeps) {
  if (!opt_withDeps) {
    return this.descriptorsCache_[valueType];
  } else {
    var results = {};

    var fillInResult = function(type) {
      if (angular.isDefined(results[type])) {
        return;
      }

      var descriptor = this.descriptorsCache_[type];
      results[type] = descriptor;

      if (angular.isUndefined(descriptor)) {
        console.log("Unknown descriptor " + type);
        results[type] = {};
        return;
      }

      angular.forEach(descriptor['fields'], function(fieldDescriptor) {
        if (angular.isDefined(fieldDescriptor['type'])) {
          fillInResult(fieldDescriptor['type']);
        }
      });
    }.bind(this);

    fillInResult(valueType);
    return results;
  }
};


/**
 * Returns descriptor of a given RDFValue (optionally with descriptors of all
 * nested fields).
 *
 * @param {string} valueType RDFValue type.
 * @param {boolean=} opt_withDeps If true, also return descriptors of all nested
 *                                fields.
 * @return {!angular.$q.Promise} Promise that resolves to result. If
 *                               opt_withDeps is true, it will resolve to a
 *                               dictionary of "type -> descriptor" pairs. If
 *                               opt_withDeps is false, it will just return
 *                               a requested descriptor.
 */
// FIXME: Remove with deps option.
ReflectionService.prototype.getRDFValueDescriptor = function(
  valueType, opt_withDeps, value) {
  var deferred = this.q_.defer();

  var type = valueType;
  if (type == '.google.protobuf.Any') {
    type = value['@type'];
    var prefix = "type.googleapis.com/proto.";
    if (type.startsWith(prefix)) {
      type = type.slice(prefix.length);
    }
  }

  if (angular.isDefined(this.descriptorsCache_)) {
    var result = this.getRDFValueDescriptorFromCache_(type, opt_withDeps);
    deferred.resolve(result);
    return deferred.promise;
  } else {
    if (this.requestsQueue_.length === 0) {
      var apiPromise = this.grrApiService_.get('/v1/DescribeTypes');
      apiPromise.then(function(response) {
        this.descriptorsCache_ = {};
        angular.forEach(response['data']['items'], function(item) {
          this.descriptorsCache_[item['name']] = item;
        }.bind(this));

        return this.processRequestsQueue_();
      }.bind(this));
    }
    this.requestsQueue_.push([deferred, type, opt_withDeps]);
    return deferred.promise;
  }
};
