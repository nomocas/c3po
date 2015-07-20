/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 *
 */

if (typeof require !== 'undefined')
	var chai = require("chai"),
		c3po = require("../index");

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

});
