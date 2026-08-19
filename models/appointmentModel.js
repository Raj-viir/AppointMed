import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    doctor : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true,
    },
    patient : {
        type : mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    date: {
        type: Date,
        required : true,
    },
    timeSlot : {
        type: String,
        required: true,
    },
    Status :{
        type: String,
        enum : ['Scheduled' , 'Completed' , 'Cancelled' ],
        default : 'Scheduled',
    },
    reason: {
        type: String,
        default: '',
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending',
        // 'pending'  → PaymentIntent created, not yet paid
        // 'paid'     → Stripe confirmed payment, appointment is active
        // 'refunded' → reserved for future refund logic
    },
    paymentIntentId: {
        type: String,
        default: '',
        // Stripe PaymentIntent ID (pi_xxx...) — audit trail, refund reference
    },
    amount: {
        type: Number,
        default: 0,
        // Amount in paise (INR smallest unit): ₹500 → stored as 50000
        // Locked at booking time — doctor fee changes don't affect past appointments
    },
},
    {timestamps: true} 
);

// Compound unique index to prevent double bookings at the DB level.
// The partial filter ensures cancelled slots can be rebooked.
appointmentSchema.index(
    { doctor: 1, date: 1, timeSlot: 1 },
    { unique: true, partialFilterExpression: { Status: { $ne: 'Cancelled' } } }
);

const Appointment = mongoose.model("Appointment" , appointmentSchema);

export default Appointment;