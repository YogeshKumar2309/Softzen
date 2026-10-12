// ====== Backend URL ======
// Apna Render URL yahan daalein (contact wala hi rahega, bas /user add karna hai)
const USER_API = 'https://softzen-mdyx.onrender.com/api/user';

const joinForm = document.getElementById('joinForm');
const joinMessageBox = document.getElementById('joinMessageBox');
const memberCountEl = document.getElementById('memberCount');

// ====== Live Member Counter ======
async function loadMemberCount() {
  try {
    const res = await fetch(`${USER_API}/count`);
    const data = await res.json();
    if (data.success) {
      animateCount(data.totalMembers);
    }
  } catch (err) {
    console.warn('Counter load fail:', err);
  }
}

// Counter animation: 0 se target tak
function animateCount(target) {
  if (!memberCountEl) return;

  if (target === 0) {
    memberCountEl.textContent = '0';
    return;
  }

  let current = 0;
  const duration = 1200; // 1.2 sec
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    current = Math.floor(eased * target);
    memberCountEl.textContent = current.toLocaleString('en-IN');
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      memberCountEl.textContent = target.toLocaleString('en-IN');
    }
  }
  requestAnimationFrame(update);
}

// ====== Form Submit ======
if (joinForm) {
  joinForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const uniqueId = document.getElementById('uniqueId').value.trim();
    const password = document.getElementById('password').value.trim();
    const message = document.getElementById('joinMessage').value.trim();

    // Client-side validation
    if (!uniqueId || !password) {
      showJoinMessage('कृपया सभी ज़रूरी फ़ील्ड भरें।', 'error');
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(uniqueId)) {
      showJoinMessage('Unique ID में सिर्फ अक्षर, अंक और _ (3-20) allowed हैं।', 'error');
      return;
    }

    if (password.length < 6) {
      showJoinMessage('पासवर्ड कम से कम 6 अक्षर का होना चाहिए।', 'error');
      return;
    }

    const btn = joinForm.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'जुड़ रहे हैं...';
    joinMessageBox.style.display = 'none';

    try {
      const res = await fetch(`${USER_API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uniqueId, password, message })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showJoinMessage(`✅ ${data.message}`, 'success');
        joinForm.reset();

        // Counter update karo
        if (data.data && typeof data.data.totalMembers === 'number') {
          animateCount(data.data.totalMembers);
        }

        // Success ke baad counter tak scroll
        setTimeout(() => {
          document.querySelector('.counter-box')?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 800);
      } else {
        showJoinMessage(`❌ ${data.message || 'कुछ गलत हो गया।'}`, 'error');
      }
    } catch (err) {
      console.error(err);
      showJoinMessage('❌ नेटवर्क एरर। इंटरनेट कनेक्शन चेक करें।', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

function showJoinMessage(text, type) {
  if (!joinMessageBox) return;
  joinMessageBox.textContent = text;
  joinMessageBox.className = `form-message ${type}`;
  joinMessageBox.style.display = 'block';

  setTimeout(() => {
    joinMessageBox.style.display = 'none';
  }, 6000);

  joinMessageBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Page load hone par counter load karo
document.addEventListener('DOMContentLoaded', loadMemberCount);