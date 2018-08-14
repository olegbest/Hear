var express = require('express');
var app = express();
var port = process.env.PORT || 8081;
var passport = require('passport');
var flash = require('connect-flash');
const fs = require('fs');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
const MongoStore = require('connect-mongo')(session);

const cors = require('cors');
const routes = require('./routes/posts');
app.use(cors({credentials: true, origin: 'http://localhost:8080'}));


app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

// required for passport
app.use(session({
    secret: 'ilovescotchscotchyscotchscotch',
    store: new MongoStore({url: 'mongodb://localhost/test-app', ttl: 30 * 60})
})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

let forgot = require('password-reset')({
    uri : 'http://localhost:8080/password_reset',
    from : 'http://localhost/',
    host : 'localhost', port : 25,
});
app.use(forgot.middleware);

// Allows us to process the data


app.post('/forgot', function (req, res) {
    var email = req.body.email;
    console.log(req.body);
    var reset = forgot(email, function (err) {
        if (err) console.log(err)
        else console.log("send");
    });

    reset.on('request', function (req_, res_) {
        req_.session.reset = { email : email, id : reset.id };
        fs.createReadStream(__dirname + '/forgot.html').pipe(res_);
    });
});

app.post('/reset', function (req, res) {
    if (!req.session.reset) return res.end('reset token not set');

    var password = req.body.password;
    var confirm = req.body.confirm;
    if (password !== confirm) return res.end('passwords do not match');

    // update the user db here

    forgot.expire(req.session.reset.id);
    delete req.session.reset;
    res.end('password reset');
});


// ROUTES

var Routes = new routes(app);
Routes.setup();

app.listen(port);
console.log('The magic happens on port ' + port);

require('./config/passport')(passport);






