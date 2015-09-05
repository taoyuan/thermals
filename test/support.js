'use strict';

exports.print = function (array, num) {
  num = num || 8;
  var s = '';
  for (var i = 0; i < array.length; i++) {
    if (i > 0 && i % (num - 1) === 0) s+= '\n';
    //s += array[i].toString(16);
  }
  console.log(s);
};