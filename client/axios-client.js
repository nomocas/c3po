var axios = require('axios');

function AxiosClient(opt) {
	opt = opt || {};
	this.baseURI = opt.baseURI;
	this.defaultObject = opt.defaultObj;
	if (opt.parser)
		this.parser = function(data, req) {
			if (typeof data !== "string")
				return data;
			try {
				return opt.parser(data, req);
			} catch (e) {
				console.error('AxiosClient : error while parsing ! ', e);
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
			uri = this.baseURI + req
		return axios.get(uri)
			.then(function(s) {
				if (self.parser)
					s.data = self.parser(s.data, req);
				if (self.cache)
					self.cache[req] = s.data;
				return s.data;
			})
			.catch(function(e) {
				console.error("AxiosClient get error (uri : %s) : ", uri, e);
				throw e;
			});
	},
	del: function(id, opt) {
		var self = this,
			req = this.baseURI + id;
		return axios.delete(req)
			.then(function(s) {
				if (self.cache && self.cache[req])
					delete self.cache[req];
				return s.data;
			})
			.catch(function(e) {
				console.error("AxiosClient del error (uri : %s) : ", req, e);
			});
	},
	post: function(data, opt) {
		var self = this;
		return axios.post(this.baseURI, data)
			.then(function(s) {
				data.id = s.data.id;
				var req = self.baseURI + s.data.id;
				if (self.parser)
					s.data = self.parser(s.data, req);
				if (self.cache)
					self.cache[req] = s.data;
				return s.data;
			})
			.catch(function(e) {
				console.error("AxiosClient post error (uri : %s) : ", self.baseURI, e);
			});
	},
	patch: function(id, value, path, opt) {
		var self = this;
		return axios.post(this.baseURI + 'patch', {
				id: id,
				path: path,
				value: value
			})
			.then(function(s) {
				return s.data;
			})
			.catch(function(e) {
				console.error("AxiosClient post error (uri : %s) : ", self.baseURI, e);
			});
	},
	put: function(data, opt) {
		var self = this,
			req = this.baseURI + data.id;
		return axios.put(req, data)
			.then(function(s) {
				if (self.parser)
					s.data = self.parser(s.data, req);
				if (self.cache)
					self.cache[req] = s.data;
				return s.data;
			})
			.catch(function(e) {
				console.error("AxiosClient put error (uri : %s) : ", req, e);
			});
	},
	default: function() {
		return y.utils.copy(this.defaultObject);
	},
	first: function(filter) {
		var uri = this.baseURI + 'findOne/' + (filter || '');
		return axios.get(uri)
			.then(function(s) {
				return s.data;
			})
			.catch(function(e) {
				console.error("AxiosClient .first error (uri : %s) : ", uri, e);
			});
	}
};

module.exports = AxiosClient;
