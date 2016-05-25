function FSClient(fs, basePath, parser, useCache) {
	this.fs = fs;
	this.basePath = basePath;
	this.parser = parser;
	if (useCache)
		this.cache = {};
}

FSClient.prototype = {
	get: function(req, opt) {
		var self = this;
		if (this.cache && this.cache[req])
			return Promise.resolve(this.cache[req]);
		var path = (self.basePath ? self.basePath : '') + req;
		var p = new Promise(function(resolve, reject) {
			self.fs.readFile(path, 'utf8', function(err, content) {
				if (err)
					return reject(err);
				var result = self.parser ? self.parser(content) : content;
				if (self.cache)
					self.cache[req] = result;
				resolve(result);
			});
		});
		if (this.cache)
			this.cache[req] = p;
		return p
			.catch(function(e) {
				console.error('FSClient error (path : %s) : ', path, e);
				throw e;
			});
	}
};

module.exports = FSClient;
