Template.a6sViewResetPassword.helpers({
    error: function() {
        return Session.get('A6sViewError');
    },
    logo: function() {
        return A6s.settings.logo;
    }
});

Template.a6sViewResetPassword.events({
    'submit #resetPassword': function(event) {
        var password, passwordErrors;
        event.preventDefault();
        password = $('input[type="password"]').val();
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
        return Accounts.resetPassword(Session.get('resetToken'), password, function(error) {
            if (error) {
                return Session.set('A6sViewError', error.reason || "Unknown error");
            } else {
                Session.set('resetToken', null);
                return Router.go(A6s.settings.dashboardRoute);
            }
        });
    }
});