'use strict';

var utils = require('../lib/utils');

describe('utils', function () {

  it.only('#parseSettings', function () {
    var result = utils.parseSettings('escpos+file:///dev/usb/lp0');
    console.log(result);
  });
});