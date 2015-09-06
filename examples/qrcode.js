'use strict';

var Printer = require('../');

var printer = new Printer();

var str = 'Hello';

printer
  .qr(str)
  .feed()
  .print();
