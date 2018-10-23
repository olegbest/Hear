const cfg = require('./configDB')
module.exports = {
    port: 8081,
    dbURL: 'mongodb://localhost:27017/HearHeroDB',
    dbOptions: {
        useNewUrlParser: true
    }

};