/* ═══════════════════════════════════════════
   CADET CONNECTION PORTAL — MAIN JAVASCRIPT
   ═══════════════════════════════════════════ */

// ─── Initialize AOS ───
document.addEventListener('DOMContentLoaded', function () {
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      offset: 50
    });
  }

  initNavbar();
  initProfileDropdown();
  updateProfileIcon();
});

// ─── Navbar Scroll Effect ───
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  window.addEventListener('scroll', function () {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile hamburger
  const hamburger = document.querySelector('.nav-hamburger');
  const navMenu = document.querySelector('.nav-menu');
  const overlay = document.querySelector('.mobile-overlay');

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('open');
      if (overlay) overlay.classList.toggle('show');
    });

    if (overlay) {
      overlay.addEventListener('click', function () {
        hamburger.classList.remove('active');
        navMenu.classList.remove('open');
        overlay.classList.remove('show');
      });
    }

    // Close menu on link click
    navMenu.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('active');
        navMenu.classList.remove('open');
        if (overlay) overlay.classList.remove('show');
      });
    });
  }

  // Active link highlight
  highlightActiveLink();
}

// ─── Highlight Active Nav Link ───
function highlightActiveLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(function (link) {
    const href = link.getAttribute('href');
    if (href && href.includes(currentPage)) {
      link.classList.add('active');
    }
  });
}

// ─── Profile Dropdown ───
function initProfileDropdown() {
  const profileBtn = document.querySelector('.nav-profile-btn');
  const dropdown = document.querySelector('.nav-profile-dropdown');

  if (profileBtn && dropdown) {
    profileBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    document.addEventListener('click', function () {
      dropdown.classList.remove('show');
    });
  }
}

// ─── Update Profile Icon Based on Login ───
function updateProfileIcon() {
  const profileBtn = document.querySelector('.nav-profile-btn');
  if (!profileBtn) return;

  const user = JSON.parse(localStorage.getItem('ccp_user') || 'null');
  if (user && user.name) {
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    profileBtn.textContent = initials;
    profileBtn.title = user.name;
  } else {
    profileBtn.innerHTML = '<i class="fas fa-user"></i>';
  }
}

// ─── Toast Notification ───
function showToast(message, type) {
  type = type || 'success';
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.className = 'toast toast-' + type + ' show';
  toast.innerHTML = '<i class="fas fa-' + (type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'exclamation-circle') + '"></i> ' + message;

  setTimeout(function () {
    toast.classList.remove('show');
  }, 3000);
}

// ─── Counter Animation ───
function animateCounters() {
  const counters = document.querySelectorAll('.counter');
  counters.forEach(function (counter) {
    const target = parseInt(counter.getAttribute('data-target'));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(function () {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      counter.textContent = Math.floor(current).toLocaleString();
    }, 16);
  });
}

// ─── Intersection Observer for Counter Animation ───
function initCounterObserver() {
  const statsSection = document.querySelector('.stats-section');
  if (!statsSection) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCounters();
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  observer.observe(statsSection);
}

// ─── Sidebar Toggle (Dashboard) ───
function initSidebarToggle() {
  const toggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.sidebar') || document.querySelector('.cadet-sidebar');

  if (toggle && sidebar) {
    toggle.addEventListener('click', function () {
      sidebar.classList.toggle('open');
      // Show/hide overlay
      let overlay = document.querySelector('.sidebar-overlay') || document.querySelector('.cadet-sidebar-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = sidebar.classList.contains('cadet-sidebar') ? 'cadet-sidebar-overlay' : 'sidebar-overlay';
        sidebar.parentElement.appendChild(overlay);
      }
      overlay.classList.toggle('show');
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!sidebar.contains(e.target) && !toggle.contains(e.target) && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        const overlay = document.querySelector('.sidebar-overlay.show') || document.querySelector('.cadet-sidebar-overlay.show');
        if (overlay) overlay.classList.remove('show');
      }
    });
  }
}

// ─── Check Authentication ───
function checkAuth(requiredRole) {
  const user = JSON.parse(localStorage.getItem('ccp_user') || 'null');
  if (!user) {
    window.location.href = '../login.html';
    return null;
  }
  if (requiredRole && user.role !== requiredRole) {
    redirectToDashboard(user.role);
    return null;
  }
  return user;
}

// ─── Redirect to Correct Dashboard ───
function redirectToDashboard(role) {
  switch (role) {
    case 'CO':
      window.location.href = '/officer/co-dashboard.html';
      break;
    case 'ANO':
      window.location.href = '/officer/ano-dashboard.html';
      break;
    case 'SUO':
      window.location.href = '/officer/suo-dashboard.html';
      break;
    case 'Cadet':
      window.location.href = '/cadet/dashboard.html';
      break;
    default:
      window.location.href = '/login.html';
  }
}

// ─── Logout ───
function logout() {
  localStorage.removeItem('ccp_user');
  window.location.href = '../login.html';
}

// ─── Format Date ───
function formatDate(dateStr) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString('en-IN', options);
}
