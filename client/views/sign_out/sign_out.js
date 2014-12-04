Template.A6sViewSignOut.events({
    'click #relogin': function(e) {

        Router.go('/sign-out');
        return false;
    }
});