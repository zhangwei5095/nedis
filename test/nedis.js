"use strict";
var should = require("should"),
    nedis = require("../index.js");

describe("nedis", function() {
  it("Should run any redis command", function(done) {
    var client = nedis.createClient();
    client.on("ready", function() {
      client.do("set", "foo", "bar", function(err, data) {
        client.do("get", "foo", function(err, data) {
          data.should.equal("bar");
          done();
        });
      });
    });
  });
  
  it("Should emit an error if it can't connect");
  it("Should emit an error when it tries to run a command and there is a connection error");
  it("Should reconnect after a specified time");
  it("Should reconnect using a timeout function");
  it("Should notify when it is connected");
  it("Should notify when it gets disconnected");
  it("Should emit timeout when an operation exceeds a specific threshold");
  it("Should be able so set socket properties");
  it("Should connect to the default host and port if not specified");
  it("Should connect to the default host and a specified port");
  it("Should notify when closing the connection");
  it("Should connect using a unix socket");
  it("Should support running commands without passing a callback function");
  it("Should return an error when running an unexistent command");
});