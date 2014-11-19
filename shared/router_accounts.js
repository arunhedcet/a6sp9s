var exclusions;

Router.map(function() {
    this.route("A6sViewSignIn", {
        path: "/sign-in",
        onBeforeAction: function() {
            Session.set('A6sViewError', void 0);
            return Session.set('buttonText', 'in');
            return this.next();
        },
        onRun: function() {
            var pkgRendered, userRendered;
            if (Meteor.userId()) {
                Router.go(A6s.settings.dashboardRoute);
            }
            if (A6s.settings.signInTemplate) {
                this.template = A6s.settings.signInTemplate;
                pkgRendered = Template.A6sViewSignIn.rendered;
                userRendered = Template[this.template].rendered;
                if (userRendered) {
                    Template[this.template].rendered = function() {
                        pkgRendered.call(this);
                        return userRendered.call(this);
                    };
                } else {
                    Template[this.template].rendered = pkgRendered;
                }
                Template[this.template].events(A6s.A6sViewSignInEvents);
                Template[this.template].helpers(A6s.A6sViewSignInHelpers);
            }
            return this.next();
        }
    });
    this.route("A6sViewSignUp", {
        path: "/sign-up",
        onBeforeAction: function() {
            Session.set('A6sViewError', void 0);
            return Session.set('buttonText', 'up');
            return this.next();
        },
        onRun: function() {
            var pkgRendered, userRendered;
            if (A6s.settings.signUpTemplate) {
                this.template = A6s.settings.signUpTemplate;
                pkgRendered = Template.A6sViewSignUp.rendered;
                userRendered = Template[this.template].rendered;
                if (userRendered) {
                    Template[this.template].rendered = function() {
                        pkgRendered.call(this);
                        return userRendered.call(this);
                    };
                } else {
                    Template[this.template].rendered = pkgRendered;
                }
                Template[this.template].events(A6s.A6sViewSignUpEvents);
                Template[this.template].helpers(A6s.A6sViewSignUpHelpers);
            }
            return this.next();
        }
    });
    this.route("A6sViewForgotPassword", {
        path: "/forgot-password",
        onBeforeAction: function() {
            return Session.set('A6sViewError', void 0);
            return this.next();
        }
    });
    this.route('A6sViewSignOut', {
        path: '/sign-out',
        onBeforeAction: function() {
            Session.set('A6sViewError', void 0);
            if (A6s.settings.homeRoute) {
                return Meteor.logout(function() {
                    return Router.go(A6s.settings.homeRoute);
                });
            }
            // return pause();
            // return this.next();
        }
    });
    return this.route('a6sViewResetPassword', {
        path: 'reset-password/:resetToken',
        onBeforeAction: function() {
            Session.set('A6sViewError', void 0);
            return Session.set('resetToken', this.params.resetToken);
            return this.next();
        }
    });
});


exclusions = [];

_.each(Router.routes, function(route) {
    return exclusions.push(route.name);
});

Router.onStop(function() {
    if (!_.contains(exclusions, Router.current().route.name)) {
        return Session.set('fromWhere', Router.current().path);
    }

});