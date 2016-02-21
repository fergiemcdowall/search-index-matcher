var skeleton = require('log-skeleton');
var H = require('highland');
var _ = require('lodash');

module.exports = function (givenOptions, callback) {

  getOptions(givenOptions, function(err, options) {
    var matcher = {};
    
    var log = skeleton((options) ? options.log : undefined);
    matcher.match = function (ops, callback) {

      if (!_.isPlainObject(ops)) {
        try {
          ops = JSON.parse(ops);
        }
        catch (e) {
          return callback(new Error('Options should be an object'), []);
        }
      }

      var opsDefaults = {
        beginsWith: '',
        field: '*',
        threshold: 3,
        limit: 10,
        type: 'simple'
      };

      ops = _.defaults(ops || {}, opsDefaults);

      if (ops.beginsWith.length === 0)
        return callback(new Error('match string can not be empty'), []);

      if (ops.beginsWith.length < ops.threshold)
        return callback(new Error('match string must be longer than threshold (' +
                                  ops.threshold + ')'), []);


      // console.log('TF￮' + ops.field + '￮' + ops.beginsWith)
      // options.indexes.createReadStream({
      //   start: 'TF￮body￮epub',
      //   end: 'TF￮body￮epub￮￮￮'
      // })
      // .on('data', function(data) {
      //   console.log(data)
      // })

      // console.log(ops)

      H(options.indexes.createReadStream({
        start: 'TF￮' + ops.field + '￮' + ops.beginsWith,
        end: 'TF￮' + ops.field + '￮' + ops.beginsWith + '￮￮￮'
      }))
        .on('error', function (err) {
          console.log('DISASTER')
          log.error('Oh my!', err);
        })
        .on('close', function (err) {
          console.log('ended')
          log.error('Oh my!', err);
        })
        .filter(function (data) {
          return data.key.substring(data.key.length, data.key.length - 2) == '￮￮';
        })
        .map(function (data) {
          return [data.key.split('￮')[2], data.value]; //suggestions
        })
        .sortBy(function (a, b) {
          return b[1].length - a[1].length; //sortedSuggestions
        })
        .map(function (data) {
          if (ops.type == 'ID')
            return data;
          if (ops.type == 'count')
            return [data[0], data[1].length];
          return data[0]; //fall back to a simple format
        })
        .take(ops.limit)
        .collect()
        .pull(callback);
    };

//    return matcher;
    return callback(err, matcher)
  })

};

var getOptions = function(givenOptions, callbacky) {
  const _ = require('lodash')
  const async = require('async')
  const bunyan = require('bunyan')
  const levelup = require('levelup')
  const leveldown = require('leveldown')
  const tv = require('term-vector')
  givenOptions = givenOptions || {}
  async.parallel([
    function(callback) {
      var defaultOps = {}
      defaultOps.deletable = true
      defaultOps.fieldedSearch = true
      defaultOps.fieldsToStore = 'all'
      defaultOps.indexPath = 'si'
      defaultOps.logLevel = 'error'
      defaultOps.nGramLength = 1
      defaultOps.separator = /[\|' \.,\-|(\n)]+/
      defaultOps.stopwords = tv.getStopwords('en').sort()
      defaultOps.log = bunyan.createLogger({
        name: 'search-index',
        level: givenOptions.logLevel || defaultOps.logLevel
      })
      callback(null, defaultOps)
    },
    function(callback){
      if (!givenOptions.indexes) {
        levelup(givenOptions.indexPath || 'si', {
          valueEncoding: 'json'
        }, function(err, db) {
          callback(null, db)          
        })
      }
      else {
        callback(null, null)
      }
    }
  ], function(err, results){
    var options = _.defaults(givenOptions, results[0])
    if (results[1] != null) {
//      options = _.defaults(options, results[1])
      options.indexes = results[1];
    }
    return callbacky(err, options)
  })
}
