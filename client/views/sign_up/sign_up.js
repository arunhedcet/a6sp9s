A6s.hashPassword = function(password) {
    return {
        digest: SHA256(password),
        algorithm: "sha-256"
    };
};

A6s.A6sViewSignUpHelpers = {
    showEmail: function() {
        var fields;
        fields = A6s.settings.passwordSignupFields;
        return _.contains(['USERNAME_AND_EMAIL', 'USERNAME_AND_OPTIONAL_EMAIL', 'EMAIL_ONLY'], fields);
    },
    showUsername: function() {
        var fields;
        fields = A6s.settings.passwordSignupFields;
        return _.contains(['USERNAME_AND_EMAIL', 'USERNAME_AND_OPTIONAL_EMAIL', 'USERNAME_ONLY'], fields);
    },
    showSignupCode: function() {
        return A6s.settings.showSignupCode;
    },
    logo: function() {
        return A6s.settings.logo;
    },
    privacyUrl: function() {
        return A6s.settings.privacyUrl;
    },
    termsUrl: function() {
        return A6s.settings.termsUrl;
    },
    both: function() {
        return A6s.settings.privacyUrl && A6s.settings.termsUrl;
    },
    neither: function() {
        return !A6s.settings.privacyUrl && !A6s.settings.termsUrl;
    },
    emailIsOptional: function() {
        var fields;
        fields = A6s.settings.passwordSignupFields;
        return _.contains(['USERNAME_AND_OPTIONAL_EMAIL'], fields);
    },
    emailAddress: function() {
        return Session.get('email');
    }
};

A6s.A6sViewSignUpEvents = {
    'submit #signUp': function(event, t) {
        var email, emailRequired, extraFields, fields, filteredExtraFields, formValues, password, passwordErrors, signupCode, trimInput, username, usernameRequired;
        event.preventDefault();
        username = t.find('input[name="username"]') ? t.find('input[name="username"]').value.toLowerCase() : void 0;
        if (username && A6s.settings.usernameToLower) {
            username = username.toLowerCase();
        }
        signupCode = t.find('input[name="signupCode"]') ? t.find('input[name="signupCode"]').value : void 0;
        trimInput = function(val) {
            return val.replace(/^\s*|\s*$/g, "");
        };
        email = t.find('input[type="email"]') ? trimInput(t.find('input[type="email"]').value) : void 0;
        if (A6s.settings.emailToLower && email) {
            email = email.toLowerCase();
        }
        formValues = SimpleForm.processForm(event.target);
        extraFields = _.pluck(A6s.settings.extraSignUpFields, 'field');
        filteredExtraFields = _.pick(formValues, extraFields);
        password = t.find('input[type="password"]').value;
        fields = A6s.settings.passwordSignupFields;
        passwordErrors = (function(password) {
            var errMsg, msg;
            errMsg = [];
            msg = false;
            if (password.length < 7) {
                errMsg.push(t9n("error.minChar"));
            }
            if (password.search(/[a-z]/i) < 0) {
                errMsg.push(t9n("error.pwOneLetter"));
            }
            if (password.search(/[0-9]/) < 0) {
                errMsg.push(t9n("error.pwOneDigit"));
            }
            if (errMsg.length > 0) {
                msg = "";
                errMsg.forEach(function(e) {
                    return msg = msg.concat("" + e + "\r\n");
                });
                Session.set('A6sViewError', msg);
                return true;
            }
            return false;
        })(password);
        if (passwordErrors) {
            return;
        }
        emailRequired = _.contains(['USERNAME_AND_EMAIL', 'EMAIL_ONLY'], fields);
        usernameRequired = _.contains(['USERNAME_AND_EMAIL', 'USERNAME_ONLY'], fields);
        if (usernameRequired && username.length === 0) {
            Session.set('A6sViewError', t9n("error.usernameRequired"));
            return;
        }
        if (usernameRequired && (/^[a-zA-Z0-9-.-_]*$/.test(username) == false)) {
            Session.set('A6sViewError', t9n("error.invalidUsername"));
            return;
        }
        if (username && A6s.isStringEmail(username)) {
            Session.set('A6sViewError', t9n("error.usernameIsEmail"));
            return;
        }
        if (emailRequired && email.length === 0) {
            Session.set('A6sViewError', t9n("error.emailRequired"));
            return;
        }
        if (A6s.settings.showSignupCode && signupCode.length === 0) {
            Session.set('A6sViewError', t9n("error.signupCodeRequired"));
            return;
        }
        return Meteor.call('a6sViewValidateSignupCode', signupCode, function(err, valid) {
            var newUserData;
            if (valid) {
                newUserData = {
                    username: username,
                    email: email,
                    password: A6s.hashPassword(password),
                    profile: filteredExtraFields
                };
                return Meteor.call('a6sViewCreateUser', newUserData, function(err, data) {
                    var isEmailSignUp, userCredential;
                    if (err) {
                        console.log(err);
                        T9NHelper.accountsError(err);
                        return;
                    }
                    isEmailSignUp = _.contains(['USERNAME_AND_EMAIL', 'EMAIL_ONLY'], A6s.settings.passwordSignupFields);
                    userCredential = isEmailSignUp ? email : username;
                    return Meteor.loginWithPassword(userCredential, password, function(error) {
                        if (error) {
                            console.log(err);
                            return T9NHelper.accountsError(error);
                        } else if (Session.get('fromWhere')) {
                            Router.go(Session.get('fromWhere'));
                            return Session.set('fromWhere', void 0);
                        } else {
                            return Router.go(A6s.settings.dashboardRoute);
                        }
                    });
                });
            } else {
                console.log(err);
                Session.set('A6sViewError', t9n("error.signupCodeIncorrect"));
            }
        });
    }
};

Template.A6sViewSignUp.helpers(A6s.A6sViewSignUpHelpers);

Template.A6sViewSignUp.events(A6s.A6sViewSignUpEvents);