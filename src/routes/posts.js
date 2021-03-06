const ArticleModel = require('./../libs/mongoose').PostModel;
const passport = require('passport');
const User = require('./../authentication/user');
const crypto = require('crypto');
const base64url = require('base64url');
const sendMail = require('./../libs/senMail');
// const ip = require('ip');
const gSheets = require('./../googledocs/index');

const requestIp = require('request-ip');
const macaddress = require('macaddress');

class routes {
    constructor(app) {
        this._app = app;
    }

    setup() {
        this._app.get('/posts', (req, res) => {

        });
        this._app.get('/profile', (req, res) => {
            let clientIp = req.sessionID;

            if (req.isAuthenticated()) {
                res.send({
                    firstName: req.user.local.firstName,
                    lastName: req.user.local.lastName,
                    birthday: req.user.local.birthday,
                    authenticate: true,
                    ip: clientIp
                });
            } else {
                res.send({authenticate: false, message: req.flash()})
            }

        });

        this._app.get('/logout', function (req, res) {
            req.logout();

            // res.redirect('/');
        });
        this._app.post('/logout', function (req, res) {
            // console.log(req.session);
            // req.logout();
            let email = req.user.local.email;
            req.session.destroy(function () {
                res.clearCookie('connect.sid');
                // findUserDB(email, "", (user) => {
                //     if (user) {
                //         user.local.ip = req.sessionID;
                //         user.save((err) => {
                res.send({logout: true});
                //         })
                //     }
                // });
            })

            // res.redirect('/');
        });

        this._app.get('/', (req, res) => {
            let ipUser = req.sessionID;

            if (req.isAuthenticated()) {
                addNewUserDB(req.user.local.email, ipUser);
                this.addNewUser(ipUser, req.user.local.email);
                res.send({firstName: req.user.local.firstName, authenticate: true});
            } else {
                addNewUserDB("", ipUser);
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
            req.body.ip = req.sessionID;
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
                    console.log(user)
                    if (loginErr) {
                        console.log(loginErr)
                        return next(loginErr);
                    }
                    console.log(req.user.local)
                    req.session.destroy(function () {
                        res.clearCookie('connect.sid');
                        return res.send({authenticate: true, firstName: req.user.local.firstName});
                    })

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
                    findUserDB(req.user.local.email, "", (mainUser) => {
                        console.log(mainUser);
                        User.find({'local.ip': req.sessionID}, (err, users) => {

                            console.log(users);
                            if (users) {
                                console.log("Users")
                                users.forEach((user) => {
                                    console.log("User")
                                    let data = user.local;
                                    if (!data.email) {
                                        mainUser.local.ip = req.sessionID;
                                        user.local.ranges.forEach((el) => {
                                            mainUser.local.ranges.push(el);
                                        });
                                        mainUser.save((err) => {
                                            user.remove((err) => {
                                                return res.send({
                                                    authenticate: true,
                                                    firstName: req.user.local.firstName
                                                });
                                            });
                                        })
                                    }
                                })
                            }
                        });
                    })
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
                        sendMail.sendMail(firstName, email, token, req.get("origin"));
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
                // console.log(7788)
            }
        });


        let updateTable = this.updateTableData;
        this._app.post('/changeState', function (req, res) {
            let ipUser = req.sessionID;
            if (req.isAuthenticated()) {
                updateUserDataDB(req.user.local.email, ipUser, req.body);
                updateTable(ipUser, req.user.local.email, req.body);
                res.send({authenticate: true, firstName: req.user.local.firstName});
            } else {
                updateUserDataDB("", ipUser, req.body)
                updateTable(ipUser, "", req.body);
                res.send({authenticate: false, firstName: ""})
            }
        });

        let update = this.updateUserDataProfile;
        this._app.post('/profile', function (req, res) {
            if (req.isAuthenticated()) {
                update(req.user.local.email, req.body)
                res.send({authenticate: true})
            }
        });

        this._app.post('/sendEmailMessage', (req, res) => {
            console.log(req.body);
            if (req.isAuthenticated()) {
                req.body.info = "First Name: " + req.user.local.firstName + "<br>" + "Email: " + req.user.local.email + "<br>" + req.body.info;
            }
            sendMail.sendFeedBackMessage(req.body, () => {
                res.send({sendMail: true});
            });
        })


        // this._app.get('/profile', passport.authenticationMiddleware(), renderProfile);
    }

    updateUserDataProfile(email, data) {
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
        console.log(ipUser);
        findUser(ipUser, email, (res) => {
            console.log(res);
            if (res > -1) {
                if (email) {
                    gSheets.update("A" + res + ":" + "B" + res, [[ipUser, email]])
                } else {
                    gSheets.update("A" + res + ":A", [[ipUser]])
                }
            } else {
                gSheets.add("A1:A", [[ipUser, email]]);
            }
        });


    }

    updateTableData(ipUser, email, data) {
        console.log(ipUser);
        console.log(email);
        findUser(ipUser, email, (res) => {
            console.log(data);
            let range;
            range = data.type.range + res;

            gSheets.update(range, [[data.name]])
        })
    }


}

function findUser(ipUser, email, callback) {
    gSheets.get("A1:B", (raw) => {
        console.log(raw);
        for (let i = 0; i < raw.length; i++) {
            if (raw[i][0] === ipUser) {
                callback(i + 1);
                return;
            } else if (raw[i][1] === email) {
                callback(i + 1);
                return;

            }
        }
        callback(-1);
    });
}

function findUserDB(email, ipUser, callback) {
    User.findOne({$or: [{'local.email': email}, {'local.ip': ipUser}]}, function (err, user) {
        // if there are any errors, return the error
        if (err)
            return err;

        // check to see if theres already a user with that email
        callback(user);
        if (user) {
        }

    })
}

function updateUserDataDB(email, ipUser, data) {
    findUserDB(email, ipUser, (user) => {
        if (user) {
            let range;
            if (data.hasOwnProperty("leftEar")) {
                if (data.leftEar) {
                    range = data.type.range[0];
                } else {
                    range = data.type.range[1];
                }
            } else {
                range = data.type.range;

            }
            user.local.ranges.push({name: range, text: data.name});
            user.save((err) => {
                if (err) console.log(err)
            })
        }
    });
}

function addNewUserDB(email, ipUser) {
    findUserDB(email, ipUser, (user) => {
        if (user) {
            return
        } else {
            let newUser = new User();

            // set the user's local credentials
            newUser.local = {
                ranges: [],
                ip: ipUser
            };

            // save the user
            newUser.save(function (err) {
                if (err) {
                    console.log(err);
                    throw err;
                }

            })
        }
    })
}

setInterval(async function () {
    gSheets.remove("A5:U", async () => {
        User.find({}, async (err, users) => {
            if (err)
                return err;

            let arrUsers = [];
            users.forEach(async function (user, i) {
                let obj = {};
                user.local.ranges.forEach(function (el) {
                    if (el.text && el.name) {
                        obj[el.name] = el.text;
                    }
                });
                user.local.ranges = [];
                for (let key in obj) {
                    user.local.ranges.push({name: key, text: obj[key]});
                }
                user.save((err) => {
                    if (err) {
                        console.log(err);
                        throw err;
                    }
                });
                let objSymbols = {
                    "A": 0,
                    "B": 1,
                    "C": 2,
                    "D": 3,
                    "E": 4,
                    "F": 5,
                    "G": 6,
                    "H": 7,
                    "I": 8,
                    "J": 9,
                    "K": 10,
                    "L": 11,
                    "M": 12,
                    "N": 13,
                    "O": 14,
                    "P": 15,
                    "Q": 16,
                    "R": 17,
                    "S": 18,
                    "T": 19,
                    "U": 20,
                };
                let userData = [user.local.ip, user.local.email];
                for (let key in obj) {
                    userData[objSymbols[key]] = obj[key];
                }
                arrUsers.push(userData);
            });
            // console.log(arrUsers);
            gSheets.update("A5", arrUsers);
        })
    });
}, 3 * 60 * 1000);


module.exports = routes;