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

// ── Gráfica de Impacto — Panamá ──
const SPLIT_IDX = 4; // índice de 2026 en los labels

// Metadata por vista: título, subtítulo y leyenda
const chartMeta = {
  co2: {
    title: '¿Cuánto contamina el transporte en Panamá?',
    sub: 'La línea gris muestra lo que pasó de verdad. Desde 2026: qué pasa si no hacemos nada (rojo) vs. si adoptamos logística verde (verde).',
    legendBad: 'Sin cambios',
    legendGood: 'Con logística verde',
    showReal: true,
    ctxPeriod: '2018 – 2026 · Lo que realmente pasó',
    ctxVerdict: 'Panamá no redujo sus emisiones logísticas',
    ctxDetail: 'Durante este período las emisiones del sector crecieron un 28%, principalmente por el aumento del transporte por carretera y la expansión portuaria sin medidas de compensación ambiental.'
  },
  bosques: {
    title: '¿Panamá está perdiendo sus bosques?',
    sub: 'La línea gris muestra lo que pasó de verdad. Desde 2026: qué ocurre si la infraestructura sigue creciendo sin control vs. si se crean corredores verdes.',
    legendBad: 'Sin control',
    legendGood: 'Con corredores verdes',
    showReal: true,
    ctxPeriod: '2010 – 2026 · Lo que realmente pasó',
    ctxVerdict: 'Panamá perdió el 9% de su cobertura boscosa',
    ctxDetail: 'La expansión de infraestructura vial y logística fragmentó ecosistemas clave. No se implementaron corredores biológicos obligatorios en las zonas de mayor actividad de carga.'
  },
  energia: {
    title: '¿De dónde viene la energía que usa la logística en Panamá?',
    sub: 'Cómo se genera la energía hoy (2026) y cómo podría cambiar para 2030 si el sector adopta fuentes renovables.',
    legendBad: 'Cómo está hoy (2026)',
    legendGood: 'Cómo podría estar en 2030',
    showReal: false,
    ctxPeriod: null,
    ctxVerdict: null,
    ctxDetail: null
  }
};

const chartData = {
  co2: {
    type: 'line',
    labels: ['2018','2020','2022','2024','2026','2028','2030'],
    real:   [10.8,  11.4,  12.1,  13.0,  13.8,  null,  null],
    bad:    [null,  null,  null,  null,  13.8,  15.6,  18.2],
    good:   [null,  null,  null,  null,  13.8,  11.5,   8.4],
    badColor: 'rgba(239,68,68,',
    yLabel: 'MtCO₂',
    note: 'Datos reales hasta 2026 (línea gris). Sin logística verde las emisiones alcanzan 18 MtCO₂ en 2030; adoptándola bajan a 8.4 MtCO₂.'
  },
  bosques: {
    type: 'line',
    labels: ['2010','2014','2018','2022','2026','2028','2030'],
    real:   [54.8,  53.5,  52.1,  51.0,  49.8,  null,  null],
    bad:    [null,  null,  null,  null,  49.8,  48.6,  47.0],
    good:   [null,  null,  null,  null,  49.8,  50.4,  51.5],
    badColor: 'rgba(249,115,22,',
    yLabel: '%',
    note: 'Datos reales hasta 2026. Sin acción la cobertura boscosa sigue cayendo; con corredores verdes logísticos se puede revertir la tendencia hacia 2030.'
  },
  energia: {
    type: 'bar',
    labels: ['Hidroeléctrica','Solar','Eólica','Combustible fósil','Otras renovables'],
    real:   null,
    bad:    [54, 8, 4, 31, 3],
    good:   [50, 20, 12, 12, 6],
    badColor: 'rgba(249,115,22,',
    yLabel: '%',
    note: 'Mix energético actual de Panamá (2026). La proyección 2030 con logística verde muestra el potencial de electrificar la flota y los centros de distribución.'
  }
};

// Qué líneas están visibles
let visibleLines = { bad: true, good: true };

let impactChart = null;
let currentView = 'co2';

// Plugin: línea vertical "Hoy"
const todayLinePlugin = {
  id: 'todayLine',
  afterDraw(chart) {
    const d = chartData[currentView];
    if (d.type === 'bar') return;
    const { ctx: c, chartArea, scales } = chart;
    const xPos = scales.x.getPixelForValue(SPLIT_IDX);
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    c.save();
    c.beginPath();
    c.setLineDash([5, 4]);
    c.strokeStyle = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)';
    c.lineWidth = 1.5;
    c.moveTo(xPos, chartArea.top + 14);
    c.lineTo(xPos, chartArea.bottom);
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)';
    c.font = '600 11px DM Sans';
    c.textAlign = 'center';
    c.fillText('Hoy', xPos, chartArea.top + 10);
    c.restore();
  }
};

function buildChart() {
  const ctx = document.getElementById('impactChart');
  if (!ctx) return;
  const d = chartData[currentView];
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const tickColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const tooltipBg = isDark ? '#0f1f15' : '#fff';
  const isBar = d.type === 'bar';

  if (impactChart) impactChart.destroy();

  const c2d = ctx.getContext('2d');

  const mkGrad = (color, alpha1, alpha2) => {
    const g = c2d.createLinearGradient(0, 0, 0, 300);
    g.addColorStop(0, color.replace('rgba(', 'rgba(').replace(',', ',').slice(0,-1) + alpha1 + ')');
    g.addColorStop(1, color.replace('rgba(', 'rgba(').replace(',', ',').slice(0,-1) + alpha2 + ')');
    return g;
  };

  // Gradients
  const gradReal = c2d.createLinearGradient(0, 0, 0, 300);
  gradReal.addColorStop(0, 'rgba(160,160,160,0.18)');
  gradReal.addColorStop(1, 'rgba(160,160,160,0)');

  const gradBad = c2d.createLinearGradient(0, 0, 0, 300);
  gradBad.addColorStop(0, d.badColor + '0.22)');
  gradBad.addColorStop(1, d.badColor + '0)');

  const gradGood = c2d.createLinearGradient(0, 0, 0, 300);
  gradGood.addColorStop(0, 'rgba(61,166,92,0.18)');
  gradGood.addColorStop(1, 'rgba(61,166,92,0)');

  const gradBarBad = c2d.createLinearGradient(0, 0, 0, 280);
  gradBarBad.addColorStop(0, d.badColor + '0.85)');
  gradBarBad.addColorStop(1, d.badColor + '0.45)');

  const gradBarGood = c2d.createLinearGradient(0, 0, 0, 280);
  gradBarGood.addColorStop(0, 'rgba(61,166,92,0.85)');
  gradBarGood.addColorStop(1, 'rgba(61,166,92,0.45)');

  let datasets;

  if (isBar) {
    datasets = [
      {
        label: 'Situación actual (2026)',
        data: visibleLines.bad ? d.bad : d.bad.map(() => null),
        backgroundColor: gradBarBad,
        borderRadius: 8,
        borderSkipped: false
      },
      {
        label: 'Con logística verde (2030)',
        data: visibleLines.good ? d.good : d.good.map(() => null),
        backgroundColor: gradBarGood,
        borderRadius: 8,
        borderSkipped: false
      }
    ];
  } else {
    datasets = [
      // Línea gris: datos reales compartidos
      {
        label: 'Datos reales',
        data: d.real,
        borderColor: isDark ? 'rgba(180,180,180,0.7)' : 'rgba(100,100,100,0.55)',
        backgroundColor: gradReal,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: isDark ? 'rgba(180,180,180,0.9)' : 'rgba(100,100,100,0.7)',
        pointBorderColor: isDark ? '#0f1f15' : '#fff',
        pointBorderWidth: 2,
        fill: true,
        tension: 0.4,
        spanGaps: false
      },
      // Línea roja: proyección sin cambios
      {
        label: 'Sin cambios',
        data: visibleLines.bad ? d.bad : d.bad.map(() => null),
        borderColor: d.badColor + '1)',
        backgroundColor: visibleLines.bad ? gradBad : 'transparent',
        borderWidth: 2.5,
        borderDash: [6, 3],
        pointRadius: ctx => ctx.dataIndex === SPLIT_IDX ? 6 : 4,
        pointHoverRadius: 8,
        pointBackgroundColor: d.badColor + '1)',
        pointBorderColor: isDark ? '#0f1f15' : '#fff',
        pointBorderWidth: 2,
        fill: true,
        tension: 0.4,
        spanGaps: false
      },
      // Línea verde: proyección con logística verde
      {
        label: 'Con logística verde',
        data: visibleLines.good ? d.good : d.good.map(() => null),
        borderColor: 'rgba(61,166,92,1)',
        backgroundColor: visibleLines.good ? gradGood : 'transparent',
        borderWidth: 2.5,
        borderDash: [6, 3],
        pointRadius: ctx => ctx.dataIndex === SPLIT_IDX ? 6 : 4,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgba(61,166,92,1)',
        pointBorderColor: isDark ? '#0f1f15' : '#fff',
        pointBorderWidth: 2,
        fill: true,
        tension: 0.4,
        spanGaps: false
      }
    ];
  }

  impactChart = new Chart(ctx, {
    type: d.type,
    data: { labels: d.labels, datasets },
    plugins: isBar ? [] : [todayLinePlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      layout: { padding: { top: 20 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: isDark ? '#fff' : '#0d2618',
          bodyColor: isDark ? 'rgba(255,255,255,0.65)' : '#3a5244',
          borderColor: 'rgba(61,166,92,0.25)',
          borderWidth: 1,
          padding: 14,
          cornerRadius: 10,
          filter: item => item.parsed.y !== null,
          callbacks: {
            title: items => {
              const lbl = items[0].label;
              return lbl === '2026' ? `${lbl}  —  Hoy` : lbl;
            },
            label: item => `  ${item.dataset.label}: ${item.parsed.y} ${d.yLabel}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor, drawBorder: false },
          ticks: { color: tickColor, font: { family: 'DM Sans', size: 12 }, padding: 8 },
          border: { display: false }
        },
        y: {
          grid: { color: gridColor, drawBorder: false },
          ticks: {
            color: tickColor,
            font: { family: 'DM Sans', size: 12 },
            padding: 8,
            callback: v => v + ' ' + d.yLabel
          },
          border: { display: false }
        }
      },
      animation: { duration: 500, easing: 'easeInOutQuart' }
    }
  });

  const note = document.getElementById('chartNote');
  if (note) note.textContent = d.note;

  // Sync toggle buttons
  const btnBad  = document.getElementById('toggleBad');
  const btnGood = document.getElementById('toggleGood');
  if (btnBad)  btnBad.classList.toggle('active', visibleLines.bad);
  if (btnGood) btnGood.classList.toggle('active', visibleLines.good);
}

function setChartView(view, e) {
  currentView = view;
  visibleLines = { bad: true, good: true };
  document.querySelectorAll('.cpill').forEach(b => b.classList.remove('active'));
  if (e && e.target) e.target.classList.add('active');

  const m = chartMeta[view];

  // Título y subtítulo
  const titleEl = document.getElementById('chartTitle');
  const subEl   = document.getElementById('chartSub');
  if (titleEl) titleEl.textContent = m.title;
  if (subEl)   subEl.textContent   = m.sub;

  // Leyenda
  const legEl = document.getElementById('chartLegend');
  if (legEl) {
    const spans = legEl.querySelectorAll('.cleg');
    if (spans[0]) spans[0].style.display = m.showReal ? '' : 'none';
    if (spans[1]) spans[1].lastChild.textContent = ' ' + m.legendBad;
    if (spans[2]) spans[2].lastChild.textContent = ' ' + m.legendGood;
  }

  // Botones toggle
  const btnBad  = document.getElementById('toggleBad');
  const btnGood = document.getElementById('toggleGood');
  if (btnBad)  btnBad.textContent  = m.legendBad;
  if (btnGood) btnGood.textContent = m.legendGood;
  const toggles = document.querySelector('.chart-toggles');
  if (toggles) toggles.style.display = m.showReal ? '' : 'none';

  // Tarjeta de contexto histórico
  const ctxEl      = document.getElementById('chartContext');
  const ctxPeriod  = document.getElementById('chartCtxPeriod');
  const ctxVerdict = document.getElementById('chartCtxVerdict');
  const ctxDetail  = document.getElementById('chartCtxDetail');
  if (ctxEl) ctxEl.style.display = m.ctxVerdict ? '' : 'none';
  if (m.ctxVerdict) {
    if (ctxPeriod)  ctxPeriod.textContent  = m.ctxPeriod;
    if (ctxVerdict) ctxVerdict.textContent = m.ctxVerdict;
    if (ctxDetail)  ctxDetail.textContent  = m.ctxDetail;
  }

  buildChart();
}

function toggleLine(which) {
  const other = which === 'bad' ? 'good' : 'bad';

  if (visibleLines[which] && !visibleLines[other]) {
    // Solo esta visible, volver a mostrar ambas
    visibleLines.bad  = true;
    visibleLines.good = true;
  } else {
    // Mostrar solo la seleccionada, ocultar la otra
    visibleLines[which] = true;
    visibleLines[other] = false;
  }

  buildChart();
}

// Init chart when impacto page becomes active
const _origGoTo = goTo;
goTo = function(pageId) {
  _origGoTo(pageId);
  if (pageId === 'impacto') setTimeout(buildChart, 50);
};

// Rebuild on theme toggle
const _origToggle = toggleTheme;
toggleTheme = function() {
  _origToggle();
  if (current === 'impacto') setTimeout(buildChart, 50);
};
