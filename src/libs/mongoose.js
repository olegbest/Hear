let mongoose = require('mongoose');
let config = require('./../config/config');


mongoose.createConnection(config.dbURL, config.dbOptions);

var db = mongoose.connection;


//db.dropDatabase();

db.on('error', function (err) {
    console.log('connection error:' + err.message);
});
db.once('open', function callback() {
    console.log("db opened");
});

const Schema = mongoose.Schema;
const PostSchema = new Schema({
    username: {
        type: String
    },
    password: {
        type: String
    },
    email: {
        type: String
    },
    data: {
        type: Object
    }

});
const PostModel = mongoose.model('post', PostSchema);
module.exports.PostModel = PostModel;
