'use strict';

var util = require('util');
var hexy = require('hexy');
var Connector = require('../connector').Connector;

module.exports = ConsoleConnector;

function ConsoleConnector(settings) {
  if (!(this instanceof ConsoleConnector)) {
    return new ConsoleConnector(settings)
  }
}

util.inherits(ConsoleConnector, Connector);

ConsoleConnector.prototype.write = function (data, callback) {
  console.log(hexy.hexy(data, {
    format: 'twos'
  }));
  callback && callback();
};
