/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 *
 */

if (typeof require !== 'undefined')
	var chai = require("chai"),
		c3po = require("../index.js");

var expect = chai.expect;

describe("base", function() {

	describe("dummy immediate response", function() {
		var res = c3po.get("dummy::hello world");
		it("should", function() {
			expect(res).to.deep.equal({
				dummy: "hello world"
			});
		});
	});
	describe("define a potocol", function() {
		c3po.protocols.foo = {
			get: function(request, options) {
				return "bar - " + request;
			}
		};
		var res = c3po.get("foo::hello world");
		it("should", function() {
			expect(res).to.equal("bar - hello world");
		});
	});
	describe("define a method", function() {
		c3po.protocols.foo = {
			zoo: function(request, options) {
				return "zoo - " + request;
			}
		};
		var res = c3po.get("foo.zoo::hello world");
		it("should", function() {
			expect(res).to.equal("zoo - hello world");
		});
	});
	describe("define a method with args", function() {
		c3po.protocols.foo = {
			zoo: function(arg1, arg2, request, options) {
				return "zoo - " + arg1 + " - " + arg2 + " " + request;
			}
		};
		var res = c3po.get("foo.zoo(1, hello)::world");
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
		var res = c3po.get("dummy::hello { lib }", null, {
			lib: "c3po"
		});
		it("should", function() {
			expect(res).to.deep.equal({
				dummy: "hello c3po"
			});
		});
	});
});
