import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
const getMyProfile = asyncHandler(async(req,res)=>{
    res.status(200).json(req.user);
});


export {getMyProfile};