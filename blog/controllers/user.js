const encryption = require("../utilities/encryption");
const User = require('../models').User;
const Article = require('../models').Article;

module.exports = {
    registerGet: (req, res) => {
        res.render('user/register');
    },

    registerPost: (req, res) => {
        let registerArgs = req.body;

        User.findOne({where: {email: registerArgs.email}}).then(user => {
            let errorMsg = '';
            if (user) {
                errorMsg = 'User with the same username exists!';
            } else if (registerArgs.password !== registerArgs.repeatedPassword) {
                errorMsg = 'Passwords do not match!'
            }

            if (errorMsg) {
                registerArgs.error = errorMsg;
                res.render('user/register', registerArgs)
            } else {

                let salt = encryption.generateSalt();
                let passwordHash = encryption.hashPassword(registerArgs.password, salt);

                let userObject = {
                    email: registerArgs.email,
                    passwordHash: passwordHash,
                    fullName: registerArgs.fullName,
                    salt: salt
                };

                User.create(userObject).then(user => {
                    req.logIn(user, (err) => {
                        if (err) {
                            registerArgs.error = err.message;
                            res.render('user/register', registerArgs.dataValues);
                            return;
                        }
                        res.redirect('/')
                    })
                })
            }
        })
    },

    loginGet: (req, res) => {
        res.render('user/login');
    },

    loginPost: (req, res) => {
        let loginArgs = req.body;
        User.findOne({where: {email: loginArgs.email}}).then(user => {
            if (!user || !user.authenticate(loginArgs.password)) {
                loginArgs.error = 'Either username or password is invalid!';
                res.render('user/login', loginArgs);
                return;
            }

            req.logIn(user, (err) => {
                if (err) {
                    res.redirect('/user/login', {error: err.message});
                    return;
                }

                res.redirect('/');
            })
        })
    },
    articlesGet: (req, res) => {
        let userId = req.user.id;
        Article.findAll({where: {authorId: userId}})
            .then(articles => {
                res.render('user/myarticles', {articles: articles})
            }).catch(err => {
            console.log(err.message);
        })
    },
    userinfoGet: (req, res) => {
        let userId = req.user.id;
        User.findById(userId)
            .then(user => {
                res.render('user/userinfo', {user: user})
            })
    },
    //TODO
    changePassword: (req, res) => {
        let newArg = req.body;
        let userId = req.user.id;
        let userSalt = req.user.salt;
        let newPassHash = encryption.hashPassword(newArg.newPassword, userSalt);

        User.findById(userId)
            .then(
                user => {
                    let errorMsg = '';
                    if (newPassHash === user.dataValues.passwordHash) {
                        errorMsg = 'The new password needs to be different then the old one!'
                    } else if (newArg.newPassword !== newArg.repeatedPassword) {
                        errorMsg = 'Passwords do not match!'
                    }

                    if (errorMsg) {
                        newArg.error = errorMsg;
                        res.render('user/userinfo', newArg)
                    } else {
                        user
                            .update(newPassHash)
                            .then(() => {
                                res.redirect('/');
                            })
                    }
                })
    },
    logout: (req, res) => {
        req.logOut();
        res.redirect('/');
    }
};
