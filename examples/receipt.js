'use strict';

var pad = require('pad');
var Printer = require('../');

//var printer = new Printer('file:///dev/usb/lp0');
var printer = new Printer();

/* Information for the receipt */
var items = [
  new Item("Example item #1", "4.00"),
  new Item("Another thing", "3.50"),
  new Item("Something else", "1.00"),
  new Item("A final item", "4.45")
];
var subtotal = new Item('Subtotal', '12.95');
var tax = new Item('A local tax', '1.30');
var total = new Item('Total', '14.25', true);
/* Date is kept the same for testing */
// $date = date('l jS \of F Y h:i:s A');
var date = "Monday 6th of April 2015 02:56:25 PM";

/* Start the printer */
//$logo = new EscposImage("resources/escpos-php.png");

/* Print top logo */
printer.setAlign('center');
//printer.graphics($logo);

/* Name of shop */
printer.selectPrintMode('double-width');
printer.text("ExampleMart Ltd.\n");
printer.selectPrintMode();
printer.text("Shop No. 42.\n");
printer.feed();

/* Title of receipt */
printer.setEmphasis(true);
printer.text("SALES INVOICE\n");
printer.setEmphasis(false);

/* Items */
printer.setAlign('left');
printer.setEmphasis(true);
printer.text(new Item('', '$'));
printer.setEmphasis(false);
items.forEach(function (item) {
  printer.text(item);
});
printer.setEmphasis(true);
printer.text(subtotal);
printer.setEmphasis(false);
printer.feed();

/* Tax and total */
printer.text(tax);
printer.selectPrintMode('double-width');
printer.text(total);
printer.selectPrintMode();

/* Footer */
printer.feed(2);
printer.setAlign('left');
printer.text("Thank you for shopping at ExampleMart\n");
printer.text("For trading hours, please visit example.com\n");
printer.feed(2);
printer.text(date + "\n");

printer.feed(6);
/* Cut the receipt and open the cash drawer */
printer.cut();
printer.pulse();

printer.print();

function Item(name, price, sign) {
  this.name = name;
  this.price = price;
  this.sign = sign;

  this.toString = function () {
    var rightCols = 10;
    var leftCols = 38;
    if (this.sign) {
      leftCols = leftCols / 2 - rightCols / 2;
    }
    var left = pad(this.name, leftCols);

    var sign = (this.sign ? '$ ' : '');
    var right = pad(rightCols, sign + this.price);
    return left + right + "\n";
  };
}