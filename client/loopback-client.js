/**
 * Simple loopback.io model's  client
 */

var qs = require('qs'); // query string parser used by loopback

function LoopbackClient(app, modelName) {
	this.Model = app.models[modelName];
	if (!this.Model)
		throw new Error('LoopbackClient : no model found with : ' + modelName);
	this.modelName = modelName;
}

LoopbackClient.prototype = {
	get: function(query, opt) {
		query = query || '?';
		if (query[0] === '?')
			return this.Model.find(qs.parse(query.substring(1)));
		return this.Model.findById(query);
	},
	first: function(query) {
		return this.Model.findOne(qs.parse(query[0] === '?' ? query.substring(1) : query));
	}
};

module.exports = LoopbackClient;
