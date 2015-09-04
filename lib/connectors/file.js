'use strict';

var debug = require('debug')('thermals:file-connector');
var fs = require('fs');
var util = require('util');
var Connector = require('./connector').Connector;

module.exports = FileConnector;

function FileConnector(path,  options, openImmediately, callback) {
  if (!(this instanceof FileConnector)) {
    return new FileConnector(path,  options, openImmediately, callback)
  }

  var that = this;

  var args = Array.prototype.slice.call(arguments);
  callback = args.pop();
  if (typeof (callback) !== 'function') {
    callback = null;
  }
  this.options = (typeof options !== 'function') && options || {};

  openImmediately = (openImmediately === undefined || openImmediately === null) ? true : openImmediately;

  callback = callback || function (err) {
      if (err) {
        that.emit('error', err);
      }
    };

  this.path = path;
  if (openImmediately) {
    process.nextTick(function () {
      that.open(callback);
    });
  }
}

util.inherits(FileConnector, Connector);

Connector.prototype.open = function (callback) {
  callback();
  //if (this.isOpen()) {
  //  if (callback) {
  //    callback();
  //  }
  //  return;
  //}
  //
  //var that = this;
  //this.paused = true;
  //this.readable = true;
  //this.reading = false;
  //fs.open(this.path, 'r+', function (err, fd) {
  //  that.fd = fd;
  //  if (err) {
  //    if (callback) {
  //      callback(err);
  //    } else {
  //      that.emit('error', err);
  //    }
  //    return;
  //  }
  //
  //  that.emit('open');
  //  if (callback) {
  //    callback();
  //  }
  //})
};

Connector.prototype.isOpen = function () {
  return fs.existsSync(this.path);
  //return (this.fd ? true : false);
};

Connector.prototype.close = function (callback) {
  callback();
  //
  //var that = this;
  //
  //var fd = that.fd;
  //
  //if (that.closing) {
  //  return;
  //}
  //if (!fd) {
  //  var err = new Error('Device File not open.');
  //  if (callback) {
  //    callback(err);
  //  } else {
  //    // console.log("sp not open");
  //    that.emit('error', err);
  //  }
  //  return;
  //}
  //
  //that.closing = true;
  //
  //// Stop polling before closing the port.
  //if (process.platform !== 'win32' && that.devicePoller) {
  //  that.readable = false;
  //  that.devicePoller.close();
  //}
  //
  //try {
  //  fs.close(fd, function (err) {
  //
  //    if (err) {
  //      if (callback) {
  //        callback(err);
  //      } else {
  //        // console.log("doclose");
  //        that.emit('error', err);
  //      }
  //      return;
  //    }
  //
  //    that.emit('close');
  //    that.removeAllListeners();
  //    that.closing = false;
  //    that.fd = 0;
  //
  //    if (callback) {
  //      callback();
  //    }
  //  });
  //} catch (ex) {
  //  that.closing = false;
  //  if (callback) {
  //    callback(ex);
  //  } else {
  //    that.emit('error', ex);
  //  }
  //}
};

Connector.prototype.write = function (buffer, callback) {
  var that = this;
  if (!this.isOpen()) {
    debug('Write attempted, but device file not available - FD is not set');
    var err = new Error('Device file not open.');
    if (callback) {
      callback(err);
    } else {
      // console.log("write-fd");
      that.emit('error', err);
    }
    return;
  }
  
  if (!Buffer.isBuffer(buffer)) {
    buffer = new Buffer(buffer);
  }
  debug('Write: ', buffer);
  fs.writeFile(this.path, buffer, function (err, results) {
  //fs.write(this.fd, buffer, 0, buffer.length, function (err, results) {
    if (err) {
      debug(err);
    } else {
      debug('Wrote: ', results, 'B');
    }
    if (callback) {
      callback(err, results);
    } else {
      if (err) {
        // console.log("write");
        that.emit('error', err);
      }
    }
  });
};
