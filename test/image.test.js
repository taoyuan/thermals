'use strict';

var s = require('./support');
var Image = require('../lib/image');

describe('image', function () {

  it.only('should load pixels', function (done) {
    Image(__dirname + '/fixtures/sample.png').then(function (img) {
      console.log(img.pixels.data);
      console.log(img.toRasterFormat().length);
      console.log(img.toRasterFormat());
      done();
    }, done);
  });
});