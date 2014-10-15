Meteor.startup(function() {
    var A6s;
    Accounts.urls.resetPassword = function(token) {
        return Meteor.absoluteUrl('reset-password/' + token);
    };
    A6s = {
        settings: {},
        config: function(appConfig) {
            return this.settings = _.extend(this.settings, appConfig);
        }
    };
    this.A6s = A6s;
    return Meteor.methods({
        a6sViewValidateSignupCode: function(signupCode) {
            check(signupCode, Match.OneOf(String, null, void 0));
            return !A6s.settings.signupCode || signupCode === A6s.settings.signupCode;
        },
        a6sViewCreateUser: function(user) {
            var profile, userId;
            check(user, Object);
            profile = A6s.settings.defaultProfile || {};
            if (user.username) {
                userId = Accounts.createUser({
                    username: user.username,
                    email: user.email,
                    password: user.password,
                    profile: _.extend(profile, user.profile)
                });
            } else {
                userId = Accounts.createUser({
                    email: user.email,
                    password: user.password,
                    profile: _.extend(profile, user.profile)
                });
            }
            if (user.email && Accounts._options.sendVerificationEmail) {
                return Accounts.sendVerificationEmail(userId, user.email);
            }
        }
    });
});
var hashPassword = function(password) {
    return {
        digest: SHA256(password),
        algorithm: "sha-256"
    };
};