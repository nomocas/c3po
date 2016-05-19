var axios = require('axios');

function AxiosClient(baseURI, defaultObj) {
	this.baseURI = baseURI;
	this.defaultObject = defaultObj;
}

AxiosClient.prototype = {
	get: function(query, opt) {
		return axios.get(this.baseURI + query)
			.then(function(s) {
				return s.data;
			});
	},
	del: function(id, opt) {
		return axios.delete(this.baseURI + id)
			.then(function(s) {
				return s.data;
			});
	},
	post: function(data, opt) {
		return axios.post(this.baseURI, data)
			.then(function(s) {
				data.id = s.data.id;
				return s.data;
			});
	},
	put: function(data, opt) {
		return axios.put(this.baseURI + data.id, data)
			.then(function(s) {
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
