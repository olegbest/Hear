const ArticleModel = require('./../libs/mongoose').PostModel;
const passport = require('passport');
const User = require('./../authentication/user');




class routes {
    constructor(app) {
        this._app = app;
    }

    setup() {
        this._app.get('/posts', (req, res) => {

        })
        this._app.get('/profile', (req, res) => {
            if (req.isAuthenticated()) {
                res.send({
                    firstName: req.user.local.firstName,
                    lastName: req.user.local.lastName,
                    birthday: req.user.local.birthday,
                    authenticate: true
                });
            } else {
                res.send({authenticate: false})
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
            if (req.isAuthenticated()) {
                res.send({firstName: req.user.local.firstName, authenticate: true});
            } else {
                res.send({authenticate: false})
            }

            // console.log(req.user);
        });

        this._app.get('/login', (req, res) => {
            if (req.isAuthenticated()) {
                res.send({firstName: req.user.local.firstName, authenticate: true});
            } else {
                res.send({authenticate: false})
            }

            // if they aren't redirect them to the home page
            // res.redirect('/');

        });


        this._app.post('/signup', passport.authenticate('local-signup', {
            successRedirect: '/', // redirect to the secure profile section
            failureRedirect: '/', // redirect back to the signup page if there is an error
            failureFlash: true // allow flash messages
        }), (req,res)=>{

        });

        this._app.post('/login', passport.authenticate('local-login', {
            successRedirect: '/', // redirect to the secure profile section
            failureRedirect: '/', // redirect back to the signup page if there is an error
            failureFlash: true, // allow flash messages
            successFlash: 'Welcome!'
        }), (req, res) => {
            console.log(123);
        });
        let update = this.updateUserData;
        this._app.post('/profile', function (req, res) {
            if (req.isAuthenticated()) {
                update(req.user.local.email, req.body)
            }
        });

        // this._app.get('/profile', passport.authenticationMiddleware(), renderProfile);
    }

    updateUserData(email,data) {
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
                user.save((err)=>{
                    if (err) console.log(err)
                })
            }
        });
    }


}

module.exports = routes;