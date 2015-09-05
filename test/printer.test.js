'use strict';

var t = require('chai').assert;
var tmp = require('tmp');
var Printer = require('../');

describe('printer', function () {

  var device;
  beforeEach(function () {
    device = tmp.fileSync();
  });
  afterEach(function () {
    device.removeCallback();
  });

  it('should setup', function () {
    var printer = new Printer('escpos', 'file', device.name);
    t.ok(printer)
  });

  it('should write', function () {
    var printer = new Printer('escpos', 'file', device.name);
    printer.write('hello, 你好');
    console.log(printer.stream.getContents());
  });

  it('should print', function (done) {
    var printer = new Printer('escpos', 'file', device.name);
    printer.write('hello, 你好').print(done);
  });
});