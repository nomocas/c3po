/*
 * @Author: Gilles Coomans
 * @Date:   2017-04-03 14:25:02
 * @Last Modified by:   Gilles Coomans
 * @Last Modified time: 2017-04-03 14:28:13
 */

'use strict';
/* global Promise */
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
var c3po;
var parser = /^([\w-]+)(?:\.([\w-]+)(?:\(([^\)]*)\))?)?::([^$]*)/;

var StatusError = function(status, message, report) {
	this.message = message;
	this.status = status;
	if (report)
		this.report = report;
};
StatusError.prototype = new Error();
StatusError.toString = function() {
	return '(status ' + this.status + ') ' + this.message + (this.report ? (' - ' + JSON.stringify(this.report)) : '');
};

function parseRequest(request, obj) {
	var match = parser.exec(request);
	if (match) {
		obj.protocol = match[1];
		obj.method = match[2] || 'get';
		obj.args = match[3] ? match[3].split(',')
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
		throw new StatusError(405, 'there is no method named ' + self.method + ' in protocol ' + self.protocol + '!');
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
			throw new StatusError(405, 'no protocol found with : ' + name);
		return protocol;
	}
	if (!name)
		throw new StatusError(405, 'no protocol found with : ' + name);
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
		var protoc = c3po.protocol(this.protocol),
			uri = (this.interpolable && c3po.interpolator && context) ? c3po.interpolator.interpolate(this.pointer, context) : this.pointer,
			self = this,
			args = this.args ? [].concat(this.args, uri, options) : [uri, options];
		return protoc
			.then(function(protocol) {
				return exec(protocol, self, args);
			})
			.catch(function(e) {
				console.error('%s protocol request exec (get) error (uri : %s) : ', self.protocol, uri, e); // eslint-disable-line no-console
				throw e;
			});
	}
};
c3po = {
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
				initialiseProtocol(protocol).then(resolve, reject);
			else
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
					throw new StatusError(405, 'no "post" method defined on protocol : ' + protocol);
				return proto.post(data, opt);
			});
	},
	put: function(protocol, data, opt) {
		return this.protocol(protocol)
			.then(function(proto) {
				if (!proto.put)
					throw new StatusError(405, 'no "put" method defined on protocol : ' + protocol);
				return proto.put(data, opt);
			});
	},
	del: function(protocol, id, opt) {
		return this.protocol(protocol)
			.then(function(proto) {
				if (!proto.del)
					throw new StatusError(405, 'no "del" method defined on protocol : ' + protocol);
				return proto.del(id, opt);
			});
	},
	patch: function(protocol, id, data, path, opt) {
		return this.protocol(protocol)
			.then(function(proto) {
				if (!proto.patch)
					throw new StatusError(405, 'no "patch" method defined on protocol : ' + protocol);
				return proto.patch(id, data, path, opt);
			});
	},
	'default': function(protocol, data, path, opt) {
		return this.protocol(protocol)
			.then(function(proto) {
				if (!proto.default)
					throw new StatusError(405, 'no "default" method defined on protocol : ' + protocol);
				return proto.default(data, path, opt);
			});
	},
	remote: function(protocol, method, data, opt) {
		return this.protocol(protocol)
			.then(function(proto) {
				if (!proto.remote)
					throw new StatusError(405, 'c3po remote error : no "remote" method defined on protocol : ' + protocol);
				return proto.remote(method, data, opt);
			});
	}
};

module.exports = c3po;

