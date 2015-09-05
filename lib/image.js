'use strict';

var getPixels = require("get-pixels");
var utils = require('./utils');

module.exports = function (url, type, cb) {
  if (typeof type === 'function') {
    cb = type;
    type = null;
  }
  cb = cb || utils.createPromiseCallback();

  getPixels(url, type, function (err, pixels) {
    if (err) return cb(err);
    cb(null, new Image(pixels));
  });

  return cb.promise;
};

function isPixels(pixels) {
  return pixels && Array.isArray(pixels.shape);
}

function getColor(pixels, x, y) {
  var chnum = pixels.shape[pixels.shape.length - 1];
  var cols = {};
  if (chnum >= 3) {
    cols.red = pixels.get(x, y, 0);
    cols.green = pixels.get(x, y, 1);
    cols.blue = pixels.get(x, y, 2);
    cols.alpha = chnum >= 4 ? (pixels.get(x, y, 3) & 0x7F) : 0x7F;
  } else {
    throw new Error('Not supported pixel for ' + chnum + ' channels');
  }
  return cols;
}

function Image(pixels) {
  this.pixels = pixels;
  this.readImage(pixels);
}

Image.prototype.readImage = function (pixels) {
  if (!isPixels(pixels)) {
    throw new Error("Failed to load image.");
  }
  /* Make a string of 1's and 0's */
  this.width = pixels.shape[0];
  this.height = pixels.shape[1];
  this.data = [];
  for (var y = 0; y < this.height; y++) {
    for (var x = 0; x < this.width; x++) {
      /* Faster to average channels, blend alpha and negate the image here than via filters (tested!) */
      var cols = getColor(pixels, x, y);
      var greyness = ((cols['red'] + cols['green'] + cols['blue']) / 3) >> 7; // 1 for white, 0 for black
      var black = (1 - greyness) & (cols['alpha'] >> 6); // 1 for black, 0 for white, taking into account transparency
      this.data[y * this.width + x] = black;
    }
  }
};

Image.prototype.toRasterFormat = function () {
  if (this.rasterData) {
    /* Use previous calculation */
    return this.rasterData;
  }
  /* Loop through and convert format */
  var widthPixels = this.width;
  var heightPixels = this.height;
  var widthBytes = (widthPixels + 7) >> 3;
  var heightBytes = (heightPixels + 7) >> 3;
  var x = 0, y = 0, bit = 0, byte = 0, byteVal = 0;
  var data = [];
  do {
    byteVal |= this.data[y * widthPixels + x] << (7 - bit);
    x++;
    bit++;
    if (x >= widthPixels) {
      x = 0;
      y++;
      bit = 8;
      if (y >= heightPixels) {
        data[byte] = byteVal;//utils.chr(byteVal);
        break;
      }
    }
    if (bit >= 8) {
      data[byte] = byteVal;//utils.chr(byteVal);
      byteVal = 0;
      bit = 0;
      byte++;
    }
  } while (true);
  if (data.length !== widthBytes * heightPixels) {
    console.error('Expect data length ' + data.length + ' === ' + widthBytes * heightPixels);
    throw new Error("Bug in toRasterFormat, wrong number of bytes.");
  }
  this.rasterData = data;
  return this.rasterData;
};