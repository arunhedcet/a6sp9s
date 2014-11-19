Package.describe({
    summary: "Meteor accounts and permissions.",
    version: '1.1.3',
    name: 'aruntk:a6sp9s',
    git: 'https://github.com/arunhedcet/a6sp9s'
});

Package.onUse(function(api) {
    api.versionsFrom("METEOR@0.9.0");

    api.use(['iron:router@1.0.0', 'softwarerero:accounts-t9n@1.0.0', 'joshowens:simple-form@0.1.8'], ['client', 'server']);

    api.use([
        'deps',
        'service-configuration',
        'accounts-base',
        'underscore',
        'templating',
        'handlebars',
        'session',
        'coffeescript',
        'less',
        'sha'
    ], 'client');
    api.addFiles(['shared/permissions.js'], ['client', 'server']);
    api.addFiles(['server/permissions.js'], 'server');
    api.export('P9s', ['client', 'server']);

    api.addFiles([
        'client/accounts.js',
        'client/accounts.css',
        'client/permissions.js',
        'client/account_helpers.js',
        'client/views/sign_in/sign_in.html',
        'client/views/sign_in/sign_in.js',
        'client/views/sign_up/sign_up.html',
        'client/views/sign_up/sign_up.js',
        'client/views/sign_up/extra_fields.html',
        'client/views/sign_up/extra_fields.js',
        'client/views/forgot_password/forgot_password.html',
        'client/views/forgot_password/forgot_password.js',
        'client/views/reset_password/reset_password.html',
        'client/views/reset_password/reset_password.js',
        'client/views/social/social.html',
        'client/views/social/social.js',
        'client/views/error/error.html',
        'client/views/error/error.js',
        'client/views/buttons/buttons.html',
        'client/views/buttons/_wrap_links.html',
        'client/views/buttons/signed_in.html',
        'client/views/buttons/buttons.js',
        'client/t9n/english.js'
    ], 'client');

    // Server
    api.use([
        'deps',
        'service-configuration',
        'accounts-password',
        'accounts-base',
        'underscore',
        'coffeescript'
    ], 'server');

    api.addFiles(['server/accounts.js'], 'server');


    // shared
    api.imply('accounts-base', ['client', 'server']);
    api.imply('accounts-password', ['client', 'server']);
    api.export('A6s', ['client', 'server']);
    api.addFiles(['shared/router_accounts.js'], ['client', 'server']);


});