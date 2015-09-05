'use strict';

var util = require('util');

exports.nop = exports.noop = nop;

function nop() {
  // no-op
}

exports.createPromiseCallback = createPromiseCallback;

function createPromiseCallback() {
  var Promise = global.Promise || require('bluebird');
  var cb = nop;
  var promise = new Promise(function (resolve, reject) {
    cb = function (err, data) {
      if (err) return reject(err);
      return resolve(data);
    };
  });
  cb.promise = promise;
  return cb;
}

exports.chr = chr;

function chr(n) {
  return String.fromCharCode(n);
}

var url = require('url');
var qs = require('qs');

exports.parseSettings = parseSettings;
/**
 * Parse a URL into a settings object
 * @param {String} urlStr The URL for connector settings
 * @returns {Object} The settings object
 */
function parseSettings(urlStr) {
  if (!urlStr) {
    return {};
  }
  var uri = url.parse(urlStr, false);
  var settings = {};
  var protocols = uri.protocol && uri.protocol.split(':')[0]; // Remove the trailing :
  if (protocols) {
    protocols = protocols.split('+');
    settings.protocol = protocols.length > 1 ? protocols[0] : 'escpos';
    settings.connector = protocols.length > 1 ? protocols[1] : protocols[0];
  }
  settings.host = settings.hostname = uri.hostname;
  settings.port = uri.port && Number(uri.port); // port is a string
  settings.user = settings.username = uri.auth && uri.auth.split(':')[0]; // <username>:<password>
  settings.password = uri.auth && uri.auth.split(':')[1];
  settings.path = uri.pathname;
  settings.url = urlStr;
  if (uri.query) {
    var params = qs.parse(uri.query);
    for (var p in params) {
      settings[p] = params[p];
    }
  }
  return settings;
}

// List possible adapter module names
function possibleModuleNames(name, where) {
  if (typeof where === 'string') {
    where = {builtin: where};
  }
  where = where || {};

  var names = []; // Check the name as is
  if (!name.match(/^\//)) {
    if (where.builtin) {
      names.push(where.builtin + '/' + name); // Check built-in modules
    }
    if (where.prefix) {
      if (name.indexOf(where.prefix /*'thermals-adapter-'*/) !== 0) {
        names.push(where.prefix /*'thermals-adapter-'*/ + name); // Try <modulePrefix><name>
      }
    }
  }
  // Only try the short name if the adapter is not from Thermals
  //if (['escpos', 'star']
  //    .indexOf(name) === -1) {
  //  names.push(name);
  //}
  return names;
}

// testable with DI
function tryModules(names, loader) {
  var mod;
  loader = loader || require;
  for (var m = 0; m < names.length; m++) {
    try {
      mod = loader(names[m]);
    } catch (e) {
      /* ignore MODULE_NOT_FOUND error*/
      if (e.code !== 'MODULE_NOT_FOUND') throw e
    }
    if (mod) {
      break;
    }
  }
  return mod;
}

exports.resolveModule = resolveModule;

function resolveModule(name, where, loader) {
  var names = possibleModuleNames(name, where);
  var mod = tryModules(names, loader);
  var error = null;
  if (!mod) {
    error = util.format('\nWARNING: Thermals module "%s" is not installed ' +
      'as any of the following modules:\n\n %s\n\nTo fix, run:\n\n    npm install %s\n',
      name, names.join('\n'), names[names.length - 1]);
  }
  return {
    mod: mod,
    error: error
  };
}

exports.initiator = initiator;

function initiator(options) {
  options = options || {};

  return function initiate(name, settings) {
    var mod;

    // support single settings object
    if (name && typeof name === 'object' && !settings) {
      settings = name;
      name = undefined;
    }

    if (typeof settings === 'object') {
      if (settings.initialize) {
        mod = settings;
      }
    }

    // just save everything we get
    settings = settings || {};

    //debug('Settings: %j', settings);

    if (typeof mod === 'string') {
      name = mod;
      mod = undefined;
    }
    name = name || (mod && mod.name);

    if (name && !mod) {
      if (typeof name === 'object') {
        // The first argument might be the adapter itself
        mod = name;
      } else {
        // The adapter has not been resolved
        var result = resolveModule(name, options);
        mod = result.mod;
        if (!mod) {
          console.error(result.error);
          return;
        }
      }
    }

    if (mod) {
      if ('function' === typeof mod.initialize) {
        // Call the async initialize method
        return mod.initialize(settings);
      } else if ('function' === typeof mod) {
        // Use the adapter constructor directly
        return new mod(settings);
      }
    }
    return null;
  }
}