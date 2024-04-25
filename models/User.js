const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'please add a name']
    },
    email: {
        type: String,
        required: [true, 'please add an email'],
        unique : true,
        match : [/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'please add a valid email']
    },
    role : {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required:[true, 'please add a password'],
        minlength: 6,
        select: false
    },
    telephone: {
        type: String,
        required: [true, 'please add telephone number'],
        match : [/^(0[689]{1})+([0-9]{8})+$/, 'please add a valid telephone nuumber']
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }

});


//Encrypt user password using bcrypt
UserSchema.pre('save', async function(next) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});




// sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
    return jwt.sign({id:this._id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
}


//match user entered password
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}



module.exports = mongoose.model('User', UserSchema);