const cfg = require('./configDB')
module.exports = {
    port: 8081,
    dbURL: `mongodb://${cfg.user}:${cfg.pass}@localhost:27017/HearHeroDB?authSource=admin&w=1`,
    dbOptions: {
        useNewUrlParser: true
    }

};