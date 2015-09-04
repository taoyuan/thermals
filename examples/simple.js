'use strict';

var Printer = require('../');

var printer = new Printer('escpos', 'file', '/dev/usb/lp1');

printer.open().then(function () {

  printer.write('hello, 你好').print().then(function () {
    printer.close();
  });
});