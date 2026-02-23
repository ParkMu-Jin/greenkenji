// ── Theme ──
const html = document.documentElement;
const saved = localStorage.getItem('gk-theme');
if (saved) html.setAttribute('data-theme', saved);

function toggleTheme() {
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('gk-theme', next);
}
document.getElementById('themeToggle').addEventListener('click', toggleTheme);

// ── Page navigation ──
let current = 'inicio';

function goTo(pageId) {
  if (pageId === current) return;
  const prev = document.getElementById('page-' + current);
  const next = document.getElementById('page-' + pageId);
  if (!next) return;

  prev.classList.remove('active');
  prev.scrollTop = 0;

  next.scrollTop = 0;
  next.querySelectorAll('.fade-in').forEach(el => {
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = '';
  });
  next.classList.add('active');
  current = pageId;
}

// ── Mobile nav ──
function closeMobileNav() {
  document.getElementById('mobileNav').classList.remove('open');
}

// ── Recursos tabs ──
function switchTab(tab) {
  document.querySelectorAll('.rec-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.rec-section').forEach(s => s.classList.remove('active'));
  const activeBtn = [...document.querySelectorAll('.rec-tab')].find(b => b.getAttribute('onclick').includes(tab));
  if(activeBtn) activeBtn.classList.add('active');
  const section = document.getElementById('tab-' + tab);
  if(section) section.classList.add('active');
}

// ── Gráfica de Impacto ──
const chartData = {
  co2: {
    label: 'Emisiones CO₂ logísticas (GtCO₂)',
    bad:   [2.8, 3.1, 3.5, 4.0, 4.6, 5.3, 6.1],
    good:  [2.8, 2.6, 2.3, 2.0, 1.6, 1.2, 0.8],
    badColor: 'rgba(239,68,68,',
    goodColor: 'rgba(61,166,92,',
    yLabel: 'GtCO₂',
    note: 'Sin acción, las emisiones se duplican para 2050. Con logística verde se pueden reducir un 70%.'
  },
  temp: {
    label: 'Aumento temperatura global proyectado (°C)',
    bad:   [1.1, 1.3, 1.5, 1.8, 2.1, 2.5, 3.0],
    good:  [1.1, 1.2, 1.25, 1.3, 1.35, 1.38, 1.4],
    badColor: 'rgba(249,115,22,',
    goodColor: 'rgba(61,166,92,',
    yLabel: '°C',
    note: 'La logística verde contribuye a mantener el calentamiento bajo 1.5°C, objetivo del Acuerdo de París.'
  },
  bio: {
    label: 'Especies en riesgo por fragmentación logística (%)',
    bad:   [18, 21, 25, 30, 36, 43, 52],
    good:  [18, 17, 16, 14, 12, 10, 8],
    badColor: 'rgba(168,85,247,',
    goodColor: 'rgba(61,166,92,',
    yLabel: '%',
    note: 'Reducir infraestructura invasiva y adoptar corredores verdes protege la biodiversidad local.'
  }
};

const years = [2020, 2025, 2030, 2035, 2040, 2045, 2050];
let impactChart = null;
let currentView = 'co2';

function buildChart() {
  const ctx = document.getElementById('impactChart');
  if (!ctx) return;
  const d = chartData[currentView];
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const gridColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const tickColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

  if (impactChart) impactChart.destroy();

  impactChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          label: 'Sin cambios',
          data: d.bad,
          borderColor: d.badColor + '1)',
          backgroundColor: d.badColor + '0.12)',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: d.badColor + '1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Con logística verde',
          data: d.good,
          borderColor: 'rgba(61,166,92,1)',
          backgroundColor: 'rgba(61,166,92,0.1)',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: 'rgba(61,166,92,1)',
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#1a2e1f' : '#fff',
          titleColor: isDark ? '#fff' : '#0d2618',
          bodyColor: isDark ? 'rgba(255,255,255,0.7)' : '#3a5244',
          borderColor: 'rgba(61,166,92,0.3)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} ${d.yLabel}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: tickColor, font: { family: 'DM Sans', size: 12 } }
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: tickColor,
            font: { family: 'DM Sans', size: 12 },
            callback: v => v + ' ' + d.yLabel
          }
        }
      }
    }
  });

  // update note
  const note = document.getElementById('chartNote');
  if (note) note.textContent = d.note;
}

function setChartView(view) {
  currentView = view;
  document.querySelectorAll('.cpill').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  buildChart();
}

// Init chart when impacto page becomes active
const _origGoTo = goTo;
goTo = function(pageId) {
  _origGoTo(pageId);
  if (pageId === 'impacto') {
    setTimeout(buildChart, 50);
  }
};

// Also rebuild on theme toggle
const _origToggle = toggleTheme;
toggleTheme = function() {
  _origToggle();
  if (current === 'impacto') setTimeout(buildChart, 50);
};
