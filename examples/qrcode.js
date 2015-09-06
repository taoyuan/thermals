'use strict';

var Printer = require('../');

//var printer = new Printer();
var printer = new Printer('file:///dev/usb/lp1');

var str = 'Hello World!';

var version = 10;

printer
  .setAlign('center')
  .qr(str, {level: 'h', version: version})
  .text(str)
  .feed(10)
  .cut()
  .print();
