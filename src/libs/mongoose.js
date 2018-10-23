let mongoose = require('mongoose');
let config = require('./../config/config');

console.log(config.dbOptions)

// mongoose.createConnection(config.dbURL, config.dbOptions);

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
