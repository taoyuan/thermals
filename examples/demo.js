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
  return Printer.image("./resources/thermals.png").then(function (img) {
    ['default', 'double-width', 'double-height', 'double'].forEach(function (size) {
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
//try {
//  $logo = new EscposImage("resources/escpos-php.png");
//  $imgModes = array(
//    Escpos::IMG_DEFAULT,
//    Escpos::IMG_DOUBLE_WIDTH,
//    Escpos::IMG_DOUBLE_HEIGHT,
//    Escpos::IMG_DOUBLE_WIDTH | Escpos::IMG_DOUBLE_HEIGHT
//);
//  foreach($imgModes as $mode) {
//    printer.bitImage($logo, $mode);
//  }
//} catch(Exception $e) {
//  /* Images not supported on your PHP, or image file not found */
//  printer.text($e -> getMessage() . "\n");
//}
//printer.cut();
//
///* QR Code - see also the more in-depth demo at qr-code.php */
//$testStr = "Testing 123";
//$models = array(
//  Escpos::QR_MODEL_1 => "QR Model 1",
//  Escpos::QR_MODEL_2 => "QR Model 2 (default)",
//  Escpos::QR_MICRO => "Micro QR code\n(not supported on all printers)");
//foreach($models as $model => $name) {
//  printer.qrCode($testStr, Escpos::QR_ECLEVEL_L, 3, $model);
//  printer.text("$name\n");
//  printer.feed();
//}
//printer.cut();

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

/* Pulse */
//printer.pulse();

demo_graphics()
  .then(print);

