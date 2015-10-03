/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 *
 */

if (typeof require !== 'undefined')
	var chai = require("chai"),
		c3po = require("../index.js");

var expect = chai.expect;

describe("base", function() {
	describe("get string with no protocol", function() {
		var res;
		before(function(done) {
			c3po.get("hello world")
				.then(function(s) {
					res = s;
					done();
				});
		});
		it("should", function() {
			expect(res).to.equal("hello world");
		});
	});
	describe("get object so no protocol", function() {
		var res;
		before(function(done) {
			c3po.get({
					test: true
				})
				.then(function(s) {
					res = s;
					done();
				});
		});
		it("should", function() {
			expect(res).to.deep.equal({
				test: true
			});
		});
	});
	describe("dummy immediate response", function() {
		var res;
		before(function(done) {
			c3po.get("dummy::hello world")
				.then(function(s) {
					res = s;
					done();
				});
		});
		it("should", function() {
			expect(res).to.deep.equal({
				dummy: "hello world"
			});
		});
	});
	describe("define a protocol", function() {

		var res;
		before(function(done) {
			c3po.protocols.foo = {
				get: function(request, options) {
					return "bar - " + request;
				}
			};
			c3po.get("foo::hello world")
				.then(function(s) {
					res = s;
					done();
				});
		});
		it("should", function() {
			expect(res).to.equal("bar - hello world");
		});
	});
	describe("define a method", function() {

		var res;
		before(function(done) {
			c3po.protocols.foo = {
				zoo: function(request, options) {
					return "zoo - " + request;
				}
			};
			c3po.get("foo.zoo::hello world")
				.then(function(s) {
					res = s;
					done();
				});
		});
		it("should", function() {
			expect(res).to.equal("zoo - hello world");
		});
	});
	describe("define a method with args", function() {

		var res;
		before(function(done) {
			c3po.protocols.foo = {
				zoo: function(arg1, arg2, request, options) {
					return "zoo - " + arg1 + " - " + arg2 + " " + request;
				}
			};
			c3po.get("foo.zoo(1, hello)::world")
				.then(function(s) {
					res = s;
					done();
				});
		});
		it("should", function() {
			expect(res).to.equal("zoo - 1 - hello world");
		});
	});
	describe("use interpolation", function() {
		c3po.interpolator = {
			isInterpolable: function(string) {
				return true;
			},
			interpolate: function(string, context) {
				return (string === "hello { lib }") ? ("hello " + context.lib) : "something is wrong";
			}
		}
		var res;
		before(function(done) {
			c3po.get("dummy::hello { lib }", null, {
				lib: "c3po"
			}).then(function(s) {
				res = s;
				done();
			});
		});
		it("should", function() {
			expect(res).to.deep.equal({
				dummy: "hello c3po"
			});
		});
	});
	describe("getAll", function() {

		var res;
		before(function(done) {
			c3po.protocols.foo = {
				get: function(request, options) {
					return "zoo - " + request;
				}
			};
			c3po.getAll(["foo::hello world", "dummy::falabala"])
				.then(function(s) {
					res = s;
					done();
				});
		});
		it("should", function() {
			expect(res).to.deep.equal(["zoo - hello world", {
				dummy: "falabala"
			}]);
		});
	});
	describe("sync init", function() {

		var res;
		before(function(done) {
			c3po.protocols.foo = {
				get: function(request, options) {
					return this.title + " - " + request;
				},
				init: function() {
					this.title = "bloupi";
				}
			};
			c3po.get("foo::hello world")
				.then(function(s) {
					res = s;
					done();
				});
		});
		it("should", function() {
			expect(res).to.equal("bloupi - hello world");
		});
	});
	describe("async init", function() {

		var res;
		before(function(done) {
			c3po.protocols.foo = {
				get: function(request, options) {
					return this.title + " - " + request;
				},
				init: function() {
					var self = this;
					return Promise.resolve("lolipop")
						.then(function(s) {
							self.title = "foobar";
							return s;
						});
				}
			};
			c3po.get("foo::hello world")
				.then(function(s) {
					res = s;
					done();
				});
		});
		it("should", function() {
			expect(res).to.equal("foobar - hello world");
		});
	});
});
