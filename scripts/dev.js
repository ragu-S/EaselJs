'use strict';
var path = require('path');
var config = require('./config');
var budo = require('budo');
var style = require('./style');
var copy = require('./copy');

var b = budo(config.entry,{
  serve: config.bundle,
  open: true,
  dir: config.output,
  stream: process.stdout,
  pushstate: true,
  ssl: false,
  // key: process.cwd() + '/' + 'server.key',
  // cert: process.cwd() + '/' + 'server.cer',
});
b.live();
b.watch(['**/*.{html,css,less,scss}',config.raw+'**/*.*']);
b.on('watch',function(e,file) {
  if (file.indexOf(path.basename(config.raw))>-1) {
    copy(file);
  } else if (file.indexOf('.less')>-1 || file.indexOf('.scss')>-1) {
    style(function() {
      // will trigger update on a .css file
    });
  } else if (/\.(css|html?)$/i.test(path.extname(file))) {
    b.reload(file);
  }
});
b.on('pending',b.reload.bind(b));
