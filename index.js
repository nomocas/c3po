/**
 * c3po : Lightweight and powerful protocols manager.
 *  
 * Aimed to be used both sides (server side and/or browser side) to give real isomorphic approach when designing object that need ressources.
 *
 * See docs.
 *
 * TODO : use CommonJS pattern. Include nomocas-utils/lib/promise-log
 * 
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 * @licence MIT
 */
(function(define) {
	"use strict";
	define("c3po", [], function() {
		var parser = /^([\w-]+)(?:\.([\w-]+)(?:\(([^\)]*)\))?)?::([^$]*)/;

		var cError = function(status, message, report) {
			Error.call(this, message);
			this.status = status;
			if (report)
				this.report = report;
		};
		cError.prototype = new Error();
		cError.toString = function() {
			return '(status ' + this.status + ') ' + this.message + (this.report ? (' - ' + JSON.stringify(this.report)) : '');
		};

		function parseRequest(request, obj) {
			var match = parser.exec(request);
			if (match) {
				obj.protocol = match[1];
				obj.method = match[2] || "get";
				obj.args = match[3] ? match[3].split(",")
					.map(function(arg) {
						return arg.trim();
					}) : null;
				obj.pointer = match[4];
				obj.interpolable = c3po.interpolator ? c3po.interpolator.isInterpolable(obj.pointer) : false;
			}
		}

		var Request = function(request) {
			this.__c3po__ = true;
			this.original = request;
			if (request && request[0] === '<')
				return;
			parseRequest(request, this);
		};

		function exec(protocol, self, args) {
			if (!protocol[self.method])
				throw new cError(405, "there is no method named " + self.method + " in protocol " + self.protocol + "!");
			return protocol[self.method].apply(protocol, args);
		}

		function getProtocol(name) {
			if (typeof name === 'string') {
				var protocol;
				// first : look in contextualised namespace if any
				if (c3po.fromGlocal)
					protocol = c3po.fromGlocal(name);
				// or look in global namespace
				if (!protocol)
					protocol = c3po.protocols[name];
				if (!protocol)
					throw new cError(405, "no protocol found with : " + name);
				return protocol;
			}
			if (!name)
				throw new cError(405, "no protocol found with : " + name);
			return name;
		}

		function initialiseProtocol(protocol) {
			return new Promise(function(resolve, reject) {
				var promise = protocol.initialising ? protocol.initialising : protocol.init();
				if (promise && typeof promise.then === 'function') {
					// promised init case
					protocol.initialising = promise.then(function() {
						protocol.initialising = null;
						protocol.initialised = true;
						resolve(protocol);
					}, reject);
				} else {
					protocol.initialised = true;
					resolve(protocol);
				}
			});
		}

		Request.prototype = {
			exec: function(options, context) {
				if (!this.protocol)
					return Promise.resolve(this.original);
				options = options || options;
				var protocol = c3po.protocol(this.protocol),
					uri = (this.interpolable && c3po.interpolator && context) ? c3po.interpolator.interpolate(this.pointer, context) : this.pointer,
					self = this,
					args = this.args ? [].concat(this.args, uri, options) : [uri, options];
				return protocol.then(function(protocol) {
						return exec(protocol, self, args);
					})
					.catch(function(e) {
						console.error("%s protocol request exec (get) error (uri : %s) : ", self.protocol, uri, e);
						throw e;
					})
			}
		};
		var c3po = {
			Request: Request,
			requestCache: null, // simply set to {} to allow caching
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
				return new Promise(function(resolve, reject) {
					var protocol = getProtocol(name);
					// manage initialisation if needed
					if (protocol.init && !protocol.initialised)
						return initialiseProtocol(protocol).then(resolve, reject);
					resolve(protocol);
				});
			},
			get: function(request, options, context) {
				if (!request.__c3po__) {
					if (this.requestCache && this.requestCache[request])
						request = this.requestCache[request];
					else {
						request = new Request(request);
						if (this.requestCache)
							this.requestCache[request.original] = request;
					}
				}
				return request.exec(options, context);
			},
			getAll: function(requests, options, context) {
				return Promise.all(requests.map(function(request) {
					return c3po.get(request, options, context);
				}));
			},
			post: function(protocol, data, opt) {
				return this.protocol(protocol)
					.then(function(proto) {
						if (!proto.post)
							throw new cError(405, 'no "post" method defined on protocol : ' + protocol);
						return proto.post(data, opt);
					})
					.addToError({
						level: 'c3po',
						protocol: protocol,
						method: 'post',
						data: data
					});
			},
			put: function(protocol, data, opt) {
				return this.protocol(protocol)
					.then(function(proto) {
						if (!proto.put)
							throw new cError(405, 'no "put" method defined on protocol : ' + protocol);
						return proto.put(data, opt);
					})
					.addToError({
						level: 'c3po',
						protocol: protocol,
						method: 'put',
						data: data
					});
			},
			del: function(protocol, id, opt) {
				return this.protocol(protocol)
					.then(function(proto) {
						if (!proto.del)
							throw new cError(405, 'no "del" method defined on protocol : ' + protocol);
						return proto.del(id, opt);
					})
					.addToError({
						level: 'c3po',
						protocol: protocol,
						method: 'del',
						id: id
					});
			},
			patch: function(protocol, id, data, path, opt) {
				return this.protocol(protocol)
					.then(function(proto) {
						if (!proto.patch)
							throw new cError(405, 'no "patch" method defined on protocol : ' + protocol);
						return proto.patch(id, data, path, opt);
					})
					.addToError({
						level: 'c3po',
						protocol: protocol,
						method: 'patch',
						id: id,
						data: data,
						path: path
					});
			},
			'default': function(protocol, data, path, opt) {
				return this.protocol(protocol)
					.then(function(proto) {
						if (!proto.default)
							throw new cError(405, 'no "default" method defined on protocol : ' + protocol);
						return proto.default(data, path, opt);
					});
			},
			remote: function(protocol, method, data, opt) {
				return this.protocol(protocol)
					.then(function(proto) {
						if (!proto.remote)
							throw new cError(405, 'c3po remote error : no "remote" method defined on protocol : ' + protocol);
						return proto.remote(method, data, opt);
					})
					.addToError({
						level: 'c3po',
						protocol: protocol,
						method: 'remote',
						remoteMethod: method,
						data: data
					});
			}
		};

		return c3po;
	});
})(typeof define !== 'undefined' ? define : function(id, deps, factory) { // AMD/RequireJS format if available
	if (typeof module !== 'undefined')
		module.exports = factory(); // CommonJS environment
	else if (typeof window !== 'undefined')
		window[id] = factory(); // raw script, assign to c3po global
	else
		console.warn('"%s" has not been set somewhere.', id);
});
