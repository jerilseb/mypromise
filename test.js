var MyPromise = require("./MyPromise");

var a = new MyPromise(function(resolve, reject) {
  setTimeout(() => {
    if (Math.random() > 0.5) {
      resolve(2323);
    } else {
      reject("haha");
    }
  }, 1200);
});

x = a.then(
  val => {
    console.log("Value: ", val);
    console.log(a);
    return 43433;
  },
  err => {
    console.log("Error: ", err);
    console.log(a);
  }
);
