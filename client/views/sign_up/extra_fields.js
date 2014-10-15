Template.a6sViewExtraSignUpFields.helpers({
    extraSignUpFields: function() {
        return A6s.settings.extraSignUpFields;
    }
});

Template._a6sViewExtraSignUpField.helpers({
    isTextField: function() {
        return this.type !== "check_box";
    },
    isCheckbox: function() {
        return this.type === "check_box";
    }
});