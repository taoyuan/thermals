'use strict';

var BARCODE_CHARSETS = {
  NUMS: function (n) {
    return n >= 48 && n <= 57;
  },
  ASCII: function (n) {
    return n >= 0 && n <= 127;
  }
};

// These are all valid barcode types.
// Pass this object to printer.barcode() as type:
// printer.barcode(BARCODE_TYPES.UPCA, 'data');
var BARCODE_TYPES = {
  UPCA: {
    code: 65,
    size: function (n) {
      return n === 11 || n === 12;
    },
    chars: BARCODE_CHARSETS.NUMS
  },
  UPCE: {
    code: 66,
    size: function (n) {
      return n === 11 || n === 12;
    },
    chars: BARCODE_CHARSETS.NUMS
  },
  EAN13: {
    code: 67,
    size: function (n) {
      return n === 12 || n === 13;
    },
    chars: BARCODE_CHARSETS.NUMS
  },
  EAN8: {
    code: 68,
    size: function (n) {
      return n === 7 || n === 8;
    },
    chars: BARCODE_CHARSETS.NUMS
  },
  CODE39: {
    code: 69,
    size: function (n) {
      return n > 1;
    },
    chars: function (n) {
      // " $%+-./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
      return (
        n === 32 ||
        n === 36 ||
        n === 37 ||
        n === 43 ||
        (n >= 45 && n <= 57) ||
        (n >= 65 && n <= 90)
      );
    }
  },
  I25: {
    code: 70,
    size: function (n) {
      return n > 1 && n % 2 === 0;
    },
    chars: BARCODE_CHARSETS.NUMS
  },
  CODEBAR: {
    code: 71,
    size: function (n) {
      return n > 1;
    },
    chars: function (n) {
      // "$+-./0123456789:ABCD"
      return (
        n === 36 ||
        n === 43 ||
        (n >= 45 && n <= 58) ||
        (n >= 65 && n <= 68)
      );
    }
  },
  CODE93: {
    code: 72,
    size: function (n) {
      return n > 1;
    },
    chars: BARCODE_CHARSETS.ASCII
  },
  CODE128: {
    code: 73,
    size: function (n) {
      return n > 1;
    },
    chars: BARCODE_CHARSETS.ASCII
  },
  CODE11: {
    code: 74,
    size: function (n) {
      return n > 1;
    },
    chars: BARCODE_CHARSETS.NUMS
  },
  MSI: {
    code: 75,
    size: function (n) {
      return n > 1;
    },
    chars: BARCODE_CHARSETS.NUMS
  }
};

exports.BARCODE_TYPES = BARCODE_TYPES;

exports.get = function (type) {
  type = type || 'CODE39';
  type = type.toUpperCase();
  return BARCODE_TYPES[type];
};