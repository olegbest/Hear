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
app.use(cors({credentials: true, origin: 'http://exam.botcube.co'}));


app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

// required for passport
app.use(session({
    secret: 'ilovescotchscotchyscotchscotch',
    store: new MongoStore({url: 'mongodb://localhost/HeaHeroSession', ttl: 30 * 60})
})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session


// Allows us to process the data


// ROUTES

var Routes = new routes(app);
Routes.setup();

app.listen(port);
console.log('The magic happens on port ' + port);

require('./config/passport')(passport);






