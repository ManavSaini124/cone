const {Schema, model} = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const crypto = require('crypto');

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate:{
            validator: function(v){
                return validator.isEmail(v);
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    refreshToken: {
        type: String,
        default: null
    },

     otp: {
        type: String,
        default: null
    },
    otpExpiry: {
        type: Date,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    // For temporary registration data
    tempRegistrationData: {
        type: Object,
        default: null
    }

},{ timestamps: true }
);

userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            name: this.name,
            email: this.email
        },
        process.env.ACCESS_TOKEN_JWT_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRES_IN
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_JWT_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRES_IN
        }
    )
}

userSchema.methods.generateOTP = function() {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

        this.otp = hashedOTP;
        this.otpExpiry = Date.now() + 10 * 60 * 1000;

        return otp; // Return the plain OTP for sending to the user
}

userSchema.methods.verifyOTP = function(candidateOTP) {
    if (!this.otp || !this.otpExpiry) {
        return false;
    }

    if (Date.now() > this.otpExpiry) {
        return false;
    }

    const hashedCandidateOTP = crypto.createHash('sha256').update(candidateOTP).digest('hex');
    return this.otp === hashedCandidateOTP;
}

userSchema.methods.clearOTP = function() {
    this.otp = null;
    this.otpExpiry = null;
}

const User = model('User', userSchema);
module.exports = User;
