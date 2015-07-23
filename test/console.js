


c3po.protocols.foo = {
  zoo:function(arg1, arg2, req, opt){
    return "you say : " + arg1 + " " + req + "'s " + arg2 
  }
};

c3po.requestCache = {};


console.time("test");
//for(var i = 0; i < 10000; ++i)

console.log(
  c3po.get("foo.zoo(hello, world)::bar")
);
 // c3po.get("dummy::hello bloupi");
console.timeEnd("test");
/*
c3po.protocols.foo = {
  init:function(){
      return new Promise(function(resolve, reject){
        resolve("bloupi");
      });
  },
  get:function(req, opt){
    return { foo:req };
  }
};


//for(var i = 0; i < 1000; ++i)
c3po.get("foo::bar")
.then(function(s){
  s.foo += "-zoo";
  console.log("success : ", s);
})
.catch(function(e){
  console.log("error : ", e);
});

*/
/*
Promise.prototype.log = function(){
  return this.then(function(s){
    console.log("success ", s);
  });
}


new Promise(function(resolve, reject){
  resolve("bloupi");
})
.log()
*/



