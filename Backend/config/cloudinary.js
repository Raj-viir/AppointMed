
import { v2 as cloudinary } from 'cloudinary'
const connectCloudinary = async()=>{
    
    cloudinary.config({
    cloud_name: process.env.CLOUNDINARY_NAME,
    api_key: process.env.UDINARY_API_KEY,
    api_secret_key: process.env.CLOUDINARY_SECRET_KEY
    })
}

export default connectCloudinary