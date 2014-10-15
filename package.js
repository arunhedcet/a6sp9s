Package.describe({
    summary: "a6s - accounts , p9s - permissions",
    version: '1.0.6',
    git: 'https://github.com/arunhedcet/a6sp9s'
});

Package.onUse(function(api) {
    api.versionsFrom("METEOR@0.9.4");

    api.use(['iron:router@0.9.4', 'mrt:accounts-t9n@0.0.2'], ['client', 'server']);

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
        'client/t9n/english.js',
        'client/t9n/french.js',
        'client/t9n/german.js',
        'client/t9n/italian.js',
        'client/t9n/polish.js',
        'client/t9n/spanish.js',
        'client/t9n/swedish.js',
        'client/t9n/portuguese.js',
        'client/t9n/slovene.js',
        'client/t9n/russian.js',
        'client/t9n/arabic.js'
    ], 'client');

    // SERVER
    api.use([
        'deps',
        'service-configuration',
        'accounts-password',
        'accounts-base',
        'underscore',
        'coffeescript'
    ], 'server');

    api.addFiles(['server/accounts.js'], 'server');
    api.addFiles(['server/permissions.js'], 'server');

    // CLIENT and SERVER
    api.imply('accounts-base', ['client', 'server']);
    api.imply('accounts-password', ['client', 'server']);
    api.export('A6s', ['client', 'server']);
    api.export('P9s', ['client', 'server']);
    api.addFiles(['shared/router_accounts.js'], ['client', 'server']);


});