/* ═══════════════════════════════════════════
   AUTH.JS — OTP Login System (Updated)
   Cadet Connection Portal
   ═══════════════════════════════════════════ */

let selectedRole = '';
let generatedOTP = '';
let countdownInterval = null;

// ─── Step 1: Select Role → Show Role-specific form ───
function selectRole(role) {
  selectedRole = role;

  // Hide step 1, show step 2
  document.getElementById('step1').classList.add('hidden');
  document.getElementById('step2').classList.remove('hidden');

  // Hide all role fields
  document.getElementById('cadetFields').classList.add('hidden');
  document.getElementById('anoFields').classList.add('hidden');
  document.getElementById('coFields').classList.add('hidden');
  document.getElementById('suoFields').classList.add('hidden');

  // Show correct fields based on role
  switch (role) {
    case 'Cadet':
      document.getElementById('cadetFields').classList.remove('hidden');
      document.getElementById('step2Title').textContent = 'Cadet Login';
      document.getElementById('step2Desc').textContent = 'Fill your details to receive OTP';
      break;
    case 'ANO':
      document.getElementById('anoFields').classList.remove('hidden');
      document.getElementById('step2Title').textContent = 'ANO Login';
      document.getElementById('step2Desc').textContent = 'Enter your officer details';
      break;
    case 'CO':
      document.getElementById('coFields').classList.remove('hidden');
      document.getElementById('step2Title').textContent = 'CO Login';
      document.getElementById('step2Desc').textContent = 'Commanding Officer access';
      break;
    case 'SUO':
      document.getElementById('suoFields').classList.remove('hidden');
      document.getElementById('step2Title').textContent = 'SUO Login';
      document.getElementById('step2Desc').textContent = 'Senior Under Officer access';
      break;
  }

  // Hide OTP section when switching roles
  document.getElementById('otpSection').classList.add('hidden');
}

// ─── Go Back to Step 1 ───
function goToStep1() {
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step1').classList.remove('hidden');
  document.getElementById('otpSection').classList.add('hidden');
  if (countdownInterval) clearInterval(countdownInterval);
}

// ─── Send OTP (validate form → generate & show OTP on page) ───
function sendOTP(e) {
  e.preventDefault();

  // Validate based on role
  let valid = true;
  let mobile = '';
  let name = '';

  switch (selectedRole) {
    case 'Cadet':
      name = document.getElementById('cadetName').value.trim();
      const regNo = document.getElementById('cadetRegNo').value.trim();
      const bn = document.getElementById('cadetBn').value.trim();
      const college = document.getElementById('cadetCollege').value.trim();
      mobile = document.getElementById('cadetMobile').value.trim();
      const dob = document.getElementById('cadetDob').value;
      const gender = document.getElementById('cadetGender').value;
      const photo = document.getElementById('cadetPhoto').files.length;

      if (!name || !regNo || !bn || !college || !mobile || !dob || !gender || !photo) {
        showToast('Please fill all required fields and upload photo', 'error');
        valid = false;
      }
      break;

    case 'ANO':
      name = document.getElementById('anoName').value.trim();
      const anoId = document.getElementById('anoId').value.trim();
      mobile = document.getElementById('anoMobile').value.trim();
      if (!name || !anoId || !mobile) {
        showToast('Please fill all required fields', 'error');
        valid = false;
      }
      break;

    case 'CO':
      name = document.getElementById('coName').value.trim();
      const coId = document.getElementById('coId').value.trim();
      mobile = document.getElementById('coMobile').value.trim();
      if (!name || !coId || !mobile) {
        showToast('Please fill all required fields', 'error');
        valid = false;
      }
      break;

    case 'SUO':
      name = document.getElementById('suoName').value.trim();
      const suoId = document.getElementById('suoId').value.trim();
      const suoCollege = document.getElementById('suoCollege').value.trim();
      mobile = document.getElementById('suoMobile').value.trim();
      if (!name || !suoId || !suoCollege || !mobile) {
        showToast('Please fill all required fields', 'error');
        valid = false;
      }
      break;
  }

  if (!valid) return;

  if (mobile.length < 10) {
    showToast('Please enter a valid 10-digit mobile number', 'error');
    return;
  }

  // Generate random 6-digit OTP
  generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

  // Send real OTP via Fast2SMS (Google Apps Script)
  const scriptURL = 'https://script.google.com/macros/s/AKfycbxO1bRD8-WDYrh-42EWfYSpG6z36Ih78qcCsQ8B3VeYL8Ufj4OqZ34y6wWmm0ijFrPnsA/exec';
  fetch(scriptURL + '?mobile=' + mobile + '&otp=' + generatedOTP, {mode: 'no-cors'});

  // Show OTP section on same page (hide the generated OTP display for production)
  document.getElementById('generatedOTP').textContent = '******';
  document.getElementById('otpNote').textContent = 'OTP sent to +91 ' + mobile.slice(-4) + ' via SMS';
  document.getElementById('otpSection').classList.remove('hidden');

  // Scroll to OTP section
  document.getElementById('otpSection').scrollIntoView({ behavior: 'smooth' });

  // Focus first OTP box
  setTimeout(function() {
    document.querySelector('.otp-box[data-index="0"]').focus();
  }, 300);

  // Start countdown
  startCountdown(45);

  showToast('OTP sent to your mobile +91 ' + mobile.slice(-4) + '!', 'success');
}

// ─── Verify OTP ───
function verifyOTP() {
  const boxes = document.querySelectorAll('.otp-box');
  let enteredOTP = '';
  boxes.forEach(function(box) { enteredOTP += box.value; });

  if (enteredOTP.length !== 6) {
    showToast('Please enter complete 6-digit OTP', 'error');
    return;
  }

  if (enteredOTP === generatedOTP) {
    // Get name based on role
    let userName = '';
    let userCollege = '';
    switch (selectedRole) {
      case 'Cadet': userName = document.getElementById('cadetName').value.trim(); userCollege = document.getElementById('cadetCollege').value.trim(); break;
      case 'ANO': userName = document.getElementById('anoName').value.trim(); break;
      case 'CO': userName = document.getElementById('coName').value.trim(); break;
      case 'SUO': userName = document.getElementById('suoName').value.trim(); userCollege = document.getElementById('suoCollege').value.trim(); break;
    }

    // Save to localStorage
    const userData = {
      name: userName,
      role: selectedRole,
      college: userCollege,
      loggedIn: true,
      loginTime: new Date().toISOString()
    };
    localStorage.setItem('ccp_user', JSON.stringify(userData));

    showToast('Login Successful! Redirecting...', 'success');

    // Redirect by role
    setTimeout(function() {
      switch (selectedRole) {
        case 'CO': window.location.href = 'officer/co-dashboard.html'; break;
        case 'ANO': window.location.href = 'officer/ano-dashboard.html'; break;
        case 'SUO': window.location.href = 'officer/suo-dashboard.html'; break;
        case 'Cadet': window.location.href = 'cadet/dashboard.html'; break;
        default: window.location.href = 'index.html';
      }
    }, 1500);
  } else {
    showToast('Invalid OTP. Please enter the correct OTP shown above.', 'error');
  }
}

// ─── OTP Box Handling ───
document.addEventListener('DOMContentLoaded', function() {
  const boxes = document.querySelectorAll('.otp-box');

  boxes.forEach(function(box, index) {
    box.addEventListener('input', function(e) {
      const val = e.target.value;
      if (val && /^\d$/.test(val)) {
        box.classList.add('filled');
        if (index < 5) boxes[index + 1].focus();
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
  const timerText = document.getElementById('timerText');
  const resendBtn = document.getElementById('resendBtn');

  if (timerText) timerText.classList.remove('hidden');
  if (resendBtn) resendBtn.classList.add('hidden');

  let remaining = seconds;
  updateTimerDisplay(remaining);

  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(function() {
    remaining--;
    updateTimerDisplay(remaining);
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      if (timerText) timerText.classList.add('hidden');
      if (resendBtn) resendBtn.classList.remove('hidden');
    }
  }, 1000);
}

function updateTimerDisplay(seconds) {
  const el = document.getElementById('countdown');
  if (!el) return;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  el.textContent = mins + ':' + (secs < 10 ? '0' : '') + secs;
}

// ─── Resend OTP ───
function resendOTP() {
  generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Get mobile number based on role
  let mobile = '';
  switch (selectedRole) {
    case 'Cadet': mobile = document.getElementById('cadetMobile').value.trim(); break;
    case 'ANO': mobile = document.getElementById('anoMobile').value.trim(); break;
    case 'CO': mobile = document.getElementById('coMobile').value.trim(); break;
    case 'SUO': mobile = document.getElementById('suoMobile').value.trim(); break;
  }
  
  // Send via Fast2SMS
  const scriptURL = 'https://script.google.com/macros/s/AKfycbxO1bRD8-WDYrh-42EWfYSpG6z36Ih78qcCsQ8B3VeYL8Ufj4OqZ34y6wWmm0ijFrPnsA/exec';
  fetch(scriptURL + '?mobile=' + mobile + '&otp=' + generatedOTP, {mode: 'no-cors'});
  
  clearOTPBoxes();
  startCountdown(45);
  showToast('New OTP sent to your mobile!', 'success');
  document.querySelector('.otp-box[data-index="0"]').focus();
}

// ─── Clear OTP Boxes ───
function clearOTPBoxes() {
  document.querySelectorAll('.otp-box').forEach(function(box) {
    box.value = '';
    box.classList.remove('filled');
  });
}

// ─── Toast Notification ───
function showToast(message, type) {
  type = type || 'success';
  const toast = document.getElementById('toast') || createToast();
  toast.className = 'toast toast-' + type + ' show';
  toast.innerHTML = '<i class="fas fa-' + (type === 'success' ? 'check-circle' : 'times-circle') + '"></i> ' + message;
  setTimeout(function() { toast.classList.remove('show'); }, 3000);
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
