let mongoose = require('mongoose');
let config = require('./../config/config');


mongoose.createConnection(config.dbURL, config.dbOptions);

