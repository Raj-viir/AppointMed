import mongoose from "mongoose";
import validator from "validator";

const userSchema= new mongoose.Schema({
    name:{
        type:String,
        required:true,  
    },
    email:{
        type: String,
        required:true,
        unique: true,
        validate: validator.isEmail
    },
    password:{
        type: String,
        required:true,
    },
    role:{
        type: String,
        enum: ['patient', 'admin' ,'doctor'],
        default : 'patient',
    },
    isPasswordTemporary:{
        type:Boolean,
        default: false,
    },
    resetPasswordOTP:{
        type: String,
        default: undefined,
    },
    resetPasswordExpires:{
        type: Date,
        default: undefined,
    },

},{timestamps:true}
)
const User =mongoose.model('User', userSchema);
export default User;
