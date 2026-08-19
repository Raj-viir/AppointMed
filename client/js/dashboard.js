/**
 * Dashboard — role-based SPA logic
 */
import { authAPI, doctorAPI, appointmentAPI, adminAPI, requireAuth, showToast, getUser } from '/js/api.js';

const user = requireAuth();
if (!user) throw new Error('Not authenticated');

const content = document.getElementById('content');
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');
const sidebarNav = document.getElementById('sidebarNav');

document.getElementById('userRole').textContent = `${user.role.toUpperCase()} Panel`;
document.getElementById('logoutBtn').addEventListener('click', () => authAPI.logout());

// --- Navigation ---
const NAV = {
    patient: [
        { id: 'doctors', icon: '🩺', label: 'Find Doctors' },
        { id: 'myAppointments', icon: '📋', label: 'My Appointments' },
    ],
    doctor: [
        { id: 'doctorAppts', icon: '📋', label: 'My Appointments' },
        { id: 'doctorProfile', icon: '👤', label: 'My Profile' },
    ],
    admin: [
        { id: 'users', icon: '👥', label: 'Users' },
        { id: 'adminAppts', icon: '📋', label: 'All Appointments' },
    ],
};

let currentView = '';

function setupNav() {
    const items = NAV[user.role] || [];
    sidebarNav.innerHTML = items.map(i =>
        `<button class="nav-item" data-view="${i.id}"><span class="icon">${i.icon}</span>${i.label}</button>`
    ).join('');
    sidebarNav.addEventListener('click', e => {
        const btn = e.target.closest('[data-view]');
        if (btn) navigate(btn.dataset.view);
    });
    if (items.length) navigate(items[0].id);
}

function navigate(view) {
    currentView = view;
    sidebarNav.querySelectorAll('.nav-item').forEach(b =>
        b.classList.toggle('active', b.dataset.view === view)
    );
    VIEWS[view]?.();
}

// --- Helpers ---
const setPage = (title, sub) => { pageTitle.textContent = title; pageSubtitle.textContent = sub; };
const loading = () => { content.innerHTML = '<div class="loading-overlay"><span class="spinner"></span></div>'; };
const badge = (status) => `<span class="badge badge-${status.toLowerCase()}">${status}</span>`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday:'short', year:'numeric', month:'short', day:'numeric' });

function showModal(title, bodyHTML, actions = '') {
    const root = document.getElementById('modalRoot');
    root.innerHTML = `<div class="modal-overlay" id="modalOverlay"><div class="modal"><h3>${title}</h3>${bodyHTML}<div class="modal-actions">${actions}</div></div></div>`;
    document.getElementById('modalOverlay').addEventListener('click', e => {
        if (e.target.id === 'modalOverlay') root.innerHTML = '';
    });
}
function closeModal() { document.getElementById('modalRoot').innerHTML = ''; }

// ============================
// PATIENT VIEWS
// ============================
async function viewDoctors() {
    setPage('Find Doctors', 'Browse and book appointments');
    loading();
    try {
        const res = await doctorAPI.getList();
        const doctors = res.data || [];
        content.innerHTML = `
            <div class="search-bar">
                <input type="text" id="searchName" placeholder="Search by name...">
                <input type="text" id="filterSpeciality" placeholder="Speciality...">
                <input type="text" id="filterCity" placeholder="City...">
                <button class="btn btn-secondary btn-sm" id="searchBtn">🔍 Search</button>
            </div>
            <div class="card-grid" id="doctorList">${renderDoctors(doctors)}</div>`;
        document.getElementById('searchBtn').addEventListener('click', searchDoctors);
        content.addEventListener('click', handleDoctorAction);
    } catch (err) { content.innerHTML = `<p class="text-muted">${err.message}</p>`; }
}

function renderDoctors(doctors) {
    if (!doctors.length) return '<div class="empty-state"><div class="icon">🩺</div><p>No doctors found</p></div>';
    return doctors.map(d => `
        <div class="card">
            <div class="doctor-card">
                <div class="doctor-avatar">${(d.user?.name || 'D')[0]}</div>
                <div class="doctor-info">
                    <h3>Dr. ${d.user?.name || 'Unknown'}</h3>
                    <p>${d.speciality}</p>
                    <div class="doctor-meta">
                        <span>📧 ${d.user?.email || ''}</span>
                        <span>⏱ ${d.experience} yrs exp</span>
                        ${d.clinicAddress?.city ? `<span>📍 ${d.clinicAddress.city}</span>` : ''}
                    </div>
                </div>
            </div>
            <div style="margin-top:16px">
                <button class="btn btn-primary btn-sm" data-book="${d.user?._id}" data-name="${d.user?.name}">Book Appointment</button>
            </div>
        </div>`).join('');
}

async function searchDoctors() {
    const params = {};
    const s = document.getElementById('searchName').value.trim();
    const sp = document.getElementById('filterSpeciality').value.trim();
    const c = document.getElementById('filterCity').value.trim();
    if (s) params.search = s;
    if (sp) params.speciality = sp;
    if (c) params.city = c;
    try {
        const res = await doctorAPI.getList(params);
        document.getElementById('doctorList').innerHTML = renderDoctors(res.data || []);
    } catch (err) { showToast(err.message, 'error'); }
}

async function handleDoctorAction(e) {
    const bookBtn = e.target.closest('[data-book]');
    if (!bookBtn) return;
    const doctorId = bookBtn.dataset.book;
    const doctorName = bookBtn.dataset.name;
    showBookingModal(doctorId, doctorName);
}

function showBookingModal(doctorId, doctorName) {
    const today = new Date().toISOString().split('T')[0];
    showModal(`Book with Dr. ${doctorName}`, `
        <div class="form-group"><label>Date</label><input type="date" id="bookDate" min="${today}" required></div>
        <div id="slotsArea"></div>
        <input type="hidden" id="selectedSlot">
    `, `<button class="btn btn-secondary" onclick="document.getElementById('modalRoot').innerHTML=''">Cancel</button>
        <button class="btn btn-primary" id="confirmBookBtn" disabled>Confirm Booking</button>`);

    document.getElementById('bookDate').addEventListener('change', async (e) => {
        const date = e.target.value;
        const area = document.getElementById('slotsArea');
        area.innerHTML = '<span class="spinner"></span>';
        try {
            const res = await doctorAPI.checkAvailability(doctorId, date);
            const slots = res.data || [];
            if (!slots.length) { area.innerHTML = '<p class="text-muted">No available slots</p>'; return; }
            area.innerHTML = '<label style="display:block;margin-bottom:8px;font-size:13px;color:var(--text-secondary)">AVAILABLE SLOTS</label><div class="slot-grid">' +
                slots.map(s => `<button class="slot-btn" data-slot="${s}">${s}</button>`).join('') + '</div>';
            area.addEventListener('click', ev => {
                const sb = ev.target.closest('.slot-btn');
                if (!sb) return;
                area.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
                sb.classList.add('selected');
                document.getElementById('selectedSlot').value = sb.dataset.slot;
                document.getElementById('confirmBookBtn').disabled = false;
            });
        } catch (err) { area.innerHTML = `<p class="text-muted">${err.message}</p>`; }
    });

    document.getElementById('confirmBookBtn').addEventListener('click', async () => {
        const date = document.getElementById('bookDate').value;
        const timeSlot = document.getElementById('selectedSlot').value;
        if (!date || !timeSlot) return;
        try {
            await appointmentAPI.book({ doctorId, date, timeSlot });
            showToast('Appointment booked!', 'success');
            closeModal();
        } catch (err) { showToast(err.message, 'error'); }
    });
}

async function viewMyAppointments() {
    setPage('My Appointments', 'View and manage your bookings');
    loading();
    try {
        const res = await appointmentAPI.getMyAppointments();
        const appts = res.data || [];
        if (!appts.length) { content.innerHTML = '<div class="empty-state"><div class="icon">📋</div><p>No appointments yet</p></div>'; return; }
        content.innerHTML = `<div class="card table-container"><table>
            <thead><tr><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>${appts.map(a => `<tr>
                <td>${a.doctor?.name || 'N/A'}</td>
                <td>${fmtDate(a.date)}</td><td>${a.timeSlot}</td><td>${badge(a.Status)}</td>
                <td>${a.Status === 'Scheduled' ? `<button class="btn btn-danger btn-sm" data-cancel="${a._id}">Cancel</button>` : '—'}</td>
            </tr>`).join('')}</tbody></table></div>`;
        content.addEventListener('click', async e => {
            const cb = e.target.closest('[data-cancel]');
            if (!cb) return;
            try {
                await appointmentAPI.cancel(cb.dataset.cancel, 'Cancelled by patient');
                showToast('Appointment cancelled', 'success');
                viewMyAppointments();
            } catch (err) { showToast(err.message, 'error'); }
        });
    } catch (err) { content.innerHTML = `<p class="text-muted">${err.message}</p>`; }
}

// ============================
// DOCTOR VIEWS
// ============================
async function viewDoctorAppts() {
    setPage('My Appointments', 'Manage patient appointments');
    loading();
    try {
        const res = await doctorAPI.getAppointments();
        const appts = res.data || [];
        if (!appts.length) { content.innerHTML = '<div class="empty-state"><div class="icon">📋</div><p>No appointments</p></div>'; return; }
        content.innerHTML = `<div class="card table-container"><table>
            <thead><tr><th>Patient</th><th>Date</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>${appts.map(a => `<tr>
                <td>${a.patient?.name || 'N/A'}</td>
                <td>${fmtDate(a.date)}</td><td>${a.timeSlot}</td><td>${badge(a.Status)}</td>
                <td>${a.Status === 'Scheduled' ? `<button class="btn btn-success btn-sm" data-complete="${a._id}">✓ Complete</button>` : '—'}</td>
            </tr>`).join('')}</tbody></table></div>`;
        content.addEventListener('click', async e => {
            const cb = e.target.closest('[data-complete]');
            if (!cb) return;
            try {
                await doctorAPI.updateAppointmentStatus(cb.dataset.complete, 'Completed');
                showToast('Marked as completed', 'success');
                viewDoctorAppts();
            } catch (err) { showToast(err.message, 'error'); }
        });
    } catch (err) { content.innerHTML = `<p class="text-muted">${err.message}</p>`; }
}

async function viewDoctorProfile() {
    setPage('My Profile', 'Your doctor profile');
    loading();
    try {
        const profile = await doctorAPI.getProfile();
        content.innerHTML = `<div class="card" style="max-width:600px">
            <h3 style="margin-bottom:16px">${badge(profile.isVerified ? 'Verified' : 'Unverified')}</h3>
            <p><strong>Speciality:</strong> ${profile.speciality}</p>
            <p><strong>Experience:</strong> ${profile.experience} years</p>
            <p><strong>Qualifications:</strong> ${(profile.qualifications || []).join(', ')}</p>
            ${profile.clinicAddress ? `<p><strong>Clinic:</strong> ${[profile.clinicAddress.street, profile.clinicAddress.city, profile.clinicAddress.state].filter(Boolean).join(', ')}</p>` : ''}
            <h4 style="margin-top:20px;margin-bottom:8px">Availability</h4>
            ${(profile.availability || []).map(a => `<p>📅 ${a.day}: ${a.startTime} — ${a.endTime}</p>`).join('') || '<p class="text-muted">Not set</p>'}
        </div>`;
    } catch (err) {
        content.innerHTML = `<div class="card text-center" style="max-width:500px">
            <p class="mb-4">No profile found. Create one to get started.</p>
            <button class="btn btn-primary" id="createProfileBtn">Create Profile</button>
        </div>`;
        document.getElementById('createProfileBtn')?.addEventListener('click', showCreateProfileModal);
    }
}

function showCreateProfileModal() {
    showModal('Create Doctor Profile', `
        <div class="form-group"><label>Speciality</label><input type="text" id="pSpeciality" placeholder="Cardiologist"></div>
        <div class="form-group"><label>Experience (years)</label><input type="number" id="pExperience" min="0" placeholder="5"></div>
        <div class="form-group"><label>Qualifications (comma-separated)</label><input type="text" id="pQualifications" placeholder="MBBS, MD"></div>
    `, `<button class="btn btn-secondary" onclick="document.getElementById('modalRoot').innerHTML=''">Cancel</button>
        <button class="btn btn-primary" id="saveProfileBtn">Save</button>`);
    document.getElementById('saveProfileBtn').addEventListener('click', async () => {
        try {
            await doctorAPI.createProfile({
                speciality: document.getElementById('pSpeciality').value,
                experience: parseInt(document.getElementById('pExperience').value),
                qualifications: document.getElementById('pQualifications').value.split(',').map(s => s.trim()),
            });
            showToast('Profile created!', 'success');
            closeModal();
            viewDoctorProfile();
        } catch (err) { showToast(err.message, 'error'); }
    });
}

// ============================
// ADMIN VIEWS
// ============================
async function viewUsers() {
    setPage('Users', 'Manage all users and doctors');
    loading();
    try {
        const users = await adminAPI.getUsers();
        content.innerHTML = `<div class="card table-container"><table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
            <tbody>${users.map(u => `<tr>
                <td>${u.name}</td><td>${u.email}</td>
                <td>${badge(u.role.charAt(0).toUpperCase() + u.role.slice(1))}</td>
                <td>${fmtDate(u.createdAt)}</td>
            </tr>`).join('')}</tbody></table></div>`;
    } catch (err) { content.innerHTML = `<p class="text-muted">${err.message}</p>`; }
}

async function viewAdminAppts() {
    setPage('All Appointments', 'System-wide appointment overview');
    loading();
    try {
        const res = await adminAPI.getAppointments();
        const appts = res.data || [];
        if (!appts.length) { content.innerHTML = '<div class="empty-state"><div class="icon">📋</div><p>No appointments</p></div>'; return; }
        content.innerHTML = `<div class="card table-container"><table>
            <thead><tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
            <tbody>${appts.map(a => `<tr>
                <td>${a.patient?.name || 'N/A'}</td><td>${a.doctor?.name || 'N/A'}</td>
                <td>${fmtDate(a.date)}</td><td>${a.timeSlot}</td><td>${badge(a.Status)}</td>
            </tr>`).join('')}</tbody></table></div>`;
    } catch (err) { content.innerHTML = `<p class="text-muted">${err.message}</p>`; }
}

// --- View Router ---
const VIEWS = {
    doctors: viewDoctors,
    myAppointments: viewMyAppointments,
    doctorAppts: viewDoctorAppts,
    doctorProfile: viewDoctorProfile,
    users: viewUsers,
    adminAppts: viewAdminAppts,
};

setupNav();
