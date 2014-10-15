/**
 * P9s collection documents consist only of an id and a p8n name.
 *   ex: { _id:<uuid>, name: "admin" }
 */
if (!Meteor.p9s) {
    Meteor.p9s = new Meteor.Collection("p9s")

    // Create default indexes for p9s collection
    Meteor.p9s._ensureIndex('name', {
        unique: 1
    })
}


/**
 * Always publish logged-in user's p9s so client-side
 * checks can work.
 */
Meteor.publish(null, function() {
    var userId = this.userId,
        fields = {
            p9s: 1
        }

    return Meteor.users.find({
        _id: userId
    }, {
        fields: fields
    })
})