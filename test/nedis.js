"use strict";
var should = require("should"),
    net = require("net"),
    nedis = require("../index.js");

describe("nedis", function() {

  var timeoutServer;

  before(function() {
    timeoutServer = net.createServer();
    timeoutServer.listen(9999, "localhost");
  });

  after(function() {
    timeoutServer.close();
  });

  beforeEach(function(done) {
    var socket = net.createConnection(6379);
    socket.on("connect", function() {
      socket.write("$1\r\n$8\r\nFLUSHALL\r\n");
      socket.end();
      done();
    });
  });

  it("Should run any redis command", function(done) {
    var client = nedis.createClient();
    client.on("connect", function() {
      client.do("set", "foo", "bar", function(err, data) {
        client.do("get", "foo", function(err, data) {
          data.should.equal("bar");
          done();
        });
      });
    });
  });

  it("Should emit an error if it can't connect", function(done) {
    var client = nedis.createClient(6900);
    client.on("error", function(err) {
      done();
    });
  });

  it("Should return an error when it tries to run a command and it's not connected", function(done) {
    var client = nedis.createClient(6379); 
    var opError = false;
    client.on("error", function(err) {
      opError.should.be.ok;
      done();
    });
    client.on("connect", function() {
      client.socket.end();
      client.do("set", "foo", "bar", function(err, data) {
        should.exist(err);
        opError = true;
      });
    });
  });
  
  it("Should reconnect after a specified time", function(done) {
    var client = nedis.createClient(6379, "localhost", {reconnectInterval: 50}); 
    client.once("connect", function() {
      var startTime = process.hrtime();
      client.socket.end();
      client.once("connect", function() {
        client.do("get", "foo", function(err, data) {
          should.not.exist(err);
          var diff = process.hrtime(startTime);
          (diff[1] / 1000000).should.be.above(49);
          done();
        });
      });
    });
  });
  
  it("Should reconnect using a timeout function", function(done) {
    var client = nedis.createClient(6379, "localhost", {reconnectInterval: function() { return 50; }}); 
    client.once("connect", function() {
      var startTime = process.hrtime();
      client.socket.end();
      client.once("connect", function() {
        client.do("get", "foo", function(err, data) {
          should.not.exist(err);
          var diff = process.hrtime(startTime);
          (diff[1] / 1000000).should.be.above(49);
          done();
        });
      });
    });
  });
  
  it("Should notify when it gets disconnected", function(done) {
    var client = nedis.createClient();
    client.once("connect", function() {
      client.do("quit", function(err, data) {
      });
    });
    client.once("close", function() {
      done();
    });
  });
  
  it("Should support running commands without passing a callback function", function(done) {
    var client = nedis.createClient();
    client.once("connect", function() {
      client.do("set", "foo", "bar");
      client.do("get", "foo", function(err, data) {
        data.should.equal("bar");
        done();
      });
    });
  });
  
  it("Should emit timeout when an operation exceeds a specific threshold", function(done) {
    var client = nedis.createClient(9999, "localhost", {commandTimeout: 50});
    client.once("connect", function() {
      var startTime = process.hrtime();
      client.do("get", "foo", function(err, data) {
        should.exist(err);
        var diff = process.hrtime(startTime);
        (diff[1] / 1000000).should.be.above(49);
        done();
      });
    });
  });
  
  it("Should be able so set socket properties");
  it("Should connect to the default host and port if not specified");
  it("Should connect to the default host and a specified port");
  it("Should notify when closing the connection");
  it("Should connect using a unix socket");
  it("Should return an error when running an unexistent command");
  //TODO: Probar datos numericos
});
