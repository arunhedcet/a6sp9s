if (!Meteor.p9s) {
    Meteor.p9s = new Meteor.Collection("p9s")
}
if (!Meteor.circles) {
    Meteor.circles = new Meteor.Collection("circles")
}
if ('undefined' === typeof P9s) {
    P9s = {}
}

"use strict";

var mixingCircleAndNonCircleErrorMsg = "P9s error: Can't mix circled and non-circled p9s for same user";

_.extend(P9s, {


    GLOBAL_GROUP: '__global_p9s__',


    createP8n: function(p8n) {
        var id,
            match

        if (!p8n || 'string' !== typeof p8n || p8n.trim().length === 0) {
            return
        }

        try {
            id = Meteor.p9s.insert({
                'name': p8n.trim()
            })
            return id
        } catch (e) {
            if (e.name !== 'MongoError') throw e
            match = e.err.match(/^E11000 duplicate key error index: ([^ ]+)/)
            if (!match) throw e
            if (match[1].indexOf('$name') !== -1)
                throw new Meteor.Error(403, "P8n already exists.")
            throw e
        }
    },


    deleteP8n: function(p8n) {
        if (!p8n) return

        var foundExistingUser = Meteor.users.findOne({
            p9s: {
                $in: [p8n]
            }
        }, {
            fields: {
                _id: 1
            }
        })

        if (foundExistingUser) {
            throw new Meteor.Error(403, 'P8n in use')
        }

        var thisP8n = Meteor.p9s.findOne({
            name: p8n
        })
        if (thisP8n) {
            Meteor.p9s.remove({
                _id: thisP8n._id
            })
        }
    },

    giveP9s: function(users, p9s, circle) {
        P9s._updateUserP9s(users, p9s, circle, P9s._update_$addToSet_fn)
    },


    setUserP9s: function(users, p9s, circle) {
        P9s._updateUserP9s(users, p9s, circle, P9s._update_$set_fn)
    },

    withdrawP9s: function(users, p9s, circle) {
        var update

        if (!users) throw new Error("Missing 'users' param")
        if (!p9s) throw new Error("Missing 'p9s' param")
        if (circle) {
            if ('string' !== typeof circle)
                throw new Error("P9s error: Invalid parameter 'circle'. Expected 'string' type")
            if ('$' === circle[0])
                throw new Error("P9s error: circles can not start with '$'")

            circle = circle.replace(/\./g, '_')
        }

        if (!_.isArray(users)) users = [users]
        if (!_.isArray(p9s)) p9s = [p9s]

        users = _.reduce(users, function(memo, user) {
            var _id
            if ('string' === typeof user) {
                memo.push(user)
            } else if ('object' === typeof user) {
                _id = user._id
                if ('string' === typeof _id) {
                    memo.push(_id)
                }
            }
            return memo
        }, [])


        if (circle) {
            update = {
                $pullAll: {}
            }
            update.$pullAll['p9s.' + circle] = p9s
        } else {
            update = {
                $pullAll: {
                    p9s: p9s
                }
            }
        }

        try {
            if (Meteor.isClient) {
                _.each(users, function(user) {
                    Meteor.users.update({
                        _id: user
                    }, update)
                })
            } else {
                // On the server we can leverage MongoDB's $in operator for performance
                Meteor.users.update({
                    _id: {
                        $in: users
                    }
                }, update, {
                    multi: true
                })
            }
        } catch (ex) {
            var removeNonCircledP8nFromCircleMsg = 'Cannot apply $pull/$pullAll modifier to non-array'

            if (ex.name === 'MongoError' &&
                ex.err === removeNonCircledP8nFromCircleMsg) {
                throw new Error(mixingCircleAndNonCircleErrorMsg)
            }

            throw ex
        }
    },


    checkP9s: function(user, p9s, circle) {
        var id,
            userP9s,
            query,
            circleQuery,
            found = false

        // ensure array to simplify code
        if (!_.isArray(p9s)) {
            p9s = [p9s]
        }

        if (!user) return false
        if (circle) {
            if ('string' !== typeof circle) return false
            if ('$' === circle[0]) return false

            // convert any periods to underscores
            circle = circle.replace(/\./g, '_')
        }

        if ('object' === typeof user) {
            userP9s = user.p9s
            if (_.isArray(userP9s)) {
                return _.some(p9s, function(p8n) {
                    return _.contains(userP9s, p8n)
                })
            } else if ('object' === typeof userP9s) {
                // p9s field is dictionary of circles
                found = _.isArray(userP9s[circle]) && _.some(p9s, function(p8n) {
                    return _.contains(userP9s[circle], p8n)
                })
                if (!found) {
                    // not found in regular circle or circle not specified.  
                    // check P9s.GLOBAL_GROUP, if it exists
                    found = _.isArray(userP9s[P9s.GLOBAL_GROUP]) && _.some(p9s, function(p8n) {
                        return _.contains(userP9s[P9s.GLOBAL_GROUP], p8n)
                    })
                }
                return found
            }

            // missing p9s field, try going direct via id
            id = user._id
        } else if ('string' === typeof user) {
            id = user
        }

        if (!id) return false


        query = {
            _id: id,
            $or: []
        }

        // always check P9s.GLOBAL_GROUP
        circleQuery = {}
        circleQuery['p9s.' + P9s.GLOBAL_GROUP] = {
            $in: p9s
        }
        query.$or.push(circleQuery)

        if (circle) {

            circleQuery = {}
            circleQuery['p9s.' + circle] = {
                $in: p9s
            }
            query.$or.push(circleQuery)
        } else {

            query.$or.push({
                p9s: {
                    $in: p9s
                }
            })
        }

        found = Meteor.users.findOne(query, {
            fields: {
                _id: 1
            }
        })
        return found ? true : false
    },


    getP9sForUser: function(user, circle) {
        if (!user) return []
        if (circle) {
            if ('string' !== typeof circle) return []
            if ('$' === circle[0]) return []

            // convert any periods to underscores
            circle = circle.replace(/\./g, '_')
        }

        if ('string' === typeof user) {
            user = Meteor.users.findOne({
                _id: user
            }, {
                fields: {
                    p9s: 1
                }
            })

        } else if ('object' !== typeof user) {
            // invalid user object
            return []
        }

        if (!user || !user.p9s) return []

        if (circle) {
            return _.union(user.p9s[circle] || [], user.p9s[P9s.GLOBAL_GROUP] || [])
        }

        if (_.isArray(user.p9s))
            return user.p9s

        // using circles but circle not specified. return global circle, if exists
        return user.p9s[P9s.GLOBAL_GROUP] || []
    },


    getAllP9s: function() {
        return Meteor.p9s.find({}, {
            sort: {
                name: 1
            }
        })
    },

    getUsersWithP8n: function(p8n, circle) {
        var query,
            p9s = p8n,
            circleQuery

        // ensure array to simplify query logic
        if (!_.isArray(p9s)) p9s = [p9s]

        if (circle) {
            if ('string' !== typeof circle)
                throw new Error("P9s error: Invalid parameter 'circle'. Expected 'string' type")
            if ('$' === circle[0])
                throw new Error("P9s error: circles can not start with '$'")

            // convert any periods to underscores
            circle = circle.replace(/\./g, '_')
        }

        query = {
            $or: []
        }

        // always check P9s.GLOBAL_GROUP
        circleQuery = {}
        circleQuery['p9s.' + P9s.GLOBAL_GROUP] = {
            $in: p9s
        }
        query.$or.push(circleQuery)

        if (circle) {

            circleQuery = {}
            circleQuery['p9s.' + circle] = {
                $in: p9s
            }
            query.$or.push(circleQuery)
        } else {

            query.$or.push({
                p9s: {
                    $in: p9s
                }
            })
        }

        return Meteor.users.find(query)
    },
    getCirclesForUser: function(user, p8n) {
        var userCircles = [];

        if (!user) return []
        if (p8n) {
            if ('string' !== typeof p8n) return []
            if ('$' === p8n[0]) return []

            // convert any periods to underscores
            p8n = p8n.replace('.', '_')
        }

        if ('string' === typeof user) {
            user = Meteor.users.findOne({
                _id: user
            }, {
                fields: {
                    p9s: 1
                }
            })

        } else if ('object' !== typeof user) {
            // invalid user object
            return []
        }

        //User has no p9s or is not using circles
        if (!user || !user.p9s || _.isArray(user.p9s)) return []

        if (p8n) {
            _.each(user.p9s, function(circleP9s, circleName) {
                if (_.contains(circleP9s, p8n) && circleName !== P9s.GLOBAL_GROUP) {
                    userCircles.push(circleName);
                }
            });
            return userCircles;
        } else {
            return _.without(_.keys(user.p9s), P9s.GLOBAL_GROUP);
        }

    },
    _update_$set_fn: function(p9s, circle) {
        var update = {}

        if (circle) {
            // p9s is a key/value dict object
            update.$set = {}
            update.$set['p9s.' + circle] = p9s
        } else {
            // p9s is an array of strings
            update.$set = {
                p9s: p9s
            }
        }

        return update
    },
    _update_$addToSet_fn: function(p9s, circle) {
        var update = {}

        if (circle) {
            // p9s is a key/value dict object
            update.$addToSet = {}
            update.$addToSet['p9s.' + circle] = {
                $each: p9s
            }
        } else {
            // p9s is an array of strings
            update.$addToSet = {
                p9s: {
                    $each: p9s
                }
            }
        }

        return update
    },
    _updateUserP9s: function(users, p9s, circle, updateFactory) {
        if (!users) throw new Error("Missing 'users' param")
        if (!p9s) throw new Error("Missing 'p9s' param")
        if (circle) {
            if ('string' !== typeof circle)
                throw new Error("P9s error: Invalid parameter 'circle'. Expected 'string' type")
            if ('$' === circle[0])
                throw new Error("P9s error: circles can not start with '$'")

            // convert any periods to underscores
            circle = circle.replace(/\./g, '_')
        }

        var existingP9s,
            query,
            update

        // ensure arrays to simplify code
        if (!_.isArray(users)) users = [users]
        if (!_.isArray(p9s)) p9s = [p9s]

        // remove invalid p9s
        p9s = _.reduce(p9s, function(memo, p8n) {
            if (p8n && 'string' === typeof p8n && p8n.trim().length > 0) {
                memo.push(p8n.trim())
            }
            return memo
        }, [])


        existingP9s = _.reduce(Meteor.p9s.find({}).fetch(), function(memo, p8n) {
            memo[p8n.name] = true
            return memo
        }, {})
        _.each(p9s, function(p8n) {
            if (!existingP9s[p8n]) {
                P9s.createP8n(p8n)
            }
        })

        users = _.reduce(users, function(memo, user) {
            var _id
            if ('string' === typeof user) {
                memo.push(user)
            } else if ('object' === typeof user) {
                _id = user._id
                if ('string' === typeof _id) {
                    memo.push(_id)
                }
            }
            return memo
        }, [])

        // update all users
        update = updateFactory(p9s, circle)

        try {
            if (Meteor.isClient) {

                _.each(users, function(user) {
                    Meteor.users.update({
                        _id: user
                    }, update)
                })
            } else {
                // On the server we can use MongoDB's $in operator for 
                // better performance
                Meteor.users.update({
                        _id: {
                            $in: users
                        }
                    },
                    update, {
                        multi: true
                    })
            }
        } catch (ex) {
            var addNonCircleToCircledP9sMsg = 'Cannot apply $addToSet modifier to non-array',
                addCircled2NonCircledMsg = "can't append to array using string field name"

            if (ex.name === 'MongoError' &&
                (ex.err === addNonCircleToCircledP9sMsg ||
                    ex.err.substring(0, 45) === addCircled2NonCircledMsg)) {
                throw new Error(mixingCircleAndNonCircleErrorMsg)
            }

            throw ex
        }
    } // end _updateUserP9s

}) // end _.extend(P9s ...)

if (Meteor.isClient) {

    P9s._uiHelpers = {

        isInP8n: function(p8n, circle) {
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
};