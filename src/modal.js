  function showModal(accs) {
    let filter = 'all';
    let sortSpec = [{ col: 'id', dir: 1 }];
    let currentRange = getRange('last_7_days');
    let currentPeriodKey = 'last_7_days';
    const selectedIds = new Set();
    const CONCURRENCY = 12;
    let arRules = [];
    let arSelectedTargets = new Set();
    let arFilter = 'all';
    let arSortMode = 'all';
    let arSrcId = '';
    let arRuleCounts = {};
    let arCountsLoaded = false;
    let arLogEntries = [];
    let arFoundGen = null;
    /*__PA_CLONE_EARLY__*/ function styleCb(cb, on) {
      cb.checked = !!on;
    }
    function popCb(cb) {
      cb.style.transform = 'scale(1.22)';
      setTimeout(() => {
        cb.style.transform = 'scale(1)';
      }, 130);
    }
    let recalcOv = null,
      recalcSt = null,
      recalcTotal = 0;
    function showRecalc(total, fLabel, periodLabel) {
      recalcTotal = total || 0;
      recalcOv = document.createElement('div');
      recalcOv.style.cssText =
        'position:fixed;inset:0;z-index:1000002;background:rgba(6,8,12,.82);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;';
      recalcOv.innerHTML =
        '<div class="pa-load-box"><div class="pa-load-title">' +
        t('recalc_title') +
        '</div><div class="pa-load-spinner"></div><div id="pa-rc-st" style="margin-top:16px;font-size:15px;color:#2dd4bf;font-family:ui-monospace,monospace;font-weight:700;">0 / ' +
        recalcTotal +
        '</div><div style="margin-top:9px;font-size:11px;color:#9aa0ab;">' +
        (periodLabel || '') +
        (fLabel ? t('recalc_filter_pre') + fLabel + t('recalc_filter_suf') : '') +
        '</div></div>';
      document.body.appendChild(recalcOv);
      recalcSt = document.getElementById('pa-rc-st');
    }
    function setRecalc(d, tt) {
      if (recalcSt) recalcSt.textContent = d + ' / ' + (tt || recalcTotal);
    }
    function hideRecalc() {
      if (recalcOv) {
        recalcOv.remove();
        recalcOv = null;
        recalcSt = null;
      }
    }
    const isAct = s => [1, 3, 7, 8, 9].includes(s);
    const getTargetByFilter = () =>
      filter === 'all'
        ? accs
        : accs.filter(a => (filter === 'active' ? isAct(a.account_status) : !isAct(a.account_status)));
    const filterLabel = () =>
      filter === 'all' ? t('all') : filter === 'active' ? t('active') : t('disabled');
    const stM = {
      1: { t: 'Active', c: '#37d67a' },
      2: { t: 'Disabled', c: '#ff5d6c' },
      3: { t: 'Unsettled', c: '#f5b13d' },
      7: { t: 'Review', c: '#f5b13d' },
      8: { t: 'Pending', c: '#f5b13d' },
      9: { t: 'Grace', c: '#f5b13d' },
      100: { t: 'Closing', c: '#8a8d91' },
      101: { t: 'Closed', c: '#8a8d91' }
    };
    const applySearch = (list, s) => {
      if (!s) return list;
      const q = s.toLowerCase();
      return list.filter(a => {
        const bmName = a.accessibleBM?.name || a.business?.name || '';
        const bmId = a.accessibleBM?.id || a.business?.id || '';
        return (
          bmName.toLowerCase().includes(q) ||
          bmId.toLowerCase().includes(q) ||
          (a.name || '').toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q)
        );
      });
    };
    const getSortVal = (a, col) => {
      switch (col) {
        case 'id':
          return a.id;
        case 'name':
          return a.name || '';
        case 'status':
          return a.account_status;
        case 'balance':
          return parseFloat(a.balance) || 0;
        case 'spend_life':
          return parseFloat(a.spend?.lifetime) || 0;
        case 'spend':
          return a._periodKey === currentPeriodKey ? parseFloat(a.periodSpend) || 0 : -1;
        case 'limit':
          return a.dailyLimit || 0;
        case 'billing':
          return a.billing || 0;
        case 'ads_ok':
          return a.adStats?.active || 0;
        case 'ads_no':
          return a.adStats?.rejected || 0;
        case 'bm':
          return a.accessibleBM?.name || a.business?.name || '';
        default:
          return '';
      }
    };
    const getFilt = () => {
      let f =
        filter === 'all'
          ? accs
          : accs.filter(a => (filter === 'active' ? isAct(a.account_status) : !isAct(a.account_status)));
      f.sort((a, b) => {
        for (const s of sortSpec) {
          const va = getSortVal(a, s.col),
            vb = getSortVal(b, s.col);
          let c = 0;
          if (typeof va === 'string' || typeof vb === 'string') c = String(va).localeCompare(String(vb));
          else c = va > vb ? 1 : va < vb ? -1 : 0;
          if (c !== 0) return c * s.dir;
        }
        return 0;
      });
      return f;
    };
    const getVisible = () => {
      const sEl = document.getElementById('fb-s');
      return applySearch(getFilt(), sEl ? sEl.value : '');
    };
    const getExportList = () => {
      const vis = getVisible();
      if (selectedIds.size > 0) return vis.filter(a => selectedIds.has(a.id));
      return vis;
    };
    const render = (list, search = '') => {
      let f = applySearch(list, search);
      if (!f.length) {
        return { rows: '<tr><td colspan="11" class="pa-empty">' + t('empty') + '</td></tr>', count: 0 };
      }
      let rows = '';
      f.forEach(a => {
        const s = stM[a.account_status] || { t: 'Unknown', c: '#8a8d91' };
        const cur = a.currency || 'USD';
        const rate = a.ratio || 1;
        const bal = a.balance ? parseFloat(a.balance).toFixed(2) : '0.00';
        const lifeRaw = a.spend && a.spend.lifetime !== undefined ? parseFloat(a.spend.lifetime) : null;
        const spentLife = lifeRaw === null ? '0.00' : (lifeRaw / rate).toFixed(2);
        const periodValid =
          a._periodKey === currentPeriodKey && a.periodSpend !== undefined && a.periodSpend !== null;
        const perRaw = periodValid ? parseFloat(a.periodSpend) : null;
        const spentPeriod = perRaw === null ? '—' : (perRaw / rate).toFixed(2);
        const bm = a.accessibleBM || a.business;
        const bN = bm?.name || '—';
        const bI = bm?.id || '—';
        const bmBad = !!(bm && bm.bad);
        const limitDisplay = a.dailyLimit === -1 ? '∞' : '$' + a.dailyLimit;
        const billingDisplay = a.billing > 0 ? '$' + a.billing : '—';
        const chk = selectedIds.has(a.id) ? 'checked' : '';
        const actNum = (a.id || '').replace(/^act_/, '');
        rows += `<tr class="pa-tr"><td class="pa-td pa-td-cb"><input type="checkbox" class="pa-cb" data-id="${a.id}" ${chk}></td><td class="pa-td"><a href="https://www.facebook.com/adsmanager/manage/campaigns?act=${actNum}" target="_blank" class="pa-link">${accountId(a.id)}</a></td><td class="pa-td" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${(a.name || '').replace(/"/g, '&quot;')}">${a.name || '—'}</td><td class="pa-td"><span class="pa-status" style="color:${s.c}">● ${s.t}</span></td><td class="pa-td pa-mono" style="color:#e8eaef">$${bal} <span style="color:#9aa0ab">${cur}</span></td><td class="pa-td pa-mono" style="color:#9aa0ab" title="${lifeRaw === null ? '' : lifeRaw.toFixed(2) + ' ' + cur}">$${spentLife}</td><td class="pa-td pa-mono" style="color:#2dd4bf;font-weight:600;" title="${perRaw === null ? '' : perRaw.toFixed(2) + ' ' + cur}">$${spentPeriod}</td><td class="pa-td pa-mono" style="color:#f5b13d">${limitDisplay}</td><td class="pa-td pa-mono" style="color:#a78bfa">${billingDisplay}</td><td class="pa-td" style="white-space:nowrap;"><span style="${((a.adStats || {}).active || 0) > 0 ? 'color:#37d67a;font-weight:800;text-shadow:0 0 7px rgba(55,214,122,.8);' : 'color:#6b7280;font-weight:800;'}" title="Запущенные (одобренные)">▶${(a.adStats || {}).active || 0}</span> <span style="color:#9aa0ab;" title="На паузе (одобренные)">⏸${(a.adStats || {}).paused || 0}</span> <span style="color:#ff5d6c;" title="Отклонённые">❌${(a.adStats || {}).rejected || 0}</span></td><td class="pa-td"><div class="pa-bm-name" title="${(bN || '').replace(/"/g, '&quot;')}" style="${bmBad ? 'color:#ff5d6c;text-shadow:0 0 6px rgba(255,93,108,.5);' : ''}">${bmBad ? '⛔ ' : ''}${bN}</div><div class="pa-bm-id" style="${bmBad ? 'color:#ff5d6c;' : ''}">${bI}</div></td></tr>`;
      });
      return { rows, count: f.length };
    };
    const init = render(getFilt());
    const modal = document.createElement('div');
    modal.id = 'pa-m';
    modal.style.background = '#141519';
    modal.innerHTML = `<div class="pa-h" style="position:relative;z-index:5;background:transparent"><div style="display:flex;align-items:center;gap:16px;"><div><div style="display:flex;align-items:center;gap:10px;"><div style="line-height:0;animation:pa-logoglow 3.4s ease-in-out infinite"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 225 5562 790" height="22" aria-label="FbAds.fun" role="img" style="display:block;overflow:visible"><defs><linearGradient id="pa-lg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="5562" y2="0" spreadMethod="reflect"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#e8eaef"/><stop offset=".85" stop-color="#9ff3e6"/><stop offset="1" stop-color="#fff"/><animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="11124 0" dur="7s" repeatCount="indefinite"/></linearGradient></defs><path fill="url(#pa-lg)" d="M165.1 557.2H708.1V717.8H165.1ZM725.9 245.0V405.5H169.2L261.9 312.5V995.0H73.1V245.0ZM812.5 225.0H998.3V598.3L973.4 647.0V781.3L998.3 829.1V995.0H812.5ZM936.0 710.1Q950.9 618.3 992.9 550.9Q1034.9 483.5 1099.1 446.3Q1163.4 409.1 1243.3 409.1Q1327.2 409.1 1390.8 446.8Q1454.3 484.5 1490.1 552.2Q1525.9 619.8 1525.9 710.1Q1525.9 799.5 1490.1 867.4Q1454.3 935.3 1390.8 973.0Q1327.2 1010.8 1243.3 1010.8Q1163.0 1010.8 1098.9 973.3Q1034.9 935.9 993.1 868.2Q951.4 800.5 936.0 710.1ZM1338.0 710.1Q1338.0 664.0 1319.0 628.3Q1300.0 592.7 1266.5 572.5Q1232.9 552.3 1189.4 552.3Q1145.4 552.3 1105.8 572.5Q1066.3 592.7 1036.7 628.3Q1007.1 664.0 990.5 710.1Q1007.1 756.3 1036.7 791.7Q1066.3 827.1 1105.8 847.4Q1145.4 867.6 1189.4 867.6Q1232.9 867.6 1266.5 847.4Q1300.0 827.1 1319.0 791.7Q1338.0 756.3 1338.0 710.1ZM1758.3 843.7V691.4H2276.4V843.7ZM2144.1 245.0 2490.1 995.0H2288.8L1992.4 323.8H2050.2L1753.8 995.0H1552.4L1898.5 245.0ZM3064.4 995.0 3039.2 780.4 3072.7 711.6 3039.8 626.0 3086.3 225.0H3278.8L3222.0 696.3L3256.4 995.0ZM3106.9 710.1Q3091.9 800.5 3050.0 868.2Q3008.0 935.9 2943.9 973.3Q2879.9 1010.8 2799.5 1010.8Q2716.1 1010.8 2652.3 973.0Q2588.5 935.3 2552.8 867.4Q2517.0 799.5 2517.0 710.1Q2517.0 619.8 2552.8 552.2Q2588.5 484.5 2652.3 446.8Q2716.1 409.1 2799.5 409.1Q2879.9 409.1 2943.9 446.3Q3008.0 483.5 3050.5 550.9Q3092.9 618.3 3106.9 710.1ZM2704.8 710.1Q2704.8 756.3 2723.8 791.7Q2742.8 827.1 2776.4 847.4Q2810.0 867.6 2853.5 867.6Q2898.1 867.6 2937.3 847.4Q2976.5 827.1 3006.6 791.7Q3036.7 756.3 3052.3 710.1Q3036.7 664.0 3006.6 628.3Q2976.5 592.7 2937.3 572.5Q2898.1 552.3 2853.5 552.3Q2810.0 552.3 2776.4 572.5Q2742.8 592.7 2723.8 628.3Q2704.8 664.0 2704.8 710.1ZM3993.2 812.1Q3993.2 875.9 3955.4 920.4Q3917.5 964.9 3845.5 987.8Q3773.6 1010.8 3671.1 1010.8Q3565.6 1010.8 3486.8 984.8Q3408.1 958.9 3364.0 911.9Q3319.9 865.0 3316.9 803.0H3505.6Q3512.1 828.3 3534.3 846.9Q3556.5 865.6 3592.8 875.2Q3629.1 884.8 3677.9 884.8Q3744.1 884.8 3777.9 871.0Q3811.6 857.1 3811.6 829.2Q3811.6 807.7 3787.1 797.0Q3762.5 786.4 3699.6 781.2L3596.2 773.0Q3497.7 765.5 3440.0 741.9Q3382.4 718.3 3357.7 681.2Q3333.0 644.1 3333.0 597.8Q3333.0 534.9 3372.4 493.1Q3411.8 451.4 3482.1 430.3Q3552.4 409.1 3645.9 409.1Q3740.2 409.1 3813.7 434.0Q3887.2 459.0 3931.4 503.2Q3975.5 547.3 3981.9 606.1H3793.1Q3788.7 586.3 3771.2 569.3Q3753.7 552.3 3721.2 541.4Q3688.7 530.5 3637.1 530.5Q3577.9 530.5 3546.7 543.8Q3515.6 557.1 3515.6 582.1Q3515.6 601.0 3534.6 612.2Q3553.7 623.4 3606.5 627.6L3741.9 638.4Q3837.8 645.5 3892.6 668.0Q3947.4 690.5 3970.3 726.8Q3993.2 763.2 3993.2 812.1Z"/><path fill="#2dd4bf" d="M4157.7 1001.0Q4139.3 1001.0 4124.2 992.3Q4109.1 983.5 4100.3 968.4Q4091.5 953.3 4091.5 934.8Q4091.5 916.1 4100.3 901.2Q4109.1 886.2 4124.2 877.4Q4139.3 868.7 4157.7 868.7Q4176.4 868.7 4191.4 877.4Q4206.3 886.2 4215.1 901.2Q4223.9 916.1 4223.9 934.8Q4223.9 953.3 4215.1 968.4Q4206.3 983.5 4191.4 992.3Q4176.4 1001.0 4157.7 1001.0ZM4526.3 594.1Q4483.9 594.1 4466.2 610.0Q4448.5 625.8 4448.5 660.6V995.0H4333.3V667.5Q4333.3 617.2 4353.3 581.5Q4373.3 545.9 4413.2 526.8Q4453.2 507.8 4512.6 507.8Q4539.5 507.8 4560.8 511.7Q4582.1 515.6 4605.0 522.4V608.0Q4586.5 601.0 4567.1 597.5Q4547.8 594.1 4526.3 594.1ZM4260.5 755.3V669.6H4596.8V755.3ZM4792.6 1004.5Q4743.4 1004.5 4708.7 984.2Q4673.9 964.0 4655.5 926.6Q4637.1 889.3 4637.1 838.6V641.5H4752.3V821.8Q4752.3 864.9 4773.0 887.7Q4793.6 910.4 4832.1 910.4Q4860.6 910.4 4880.3 898.8Q4900.1 887.1 4910.8 864.8Q4921.5 842.5 4921.5 812.1L4957.8 831.2Q4951.4 886.8 4928.1 925.6Q4904.8 964.3 4869.9 984.4Q4835.0 1004.5 4792.6 1004.5ZM4943.9 995.0 4921.5 857.0V641.5H5036.7V874.7L5059.1 995.0ZM5100.0 641.5H5215.2L5237.9 779.4V995.0H5122.7V762.1ZM5370.2 631.7Q5420.9 631.7 5456.4 652.0Q5492.0 672.2 5510.8 709.4Q5529.7 746.6 5529.7 797.8V995.0H5414.5V815.0Q5414.5 771.3 5393.0 748.5Q5371.4 725.7 5330.7 725.7Q5302.5 725.7 5281.5 737.9Q5260.5 750.0 5249.2 772.1Q5237.9 794.2 5237.9 824.4L5201.3 805.3Q5208.3 749.0 5232.1 710.4Q5255.8 671.9 5291.5 651.8Q5327.2 631.7 5370.2 631.7Z"/></svg></div><span id="pa-ver" title="${(function () {
      var L = window.__FbAdsLoader || window.__ParserAccsLoader || {};
      var r = 'Build ' + (typeof PA_BUILD !== 'undefined' ? PA_BUILD : 'dev');
      if (L.source) r += ' · loader: ' + L.source;
      if (L.remoteVersion) r += ' · Facebook manifest: ' + L.remoteVersion;
      if (L.warning) r += ' · ' + L.warning;
      return esc(r);
    })()}" style="display:inline-flex;align-items:center;gap:6px;padding:3px 9px 3px 8px;border-radius:999px;background:linear-gradient(135deg,rgba(45,212,191,.16),rgba(59,140,255,.16));border:1px solid rgba(45,212,191,.45);box-shadow:0 0 12px rgba(45,212,191,.18),inset 0 0 0 1px rgba(255,255,255,.03);font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10.5px;font-weight:700;letter-spacing:.4px;line-height:1;color:#5eead4;white-space:nowrap;cursor:default;user-select:none;"><span style="width:6px;height:6px;border-radius:50%;background:#2dd4bf;box-shadow:0 0 6px #2dd4bf;"></span>v${typeof PA_VERSION !== 'undefined' ? PA_VERSION : 'dev'}<span style="color:#7d8590;font-weight:500;">· ${typeof PA_BUILD_LABEL !== 'undefined' ? PA_BUILD_LABEL : 'local'}</span></span></div><div style="display:flex;align-items:center;gap:8px;margin-top:9px;flex-wrap:wrap;"><span style="display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.04);border:1px solid #33373f;border-radius:20px;padding:4px 12px;line-height:1;"><span id="pa-k-show" style="font-size:9px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#9aa0ab;">${t('shown')}</span><span style="font-family:ui-monospace,monospace;font-size:12px;font-weight:700;color:#2dd4bf;"><span id="fb-c">${init.count}</span> <span id="pa-x-of" style="color:#9aa0ab;">${t('of')}</span> <span id="pa-total">${accs.length}</span></span></span><span id="fb-selchip" style="display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.04);border:1px solid #33373f;border-radius:20px;padding:4px 12px;line-height:1;"><span id="pa-k-sel" style="font-size:9px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#9aa0ab;">${t('selected')}</span><span style="font-family:ui-monospace,monospace;font-size:12px;font-weight:700;color:#9aa0ab;">0</span></span></div></div></div><div style="display:flex;align-items:center;gap:12px;"><span class="pa-badge"><span class="pa-dot"></span><span style="white-space:nowrap;"><b id="pa-badge-n" style="font-weight:800;">${accs.filter(a => isAct(a.account_status)).length}</b> <span id="pa-badge-t">${t('accounts')}</span></span></span><span class="pa-badge" style="border-color:rgba(255,93,108,.45);"><span class="pa-dot-red"></span><span style="white-space:nowrap;"><b id="pa-badge-dis" style="font-weight:800;color:#ff5d6c;">${accs.filter(a => !isAct(a.account_status)).length}</b> <span id="pa-badge-dis-t" style="color:#ff5d6c;">${t('disabled')}</span></span></span><button id="pa-info" class="pa-lang" title="Info: BM / Pages " style="font-weight:800;font-style:italic;font-family:Georgia,serif;">i</button><button id="pa-refresh" class="pa-lang" title="${t('refresh_title')}">↻</button><button id="pa-lang-btn" class="pa-lang" title="Language">${LANG === 'ru' ? 'EN' : 'RU'}</button><button id="pa-x" class="pa-btn-close">✕</button></div></div><div class="pa-tabs" style="position:relative;z-index:5;"><button class="pa-tab active" data-tab="parser">${t('tab_parser')}</button><button class="pa-tab" data-tab="rules">${t('tab_rules')}</button>${window.__PA_CLONE_TAB_HTML || ''}</div><div id="pa-tab-parser" style="display:flex;flex-direction:column;flex:1;min-height:0;position:relative;z-index:5;"><div class="pa-toolbar" style="background:transparent"><span class="pa-lbl">${t('search_ph').split(',')[0]}</span><input id="fb-s" class="pa-input" placeholder="${t('search_ph')}" style="flex:1;min-width:200px;"><div style="width:1px;height:24px;background:rgba(51,55,63,.5);margin:0 6px;"></div><button class="pa-pill pa-f active" data-f="all">${t('all')}</button><button class="pa-pill pa-f" data-f="active">${t('active')}</button><button class="pa-pill pa-f" data-f="disabled">${t('disabled')}</button><span id="pa-sort-hint" style="margin-left:auto;font-size:10px;color:#9aa0ab;">${t('sort_hint')}</span></div><div class="pa-toolbar" style="background:transparent"><span class="pa-lbl" id="pa-lbl-period">${t('period')}</span><button class="pa-pill pa-p" data-p="today">Today</button><button class="pa-pill pa-p" data-p="yesterday">Yesterday</button><button class="pa-pill pa-p active" data-p="last_7_days">7d</button><button class="pa-pill pa-p" data-p="last_14_days">14d</button><button class="pa-pill pa-p" data-p="last_30_days">30d</button><button class="pa-pill pa-p" data-p="this_month">This month</button><button class="pa-pill pa-p" data-p="last_month">Last month</button><button class="pa-pill pa-p" data-p="maximum">Lifetime</button><div style="width:1px;height:24px;background:rgba(51,55,63,.5);margin:0 6px;"></div><input type="date" id="fb-d1" class="pa-input pa-date"><span style="color:#9aa0ab;">–</span><input type="date" id="fb-d2" class="pa-input pa-date"><button id="fb-apply" class="pa-pill pa-pill-primary">${t('apply')}</button><span id="pa-recalc-note" style="font-size:10px;color:#9aa0ab;margin-left:8px;">${t('recalc_pre')}<span id="fb-fl" style="color:#2dd4bf;">${filterLabel()}</span>${t('recalc_suf')}</span></div><div class="pa-tbl-wrap" style="background:transparent"><table class="pa-tbl"><thead class="pa-thead" style="position:sticky;top:0;z-index:3;background:#22252c"><tr><th class="pa-th pa-td-cb" style="cursor:default;"><input type="checkbox" class="pa-cb" id="fb-hdr-cb" title="All visible"></th><th class="pa-th" data-col="id">ID</th><th class="pa-th" data-col="name">Name</th><th class="pa-th" data-col="status">Status</th><th class="pa-th" data-col="balance">Balance</th><th class="pa-th" data-col="spend_life">Spend (Life)</th><th class="pa-th active" id="fb-ph" data-col="spend">Spend (7d)</th><th class="pa-th" data-col="limit">Limit</th><th class="pa-th" data-col="billing">Billing</th><th class="pa-th" data-col="ads_ok">Ads</th><th class="pa-th" data-col="bm">BM</th></tr></thead><tbody id="fb-tb"></tbody><tfoot><tr><td colspan="6" style="padding:10px 16px;font-size:10px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#6b7280;">Total spend <span id="pa-total-period" style="text-transform:none;letter-spacing:0;color:#6b7280;font-weight:600;"></span></td><td colspan="1" style="padding:10px 16px;text-align:left;font-family:ui-monospace,monospace;font-size:13px;font-weight:800;color:#2dd4bf;"><span id="pa-spend-total">$0.00</span></td><td colspan="4"></td></tr></tfoot></table></div><div class="pa-footer" style="background:transparent"><div class="pa-credits"><span id="pa-foot-dev">${t('dev')}</span> <a href="https://t.me/kw33nty" target="_blank" class="pa-link" style="font-weight:700;">Kwenty</a></div><div class="pa-actions"><button id="fb-csv" class="pa-btn pa-btn-csv">${csvLabel()}</button><button id="fb-cp" class="pa-btn pa-btn-primary">${copyLabel()}</button><button id="pa-close2" class="pa-btn">${t('close')}</button></div></div></div><div id="pa-tab-rules" style="display:none;flex:1;min-height:0;padding:16px 24px;position:relative;z-index:5;"><div style="display:flex;gap:16px;height:100%;min-height:0;align-items:stretch;"><div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:12px;min-height:0;"><div class="ar-box" style="flex:0 0 auto;"><div class="pa-lbl" id="ar-src-lbl" style="margin-bottom:8px;">${t('ar_src')}</div><input id="ar-src-search" class="pa-input" placeholder="${t('ar_src_ph')}" style="width:100%;margin-bottom:8px;"><div id="ar-src-list" style="max-height:170px;overflow-y:auto;border:1px solid #33373f;border-radius:8px;"></div><button id="ar-export" class="pa-action pa-action-primary pa-source-action">${t('ar_export')}</button><div id="ar-found" style="margin-top:8px;font-size:11px;color:#9aa0ab;"></div></div><div class="ar-box" style="flex:1;min-height:0;display:flex;flex-direction:column;"><div class="pa-lbl" id="ar-rules-lbl" style="margin-bottom:8px;">${t('ar_rules_title')}</div><div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;flex:0 0 auto;"><button id="ar-expjson" class="pa-pill">${t('ar_export_json')}</button><label class="pa-pill" style="display:inline-flex;align-items:center;cursor:pointer;margin:0;"><span id="ar-impjson-lbl">${t('ar_import_json')}</span><input type="file" id="ar-impjson" accept=".json,application/json" style="display:none;"></label></div><div id="ar-rules" style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:6px;"><div class="pa-empty" style="padding:20px;">${t('ar_no_rules')}</div></div></div><div class="ar-box" style="flex:0 0 auto;display:flex;flex-direction:column;gap:8px;font-size:12px;color:#e8eaef;"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;"><input type="checkbox" class="pa-cb" id="ar-convert" checked> <span id="ar-convert-lbl">${t('ar_convert')}</span></label><label style="display:flex;align-items:center;gap:8px;cursor:pointer;"><input type="checkbox" class="pa-cb" id="ar-purge"> <span id="ar-purge-lbl">${t('ar_purge')}</span></label><label style="display:flex;align-items:center;gap:8px;cursor:pointer;"><input type="checkbox" class="pa-cb" id="ar-paused"> <span id="ar-paused-lbl">${t('ar_as_paused')}</span></label><div id="ar-tz-hint" style="font-size:10px;color:#9aa0ab;line-height:1.5;border-top:1px solid #33373f;padding-top:8px;margin-top:2px;">${t('ar_tz_hint')}</div></div></div><div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:12px;min-height:0;"><div class="ar-box" style="flex:1;min-height:0;display:flex;flex-direction:column;"><div class="pa-lbl" id="ar-targets-lbl" style="margin-bottom:8px;">${t('ar_targets')}</div><div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;flex:0 0 auto;"><input id="ar-search" class="pa-input" placeholder="${t('search_ph')}" style="flex:1;min-width:140px;"><button class="pa-pill ar-f active" data-f="all">${t('all')}</button><button class="pa-pill ar-f" data-f="active">${t('active')}</button><button class="pa-pill ar-f" data-f="disabled">${t('disabled')}</button></div><div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;flex:0 0 auto;align-items:center;"><span class="pa-lbl" id="ar-sort-lbl" style="margin-right:2px;">${t('ar_sort_lbl')}</span><button class="pa-pill ar-cf active" data-cf="all">${LANG === 'ru' ? 'Все' : 'All'}</button><button class="pa-pill ar-cf" data-cf="rules_first">${LANG === 'ru' ? 'С правилами' : 'With rules'}</button><button class="pa-pill ar-cf" data-cf="no_rules_first">${LANG === 'ru' ? 'Без правил' : 'No rules'}</button></div><div style="display:flex;gap:10px;margin-bottom:8px;align-items:center;flex:0 0 auto;padding:6px 10px;border:1px solid #33373f;border-radius:8px;background:rgba(255,255,255,.02);"><input type="checkbox" class="pa-cb" id="ar-hdr-cb" title="All visible"><span id="ar-tgtcnt" style="font-family:ui-monospace,monospace;font-size:11px;font-weight:700;"><b style="color:#2dd4bf;">0</b><span style="color:#6b7280;"> / 0</span></span><span id="ar-tgtcnt-lbl" style="font-size:10px;color:#9aa0ab;">${t('selected').toLowerCase()}</span></div><div id="ar-targets" style="flex:1;min-height:0;overflow-y:auto;border:1px solid #33373f;border-radius:8px;"></div></div><div class="pa-action-row"><button id="ar-import" class="pa-action pa-action-primary">${t('ar_import')}</button><button id="ar-enable" class="pa-action pa-action-success">${t('ar_enable')}</button><button id="ar-disable" class="pa-action pa-action-warning">${t('ar_disable')}</button><button id="ar-delete" class="pa-action pa-action-danger">${t('ar_delete')}</button></div><div class="ar-box" style="flex:1;min-height:0;display:flex;flex-direction:column;background:#0e1014;"><div class="pa-lbl" id="ar-log-lbl" style="margin-bottom:6px;">${t('ar_log')}</div><div id="ar-log" style="flex:1;min-height:0;overflow-y:auto;font-family:ui-monospace,monospace;font-size:11px;line-height:1.5;"></div></div></div></div></div>${window.__PA_CLONE_PANEL_HTML || ''}`;
    const bd = document.createElement('div');
    bd.id = 'pa-bd';
    bd.onclick = () => {
      closeAll();
    };
    document.body.appendChild(bd);
    document.body.appendChild(modal);
    const cvs = document.createElement('canvas');
    cvs.id = 'pa-cvs';
    cvs.style.cssText =
      'position:absolute;left:0;top:0;width:100%;height:100%;display:block;pointer-events:none;z-index:1;';
    modal.insertBefore(cvs, modal.firstChild);
    function showInfoPanel() {
      var old = document.getElementById('pa-info-ov');
      if (old) old.remove();
      var ov = document.createElement('div');
      ov.id = 'pa-info-ov';
      ov.style.cssText =
        'position:fixed;inset:0;z-index:1000004;background:rgba(6,8,12,.72);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;';
      var box = document.createElement('div');
      box.style.cssText =
        'width:min(820px,94vw);max-height:84vh;background:#141519;border:1px solid #33373f;border-radius:14px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.55);';
      box.innerHTML =
        '<div style="display:flex;align-items:center;gap:12px;padding:13px 18px;border-bottom:1px solid #33373f;"><span style="font-weight:800;font-size:15px;color:#e8eaef;">ℹ️ Info</span><span id="pa-info-tabs" style="display:flex;gap:6px;margin-left:8px;"></span><button id="pa-info-x" style="margin-left:auto;background:none;border:none;color:#9aa0ab;font-size:16px;cursor:pointer;">✕</button></div><div id="pa-info-body" style="overflow:auto;padding:14px 18px;font-size:12px;color:#e8eaef;"></div>';
      ov.appendChild(box);
      document.body.appendChild(ov);
      ov.addEventListener('click', function (e) {
        if (e.target === ov) ov.remove();
      });
      box.querySelector('#pa-info-x').onclick = function () {
        ov.remove();
      };
      var body = box.querySelector('#pa-info-body');
      var tabsEl = box.querySelector('#pa-info-tabs');
      body.innerHTML =
        '<div style="color:#9aa0ab;padding:24px;text-align:center;">⏳ ' + t('loading') + '</div>';
      Promise.all([
        fetchJson(
          'https://graph.facebook.com/v25.0/me/businesses?fields=id,name,verification_status,is_disabled&limit=100&access_token=' +
            encodeURIComponent(token)
        ).catch(function () {
          return { data: [] };
        }),
        fetchJson(
          'https://graph.facebook.com/v25.0/me/accounts?fields=id,name,category,fan_count,is_published,username,access_token&limit=200&access_token=' +
            encodeURIComponent(token)
        ).catch(function () {
          return { data: [] };
        })
      ])
        .then(function (res) {
          var bms = res[0].data || [];
          var pages = res[1].data || [];
          var bmX = {};
          var pgX = {};
          var badByBm = {};
          accs.forEach(function (a) {
            var bm = a.accessibleBM;
            if (bm && bm.bad) badByBm[bm.id] = true;
          });
          Promise.all(
            bms
              .map(function (b) {
                return Promise.all([
                  fetchJson(
                    'https://graph.facebook.com/v25.0/' +
                      b.id +
                      '/users?fields=id&limit=200&access_token=' +
                      encodeURIComponent(token)
                  ).catch(function () {
                    return null;
                  }),
                  fetchJson(
                    'https://graph.facebook.com/v25.0/' +
                      b.id +
                      '/owned_pages?fields=id&limit=200&access_token=' +
                      encodeURIComponent(token)
                  ).catch(function () {
                    return null;
                  }),
                  fetchJson(
                    'https://graph.facebook.com/v25.0/' +
                      b.id +
                      '/client_pages?fields=id&limit=200&access_token=' +
                      encodeURIComponent(token)
                  ).catch(function () {
                    return null;
                  }),
                  fetchJson(
                    'https://graph.facebook.com/v25.0/' +
                      b.id +
                      '/pages?fields=id&limit=200&access_token=' +
                      encodeURIComponent(token)
                  ).catch(function () {
                    return null;
                  })
                ]).then(function (r) {
                  var pgSet = {};
                  for (var i = 1; i < 4; i++) {
                    var rr = r[i];
                    if (rr && rr.data)
                      rr.data.forEach(function (p) {
                        pgSet[p.id] = 1;
                      });
                  }
                  bmX[b.id] = {
                    users: r[0] ? (r[0].data || []).length : null,
                    pages: Object.keys(pgSet).length
                  };
                });
              })
              .concat(
                pages.map(function (p) {
                  if (!p.access_token) return Promise.resolve();
                  return fetchJson(
                    'https://graph.facebook.com/v25.0/' +
                      p.id +
                      '/roles?fields=id&limit=100&access_token=' +
                      encodeURIComponent(p.access_token)
                  )
                    .then(function (r) {
                      pgX[p.id] = (r.data || []).length;
                    })
                    .catch(function () {
                      pgX[p.id] = null;
                    });
                })
              )
          ).then(function () {
            var tabs = [
              { id: 'pages', l: '📘 Pages(' + pages.length + ')' },
              { id: 'bm', l: '💼 Businesses(' + bms.length + ')' }
            ];
            tabsEl.innerHTML = '';
            tabs.forEach(function (tb, i) {
              var b = document.createElement('button');
              b.className = 'pa-pill' + (i === 0 ? ' active' : '');
              b.textContent = tb.l;
              b.onclick = function () {
                tabsEl.querySelectorAll('button').forEach(function (x) {
                  x.classList.remove('active');
                });
                b.classList.add('active');
                render(tb.id);
              };
              tabsEl.appendChild(b);
            });
            render('pages');
            function accCount(bid) {
              var n = 0;
              accs.forEach(function (a) {
                var bm = a.accessibleBM || a.business;
                if (bm && bm.id === bid) n++;
              });
              return n;
            }
            function render(id) {
              var h = '<table style="width:100%;border-collapse:collapse;">';
              if (id === 'pages') {
                h +=
                  '<tr><th class="pa-th">Name</th><th class="pa-th">Status</th><th class="pa-th">Likes</th><th class="pa-th">Users</th><th class="pa-th">Category</th></tr>';
                if (!pages.length)
                  h +=
                    '<tr><td colspan="5" class="pa-empty" style="padding:16px;">' + t('empty') + '</td></tr>';
                pages.forEach(function (p) {
                  var on = p.is_published !== false;
                  h +=
                    '<tr style="border-top:1px solid #23262e;"><td class="pa-td"><b style="color:#e8eaef;">' +
                    esc(p.name || '—') +
                    '</b><div style="color:#9aa0ab;font-size:10px;">' +
                    p.id +
                    '</div></td><td class="pa-td" style="white-space:nowrap;">' +
                    (on
                      ? '<span style="color:#37d67a;">● Published</span>'
                      : '<span style="color:#ff5d6c;">● Unpublished</span>') +
                    '</td><td class="pa-td pa-mono" style="color:#2dd4bf;font-weight:700;">' +
                    (p.fan_count != null ? p.fan_count : 0) +
                    '</td><td class="pa-td pa-mono" style="color:#f5b13d;">' +
                    (pgX[p.id] != null ? pgX[p.id] : '—') +
                    '</td><td class="pa-td" style="color:#9aa0ab;">' +
                    esc(p.category || '—') +
                    (p.username ? ' · @' + esc(p.username) : '') +
                    '</td></tr>';
                });
              } else {
                h +=
                  '<tr><th class="pa-th">Name</th><th class="pa-th">Status</th><th class="pa-th">Verification</th><th class="pa-th">Acc</th><th class="pa-th">Pages</th><th class="pa-th">Users</th></tr>';
                if (!bms.length)
                  h +=
                    '<tr><td colspan="6" class="pa-empty" style="padding:16px;">' + t('empty') + '</td></tr>';
                bms.forEach(function (b) {
                  var ex = bmX[b.id] || {};
                  var dis = !!b.is_disabled || !!badByBm[b.id];
                  var v = b.verification_status || 'unknown';
                  var vc = v === 'verified' ? '#37d67a' : v === 'unverified' ? '#f5b13d' : '#9aa0ab';
                  h +=
                    '<tr style="border-top:1px solid #23262e;"><td class="pa-td"><b style="color:#e8eaef;">' +
                    esc(b.name || '—') +
                    '</b><div style="color:#9aa0ab;font-size:10px;">' +
                    b.id +
                    '</div></td><td class="pa-td" style="white-space:nowrap;">' +
                    (dis
                      ? '<span style="color:#ff5d6c;">● Banned</span>'
                      : '<span style="color:#37d67a;">● Active</span>') +
                    '</td><td class="pa-td"><span style="color:' +
                    vc +
                    ';">' +
                    esc(v) +
                    '</span></td><td class="pa-td pa-mono" style="color:#2dd4bf;font-weight:700;">' +
                    accCount(b.id) +
                    '</td><td class="pa-td pa-mono" style="color:#a78bfa;">' +
                    (ex.pages != null ? ex.pages : '—') +
                    '</td><td class="pa-td pa-mono" style="color:#f5b13d;">' +
                    (ex.users != null ? ex.users : '—') +
                    '</td></tr>';
                });
              }
              h += '</table>';
              body.innerHTML = h;
            }
          });
        })
        .catch(function (e) {
          body.innerHTML =
            '<div style="color:#ff5d6c;padding:16px;">✗ ' + esc((e && e.message) || e) + '</div>';
        });
    }
    var infoBtn = document.getElementById('pa-info');
    if (infoBtn)
      infoBtn.onclick = function () {
        showInfoPanel();
      };
    const tb = modal.querySelector('#fb-tb');
    if (tb) tb.innerHTML = init.rows;
    updateSpendTotal();
    (function () {
      var x = cvs.getContext('2d');
      if (!x) return;
      var w = 0,
        h = 0,
        p = [],
        raf = 0;
      var COLS = ['45,212,191', '45,212,191', '45,212,191', '59,140,255', '167,139,250'];
      var mouse = { x: -9999, y: -9999, on: false };
      function rs() {
        w = Math.max(1, modal.clientWidth);
        h = Math.max(1, modal.clientHeight);
        cvs.width = w;
        cvs.height = h;
      }
      function Pt() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.s = Math.random() * 1.6 + 0.7;
        this.c = COLS[(Math.random() * COLS.length) | 0];
      }
      Pt.prototype.u = function () {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > w) this.vx *= -1;
        if (this.y < 0 || this.y > h) this.vy *= -1;
      };
      function build() {
        p = [];
        var n = Math.min(120, Math.max(38, Math.round((w * h) / 12000)));
        for (var i = 0; i < n; i++) p.push(new Pt());
      }
      function line(ax, ay, bx, by, col, alpha) {
        x.beginPath();
        x.strokeStyle = 'rgba(' + col + ',' + alpha.toFixed(3) + ')';
        x.lineWidth = 0.6;
        x.moveTo(ax, ay);
        x.lineTo(bx, by);
        x.stroke();
      }
      rs();
      build();
      (function f() {
        x.clearRect(0, 0, w, h);
        for (var i = 0; i < p.length; i++) {
          var a = p[i];
          a.u();
          x.shadowColor = 'rgba(' + a.c + ',.8)';
          x.shadowBlur = 6;
          x.beginPath();
          x.arc(a.x, a.y, a.s, 0, 6.2832);
          x.fillStyle = 'rgba(' + a.c + ',.7)';
          x.fill();
          x.shadowBlur = 0;
          if (mouse.on) {
            var mdx = a.x - mouse.x,
              mdy = a.y - mouse.y,
              md = Math.sqrt(mdx * mdx + mdy * mdy);
            if (md < 150) line(a.x, a.y, mouse.x, mouse.y, a.c, 0.45 * (1 - md / 150));
          }
          for (var j = i + 1; j < p.length; j++) {
            var b = p[j],
              dx = a.x - b.x,
              dy = a.y - b.y,
              d = Math.sqrt(dx * dx + dy * dy);
            if (d < 120) line(a.x, a.y, b.x, b.y, '45,212,191', 0.16 * (1 - d / 120));
          }
        }
        raf = requestAnimationFrame(f);
      })();
      function mm(e) {
        var r = cvs.getBoundingClientRect();
        var mx = e.clientX - r.left,
          my = e.clientY - r.top;
        if (mx >= 0 && my >= 0 && mx <= w && my <= h) {
          mouse.x = mx;
          mouse.y = my;
          mouse.on = true;
        } else mouse.on = false;
      }
      window.addEventListener('resize', function () {
        rs();
        build();
      });
      window.addEventListener('mousemove', mm);
      window.addEventListener('mouseout', function () {
        mouse.on = false;
      });
      modal._paStop = function () {
        cancelAnimationFrame(raf);
      };
    })();
    function bindCbs() {
      modal.querySelectorAll('.pa-cb[data-id]').forEach(cb => {
        if (cb._paCh) return;
        cb._paCh = 1;
        cb.addEventListener('change', function () {
          if (this.checked) selectedIds.add(this.dataset.id);
          else selectedIds.delete(this.dataset.id);
          popCb(this);
          updateSelUI();
        });
        const td = cb.closest('.pa-td-cb');
        if (td && !td._paBound) {
          td._paBound = 1;
          td.style.cursor = 'pointer';
          td.addEventListener('click', function (e) {
            if (e.target.closest('input')) return;
            cb.checked = !cb.checked;
            cb.dispatchEvent(new Event('change'));
          });
        }
      });
    }
    function copyLabel() {
      return selectedIds.size > 0 ? t('copy_n') + selectedIds.size + ')' : t('copy');
    }
    function csvLabel() {
      return selectedIds.size > 0 ? t('csv_n') + selectedIds.size + ')' : t('csv');
    }
    function updateSortIndicators() {
      document.querySelectorAll('.pa-th[data-col]').forEach(th => {
        const col = th.dataset.col;
        const idx = sortSpec.findIndex(s => s.col === col);
        th.classList.toggle('active', idx >= 0);
        let badge = th.querySelector('.pa-sort-badge');
        if (idx >= 0) {
          const s = sortSpec[idx];
          if (!badge) {
            badge = document.createElement('span');
            badge.className = 'pa-sort-badge';
            th.appendChild(badge);
          }
          badge.textContent = (sortSpec.length > 1 ? idx + 1 : '') + (s.dir > 0 ? ' ↑' : ' ↓');
        } else if (badge) badge.remove();
      });
    }
    function applyLang() {
      var e;
      e = document.getElementById('pa-k-show');
      if (e) e.textContent = t('shown');
      e = document.getElementById('pa-x-of');
      if (e) e.textContent = t('of');
      e = document.getElementById('pa-k-sel');
      if (e) e.textContent = t('selected');
      e = document.getElementById('pa-badge-t');
      if (e) e.textContent = t('accounts');
      e = document.getElementById('pa-badge-dis-t');
      if (e) e.textContent = t('disabled');
      e = document.getElementById('fb-s');
      if (e) e.placeholder = t('search_ph');
      document.querySelectorAll('.pa-f').forEach(function (b) {
        var k = { all: 'all', active: 'active', disabled: 'disabled' }[b.dataset.f];
        if (k) b.textContent = t(k);
      });
      e = document.getElementById('pa-lbl-period');
      if (e) e.textContent = t('period');
      e = document.getElementById('fb-apply');
      if (e) e.textContent = t('apply');
      var note = document.getElementById('pa-recalc-note');
      if (note)
        note.innerHTML =
          t('recalc_pre') +
          '<span id="fb-fl" style="color:#2dd4bf;">' +
          filterLabel() +
          '</span>' +
          t('recalc_suf');
      e = document.getElementById('pa-foot-dev');
      if (e) e.textContent = t('dev');
      e = document.getElementById('pa-close2');
      if (e) e.textContent = t('close');
      e = document.getElementById('pa-lang-btn');
      if (e) e.textContent = LANG === 'ru' ? 'EN' : 'RU';
      e = document.getElementById('pa-refresh');
      if (e) e.title = t('refresh_title');
      e = document.getElementById('pa-sort-hint');
      if (e) e.textContent = t('sort_hint');
      document.querySelectorAll('.pa-th[data-col]').forEach(function (th) {
        th.title = t('sort_th_title');
      });
      var tabs = document.querySelectorAll('.pa-tab');
      if (tabs[0]) tabs[0].textContent = t('tab_parser');
      if (tabs[1]) tabs[1].textContent = t('tab_rules');
      if (tabs[2]) tabs[2].textContent = t('tab_clone');
      var arMap = {
        'ar-src-lbl': 'ar_src',
        'ar-export': 'ar_export',
        'ar-rules-lbl': 'ar_rules_title',
        'ar-convert-lbl': 'ar_convert',
        'ar-purge-lbl': 'ar_purge',
        'ar-paused-lbl': 'ar_as_paused',
        'ar-targets-lbl': 'ar_targets',
        'ar-import': 'ar_import',
        'ar-enable': 'ar_enable',
        'ar-disable': 'ar_disable',
        'ar-delete': 'ar_delete',
        'ar-log-lbl': 'ar_log',
        'ar-expjson': 'ar_export_json',
        'ar-impjson-lbl': 'ar_import_json',
        'ar-tz-hint': 'ar_tz_hint',
        'ar-tgtcnt-lbl': 'selected',
        'ar-sort-lbl': 'ar_sort_lbl',
        'cl-donor-lbl': 'cl_donor',
        'cl-load': 'cl_load',
        'cl-camps-lbl': 'cl_camps',
        'cl-opts-lbl': 'cl_opts',
        'cl-status-lbl': 'cl_status',
        'cl-naming-lbl': 'cl_naming',
        'cl-suf-lbl': 'cl_suffix',
        'cl-run': 'cl_run',
        'cl-log-lbl': 'cl_log',
        'cl-targets-lbl': 'cl_targets',
        'cl-status-hint': 'cl_status_hint',
        'cl-expstruct': 'cl_expstruct',
        'cl-impstruct-lbl': 'cl_impstruct',
        'cl-sort-lbl': 'cl_sort_lbl',
        'cl-stop': 'cl_stop',
        'cl-running-lbl': 'cl_running',
        'cl-copyrow-lbl': 'cl_copyrow_lbl',
        'cl-reset-prog': 'cl_reset_prog'
      };
      for (var id in arMap) {
        var el = document.getElementById(id);
        if (el) el.textContent = t(arMap[id]);
      }
      document.querySelectorAll('.ar-cf').forEach(function (b) {
        var cf = b.dataset.cf;
        b.textContent =
          cf === 'all'
            ? LANG === 'ru'
              ? 'Все'
              : 'All'
            : cf === 'rules_first'
              ? LANG === 'ru'
                ? 'С правилами'
                : 'With rules'
              : LANG === 'ru'
                ? 'Без правил'
                : 'No rules';
      });
      var cfMap2 = {
        all: 'cl_sort_default',
        camps_first: 'cl_sort_camps_first',
        no_camps_first: 'cl_sort_no_camps_first'
      };
      document.querySelectorAll('.cl-cf').forEach(function (b) {
        var k = cfMap2[b.dataset.cf];
        if (k) b.textContent = t(k);
      });
      var sse = document.getElementById('ar-src-search');
      if (sse) sse.placeholder = t('ar_src_ph');
      var se = document.getElementById('ar-search');
      if (se) se.placeholder = t('search_ph');
      var clse = document.getElementById('cl-search');
      if (clse) clse.placeholder = t('search_ph');
      var dls = document.getElementById('cl-donor-search');
      if (dls) dls.placeholder = t('cl_donor_ph');
      var st = document.getElementById('cl-status');
      if (st) {
        st.options[0].textContent = t('cl_st_paused');
        st.options[1].textContent = t('cl_st_active');
      }
      var nm = document.getElementById('cl-naming');
      if (nm) {
        nm.options[0].textContent = t('cl_nm_swap');
        nm.options[1].textContent = t('cl_nm_findrep');
        nm.options[2].textContent = t('cl_nm_original');
      }
      var cf = document.getElementById('cl-find');
      if (cf) cf.placeholder = t('cl_find');
      var cr = document.getElementById('cl-repl');
      if (cr) cr.placeholder = t('cl_repl');
      if (!arRules.length) {
        var rb = document.getElementById('ar-rules');
        if (rb) rb.innerHTML = '<div class="pa-empty" style="padding:20px;">' + t('ar_no_rules') + '</div>';
      }
      var cle = document.getElementById('cl-log-empty');
      if (cle && cle.style.display !== 'none') cle.textContent = t('cl_log_empty');
      if (typeof updateCopyRow === 'function') updateCopyRow();
      rerender();
    }
    function updateSelUI() {
      const cp = document.getElementById('fb-cp');
      if (cp && cp.dataset.busy !== '1') cp.textContent = copyLabel();
      const cv = document.getElementById('fb-csv');
      if (cv && cv.dataset.busy !== '1') cv.textContent = csvLabel();
      const vis = getVisible();
      const allVis = vis.length > 0 && vis.every(a => selectedIds.has(a.id));
      const hdr = document.getElementById('fb-hdr-cb');
      if (hdr) hdr.checked = allVis;
      const selChip = document.getElementById('fb-selchip');
      if (selChip) {
        const on = selectedIds.size > 0;
        selChip.style.background = on ? 'rgba(55,214,122,.14)' : 'rgba(255,255,255,.04)';
        selChip.style.borderColor = on ? 'rgba(55,214,122,.55)' : '#33373f';
        const k = selChip.children[0],
          v = selChip.children[1];
        if (k) k.style.color = on ? '#7ee2a8' : '#9aa0ab';
        if (v) {
          v.style.color = on ? '#37d67a' : '#9aa0ab';
          v.textContent = selectedIds.size;
        }
      }
    }
    function stampNow() {
      const d = new Date();
      const p = n => String(n).padStart(2, '0');
      return (
        d.getFullYear() +
        p(d.getMonth() + 1) +
        p(d.getDate()) +
        '_' +
        p(d.getHours()) +
        p(d.getMinutes()) +
        p(d.getSeconds())
      );
    }
    function csvCell(v) {
      return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    }
    function csvTex(v) {
      var c = '="' + String(v == null ? '' : v) + '"';
      return '"' + c.replace(/"/g, '""') + '"';
    }
    function downloadCSV(list) {
      const periodLabel = currentRange ? currentRange.label : '';
      const header = [
        'ID',
        'Name',
        'Status',
        'Balance',
        'Currency',
        'Spend Life',
        'Spend Period',
        'Period',
        'Limit',
        'Billing',
        'Ads OK',
        'Ads No',
        'BM Name',
        'BM ID'
      ];
      const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
      const num = v => {
        const n = parseFloat(v);
        if (isNaN(n)) return q('');
        const s = String(Math.round(n * 100) / 100);
        return '"' + (typeof LANG !== 'undefined' && LANG === 'ru' ? s.replace('.', ',') : s) + '"';
      };
      const txt = v => {
        const c = '="' + String(v == null ? '' : v) + '"';
        return '"' + c.replace(/"/g, '""') + '"';
      };
      const lines = [header.map(q).join(',')];
      list.forEach(a => {
        const s = stM[a.account_status] || { t: 'Unknown' };
        const bm = a.accessibleBM || a.business;
        const pv = a._periodKey === currentPeriodKey && a.periodSpend != null;
        const row = [
          q(a.id),
          q(a.name || ''),
          q(s.t),
          num(a.balance),
          q(a.currency || 'USD'),
          num(a.spend && a.spend.lifetime != null ? a.spend.lifetime : null),
          pv ? num(a.periodSpend) : q(''),
          q(periodLabel),
          q(a.dailyLimit === -1 ? 'INF' : a.dailyLimit || 0),
          q(a.billing > 0 ? a.billing : ''),
          q(a.ads ? a.ads.ok : 0),
          q(a.ads ? a.ads.no : 0),
          q(bm?.name || ''),
          txt(bm?.id || '')
        ];
        lines.push(row.join(','));
      });
      const csv = '\uFEFFsep=,\r\n' + lines.join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const aEl = document.createElement('a');
      aEl.href = url;
      aEl.download = 'fbads_' + stampNow() + '.csv';
      document.body.appendChild(aEl);
      aEl.click();
      aEl.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }
    function updateSpendTotal() {
      const list = getVisible();
      let s = 0;
      list.forEach(a => {
        if (a._periodKey === currentPeriodKey && a.periodSpend != null)
          s += (parseFloat(a.periodSpend) || 0) / (a.ratio || 1);
      });
      const el = document.getElementById('pa-spend-total');
      if (el) el.textContent = '$' + s.toFixed(2);
      const pl = document.getElementById('pa-total-period');
      if (pl) pl.textContent = '· ' + currentRange.label + ' · ' + list.length + ' acc';
    }
    const rerender = () => {
      const sEl = document.getElementById('fb-s');
      const r = render(getFilt(), sEl ? sEl.value : '');
      const tbEl = document.getElementById('fb-tb');
      if (tbEl) tbEl.innerHTML = r.rows;
      const cEl = document.getElementById('fb-c');
      if (cEl) cEl.textContent = r.count;
      bindCbs();
      updateSelUI();
      updateSpendTotal();
    };
    const setActivePreset = p => {
      document.querySelectorAll('.pa-p').forEach(x => x.classList.remove('active'));
      const btn = document.querySelector(`.pa-p[data-p="${p}"]`);
      if (btn) btn.classList.add('active');
    };
    const cacheMap = {
      today: 'today',
      yesterday: 'yesterday',
      last_7_days: 'last7Days',
      maximum: 'lifetime'
    };
    const applyRange = async (preset, customSince, customUntil) => {
      let periodKey, labelRange;
      if (preset === 'custom') {
        if (!customSince || !customUntil) {
          alert(t('both_dates'));
          return;
        }
        labelRange = { since: customSince, until: customUntil, label: customSince + ' → ' + customUntil };
        periodKey = 'custom:' + customSince + ':' + customUntil;
      } else {
        labelRange = getRange(preset);
        periodKey = preset;
      }
      currentRange = labelRange;
      currentPeriodKey = periodKey;
      const ph = document.getElementById('fb-ph');
      if (ph) ph.textContent = 'Spend (' + labelRange.label + ')';
      if (preset !== 'custom') {
        setActivePreset(preset);
        const d1 = document.getElementById('fb-d1'),
          d2 = document.getElementById('fb-d2');
        if (preset === 'maximum') {
          d1.value = '';
          d2.value = '';
        } else {
          d1.value = labelRange.since;
          d2.value = labelRange.until;
        }
      } else setActivePreset('');
      if (preset !== 'custom' && cacheMap[preset]) {
        const key = cacheMap[preset];
        accs.forEach(a => {
          a.periodSpend = a.spend[key];
          a._periodKey = periodKey;
        });
        rerender();
        return;
      }
      const target = getTargetByFilter();
      const fLabel = filterLabel();
      const note = document.getElementById('pa-recalc-note');
      if (note)
        note.innerHTML =
          t('recalc_pre') +
          '<span id="fb-fl" style="color:#2dd4bf;">' +
          fLabel +
          '</span>' +
          t('recalc_suf');
      if (!target.length) {
        rerender();
        return;
      }
      const customRange = preset === 'custom' ? { since: customSince, until: customUntil } : null;
      showRecalc(target.length, fLabel, labelRange.label);
      try {
        await runBatched(
          target,
          CONCURRENCY,
          async a => {
            const range = customRange || getRange(preset, a.timezone_name || undefined);
            const sp = await getInsightsMulti(a.id, [range]);
            a.periodSpend = sp[0];
            a._periodKey = periodKey;
          },
          (d, tt) => setRecalc(d, tt)
        );
      } finally {
        hideRecalc();
      }
      rerender();
    };
