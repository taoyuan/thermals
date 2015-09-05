'use strict';

var Image = require('../lib/image');

describe('image', function () {

  it.only('should load pixels', function (done) {
    Image(__dirname + '/fixtures/sample.png').then(function (img) {
      console.log(img.pixels);
      done();
    }, done);
  });
});