// app.js using currentLang from i18n.js

const defaults = {
  price: 3000000000,
  ltv: 50,
  promoRate: 10,
  promoPeriod: 12,
  floatingRate: 13,
  loanTenure: 10,
  extraPayment: 5000000,
  repaymentMethod: 'reducing'
};

const state = {
  mode: 'single', // 'single' or 'compare'
  activeTab: 'A',
  showFullSchedule: false,
  A: { ...defaults, result: null },
  B: { ...defaults, result: null }
};

const inputIds = ['price', 'ltv', 'promoRate', 'promoPeriod', 'floatingRate', 'loanTenure', 'extraPayment'];
const domInputs = {};
inputIds.forEach(id => {
  domInputs[id] = document.getElementById(`in-${id}`);
});
const ltvVal = document.getElementById('in-ltv-val');

let charts = { combined: null, pieSingle: null, lineSingle: null };

// Init
updateTexts();
syncInputsToState();
recalculateAll();

// Language Toggle
document.getElementById('lang-en').addEventListener('click', () => setLang('en'));
document.getElementById('lang-vi').addEventListener('click', () => setLang('vi'));

function setLang(lang) {
  currentLang = lang;

  const btnEn = document.getElementById('lang-en');
  const btnVi = document.getElementById('lang-vi');

  if (btnEn && btnVi) {
    if (lang === 'en') {
      btnEn.className = 'join-item btn btn-xs border-none font-bold shadow-sm bg-white text-indigo-600';
      btnVi.className = 'join-item btn btn-xs border-none font-bold shadow-none bg-transparent text-slate-400';
    } else {
      btnVi.className = 'join-item btn btn-xs border-none font-bold shadow-sm bg-white text-indigo-600';
      btnEn.className = 'join-item btn btn-xs border-none font-bold shadow-none bg-transparent text-slate-400';
    }
  }

  updateTexts();
  recalculateAll(); // updates chart texts
}

// Nav Toggle
document.getElementById('nav-single').addEventListener('click', () => setMode('single'));
document.getElementById('nav-compare').addEventListener('click', () => setMode('compare'));

function setMode(mode) {
  state.mode = mode;

  const navSingle = document.getElementById('nav-single');
  const navCompare = document.getElementById('nav-compare');

  const activeClasses = 'bg-indigo-50 text-indigo-600'.split(' ');
  const inactiveClasses = 'hover:bg-slate-50 hover:text-indigo-600'.split(' ');

  const breadcrumbActive = document.getElementById('breadcrumb-active');
  if (mode === 'single') {
    navSingle.classList.add(...activeClasses);
    navSingle.classList.remove(...inactiveClasses);
    navCompare.classList.add(...inactiveClasses);
    navCompare.classList.remove(...activeClasses);
    if (breadcrumbActive) breadcrumbActive.setAttribute('data-i18n', 'navScenarios');
  } else {
    navCompare.classList.add(...activeClasses);
    navCompare.classList.remove(...inactiveClasses);
    navSingle.classList.add(...inactiveClasses);
    navSingle.classList.remove(...activeClasses);
    if (breadcrumbActive) breadcrumbActive.setAttribute('data-i18n', 'navComparisons');
  }

  const scenarioTabs = document.getElementById('scenario-tabs');
  const compSummary = document.getElementById('compare-summary');
  const singleSummary = document.getElementById('single-summary');
  const chartCombinedContainer = document.getElementById('chart-combined-container');
  const chartSingleContainer = document.getElementById('chart-single-container');
  const milestonesContainer = document.getElementById('milestones-container');
  const comparePieContainer = document.getElementById('compare-pie-container');

  if (mode === 'compare') {
    scenarioTabs.style.display = 'flex';
    compSummary.classList.remove('hidden');
    compSummary.style.display = 'grid';
    singleSummary.classList.add('hidden');
    singleSummary.style.display = 'none';
    chartCombinedContainer.classList.remove('hidden');
    chartCombinedContainer.style.display = 'block';
    chartSingleContainer.classList.add('hidden');
    chartSingleContainer.style.display = 'none';
    milestonesContainer.classList.add('hidden');
    milestonesContainer.style.display = 'none';
    comparePieContainer.classList.remove('hidden');
    comparePieContainer.style.display = 'block';
  } else {
    scenarioTabs.style.display = 'none';
    compSummary.classList.add('hidden');
    compSummary.style.display = 'none';
    singleSummary.classList.remove('hidden');
    singleSummary.style.display = 'grid';
    chartCombinedContainer.classList.add('hidden');
    chartCombinedContainer.style.display = 'none';
    chartSingleContainer.classList.remove('hidden');
    chartSingleContainer.style.display = 'grid';
    milestonesContainer.classList.remove('hidden');
    milestonesContainer.style.display = 'block';
    comparePieContainer.classList.add('hidden');
    comparePieContainer.style.display = 'none';
  }

  updateTexts();
  recalculateAll();
  setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
}

// Tab Toggle
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('bg-white', 'text-indigo-600', 'shadow-sm', 'font-bold');
      b.classList.add('text-slate-500', 'hover:text-slate-700', 'font-medium');
    });
    e.target.classList.remove('text-slate-500', 'hover:text-slate-700', 'font-medium');
    e.target.classList.add('bg-white', 'text-indigo-600', 'shadow-sm', 'font-bold');

    state.activeTab = e.target.getAttribute('data-target');
    syncInputsToState();
    recalculateAll();
  });
});

// Input Listeners
inputIds.forEach(id => {
  if (domInputs[id]) {
    domInputs[id].addEventListener('input', (e) => {
      state[state.activeTab][id] = Number(e.target.value) || 0;
      if (id === 'ltv') {
        if (ltvVal) ltvVal.textContent = state[state.activeTab].ltv + '%';
      }
      updateHelpers();
      recalculateAll();
    });
  }
});

function syncInputsToState() {
  const current = state[state.activeTab];
  inputIds.forEach(id => {
    if (domInputs[id]) {
      domInputs[id].value = current[id];
    }
  });
  if (ltvVal) {
    ltvVal.textContent = current.ltv + '%';
  }
  updateHelpers();
  syncRepaymentUI();
}

function syncRepaymentUI() {
  const method = state[state.activeTab].repaymentMethod;
  document.querySelectorAll('.repayment-radio').forEach(radio => {
    if (radio.value === method) {
      radio.checked = true;
      const label = radio.closest('.repayment-label');
      label.className = 'repayment-label flex items-center gap-3 p-3.5 border-2 border-indigo-200 bg-indigo-50/30 rounded-xl cursor-pointer transition-colors';
      label.querySelector('span').className = 'text-[13px] font-bold text-slate-800';
    } else {
      radio.checked = false;
      const label = radio.closest('.repayment-label');
      label.className = 'repayment-label flex items-center gap-3 p-3.5 border border-slate-200 bg-white rounded-xl cursor-pointer hover:border-slate-300 transition-colors';
      label.querySelector('span').className = 'text-[13px] font-medium text-slate-600';
    }
  });
}

document.querySelectorAll('.repayment-radio').forEach(radio => {
  radio.addEventListener('change', (e) => {
    state[state.activeTab].repaymentMethod = e.target.value;
    syncRepaymentUI();
    recalculateAll();
  });
});

function updateHelpers() {
  const p = state[state.activeTab].price;
  const e = state[state.activeTab].extraPayment;

  const helperPriceNum = document.getElementById('helper-price-num');
  const helperPriceWord = document.getElementById('helper-price-word');

  if (helperPriceNum && helperPriceWord) {
    if (p > 0) {
      helperPriceNum.textContent = formatCurrency(p);
      helperPriceWord.textContent = numberToVietnameseWords(p);
    } else {
      helperPriceNum.textContent = '';
      helperPriceWord.textContent = '';
    }
  }

  const helperExtraNum = document.getElementById('helper-extra-num');
  const helperExtraWord = document.getElementById('helper-extra-word');

  if (helperExtraNum && helperExtraWord) {
    if (e > 0) {
      helperExtraNum.textContent = formatCurrency(e);
      helperExtraWord.textContent = numberToVietnameseWords(e);
    } else {
      helperExtraNum.textContent = '';
      helperExtraWord.textContent = '';
    }
  }
}

function numberToVietnameseWords(num) {
  if (num === 0) return '0 đồng';
  let result = '';
  const ty = Math.floor(num / 1000000000);
  const trieu = Math.floor((num % 1000000000) / 1000000);
  const nghin = Math.floor((num % 1000000) / 1000);

  if (ty > 0) result += ty + ' tỷ ';
  if (trieu > 0) result += trieu + ' triệu ';
  if (nghin > 0) result += nghin + ' nghìn ';
  return result.trim() + ' đồng';
}

function recalculateAll() {
  // Calculate both
  state.A.result = calculateMortgage({
    propertyPrice: state.A.price,
    ltv: state.A.ltv,
    promoRate: state.A.promoRate,
    promoPeriod: state.A.promoPeriod,
    floatingRate: state.A.floatingRate,
    loanTenure: state.A.loanTenure,
    extraPayment: state.A.extraPayment,
    repaymentMethod: state.A.repaymentMethod
  });

  state.B.result = calculateMortgage({
    propertyPrice: state.B.price,
    ltv: state.B.ltv,
    promoRate: state.B.promoRate,
    promoPeriod: state.B.promoPeriod,
    floatingRate: state.B.floatingRate,
    loanTenure: state.B.loanTenure,
    extraPayment: state.B.extraPayment,
    repaymentMethod: state.B.repaymentMethod
  });

  updateUI();
}

function updateUI() {
  const resA = state.A.result;
  const resB = state.B.result;
  const currentRes = state[state.activeTab].result;

  if (state.mode === 'compare') {
    // Update Comp Cards
    const totalA = resA.totalPaymentToBank;
    const totalB = resB.totalPaymentToBank;
    const diffTotal = totalB - totalA;

    const elCompTotalA = document.getElementById('comp-total-A');
    if (elCompTotalA) elCompTotalA.textContent = formatCurrency(totalA);

    const elDiffTotal = document.getElementById('comp-diff-total');
    if (elDiffTotal) {
      elDiffTotal.textContent = (diffTotal > 0 ? '+ ' : '') + formatCurrency(Math.abs(diffTotal));
      elDiffTotal.className = diffTotal < 0 ? 'px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-600 font-extrabold text-[11px] flex items-center gap-1 border border-emerald-200' : 'px-2.5 py-1 rounded-md bg-red-100 text-red-600 font-extrabold text-[11px] flex items-center gap-1 border border-red-200';
    }

    const intA = resA.totalInterest;
    const intB = resB.totalInterest;
    const diffInt = intB - intA;

    const elCompIntA = document.getElementById('comp-int-A');
    if (elCompIntA) elCompIntA.textContent = formatCurrency(intA);

    const elDiffInt = document.getElementById('comp-diff-int');
    if (elDiffInt) {
      elDiffInt.textContent = (diffInt > 0 ? '+ ' : '') + formatCurrency(Math.abs(diffInt));
      elDiffInt.className = diffInt < 0 ? 'px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-600 font-extrabold text-[11px] flex items-center gap-1 border border-emerald-200' : 'px-2.5 py-1 rounded-md bg-red-100 text-red-600 font-extrabold text-[11px] flex items-center gap-1 border border-red-200';
    }

    renderCombinedChart(resA.amortizationSchedule, resB.amortizationSchedule);
    renderPieChartCompare('A', resA.loanAmount, resA.totalInterest);
    renderPieChartCompare('B', resB.loanAmount, resB.totalInterest);
  } else {
    // Update Single Cards
    const elOutTotal = document.getElementById('out-total');
    const elOutInterest = document.getElementById('out-interest');
    const elOutM1 = document.getElementById('out-m1');
    const elOutTenure = document.getElementById('out-tenure');

    if (elOutTotal) elOutTotal.textContent = formatCurrency(currentRes.totalPaymentToBank);
    if (elOutInterest) elOutInterest.textContent = formatCurrency(currentRes.totalInterest);
    if (elOutM1) elOutM1.textContent = formatCurrency(currentRes.m1);
    if (elOutTenure) elOutTenure.textContent = currentRes.payoffMonths;

    renderPieChartSingle(currentRes.loanAmount, currentRes.totalInterest);
    renderLineChartSingle(currentRes.amortizationSchedule);
  }

  // Milestones always match activeTab
  renderMilestones(currentRes);
}

function renderCombinedChart(scheduleA, scheduleB) {
  const dataA = scheduleA.map(row => row.balance);
  const dataB = scheduleB.map(row => row.balance);

  // Make categories based on the longer schedule
  const maxLen = Math.max(scheduleA.length, scheduleB.length);
  const categories = Array.from({ length: maxLen }, (_, i) => i + 1);

  charts.combined = Highcharts.chart('chart-combined', {
    chart: { type: 'line', backgroundColor: 'transparent' },
    title: { text: null },
    xAxis: { categories: categories, title: { text: t('tableMonth') }, tickInterval: 12 },
    yAxis: { title: { text: t('chartBalance') }, labels: { formatter: function () { return this.value / 1000000 + 'M'; } } },
    tooltip: {
      shared: true,
      formatter: function () {
        let s = `Tháng ${this.x}`;
        this.points.forEach(point => {
          s += `<br/>${point.series.name}: <b>${formatCurrency(point.y)}</b>`;
        });
        return s;
      }
    },
    plotOptions: {
      line: {
        marker: { enabled: false },
        lineWidth: 3
      }
    },
    series: [
      {
        name: `${t('scenario')} A`,
        data: dataA,
        color: '#10b981' // Solid Green
      },
      {
        name: `${t('scenario')} B`,
        data: dataB,
        color: '#6366f1', // Indigo
        dashStyle: 'Dash' // Dashed line
      }
    ],
    legend: { enabled: true, verticalAlign: 'bottom' },
    credits: { enabled: false }
  });
}

function renderPieChartSingle(principal, interest) {
  charts.pieSingle = Highcharts.chart('chart-pie-single', {
    chart: { type: 'pie', backgroundColor: 'transparent', height: 320 },
    title: {
      text: '<div style="text-align:center"><span style="font-size:12px;color:#64748b;font-weight:600">' + t('totalPrincipalInterest') + '</span><br><span style="font-size:22px;font-weight:800;color:#1e293b">' + formatCurrency(principal + interest) + '</span></div>',
      align: 'center',
      verticalAlign: 'middle',
      y: 15,
      useHTML: true
    },
    plotOptions: {
      pie: {
        innerSize: '75%',
        borderWidth: 0,
        dataLabels: {
          enabled: true,
          formatter: function () {
            return '<b>' + this.point.name + '</b>: ' + formatCurrency(this.y);
          },
          style: { fontWeight: 'bold', color: '#475569', fontSize: '10px', textOutline: 'none' }
        },
        colors: ['#4f46e5', '#cbd5e1']
      }
    },
    series: [{
      name: 'Amount',
      data: [
        { name: t('chartPrincipal'), y: principal },
        { name: t('chartInterest'), y: interest }
      ]
    }],
    credits: { enabled: false }
  });
}

function renderPieChartCompare(scenario, principal, interest) {
  const containerId = 'chart-pie-' + scenario;
  const chartKey = 'pie' + scenario;

  let colors = ['#4f46e5', '#cbd5e1']; // Default Single (Indigo / Slate)
  if (scenario === 'A') colors = ['#4f46e5', '#cbd5e1'];
  if (scenario === 'B') colors = ['#10b981', '#a7f3d0'];

  charts[chartKey] = Highcharts.chart(containerId, {
    chart: { type: 'pie', backgroundColor: 'transparent', height: 280 },
    title: {
      text: '<div style="text-align:center"><span style="font-size:12px;color:#64748b;font-weight:600">' + t('totalPrincipalInterest') + '</span><br><span style="font-size:18px;font-weight:800;color:#1e293b">' + formatCurrency(principal + interest) + '</span></div>',
      align: 'center',
      verticalAlign: 'middle',
      y: 10,
      useHTML: true
    },
    plotOptions: {
      pie: {
        innerSize: '75%',
        borderWidth: 0,
        dataLabels: {
          enabled: true,
          formatter: function () {
            return '<b>' + this.point.name + '</b><br>' + formatCurrency(this.y);
          },
          style: { fontWeight: 'bold', color: '#475569', fontSize: '10px', textOutline: 'none' },
          distance: -30 // Move labels inside for better look in small charts
        },
        colors: colors
      }
    },
    series: [{
      name: 'Amount',
      data: [
        { name: t('chartPrincipal'), y: principal },
        { name: t('chartInterest'), y: interest }
      ]
    }],
    credits: { enabled: false }
  });
}

function renderLineChartSingle(schedule) {
  const data = schedule.map(row => row.balance);

  charts.lineSingle = Highcharts.chart('chart-line-single', {
    chart: { type: 'area', backgroundColor: 'transparent' },
    title: { text: '' },
    xAxis: {
      categories: schedule.map(r => r.month),
      labels: { style: { color: '#64748b', fontSize: '10px', fontWeight: 'bold' } },
      lineColor: '#e2e8f0',
      tickColor: '#e2e8f0'
    },
    yAxis: {
      title: { text: '' },
      labels: { formatter: function () { return (this.value / 1000000) + (currentLang === 'vi' ? ' Tr' : 'M'); }, style: { color: '#64748b', fontSize: '10px', fontWeight: 'bold' } },
      gridLineColor: '#f1f5f9',
      gridLineDashStyle: 'dash'
    },
    legend: { enabled: false },
    tooltip: {
      shared: true,
      valueSuffix: ' ₫',
      valueDecimals: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderRadius: 8,
      shadow: true,
      style: { color: '#1e293b' }
    },
    plotOptions: {
      area: {
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(79, 70, 229, 0.2)'],
            [1, 'rgba(79, 70, 229, 0)']
          ]
        },
        marker: { enabled: false, radius: 4, symbol: 'circle' },
        lineWidth: 3,
        states: { hover: { lineWidth: 3 } },
        threshold: null
      }
    },
    series: [
      { type: 'area', name: 'Dư Nợ', data: data, color: '#4f46e5' }
    ],
    credits: { enabled: false }
  });
}

function renderMilestones(result) {
  const tbody = document.getElementById('milestones-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const schedule = result.amortizationSchedule;
  const promoPeriod = state[state.activeTab].promoPeriod;

  let displayData = [];
  if (state.showFullSchedule) {
    displayData = schedule;
  } else {
    schedule.forEach((row, index) => {
      const isFirst = index === 0;
      const isLast = index === schedule.length - 1;
      const isYearly = row.month % 12 === 0;
      const isAfterPromo = row.month === promoPeriod + 1;
      if (isFirst || isLast || isYearly || isAfterPromo) {
        if (!displayData.find(m => m.month === row.month)) {
          displayData.push(row);
        }
      }
    });
  }

  displayData.forEach(m => {
    const tr = document.createElement('tr');
    tr.className = "border-b border-slate-100 hover:bg-slate-50/50 transition-colors";

    // Highlight first month or years
    const isHighlight = m.month === 1 || m.month % 12 === 0;
    const tdClass = isHighlight ? "py-3 px-6 font-bold text-indigo-600" : "py-3 px-6";
    const tdValClass = isHighlight ? "py-3 px-6 font-bold text-slate-800" : "py-3 px-6";

    tr.innerHTML = `
      <td class="${tdClass}">${m.month.toString().padStart(2, '0')}</td>
      <td class="${tdValClass}">${formatCurrency(m.balance + m.principal)}</td>
      <td class="${tdValClass}">${formatCurrency(m.principal)}</td>
      <td class="${tdValClass} text-red-500">${formatCurrency(m.interest)}</td>
      <td class="${tdValClass} font-extrabold text-slate-800">${formatCurrency(m.payment)}</td>
      <td class="${tdValClass}">${formatCurrency(m.balance)}</td>
    `;
    tbody.appendChild(tr);
  });
}

const btnExport = document.getElementById('btn-export');
if (btnExport) {
  btnExport.addEventListener('click', () => {
    const schedule = state[state.activeTab].result.amortizationSchedule;
    if (!schedule || schedule.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += `${t('tableMonth')},${t('tablePayment')},${t('tablePrincipal')},${t('tableInterest')},${t('tableBalance')}\n`;

    schedule.forEach(row => {
      const rowArray = [row.month, Math.round(row.payment), Math.round(row.principal), Math.round(row.interest), Math.round(row.balance)];
      csvContent += rowArray.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mortgage_schedule_${state.activeTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}



const btnShowAll = document.getElementById('btn-show-all');
if (btnShowAll) {
  btnShowAll.addEventListener('click', () => {
    state.showFullSchedule = !state.showFullSchedule;

    // Update button text
    if (state.showFullSchedule) {
      btnShowAll.innerHTML = `Thu gọn lịch trình <svg class="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`;
    } else {
      btnShowAll.innerHTML = `Xem toàn bộ lịch trình trả nợ <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`;
    }

    recalculateAll();
  });
}

// Theme Toggle Logic
const themeToggle = document.getElementById('theme-toggle');
const themeIconSun = document.getElementById('theme-icon-sun');
const themeIconMoon = document.getElementById('theme-icon-moon');
const themeText = document.getElementById('theme-text');
const htmlEl = document.documentElement;

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDark = htmlEl.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    htmlEl.setAttribute('data-theme', newTheme);
    
    if (newTheme === 'dark') {
      themeIconSun.classList.add('hidden');
      themeIconMoon.classList.remove('hidden');
      themeText.textContent = 'Dark Mode';
    } else {
      themeIconSun.classList.remove('hidden');
      themeIconMoon.classList.add('hidden');
      themeText.textContent = 'Light Mode';
    }
    
    // Refresh charts to match theme if needed
    recalculateAll();
  });
}

// Init
setLang(currentLang);
setMode('single');
