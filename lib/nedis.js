"use strict";
var events = require("events"),
    sys = require("sys"),
    net = require("net"),
    hiredis = require("hiredis");

function Nedis() {
  this.reader = new hiredis.Reader();
  var self = this;
  this.execQueue = [];
  events.EventEmitter.call(this);
  this.socket = net.createConnection(6379);
  this.socket.on("connect", function() {
    self.emit("ready");
  });
  this.socket.on("data", function(data) {
    var reply;
    self.reader.feed(data);
    while((reply = self.reader.get()) !== undefined) {
      var callback = self.execQueue.shift();
      if (callback) {
        callback(undefined, reply);
      }
    }
  });
}

sys.inherits(Nedis, events.EventEmitter);

Nedis.prototype.do = function() {
  var argsNum = arguments.length - 1;
  var callback = arguments[argsNum];
  this.execQueue.push(callback);
  var strCommands = "*" + argsNum + "\r\n";
  for (var i = 0; i < argsNum ; i++) {
    var arg = arguments[i];
    strCommands += "$" + Buffer.byteLength(arg) + "\r\n" + arg + "\r\n";
  }
  this.socket.write(strCommands);
}

module.exports.createClient = function() {
  return new Nedis();
}
