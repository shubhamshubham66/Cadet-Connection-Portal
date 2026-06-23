/* ═══════════════════════════════════════════
   AUTH.JS — Password Login System
   Cadet Connection Portal
   Roles: Admin, Cadet
   ═══════════════════════════════════════════ */

// ─── Toast ───
function showToast(message, type) {
  type = type || 'success';
  var toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);padding:0.75rem 1.5rem;border-radius:8px;color:#fff;font-weight:600;font-size:0.85rem;z-index:9999;opacity:0;transition:opacity 0.3s;';
    document.body.appendChild(toast);
  }
  toast.className = 'toast toast-' + type + ' show';
  toast.style.opacity = '1';
  toast.style.background = type === 'success' ? '#2d5a27' : '#dc3545';
  toast.innerHTML = '<i class="fas fa-' + (type === 'success' ? 'check-circle' : 'times-circle') + '"></i> ' + message;
  setTimeout(function() { toast.style.opacity = '0'; }, 3000);
}

// ─── Logout ───
function logout() {
  localStorage.removeItem('ccp_user');
  // Detect if we are in a subfolder or root
  var path = window.location.pathname;
  if (path.indexOf('/officer/') !== -1 || path.indexOf('/cadet/') !== -1) {
    window.location.href = '../index.html';
  } else {
    window.location.href = 'index.html';
  }
}

// ─── Protect Pages ───
function requireAuth(allowedRoles) {
  var user = JSON.parse(localStorage.getItem('ccp_user') || 'null');
  if (!user || !user.loggedIn) {
    window.location.href = '../login.html';
    return null;
  }
  if (allowedRoles && allowedRoles.indexOf(user.role) === -1) {
    if (user.role === 'Admin') window.location.href = '../officer/admin-dashboard.html';
    else if (user.role === 'Cadet') window.location.href = '../cadet/dashboard.html';
    else window.location.href = '../login.html';
    return null;
  }
  return user;
}
