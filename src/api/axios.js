import axios from 'axios';

// ─── Base instance ────────────────────────────────────────────────────────────
// Reads VITE_API_URL from .env — app will not connect if this is missing
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor ──────────────────────────────────────────────────────
// Attaches JWT access token to every outgoing request automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (import.meta.env.DEV) console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Refresh queue ────────────────────────────────────────────────────────────
// If multiple requests 401 at once, only one refresh fires — the rest wait here
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

// ─── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // No network response at all
    if (!error.response) {
      return Promise.reject({ message: 'Network error — check your connection', original: error });
    }

    // 401 — try a silent token refresh (skip for login/refresh endpoints themselves)
    if (error.response.status === 401 && !original._retry) {
      if (original.url?.includes('/auth/login') || original.url?.includes('/auth/refresh')) {
        const message = error.response?.data?.message || 'Invalid email or password.';
        return Promise.reject({ message, status: error.response?.status, data: error.response?.data });
      }

      original._retry = true;

      // Another refresh already in flight — queue this request until it finishes
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        // Use plain axios (not `api`) to avoid triggering this interceptor again
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { refreshToken }
        );

        // Backend envelope: { data: { accessToken, refreshToken } }
        const { accessToken, refreshToken: newRefresh } = data.data;

        localStorage.setItem('accessToken',  accessToken);
        localStorage.setItem('refreshToken', newRefresh);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        original.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return api(original); // retry the original request

      } catch (refreshErr) {
        // Refresh token expired — force logout
        processQueue(refreshErr, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('attendant');
        window.location.href = '/login';
        return Promise.reject(refreshErr);

      } finally {
        isRefreshing = false;
      }
    }

    // All other errors — normalize to { message, status, data }
    const message = error.response?.data?.message || error.message || 'Request failed';
    return Promise.reject({ message, status: error.response?.status, data: error.response?.data });
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:          (email, password)              => api.post('/auth/login', { email, password }),
  logout:         ()                             => api.post('/auth/logout'),
  refresh:        (refreshToken)                 => api.post('/auth/refresh', { refreshToken }),
  getMe:          ()                             => api.get('/auth/me'),
  changePassword: (currentPassword, newPassword) => api.put('/auth/change-password', { currentPassword, newPassword }),
  forgotPassword: (email)                        => api.post('/auth/forgot-password', { email }),
  resetPassword:  (email, otp, newPassword)      => api.post('/auth/reset-password', { email, otp, newPassword }),
};

// ─── Books ────────────────────────────────────────────────────────────────────
// getAll params: search, genre, author (ObjectId), available, showInactive, page, limit
// create fields: title*, isbn, author, genre, description, publishedYear, publisher, totalCopies, shelfLocation
// update fields: title, genre, description, publishedYear, publisher, totalCopies, shelfLocation, isActive
// delete: soft-delete if copies checked out, hard-delete if all returned
export const booksAPI = {
  getAll:  (params)   => api.get('/books', { params }),
  getById: (id)       => api.get(`/books/${id}`),
  create:  (data)     => api.post('/books', data),
  update:  (id, data) => api.put(`/books/${id}`, data),
  delete:  (id)       => api.delete(`/books/${id}`),
};

// ─── Authors ──────────────────────────────────────────────────────────────────
// getAll params: search, page, limit
// create/update fields: name*, bio, nationality
// delete: blocked if author has active books linked
export const authorsAPI = {
  getAll:  (params)   => api.get('/authors', { params }),
  getById: (id)       => api.get(`/authors/${id}`),
  create:  (data)     => api.post('/authors', data),
  update:  (id, data) => api.put(`/authors/${id}`, data),
  delete:  (id)       => api.delete(`/authors/${id}`),
};

// ─── Students ─────────────────────────────────────────────────────────────────
// getAll params: search, isActive, page, limit
// create fields: name*, email, admissionNumber (auto-generated if omitted)
// update fields: name, email, isActive — admissionNumber is immutable
// delete: blocked if student has active/overdue borrows
export const studentsAPI = {
  getAll:     (params)    => api.get('/students', { params }),
  getById:    (id)        => api.get(`/students/${id}`),
  getBorrows: (id, params)=> api.get(`/students/${id}/borrows`, { params }),
  create:     (data)      => api.post('/students', data),
  createBulk: (students)  => api.post('/students/bulk', { students }),
  update:     (id, data)  => api.put(`/students/${id}`, data),
  delete:     (id)        => api.delete(`/students/${id}`),
};

// ─── Borrows ──────────────────────────────────────────────────────────────────
// getAll params: status (active|overdue|returned), studentId, bookId, page, limit
// issue body: { bookId*, studentId*, dueDate*, notes } — issuedBy injected from JWT
// return body: { notes } — returnedTo injected from JWT
export const borrowsAPI = {
  getAll:  (params)    => api.get('/borrows', { params }),
  getById: (id)        => api.get(`/borrows/${id}`),
  issue:   (data)      => api.post('/borrows', data),
  return:  (id, notes) => api.put(`/borrows/${id}/return`, { notes }),
};

// ─── Attendants ───────────────────────────────────────────────────────────────
// getAll params: role, shift, showInactive, page, limit
// create fields: name*, email*, password*, staffId, role, shift
// update fields: name, email, role, shift, isActive — staffId immutable, password via /auth/change-password
// deactivate: SOFT DELETE — sets isActive: false, record stays in DB to preserve borrow history
export const attendantsAPI = {
  getAll:     (params)    => api.get('/attendants', { params }),
  getById:    (id)        => api.get(`/attendants/${id}`),
  create:     (data)      => api.post('/attendants', data),
  update:     (id, data)  => api.put(`/attendants/${id}`, data),
  deactivate: (id)        => api.delete(`/attendants/${id}`),
};

export default api;