/**
 * c3po : Lightweight protocols manager.
 *  
 * Aimed to be used both sides (server side and/or browser side) to give isomorphic approach when designing object that need ressources.
 * 
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 * @licence MIT
 */
(function(define) {
	"use strict";
	define([], function() {
		var Request = function(request) {
			this.__c3po__ = true;
			this.original = request;
			var protoIndex;
			if (request && request[0] !== '<' && ((protoIndex = request.substring(0, 50).indexOf("::")) > -1)) {
				var parsed = c3po.parseProtocol(request.substring(0, protoIndex));
				this.protocol = parsed.protocol;
				this.method = parsed.method;
				this.args = parsed.args;
				this.pointer = request.substring(protoIndex + 2);
				this.interpolable = c3po.interpolator ? c3po.interpolator.isInterpolable(this.pointer) : false;
			}
		};
		Request.prototype = {
			exec: function(options, context) {
				if (!this.protocol)
					return this.original;
				options = options || options;
				var protocol = c3po.getInitialisedProtocol(this.protocol),
					uri = (this.interpolable && c3po.interpolator && context) ? c3po.interpolator.interpolate(this.pointer, context) : this.pointer,
					method = this.method;
				if (protocol && typeof protocol.then === 'function')
					return protocol.then(function(protocol) {
						return protocol[method](uri, options);
					});
				return protocol[method](uri, options);
			}
		};
		var c3po = {
			Request: Request,
			requestCache: {}, // simply set to null to avoid caching
			protocols: {
				dummy: { // dummy:: protocol for test and demo
					get: function(url) {
						return {
							dummy: url
						};
					}
				}
			},
			fromContext: null, // to use contextualised protocols namespace. 
			interpolator: null,
			getProtocol: function(name) {
				var protocol = null;
				// first : look in contextualised namespace if any
				if (c3po.fromContext)
					protocol = c3po.fromContext(name);
				// or look in global namespace
				if (!protocol)
					protocol = c3po.protocols[name];
				if (!protocol)
					throw new Error("no protocol found with : ", name);
				return protocol;
			},
			getInitialisedProtocol: function(name) {
				var protocol = typeof name === 'string' ? c3po.getProtocol(name) : name;
				// manage _deep_flattener_
				if (protocol._deep_flattener_ && !protocol._deep_flattened_)
					return (protocol._deep_flattening_ ? protocol._deep_flattening_ : protocol.flatten())
						.then(function() {
							return c3po.getInitialisedProtocol(protocol);
						});
				// manage ocm resolution
				if (protocol._deep_ocm_)
					protocol = protocol();
				// manage initialisation
				if (protocol.init && !protocol.initialised) {
					var promise;
					if (protocol.initialising)
						promise = protocol.initialising;
					else
						promise = protocol.init();
					if (promise && typeof promise.then === 'function') {
						// async init case
						protocol.initialising = promise;
						return promise.then(function() {
							protocol.initialising = null;
							protocol.initialised = true;
							return protocol;
						});
					}
					protocol.initialised = true;
				}
				return protocol;
			},
			parseProtocol: function(protocol) {
				var output =   {
						method: "get"
					},
					argsPresence = protocol.indexOf("(");
				if (argsPresence > -1) {
					var parenthesis = protocol.substring(argsPresence + 1, protocol.length - 1);
					protocol = protocol.substring(0, argsPresence);
					if (parenthesis)
						output.args = parenthesis.split(",").map(function(s) {
							return s.trim();
						});
				}
				var splitted = protocol.split(".");
				if (splitted.length == 2) {
					protocol = splitted[0];
					output.method = splitted[1];
				}
				output.protocol = protocol;
				return output;
			},
			get: function(request, options, context) {
				if (!request.__c3po__) {
					if (c3po.requestCache && c3po.requestCache[request])
						request = c3po.requestCache[request];
					else {
						request = new c3po.Request(request);
						if (c3po.requestCache)
							c3po.requestCache[request.original] = request;
					}
				}
				return request.exec(options, context);
			},
			getAll: function(requests, options, context) {
				return requests.map(function(request) {
					return c3po.get(request, options, context);
				});
			}
		};
		return c3po;
	});
})(typeof define !== 'undefined' ? define : function(deps, factory) { // AMD/RequireJS format if available
	if (typeof module !== 'undefined')
		module.exports = factory(); // CommonJS environment
	else if (typeof window !== 'undefined')
		window.c3po = factory(null); // raw script, assign to c3po global
	else
		console.warn('c3po has not been mounted somewhere.');
});
