'use strict';

var Printer = require('../');

var printer = new Printer('escpos', 'file', '/dev/usb/lp0');

var str = 'Hello';

printer
  .qrCode(str)
  .feed()
  .print();
