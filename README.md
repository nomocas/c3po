# c3po

Previously named deep-protocols.

c3po is a lightweight (1.9 Ko minified, less than 850 Bytes minified/gzipped) javascript protocols manager which focus on providing easy way to write isomorphic code that need to retrieve dependant resources.

## Main idea

Imagine a modern web app where the client app needs to retrieve data from server with an ajax call. The server which in turn needs to retrieve data from DB (db driver call) or FS (nodejs fs api call, ...) to fullfill the request to the client.

In fact, from client or server point of vue : it's the same resource. Only the way to talk to it differ with environnement :
- client needs ajax calls (with headers, optional body shape, ...) that talk to server
- and server needs fs/db/... drivers (with credentials/roles management, specific cwd, ...) to build response

If we want to write some code that do that __independently__ from client or server, without changing the code that retrieve and use resources, you need to provide an abstraction layer which hides details of real calls and provides homogeneous, environnement agnostic way to read or manipulate resource.

Ideally, we ask and get resources, we work on it, and maybe send something somewhere, __without to know__ if we're on client or server.

This __is__ isomorphic, and c3po is there to help us in that quest.

![Image](https://github.com/nomocas/c3po/blob/master/img/c3po.png?raw=true)


## Example

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

You could use string interpolation if you need to dynamically produce the string that point to the needed resource (that could be called "abstract resource locator").

For that, you need first to link a "string-interpolation engine" to c3po.

```javascript
c3po.interpolator = {
  isInterpolable:function(string){
    // returns true if "string" is interpolable
  },
  interpolate:function(string, context){
    // returns interpolated "string" with the provided context
  }
};
```

Or with [expansio](https://github.com/nomocas/expansio) : 
```javascript
c3po.interpolator = require("expansio");
```

Then, you could :

```javascript
c3po.get("json::/my/path/to/json/{ language }", null, { language:"en" });

c3po.protocols.json = function(request, options){
    // request is : "/my/path/to/json/en"
    // ...
};
```

## Dummy native protocols

There is a single native protocol provided with c3po that is only there for test purpose.

```javascript
var output = c3po.get("dummy::hello world");
// output : { dummy:"hello world" }
```

## Simple synchroneous init

If you need to define programmatically some custom properties or methods, you could provide an "init" method that will be called once and lazzily when needed.

```javascript
c3po.protocols.foo = {
  init:function(){
    this.title = "Lollipop";
      // do what you want
  },
  get:function(req, opt){
    return this.title + " : you say : " + req;
  }
};

var result = c3po.get("foo::bar"); 
// => "Lollipop : you say : bar"
```


## Concurrent asynchrone lazzy init 

If you need to make some asynch call while initialising, just return a promise.
If you do so, c3po will manage concurrent asynch calls on same protocol while it is initialising.
It means that, in heavy used asynch environnement (typically a nodejs production server), you could make bunch of call on a protocol even if the protocol is not fully initialised.
c3po will use the promise returned from the first call to wait before launching each subsequent call.
When protocol is fully initialised (promise is fullfiled), c3po will make it transparent.

```javascript
c3po.protocols.foo = {
  init:function(){
      var self = this;

      // asynch simulation
      return new Promise(function(resolve, reject){
        self.aVar = "( Marty McFly )";
      });
  },
  get:function(req, opt){
    return { foo:(req + " " + this.aVar) };
  }
};

c3po.get("foo::bar")
.then(function(s){
  console.log("success : ", s); // { foo:"bar ( Marty McFly )" }
});
```

## Contextualised protocols

As the real C-3PO, sometimes it's necessary to use contextualised protocols to remain fully diplomatic.
By example, a server would define a particular CWD for a FS call depending on user that do the request.
Or maybe a server will allow particular actions when talking to specific resources, always depending on requester.

This could be called "contextualisation".

c3po could manage two kind of contextualisation that is coming from two other tools : [deep-ocm](https://github.com/deepjs/deep-ocm) and [glocal](https://github.com/nomocas/glocal).

To fully understand the trick, you should obviously understand those two tools independently before understanding how to mix them with c3po.

### Promise Glocal protocols namespace

### OCM manager as protocol

## Dedicated protocols

### js asycnhroneous loader

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
Do not forget to install dev-dependencies. i.e. : from 'c3po' folder, type :
```
> npm install
```

then, always in 'c3po' folder simply enter :
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
