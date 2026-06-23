/* ═══════════════════════════════════════════
   AUTH.JS — OTP Login System
   Cadet Connection Portal
   ═══════════════════════════════════════════ */

let countdownInterval = null;

// ─── Send OTP (Step 1 → Step 2) ───
function sendOTP(e) {
  e.preventDefault();

  const loginId = document.getElementById('loginId').value.trim();
  const role = document.getElementById('role').value;

  if (!loginId || !role) {
    showToast('Please fill all fields', 'error');
    return;
  }

  // Mask the contact info
  let masked = loginId;
  if (loginId.includes('@')) {
    const parts = loginId.split('@');
    masked = parts[0].slice(0, 2) + '***@' + parts[1];
  } else if (loginId.length >= 10) {
    masked = '+91 XXXXX XX' + loginId.slice(-3);
  }

  document.getElementById('otpMessage').textContent = 'OTP sent to ' + masked;

  // Switch to step 2
  document.getElementById('step1').classList.add('hidden');
  document.getElementById('step2').classList.remove('hidden');

  // Focus first OTP box
  document.querySelector('.otp-box[data-index="0"]').focus();

  // Start countdown
  startCountdown(45);

  showToast('OTP sent successfully!', 'success');
}

// ─── Verify OTP (Step 2 → Dashboard) ───
function verifyOTP(e) {
  e.preventDefault();

  const boxes = document.querySelectorAll('.otp-box');
  let otp = '';
  boxes.forEach(function(box) { otp += box.value; });

  if (otp.length !== 6) {
    showToast('Please enter complete 6-digit OTP', 'error');
    return;
  }

  // Mock: any 6-digit OTP is valid
  if (otp.length === 6 && /^\d{6}$/.test(otp)) {
    const role = document.getElementById('role').value;
    const loginId = document.getElementById('loginId').value.trim();

    // Save to localStorage
    const userData = {
      loginId: loginId,
      role: role,
      name: getMockName(role),
      loggedIn: true,
      loginTime: new Date().toISOString()
    };

    localStorage.setItem('ccp_user', JSON.stringify(userData));

    showToast('Login Successful! Redirecting...', 'success');

    // Redirect by role
    setTimeout(function() {
      switch (role) {
        case 'CO':
          window.location.href = 'officer/co-dashboard.html';
          break;
        case 'ANO':
          window.location.href = 'officer/ano-dashboard.html';
          break;
        case 'SUO':
          window.location.href = 'officer/suo-dashboard.html';
          break;
        case 'Cadet':
          window.location.href = 'cadet/dashboard.html';
          break;
        default:
          window.location.href = 'index.html';
      }
    }, 1500);
  } else {
    showToast('Invalid OTP. Please try again.', 'error');
  }
}

// ─── Go Back to Step 1 ───
function goBack() {
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step1').classList.remove('hidden');
  clearOTPBoxes();
  if (countdownInterval) clearInterval(countdownInterval);
}

// ─── OTP Box Handling ───
document.addEventListener('DOMContentLoaded', function() {
  const boxes = document.querySelectorAll('.otp-box');

  boxes.forEach(function(box, index) {
    box.addEventListener('input', function(e) {
      const val = e.target.value;

      if (val && /^\d$/.test(val)) {
        box.classList.add('filled');
        if (index < 5) {
          boxes[index + 1].focus();
        }
      } else {
        box.value = '';
        box.classList.remove('filled');
      }
    });

    box.addEventListener('keydown', function(e) {
      if (e.key === 'Backspace') {
        if (!box.value && index > 0) {
          boxes[index - 1].focus();
          boxes[index - 1].value = '';
          boxes[index - 1].classList.remove('filled');
        } else {
          box.value = '';
          box.classList.remove('filled');
        }
      }
    });

    // Paste support
    box.addEventListener('paste', function(e) {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData('text').trim();

      if (/^\d{6}$/.test(pasteData)) {
        for (let i = 0; i < 6; i++) {
          boxes[i].value = pasteData[i];
          boxes[i].classList.add('filled');
        }
        boxes[5].focus();
      }
    });
  });
});

// ─── Countdown Timer ───
function startCountdown(seconds) {
  const countdownEl = document.getElementById('countdown');
  const timerText = document.getElementById('timerText');
  const resendBtn = document.getElementById('resendBtn');

  timerText.classList.remove('hidden');
  resendBtn.classList.add('hidden');

  let remaining = seconds;
  updateTimerDisplay(remaining);

  countdownInterval = setInterval(function() {
    remaining--;
    updateTimerDisplay(remaining);

    if (remaining <= 0) {
      clearInterval(countdownInterval);
      timerText.classList.add('hidden');
      resendBtn.classList.remove('hidden');
    }
  }, 1000);
}

function updateTimerDisplay(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  document.getElementById('countdown').textContent = mins + ':' + (secs < 10 ? '0' : '') + secs;
}

// ─── Resend OTP ───
function resendOTP() {
  clearOTPBoxes();
  startCountdown(45);
  showToast('OTP resent successfully!', 'success');
  document.querySelector('.otp-box[data-index="0"]').focus();
}

// ─── Clear OTP Boxes ───
function clearOTPBoxes() {
  document.querySelectorAll('.otp-box').forEach(function(box) {
    box.value = '';
    box.classList.remove('filled');
  });
}

// ─── Mock Name Generator ───
function getMockName(role) {
  switch (role) {
    case 'CO': return 'Col. Rajesh Kumar Sharma';
    case 'ANO': return 'Capt. Anil Deb';
    case 'SUO': return 'SUO Priya Sharma';
    case 'Cadet': return 'Cdt. Rahul Das';
    default: return 'User';
  }
}

// ─── Toast Notification ───
function showToast(message, type) {
  type = type || 'success';
  const toast = document.getElementById('toast') || createToast();
  toast.className = 'toast toast-' + type + ' show';
  toast.innerHTML = '<i class="fas fa-' + (type === 'success' ? 'check-circle' : 'times-circle') + '"></i> ' + message;

  setTimeout(function() {
    toast.classList.remove('show');
  }, 3000);
}

function createToast() {
  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.className = 'toast';
  document.body.appendChild(toast);
  return toast;
}

// ─── Logout ───
function logout() {
  localStorage.removeItem('ccp_user');
  window.location.href = 'login.html';
}

// ─── Protect Dashboard Pages ───
function requireAuth(allowedRoles) {
  const user = JSON.parse(localStorage.getItem('ccp_user') || 'null');
  if (!user || !user.loggedIn) {
    window.location.href = '../login.html';
    return null;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to correct dashboard
    switch (user.role) {
      case 'CO': window.location.href = '../officer/co-dashboard.html'; break;
      case 'ANO': window.location.href = '../officer/ano-dashboard.html'; break;
      case 'SUO': window.location.href = '../officer/suo-dashboard.html'; break;
      case 'Cadet': window.location.href = '../cadet/dashboard.html'; break;
    }
    return null;
  }
  return user;
}
