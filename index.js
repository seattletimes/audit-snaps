var puppet = require("puppeteer");
var fs = require("fs");
var window;

var startChrome = async function() {
  var browser = await puppet.launch();
  window = await browser.newPage();
  await window.viewport({ width: 1920, height: 1080 });
};

var lazyLoad = function() {
  var lazyImages = [...document.querySelectorAll(".lazy")];
  var loading = lazyImages.map(function(img) {
    return new Promise(function(ok, fail) {
      img.src = img.getAttribute("data-src");
      img.classList.add("loaded");
      // console.log(img.src)
      img.addEventListener("load", ok);
    });
  });
  var done = Promise.all(loading);
  return done.then(() => new Promise(ok => setTimeout(ok, 10000)));
};

var mkdir = function(path) {
  if (fs.existsSync(path)) return;
  fs.mkdirSync(path);
};

var getPath = function() {
  var now = new Date();
  var year = now.getFullYear();
  var month = now.getMonth().toString().padStart(2, "0");
  var day = now.getDate().toString().padStart(2, "0");
  var hour = now.getHours().toString().padStart(2, "0");
  var folder = `${year}${month}${day}`;
  var file = `${hour}.jpg`;
  var path = folder + "/" + file;
  return { folder, file, path };
};

var visit = async function() {
  await window.goto("https://seattletimes.com", { waitUntil: "domcontentloaded" });
  await window.evaluate(lazyLoad);
  var { folder, path } = getPath();
  mkdir(folder);
  await window.screenshot({ width: 1440, path, fullPage: true });
  console.log("Creating screenshot: ", path);
};

var wait = function(minutes) {
  return new Promise(ok => setTimeout(ok, minutes * 60 * 1000));
};

var nextHour = function() {
  return new Promise(ok => {
    var now = new Date();
    var later = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0);
    var difference = later - now;
    setTimeout(ok, difference);
  });
}

var shutter = async function() {
  await visit();
  await nextHour();
  shutter();
};

(async () => {
  await startChrome();
  shutter();
})();