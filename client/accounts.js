 if (Meteor.isClient) {
     A6s = {
         settings: {
             wrapLinks: true,
             homeRoute: '/home',
             dashboardRoute: '/dashboard',
             passwordSignupFields: 'EMAIL_ONLY',
             emailToLower: true,
             usernameToLower: false,
             A6sViewSignUp: '/sign-up',
             extraSignUpFields: [],
             showOtherLoginServices: true
         },
         isStringEmail: function(email) {
             var emailPattern;
             emailPattern = /^([\w.-]+)@([\w.-]+)\.([a-zA-Z.]{2,6})$/i;
             if (email.match(emailPattern)) {
                 return true;
             } else {
                 return false;
             }
         },
         config: function(appConfig) {
             var signUpRoute;
             this.settings = _.extend(this.settings, appConfig);
             T9n.defaultLanguage = "en";
             if (appConfig.language) {
                 T9n.language = appConfig.language;
             }
             if (appConfig.signUpTemplate) {
                 signUpRoute = Router.routes['A6sViewSignUp'];
                 return signUpRoute.options.template = appConfig.signUpTemplate;
             }
         },
         signInRequired: function(router, extraCondition) {




             if (extraCondition == null) {
                 extraCondition = true;
             }
             if (!Meteor.loggingIn()) {
                 if (!(Meteor.user() && extraCondition)) {
                     return router.next();
                 } else {
                     Session.set('fromWhere', router.url);
                     Router.go('/sign-in');
                     return Session.set('A6sViewError', t9n('error.signInRequired'));

                 }
             }
         }
     };

     this.A6s = A6s;
     T9NHelper = (function() {
         function T9NHelper() {}

         T9NHelper.translate = function(code) {
             return T9n.get(code, "error.accounts");
         };

         T9NHelper.accountsError = function(err) {
             return Session.set('A6sViewError', this.translate(err.reason));
         };

         return T9NHelper;

     })();
 }