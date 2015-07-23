/**
 * c3po : Lightweight but powerful protocols manager.
 *  
 * Aimed to be used both sides (server side and/or browser side) to give real isomorphic approach when designing object that need ressources.
 * 
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 * @licence MIT
 */
(function(define) {
	"use strict";
	define([], function() {
		var parser = /^([\w-]+)(?:\.([\w-]+)(?:\(([^\)]*)\))?)?::([^$]*)/;
		var Request = function(request) {
			this.__c3po__ = true;
			this.original = request;
			var protoIndex;
			if (request[0] === '<')
				return;
			var match = parser.exec(request);
			if (match) {
				this.protocol = match[1];
				this.method = match[2] || "get";
				this.args = match[3] ? match[3].split(",").map(function(arg) {
					return arg.trim();
				}) : null;
				this.pointer = match[4];
				this.interpolable = c3po.interpolator ? c3po.interpolator.isInterpolable(this.pointer) : false;
			}
		};
		Request.prototype = {
			exec: function(options, context) {
				if (!this.protocol)
					return this.original;
				options = options || options;
				var protocol = c3po.protocol(this.protocol),
					uri = (this.interpolable && c3po.interpolator && context) ? c3po.interpolator.interpolate(this.pointer, context) : this.pointer,
					self = this,
					args = this.args ? [].concat(this.args, uri, options) : [uri, options];
				if (protocol && typeof protocol.then === 'function') // protocol is under init
					return protocol.then(function(protocol) {
					if (!protocol[self.method])
						throw new Error("there is no method named '%s' in protocol '%s'!", self.method, self.protocol);
					return protocol[self.method].apply(protocol, args);
				});
				if (!protocol[this.method])
					throw new Error("there is no method named '%s' in protocol '%s'!", self.method, self.protocol);
				return protocol[this.method].apply(protocol, args);
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
			fromGlocal: null, // to use contextualised protocols namespace. 
			interpolator: null, // to allow request interpolation on get
			protocol: function(name) {
				var protocol = null;
				if (typeof name === 'string') {
					// first : look in contextualised namespace if any
					if (this.fromGlocal)
						protocol = this.fromGlocal(name);
					// or look in global namespace
					if (!protocol)
						protocol = this.protocols[name];
					if (!protocol)
						throw new Error("no protocol found with : ", name);
				} else
					protocol = name;
				// manage flattener
				if (protocol._deep_flattener_ && !protocol._deep_flattened_)
					return (protocol._deep_flattening_ ? protocol._deep_flattening_ : protocol.flatten())
						.then(function() {
							return c3po.protocol(protocol);
						});
				// manage ocm resolution
				if (protocol._deep_ocm_)
					protocol = protocol();
				// manage initialisation if needed
				if (protocol.init && !protocol.initialised) {
					var promise;
					if (protocol.initialising)
						promise = protocol.initialising;
					else
						promise = protocol.init();
					if (promise && typeof promise.then === 'function') {
						// promised init case
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
			get: function(request, options, context) {
				if (!request.__c3po__) {
					if (this.requestCache && this.requestCache[request])
						request = this.requestCache[request];
					else {
						request = new this.Request(request);
						if (this.requestCache)
							this.requestCache[request.original] = request;
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
		window.c3po = factory(); // raw script, assign to c3po global
	else
		console.warn('c3po has not been mounted somewhere.');
});
