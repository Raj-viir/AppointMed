# AppointMed - Doctor Booking Platform

A comprehensive, role-based online platform for booking doctor appointments, featuring dynamic slot generation, secure authentication, and robust concurrency control.

## 🚀 Features by Role

### 👨‍⚕️ Doctors
- **Profile Management:** Set up specialities, qualifications, and upload verification documents.
- **Dynamic Availability:** Define specific working hours per day.
- **Appointment Dashboard:** View scheduled, completed, and cancelled appointments.
- **Earnings Tracking:** Real-time calculation of generated revenue from consultation fees.

### 🏥 Patients
- **Unified Search:** Search across both User records (doctor names) and Doctor records (speciality, city, state) via a single unified search bar.
- **Smart Booking:** Automatically generates 1-hour time slots based on the doctor's real-time schedule, intelligently subtracting already-booked slots.
- **Optional Online Payments:** Secure integration with Stripe for pre-paying consultation fees.
- **Rescheduling:** Atomic reschedule flows ensure patients never lose an appointment if their new selected slot is already taken.

### 🛡️ Administrators
- **Verification Workflow:** Review uploaded medical licenses to approve or reject doctor profiles. Unapproved doctors remain invisible in search.
- **Platform Analytics:** Real-time dashboard showing total users, revenue, and top-performing doctors.
- **Centralized Management:** Add new doctors directly with temporary passwords for secure onboarding.

---

## 🏗️ Architecture & Engineering Highlights

This project utilizes a **Monolithic MVC Architecture** built on Node.js, Express, and MongoDB. It solves several complex engineering challenges commonly found in production scheduling systems:

### 1. Database-Level Race Condition Prevention
**The Problem:** In a high-concurrency environment, if two patients request the same 10:00 AM slot at the exact same millisecond, application-level checks (indOne before create) fail due to the time gap between querying and writing.
**The Solution:** Implemented a Compound Unique Index in MongoDB (doctor, date, 	imeSlot) with a partialFilterExpression (excluding 'Cancelled' status). This delegates uniqueness enforcement to the database layer atomically. The application catches the E11000 Duplicate Key Error and elegantly translates it into an HTTP 409 Conflict.

### 2. Manual Two-Phase Rollback for Rescheduling
**The Problem:** Rescheduling requires cancelling an old appointment and creating a new one. If creating the new appointment fails (e.g., slot taken), the patient is left with zero appointments.
**The Solution:** Implemented a manual rollback pattern. The system creates the new slot first. If it succeeds, it safely releases the old slot. If the old slot release fails (due to transient network issues), it degrades gracefully by logging the inconsistency for admin resolution rather than punishing the patient.

### 3. Cross-Collection Unified Search Algorithm
**The Problem:** Doctor names are stored in the User collection (for auth), but their specialities and locations are stored in the Doctor collection.
**The Solution:** Implemented a two-phase query merge algorithm. Phase 1 queries the Doctor collection using an $or regex match for speciality and location. Phase 2 queries the User collection for name matches, maps to the corresponding Doctor IDs, and deduplicates the merged result set in memory O(1) time using a JavaScript Set.

### 4. Zero-Trust API Security
- **IDOR Protection:** Every sensitive endpoint (like cancelling an appointment) verifies that the 
eq.user.id matches the document's owner ObjectId.
- **Role-Based Access Control (RBAC):** Middleware intercepts routes enforcing dmin, doctor, or patient boundaries.

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas, Mongoose
- **Caching & Rate Limiting:** Redis, Upstash
- **Security:** JSON Web Tokens (JWT), bcryptjs, express-rate-limit
- **Payments:** Stripe API
- **Frontend (Client):** React.js, Tailwind CSS, Redux Toolkit

---

## 💻 How to Run the Project Locally

### 1. Prerequisites
- Node.js (v16+ recommended)
- A MongoDB cluster URL
- A Stripe Developer Account (Test Mode)

### 2. Environment Variables
Create a .env file in the root directory based on this template:

\\env
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=your_mongodb_connection_string

# JWT
JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret

# Redis (for Rate Limiting)
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
REDIS_PASSWORD=your_redis_password

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=your_email@gmail.com

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
\
### 3. Installation
Open your terminal and install dependencies for both backend and frontend:

\\ash
# Install backend dependencies
npm install

# Install frontend dependencies
npm run client:install
\
### 4. Running the Application
You will need two terminal windows.

**Terminal 1 (Backend):**
\\ash
npm run dev
\*Runs the Express API on http://localhost:5000*

**Terminal 2 (Frontend):**
\\ash
npm run client:dev
\*Runs the React application on http://localhost:5173*

---
*Developed as part of a comprehensive Full-Stack placement project demonstrating production-ready backend engineering.*
