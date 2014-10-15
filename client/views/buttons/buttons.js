var A6sViewButtonsHelpers;

A6sViewButtonsHelpers = {
    profileUrl: function() {
        if (!A6s.settings.profileRoute) {
            return false;
        }
        return A6s.settings.profileRoute;
    },
    wrapLinksLi: function() {
        if (A6s.settings.wrapLinks) {
            return Template.wrapLinks;
        } else {
            return Template.noWrapLinks;
        }
    },
    wrapLinks: function() {
        return A6s.settings.wrapLinks;
    },
    beforeSignIn: function() {
        return A6s.settings.beforeSignIn;
    },
    beforeSignUp: function() {
        return A6s.settings.beforeSignUp;
    },
    beforeSignOut: function() {
        return A6s.settings.beforeSignOut;
    },
    beforeSignedInAs: function() {
        return A6s.settings.beforeSignedInAs;
    },
    A6sViewSignUp: function() {
        return A6s.settings.A6sViewSignUp;
    },
    profile: function() {
        return Meteor.user().profile;
    }
};

Template.A6sViewButtons.helpers(A6sViewButtonsHelpers);

Template.A6sViewButtons.helpers({
    signedInTemplate: function() {
        if (A6s.settings.signedInTemplate) {
            Template[A6s.settings.signedInTemplate].helpers(A6sViewButtonsHelpers);
            return Template[A6s.settings.signedInTemplate];
        } else {
            return Template.A6sViewSignedIn;
        }
    }
});

Template.A6sViewSignedIn.helpers(A6sViewButtonsHelpers);