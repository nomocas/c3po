/**
 * really simple http client based on XMLHTTPRequest that return Promises.
 *
 * IE8 polyfill for xhr : 
	https://github.com/LuvDaSun/xhr-polyfill
 */

var requesters = {
	text: {
		get: function(url, opt) {
			opt = opt || {};
			return new Promise(function(resolve, reject) {
				var xhr = new XMLHttpRequest();
				xhr.open("GET", url, true);
				xhr.onload = function(e) {
					if (xhr.readyState === 4) {
						if (xhr.status >= 200 && xhr.status < 300)
							resolve(opt.parser ? opt.parser(xhr.responseText) : xhr.responseText);
						else
							reject(xhr.statusText);
					}
				};
				xhr.onerror = function(e) {
					reject(xhr.statusText);
				};
				xhr.send(null);
			});
		}
	},
	json: {
		get: function(url, opt) {
			opt = opt || {};
			opt.parser = function(input) {
				return JSON.parse(input);
			};
			return requesters.text.get(url, opt);
		}
	},
	JSON: function(baseURI) {
		this.baseURI = baseURI;
	},
	Text: function(baseURI) {
		this.baseURI = baseURI;
	}
};

requesters.Text.prototype = {
	get: function(url, opt) {
		url = (this.baseURI ? this.baseURI : '') + url;
		return requesters.text.get(url, opt);
	}
}
requesters.JSON.prototype = {
	get: function(url, opt) {
		url = (this.baseURI ? this.baseURI : '') + url;
		return requesters.json.get(url, opt);
	}
}
module.exports = requesters;
