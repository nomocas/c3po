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
	},
	remote: function(method, data, opt) {
		// TODO : analyse argument order
		var uri = this.baseURI + method,
			func = this.Model[method];
		if (!func)
			throw new Error('Loopback client : remote : no method found as ' + method);
		var args = [];
		for (var i in data)
			args.push(data[i]);
		return func.apply(thi.Model, args)
			.addToError({
				level: 'AxiosClient',
				method: 'remote',
				uri: uri,
				remoteMethod: method,
				data: data
			});
	}
};

module.exports = LoopbackClient;
