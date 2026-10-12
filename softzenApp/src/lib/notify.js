// ===== Sound Notification =====
let audioCtx = null;

export function playNotificationSound() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    const now = audioCtx.currentTime;

    [0, 0.12].forEach((delay) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now + delay);
      osc.frequency.exponentialRampToValueAtTime(1320, now + delay + 0.08);

      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.15, now + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.1);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.15);
    });
  } catch (err) {
    // Silent fail
  }
}

// ===== Browser Notification =====
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  try {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch (err) {
    return false;
  }
}

export function showBrowserNotification(title, body, onClick) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  // Tab active hai? Notification mat dikhao
  if (document.visibilityState === 'visible') return;

  try {
    const notif = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'softzen-message',
      renotify: true,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
      if (onClick) onClick();
    };

    setTimeout(() => notif.close(), 5000);
  } catch (err) {
    // Silent fail
  }
}

// ===== Tab Title Update =====
let baseTitle = 'Softzen';
let titleInterval = null;

export function setBaseTitle(title) {
  baseTitle = title;
}

export function updateTitleUnread(count) {
  if (count > 0) {
    document.title = `(${count}) ${baseTitle}`;

    if (!titleInterval) {
      let show = true;
      titleInterval = setInterval(() => {
        document.title = show
          ? `💬 New message! | ${baseTitle}`
          : `(${count}) ${baseTitle}`;
        show = !show;
      }, 2000);
    }
  } else {
    document.title = baseTitle;
    if (titleInterval) {
      clearInterval(titleInterval);
      titleInterval = null;
    }
  }
}
