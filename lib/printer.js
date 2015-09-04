'use strict';

var _ = require('lodash');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var streamBuffers = require("stream-buffers");
var utils = require('./utils');

module.exports = Printer;

function Printer(name, connector, settings) {
  if (!(this instanceof Printer)) {
    return new Printer(name, connector, settings);
  }

  var stream = this.stream = new streamBuffers.WritableStreamBuffer({
    initialSize: (1024),      // start as 100 kilobytes.
    incrementAmount: (1024)    // grow by 10 kilobytes each time buffer overflows.
  });

  this.connector = utils.initiator({ builtin: './connectors/', prefix: 'thermals-connector-'})(connector, settings);
  this.adapter = utils.initiator({ builtin: './adapters/', prefix: 'thermals-adapter-'})(name, {
    stream: stream
  });

}

util.inherits(Printer, EventEmitter);

/**
 * Log benchmarked message. Do not redefine this method, if you need to grab
 * chema logs, use `dataSource.on('log', ...)` emitter event
 *
 * @private used by connectors
 */
Printer.prototype.log = function (cmd, t) {
  debug(cmd, t);
  this.emit('log', cmd, t);
};

//Printer.prototype.opened = function () {
//  return this.connector && this.connector.isOpen()
//};
//
//Printer.prototype.open = function (cb) {
//  cb = cb || utils.createPromiseCallback();
//
//  if (!this.connector) {
//    cb(new Error('No connector'));
//  } else if (this.connector.isOpen()) {
//    cb();
//  } else {
//    this.connector.open(cb);
//  }
//
//  return cb.promise;
//};
//
//Printer.prototype.close = function (cb) {
//  cb = cb || utils.createPromiseCallback();
//
//  if (!this.connector) {
//    cb(new Error('No connector'));
//  } else if (!this.connector.isOpen()) {
//    cb();
//  } else {
//    this.connector.close(cb);
//  }
//
//  return cb.promise;
//};

/**
 * Cut the paper.
 *
 * @param {String|Number} [mode] Cut mode, either 'full' or 'partial' If not specified, 'full' will be used.
 * @param {Number} [lines] Number of lines to feed, 3 is default.
 */
Printer.prototype.cut = function (mode, lines) {
  if (typeof mode === 'number') {
    lines = mode;
    mode = undefined;
  }
  mode = mode || 'full';
  lines = lines || 3;

  this.adapter.cut(mode, lines);
  return this;
};

/**
 * Print and feed line / Print and feed n lines.
 *
 * @param lines Number of lines to feed
 */
Printer.prototype.feed = function (lines) {
  lines = lines || 1;
  this.adapter.feed(lines);
  return this;
};

/**
 * Some printers require a form feed to release the paper. On most printers, this
 * command is only useful in page mode, which is not implemented in this driver.
 */
Printer.prototype.feedForm = function () {
  this.adapter.feedForm();
  return this;
};

/**
 * Print and reverse feed n lines.
 *
 * @param lines number of lines to feed. If not specified, 1 line will be fed.
 */
Printer.prototype.feedReverse = function (lines) {
  throw new Error('Not Implemented');
};

/**
 * Print an image, using the older "bit image" command. This creates padding on the right of the image,
 * if its width is not divisible by 8.
 *
 * Should only be used if your printer does not support the graphics() command.
 *
 * @param img The image to print
 * @param size Size modifier for the image.
 */
Printer.prototype.bitImage = function (img, size) {
  throw new Error('Not Implemented');
};

/**
 * Print an image to the printer.
 *
 * Size modifiers are:
 * - IMG_DEFAULT (leave image at original size)
 * - IMG_DOUBLE_WIDTH
 * - IMG_DOUBLE_HEIGHT
 *
 * See the example/ folder for detailed examples.
 *
 * The function bitImage() takes the same parameters, and can be used if
 * your printer doesn't support the newer graphics commands.
 *
 * @param img The image to print.
 * @param size Output size modifier for the image.
 */
Printer.prototype.graphics = function (img, size) {
  throw new Error('Not Implemented');
};


/**
 * Generate a pulse, for opening a cash drawer if one is connected.
 * The default settings should open an Epson drawer.
 *
 * @param pin 0 or 1, for pin 2 or pin 5 kick-out adapter respectively.
 * @param on_ms pulse ON time, in milliseconds.
 * @param off_ms pulse OFF time, in milliseconds.
 */
Printer.prototype.pulse = function (pin, on_ms, off_ms) {
  throw new Error('Not Implemented');
};

/**
 * Print the given data as a QR code on the printer.
 *
 * @param {string} content The content of the code. Numeric data will be more efficiently compacted.
 * @param {Object} [options]
 * @param {String} options.level Error-correction level to use. One of 'l' (default), 'm', 'q' or 'h'. Higher error correction results in a less compact code.
 * @param {Number} options.size Pixel size to use. Must be 1-16 (default 3)
 * @param {String|Number} options.model QR code model to use. Must be one of '1', '2' (default) or 'micro' (not supported by all printers).
 */
Printer.prototype.qrCode = function (content, options) {
  options = options || {};
  options = _.defaults(options, {
    level: 'l',
    size: 3,
    model: 2
  });
  this.adapter.qrCode(content, options);
  return this;
};

/**
 * Switch character table (code page) manually. Used in conjunction with textRaw() to
 * print special characters which can't be encoded automatically.
 *
 * @param {int} table The table to select. Available code tables are model-specific.
 */
Printer.prototype.selectCharacterTable = function (table) {
  throw new Error('Not Implemented');
};

/**
 * Select print mode(s).
 *
 * Several MODE_* constants can be OR'd together passed to this function's `$mode` argument. The valid modes are:
 *  - MODE_FONT_A
 *  - MODE_FONT_B
 *  - MODE_EMPHASIZED
 *  - MODE_DOUBLE_HEIGHT
 *  - MODE_DOUBLE_WIDTH
 *  - MODE_UNDERLINE
 *
 * @param {int} mode The mode to use. Default is MODE_FONT_A, with no special formatting. This has a similar effect to running initialize().
 */
Printer.prototype.selectPrintMode = function (mode) {
  throw new Error('Not Implemented');
};

/**
 * Set barcode height.
 *
 * @param {int} height Height in dots. If not specified, 8 will be used.
 */
Printer.prototype.setBarcodeHeight = function (height) {
  throw new Error('Not Implemented');
};

/**
 * Set the position for the Human Readable Interpretation (HRI) of barcode characters.
 *
 * @param position. Use BARCODE_TEXT_NONE to hide the text (default), or any combination of BARCODE_TEXT_TOP and BARCODE_TEXT_BOTTOM flags to display the text.
 */
Printer.prototype.setBarcodeTextPosition = function (position) {
  throw new Error('Not Implemented');
};

/**
 * Turn double-strike mode on/off.
 *
 * @param {boolean} on true for double strike, false for no double strike
 */
Printer.prototype.setDoubleStrike = function (on) {
  throw new Error('Not Implemented');
};

/**
 * Turn emphasized mode on/off.
 *
 *  @param {boolean} on true for emphasis, false for no emphasis
 */
Printer.prototype.setEmphasis = function (on) {

};

/**
 * Select font. Most printers have two fonts (Fonts A and B), and some have a third (Font C).
 *
 * @param {int} font The font to use. Must be either FONT_A, FONT_B, or FONT_C.
 */
Printer.prototype.setFont = function (font) {

};

/**
 * Select justification.
 *
 * @param {int} justification One of JUSTIFY_LEFT, JUSTIFY_CENTER, or JUSTIFY_RIGHT.
 */
Printer.prototype.setJustification = function (justification) {

};


/**
 * Set black/white reverse mode on or off. In this mode, text is printed white on a black background.
 *
 * @param {boolean} on True to enable, false to disable.
 */
Printer.prototype.setReverseColors = function (on) {

};


/**
 * Set the size of text, as a multiple of the normal size.
 *
 * @param {int} widthMultiplier Multiple of the regular height to use (range 1 - 8)
 * @param {int} heightMultiplier Multiple of the regular height to use (range 1 - 8)
 */
Printer.prototype.setTextSize = function (widthMultiplier, heightMultiplier) {

};

/**
 * Set underline for printed text.
 *
 * Argument can be true/false, or one of UNDERLINE_NONE,
 * UNDERLINE_SINGLE or UNDERLINE_DOUBLE.
 *
 * @param {int} underline Either true/false, or one of UNDERLINE_NONE, UNDERLINE_SINGLE or UNDERLINE_DOUBLE. Defaults to UNDERLINE_SINGLE.
 */
Printer.prototype.setUnderline = function (underline) {

};

/**
 * Add text to the buffer.
 *
 * Text should either be followed by a line-break, or feed() should be called
 * after this to clear the print buffer.
 *
 * @param {string} str Text to print
 */
Printer.prototype.write = function (str) {
  this.adapter.write(str);
  return this;
};

/**
 *
 * @param {Function} [cb]
 * @returns {*}
 */
Printer.prototype.print = function (cb) {
  cb = cb || utils.createPromiseCallback();

  this.connector.write(this.stream.getContents(), function (err) {
    if (err) {
      console.error(err);
    } else {
      console.log('Print done');
    }
    cb(err);
  });

  return cb.promise;
};

