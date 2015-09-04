'use strict';

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var iconv = require('iconv-lite');

exports.initialize = function () {
  return new Escpos();
};

function Escpos() {

}

Escpos.prototype.write = function (stream, text) {
  var buf = iconv.encode(text, 'GB18030');
  stream.write(buf);
};

Escpos.prototype.writeln = function () {

};