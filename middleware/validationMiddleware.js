import validator from 'validator';

/**
 * Validate registration request body.
 */
const validateRegistration = (req, res, next) => {
    const { name, email, password } = req.body;
    const errors = [];

    if (!name || name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }

    if (!email || !validator.isEmail(email)) {
        errors.push('A valid email address is required');
    }

    if (!password || password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }

    if (errors.length > 0) {
        res.status(400);
        throw new Error(errors.join('. '));
    }

    next();
};

/**
 * Validate appointment booking request body.
 */
const validateAppointmentBooking = (req, res, next) => {
    const { doctorId, date, timeSlot } = req.body;
    const errors = [];

    if (!doctorId) {
        errors.push('doctorId is required');
    }

    if (!date || !validator.isDate(date, { format: 'YYYY-MM-DD', strictMode: true })) {
        errors.push('A valid date in YYYY-MM-DD format is required');
    }

    if (!timeSlot || !/^\d{2}:\d{2}$/.test(timeSlot)) {
        errors.push('timeSlot must be in HH:mm format (e.g. "09:00")');
    }

    // Ensure the date is not in the past
    if (date) {
        const appointmentDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (appointmentDate < today) {
            errors.push('Cannot book an appointment in the past');
        }
    }

    if (errors.length > 0) {
        res.status(400);
        throw new Error(errors.join('. '));
    }

    next();
};

/**
 * Validate doctor profile creation request body.
 */
const validateDoctorProfile = (req, res, next) => {
    const { speciality, qualifications, experience } = req.body;
    const errors = [];

    if (!speciality || speciality.trim().length === 0) {
        errors.push('Speciality is required');
    }

    if (!qualifications || !Array.isArray(qualifications) || qualifications.length === 0) {
        errors.push('At least one qualification is required');
    }

    if (experience === undefined || experience === null || experience < 0) {
        errors.push('Experience must be a non-negative number');
    }

    if (errors.length > 0) {
        res.status(400);
        throw new Error(errors.join('. '));
    }

    next();
};

/**
 * Validate login request body.
 */
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email || !validator.isEmail(email)) {
        errors.push('A valid email address is required');
    }

    if (!password) {
        errors.push('Password is required');
    }

    if (errors.length > 0) {
        res.status(400);
        throw new Error(errors.join('. '));
    }

    next();
};

export { validateRegistration, validateAppointmentBooking, validateDoctorProfile, validateLogin };
