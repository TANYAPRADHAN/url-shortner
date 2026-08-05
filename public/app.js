/* ─────────────────────────────────────────────────────────────
   Snip.ly Frontend Logic
   Handles: form submit, API call, result display, copy, recent links
───────────────────────────────────────────────────────────── */

const form        = document.getElementById('shorten-form');
const urlInput    = document.getElementById('url-input');
const shortenBtn  = document.getElementById('shorten-btn');
const errorMsg    = document.getElementById('error-msg');
const resultCard  = document.getElementById('result-card');
const shortLink   = document.getElementById('short-url-link');
const originalDisplay = document.getElementById('original-url-display');
const copyBtn     = document.getElementById('copy-btn');
const recentSection = document.getElementById('recent-section');
const recentList  = document.getElementById('recent-list');
const toast       = document.getElementById('toast');

const RECENT_KEY  = 'sniply_recent';
const MAX_RECENT  = 5;

// ─── Toast ───────────────────────────────────────────────────

let toastTimer;
function showToast(msg) {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ─── Copy to Clipboard ───────────────────────────────────────

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    if (btn) {
      const prev = btn.querySelector('.copy-text')?.textContent || btn.textContent;
      if (btn.querySelector('.copy-text')) btn.querySelector('.copy-text').textContent = 'Copied!';
      else btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        if (btn.querySelector('.copy-text')) btn.querySelector('.copy-text').textContent = prev;
        else btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 2000);
    }
    showToast('✅ Copied to clipboard!');
  }).catch(() => {
    showToast('⚠️ Could not copy — please copy manually.');
  });
}

copyBtn.addEventListener('click', () => {
  copyText(shortLink.href, copyBtn);
});

// ─── Recent Links (persisted in localStorage) ────────────────

function loadRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRecent(items) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(items));
}

function addToRecent(shortUrl, shortCode, originalUrl) {
  let items = loadRecent();
  // Remove existing entry for same code (dedup)
  items = items.filter(i => i.shortCode !== shortCode);
  items.unshift({ shortUrl, shortCode, originalUrl });
  if (items.length > MAX_RECENT) items = items.slice(0, MAX_RECENT);
  saveRecent(items);
  renderRecent(items);
}

function renderRecent(items) {
  if (!items || items.length === 0) {
    recentSection.classList.add('hidden');
    return;
  }

  recentSection.classList.remove('hidden');
  recentList.innerHTML = '';

  items.forEach(({ shortUrl, shortCode, originalUrl }) => {
    const li = document.createElement('li');
    li.className = 'recent-item';

    const codeSpan = document.createElement('span');
    codeSpan.className = 'recent-code';
    codeSpan.textContent = `/${shortCode}`;

    const origSpan = document.createElement('span');
    origSpan.className = 'recent-original';
    origSpan.textContent = originalUrl;
    origSpan.title = originalUrl;

    const copyRecentBtn = document.createElement('button');
    copyRecentBtn.className = 'recent-copy';
    copyRecentBtn.textContent = 'Copy';
    copyRecentBtn.addEventListener('click', () => copyText(shortUrl, copyRecentBtn));

    li.appendChild(codeSpan);
    li.appendChild(origSpan);
    li.appendChild(copyRecentBtn);
    recentList.appendChild(li);
  });
}

// ─── Form Submission ─────────────────────────────────────────

function setLoading(on) {
  shortenBtn.disabled = on;
  shortenBtn.classList.toggle('loading', on);
}

function showError(msg) {
  errorMsg.textContent = msg;
  urlInput.classList.add('input-error');
}

function clearError() {
  errorMsg.textContent = '';
  urlInput.classList.remove('input-error');
}

function showResult(shortUrl, originalUrl) {
  shortLink.href = shortUrl;
  shortLink.textContent = shortUrl;
  originalDisplay.textContent = originalUrl;

  resultCard.classList.remove('hidden');

  // Scroll result into view smoothly
  resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();

  const raw = urlInput.value.trim();
  if (!raw) {
    showError('Please enter a URL.');
    urlInput.focus();
    return;
  }

  setLoading(true);

  try {
    const res = await fetch('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: raw }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.error || 'Something went wrong. Please try again.');
      return;
    }

    showResult(data.shortUrl, data.originalUrl);
    addToRecent(data.shortUrl, data.shortCode, data.originalUrl);

    if (data.deduplicated) {
      showToast('🔗 This URL was already shortened — returning existing link.');
    } else {
      showToast('🎉 Short link created!');
    }

    urlInput.value = '';

  } catch (err) {
    showError('Network error — is the server running?');
  } finally {
    setLoading(false);
  }
});

// ─── Init ────────────────────────────────────────────────────

// Pre-populate recent links from localStorage on page load
renderRecent(loadRecent());

// Allow pressing Enter in the input
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') form.dispatchEvent(new Event('submit'));
});

// Set copyright year dynamically
const yearEl = document.getElementById('footer-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Track visitor & display count
(async () => {
  try {
    const res = await fetch('/api/visit');
    const data = await res.json();
    const countEl = document.getElementById('visitor-count');
    if (countEl && data.visitors !== undefined) {
      // Animate count up from 0
      const target = data.visitors;
      const duration = 900;
      const start = performance.now();
      function animate(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        countEl.textContent = Math.round(ease * target).toLocaleString();
        if (progress < 1) requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);
    }
  } catch {
    // Silently fail — visitor count is non-critical
  }
})();
