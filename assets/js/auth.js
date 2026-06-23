/* ═══════════════════════════════════════════
   AUTH.JS — OTP Login System (Fixed)
   Cadet Connection Portal
   ═══════════════════════════════════════════ */

var selectedRole = '';
var generatedOTP = '';
var countdownInterval = null;

var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxO1bRD8-WDYrh-42EWfYSpG6z36Ih78qcCsQ8B3VeYL8Ufj4OqZ34y6wWmm0ijFrPnsA/exec';

// ─── Select Role ───
function selectRole(role) {
  selectedRole = role;
  document.getElementById('step1').classList.add('hidden');
  document.getElementById('step2').classList.remove('hidden');

  document.getElementById('cadetFields').classList.add('hidden');
  document.getElementById('adminFields').classList.add('hidden');
  document.getElementById('coFields').classList.add('hidden');
  document.getElementById('suoFields').classList.add('hidden');

  if (role === 'Cadet') {
    document.getElementById('cadetFields').classList.remove('hidden');
    document.getElementById('step2Title').textContent = 'Cadet Login';
    document.getElementById('step2Desc').textContent = 'Fill your details to receive OTP';
  } else if (role === 'Admin') {
    document.getElementById('adminFields').classList.remove('hidden');
    document.getElementById('step2Title').textContent = 'Admin Login';
    document.getElementById('step2Desc').textContent = 'Enter admin credentials';
  } else if (role === 'CO') {
    document.getElementById('coFields').classList.remove('hidden');
    document.getElementById('step2Title').textContent = 'CO Login';
    document.getElementById('step2Desc').textContent = 'Commanding Officer access';
  } else if (role === 'SUO') {
    document.getElementById('suoFields').classList.remove('hidden');
    document.getElementById('step2Title').textContent = 'SUO Login';
    document.getElementById('step2Desc').textContent = 'Senior Under Officer access';
  }

  document.getElementById('otpSection').classList.add('hidden');
}

// ─── Go Back ───
function goToStep1() {
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step1').classList.remove('hidden');
  document.getElementById('otpSection').classList.add('hidden');
  if (countdownInterval) clearInterval(countdownInterval);
}

// ─── Send OTP ───
function sendOTP(e) {
  e.preventDefault();

  var valid = true;
  var mobile = '';
  var name = '';

  if (selectedRole === 'Cadet') {
    name = document.getElementById('cadetName').value.trim();
    var regNo = document.getElementById('cadetRegNo').value.trim();
    var bn = document.getElementById('cadetBn').value.trim();
    var college = document.getElementById('cadetCollege').value.trim();
    mobile = document.getElementById('cadetMobile').value.trim();
    var dob = document.getElementById('cadetDob').value;
    var gender = document.getElementById('cadetGender').value;
    var photo = document.getElementById('cadetPhoto').files.length;
    if (!name || !regNo || !bn || !college || !mobile || !dob || !gender || !photo) {
      showToast('Please fill all required fields and upload photo', 'error');
      valid = false;
    }
  } else if (selectedRole === 'Admin') {
    name = document.getElementById('adminName').value.trim();
    var adminId = document.getElementById('adminId').value.trim();
    mobile = document.getElementById('adminMobile').value.trim();
    if (!name || !adminId || !mobile) {
      showToast('Please fill all required fields', 'error');
      valid = false;
    }
  } else if (selectedRole === 'CO') {
    name = document.getElementById('coName').value.trim();
    var coId = document.getElementById('coId').value.trim();
    mobile = document.getElementById('coMobile').value.trim();
    if (!name || !coId || !mobile) {
      showToast('Please fill all required fields', 'error');
      valid = false;
    }
  } else if (selectedRole === 'SUO') {
    name = document.getElementById('suoName').value.trim();
    var suoId = document.getElementById('suoId').value.trim();
    var suoCollege = document.getElementById('suoCollege').value.trim();
    mobile = document.getElementById('suoMobile').value.trim();
    if (!name || !suoId || !suoCollege || !mobile) {
      showToast('Please fill all required fields', 'error');
      valid = false;
    }
  }

  if (!valid) return;

  if (mobile.length < 10) {
    showToast('Please enter a valid 10-digit mobile number', 'error');
    return;
  }

  // Generate OTP
  generatedOTP = String(Math.floor(100000 + Math.random() * 900000));

  // Show OTP on screen
  document.getElementById('otpNote').textContent = generatedOTP;
  document.getElementById('otpSubNote').textContent = 'Enter this OTP below to verify';
  document.getElementById('otpSection').classList.remove('hidden');
  document.getElementById('otpSection').scrollIntoView({ behavior: 'smooth' });

  setTimeout(function() {
    var firstBox = document.querySelector('.otp-box[data-index="0"]');
    if (firstBox) firstBox.focus();
  }, 300);

  startCountdown(45);
  showToast('OTP sent to your mobile!', 'success');
}

// ─── Verify OTP ───
function verifyOTP() {
  var boxes = document.querySelectorAll('.otp-box');
  var enteredOTP = '';
  for (var i = 0; i < boxes.length; i++) {
    enteredOTP += boxes[i].value;
  }

  if (enteredOTP.length !== 6) {
    showToast('Please enter complete 6-digit OTP', 'error');
    return;
  }

  if (enteredOTP === generatedOTP) {
    var userName = '';
    var userCollege = '';

    if (selectedRole === 'Cadet') {
      userName = document.getElementById('cadetName').value.trim();
      userCollege = document.getElementById('cadetCollege').value.trim();
    } else if (selectedRole === 'Admin') {
      userName = document.getElementById('adminName').value.trim();
    } else if (selectedRole === 'CO') {
      userName = document.getElementById('coName').value.trim();
    } else if (selectedRole === 'SUO') {
      userName = document.getElementById('suoName').value.trim();
      userCollege = document.getElementById('suoCollege').value.trim();
    }

    var userData = {
      name: userName,
      role: selectedRole,
      college: userCollege,
      loggedIn: true,
      loginTime: new Date().toISOString()
    };
    localStorage.setItem('ccp_user', JSON.stringify(userData));

    showToast('Login Successful! Redirecting...', 'success');

    setTimeout(function() {
      if (selectedRole === 'CO') window.location.href = 'officer/co-dashboard.html';
      else if (selectedRole === 'Admin') window.location.href = 'officer/admin-dashboard.html';
      else if (selectedRole === 'SUO') window.location.href = 'officer/suo-dashboard.html';
      else if (selectedRole === 'Cadet') window.location.href = 'cadet/dashboard.html';
      else window.location.href = 'index.html';
    }, 1500);
  } else {
    showToast('Invalid OTP. Please check your SMS and try again.', 'error');
  }
}

// ─── OTP Box Handling ───
document.addEventListener('DOMContentLoaded', function() {
  var boxes = document.querySelectorAll('.otp-box');
  for (var i = 0; i < boxes.length; i++) {
    (function(index) {
      boxes[index].addEventListener('input', function(e) {
        var val = e.target.value;
        if (val && /^\d$/.test(val)) {
          boxes[index].classList.add('filled');
          if (index < 5) boxes[index + 1].focus();
        } else {
          boxes[index].value = '';
          boxes[index].classList.remove('filled');
        }
      });

      boxes[index].addEventListener('keydown', function(e) {
        if (e.key === 'Backspace') {
          if (!boxes[index].value && index > 0) {
            boxes[index - 1].focus();
            boxes[index - 1].value = '';
            boxes[index - 1].classList.remove('filled');
          } else {
            boxes[index].value = '';
            boxes[index].classList.remove('filled');
          }
        }
      });

      boxes[index].addEventListener('paste', function(e) {
        e.preventDefault();
        var pasteData = (e.clipboardData || window.clipboardData).getData('text').trim();
        if (/^\d{6}$/.test(pasteData)) {
          for (var j = 0; j < 6; j++) {
            boxes[j].value = pasteData[j];
            boxes[j].classList.add('filled');
          }
          boxes[5].focus();
        }
      });
    })(i);
  }
});

// ─── Countdown ───
function startCountdown(seconds) {
  var timerText = document.getElementById('timerText');
  var resendBtn = document.getElementById('resendBtn');
  if (timerText) timerText.classList.remove('hidden');
  if (resendBtn) resendBtn.classList.add('hidden');

  var remaining = seconds;
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
  var el = document.getElementById('countdown');
  if (!el) return;
  var mins = Math.floor(seconds / 60);
  var secs = seconds % 60;
  el.textContent = mins + ':' + (secs < 10 ? '0' : '') + secs;
}

// ─── Resend OTP ───
function resendOTP() {
  generatedOTP = String(Math.floor(100000 + Math.random() * 900000));

  var mobile = '';
  if (selectedRole === 'Cadet') mobile = document.getElementById('cadetMobile').value.trim();
  else if (selectedRole === 'Admin') mobile = document.getElementById('adminMobile').value.trim();
  else if (selectedRole === 'CO') mobile = document.getElementById('coMobile').value.trim();
  else if (selectedRole === 'SUO') mobile = document.getElementById('suoMobile').value.trim();

  try {
    document.getElementById('otpNote').textContent = generatedOTP;
  } catch(err) {}

  clearOTPBoxes();
  startCountdown(45);
  showToast('New OTP sent to your mobile!', 'success');
  var firstBox = document.querySelector('.otp-box[data-index="0"]');
  if (firstBox) firstBox.focus();
}

function clearOTPBoxes() {
  var boxes = document.querySelectorAll('.otp-box');
  for (var i = 0; i < boxes.length; i++) {
    boxes[i].value = '';
    boxes[i].classList.remove('filled');
  }
}

// ─── Toast ───
function showToast(message, type) {
  type = type || 'success';
  var toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.className = 'toast toast-' + type + ' show';
  toast.innerHTML = '<i class="fas fa-' + (type === 'success' ? 'check-circle' : 'times-circle') + '"></i> ' + message;
  setTimeout(function() { toast.classList.remove('show'); }, 3000);
}

// ─── Logout ───
function logout() {
  localStorage.removeItem('ccp_user');
  window.location.href = '../login.html';
}

// ─── Protect Pages ───
function requireAuth(allowedRoles) {
  var user = JSON.parse(localStorage.getItem('ccp_user') || 'null');
  if (!user || !user.loggedIn) {
    window.location.href = '../login.html';
    return null;
  }
  if (allowedRoles && allowedRoles.indexOf(user.role) === -1) {
    if (user.role === 'CO') window.location.href = '../officer/co-dashboard.html';
    else if (user.role === 'Admin') window.location.href = '../officer/admin-dashboard.html';
    else if (user.role === 'SUO') window.location.href = '../officer/suo-dashboard.html';
    else if (user.role === 'Cadet') window.location.href = '../cadet/dashboard.html';
    return null;
  }
  return user;
}
