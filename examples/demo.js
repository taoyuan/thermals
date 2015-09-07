'use strict';

var Printer = require('../');

//var printer = new Printer('file:///dev/usb/lp0');
var printer = new Printer();

/* Initialize */
//printer.initialize();

/* Text */
function demo_simple() {
  printer.text("Hello world\n");
  //printer.feed(8);
//printer.cut();
}


///* Line feeds */
function demo_line_feeds() {
  printer.text("ABC");
  printer.feed(7);
  printer.text("DEF");
//printer.feedReverse(3); // SP-POS88V not support
  printer.text("GHI");
  printer.feed();
  //printer.feed(8);
//printer.cut();
}


///* Font modes */
function demo_font_modes() {
  var modes = [
    'FONT-B',
    'EMPHASIZED',
    'DOUBLE-HEIGHT',
    'DOUBLE-WIDTH',
    'UNDERLINE'
  ];
  for (var i = 0; i < modes.length; i++) {
    //var bits = str_pad(decbin($i), modes.length, "0", STR_PAD_LEFT);
    //var mode = 0;
    //for (var j = 0; j < bits.length; j++) {
    //  if (bits[j] == "1") {
    //    mode |= modes[j];
    //  }
    //}
    var mode = modes[i];
    printer.selectPrintMode(mode);
    printer.text(mode + ':');
    printer.text("ABCDEFGHIJabcdefghijk\n");
  }
  printer.selectPrintMode(); // Reset
//printer.cut();
}
/* Underline */
function demo_underline() {
  var underlines = [
    'none', 'single', 'double'
  ];
  underlines.forEach(function (u) {
    printer.setUnderline(u);
    printer.text("The quick brown fox jumps over the lazy dog\n");
  });

  underlines.forEach(function (u) {
    printer.setUnderline(u);
    printer.text("中文：青天有月来几时？我今停杯一问之。\n");
  });

  printer.setUnderline(false); // Reset
  printer.feed(8);
  printer.cut();
}

///* Cuts */
function demo_cut() {
  printer.text("Partial cut\n(not available on all printers)\n");
  printer.feed(8);
  printer.cut('partial');
  printer.text("Full cut\n");
  printer.feed(8);
  printer.cut('full');
}

///* Emphasis */
function demo_emphasis() {
  [true, false].forEach(function (on) {
    printer.setEmphasis(on);
    printer.text("The quick brown fox jumps over the lazy dog\n");
  });

  printer.setEmphasis(false); // Reset
  //printer.feed(8);
  //printer.cut();
}

///* Double-strike (looks basically the same as emphasis) */
function demo_double_strike() {
  [true, false].forEach(function (on) {
    printer.setDoubleStrike(on);
    printer.text("The quick brown fox jumps over the lazy dog\n");
  });
  printer.setDoubleStrike(false);
  //printer.feed(8);
  //printer.cut();
}

///* Fonts (many printers do not have a 'Font C') */
function demo_fonts() {
  ['font-a', 'font-b', 'font-c'].forEach(function (font) {
    printer.setFont(font);
    printer.text("The quick brown fox jumps over the lazy dog\n");
  });
  printer.setFont(); // Reset
  //printer.feed(8);
  //printer.cut();
}

///* Alignment */
function demo_align() {
  ['left', 'center', 'right'].forEach(function (alignment) {
    printer.setAlign(alignment);
    printer.text("A man a plan a canal panama\n");
  });
  printer.setAlign(); // Reset

  //printer.feed(8);
  //printer.cut();

}

///* Barcodes - see barcode.php for more detail */
function demo_barcodes() {
  printer.setBarcodeHeight(80);
  printer.setBarcodeTextPosition('bottom');
  printer.barcode("9876");
  printer.feed(8);
  printer.cut();
}

///* Graphics - this demo will not work on some non-Epson printers */
function demo_graphics() {
  return Printer.image("./resources/sample.png").then(function (img) {
    ['default'/*, 'double-width', 'double-height', 'double'*/].forEach(function (size) {
      printer.graphics(img, size);
    });
    //printer.feed(8);
    //printer.cut();
  }).catch(function (err) {
    console.error(err.stack);
  });
}

//
///* Bit image */
function demo_bitimage() {

  return Printer.image("./resources/sample.png").then(function (img) {
    printer.bitImage(img);
    //printer.feed(8);
    //printer.cut();
  }).catch(function (err) {
    console.error(err.stack);
  });

}
///* QR Code - see also the more in-depth demo at qr-code.php */
function demo_qr() {
  var str = "Testing 123";
  printer.qr(str);
  //printer.feed(8);
  //printer.cut();
}


function print() {
  return printer.print();
}

//demo_font_modes();
//demo_underline();
//demo_cut();
//demo_emphasis();
//demo_double_strike();
//demo_fonts();
//demo_align();
//demo_barcodes();
//demo_qr();

/* Pulse */
//printer.pulse();

//demo_graphics()
//  .then(print);

demo_bitimage()
  .then(print);

//print();

