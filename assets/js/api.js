/* ═══════════════════════════════════════════
   API MODULE — Frontend-Backend Communication
   Cadet Connection Portal
   ═══════════════════════════════════════════ */

const API = {
  // Change this to your deployed backend URL
  BASE_URL: 'https://cadet-connection-portal.onrender.com/api',
  // For local development: 'http://localhost:5000/api'

  // Get stored token
  getToken() {
    const user = JSON.parse(localStorage.getItem('ccp_user') || '{}');
    return user.token || null;
  },

  // Set auth header
  headers(includeAuth = true) {
    const h = { 'Content-Type': 'application/json' };
    if (includeAuth) {
      const token = this.getToken();
      if (token) h['Authorization'] = 'Bearer ' + token;
    }
    return h;
  },

  // ─── AUTH ───
  async registerCadet(data) {
    const res = await fetch(this.BASE_URL + '/auth/register', {
      method: 'POST',
      headers: this.headers(false),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async loginCadet(identifier, password) {
    const res = await fetch(this.BASE_URL + '/auth/cadet-login', {
      method: 'POST',
      headers: this.headers(false),
      body: JSON.stringify({ identifier, password })
    });
    return res.json();
  },

  async loginAdmin(identifier, password) {
    const res = await fetch(this.BASE_URL + '/auth/admin-login', {
      method: 'POST',
      headers: this.headers(false),
      body: JSON.stringify({ identifier, password })
    });
    return res.json();
  },

  async getMe() {
    const res = await fetch(this.BASE_URL + '/auth/me', {
      headers: this.headers()
    });
    return res.json();
  },

  // ─── CADETS (Role-Based) ───
  async getCadets(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(this.BASE_URL + '/cadets?' + query, {
      headers: this.headers()
    });
    return res.json();
  },

  async getCadetById(id) {
    const res = await fetch(this.BASE_URL + '/cadets/' + id, {
      headers: this.headers()
    });
    return res.json();
  },

  async updateCadetStatus(id, status) {
    const res = await fetch(this.BASE_URL + '/cadets/' + id + '/status', {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  async getCadetStats() {
    const res = await fetch(this.BASE_URL + '/cadets/stats/overview', {
      headers: this.headers()
    });
    return res.json();
  },

  // ─── BATTALIONS ───
  async getBattalions() {
    const res = await fetch(this.BASE_URL + '/battalions', {
      headers: this.headers(false)
    });
    return res.json();
  },

  // ─── INSTITUTES ───
  async getInstitutes(battalion) {
    const params = battalion ? '?battalion=' + encodeURIComponent(battalion) : '';
    const res = await fetch(this.BASE_URL + '/institutes' + params, {
      headers: this.headers(false)
    });
    return res.json();
  },

  // ─── UPDATE PROFILE ───
  async updateProfile(data) {
    const res = await fetch(this.BASE_URL + '/auth/update-profile', {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // ─── CAMPS ───
  async getCamps() {
    const res = await fetch(this.BASE_URL + '/camps', { headers: this.headers() });
    return res.json();
  },

  async createCamp(data) {
    const res = await fetch(this.BASE_URL + '/camps', {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async registerForCamp(campId, cadetData) {
    const res = await fetch(this.BASE_URL + '/camps/' + campId + '/register', {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(cadetData)
    });
    return res.json();
  },

  async getCampRegistrations(campId) {
    const res = await fetch(this.BASE_URL + '/camps/' + campId + '/registrations', { headers: this.headers() });
    return res.json();
  },

  async exportCampCSV(campId) {
    const res = await fetch(this.BASE_URL + '/camps/' + campId + '/export', { headers: this.headers() });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'camp_registrations.csv';
      a.click();
      URL.revokeObjectURL(url);
      return { success: true };
    }
    return { success: false, message: 'Export failed' };
  },

  async deleteCamp(campId) {
    const res = await fetch(this.BASE_URL + '/camps/' + campId, {
      method: 'DELETE',
      headers: this.headers()
    });
    return res.json();
  },

  // ─── CHANGE PASSWORD ───
  async changePassword(currentPassword, newPassword) {
    const res = await fetch(this.BASE_URL + '/auth/change-password', {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    return res.json();
  },

  // ─── UPLOAD ───
  async uploadPhoto(file) {
    const formData = new FormData();
    formData.append('photo', file);
    const res = await fetch(this.BASE_URL + '/upload/photo', {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  // ─── CADET ELIGIBILITY & SELF-REGISTRATION ───
  async verifyEligibility(name, regimentalNumber) {
    const res = await fetch(this.BASE_URL + '/cadet/verify-eligibility', {
      method: 'POST',
      headers: this.headers(false),
      body: JSON.stringify({ name, regimentalNumber })
    });
    return res.json();
  },

  async sendOtp(identifier, purpose) {
    const res = await fetch(this.BASE_URL + '/cadet/send-otp', {
      method: 'POST',
      headers: this.headers(false),
      body: JSON.stringify({ identifier, purpose })
    });
    return res.json();
  },

  async verifyOtp(identifier, otp, purpose) {
    const res = await fetch(this.BASE_URL + '/cadet/verify-otp', {
      method: 'POST',
      headers: this.headers(false),
      body: JSON.stringify({ identifier, otp, purpose })
    });
    return res.json();
  },

  async registerVerifiedCadet(data) {
    const res = await fetch(this.BASE_URL + '/cadet/register', {
      method: 'POST',
      headers: this.headers(false),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // ─── ADMIN PRE-APPROVED & REGISTERED CADETS ───
  async getPreApprovedTemplate() {
    const res = await fetch(this.BASE_URL + '/admin/preapproved/template', {
      headers: this.headers()
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cadet_pre_approval_template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      return { success: true };
    }
    return { success: false, message: 'Template download failed' };
  },

  async uploadPreApprovedExcel(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(this.BASE_URL + '/admin/preapproved/upload', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + this.getToken()
      },
      body: formData
    });
    return res.json();
  },

  async getPreApprovedCadets(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(this.BASE_URL + '/admin/preapproved?' + query, {
      headers: this.headers()
    });
    return res.json();
  },

  async getAdminRegisteredCadets(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(this.BASE_URL + '/admin/cadets?' + query, {
      headers: this.headers()
    });
    return res.json();
  },

  async getAdminRegisteredCadetById(id) {
    const res = await fetch(this.BASE_URL + '/admin/cadets/' + id, {
      headers: this.headers()
    });
    return res.json();
  },

  // ─── SESSION HELPERS ───
  saveSession(user, token) {
    localStorage.setItem('ccp_user', JSON.stringify({
      ...user,
      token,
      loggedIn: true,
      loginTime: new Date().toISOString()
    }));
  },

  getSession() {
    return JSON.parse(localStorage.getItem('ccp_user') || 'null');
  },

  clearSession() {
    localStorage.removeItem('ccp_user');
  },

  isLoggedIn() {
    const user = this.getSession();
    return user && user.loggedIn && user.token;
  }
};
