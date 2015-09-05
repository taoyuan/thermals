'use strict';

var Printer = require('../');

var printer = new Printer();

var str = 'Hello';

printer
  .qrCode(str)
  .feed()
  .print();
