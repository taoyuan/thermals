'use strict';

var _ = require('lodash');
var validator = require('validator');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var streamBuffers = require("stream-buffers");
var path = require('path');
var utils = require('./utils');
var profile = require('./profile');
var barcodes = require('./barcodes');



function Printer(name, settings) {
  if (!(this instanceof Printer)) {
    return new Printer(name, settings);
  }

  // Check if the settings object is passed as the first argument
  if (typeof name === 'object' && settings === undefined) {
    settings = name;
    name = undefined;
  }

  // Check if the first argument is a URL
  if (typeof name === 'string' && name.indexOf('://') !== -1) {
    name = utils.parseSettings(name);
  }

  // Check if the settings is in the form of URL string
  if (typeof settings === 'string' && settings.indexOf('://') !== -1) {
    settings = utils.parseSettings(settings);
  }

  //
  if (name && typeof name === 'object') {
    settings = _.assign(name, settings);
    name = undefined;
  }

  // just save everything we get
  this.settings = settings = _.assign({
    connector: name || 'console',
    protocol: 'escpos'
  }, settings);

  this.profile = settings.profile = settings.profile || profile.default;
  this.stream = settings.stream = settings.stream || new streamBuffers.WritableStreamBuffer({
    initialSize: (512),
    incrementAmount: (512)
  });


  this.connector = utils.initiator({
    builtin: path.resolve(__dirname, './connectors/'),
    prefix: 'thermals-connector-'
  })(settings.connector, settings);

  this.adapter = utils.initiator({
    builtin: path.resolve(__dirname, './adapters/'),
    prefix: 'thermals-adapter-'
  })(settings.protocol, settings);

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
  validator.isInt(lines, {min: 1, max: 255});
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
  lines = lines || 1;
  validator.isInt(lines, {min: 1, max: 255});
  this.adapter.feedReverse(lines);
  return this;
};

/**
 * Print an image to the printer.
 *
 * Size modifiers are:
 * - default (leave image at original size)
 * - double-width
 * - double-height
 * - double
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
  size = size || 'default';
  this.adapter.graphics(img, size);
  return this;
};


/**
 * Generate a pulse, for opening a cash drawer if one is connected.
 * The default settings should open an Epson drawer.
 *
 * @param [pin] 0 or 1, for pin 2 or pin 5 kick-out adapter respectively.
 * @param [options]
 * @param [options.on] pulse ON time, in milliseconds.
 * @param [options.off] pulse OFF time, in milliseconds.
 */
Printer.prototype.pulse = function (pin, options) {
  pin = pin || 0;
  options = _.assign({
    on: 120,
    off: 240
  }, options);
  validator.isInt(pin, {min: 0, max: 1});
  validator.isInt(options.on, {min: 1, max: 511});
  validator.isInt(options.off, {min: 1, max: 511});

  this.adapter.pulse(pin, options);
  return this;
};

/**
 * Print a barcode.
 *
 * @param {String} data The information to encode.
 * @param {String} [type] The barcode standard to output. If not specified, `CODE39` will be used. Note that some barcode formats only support specific lengths or sets of characters.
 * @throws InvalidArgumentException Where the length or characters used in $content is invalid for the requested barcode format.
 */
Printer.prototype.barcode = function barcode(data, type) {
  var error;
  type = barcodes.get(type || 'CODE39');
  // Validate size
  if (!type.size(data.length)) {
    error = new Error('Data length does not match specification for this type of barcode');
    error.name = "invalid_data_size";
    throw error;
  }

  // validate that the chars to be printed are supported for this type of barcode
  for (var i = 0; i < data.length; i++) {
    var code = data.charCodeAt(i);
    if (!type.chars(code)) {
      error = new Error('Character ' + code + ' is not valid for this type of barcode');
      error.name = "invalid_character";
      error.char = code;
      throw error;
    }
  }

  this.adapter.barcode(data, type);
  return this;
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
 * Print the given data as a QR code on the printer.
 *
 * @param {string} content The content of the code. Numeric data will be more efficiently compacted.
 * @param {Object} [options]
 * @param {String} options.level Error-correction level to use. One of 'l' (default), 'm', 'q' or 'h'. Higher error correction results in a less compact code.
 * @param {Number} options.size Pixel size to use. Must be 1-16 (default 3)
 */
Printer.prototype.qr = function (content, options) {
  options = options || {};
  options = _.defaults(options, {
    level: 'l',
    size: 6
  });
  this.adapter.qr(content, options);
  return this;
};


Printer.prototype.code2d = function (content, options) {
  options = options || {};
  options = _.defaults(options, {
    level: 'l',
    size: 3,
    model: 2
  });
  this.adapter.code2d(content, options);
  return this;
};

/**
 * Switch character table (code page) manually. Used in conjunction with textRaw() to
 * print special characters which can't be encoded automatically.
 *
 * @param {String} table The table to select. Available code tables are model-specific.
 */
Printer.prototype.selectCharacterTable = function (table) {
  table = table || '';
  var supported = this.profile.supportedCodePages;
  if(supported.indexOf(table) < 0) {
    throw new Error("There is no code table $table allowed by this printer's capability profile.");
  }
  this.characterTable = table;
  //if(this.profile.supportsStarCommands) {
    /* Not an ESC/POS command: STAR printers stash all the extra code pages under a different command. */
    //$this -> connector -> write(self::ESC . self::GS . "t" . chr($table));
    //return;
  //}
  //$this -> connector -> write(self::ESC . "t" . chr($table));
  this.adapter.selectCharacterTable(supported.indexOf(table));
  return this;
};


/**
 * Select print mode(s).
 *
 * Several MODE_* constants can be OR'd together passed to this function's `$mode` argument. The valid modes are:
 *  - font-a
 *  - font-b
 *  - emphasized
 *  - double-height
 *  - double-width
 *  - underline
 *
 * @param {String} [mode] The mode to use. Default is MODE_FONT_A, with no special formatting. This has a similar effect to running initialize().
 */
Printer.prototype.selectPrintMode = function (mode) {
  mode = mode || 'font-a';
  // todo validate mode
  this.adapter.selectPrintMode(mode);
  return this;
};

/**
 * Set barcode height.
 *
 * @param {int} [height] Height in dots. If not specified, 8 will be used.
 */
Printer.prototype.setBarcodeHeight = function (height) {
  height = height || 8;
  validator.isInt(height, {min: 1, max: 255});
  this.adapter.setBarcodeHeight(height);
  return this;
};

/**
 * Set the position for the Human Readable Interpretation (HRI) of barcode characters.
 *
 * @param {String} [position]. Use 'none' to hide the text (default), or any combination of 'top', 'bottom' or 'both' flags to display the text.
 */
Printer.prototype.setBarcodeTextPosition = function (position) {
  position = position || 'none';
  // todo validate position
  this.adapter.setBarcodeTextPosition(position);
  return this;
};

/**
 * Turn double-strike mode on/off.
 *
 * @param {boolean} on true for double strike, false for no double strike
 */
Printer.prototype.setDoubleStrike = function (on) {
  on = on !== false;
  this.adapter.setDoubleStrike(on);
  return this;
};

/**
 * Turn emphasized mode on/off.
 *
 *  @param {boolean} on true for emphasis, false for no emphasis
 */
Printer.prototype.setEmphasis = function (on) {
  on = on !== false;
  this.adapter.setEmphasis(on);
  return this;
};

/**
 * Select font. Most printers have two fonts (Fonts A and B), and some have a third (Font C).
 *
 * @param {String} [font] The font to use. Must be either font-a, font-b, or font-c.
 */
Printer.prototype.setFont = function (font) {
  font = font || 'font-a'
  this.adapter.setFont(font);
  return this;
};

/**
 * Select alignment.
 *
 * @param {String} [alignment] One of 'left', 'center', or 'right'.
 */
Printer.prototype.setAlign = function (alignment) {
  alignment = alignment || 'left';
  this.adapter.setAlign(alignment);
  return this;
};


/**
 * Set black/white reverse mode on or off. In this mode, text is printed white on a black background.
 *
 * @param {boolean} on True to enable, false to disable.
 */
Printer.prototype.setReverseColors = function (on) {
  on = on !== false;
  this.adapter.setReverseColors(on);
  return this;
};


/**
 * Set the size of text, as a multiple of the normal size.
 *
 * @param {int} widthMultiplier Multiple of the regular height to use (range 1 - 8)
 * @param {int} heightMultiplier Multiple of the regular height to use (range 1 - 8)
 */
Printer.prototype.setTextSize = function (widthMultiplier, heightMultiplier) {
  validator.isInt(widthMultiplier, {min: 1, max: 8});
  validator.isInt(heightMultiplier, {min: 1, max: 8});
  this.adapter.setTextSize(widthMultiplier, heightMultiplier);
  return this;
};

/**
 * Set underline for printed text.
 *
 * Argument can be true/false, or one of UNDERLINE_NONE,
 * UNDERLINE_SINGLE or UNDERLINE_DOUBLE.
 *
 * @param {String|Boolean} [underline] Either true/false, or one of 'none', 'single' or 'double'. Defaults to 'single'.
 */
Printer.prototype.setUnderline = function (underline) {
  if (underline === false) {
    underline = 'none';
  } if (typeof underline !== 'string') {
    underline = 'single';
  }

  this.adapter.setUnderline(underline);
  return this;
};

/**
 * Add text to the buffer.
 *
 * Text should either be followed by a line-break, or feed() should be called
 * after this to clear the print buffer.
 *
 * @param {Object|String} str Text to print
 */
Printer.prototype.text =
Printer.prototype.write = function (str) {
  this.adapter.write(str.toString());
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

exports = module.exports = Printer;

exports.Printer = Printer;
exports.Image = exports.image = require('./image');