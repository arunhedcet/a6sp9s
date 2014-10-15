Template.A6sViewForgotPassword.helpers({
    error: function() {
        return t9n(Session.get('A6sViewError'));
    },
    logo: function() {
        return A6s.settings.logo;
    }
});

Template.A6sViewForgotPassword.events({
    'submit #forgotPassword': function(event) {
        event.preventDefault();
        Session.set('email', $('input[name="forgottenEmail"]').val());
        if (Session.get('email').length === 0) {
            Session.set('A6sViewError', 'Email is required');
            return;
        }
        return Accounts.forgotPassword({
            email: Session.get('email')
        }, function(error) {
            if (error) {
                return Session.set('A6sViewError', error.reason);
            } else {
                return Router.go(A6s.settings.homeRoute);
            }
        });
    }
});