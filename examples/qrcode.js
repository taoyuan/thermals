'use strict';

var Printer = require('../');

var printer = new Printer('escpos', 'file', '/dev/usb/lp0');

printer
  .qrCode('Hello')
  .write('\n')
  .print();
