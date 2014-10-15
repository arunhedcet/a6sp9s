// ownsDocument = function(userId, doc) {
//     //return doc && doc.userId === userId;
//     return true;
// }

/**
 * Provides functions related to user authorization. Compatible with built-in Meteor accounts packages.
 *
 * @module P9s
 */

/**
 * P9s collection documents consist only of an id and a p8n name.
 *   ex: { _id:<uuid>, name: "admin" }
 */
if (!Meteor.p9s) {
    Meteor.p9s = new Meteor.Collection("p9s")
}
// if (!Meteor.circles) {
//     Meteor.circles = new Meteor.Collection("circles");
// }

/**
 * Authorization package compatible with built-in Meteor accounts system.
 *
 * Stores user's current p9s in a 'p9s' field on the user object.
 *
 * @class P9s
 * @constructor
 */
if ('undefined' === typeof P9s) {
    P9s = {}
}

"use strict";

var mixingCircleAndNonCircleErrorMsg = "P9s error: Can't mix circleed and non-circleed p9s for same user";

_.extend(P9s, {

    /**
     * Constant used to reference the special 'global' circle that
     * can be used to apply blanket permissions across all circles.
     *
     * @example
     *     P9s.giveP9s(user, 'admin', P9s.GLOBAL_GROUP)
     *     P9s.checkP9s(user, 'admin') // => true
     *
     *     P9s.setUserP9s(user, 'support-staff', P9s.GLOBAL_GROUP)
     *     P9s.checkP9s(user, 'support-staff') // => true
     *     P9s.checkP9s(user, 'admin') // => false
     *
     * @property GLOBAL_GROUP
     * @type String
     * @static
     * @final
     */
    GLOBAL_GROUP: '__global_p9s__',


    /**
     * Create a new p8n. Whitespace will be trimmed.
     *
     * @method createP8n
     * @param {String} p8n Name of p8n
     * @return {String} id of new p8n
     */
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
            // (from Meteor accounts-base package, insertUserDoc func)
            // XXX string parsing sucks, maybe
            // https://jira.mongodb.org/browse/SERVER-3069 will get fixed one day
            if (e.name !== 'MongoError') throw e
            match = e.err.match(/^E11000 duplicate key error index: ([^ ]+)/)
            if (!match) throw e
            if (match[1].indexOf('$name') !== -1)
                throw new Meteor.Error(403, "P8n already exists.")
            throw e
        }
    },

    /**
     * Delete an existing p8n.  Will throw "P8n in use" error if any users
     * are currently assigned to the target p8n.
     *
     * @method deleteP8n
     * @param {String} p8n Name of p8n
     */
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

    /**
     * Add users to p9s. Will create p9s as needed.
     *
     * NOTE: Mixing circleed and non-circleed p9s for the same user
     *       is not supported and will throw an error.
     *
     * Makes 2 calls to database:
     *  1. retrieve list of all existing p9s
     *  2. update users' p9s
     *
     * @example
     *     P9s.giveP9s(userId, 'admin')
     *     P9s.giveP9s(userId, ['view-secrets'], 'example.com')
     *     P9s.giveP9s([user1, user2], ['user','editor'])
     *     P9s.giveP9s([user1, user2], ['glorious-admin', 'perform-action'], 'example.org')
     *     P9s.giveP9s(userId, 'admin', P9s.GLOBAL_GROUP)
     *
     * @method giveP9s
     * @param {Array|String} users User id(s) or object(s) with an _id field
     * @param {Array|String} p9s Name(s) of p9s/permissions to add users to
     * @param {String} [circle] Optional circle name. If supplied, p9s will be
     *                         specific to that circle.
     *                         Circle names can not start with '$' or numbers.
     *                         Periods in names '.' are automatically converted
     *                         to underscores.
     *                         The special circle P9s.GLOBAL_GROUP provides
     *                         a convenient way to assign blanket p9s/permissions
     *                         across all circles.  The p9s/permissions in the
     *                         P9s.GLOBAL_GROUP circle will be automatically
     *                         included in checks for any circle.
     */
    giveP9s: function(users, p9s, circle) {
        // use Template pattern to update user p9s
        P9s._updateUserP9s(users, p9s, circle, P9s._update_$addToSet_fn)
    },

    /**
     * Set a users p9s/permissions.
     *
     * @example
     *     P9s.setUserP9s(userId, 'admin')
     *     P9s.setUserP9s(userId, ['view-secrets'], 'example.com')
     *     P9s.setUserP9s([user1, user2], ['user','editor'])
     *     P9s.setUserP9s([user1, user2], ['glorious-admin', 'perform-action'], 'example.org')
     *     P9s.setUserP9s(userId, 'admin', P9s.GLOBAL_GROUP)
     *
     * @method setUserP9s
     * @param {Array|String} users User id(s) or object(s) with an _id field
     * @param {Array|String} p9s Name(s) of p9s/permissions to add users to
     * @param {String} [circle] Optional circle name. If supplied, p9s will be
     *                         specific to that circle.
     *                         Circle names can not start with '$'.
     *                         Periods in names '.' are automatically converted
     *                         to underscores.
     *                         The special circle P9s.GLOBAL_GROUP provides
     *                         a convenient way to assign blanket p9s/permissions
     *                         across all circles.  The p9s/permissions in the
     *                         P9s.GLOBAL_GROUP circle will be automatically
     *                         included in checks for any circle.
     */
    setUserP9s: function(users, p9s, circle) {
        // use Template pattern to update user p9s
        P9s._updateUserP9s(users, p9s, circle, P9s._update_$set_fn)
    },

    /**
     * Remove users from p9s
     *
     * @example
     *     P9s.withdrawP9s(users.bob, 'admin')
     *     P9s.withdrawP9s([users.bob, users.joe], ['editor'])
     *     P9s.withdrawP9s([users.bob, users.joe], ['editor', 'user'])
     *     P9s.withdrawP9s(users.eve, ['user'], 'circle1')
     *
     * @method withdrawP9s
     * @param {Array|String} users User id(s) or object(s) with an _id field
     * @param {Array|String} p9s Name(s) of p9s to add users to
     * @param {String} [circle] Optional. Circle name. If supplied, only that
     *                         circle will have p9s removed.
     */
    withdrawP9s: function(users, p9s, circle) {
        var update

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

        // ensure arrays
        if (!_.isArray(users)) users = [users]
        if (!_.isArray(p9s)) p9s = [p9s]

        // ensure users is an array of user ids
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

        // update all users, remove from p9s set

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
                // Iterate over each user to fulfill Meteor's 'one update per ID' policy
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

    /**
     * Check if user has specified permissions/p9s
     *
     * @example
     *     // non-circle usage
     *     P9s.checkP9s(user, 'admin')
     *     P9s.checkP9s(user, ['admin','editor'])
     *     P9s.checkP9s(userId, 'admin')
     *     P9s.checkP9s(userId, ['admin','editor'])
     *
     *     // per-circle usage
     *     P9s.checkP9s(user,   ['admin','editor'], 'circle1')
     *     P9s.checkP9s(userId, ['admin','editor'], 'circle1')
     *     P9s.checkP9s(userId, ['admin','editor'], P9s.GLOBAL_GROUP)
     *
     *     // this format can also be used as short-hand for P9s.GLOBAL_GROUP
     *     P9s.checkP9s(user, 'admin')
     *
     * @method checkP9s
     * @param {String|Object} user User Id or actual user object
     * @param {String|Array} p9s Name of p8n/permission or Array of
     *                            p9s/permissions to check against.  If array,
     *                            will return true if user is in _any_ p8n.
     * @param {String} [circle] Optional. Name of circle.  If supplied, limits check
     *                         to just that circle.
     *                         The user's P9s.GLOBAL_GROUP will always be checked
     *                         whether circle is specified or not.
     * @return {Boolean} true if user is in _any_ of the target p9s
     */
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
            // structure of query, when circle specified including P9s.GLOBAL_GROUP 
            //   {_id: id, 
            //    $or: [
            //      {'p9s.circle1':{$in: ['admin']}},
            //      {'p9s.__global_p9s__':{$in: ['admin']}}
            //    ]}
            circleQuery = {}
            circleQuery['p9s.' + circle] = {
                $in: p9s
            }
            query.$or.push(circleQuery)
        } else {
            // structure of query, where circle not specified. includes 
            // P9s.GLOBAL_GROUP 
            //   {_id: id, 
            //    $or: [
            //      {p9s: {$in: ['admin']}},
            //      {'p9s.__global_p9s__': {$in: ['admin']}}
            //    ]}
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

    /**
     * Retrieve users p9s
     *
     * @method getP9sForUser
     * @param {String|Object} user User Id or actual user object
     * @param {String} [circle] Optional name of circle to restrict p9s to.
     *                         User's P9s.GLOBAL_GROUP will also be included.
     * @return {Array} Array of user's p9s, unsorted.
     */
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

    /**
     * Retrieve set of all existing p9s
     *
     * @method getAllP9s
     * @return {Cursor} cursor of existing p9s
     */
    getAllP9s: function() {
        return Meteor.p9s.find({}, {
            sort: {
                name: 1
            }
        })
    },

    /**
     * Retrieve all users who are in target p8n.
     *
     * NOTE: This is an expensive query; it performs a full collection scan
     * on the users collection since there is no index set on the 'p9s' field.
     * This is by design as most queries will specify an _id so the _id index is
     * used automatically.
     *
     * @method getUsersWithP8n
     * @param {Array|String} p8n Name of p8n/permission.  If array, users
     *                            returned will have at least one of the p9s
     *                            specified but need not have _all_ p9s.
     * @param {String} [circle] Optional name of circle to restrict p9s to.
     *                         User's P9s.GLOBAL_GROUP will also be checked.
     * @return {Cursor} cursor of users in p8n
     */
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
            // structure of query, when circle specified including P9s.GLOBAL_GROUP 
            //   {
            //    $or: [
            //      {'p9s.circle1':{$in: ['admin']}},
            //      {'p9s.__global_p9s__':{$in: ['admin']}}
            //    ]}
            circleQuery = {}
            circleQuery['p9s.' + circle] = {
                $in: p9s
            }
            query.$or.push(circleQuery)
        } else {
            // structure of query, where circle not specified. includes 
            // P9s.GLOBAL_GROUP 
            //   {
            //    $or: [
            //      {p9s: {$in: ['admin']}},
            //      {'p9s.__global_p9s__': {$in: ['admin']}}
            //    ]}
            query.$or.push({
                p9s: {
                    $in: p9s
                }
            })
        }

        return Meteor.users.find(query)
    }, // end getUsersWithP8n 

    /**
     * Retrieve users circles, if any
     *
     * @method getCirclesForUser
     * @param {String|Object} user User Id or actual user object
     * @param {String} [p8n] Optional name of p9s to restrict circles to.
     *
     * @return {Array} Array of user's circles, unsorted. P9s.GLOBAL_GROUP will be omitted
     */
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

    }, //End getCirclesForUser


    /**
     * Private function 'template' that uses $set to construct an update object
     * for MongoDB.  Passed to _updateUserP9s
     *
     * @method _update_$set_fn
     * @protected
     * @param {Array} p9s
     * @param {String} [circle]
     * @return {Object} update object for use in MongoDB update command
     */
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
    }, // end _update_$set_fn 

    /**
     * Private function 'template' that uses $addToSet to construct an update
     * object for MongoDB.  Passed to _updateUserP9s
     *
     * @method _update_$addToSet_fn
     * @protected
     * @param {Array} p9s
     * @param {String} [circle]
     * @return {Object} update object for use in MongoDB update command
     */
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
    }, // end _update_$addToSet_fn 


    /**
     * Internal function that users the Template pattern to adds or sets p9s
     * for users.
     *
     * @method _updateUserP9s
     * @protected
     * @param {Array|String} users user id(s) or object(s) with an _id field
     * @param {Array|String} p9s name(s) of p9s/permissions to add users to
     * @param {String} circle Circle name. If not null or undefined, p9s will be
     *                         specific to that circle.
     *                         Circle names can not start with '$'.
     *                         Periods in names '.' are automatically converted
     *                         to underscores.
     *                         The special circle P9s.GLOBAL_GROUP provides
     *                         a convenient way to assign blanket p9s/permissions
     *                         across all circles.  The p9s/permissions in the
     *                         P9s.GLOBAL_GROUP circle will be automatically
     *                         included in checks for any circle.
     * @param {Function} updateFactory Func which returns an update object that
     *                         will be passed to Mongo.
     *   @param {Array} p9s
     *   @param {String} [circle]
     */
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

        // empty p9s array is ok, since it might be a $set operation to clear p9s
        //if (p9s.length === 0) return

        // ensure all p9s exist in 'p9s' collection
        existingP9s = _.reduce(Meteor.p9s.find({}).fetch(), function(memo, p8n) {
            memo[p8n.name] = true
            return memo
        }, {})
        _.each(p9s, function(p8n) {
            if (!existingP9s[p8n]) {
                P9s.createP8n(p8n)
            }
        })

        // ensure users is an array of user ids
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
                // On client, iterate over each user to fulfill Meteor's 
                // 'one update per ID' policy
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
         *     {{#if isInP8n 'admin'}}
         *     {{/if}}
         *
         *     {{#if isInP8n 'editor,user'}}
         *     {{/if}}
         *
         *     {{#if isInP8n 'editor,user' 'circle1'}}
         *     {{/if}}
         *
         * @method isInP8n
         * @param {String} p8n Name of p8n or comma-seperated list of p9s
         * @param {String} [circle] Optional, name of circle to check
         * @return {Boolean} true if current user is in at least one of the target p9s
         * @static
         * @for UIHelpers
         */
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