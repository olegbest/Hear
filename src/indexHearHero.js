const express = require('express');
const app = express();
const port = process.env.PORT || 8081;
const passport = require('passport');
const flash = require('connect-flash');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
let config = require('./config/config');
// const history = require('connect-history-api-fallback');
// app.use(history());


const cors = require('cors');
const routes = require('./routes/posts');
app.use(cors({credentials: true, origin: 'http://exam.botcube.co'}));


app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

// required for passport
app.use(session({
    secret: 'ilovescotchscotchyscotchscotch123HearHero',
    store: new MongoStore({
        url: config.dbURL, mongoOptions: {
            "auth": {"authSource": "admin"},
            "user": config.dbOptions.user,
            "pass": config.dbOptions.pass
        }, ttl: 5 * 24 * 60 * 60
    })
})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session


// Allows us to process the data


// ROUTES

// app.use((req, res, next) => {
//     let url = req.get('origin');
//     console.log(url+'/index.html');
//     fs.readFile(url+'/index.html', 'utf-8', (err, content) => {
//         if (err) {
//             console.log('Невозможно открыть файл "index.html".')
//         }
//
//         res.writeHead(200, {
//             'Content-Type': 'text/html; charset=utf-8'
//         });
//
//         res.end(content)
//     })
// });


/*
You're all set!
You're ready to start developing!
Client ID
1052353894686-aa9uosjaun29k7fl6el3m6bpgne2dgp8.apps.googleusercontent.com
Client Secret
pJ3dNzZ91P9Qkb2z8CpunhTL
 */


let Routes = new routes(app);
Routes.setup();

app.listen(port);
console.log('The magic happens on port ' + port);

require('./config/passport')(passport);






