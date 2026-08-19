/**
 * HTML email templates for the appointment system.
 * All templates share a consistent dark-themed design.
 */

const baseStyle = `
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #0f172a;
    color: #e2e8f0;
    padding: 40px 20px;
`;

const cardStyle = `
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    border-radius: 16px;
    padding: 32px;
    max-width: 500px;
    margin: 0 auto;
    border: 1px solid #475569;
`;

const headingStyle = `
    color: #38bdf8;
    margin-top: 0;
    font-size: 22px;
`;

const btnStyle = `
    display: inline-block;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #ffffff;
    padding: 12px 32px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    margin: 16px 0;
`;

const otpStyle = `
    font-size: 36px;
    font-weight: 700;
    letter-spacing: 8px;
    color: #38bdf8;
    text-align: center;
    padding: 16px;
    background: #0f172a;
    border-radius: 8px;
    margin: 16px 0;
`;

const footerStyle = `
    color: #94a3b8;
    font-size: 12px;
    text-align: center;
    margin-top: 24px;
`;

// --- Templates ---

export const otpEmail = (name, otp) => `
<div style="${baseStyle}">
  <div style="${cardStyle}">
    <h2 style="${headingStyle}">🔐 Password Reset</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>You requested a password reset. Use the OTP below to set your new password:</p>
    <div style="${otpStyle}">${otp}</div>
    <p>This code expires in <strong>10 minutes</strong>.</p>
    <p style="color: #94a3b8;">If you didn't request this, please ignore this email.</p>
    <div style="${footerStyle}">Appointment App &copy; ${new Date().getFullYear()}</div>
  </div>
</div>`;

export const appointmentBooked = (patientName, doctorName, date, timeSlot) => `
<div style="${baseStyle}">
  <div style="${cardStyle}">
    <h2 style="${headingStyle}">✅ Appointment Confirmed</h2>
    <p>Hi <strong>${patientName}</strong>,</p>
    <p>Your appointment has been booked successfully!</p>
    <table style="width:100%; margin: 16px 0; color: #e2e8f0;">
      <tr><td style="padding:8px 0; color:#94a3b8;">Doctor</td><td style="padding:8px 0; font-weight:600;">Dr. ${doctorName}</td></tr>
      <tr><td style="padding:8px 0; color:#94a3b8;">Date</td><td style="padding:8px 0; font-weight:600;">${date}</td></tr>
      <tr><td style="padding:8px 0; color:#94a3b8;">Time</td><td style="padding:8px 0; font-weight:600;">${timeSlot}</td></tr>
    </table>
    <p style="color: #94a3b8;">Please arrive 10 minutes before your scheduled time.</p>
    <div style="${footerStyle}">Appointment App &copy; ${new Date().getFullYear()}</div>
  </div>
</div>`;

export const appointmentCancelled = (name, doctorName, date, timeSlot, reason) => `
<div style="${baseStyle}">
  <div style="${cardStyle}">
    <h2 style="${headingStyle}">❌ Appointment Cancelled</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>Your appointment has been cancelled.</p>
    <table style="width:100%; margin: 16px 0; color: #e2e8f0;">
      <tr><td style="padding:8px 0; color:#94a3b8;">Doctor</td><td style="padding:8px 0;">Dr. ${doctorName}</td></tr>
      <tr><td style="padding:8px 0; color:#94a3b8;">Date</td><td style="padding:8px 0;">${date}</td></tr>
      <tr><td style="padding:8px 0; color:#94a3b8;">Time</td><td style="padding:8px 0;">${timeSlot}</td></tr>
      <tr><td style="padding:8px 0; color:#94a3b8;">Reason</td><td style="padding:8px 0;">${reason}</td></tr>
    </table>
    <div style="${footerStyle}">Appointment App &copy; ${new Date().getFullYear()}</div>
  </div>
</div>`;

export const appointmentRescheduled = (name, doctorName, oldDate, oldTime, newDate, newTime) => `
<div style="${baseStyle}">
  <div style="${cardStyle}">
    <h2 style="${headingStyle}">🔄 Appointment Rescheduled</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>Your appointment has been rescheduled.</p>
    <table style="width:100%; margin: 16px 0; color: #e2e8f0;">
      <tr><td style="padding:8px 0; color:#94a3b8;">Doctor</td><td style="padding:8px 0; font-weight:600;">Dr. ${doctorName}</td></tr>
      <tr><td style="padding:8px 0; color:#f87171; text-decoration: line-through;">Old: ${oldDate} at ${oldTime}</td></tr>
      <tr><td style="padding:8px 0; color:#4ade80; font-weight:600;">New: ${newDate} at ${newTime}</td></tr>
    </table>
    <div style="${footerStyle}">Appointment App &copy; ${new Date().getFullYear()}</div>
  </div>
</div>`;

export const doctorNewAppointment = (doctorName, patientName, date, timeSlot) => `
<div style="${baseStyle}">
  <div style="${cardStyle}">
    <h2 style="${headingStyle}">📋 New Appointment</h2>
    <p>Hi <strong>Dr. ${doctorName}</strong>,</p>
    <p>You have a new appointment booked:</p>
    <table style="width:100%; margin: 16px 0; color: #e2e8f0;">
      <tr><td style="padding:8px 0; color:#94a3b8;">Patient</td><td style="padding:8px 0; font-weight:600;">${patientName}</td></tr>
      <tr><td style="padding:8px 0; color:#94a3b8;">Date</td><td style="padding:8px 0; font-weight:600;">${date}</td></tr>
      <tr><td style="padding:8px 0; color:#94a3b8;">Time</td><td style="padding:8px 0; font-weight:600;">${timeSlot}</td></tr>
    </table>
    <div style="${footerStyle}">Appointment App &copy; ${new Date().getFullYear()}</div>
  </div>
</div>`;
