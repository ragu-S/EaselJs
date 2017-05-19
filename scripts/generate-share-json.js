'use strict';
var fs = require('graceful-fs');
var path = require('path');
var config = require('./config');
var jsonPath = path.join(config.output, 'json', 'share.json');
var shareDefault = require('../static/json/share.json');
var defaultShare = { default: Object.assign(shareDefault, config.share) };

fs.writeFileSync(jsonPath, JSON.stringify(defaultShare, null, 2));