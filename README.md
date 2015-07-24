# c3po

Previously named deep-protocols.

c3po is a lightweight (1.9 Ko minified, less than 850 Bytes minified/gzipped) protocols manager which focus on providing easy way to write isomorphic code that need to retrieve dependant resources.

## Main idea

Imagine a modern web app where the client app needs to retrieve data from server with an ajax call. The server which in turn needs to retrieve data from DB (db driver call) or FS (nodejs fs api call, ...) to fullfill the request to the client.

In fact, from client or server point of vue : it's the same resource. Only the way to talk to it differ with environnement :
- client needs ajax calls (with headers, optional body shape, ...) that talk to server
- and server needs fs/db/... drivers (with credentials/roles management, specific cwd, ...) to build response

If we want to write some code that do that __independently__ from client or server, without changing the code that retrieve and use resources, you need to provide an abstraction layer which hides details of real calls and provides homogeneous, environnement agnostic way to read or manipulate resource.

Ideally, we ask and get resources, we work on it, and maybe send something somewhere, __without to know__ if we're on client or server.

This __is__ isomorphic, and c3po is there to help us in that quest.

![Image](../blob/master/img/c3po.png?raw=true)


```javascript
c3po.protocols.foo = {
  get:function(req, opt){
    return "you say : " + req;
  }
};

var result = c3po.get("foo::bar"); 
// => "you say : bar"
```

## Protocol methods

```javascript
c3po.protocols.foo = {
  zoo:function(req, opt){
    return "you say : " + req;
  }
};

var result = c3po.get("foo.zoo::bar"); 
// => "you say : bar"
```

### Methods arguments

```javascript
c3po.protocols.foo = {
  zoo:function(arg1, arg2, req, opt){
    return "you say : " + arg1 + " " + req + "'s' " + arg2 
  }
};

var result = c3po.get("foo.zoo(hello, world)::bar"); 
// => "you say : hello bar's world"
```


## Interpolation




## Native protocols

### dummy





## Simple synchroneous init

```javascript
c3po.protocols.foo = {
  init:function(){
      // do what you want
  },
  get:function(req, opt){
    return "you say : " + req;
  }
};

var result = c3po.get("foo::bar"); 
// => "you say : bar"
```


## Concurrent asynchrone lazzy init 

```javascript
c3po.protocols.foo = {
  init:function(){
      return new Promise(function(resolve, reject){
        resolve(true);
      });
  },
  get:function(req, opt){
    return { foo:(req + "-zoo") };
  }
};

c3po.get("foo::bar")
.then(function(s){
  console.log("success : ", s); // { foo:"bar-zoo" }
});
```

## Contextualised protocols

As C-3PO, sometimes it's necessary to use contextualised protocols to remain fully diplomatic... ;)

### Promise Glocal protocols namespace

### OCM manager as protocol


## Dedicated protocols

### js asycnhroneous loader :

AMD and CommonJS environnement (based on "require" availability) :

```javascript
// native js:: protocol based on async require(...) (only for AMD or CommonJS env.)
c3po.protocols.js = {
	get: function(path, options) {
		return new Promise(function(resolve, reject) {
			require([path], function(obj) {
				resolve(obj);
			}, function(err) {
				reject(err);
			});
		});
	}
};
```

### Restful Services and RQL



### Static resource loader
#### Template loader

#### JSON loader

## Request Cache management

## Tests

### Under nodejs

You need to have mocha installed globally before launching test. 
```
> npm install -g mocha
```
Do not forget to install dev-dependencies. i.e. : from 'decompose' folder, type :
```
> npm install
```

then, always in 'decompose' folder simply enter :
```
> mocha
```

### In the browser

Simply serve "c3po" folder in you favorite web server then open ./index.html.

You could use the provided "gulp web server" by entering :
```
> gulp serve-test
```

## Licence

The [MIT](http://opensource.org/licenses/MIT) License

Copyright (c) 2015 Gilles Coomans <gilles.coomans@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
