/**
 * Centralized API client — handles fetch, tokens, and errors.
 */

const API_BASE = '/api';

// --- Token Management ---
const getToken = () => localStorage.getItem('accessToken');
const setToken = (token) => localStorage.setItem('accessToken', token);
const getUser = () => JSON.parse(localStorage.getItem('user') || 'null');
const setUser = (user) => localStorage.setItem('user', JSON.stringify(user));

const clearAuth = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
};

/**
 * Core fetch wrapper with auth headers and error handling.
 */
const request = async (endpoint, options = {}) => {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const res = await fetch(url, {
            ...options,
            headers,
            credentials: 'include', // for cookies (refresh token)
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || `Request failed with status ${res.status}`);
        }

        return data;
    } catch (err) {
        throw err;
    }
};

// --- Auth API ---
const authAPI = {
    register: (data) => request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    login: async (data) => {
        const result = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        setToken(result.accessToken);
        setUser(result);
        return result;
    },

    forgotPassword: (email) => request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
    }),

    resetPasswordOTP: (data) => request('/auth/reset-password-otp', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    logout: async () => {
        try {
            await request('/auth/logout', { method: 'POST' });
        } catch (e) { /* ignore */ }
        clearAuth();
        window.location.href = '/';
    },

    refreshToken: async () => {
        const result = await request('/auth/refresh-token', { method: 'POST' });
        setToken(result.accessToken);
        return result;
    },
};

// --- Doctor API ---
const doctorAPI = {
    getList: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/doctors/getList${qs ? '?' + qs : ''}`);
    },

    checkAvailability: (doctorId, date) =>
        request(`/doctors/availability?doctorId=${doctorId}&date=${date}`),

    getProfile: () => request('/doctors/profile'),

    createProfile: (data) => request('/doctors/profile', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    updateProfile: (data) => request('/doctors/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    getAppointments: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/doctors/appointments${qs ? '?' + qs : ''}`);
    },

    updateAppointmentStatus: (id, status, reason) => request(`/doctors/appointments/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, reason }),
    }),
};

// --- Appointment API ---
const appointmentAPI = {
    book: (data) => request('/appointments', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    getMyAppointments: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/appointments${qs ? '?' + qs : ''}`);
    },

    cancel: (id, reason) => request(`/appointments/${id}/cancel`, {
        method: 'PUT',
        body: JSON.stringify({ reason }),
    }),

    reschedule: (id, date, timeSlot) => request(`/appointments/${id}/reschedule`, {
        method: 'PUT',
        body: JSON.stringify({ date, timeSlot }),
    }),
};

// --- Admin API ---
const adminAPI = {
    getUsers: () => request('/admin/usersList'),

    addDoctor: (data) => request('/admin/addDoctor', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    verifyDoctor: (id, isVerified) => request(`/admin/verifyDoctor/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isVerified }),
    }),

    getAppointments: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/admin/appointments${qs ? '?' + qs : ''}`);
    },
};

// --- User API ---
const userAPI = {
    getProfile: () => request('/users/profile'),
};

// --- Toast Notifications ---
const showToast = (message, type = 'info') => {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.4s ease-in forwards';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
};

// --- Auth Guard ---
const requireAuth = () => {
    const user = getUser();
    const token = getToken();
    if (!user || !token) {
        window.location.href = '/';
        return null;
    }
    return user;
};

export {
    authAPI, doctorAPI, appointmentAPI, adminAPI, userAPI,
    getUser, getToken, setUser, setToken, clearAuth,
    showToast, requireAuth,
};
