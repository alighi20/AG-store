const TOKEN_KEY = 'userToken';

function updateAuthUI() {
  const token = localStorage.getItem(TOKEN_KEY);

  const guestBox = document.getElementById('guestBox');
  const userBox = document.getElementById('userBox');

  if (!guestBox || !userBox) return;

  if (token) {
    guestBox.classList.add('hidden');
    userBox.classList.remove('hidden');
  } else {
    guestBox.classList.remove('hidden');
    userBox.classList.add('hidden');
  }
}

function logoutUser() {
  localStorage.removeItem(TOKEN_KEY);
  updateAuthUI();
}

document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();

  const logoutBtn = document.getElementById('logoutBtn');
  const openLoginBtn = document.getElementById('openLoginBtn');
  const openRegisterBtn = document.getElementById('openRegisterBtn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutUser);
  }

  if (openLoginBtn) {
    openLoginBtn.addEventListener('click', () => {
      alert('مودال ورود را اینجا باز کن');
    });
  }

  if (openRegisterBtn) {
    openRegisterBtn.addEventListener('click', () => {
      alert('مودال ثبت‌نام را اینجا باز کن');
    });
  }
});
