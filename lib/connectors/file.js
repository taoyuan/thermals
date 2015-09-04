'use strict';

var debug = require('debug')('thermals:file-connector');
var _ = require('lodash');
var doWhile = require('dank-do-while');
var fs = require('fs');
var util = require('util');
var Connector = require('../connector').Connector;

module.exports = FileConnector;

function FileConnector(options) {
  if (!(this instanceof FileConnector)) {
    return new FileConnector(path, options)
  }

  if (typeof options === 'string') {
    options = {path: options};
  }

  this.options = _.defaults(options, {
    retries: 1000,
    waitTime: 200
  });

  this.path = this.options.path;
  this.queue = [];
  this.running = false;
  this.index = 0;
}

util.inherits(FileConnector, Connector);

Connector.prototype._process = function () {
  var that = this;
  var options = this.options;


  //if the queue is empty or we are already in a running state, then
  //don't continue to process
  if (!that.queue.length || that.running) {
    return;
  }

  that.running = true;

  doWhile(function (next) {
    var path = options.path;
    var item = that.queue[0];

    var data = item.data;
    var callback = item.callback;
    var index = item.index;

    debug('Attempting to write to file #%s @ %s', index, (new Date()).getTime());
    debug('Data:', data);
    fs.writeFile(path, data, function (err) {
      debug('Callback from writeFile for file #%s @ %s', index, (new Date()).getTime());

      if (err) {
        debug('Error occurred for writeFile for file #%s @ %s', index, (new Date()).getTime());

        debug(err);

        item.retried += 1;

        //we have tried more times than allowed, so bail
        if (item.retried > options.retries) {
          //drop this write request out of the queue
          that.queue.shift();

          //call the callback for the original write request
          if (callback) callback(err, item);

          //return to the top of doWhile if self.queue.length is truthy
          setTimeout(function () {
            next(that.queue.length);
          }, options.waitTime);

          return;
        }

        //try again in 1000ms
        setTimeout(function () {
          //return to the top of doWhile if self.queue.length is truthy
          next(that.queue.length);
        }, options.waitTime);
      }
      else {
        //remove this request from the queue since we successfully
        //wrote it.
        that.queue.shift();

        //call the callback for the original write request
        if (callback) callback(null, true);

        //return to the top of doWhile if self.queue.length is truthy
        setTimeout(function () {
          next(that.queue.length);
        }, options.waitTime);
      }
    });
  }, function () {
    //done processing

    that.running = false;
  });
};

Connector.prototype.write = function (data, callback) {
  //this.queue.push([path, str, callback, 0, this.index++]);
  this.queue.push({
    index: this.index++,
    retried: 0,
    data: Buffer.isBuffer(data) ? data : new Buffer(data),
    callback: callback
  });
  this._process();
};
