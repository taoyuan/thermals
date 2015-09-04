'use strict';

var Printer = require('../');

var printer = new Printer('escpos', 'file', '/dev/usb/lp0');

printer.write('Hello, 你好').print(function () {
  console.log('Write OK!');
});