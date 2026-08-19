import mongoose from "mongoose";

const DoctorSchema= new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        unique: true,
    },
    speciality:{
        type: String,
        required:true,
        default: 'General Physician',   
    },
    qualifications: {
        type: [String],
        required: true,
    },
    experience: {
        type: Number,
        required: true,
        min: 0,

    },
    clinicAddress: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
    },
    idProofLink: {
        type: String,
        default: '',
    },
    consultationFee: {
        type: Number,
        required: true,
        min: 0,
        default: 500,   // default ₹500; doctor sets this on their profile
    },
    isVerified: {
        type: Boolean,
        default: false, 
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    availability:[{
        day:{
            type:String,
          //  required:true,
            enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        },
        startTime: {
            type:String, // Storing as a string like "09:00"
           // required:true,
        },
        endTime: {
            type:String, // Storing as a string like "17:00"
           // required:true,
        },
    }],

}, {timestamps: true});

const Doctor = mongoose.model('Doctor' , DoctorSchema);

export default Doctor;