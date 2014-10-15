if (!Meteor.p9s) {
    Meteor.p9s = new Meteor.Collection("p9s")

    Meteor.p9s._ensureIndex('name', {
        unique: 1
    })
}


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