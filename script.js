/**
 * ADVANCED QUIZ BUILDER — script.js
 * Global utilities, dark mode, and shared logic.
 */

// ─── DARK MODE ─────────────────────────────────────────────
const THEME_KEY = 'quiz_builder_theme';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  const toggles = document.querySelectorAll('.dark-toggle-input');
  toggles.forEach(t => { t.checked = theme === 'dark'; });
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(saved);
}

function setupThemeToggle() {
  document.querySelectorAll('.dark-toggle-input').forEach(toggle => {
    toggle.addEventListener('change', () => {
      const current = document.documentElement.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  });
}

// ─── ALERT / TOAST ─────────────────────────────────────────
function showAlert(containerId, message, type = 'error') {
  const el = document.getElementById(containerId);
  if (!el) return;
  const icons = { error: '⚠', success: '✓', info: 'ℹ' };
  el.innerHTML = `<div class="alert alert-${type}">${icons[type] || '•'} ${message}</div>`;
  setTimeout(() => { if (el.innerHTML) el.innerHTML = ''; }, 5000);
}

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast-container');
  if (!existing) {
    const wrap = document.createElement('div');
    wrap.className = 'toast-container';
    wrap.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;';
    document.body.appendChild(wrap);
  }
  const container = document.querySelector('.toast-container');
  const toast = document.createElement('div');
  const icons = { success: '✓', error: '⚠', info: 'ℹ' };
  toast.className = `alert alert-${type}`;
  toast.style.cssText = 'min-width:240px;max-width:360px;box-shadow:var(--shadow-lg);animation:slideUp 0.3s ease;';
  toast.innerHTML = `${icons[type] || '•'} ${message}`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.4s'; setTimeout(() => toast.remove(), 400); }, 3500);
}

// ─── COPY TO CLIPBOARD ─────────────────────────────────────
async function copyToClipboard(text, btnEl) {
  try {
    await navigator.clipboard.writeText(text);
    if (btnEl) {
      const orig = btnEl.textContent;
      btnEl.textContent = '✓ Copied!';
      setTimeout(() => { btnEl.textContent = orig; }, 2000);
    }
    showToast('Link copied to clipboard!');
  } catch {
    showToast('Could not copy. Please copy manually.', 'error');
  }
}

// ─── LOADING OVERLAY ───────────────────────────────────────
function showLoading(message = 'Loading…') {
  let overlay = document.getElementById('global-loading');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'global-loading';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `<div class="spinner" style="width:36px;height:36px;border-width:4px;"></div><p style="color:var(--text-secondary);font-size:0.9rem;">${message}</p>`;
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
}

function hideLoading() {
  const overlay = document.getElementById('global-loading');
  if (overlay) overlay.style.display = 'none';
}

// ─── FORMAT DATE ───────────────────────────────────────────
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

// ─── CSV PARSER ────────────────────────────────────────────
/**
 * Parse CSV text with the format:
 * Question,Option A,Option B,Option C,Option D,Correct Option
 * Returns array of question objects and any errors.
 */
function parseCSV(csvText) {
  // Normalise all line endings: Windows CRLF, old Mac CR, Unix LF
  const normalised = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalised.trim().split('\n');
  if (lines.length < 2) return { questions: [], errors: ['CSV must have a header row and at least one question.'] };

  const errors    = [];
  const questions = [];
  const validCorrect = ['A', 'B', 'C', 'D'];

  // Auto-detect delimiter — comma or semicolon (European Excel uses semicolons)
  const delimiter = lines[0].includes(';') ? ';' : ',';

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    // Strip carriage return and whitespace from each line
    const raw = lines[i].replace(/\r/g, '').trim();
    if (!raw) continue; // skip blank lines

    const cols = parseCSVLine(raw, delimiter);

    if (cols.length < 6) {
      errors.push(`Row ${i + 1}: Not enough columns (expected 6, got ${cols.length}).`);
      continue;
    }

    // Clean each cell: trim whitespace and remove surrounding quotes
    const clean = cols.map(c => c.trim().replace(/^["']|["']$/g, '').trim());
    const [questionText, optionA, optionB, optionC, optionD, correctRaw] = clean;

    // Accept: "B", "b", "Option B", "option b", "(B)" etc.
    const correctOption = correctRaw
      .toUpperCase()
      .replace(/OPTION\s*/g, '')
      .replace(/[^A-D]/g, '')
      .trim();

    if (!questionText)                           { errors.push(`Row ${i + 1}: Question text is empty.`); continue; }
    if (!optionA||!optionB||!optionC||!optionD)  { errors.push(`Row ${i + 1}: All four options must be filled.`); continue; }
    if (!validCorrect.includes(correctOption))   { errors.push(`Row ${i + 1}: Correct option must be A, B, C, or D. Got: "${correctRaw}".`); continue; }

    questions.push({
      question_text:  questionText,
      option_a:       optionA,
      option_b:       optionB,
      option_c:       optionC,
      option_d:       optionD,
      correct_option: correctOption
    });
  }

  return { questions, errors };
}

function parseCSVLine(line, delimiter = ',') {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; } // escaped quote
      else { inQuotes = !inQuotes; }
    } else if (ch === delimiter && !inQuotes) {
      result.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

// ─── INIT ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupThemeToggle();
});