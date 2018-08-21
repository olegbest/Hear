const ArticleModel = require('./../libs/mongoose').PostModel;
const passport = require('passport');
const User = require('./../authentication/user');
const crypto = require('crypto');
const base64url = require('base64url');
const sendMail = require('./../libs/senMail').sendMail;
const ip = require('ip');
const gSheets = require('./../googledocs/index');


class routes {
    constructor(app) {
        this._app = app;
    }

    setup() {
        this._app.get('/posts', (req, res) => {

        });
        this._app.get('/profile', (req, res) => {

            if (req.isAuthenticated()) {
                res.send({
                    firstName: req.user.local.firstName,
                    lastName: req.user.local.lastName,
                    birthday: req.user.local.birthday,
                    authenticate: true
                });
            } else {
                res.send({authenticate: false, message: req.flash()})
            }
        });

        this._app.get('/logout', function (req, res) {
            req.logout();
            console.log(req.logout)

            // res.redirect('/');
        });
        this._app.post('/logout', function (req, res) {
            // console.log(req.session);
            // req.logout();
            req.session.destroy(function () {
                res.clearCookie('connect.sid');
                res.send({logout: true})
            })

            // res.redirect('/');
        });

        this._app.get('/', (req, res) => {
            let ipUser = ip.address();

            if (req.isAuthenticated()) {
                this.addNewUser(ipUser, req.user.local.email);
                res.send({firstName: req.user.local.firstName, authenticate: true});
            } else {
                this.addNewUser(ipUser, "");
                res.send({authenticate: false, message: req.flash()})
            }

            // console.log(req.user);
        });

        this._app.get('/login', (req, res) => {
            if (req.isAuthenticated()) {
                res.send({firstName: req.user.local.firstName, authenticate: true});
            } else {
                res.send({authenticate: false, message: req.flash()})
            }

            // if they aren't redirect them to the home page
            // res.redirect('/');

        });


        this._app.post('/signup', (req, res, next) => {
            passport.authenticate('local-signup', function (err, user, info) {
                if (err) {
                    return next(err); // will generate a 500 error
                }
                // Generate a JSON response reflecting authentication status
                if (!info.user) {
                    return res.send({authenticate: false, message: info.message});
                }
                // ***********************************************************************
                // "Note that when using a custom callback, it becomes the application's
                // responsibility to establish a session (by calling req.login()) and send
                // a response."
                // Source: http://passportjs.org/docs
                // ***********************************************************************
                req.login(user, loginErr => {
                    if (loginErr) {
                        return next(loginErr);
                    }
                    return res.send({authenticate: true});
                });
            })(req, res, next);
        });

        this._app.post('/login', function (req, res, next) {
            passport.authenticate('local-login', function (err, user, info) {
                if (err) {
                    return next(err); // will generate a 500 error
                }
                // Generate a JSON response reflecting authentication status
                if (!info.user) {
                    return res.send({authenticate: false, message: 'No user found.'});
                }

                if (!info.password) {
                    return res.send({authenticate: false, message: 'Oops! Wrong password.'});
                }
                // ***********************************************************************
                // "Note that when using a custom callback, it becomes the application's
                // responsibility to establish a session (by calling req.login()) and send
                // a response."
                // Source: http://passportjs.org/docs
                // ***********************************************************************
                req.login(user, loginErr => {
                    if (loginErr) {
                        return next(loginErr);
                    }
                    return res.send({authenticate: true});
                });
            })(req, res, next);
        });

        let chekUser = this.checkUser;

        this._app.post('/forgot', function (req, res) {
            // console.log( req.protocol + '://' + req.get('host') + req.originalUrl);
            if (req.isAuthenticated()) {
                res.send({authenticate: true})
            } else {
                let email = req.body.email;
                chekUser(email, (status, firstName) => {
                    if (status) {
                        let token = base64url(crypto.randomBytes(32));
                        req.sessionStore.reset = {email: email, id: token};
                        sendMail(firstName, email, token, req.get("origin"));
                        res.send({sendMail: true})
                    } else {
                        res.send({message: 'No user found'})
                    }
                });
            }
        });

        let resetPass = this.resetPassword;

        this._app.post('/reset', function (req, res) {
            if (!req.sessionStore.reset) return res.end('reset token not set');

            let password = req.body.password;

            if (req.sessionStore.reset.id === req.query.id) {

                // update the user db here
                resetPass(req.sessionStore.reset.email, password);
                delete req.sessionStore.reset;
                res.end('password reset');
            } else {
                console.log(7788)
            }
        });

        let update = this.updateUserData;
        this._app.post('/profile', function (req, res) {
            if (req.isAuthenticated()) {
                update(req.user.local.email, req.body)
            }
        });

        // this._app.get('/profile', passport.authenticationMiddleware(), renderProfile);
    }

    updateUserData(email, data) {
        console.log(data);
        User.findOne({'local.email': email}, function (err, user) {
            // if there are any errors, return the error
            if (err)
                return err;

            // check to see if theres already a user with that email
            if (user) {
                user.local.firstName = data.firstName;
                user.local.lastName = data.lastName;
                user.local.birthday = data.birthday;
                user.save((err) => {
                    if (err) console.log(err)
                })
            }
        });
    }

    resetPassword(email, password) {
        User.findOne({'local.email': email}, function (err, user) {
            // if there are any errors, return the error
            if (err)
                return err;

            // check to see if theres already a user with that email
            let newUser = User();
            if (user) {
                user.local.password = newUser.generateHash(password);
                user.save((err) => {
                    if (err) console.log(err)
                })
            }
        });
    }

    checkUser(email, callback) {
        User.findOne({'local.email': email}, function (err, user) {
            // if there are any errors, return the error
            let status;
            let firstName = "";
            if (err)
                return err;

            if (user) {
                status = true;
                firstName = user.local.firstName
            } else if (!user) {
                console.log('user not found');
                status = false
            }
            callback(status, firstName)
        })
    }

    addNewUser(ipUser, email) {
        if (email) {
            gSheets.get("B1:B", (raw) => {
                console.log(raw);
                let hasUser = false;
                for (let i = 0; i < raw.length; i++) {
                    if (raw[i][0] === email) {
                        hasUser = true;
                        break;
                    }
                }
                if (!hasUser) {
                    gSheets.add("A1:B1", [[ipUser, email]])
                }
            });
        } else {
            gSheets.get("A1:A", (raw) => {
                console.log(raw);
                let hasUser = false;
                for (let i = 0; i < raw.length; i++) {
                    if (raw[i][0] === ipUser) {
                        hasUser = true;
                        break;
                    }
                }
                if (!hasUser) {
                    gSheets.add("A1:B1", [[ipUser, email]])
                }
            });
        }
    }


}

module.exports = routes;