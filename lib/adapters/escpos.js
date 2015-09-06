'use strict';

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var iconv = require('iconv-lite');

exports.initialize = function (settings) {
  return new Escpos(settings);
};

var CMDS = {
  /* ASCII codes */
  NUL: "\x00",
  LF: "\x0a",
  ESC: "\x1b",
  FS: "\x1c",
  FF: "\x0c",
  GS: "\x1d",
  DLE: "\x10",
  EOT: "\x04",

  /* Barcode types */
  BARCODE_UPCA: 65,
  BARCODE_UPCE: 66,
  BARCODE_JAN13: 67,
  BARCODE_JAN8: 68,
  BARCODE_CODE39: 69,
  BARCODE_ITF: 70,
  BARCODE_CODABAR: 71,
  BARCODE_CODE93: 72,
  BARCODE_CODE128: 73,

  /* Barcode HRI (human-readable interpretation) text position */
  BARCODE_TEXT_NONE: 0,
  BARCODE_TEXT_ABOVE: 1,
  BARCODE_TEXT_BELOW: 2,

  /* Cut types */
  CUT_FULL: 65,
  CUT_PARTIAL: 66,

  /* Fonts */
  FONT_A: 0,
  FONT_B: 1,
  FONT_C: 2,

  /* Image sizing options */
  IMG_DEFAULT: 0,
  IMG_DOUBLE_WIDTH: 1,
  IMG_DOUBLE_HEIGHT: 2,

  /* Justifications */
  JUSTIFY_LEFT: 0,
  JUSTIFY_CENTER: 1,
  JUSTIFY_RIGHT: 2,

  /* Print mode constants */
  MODE_FONT_A: 0,
  MODE_FONT_B: 1,
  MODE_EMPHASIZED: 8,
  MODE_DOUBLE_HEIGHT: 16,
  MODE_DOUBLE_WIDTH: 32,
  MODE_UNDERLINE: 128,

  /* QR code error correction levels */
  QR_ECLEVEL_L: 0,
  QR_ECLEVEL_M: 1,
  QR_ECLEVEL_Q: 2,
  QR_ECLEVEL_H: 3,

  /* QR code models */
  QR_MODEL_1: 1,
  QR_MODEL_2: 2,
  QR_MICRO: 3,

  /* Printer statuses */
  STATUS_PRINTER: 1,
  STATUS_OFFLINE_CAUSE: 2,
  STATUS_ERROR_CAUSE: 3,
  STATUS_PAPER_ROLL: 4,
  STATUS_INK_A: 7,
  STATUS_INK_B: 6,
  STATUS_PEELER: 8,

  /* Underline */
  UNDERLINE_NONE: 0,
  UNDERLINE_SINGLE: 1,
  UNDERLINE_DOUBLE: 2
};

var PRINT_MODES = {
  'FONT-A': 0,
  'FONT-B': 1,
  'EMPHASIZED': 8,
  'DOUBLE-HEIGHT': 16,
  'DOUBLE-WIDTH': 32,
  'UNDERLINE': 128
};

var BARCODE_TEXT_POSITION = [
  'NONE', 'TOP', 'BOTTOM', 'BOTH'
];

var FONTS = [
  'FONT-A', 'FONT-B', 'FONT-C'
];

var ALIGNMENTS = [
  'LEFT', 'CENTER', 'RIGHT'
];

var UNDERLINES = [
  'NONE', 'SINGLE', 'DOUBLE'
];

function chr(n) {
  return String.fromCharCode(n);
}

/**
 * Generate two characters for a number: In lower and higher parts, or more parts as needed.
 * @param {Number} input Input number
 * @param {Number} length The number of bytes to output (1 - 4).
 */
function intLowHigh(input, length) {
  var maxInput = (256 << (length * 8) - 1);
  if (length < 1 || length > 4) {
    throw new Error('length must be between 1 and 4');
  }
  if (input > maxInput) {
    throw new Error('input value ');
  }
  //self::validateInteger($length, 1, 4, __FUNCTION__);
  //self::validateInteger($input, 0, $maxInput, __FUNCTION__);
  var answer = '';
  for (var i = 0; i < length; i++) {
    answer += chr(input & 0xFF);
    input >>= 8;
  }
  return answer;
}

function encodeSize(size, long) {
  var result = '';
  size.forEach(function (i) {
    if (long) {
      result += intLowHigh(i, 2);
    } else {
      result += chr(i);
    }
  });
  return result;
}

function Escpos(options) {
  this.stream = options.stream;
}

Escpos.prototype.cut = function (mode, lines) {
  this.stream.write(CMDS.GS + 'V' + chr(mode) + chr(lines));
};

Escpos.prototype.feed = function (lines) {
  if (lines <= 1) {
    this.stream.write(CMDS.LF);
  } else {
    this.stream.write(CMDS.ESC + "d" + chr(lines));
  }
};

Escpos.prototype.feedForm = function () {
  this.stream.write(CMDS.FF);
};

Escpos.prototype.feedReverse = function (lines) {
  this.stream.write(CMDS.ESC + "e" + chr(lines));
};

Escpos.prototype.barcode = function (data, type) {
  // More advanced function B, used in preference
  this.stream.write(CMDS.GS + "k" + chr(type.code) + chr(data.length) + data);
};

Escpos.prototype.pulse = function (pin, options) {
  this.stream.write(CMDS.ESC + "p" + chr(pin + 48) + chr(options.on / 2) + chr(options.off / 2));
};

Escpos.prototype.graphics = function (img, size) {
  var imgHeader = encodeSize([img.width, img.height], true);
  var tone = '0';
  var colors = '1';
  size = size.toUpperCase();
  var xm = (size === 'DOUBLE-WIDTH' || size === 'DOUBLE') ? chr(2) : chr(1);
  var ym = (size === 'DOUBLE-HEIGHT' || size === 'DOUBLE') ? chr(2) : chr(1);
  var header = tone + xm + ym + colors + imgHeader;
  this.wrapperSendGraphicsData('0', 'p', header + img.toRasterFormat());
  this.wrapperSendGraphicsData('0', '2');
};

Escpos.prototype.qrCode = function (content, options) {
  var model = options.model;
  if (typeof model === 'string') {
    model = model.toUpperCase();
    if (model === 'MICRO') {
      model = 3;
    } else if (model === '1') {
      model = 1;
    } else {
      model = 2;
    }
  }

  var levels = ['L', 'M', 'Q', 'R'];
  var level = levels.indexOf(options.level.toUpperCase());
  if (level < 0) level = 0;

  var cn = '1'; // Code type for QR code
  // Select model: 1, 2 or micro.
  this.wrapperSend2dCodeData(chr(65), cn, chr(48 + model) + chr(0));
  // Set dot size.
  this.wrapperSend2dCodeData(chr(67), cn, chr(options.size));
  // Set error correction level: L, M, Q, or H
  this.wrapperSend2dCodeData(chr(69), cn, chr(48 + level));
  // Send content & print
  this.wrapperSend2dCodeData(chr(80), cn, content, '0');
  this.wrapperSend2dCodeData(chr(81), cn, '', '0');
};

var CODE2D_TYPES = ['PDF417', 'DATAMATRIX', 'QR'];

var QR_LEVELS = {
  L: 76,
  M: 77,
  Q: 81,
  H: 72
};

Escpos.prototype.qr = function (content, options) {
  options = options || {};

  var type = chr(CODE2D_TYPES.indexOf('QR'));
  var v = chr(0);
  var level = (options.level && options.level.toUpperCase()) || 'L';
  level = chr(QR_LEVELS[level]);
  var size = chr(options.size || 6);
  var header = intLowHigh(content.length, 2);

  this.stream.write(CMDS.GS + 'Z' + type);
  this.stream.write(CMDS.ESC + 'Z' + v + level + size + header + content);
};

Escpos.prototype.code2d = function (content, options) {
  options = options || {};
  var type = (options.type || 'qr').toUpperCase();

  // 'PDF417', 'DATAMATRIX', 'QR'
  if (type === 'QR') {
    this.qr(content, options);
  } else {
    throw new Error('Unsupported 2D code type: ' + type);
  }
};

/**
 *
 * @param {Number} table
 */
Escpos.prototype.selectCharacterTable = function (table) {
  this.stream.write(CMDS.ESC + "t" + chr(table));
};


Escpos.prototype.selectPrintMode = function (mode) {
  var m = PRINT_MODES[mode.toUpperCase()];
  if (m === undefined || m === null) {
    throw new Error('Invalid print mode `' + mode + '`');
  }
  this.stream.write(CMDS.ESC + "!" + chr(m));
};

Escpos.prototype.setBarcodeHeight = function (height) {
  this.stream.write(CMDS.GS + "h" + chr(height));
};

Escpos.prototype.setBarcodeTextPosition = function (position) {
  var p = BARCODE_TEXT_POSITION.indexOf(position.toUpperCase());
  if (p < 0) {
    throw new Error('Invalid barcode text position');
  }

  this.stream.write(CMDS.GS + "H" + chr(p));
};

Escpos.prototype.setDoubleStrike = function (on) {
  this.stream.write(CMDS.ESC + "G" + (on ? chr(1) : chr(0)));
};

Escpos.prototype.setEmphasis = function (on) {
  this.stream.write(CMDS.ESC + "E" + (on ? chr(1) : chr(0)));
};

Escpos.prototype.setFont = function (font) {
  var f = FONTS.indexOf(font.toUpperCase());
  if (f < 0) {
    throw new Error('Invalid font');
  }

  this.stream.write(CMDS.ESC + "M" + chr(f));
};

Escpos.prototype.setAlign = function (alignment) {
  var a = ALIGNMENTS.indexOf(alignment.toUpperCase());
  if (a < 0) {
    throw new Error('Invalid alignment');
  }

  this.stream.write(CMDS.ESC + "a" + chr(a));
};

Escpos.prototype.setReverseColors = function (on) {
  this.stream.write(CMDS.GS + "B" + (on ? chr(1) : chr(0)));
};

Escpos.prototype.setTextSize = function (widthMultiplier, heightMultiplier) {
  var c = ((widthMultiplier - 1) << 4) + (heightMultiplier - 1);
  this.stream.write(CMDS.GS + "!" + chr(c));
};

Escpos.prototype.setUnderline = function (underline) {
  var u = UNDERLINES.indexOf(underline.toUpperCase());
  if (u < 0) {
    throw new Error('Invalid justification');
  }

  this.stream.write(CMDS.ESC + "-" + chr(u));
};

Escpos.prototype.write = function (text) {
  var buf = iconv.encode(text, 'GB18030');
  this.stream.write(buf);
};

Escpos.prototype.writeln = function (text) {
  text = text || '';
  this.write(text + '\n');
};

/**
 * Wrapper for GS ( L, to calculate and send correct data length.
 *
 * @param {String} m Modifier/variant for function. Usually '0'.
 * @param {String} fn Function number to use, as character.
 * @param {String} [data] Data to send.
 * @throws InvalidArgumentException Where the input lengths are bad.
 */
Escpos.prototype.wrapperSendGraphicsData = function (m, fn, data) {
  if (m.length != 1 || fn.length != 1) {
    throw new Error("wrapperSendGraphicsData: m and fn must be one character each.");
  }
  data = data || '';
  var header = intLowHigh(data.length + 2, 2);
  this.stream.write(CMDS.GS + "(L" + header + m + fn + data, 'binary');
};

/**
 * Wrapper for GS ( k, to calculate and send correct data length.
 *
 * @param {String} fn Function to use
 * @param {String} cn Output code type. Affects available data
 * @param {String} data Data to send.
 * @param {String} [m] Modifier/variant for function. Often '0' where used.
 * @throws InvalidArgumentException Where the input lengths are bad.
 */
Escpos.prototype.wrapperSend2dCodeData = function (fn, cn, data, m) {
  data = data || '';
  m = m || '';

  if (m.length > 1 || cn.length != 1 || fn.length != 1) {
    throw new Error("wrapperSend2dCodeData: cn and fn must be one character each.");
  }

  var header = intLowHigh(data.length + m.length + 2, 2);
  this.stream.write(CMDS.GS + '(k' + header + cn + fn + m + data, 'binary');
};


