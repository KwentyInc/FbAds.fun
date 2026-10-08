  /*__SECTION_EARLY__*/
  /* CloneAds part 1/3: state, i18n, UI, API helpers. Joined with clone.2.js and clone.3.js by scripts/build-payload.cjs. */
  let clDonorId = '',
    clCampaigns = [],
    clSelectedTargets = new Set(),
    clFilter = 'all',
    clNameMode = 'swap',
    clPageCache = {},
    clPageNameCache = {},
    clThumbCache = {},
    clPixelListCache = {},
    clDonorPixelNameCache = {},
    clIgCache = {},
    clPageTokenCache = {},
    clCampCounts = {},
    clCountsLoaded = false,
    clSortMode = 'default',
    clAbort = false,
    clCurIds = [],
    donePairs = new Set(),
    okAccounts = new Set(),
    failedAccounts = new Set(),
    failReason = {},
    clDraftAppId = '';
  const clNorm = s =>
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]/g, '');
  const CL_GRAPH = 'https:' + '//graph.facebook.com/v25.0/';
  const CL_TGT_NUM = '{' + '{TGT_ID_NUM}' + '}',
    CL_TGT_ID = '{' + '{TGT_ID}' + '}';
  const clL = (ru, en) => (LANG === 'en' ? en : ru);
  function clDbg() {
    try {
      return localStorage.getItem('pa_debug') === '1';
    } catch (e) {
      return false;
    }
  }
  function clAmUrl(tgt) {
    return (
      'https:' +
      '//www.facebook.com/adsmanager/manage/campaigns?act=' +
      String(tgt || '').replace(/^act_/, '')
    );
  }
  const CLX = {
    ru: {
      fp_lbl: 'Fan page',
      fp_ph: 'ID страницы (пусто = авто)',
      rand_budget: 'Рандом бюджета',
      rand_page: 'Рандом Fan page (каталоги, не мультиязык)',
      dedup: 'Дублить одинаковые креативы в адсетах (по названию)',
      dedup_tip:
        'Объявления с одинаковым названием во всех адсетах кампании используют один и тот же креатив (создаётся один раз)',
      nm_tpl: 'Шаблон с макросами',
      tpl_camp: 'Кампания',
      tpl_adset: 'Адсет',
      tpl_ad: 'Объявление',
      tpl_hint: 'Клик по макросу — вставить в активное поле. Пустое поле = имя как в оригинале.',
      camps_in_acc: 'кампаний в кабинете',
      sort_all: 'Все кабинеты',
      sort_with: 'С кампаниями',
      sort_without: 'Без кампаний',
      all_visible: 'Все видимые',
      stopping: '⏹ Останавливаю…',
      from_file: '(из файла)'
    },
    en: {
      fp_lbl: 'Fan page',
      fp_ph: 'Page ID (empty = auto)',
      rand_budget: 'Random budget',
      rand_page: 'Random Fan page (catalogs, not multilingual)',
      dedup: 'Reuse identical creatives across ad sets (by name)',
      dedup_tip: 'Ads with the same name in all ad sets of a campaign share one creative (created once)',
      nm_tpl: 'Template with macros',
      tpl_camp: 'Campaign',
      tpl_adset: 'Ad set',
      tpl_ad: 'Ad',
      tpl_hint: 'Click a macro to insert it into the focused field. Empty field = original name.',
      camps_in_acc: 'campaigns in account',
      sort_all: 'All accounts',
      sort_with: 'With campaigns',
      sort_without: 'No campaigns',
      all_visible: 'All visible',
      stopping: '⏹ Stopping…',
      from_file: '(from file)'
    }
  };
  function clT(k) {
    const d = CLX[LANG === 'en' ? 'en' : 'ru'];
    if (d && d[k] != null) return d[k];
    if (CLX.ru[k] != null) return CLX.ru[k];
    return t(k);
  }
  const CL_MACROS = [
    ['idacc', 'ID кабинета-цели без act_', 'Target account ID without act_'],
    ['act', 'act_ID цели', 'Target act_ID'],
    ['accname', 'Имя кабинета-цели', 'Target account name'],
    ['donor', 'ID донора', 'Donor account ID'],
    ['geo', 'Страны таргета (UA-PL)', 'Targeting countries (UA-PL)'],
    ['date', 'Дата ДД.ММ.ГГГГ', 'Date DD.MM.YYYY'],
    ['dd', 'День', 'Day'],
    ['mm', 'Месяц', 'Month'],
    ['yy', 'Год 2 цифры', 'Year, 2 digits'],
    ['time', 'Время ЧЧ-ММ', 'Time HH-MM'],
    ['name', 'Оригинальное имя этого уровня', 'Original name of this level'],
    ['camp', 'Имя кампании донора', 'Donor campaign name'],
    ['adset', 'Имя адсета донора', 'Donor ad set name'],
    ['ad', 'Имя объявления донора', 'Donor ad name'],
    [
      'n',
      'Порядковый номер (адсет в кампании / объявление в адсете)',
      'Sequence number (ad set in campaign / ad in ad set)'
    ],
    ['page', 'Имя fan page', 'Fan page name'],
    ['objective', 'Цель кампании (SALES, LEADS…)', 'Campaign objective (SALES, LEADS…)'],
    ['budget', 'Дневной бюджет донора', 'Donor daily budget'],
    ['currency', 'Валюта цели', 'Target currency'],
    ['rand', 'Случайные 4 цифры', 'Random 4 digits']
  ];
  function clMacrosHtml() {
    return CL_MACROS.map(
      m =>
        '<code class="cl-mc" data-m="{' +
        m[0] +
        '}" title="' +
        esc(clL(m[1], m[2])) +
        '">{' +
        m[0] +
        '}</code>'
    ).join('');
  }
  function clWaitTxt(a, m, w) {
    const s = Math.round(w / 1000);
    return clL('повтор ' + a + '/' + m + ' через ' + s + ' с…', 'retry ' + a + '/' + m + ' in ' + s + 's…');
  }
  window.__PA_CLONE_TAB_HTML = `<button class="pa-tab" data-tab="clone">${t('tab_clone')}</button>`;
  (function () {
    var st = document.createElement('style');
    st.textContent =
      '#cl-camps{height:104px!important;min-height:104px!important;max-height:104px!important;flex:0 0 auto!important;}#cl-camps-box{flex:0 0 auto!important;}#pa-tab-clone .pa-action:disabled{opacity:.45;cursor:not-allowed;}';
    (document.head || document.documentElement).appendChild(st);
  })();
  window.__PA_CLONE_PANEL_HTML = `<div id="pa-tab-clone" style="display:none;flex:1;min-height:0;padding:16px 24px;position:relative;z-index:5;"><div style="display:flex;gap:16px;height:100%;min-height:0;align-items:stretch;"><div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:12px;min-height:0;overflow-y:auto;"><div class="ar-box" style="flex:0 0 auto;"><div class="pa-lbl" id="cl-donor-lbl" style="margin-bottom:8px;">${t('cl_donor')}</div><input id="cl-donor-search" class="pa-input" placeholder="${t('cl_donor_ph')}" style="width:100%;margin-bottom:8px;"><div id="cl-donor-list" style="max-height:100px;overflow-y:auto;border:1px solid #33373f;border-radius:8px;"></div><button id="cl-load" class="pa-action pa-action-primary pa-source-action">${t('cl_load')}</button></div><div class="ar-box" id="cl-camps-box" style="flex:0 0 auto;display:flex;flex-direction:column;"><div class="pa-lbl" id="cl-camps-lbl" style="margin-bottom:8px;">${t('cl_camps')}</div><div id="cl-camps" style="height:104px;min-height:104px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;"><div class="pa-empty" style="padding:20px;">${t('cl_no_camps')}</div></div><div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;flex:0 0 auto;"><button id="cl-expstruct" class="pa-pill">${t('cl_expstruct')}</button><label class="pa-pill" style="cursor:pointer;margin:0;display:inline-flex;align-items:center;"><span id="cl-impstruct-lbl">${t('cl_impstruct')}</span><input type="file" id="cl-impstruct" accept=".json,application/json" style="display:none;"></label></div></div><div class="ar-box" style="flex:0 0 auto;display:flex;flex-direction:column;gap:8px;font-size:12px;color:#e8eaef;"><div class="pa-lbl" id="cl-opts-lbl">${t('cl_opts')}</div><label style="display:flex;align-items:center;gap:8px;cursor:pointer;"><span style="min-width:110px;color:#9aa0ab;" id="cl-status-lbl">${t('cl_status')}</span><select id="cl-status" class="pa-input" style="padding:6px 10px;font-size:11px;flex:1;"><option value="PAUSED">${t('cl_st_paused')}</option><option value="ACTIVE">${t('cl_st_active')}</option></select></label><div id="cl-status-hint" style="font-size:10px;color:#9aa0ab;line-height:1.4;margin-top:-2px;">${t('cl_status_hint')}</div><label style="display:flex;align-items:center;gap:8px;cursor:pointer;"><input type="checkbox" class="pa-cb" id="cl-draft-mode" checked> <span id="cl-draft-lbl">${t('cl_draft_mode')}</span></label><label style="display:flex;align-items:center;gap:8px;"><span id="cl-fp-lbl" style="min-width:110px;color:#9aa0ab;">${clT('fp_lbl')}</span><input id="cl-fp-override" class="pa-input" placeholder="${clT('fp_ph')}" style="padding:6px 10px;font-size:11px;flex:1;"></label><label style="display:flex;align-items:center;gap:8px;"><input type="checkbox" class="pa-cb" id="cl-rand-budget"><span id="cl-rand-budget-lbl">${clT('rand_budget')}</span><input id="cl-rand-min" class="pa-input" placeholder="min" style="width:70px;flex:0 0 70px;"><span>–</span><input id="cl-rand-max" class="pa-input" placeholder="max" style="width:70px;flex:0 0 70px;"></label><label style="display:flex;align-items:center;gap:8px;"><input type="checkbox" class="pa-cb" id="cl-rand-page"><span id="cl-rand-page-lbl">${clT('rand_page')}</span></label><label style="display:flex;align-items:center;gap:8px;cursor:pointer;"><input type="checkbox" class="pa-cb" id="cl-dedup-creative" checked> <span id="cl-dedup-lbl" title="${clT('dedup_tip')}">${clT('dedup')}</span></label><label style="display:flex;align-items:center;gap:8px;cursor:pointer;"><span style="min-width:110px;color:#9aa0ab;" id="cl-naming-lbl">${t('cl_naming')}</span><select id="cl-naming" class="pa-input" style="padding:6px 10px;font-size:11px;flex:1;"><option value="swap">${t('cl_nm_swap')}</option><option value="findrep">${t('cl_nm_findrep')}</option><option value="original">${t('cl_nm_original')}</option><option value="template">${clT('nm_tpl')}</option></select></label><div id="cl-tpl-row" style="display:none;flex-direction:column;gap:6px;padding:8px;border:1px dashed #33373f;border-radius:8px;"><div style="display:flex;gap:6px;align-items:center;"><span id="cl-tpl-camp-lbl" style="min-width:78px;color:#9aa0ab;font-size:11px;">${clT('tpl_camp')}</span><input id="cl-tpl-camp" class="pa-input cl-tpl-in" value="{geo} | {idacc} | {date}" style="padding:6px 10px;font-size:11px;flex:1;"></div><div style="display:flex;gap:6px;align-items:center;"><span id="cl-tpl-adset-lbl" style="min-width:78px;color:#9aa0ab;font-size:11px;">${clT('tpl_adset')}</span><input id="cl-tpl-adset" class="pa-input cl-tpl-in" value="{name}" style="padding:6px 10px;font-size:11px;flex:1;"></div><div style="display:flex;gap:6px;align-items:center;"><span id="cl-tpl-ad-lbl" style="min-width:78px;color:#9aa0ab;font-size:11px;">${clT('tpl_ad')}</span><input id="cl-tpl-ad" class="pa-input cl-tpl-in" value="{name}" style="padding:6px 10px;font-size:11px;flex:1;"></div><div id="cl-tpl-macros" style="display:flex;flex-wrap:wrap;gap:4px;">${clMacrosHtml()}</div><div id="cl-tpl-hint" style="font-size:10px;color:#9aa0ab;line-height:1.4;">${clT('tpl_hint')}</div></div><div id="cl-fr-row" style="display:none;gap:6px;align-items:center;"><input id="cl-find" class="pa-input" placeholder="${t('cl_find')}" style="padding:6px 10px;font-size:11px;width:110px;"><span style="color:#9aa0ab;">→</span><input id="cl-repl" class="pa-input" placeholder="${t('cl_repl')}" value="${CL_TGT_NUM}" style="padding:6px 10px;font-size:11px;flex:1;"></div><label style="display:flex;align-items:center;gap:8px;cursor:pointer;"><input type="checkbox" class="pa-cb" id="cl-sufon"> <span id="cl-suf-lbl">${t('cl_suffix')}</span> <input id="cl-suf" class="pa-input" value=" (clone)" disabled style="padding:5px 9px;font-size:11px;width:110px;opacity:.5;"></label></div></div><div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:12px;min-height:0;"><div class="ar-box" style="flex:1;min-height:0;display:flex;flex-direction:column;"><div class="pa-lbl" id="cl-targets-lbl" style="margin-bottom:8px;">${t('cl_targets')}</div><div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;flex:0 0 auto;"><input id="cl-search" class="pa-input" placeholder="${t('search_ph')}" style="flex:1;min-width:140px;"><button class="pa-pill cl-f active" data-f="all">${t('all')}</button><button class="pa-pill cl-f" data-f="active">${t('active')}</button><button class="pa-pill cl-f" data-f="disabled">${t('disabled')}</button></div><div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;flex:0 0 auto;align-items:center;"><span class="pa-lbl" id="cl-sort-lbl" style="margin-right:2px;">${t('cl_sort_lbl')}</span><button class="pa-pill cl-cf active" data-cf="all">${clT('sort_all')}</button><button class="pa-pill cl-cf" data-cf="camps_first">${clT('sort_with')}</button><button class="pa-pill cl-cf" data-cf="no_camps_first">${clT('sort_without')}</button></div><div style="display:flex;gap:10px;margin-bottom:8px;align-items:center;flex:0 0 auto;padding:6px 10px;border:1px solid #33373f;border-radius:8px;background:rgba(255,255,255,.02);"><input type="checkbox" class="pa-cb" id="cl-hdr-cb" title="${clT('all_visible')}"><span id="cl-tgtcnt" style="font-family:ui-monospace,monospace;font-size:11px;font-weight:700;"><b style="color:#2dd4bf;">0</b><span style="color:#6b7280;"> / 0</span></span></div><div id="cl-targets" style="flex:1;min-height:0;overflow-y:auto;border:1px solid #33373f;border-radius:8px;"></div></div><div class="pa-action-row"><button id="cl-run" class="pa-action pa-action-primary">${t('cl_run')}</button><button id="cl-stop" class="pa-action pa-action-danger" disabled>${t('cl_stop')}</button><button id="cl-reset-prog" class="pa-action pa-action-warning">${t('cl_reset_prog')}</button></div><div id="cl-running-lbl" style="display:none;font-size:11px;color:var(--teal);font-weight:700;flex:0 0 auto;">${t('cl_running')}</div><div id="cl-copyrow" style="display:none;flex-direction:column;gap:6px;flex:0 0 auto;"><span class="pa-lbl" id="cl-copyrow-lbl" style="color:var(--mut);">${t('cl_copyrow_lbl')}</span><div class="pa-action-row"><button id="cl-copy-ok" class="pa-action pa-action-success">${t('cl_copy_ok')}0)</button><button id="cl-copy-fail" class="pa-action pa-action-danger">${t('cl_copy_fail')}0)</button></div></div><div class="ar-box" style="flex:1;min-height:0;display:flex;flex-direction:column;background:#0e1014;"><div class="pa-lbl" id="cl-log-lbl" style="margin-bottom:6px;">${t('cl_log')}</div><div id="cl-log" style="flex:1;min-height:0;overflow-y:auto;font-family:ui-monospace,monospace;font-size:11px;line-height:1.5;"><div id="cl-log-empty" style="color:#5b626d;padding:4px 2px;">${t('cl_log_empty')}</div></div></div></div></div></div>`;
  function isAccountBlockErr(e) {
    if (!e) return false;
    const code = e.code;
    const msg = clErr(e).toLowerCase();
    if (code === 190) return true;
    if (
      code === 31 &&
      /verify.{0,40}phone|phone number|payment method|add a payment|set up payment|verify your account|business verification|verify your identity|agree to the|accept the terms|terms and conditions|pending action/.test(
        msg
      )
    )
      return true;
    if (/cannot access the app|log in to www.facebook|log into www.facebook/.test(msg)) return true;
    if (/error validating access token|session has expired|invalid oauth|user has not authorized/.test(msg))
      return true;
    return false;
  }
  function clLog(m, kind) {
    const el = document.getElementById('cl-log');
    if (!el) return;
    const empty = document.getElementById('cl-log-empty');
    if (empty) empty.style.display = 'none';
    const gen = typeof m === 'function' ? m : () => m;
    const html = gen();
    let k = kind;
    if (!k) {
      if (/━/.test(html)) k = 'sep';
      else if (/⛔/.test(html)) k = 'err';
      else if (/✗/.test(html)) k = 'err';
      else if (/✓/.test(html)) k = 'ok';
      else if (/⚠/.test(html)) k = 'warn';
      else if (/🔬/.test(html)) k = 'probe';
      else if (/📥|🚀|📂/.test(html)) k = 'info';
      else k = 'plain';
    }
    const div = document.createElement('div');
    div.className = 'pa-logline ll-' + k;
    div.innerHTML = '<span class="ll-time">' + new Date().toLocaleTimeString() + '</span>' + html;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  }
  function clLogDbg(m) {
    if (clDbg()) clLog('&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:var(--mut)">🔬 ' + m + '</span>', 'probe');
  }
  function clErr(e) {
    if (!e) return 'unknown';
    let s = e.message || JSON.stringify(e);
    if (e.error_user_msg) s += ' | ' + e.error_user_msg;
    if (e.code) s += ' [code ' + e.code + ']';
    return s;
  }
  function clPost(path, obj) {
    const fd = new URLSearchParams();
    for (const k in obj) {
      const v = obj[k];
      if (v === undefined || v === null) continue;
      fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    }
    fd.append('access_token', token);
    const doFetch = () => apiCall(CL_GRAPH + path, { method: 'POST', body: fd });
    return (async () => {
      if (clAbort) return { error: { code: -1, message: 'stopped' } };
      let last = null;
      for (let att = 0; att < 6; att++) {
        if (clAbort) break;
        let res;
        try {
          res = await doFetch();
        } catch (netE) {
          last = { error: { code: 0, message: String((netE && netE.message) || netE) || 'network' } };
          const w = 2500 * (att + 1);
          clLog(
            '&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:var(--amber)">⏸ ' +
              clL('Нет связи с Meta', 'No connection to Meta') +
              ' — ' +
              clWaitTxt(att + 1, 6, w) +
              '</span>'
          );
          clLogDbg(esc(last.error.message).slice(0, 120));
          await new Promise(r => setTimeout(r, w));
          continue;
        }
        const e = res && res.error;
        const code = e && e.code;
        const msg = e ? clErr(e) : '';
        const rate =
          !!e &&
          (code === 4 ||
            code === 17 ||
            code === 32 ||
            code === 613 ||
            (code >= 80000 && code <= 80099) ||
            /request limit reached|too many calls|rate limit|throttl|temporarily unavailable/i.test(msg));
        if (rate) {
          last = res;
          const w = 6000 * (att + 1);
          clLog(
            '&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:var(--amber)">⏸ ' +
              clL('Meta ограничила частоту запросов', 'Meta rate limit reached') +
              ' — ' +
              clWaitTxt(att + 1, 6, w) +
              '</span>'
          );
          await new Promise(r => setTimeout(r, w));
          continue;
        }
        return res;
      }
      return last;
    })();
  }
  async function clPostRetry(path, obj, tries) {
    const n = tries || 3;
    for (let i = 0; i < n; i++) {
      const res = await clPost(path, obj);
      if (!res.error) return res;
      const code = res.error && res.error.code;
      const msg = clErr(res.error);
      const transient =
        code === 2 ||
        code === 1 ||
        code === 0 ||
        /unexpected|temporarily|try again later|service unavailable/i.test(msg);
      if (!transient) return res;
      clLog(
        '&nbsp;&nbsp;<span style="color:var(--amber)">⏸ ' +
          clL('Временный сбой Meta', 'Temporary Meta error') +
          ' — ' +
          clWaitTxt(i + 1, n, 4000 * (i + 1)) +
          '</span>'
      );
      clLogDbg(esc(msg).slice(0, 160));
      await new Promise(r => setTimeout(r, 4000 * (i + 1)));
    }
    return {
      error: {
        code: -1,
        message: clL('Meta не ответила после повторов', 'Meta did not respond after retries')
      }
    };
  }
  function clDonorOpts() {
    const box = document.getElementById('cl-donor-list');
    if (!box) return;
    box.innerHTML = accs
      .map(
        a =>
          `<div class="ar-src-opt${a.id === clDonorId ? ' sel' : ''}" data-id="${a.id}"><span style="font-family:ui-monospace,monospace;color:#3b8cff;">${esc(accountId(a.id))}</span><span style="flex:1;color:#e8eaef;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(a.name || '—')}</span><span style="font-size:10px;color:#9aa0ab;">${esc(a.currency || '')}</span></div>`
      )
      .join('');
    box.querySelectorAll('.ar-src-opt').forEach(o => {
      o.onclick = function () {
        clDonorId = this.dataset.id;
        const a = accs.find(x => x.id === clDonorId);
        const inp = document.getElementById('cl-donor-search');
        if (inp && a) inp.value = accountId(a.id) + ' — ' + (a.name || '');
        clDonorOpts();
      };
    });
  }
  async function clLoadCampaigns() {
    if (!clDonorId) {
      alert(t('cl_select_donor'));
      return;
    }
    clLog(
      '📥 ' +
        clL('Загружаю кампании кабинета-донора ', 'Loading campaigns of donor account ') +
        esc(accountId(clDonorId)) +
        '…'
    );
    try {
      const d = await fetchJson(
        `${CL_GRAPH}${clDonorId}/campaigns?fields=id,name,objective,status,bid_strategy,daily_budget,buying_type,special_ad_categories,is_adset_budget_sharing_enabled&limit=200&access_token=${encodeURIComponent(token)}`
      );
      clCampaigns = (d.data || []).map(c => {
        c.selected = true;
        return c;
      });
      clRenderCampaigns();
      clLog('✓ ' + t('cl_found') + ': ' + clCampaigns.length);
    } catch (e) {
      clLog('✗ ' + clL('Не удалось загрузить кампании: ', 'Failed to load campaigns: ') + esc(clErr(e)));
    }
  }
  function clRenderCampaigns() {
    const box = document.getElementById('cl-camps');
    if (!box) return;
    if (!clCampaigns.length) {
      box.innerHTML = '<div class="pa-empty" style="padding:20px;">' + t('cl_no_camps') + '</div>';
      return;
    }
    box.innerHTML = clCampaigns
      .map((c, i) => {
        const stc = c.status === 'ACTIVE' ? '#37d67a' : '#9aa0ab';
        return `<label class="ar-row"><input type="checkbox" class="pa-cb cl-camp-cb" data-i="${i}" ${c.selected ? 'checked' : ''}><span style="flex:1;font-size:12px;color:#e8eaef;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(c.name)}</span><span style="color:${stc};font-size:10px;">● ${c.status || '?'}</span><span style="font-size:9px;color:#9aa0ab;font-family:ui-monospace,monospace;">${c.objective || ''}</span></label>`;
      })
      .join('');
    box.querySelectorAll('.cl-camp-cb').forEach(cb => {
      cb.onchange = function () {
        clCampaigns[+this.dataset.i].selected = this.checked;
        popCb(this);
      };
    });
  }
  async function clExportStructure() {
    if (!clDonorId) {
      alert(t('cl_select_donor'));
      return;
    }
    const sel = clCampaigns.filter(c => c.selected);
    if (!sel.length) {
      alert(t('cl_select_camps'));
      return;
    }
    clLog(
      '📤 ' +
        clL('Экспорт структуры донора ', 'Exporting donor structure ') +
        esc(accountId(clDonorId)) +
        ' (' +
        sel.length +
        ' ' +
        clL('камп.', 'campaigns') +
        ')…'
    );
    const out = {
      tool: 'ParserAccs',
      kind: 'clone-structure',
      donorId: clDonorId,
      exportedAt: new Date().toISOString(),
      campaigns: []
    };
    for (const camp of sel) {
      try {
        const adsets = await clFetchStructure(camp.id);
        out.campaigns.push({
          id: camp.id,
          name: camp.name,
          objective: camp.objective,
          status: camp.status,
          bid_strategy: camp.bid_strategy,
          daily_budget: camp.daily_budget,
          buying_type: camp.buying_type,
          special_ad_categories: camp.special_ad_categories || [],
          adsets: adsets
        });
        clLog('&nbsp;✓ «' + esc(camp.name) + '» · ' + clL('адсетов', 'ad sets') + ': ' + adsets.length);
      } catch (e) {
        clLog('&nbsp;✗ «' + esc(camp.name) + '»: ' + esc(e.message));
      }
    }
    const json = JSON.stringify(out, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const aEl = document.createElement('a');
    aEl.href = url;
    aEl.download = 'parseraccs_clone_' + clDonorId.replace(/^act_/, '') + '_' + stampNow() + '.json';
    document.body.appendChild(aEl);
    aEl.click();
    aEl.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    clLog(
      '✓ ' +
        clL('Структура сохранена в JSON', 'Structure saved to JSON') +
        ' (' +
        out.campaigns.length +
        ' ' +
        clL('камп.', 'campaigns') +
        ')'
    );
  }
  function clImportStructure(file) {
    const rd = new FileReader();
    rd.onload = ev => {
      try {
        const raw = JSON.parse(String(ev.target.result || '').replace(/^\uFEFF/, ''));
        const camps = Array.isArray(raw) ? raw : raw && Array.isArray(raw.campaigns) ? raw.campaigns : null;
        if (!camps || !camps.length) {
          alert(
            clL(
              'JSON не распознан (нужен массив campaigns или {campaigns:[…], donorId})',
              'Unrecognized JSON (expected a campaigns array or {campaigns:[…], donorId})'
            )
          );
          return;
        }
        if (raw && raw.donorId) {
          clDonorId = raw.donorId;
          const inp = document.getElementById('cl-donor-search');
          if (inp) inp.value = raw.donorId + ' ' + clT('from_file');
          clDonorOpts();
        }
        clCampaigns = camps.map(c => ({
          id: c.id,
          name: c.name,
          objective: c.objective,
          status: c.status,
          bid_strategy: c.bid_strategy,
          daily_budget: c.daily_budget,
          buying_type: c.buying_type,
          special_ad_categories: c.special_ad_categories || [],
          selected: true,
          _adsets: c.adsets || []
        }));
        clRenderCampaigns();
        let nA = 0,
          nAd = 0;
        clCampaigns.forEach(c => {
          (c._adsets || []).forEach(a => {
            nA++;
            nAd += (a._ads || []).length;
          });
        });
        clLog(
          '📂 ' +
            clL(
              'Структура загружена из файла: кампаний ' +
                clCampaigns.length +
                ' · адсетов ' +
                nA +
                ' · объявлений ' +
                nAd,
              'Structure loaded from file: ' +
                clCampaigns.length +
                ' campaigns · ' +
                nA +
                ' ad sets · ' +
                nAd +
                ' ads'
            )
        );
      } catch (e) {
        alert(clL('Ошибка чтения JSON: ', 'JSON read error: ') + e.message);
      }
    };
    rd.readAsText(file);
  }
  function clGetTargets() {
    let list = accs;
    if (clFilter === 'active') list = list.filter(a => isAct(a.account_status));
    else if (clFilter === 'disabled') list = list.filter(a => !isAct(a.account_status));
    const s = (document.getElementById('cl-search') || {}).value || '';
    if (s) {
      const q = s.toLowerCase();
      list = list.filter(
        a =>
          (a.name || '').toLowerCase().includes(q) ||
          a.id.includes(q) ||
          (a.accessibleBM?.name || '').toLowerCase().includes(q)
      );
    }
    if (clSortMode === 'camps_first') {
      list = list.filter(a => clCampCounts[a.id] && clCampCounts[a.id].count > 0);
    } else if (clSortMode === 'no_camps_first') {
      list = list.filter(a => clCampCounts[a.id] && clCampCounts[a.id].count === 0);
    } else if (clSortMode === 'name') {
      list = list.slice();
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (clSortMode === 'id') {
      list = list.slice();
      list.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    }
    return list;
  }
  function clRenderTargets() {
    const box = document.getElementById('cl-targets');
    if (!box) return;
    const list = clGetTargets();
    box.innerHTML =
      list
        .map(a => {
          const st = stM[a.account_status] || { t: '?', c: '#8a8d91' };
          const chk = clSelectedTargets.has(a.id);
          return `<div class="ar-tgt"><input type="checkbox" class="pa-cb cl-tgt-cb" data-id="${a.id}" ${chk ? 'checked' : ''}><a href="${clAmUrl(a.id)}" target="_blank" class="pa-link">${accountId(a.id)}</a><span style="flex:1;font-size:11px;color:#e8eaef;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(a.name || '—')}</span><span class="cl-rc" data-clc="${a.id}" style="font-size:10px;color:#9aa0ab;" title="${clT('camps_in_acc')}">…</span><span style="color:${st.c};font-size:10px;">● ${st.t}</span></div>`;
        })
        .join('') || '<div class="pa-empty" style="padding:16px;">' + t('empty') + '</div>';
    box.querySelectorAll('.cl-tgt-cb').forEach(cb => {
      cb.onchange = function () {
        if (this.checked) clSelectedTargets.add(this.dataset.id);
        else clSelectedTargets.delete(this.dataset.id);
        popCb(this);
        clUpdateCnt();
      };
    });
    clUpdateCnt();
    paintVisibleClCounts();
  }
  function clUpdateCnt() {
    const el = document.getElementById('cl-tgtcnt');
    const vis = clGetTargets();
    const sel = vis.filter(a => clSelectedTargets.has(a.id)).length;
    if (el)
      el.innerHTML =
        '<b style="color:#2dd4bf;">' + sel + '</b><span style="color:#6b7280;"> / ' + vis.length + '</span>';
    const hdr = document.getElementById('cl-hdr-cb');
    if (hdr) hdr.checked = vis.length > 0 && sel === vis.length;
  }
  function paintClCount(id) {
    const c = clCampCounts[id];
    document.querySelectorAll('[data-clc="' + id + '"]').forEach(el => {
      if (!c) {
        el.textContent = '…';
        el.style.color = '#9aa0ab';
      } else if (c.err) {
        el.textContent = '?';
        el.style.color = '#ff5d6c';
      } else {
        el.innerHTML =
          '<span style="color:' +
          (c.count > 0 ? '#37d67a' : '#9aa0ab') +
          ';font-weight:700;">' +
          c.count +
          '</span> <span style="color:#9aa0ab">' +
          clL('камп.', 'camps') +
          '</span>';
      }
    });
  }
  function paintVisibleClCounts() {
    modal
      .querySelectorAll('#pa-tab-clone [data-clc]')
      .forEach(el => paintClCount(el.getAttribute('data-clc')));
  }
  function clLoadCampCounts(list) {
    return runBatched(list, 12, async a => {
      try {
        const d = await fetchJson(
          `${CL_GRAPH}${a.id}/campaigns?fields=id&limit=1&summary=1&access_token=${encodeURIComponent(token)}`
        );
        const cnt =
          d.summary && typeof d.summary.total_count === 'number'
            ? d.summary.total_count
            : d.data
              ? d.data.length
              : 0;
        clCampCounts[a.id] = { count: cnt };
      } catch (e) {
        clCampCounts[a.id] = { count: 0, err: 1 };
      }
      paintClCount(a.id);
    }).then(() => {
      clRenderTargets();
    });
  }
  const clPad2 = n => String(n).padStart(2, '0');
  function clGeoOf(tg) {
    if (!tg || !tg.geo_locations) return [];
    const g = tg.geo_locations;
    let a = (g.countries || []).slice();
    if (!a.length) {
      ['regions', 'cities', 'zips', 'geo_markets', 'electoral_districts'].forEach(k => {
        (g[k] || []).forEach(x => {
          if (x && x.country) a.push(x.country);
        });
      });
    }
    if (!a.length && Array.isArray(g.country_groups)) a = g.country_groups.slice();
    return a.map(x => String(x).toUpperCase());
  }
  function clGeoStr(ctx) {
    const out = [];
    const add = tg =>
      clGeoOf(tg).forEach(c => {
        if (out.indexOf(c) < 0) out.push(c);
      });
    if (ctx && ctx.as) add(ctx.as.targeting);
    else if (ctx && ctx.camp) (ctx.camp._adsets || []).forEach(a => add(a.targeting));
    return out.join('-');
  }
  function clMacros(s, tgt, ctx) {
    s = String(s == null ? '' : s);
    if (s.indexOf('{') < 0) return s;
    ctx = ctx || {};
    const tgtNum = String(tgt || '').replace(/^act_/, '');
    const acc = accs.find(a => a.id === tgt) || {};
    const d = new Date();
    const lvl = ctx.lvl || '';
    const bud = lvl === 'camp' ? ctx.camp && ctx.camp.daily_budget : ctx.as && ctx.as.daily_budget;
    const V = {
      idacc: tgtNum,
      act: 'act_' + tgtNum,
      accname: acc.name || '',
      currency: acc.currency || '',
      donor: String(clDonorId || '').replace(/^act_/, ''),
      date: clPad2(d.getDate()) + '.' + clPad2(d.getMonth() + 1) + '.' + d.getFullYear(),
      dd: clPad2(d.getDate()),
      mm: clPad2(d.getMonth() + 1),
      yy: String(d.getFullYear()).slice(2),
      yyyy: String(d.getFullYear()),
      time: clPad2(d.getHours()) + '-' + clPad2(d.getMinutes()),
      geo: clGeoStr(ctx),
      name: ctx.orig != null ? String(ctx.orig) : '',
      camp: (ctx.camp && ctx.camp.name) || '',
      adset: (ctx.as && ctx.as.name) || '',
      ad: (ctx.ad && ctx.ad.name) || '',
      n: ctx.i != null ? String(ctx.i + 1) : '1',
      page: (ctx.page && ctx.page.name) || '',
      pageid: ctx.page && ctx.page.id ? String(ctx.page.id) : '',
      objective: String((ctx.camp && ctx.camp.objective) || '').replace(/^OUTCOME_/, ''),
      budget: bud ? String(Math.round(parseFloat(bud)) / 100) : '',
      rand: String(Math.floor(1000 + Math.random() * 9000))
    };
    return s
      .split(CL_TGT_NUM)
      .join(tgtNum)
      .split(CL_TGT_ID)
      .join('act_' + tgtNum)
      .replace(/\{([a-zA-Z_]+)\}/g, (m, k) => {
        const kk = k.toLowerCase();
        return Object.prototype.hasOwnProperty.call(V, kk) ? V[kk] : m;
      });
  }
  function clTplSave() {
    try {
      const g = id => (document.getElementById(id) || {}).value;
      localStorage.setItem(
        'pa_cl_tpl',
        JSON.stringify({
          mode: clNameMode,
          camp: g('cl-tpl-camp'),
          adset: g('cl-tpl-adset'),
          ad: g('cl-tpl-ad')
        })
      );
    } catch (e) {}
  }
  function clTplLoad() {
    let o = null;
    try {
      o = JSON.parse(localStorage.getItem('pa_cl_tpl') || 'null');
    } catch (e) {}
    if (!o) return;
    ['camp', 'adset', 'ad'].forEach(k => {
      const el = document.getElementById('cl-tpl-' + k);
      if (el && typeof o[k] === 'string') el.value = o[k];
    });
    const sel = document.getElementById('cl-naming');
    if (sel && o.mode && [...sel.options].some(x => x.value === o.mode)) {
      sel.value = o.mode;
      clNameMode = o.mode;
      const fr = document.getElementById('cl-fr-row');
      if (fr) fr.style.display = clNameMode === 'findrep' ? 'flex' : 'none';
      const tr = document.getElementById('cl-tpl-row');
      if (tr) tr.style.display = clNameMode === 'template' ? 'flex' : 'none';
    }
  }
  function clBuildName(orig, tgt, ctx) {
    ctx = Object.assign({}, ctx || {}, { orig: orig });
    let s = String(orig || '');
    const srcNum = (clDonorId || '').replace(/^act_/, '');
    const tgtNum = (tgt || '').replace(/^act_/, '');
    if (clNameMode === 'template') {
      const lvl = ctx.lvl || 'ad';
      const id = lvl === 'camp' ? 'cl-tpl-camp' : lvl === 'adset' ? 'cl-tpl-adset' : 'cl-tpl-ad';
      const tp = String((document.getElementById(id) || {}).value || '').trim();
      if (tp) s = clMacros(tp, tgt, ctx).replace(/\s+/g, ' ').trim() || s;
    } else if (clNameMode === 'swap' && srcNum) {
      s = s
        .split('act_' + srcNum)
        .join('act_' + tgtNum)
        .split(srcNum)
        .join(tgtNum);
    } else if (clNameMode === 'findrep') {
      const f = (document.getElementById('cl-find') || {}).value || '';
      const r = clMacros((document.getElementById('cl-repl') || {}).value || '', tgt, ctx);
      if (f) s = s.split(f).join(r);
    }
    const so = document.getElementById('cl-sufon');
    if (so && so.checked) {
      const sv = clMacros((document.getElementById('cl-suf') || {}).value || '', tgt, ctx);
      if (sv) s += sv;
    }
    return s;
  }
  async function clPageName(id) {
    if (!id) return '';
    if (clPageNameCache[id] !== undefined) return clPageNameCache[id];
    let n = '';
    try {
      const d = await fetchJson(`${CL_GRAPH}${id}?fields=name&access_token=${encodeURIComponent(token)}`);
      n = d.name || '';
    } catch (e) {}
    clPageNameCache[id] = n;
    return n;
  }
  async function clGetPage(tgt, wantName) {
    const key = tgt + '|' + (wantName || '');
    if (clPageCache[key] !== undefined) return clPageCache[key];
    let list = [];
    try {
      const d = await fetchJson(
        `${CL_GRAPH}${tgt}/promotable_pages?fields=id,name,is_published&limit=25&access_token=${encodeURIComponent(token)}`
      );
      list = (d.data || []).filter(p => p.is_published !== false);
    } catch (e) {}
    if (!list.length) {
      try {
        const d = await fetchJson(
          `${CL_GRAPH}me/accounts?fields=id,name,is_published&limit=25&access_token=${encodeURIComponent(token)}`
        );
        list = (d.data || []).filter(p => p.is_published !== false);
      } catch (e) {}
    }
    let pg = null;
    if (wantName) {
      const wn = clNorm(wantName);
      pg = list.find(p => clNorm(p.name) === wn);
    }
    if (!pg) pg = list[0] || null;
    clPageCache[key] = pg;
    return pg;
  }
  async function clResolvePage(tgt, donorPageId, fpOverride) {
    if (fpOverride) {
      const nm = await clPageName(fpOverride);
      const pg = { id: fpOverride, name: nm || fpOverride };
      clLog(
        '&nbsp;📄 ' + t('cl_page') + ': «' + esc(pg.name) + '» — ' + clL('задана вручную', 'set manually')
      );
      return pg;
    }
    const donorPageName = await clPageName(donorPageId);
    const page = await clGetPage(tgt, donorPageName);
    if (page) {
      const same = !donorPageName || clNorm(page.name) === clNorm(donorPageName);
      clLog(
        '&nbsp;📄 ' +
          t('cl_page') +
          ': «' +
          esc(page.name) +
          '»' +
          (same
            ? ''
            : ' <span style="color:var(--amber)">⚠ ' +
              clL(
                'страницы донора «' + esc(donorPageName) + '» в этом кабинете нет — взята первая доступная',
                'donor page «' +
                  esc(donorPageName) +
                  '» is not available here — using the first available page'
              ) +
              '</span>')
      );
      clLogDbg('page id ' + esc(page.id));
    } else {
      clLog('&nbsp;⚠ ' + t('cl_no_page'));
    }
    return page;
  }
  function clRandBudget() {
    const el = document.getElementById('cl-rand-budget');
    if (!el || !el.checked) return null;
    const mn = parseFloat((document.getElementById('cl-rand-min') || {}).value);
    const mx = parseFloat((document.getElementById('cl-rand-max') || {}).value);
    if (!isFinite(mn) || !isFinite(mx) || mx < mn) return null;
    const v = mn + Math.random() * (mx - mn);
    return Math.round(v * 100);
  }
  async function clGetPageList(tgt) {
    const key = tgt + '|list';
    if (clPageCache[key]) return clPageCache[key];
    let list = [];
    try {
      const d = await fetchJson(
        `${CL_GRAPH}${tgt}/promotable_pages?fields=id,name,is_published&limit=50&access_token=${encodeURIComponent(token)}`
      );
      list = (d.data || []).filter(p => p.is_published !== false);
    } catch (e) {}
    if (!list.length) {
      try {
        const d = await fetchJson(
          `${CL_GRAPH}me/accounts?fields=id,name,is_published&limit=50&access_token=${encodeURIComponent(token)}`
        );
        list = (d.data || []).filter(p => p.is_published !== false);
      } catch (e) {}
    }
    clPageCache[key] = list;
    return list;
  }
  async function clDonorImageUrl(hash) {
    if (!hash || !clDonorId) return '';
    const key = 'donorimg|' + hash;
    if (clThumbCache[key] !== undefined) return clThumbCache[key];
    let url = '';
    try {
      const d = await fetchJson(
        `${CL_GRAPH}${clDonorId}/adimages?hashes=${encodeURIComponent(JSON.stringify([hash]))}&fields=hash,url&access_token=${encodeURIComponent(token)}`
      );
      const list = (d && d.data) || Object.values(d || {});
      for (const it of list) {
        if (it && it.url) {
          url = it.url;
          break;
        }
      }
    } catch (e) {}
    clThumbCache[key] = url;
    return url;
  }
  async function clResolveThumb(tgt, f) {
    const url = f && f.thumb;
    const dhash = f && f.imageHash;
    if (!url && !dhash) return null;
    const key = tgt + '|' + (url || 'h:' + dhash);
    if (clThumbCache[key] !== undefined) return clThumbCache[key];
    let hash = null;
    let u = url;
    if (!u && dhash) {
      u = await clDonorImageUrl(dhash);
    }
    if (u) {
      try {
        const r = await clPost(tgt + '/adimages', { url: u, name: 'pa_clone_thumb' });
        const imgs = r && r.images;
        if (imgs) {
          const arr = Object.values(imgs);
          if (arr[0] && arr[0].hash) hash = arr[0].hash;
        }
        if (!hash && r && r.hash) hash = r.hash;
      } catch (e) {}
    }
    if (!hash && dhash) hash = dhash;
    clThumbCache[key] = hash;
    return hash;
  }
  async function clPixelList(tgt) {
    if (clPixelListCache[tgt]) return clPixelListCache[tgt];
    let list = [];
    try {
      const d = await fetchJson(
        `${CL_GRAPH}${tgt}/adspixels?fields=id,name&limit=50&access_token=${encodeURIComponent(token)}`
      );
      list = d.data || [];
    } catch (e) {}
    clPixelListCache[tgt] = list;
    return list;
  }
  async function clResolvePixel(tgt, wantName) {
    const list = await clPixelList(tgt);
    if (!list.length) return null;
    if (wantName) {
      const n = clNorm(wantName);
      const m = list.find(p => clNorm(p.name) === n);
      if (m) return m;
    }
    return list[0];
  }
  async function clDonorPixelName(pid) {
    if (!pid) return '';
    if (clDonorPixelNameCache[pid] !== undefined) return clDonorPixelNameCache[pid];
    let nm = '';
    try {
      const d = await fetchJson(`${CL_GRAPH}${pid}?fields=name&access_token=${encodeURIComponent(token)}`);
      nm = d.name || '';
    } catch (e) {}
    clDonorPixelNameCache[pid] = nm;
    return nm;
  }
  async function clGetPageToken(pageId) {
    if (!pageId) return null;
    if (clPageTokenCache[pageId] !== undefined) return clPageTokenCache[pageId];
    let tok = null;
    try {
      const d = await fetchJson(
        `${CL_GRAPH}me/accounts?fields=id,access_token&limit=50&access_token=${encodeURIComponent(token)}`
      );
      const p = (d.data || []).find(x => String(x.id) === String(pageId));
      if (p && p.access_token) tok = p.access_token;
    } catch (e) {}
    clPageTokenCache[pageId] = tok;
    return tok;
  }
  async function clGetInstagramActor(tgt, pageId, strict) {
    const key = tgt + '|' + (pageId || '') + (strict ? '|s' : '');
    if (clIgCache[key] !== undefined) return clIgCache[key];
    let ig = null,
      via = '';
    const probe = [];
    const rec = (label, val, err) => {
      probe.push(label + '=' + (err ? '✗' + (err || 'err') : val ? '✓' + val : '∅'));
    };
    const created = clL('(создан для страницы)', '(created for the Page)');
    if (!strict) {
      try {
        const d = await fetchJson(
          `${CL_GRAPH}${tgt}/connected_instagram_accounts?fields=id,username&limit=10&access_token=${encodeURIComponent(token)}`
        );
        if (d.data && d.data.length) {
          ig = d.data[0];
          via = 'connected';
          rec('connected', ig.id);
        } else rec('connected', null);
      } catch (e) {
        rec('connected', null, ((e && e.message) || '').slice(0, 40));
      }
    }
    if (!ig && pageId) {
      try {
        const d = await fetchJson(
          `${CL_GRAPH}${pageId}?fields=instagram_business_account{id,username}&access_token=${encodeURIComponent(token)}`
        );
        if (d.instagram_business_account && d.instagram_business_account.id) {
          ig = { id: d.instagram_business_account.id, username: d.instagram_business_account.username || '' };
          via = 'page-ig-business';
          rec('ig-biz', ig.id);
        } else rec('ig-biz', null);
      } catch (e) {
        rec('ig-biz', null, ((e && e.message) || '').slice(0, 40));
      }
    }
    const pt = await clGetPageToken(pageId);
    const tok = pt || token;
    if (!ig && pageId) {
      try {
        const d = await fetchJson(
          `${CL_GRAPH}${pageId}/page_backed_instagram_accounts?fields=id,username&access_token=${encodeURIComponent(tok)}`
        );
        if (d.data && d.data.length) {
          ig = d.data[0];
          via = 'page-backed';
          rec('backed', ig.id);
        } else rec('backed', null);
      } catch (e) {
        rec('backed', null, ((e && e.message) || '').slice(0, 40));
      }
    }
    if (!ig && pageId) {
      try {
        const d = await fetchJson(
          `${CL_GRAPH}${pageId}/instagram_accounts?fields=id,username&access_token=${encodeURIComponent(tok)}`
        );
        if (d.data && d.data.length) {
          ig = d.data[0];
          via = 'page-ig';
          rec('page-ig', ig.id);
        } else rec('page-ig', null);
      } catch (e) {
        rec('page-ig', null, ((e && e.message) || '').slice(0, 40));
      }
    }
    if (!ig && pageId && pt) {
      try {
        const r = await apiCall(
          `${CL_GRAPH}${pageId}/page_backed_instagram_accounts?access_token=${encodeURIComponent(pt)}`,
          { method: 'POST' }
        );
        if (r && r.id) {
          ig = { id: r.id, username: created };
          via = 'created';
          rec('create-pt', ig.id);
        } else rec('create-pt', null);
      } catch (e) {
        rec('create-pt', null, ((e && e.message) || '').slice(0, 40));
      }
    }
    if (!ig && pageId) {
      try {
        const r = await apiCall(
          `${CL_GRAPH}${pageId}/page_backed_instagram_accounts?access_token=${encodeURIComponent(token)}`,
          { method: 'POST' }
        );
        if (r && r.id) {
          ig = { id: r.id, username: created };
          via = 'created-user';
          rec('create-user', ig.id);
        } else rec('create-user', null);
      } catch (e) {
        rec('create-user', null, ((e && e.message) || '').slice(0, 40));
      }
    }
    if (ig) ig._via = via;
    clIgCache[key] = ig;
    if (!ig)
      clLogDbg(
        'ig-probe (page=' +
          esc(pageId || '∅') +
          (pt ? ' · page-token=✓' : ' · page-token=∅') +
          '): ' +
          esc(probe.join(' · '))
      );
    return ig;
  }
