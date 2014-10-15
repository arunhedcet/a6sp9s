/**
 * Convenience functions for use on client.
 *
 * NOTE: You must restrict user actions on the server-side; any
 * client-side checks are strictly for convenience and must not be
 * trusted.
 *
 * @module UIHelpers
 */

////////////////////////////////////////////////////////////
// UI helpers
//
// Use a semi-private variable rather than declaring UI
// helpers directly so that we can unit test the helpers.
// XXX For some reason, the UI helpers are not registered 
// before the tests run.
//
P9s._uiHelpers = {

    /**
     * UI helper to check if current user is in at least one
     * of the target p9s.  For use in client-side templates.
     *
     * @example
     *     {{#if hasP8n 'admin'}}
     *     {{/if}}
     *
     *     {{#if hasP8n 'editor,user'}}
     *     {{/if}}
     *
     *     {{#if hasP8n 'editor,user' 'circle1'}}
     *     {{/if}}
     *
     * @method hasP8n
     * @param {String} p8n Name of p8n or comma-seperated list of p9s
     * @param {String} [circle] Optional, name of circle to check
     * @return {Boolean} true if current user is in at least one of the target p9s
     * @static
     * @for UIHelpers
     */
    hasP8n: function(p8n, circle) {
        var user = Meteor.user(),
            comma = (p8n || '').indexOf(','),
            p9s

        if (!user) return false
        if (!Match.test(p8n, String)) return false

        if (comma !== -1) {
            p9s = _.reduce(p8n.split(','), function(memo, r) {
                if (!r || !r.trim()) {
                    return memo
                }
                memo.push(r.trim())
                return memo
            }, [])
        } else {
            p9s = [p8n]
        }

        if (Match.test(circle, String)) {
            return P9s.checkP9s(user, p9s, circle)
        }

        return P9s.checkP9s(user, p9s)
    }
}

if (Package.ui) {
    _.each(P9s._uiHelpers, function(func, name) {
        Package.ui.UI.registerHelper(name, func)
    })
} else if (Package.handlebars) {
    _.each(P9s._uiHelpers, function(func, name) {
        Package.handlebars.Handlebars.registerHelper(name, func)
    })
} else {
    console.log && console.log('WARNING: P9s template helpers not registered. Handlebars or UI package not found')
}