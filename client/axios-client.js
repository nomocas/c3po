var axios = require('axios');
require('nomocas-utils/lib/promise-log');

function rethrowError(e) {
	throw e.data.error;
}

function AxiosClient(opt) {
	opt = opt || {};
	this.baseURI = opt.baseURI;
	this.defaultObj = opt.default ||  {};
	if (opt.parser)
		this.parser = function(data, req) {
			if (typeof data !== "string")
				return data;
			try {
				return opt.parser(data, req);
			} catch (e) {
				console.error('AxiosClient : error while parsing response ! ', e);
				return null;
			}
		};
	if (opt.useCache)
		this.cache = {};
}

AxiosClient.prototype = {
	get: function(req, opt) {
		if (this.cache && this.cache[req])
			return this.cache[req];
		var self = this,
			uri = this.baseURI + req;
		return axios.get(uri, {
				headers: AxiosClient.getHeaders ? AxiosClient.getHeaders() : null
			})
			.then(function(s) {
				if (self.parser)
					s.data = self.parser(s.data, req);
				if (self.cache)
					self.cache[req] = s.data;
				return s.data;
			})
			.catch(rethrowError)
			.addToError({
				level: 'AxiosClient',
				method: 'get',
				uri: uri
			});
	},
	del: function(id, opt) {
		var self = this,
			req = this.baseURI + id;
		return axios.delete(req, {
				headers: AxiosClient.getHeaders ? AxiosClient.getHeaders() : null
			})
			.then(function(s) {
				if (self.cache && self.cache[req])
					delete self.cache[req];
				return s.data;
			})
			.catch(rethrowError)
			.addToError({
				level: 'AxiosClient',
				method: 'del',
				uri: req
			});
	},
	post: function(data, opt) {
		var self = this;
		return axios.post(this.baseURI, data, {
				headers: AxiosClient.getHeaders ? AxiosClient.getHeaders() : null
			})
			.then(function(s) {
				data.id = s.data.id;
				var req = self.baseURI + s.data.id;
				if (self.parser)
					s.data = self.parser(s.data, req);
				if (self.cache)
					self.cache[req] = s.data;
				return s.data;
			})
			.catch(rethrowError)
			.addToError({
				level: 'AxiosClient',
				method: 'post',
				uri: this.baseURI,
				data: data
			});
	},
	patch: function(id, value, path, opt) {
		var self = this,
			uri = this.baseURI + 'patch';
		return axios.post(uri, {
				id: id,
				path: path,
				value: value
			}, {
				headers: AxiosClient.getHeaders ? AxiosClient.getHeaders() : null
			})
			.then(function(s) {
				return s.data;
			})
			.catch(rethrowError)
			.addToError({
				level: 'AxiosClient',
				method: 'patch',
				uri: uri,
				id: id,
				value: value,
				path: path
			});
	},
	put: function(data, opt) {
		var self = this,
			req = this.baseURI + data.id;
		return axios.put(req, data, {
				headers: AxiosClient.getHeaders ? AxiosClient.getHeaders() : null
			})
			.then(function(s) {
				if (self.parser)
					s.data = self.parser(s.data, req);
				if (self.cache)
					self.cache[req] = s.data;
				return s.data;
			})
			.catch(rethrowError)
			.addToError({
				level: 'AxiosClient',
				method: 'put',
				uri: req,
				data: data
			});
	},
	default: function() {
		return y.utils.copy(typeof this.defaultObj === 'function' ? this.defaultObj() : this.defaultObj);
	},
	first: function(filter, opt) {
		var uri = this.baseURI + 'findOne/' + (filter || '');
		return axios.get(uri, {
				headers: AxiosClient.getHeaders ? AxiosClient.getHeaders() : null
			})
			.then(function(s) {
				return s.data;
			})
			.catch(rethrowError)
			.addToError({
				level: 'AxiosClient',
				method: 'first',
				uri: uri
			});
	},
	remote: function(method, data, opt) {
		var uri = this.baseURI + method;
		return axios.post(uri, data, {
				headers: AxiosClient.getHeaders ? AxiosClient.getHeaders() : null
			})
			.then(function(s) {
				return s.data;
			})
			.catch(rethrowError)
			.addToError({
				level: 'AxiosClient',
				method: 'remote',
				uri: uri,
				remoteMethod: method,
				data: data
			});
	}
};

module.exports = AxiosClient;
