Template.A6sViewSignIn.helpers({
    emailInputType: function() {
        if (A6s.settings.passwordSignupFields === 'EMAIL_ONLY') {
            return 'email';
        } else {
            return 'string';
        }
    },
    emailPlaceholder: function() {
        var fields;
        fields = A6s.settings.passwordSignupFields;
        if (_.contains(['USERNAME_AND_EMAIL', 'USERNAME_AND_OPTIONAL_EMAIL'], fields)) {
            return t9n("usernameOrEmail");
        } else if (fields === "USERNAME_ONLY") {
            return t9n("username");
        }
        return t9n("email");
    },
    logo: function() {
        return A6s.settings.logo;
    },
    isUsernameOnly: function() {
        return A6s.settings.passwordSignupFields === 'USERNAME_ONLY';
    }
});

Template.A6sViewSignIn.events({
    'submit #signIn': function(event) {
        var email;
        event.preventDefault();
        email = $('input[name="email"]').val();
        if ((A6s.isStringEmail(email) && A6s.settings.emailToLower) || (!A6s.isStringEmail(email) && A6s.settings.usernameToLower)) {
            email = email.toLowerCase();
        }
        Session.set('email', email);
        Session.set('password', $('input[name="password"]').val());
        return Meteor.loginWithPassword(Session.get('email'), Session.get('password'), function(error) {
            Session.set('password', void 0);
            if (error) {
                return T9NHelper.accountsError(error);
            } else if (Session.get('fromWhere')) {
                Router.go(Session.get('fromWhere'));
                return Session.set('fromWhere', void 0);
            } else {
                return Router.go(A6s.settings.dashboardRoute);
            }
        });
    }
});