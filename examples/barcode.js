'use strict';

var Printer = require('../');

var printer = new Printer();

var str = '1234567890';

printer
  .barcode(str)
  .feed()
  .print();
