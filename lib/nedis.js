"use strict";
var events = require("events"),
    sys = require("sys"),
    net = require("net"),
    hiredis = require("hiredis");

function scheduleReconnect() {
  var self = this;
  if (this.shouldReconnect && !this.reconnectScheduled){
    this.reconnectSheduled = true;
    setTimeout(function() {
      self.createConnection();
      self.reconnectSheduled = false;
    }, self.getReconnectTime()); 
    return true;
  }
}

function Nedis(port, host, options) {
  this.reader = new hiredis.Reader();
  var self = this;
  this.host = host;
  this.port = port;
  this.options = options;
  this.shouldReconnect = !!this.options.reconnectInterval;
  this.reconnectScheduled = false;
  this.execQueue = [];
  this.getReconnectTime = typeof(this.options.reconnectInterval) === "function"? this.options.reconnectInterval : function() { return self.options.reconnectInterval; };
  events.EventEmitter.call(this);
  this.createConnection();
}

sys.inherits(Nedis, events.EventEmitter);

Nedis.prototype.createConnection = function() {
  var self = this;
  this.socket = net.createConnection(this.port, this.host);
  this.socket.on("connect", function() {
    self.emit("connect");
  });

  this.socket.on("error", function(err) {
    self.execQueue.forEach(function(callback) {
      callback(err);
    });
    self.emit("error", err);
    scheduleReconnect.call(self);
  });

  this.socket.on("close", function() {
    if (!scheduleReconnect.call(self)) {
      self.emit("close");
    }
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

Nedis.prototype.do = function() {
  if (arguments[0].toUpperCase() == "QUIT") {
    this.shouldReconnect = false;
  }
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

module.exports.createClient = function(port, host, options) {
  return new Nedis(port || 6379, host || "localhost", options || {});
}
