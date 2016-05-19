var axios = require('axios');

function AxiosClient(opt) {
	opt = opt || {};
	this.baseURI = opt.baseURI;
	this.defaultObject = opt.defaultObj;
	if (opt.parser)
		this.parser = function(data, req) {
			try {
				return this.parser(data, req);
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
		var self = this;
		return axios.get(this.baseURI + req)
			.then(function(s) {
				if (self.parser)
					s.data = self.parser(s.data, req);
				if (self.cache)
					self.cache[req] = s.data;
				return s.data;
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
			});
	},
	default: function() {
		return y.utils.copy(this.defaultObject);
	},
	first: function(filter) {
		return axios.get(this.baseURI + 'findOne/' + filter)
			.then(function(s) {
				return s.data;
			});
	}
};

module.exports = AxiosClient;
