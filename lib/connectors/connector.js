'use strict';

var util = require('util');
var EventEmitter = require('events').EventEmitter;

exports.Connector = Connector;

function Connector() {

}

util.inherits(Connector, EventEmitter);

Connector.prototype.open = function (cb) {
  throw new Error('Not Implemented');
};

Connector.prototype.isOpen = function () {
  throw new Error('Not Implemented');
};

Connector.prototype.close = function (cb) {
  throw new Error('Not Implemented');
};

Connector.prototype.write = function (buffer, cb) {
  throw new Error('Not Implemented');
};
