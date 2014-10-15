P9s._uiHelpers = {

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