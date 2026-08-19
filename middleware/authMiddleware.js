import jwt from 'jsonwebtoken'
import aysncHandler from 'express-async-handler'
import User from '../models/userModel.js'

const protect = aysncHandler(async(req,res,next)=>{
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        try{
            token = req.headers.authorization.split (' ')[1];
            
            const decoded = jwt.verify(token,process.env.JWT_ACCESS_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
             next();
        }catch(error){
            console.error(error);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
       
    }
    if(!token){
        res.status(401);
        throw new Error('Not authorized, no token');
    }

});
const authorize = (...roles)=>{
    return (req,res,next)=>{
        if(!roles.includes(req.user.role)){
            res.status(403); //forbidden
            throw new Error(` '${req.user.role}' role is not authorized to access this route`); 
        }
         next();
    }
}
export {protect, authorize};