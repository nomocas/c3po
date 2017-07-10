/* eslint no-console: 0 */
var axios = require('axios');

function AxiosClient(opt) {
	opt = opt || {};
	this.defaultObj = opt.default || {};
	for (var i in opt)
		if (i !== 'default' && i !== 'parser' && i !== 'useCache')
			this[i] = opt[i];
	if (opt.parser)
		this.parser = function(data, req) {
			if (typeof data !== 'string')
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
	this.handleError = this.handleError.bind(this);
}

AxiosClient.prototype = {
	handleError: function(e) {
		if (e.response) {
			console.error('Axios : ', e.response.status, e.response.data);
			// console.error('Axios : ', e.response.status, e.response.data.error.message);
			if (AxiosClient.debug)
				console.log(e.response.data.error.stack);
			if (this._errors && this._errors[String(e.response.status)])
				return this._errors[e.response.status](e.response);
		} else if (e.status) {
			if (this._errors && this._errors[e.status])
				return this._errors[e.status](e);
		}
		throw e;
	},
	get: function(req /* , opt*/) {
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
			.catch(this.handleError);
	},
	del: function(id /* , opt */) {
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
			.catch(this.handleError);
	},
	post: function(data, opt) {
		var self = this;
		opt = opt || {};
		return axios.post(this.baseURI + (opt.path ? opt.path : ''), data, {
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
			.catch(this.handleError);
	},
	patch: function(id, value, path /* , opt*/) {
		var uri = this.baseURI + 'patch';
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
			.catch(this.handleError);
	},
	put: function(data /* , opt*/) {
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
			.catch(this.handleError);
	},
	default: function() {
		return JSON.parse(JSON.stringify(typeof this.defaultObj === 'function' ? this.defaultObj() : this.defaultObj));
	},
	first: function(filter /* , opt*/) {
		var uri = this.baseURI + 'findOne/' + (filter || '');
		return axios.get(uri, {
			headers: AxiosClient.getHeaders ? AxiosClient.getHeaders() : null
		})
			.then(function(s) {
				return s.data;
			})
			.catch(this.handleError);
	},
	remote: function(method, data /* , opt*/) {
		var uri = this.baseURI + method;
		return axios.post(uri, data, {
			headers: AxiosClient.getHeaders ? AxiosClient.getHeaders() : null
		})
			.then(function(s) {
				return s.data;
			})
			.catch(this.handleError);
	}
};

AxiosClient.prototype.delete = AxiosClient.prototype.del;
AxiosClient.prototype.update = AxiosClient.prototype.put;
AxiosClient.prototype.create = AxiosClient.prototype.post;
AxiosClient.prototype.findOne = AxiosClient.prototype.first;
AxiosClient.prototype.find = AxiosClient.prototype.get;


module.exports = AxiosClient;
