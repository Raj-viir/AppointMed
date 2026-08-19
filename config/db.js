import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Error with primary URI: ${error.message}`);
        console.log('Attempting to fall back to local MongoDB...');
        try {
            const localUri = 'mongodb://127.0.0.1:27017/appointment_api';
            const localConn = await mongoose.connect(localUri);
            console.log(`MongoDB Connected to local fallback: ${localConn.connection.host}`);
        } catch (localError) {
            console.error(`Local MongoDB Fallback Error: ${localError.message}`);
            console.error('Database connection completely failed. Please ensure MongoDB is running locally or provide a valid MONGO_URI.');
        }
    }
};

export default connectDB;