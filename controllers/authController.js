import User from '../models/userModel.js'
import bcrypt from 'bcryptjs'
import asyncHandler from 'express-async-handler'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import sendMail from '../config/mailer.js'
import { otpEmail } from '../utils/emailTemplates.js'

//Helper function to generate tokens;
const generateTokens= (res,userId,userRole)=>{
    const accessToken= jwt.sign(
        {
        id:userId,
        role:userRole,
        },
        process.env.JWT_ACCESS_SECRET,
        {expiresIn:'15m'}
    );
    const refreshToken= jwt.sign(
        {id:userId},
        process.env.JWT_REFRESH_SECRET,
        {expiresIn: '7d'}
    );

    res.cookie('refreshToken' , refreshToken,{
        httpOnly: true,
        secure: process.env.NODE_ENV==='production',
        sameSite : 'strict',
        maxAge: 7 * 24 * 60* 60 * 1000,
    });

    return accessToken;  
}


const registerUser = asyncHandler(async(req,res)=>{
    const {name, email , password, role} =req.body;

    const userExists = await User.findOne({email});
    if(userExists){
        res.status(400);
        throw new Error('User already exists');
    }

    // Only allow 'patient' or 'doctor' self-registration (admin must be set manually)
    const allowedRoles = ['patient', 'doctor'];
    const userRole = allowedRoles.includes(role) ? role : 'patient';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword= await bcrypt.hash(password,salt);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: userRole,
    });

    if(user){
        res.status(201).json({
            _id:user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    }else{
        res.status(400);
        throw new Error("Invalid User data");
        
    }

});

const loginUser = asyncHandler(async (req,res)=>{
    const {email,password}= req.body;
    const user = await User.findOne({email});

    // Fix: check user exists before comparing password
    if(!user){
        res.status(401);
        throw new Error("Invalid Credentials");
    }

    const isValid = await bcrypt.compare(password ,user.password);
    if(isValid){
        if(user.isPasswordTemporary){
            res.status(403);//forbidden
            return res.json({
                message: 'You must reset the temporary password before logging in',
                isPasswordTemporary: true,
            });
        }
        const accessToken = generateTokens(res , user._id, user.role);
        res.json({
            _id:user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            accessToken: accessToken,
        })

    }else{
        res.status(401);
        throw new Error("Invalid Credentials");
    }
});

const updatePassword = asyncHandler (async (req,res)=>{
    const {email,oldPassword,  newPassword } =req.body;
    const user = await User.findOne({email});
    if(!user){
        res.status(400);
        throw new Error("User Not Found");
    }
    if(!(await bcrypt.compare(oldPassword , user.password ))){
        res.status(401);
        throw new Error("Invalid Credentials");
    }
    if(!user.isPasswordTemporary){
        res.status(400);
        throw new Error('Password is not temporary. Use forgot password flow.')
    }

    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword , salt);
    user.password = newHashedPassword;
    user.isPasswordTemporary =false;
    await user.save();

    res.status(200).json({
        message: 'Password updated successfully.',
    });

})

// @desc    Send OTP to user's email for password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Email is required');
    }

    const user = await User.findOne({ email });

    if (!user) {
        // Don't reveal whether the email exists
        return res.status(200).json({
            message: 'If that email is registered, you will receive an OTP shortly.',
        });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Hash OTP before storing
    const salt = await bcrypt.genSalt(10);
    user.resetPasswordOTP = await bcrypt.hash(otp, salt);
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send email (fire-and-forget)
    sendMail(user.email, 'Password Reset OTP', otpEmail(user.name, otp));

    res.status(200).json({
        message: 'If that email is registered, you will receive an OTP shortly.',
    });
});

// @desc    Reset password using OTP
// @route   POST /api/auth/reset-password-otp
// @access  Public
const resetPasswordWithOTP = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        res.status(400);
        throw new Error('Email, OTP, and new password are required');
    }

    if (newPassword.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters long');
    }

    const user = await User.findOne({ email });

    if (!user || !user.resetPasswordOTP || !user.resetPasswordExpires) {
        res.status(400);
        throw new Error('Invalid or expired OTP');
    }

    // Check expiry
    if (user.resetPasswordExpires < new Date()) {
        user.resetPasswordOTP = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.status(400);
        throw new Error('OTP has expired. Please request a new one.');
    }

    // Verify OTP
    const isOTPValid = await bcrypt.compare(otp, user.resetPasswordOTP);
    if (!isOTPValid) {
        res.status(400);
        throw new Error('Invalid OTP');
    }

    // Set new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    user.isPasswordTemporary = false;
    await user.save();

    res.status(200).json({
        message: 'Password reset successfully. You can now log in.',
    });
});

// @desc    Refresh access token using refresh token cookie
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken;

    if (!token) {
        res.status(401);
        throw new Error('No refresh token provided');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            res.status(401);
            throw new Error('User not found');
        }

        const accessToken = generateTokens(res, user._id, user.role);
        res.json({ accessToken });
    } catch (error) {
        res.status(401);
        throw new Error('Invalid or expired refresh token');
    }
});

// @desc    Logout — clear refresh token cookie
// @route   POST /api/auth/logout
// @access  Public
const logout = asyncHandler(async (req, res) => {
    res.cookie('refreshToken', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ message: 'Logged out successfully' });
});


export { registerUser, loginUser, updatePassword, forgotPassword, resetPasswordWithOTP, refreshToken, logout };