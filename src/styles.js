  function injectStyles() {
    const old = document.getElementById('pa-css');
    if (old) old.remove();
    const s = document.createElement('style');
    s.id = 'pa-css';
    s.textContent = `#pa-m *,#pa-m *::before,#pa-m *::after{box-sizing:border-box;}@keyframes pa-titleshift{0%{background-position:0% 50%}100%{background-position:220% 50%}}@keyframes pa-titleglow{0%,100%{text-shadow:0 0 0 rgba(45,212,191,0)}50%{text-shadow:0 0 22px rgba(45,212,191,.35)}}@keyframes pa-logoglow{0%,100%{filter:drop-shadow(0 0 0 rgba(45,212,191,0))}50%{filter:drop-shadow(0 0 10px rgba(45,212,191,.4))}}@keyframes pa-chippulse{0%{box-shadow:0 0 0 0 rgba(55,214,122,.45)}70%{box-shadow:0 0 0 7px rgba(55,214,122,0)}100%{box-shadow:0 0 0 0 rgba(55,214,122,0)}}:root{--line:#33373f;--txt:#e8eaef;--mut:#9aa0ab;--teal:#2dd4bf;--amber:#f5b13d;--blue:#3b8cff;--red:#ff5d6c;--green:#37d67a;--violet:#a78bfa}body{font-family:'SF Pro Text','Segoe UI',system-ui,-apple-system,sans-serif}.pa-overlay{position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:999998;display:flex;align-items:center;justify-content:center}.pa-load-box{text-align:center;background:#1a1c21;padding:40px 60px;border-radius:16px;border:1px solid #33373f}.pa-load-title{font-size:18px;font-weight:700;color:#e8eaef;margin-bottom:20px}.pa-load-spinner{width:40px;height:40px;margin:0 auto;border:3px solid #33373f;border-top:3px solid #2dd4bf;border-radius:50%;animation:pa-spin 1s linear infinite}@keyframes pa-spin{to{transform:rotate(360deg)}}#pa-m{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:96%;max-width:1500px;height:92vh;background:#141519;color:#e8eaef;border-radius:16px;z-index:1000000;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.7);isolation:isolate}#pa-m::before{content:'';position:absolute;inset:0;z-index:0;pointer-events:none;background:radial-gradient(60% 50% at 12% -10%,rgba(45,212,191,.10),transparent 60%),radial-gradient(55% 45% at 92% 0%,rgba(59,140,255,.07),transparent 60%)}#pa-cvs{position:absolute;left:0;top:0;width:100%;height:100%;display:block;pointer-events:none;z-index:1}#pa-bd{position:fixed;inset:0;background:rgba(6,8,12,.78);z-index:999999}.pa-h{padding:16px 24px;border-bottom:1px solid #33373f;display:flex;align-items:center;justify-content:space-between}.pa-h::after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:2px;background:linear-gradient(90deg,transparent,#2dd4bf,#3b8cff,transparent);background-size:200% 100%;animation:pa-slide 6s linear infinite}@keyframes pa-slide{to{background-position:200% 0}}.pa-badge{display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:700;color:#2dd4bf;background:rgba(45,212,191,.1);border:1px solid rgba(45,212,191,.3);padding:6px 12px;border-radius:20px;white-space:nowrap}.pa-dot{width:6px;height:6px;border-radius:50%;background:#2dd4bf;animation:pa-pulse 2s infinite;flex:0 0 auto}@keyframes pa-pulse{0%{box-shadow:0 0 0 0 rgba(45,212,191,.5)}70%{box-shadow:0 0 0 8px rgba(45,212,191,0)}100%{box-shadow:0 0 0 0 rgba(45,212,191,0)}}.pa-lang{font-family:ui-monospace,monospace;font-size:11px;font-weight:800;color:#9aa0ab;background:rgba(255,255,255,.04);border:1px solid #33373f;border-radius:8px;padding:6px 11px;cursor:pointer;transition:all .15s}.pa-lang:hover{color:#2dd4bf;border-color:#2dd4bf}.pa-tabs{display:flex;gap:8px;padding:12px 24px 0}.pa-tab{background:rgba(255,255,255,.04);color:#9aa0ab;border:1px solid #33373f;border-bottom:none;border-radius:10px 10px 0 0;padding:9px 18px;cursor:pointer;font-size:12px;font-weight:700;transition:all .15s}.pa-tab:hover{color:#2dd4bf}.pa-tab.active{background:rgba(45,212,191,.12);color:#2dd4bf;border-color:rgba(45,212,191,.4)}.pa-toolbar{padding:12px 24px;border-bottom:1px solid #33373f;display:flex;gap:10px;align-items:center;flex-wrap:wrap}.pa-lbl{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#9aa0ab;margin-right:4px}.pa-input{padding:8px 14px;background:rgba(12,14,18,.55);color:#e8eaef;border:1px solid #33373f;border-radius:8px;font-size:12px;outline:none}.pa-input:focus{border-color:#2dd4bf;box-shadow:0 0 0 3px rgba(45,212,191,.15)}.pa-input::placeholder{color:#9aa0ab}.pa-date{color-scheme:dark;padding:6px 10px;font-size:11px}.pa-pill{background:rgba(34,37,44,.55);color:#e8eaef;border:1px solid #33373f;border-radius:20px;padding:6px 14px;cursor:pointer;font-size:11px;font-weight:600;transition:all .15s}.pa-pill:hover{border-color:#2dd4bf;color:#2dd4bf}.pa-pill.active{background:#2dd4bf;color:#06120f;border-color:#2dd4bf}.pa-pill-primary{background:#37d67a;color:#06120f;border:none;font-weight:800}.pa-pill-primary:hover{background:#4ade80;color:#06120f}.pa-tbl-wrap{flex:1;overflow-y:auto;position:relative}.pa-tbl{width:100%;border-collapse:collapse}.pa-thead{position:sticky;top:0}.pa-th{padding:12px 16px;color:#9aa0ab;font-size:10px;text-align:left;text-transform:uppercase;letter-spacing:.8px;cursor:pointer;user-select:none;border-bottom:1px solid #33373f;white-space:nowrap}.pa-th:hover{color:#2dd4bf}.pa-th.active{color:#2dd4bf;background:rgba(45,212,191,.06)}.pa-sort-badge{display:inline-block;margin-left:4px;font-size:9px;color:#2dd4bf;font-weight:700}.pa-tr{border-bottom:1px solid rgba(51,55,63,.5);transition:background .15s}.pa-tr:hover{background:rgba(45,212,191,.1)}.pa-tr:hover .pa-link{text-shadow:0 0 10px rgba(59,140,255,.5)}.pa-td{padding:10px 16px;font-size:12px;vertical-align:middle;color:#e8eaef}.pa-td-cb{width:40px;text-align:center;padding:10px 8px}.pa-link{color:#3b8cff;text-decoration:none;font-family:ui-monospace,monospace;font-size:11px;font-weight:600}.pa-link:hover{text-decoration:underline}.pa-mono{font-family:ui-monospace,monospace;font-size:11px}.pa-status{display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:700}.pa-bm-name{font-size:11px;color:#e8eaef}.pa-bm-id{font-family:ui-monospace,monospace;font-size:9px;color:#9aa0ab;margin-top:2px}.pa-ads-ok{color:#37d67a;font-weight:700}.pa-ads-no{color:#ff5d6c;font-weight:700;margin-left:8px}.pa-footer{padding:14px 24px;border-top:1px solid #33373f;display:flex;justify-content:space-between;align-items:center}.pa-credits{font-size:11px;color:#9aa0ab}.pa-actions{display:flex;gap:10px}.pa-btn{background:rgba(26,28,33,.7);color:#e8eaef;border:1px solid #33373f;border-radius:8px;padding:8px 18px;cursor:pointer;font-size:12px;font-weight:600;transition:all .15s}.pa-btn:hover{border-color:#9aa0ab}.pa-btn-primary{background:#3b8cff;color:#fff;border:none}.pa-btn-primary:hover{background:#5c9aff}.pa-btn-csv{background:#2dd4bf;color:#06120f;border:none;font-weight:700}.pa-btn-csv:hover{background:#5eead4}.pa-btn-close{background:transparent;border:none;color:#9aa0ab;font-size:18px;cursor:pointer;padding:4px 8px;border-radius:6px}.pa-btn-close:hover{background:rgba(26,28,33,.8);color:#ff5d6c}.pa-action{appearance:none;display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:40px;padding:0 16px;border:1px solid rgba(45,212,191,.48);border-radius:9px;background:rgba(45,212,191,.12);color:#7deadd;font-size:12px;font-weight:800;line-height:1;white-space:nowrap;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.04);transition:background .15s,border-color .15s,color .15s,transform .12s}.pa-action:hover{background:rgba(45,212,191,.2);border-color:#2dd4bf;color:#b8fff5}.pa-action:active{transform:translateY(1px)}.pa-action:focus-visible{outline:2px solid #5e9fe8;outline-offset:2px}.pa-action:disabled{opacity:.48;cursor:not-allowed;transform:none}.pa-action-primary{background:#2dd4bf;border-color:#2dd4bf;color:#06120f;box-shadow:0 5px 16px rgba(45,212,191,.14)}.pa-action-primary:hover{background:#5eead4;border-color:#5eead4;color:#06120f}.pa-action-success{border-color:rgba(55,214,122,.46);background:rgba(55,214,122,.1);color:#72df9f}.pa-action-success:hover{border-color:#37d67a;background:rgba(55,214,122,.18);color:#9af0bb}.pa-action-warning{border-color:rgba(245,177,61,.46);background:rgba(245,177,61,.09);color:#f5c66f}.pa-action-warning:hover{border-color:#f5b13d;background:rgba(245,177,61,.16);color:#ffda91}.pa-action-danger{border-color:rgba(255,93,108,.46);background:rgba(255,93,108,.09);color:#ff8490}.pa-action-danger:hover{border-color:#ff5d6c;background:rgba(255,93,108,.16);color:#ffadb5}.pa-action-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex:0 0 auto}.pa-source-action{margin-top:10px;align-self:flex-start}.ar-box{background:rgba(255,255,255,.03);border:1px solid #33373f;border-radius:12px;padding:14px}.ar-row{display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid #33373f;border-radius:8px;cursor:pointer;transition:background .12s}.ar-row:hover{background:rgba(45,212,191,.06)}.ar-tgt{display:flex;align-items:center;gap:8px;padding:6px 10px;border-bottom:1px solid rgba(51,55,63,.5);transition:background .12s}.ar-tgt:hover{background:rgba(45,212,191,.06)}.ar-src-opt{display:flex;gap:8px;align-items:center;padding:7px 10px;border-bottom:1px solid rgba(51,55,63,.4);cursor:pointer;font-size:11px;transition:background .12s}.ar-src-opt:hover{background:rgba(45,212,191,.08)}.ar-src-opt.sel{background:rgba(45,212,191,.12);border-left:3px solid #2dd4bf;padding-left:7px}#pa-m input.pa-cb{-webkit-appearance:none;appearance:none;width:16px;height:16px;min-width:16px;border:1.5px solid #545963;border-radius:5px;background:#101216;cursor:pointer;position:relative;vertical-align:middle;margin:0;padding:0;flex:0 0 auto;transition:transform .12s,box-shadow .14s,border-color .14s,background .14s}#pa-m input.pa-cb:hover{border-color:#2dd4bf}#pa-m input.pa-cb:checked{background:linear-gradient(135deg,#2dd4bf,#1fb3a3);border-color:#2dd4bf;box-shadow:0 0 10px rgba(45,212,191,.5)}#pa-m input.pa-cb:checked::after{content:'';position:absolute;left:4.5px;top:1px;width:4px;height:8px;border:solid #06120f;border-width:0 2px 2px 0;transform:rotate(45deg)}#pa-m input.pa-cb:active{transform:scale(.86)}#pa-m #ar-log,#pa-m #cl-log{color:#c3c8d0}#pa-m .pa-logline{padding:3px 8px;border-radius:5px;border-left:2px solid transparent;margin:1px 0;word-break:break-word;animation:pa-logrow .24s cubic-bezier(.2,.8,.2,1) both}#pa-m .pa-logline:hover{background:rgba(255,255,255,.035)}#pa-m .ll-time{color:#5b626d;margin-right:7px;font-size:10px}#pa-m .ll-ok{color:#86e6cf;border-left-color:rgba(45,212,191,.6);background:rgba(45,212,191,.05)}#pa-m .ll-err{color:#ff9aa3;border-left-color:rgba(255,93,108,.7);background:rgba(255,93,108,.07)}#pa-m .ll-sep{color:#9fc0ff;border-left-color:transparent;border-top:1px solid #2a2e37;margin-top:7px;padding-top:7px;font-weight:700;background:none}#pa-m .ll-warn{color:#ffd27a;border-left-color:rgba(245,177,61,.6);background:rgba(245,177,61,.06)}#pa-m .ll-info{color:#c3c8d0;border-left-color:rgba(59,140,255,.5);background:rgba(59,140,255,.04)}#pa-m .ll-plain{color:#c3c8d0}#pa-m .ll-probe{color:var(--violet);background:rgba(167,139,250,.08);border-left:2px solid var(--violet)}#pa-m .ll-done{color:#7ee2a8;border-left-color:rgba(55,214,122,.7);background:rgba(55,214,122,.08);margin-top:7px;font-weight:700}@keyframes pa-logrow{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:none}}.pa-empty{padding:48px;text-align:center;color:#9aa0ab;font-size:13px}::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#33373f;border-radius:4px}::-webkit-scrollbar-thumb:hover{background:#9aa0ab}`;
    document.head.appendChild(s);
  }
  injectStyles();
  const accountId = id => String(id || '').replace(/^act_/, '');
  const esc = s =>
    String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  const apiCall = (url, opts) =>
    fetch(url, Object.assign({ credentials: 'include' }, opts || {})).then(r => r.json());
  const todayInTz = tz => {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
    } catch (e) {
      return new Intl.DateTimeFormat('en-CA').format(new Date());
    }
  };
  const shiftDate = (iso, days) => {
    const p = iso.split('-').map(Number);
    const dt = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    dt.setUTCDate(dt.getUTCDate() + days);
    return dt.toISOString().slice(0, 10);
  };
  const monthStart = iso => iso.slice(0, 8) + '01';
  const prevMonthRange = iso => {
    const p = iso.split('-').map(Number);
    const d = new Date(Date.UTC(p[0], p[1] - 1, 0));
    return { since: d.toISOString().slice(0, 8) + '01', until: d.toISOString().slice(0, 10) };
  };
  const getRange = (preset, tz) => {
    const today = todayInTz(tz);
    const yesterday = shiftDate(today, -1);
    if (preset === 'today') return { since: today, until: today, label: 'Today' };
    if (preset === 'yesterday') return { since: yesterday, until: yesterday, label: 'Yesterday' };
    if (preset === 'last_7_days') return { since: shiftDate(today, -6), until: today, label: 'Last 7 days' };
    if (preset === 'last_14_days')
      return { since: shiftDate(today, -13), until: today, label: 'Last 14 days' };
    if (preset === 'last_30_days')
      return { since: shiftDate(today, -29), until: today, label: 'Last 30 days' };
    if (preset === 'this_month') return { since: monthStart(today), until: today, label: 'This month' };
    if (preset === 'last_month') {
      const r = prevMonthRange(today);
      return { since: r.since, until: r.until, label: 'Last month' };
    }
    if (preset === 'maximum') return { since: '', until: '', label: 'Lifetime' };
    return { since: today, until: today, label: 'Today' };
  };
  const fetchJson = (url, retries = 1) =>
    fetch(url, { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .catch(e => {
        if (retries > 0)
          return new Promise(res => setTimeout(res, 700)).then(() => fetchJson(url, retries - 1));
        throw e;
      });
  const getAds = id =>
    fetchJson(
      `https://graph.facebook.com/v25.0/${id}/ads?fields=status,effective_status&limit=1000&access_token=${encodeURIComponent(token)}`
    )
      .then(d => {
        if (!d.data) return { ok: 0, no: 0 };
        let ok = 0,
          no = 0;
        d.data.forEach(ad => {
          const es = ad.effective_status || ad.status;
          if (['ACTIVE', 'PAUSED', 'CAMPAIGN_PAUSED', 'ADSET_PAUSED', 'IN_PROCESS'].includes(es)) ok++;
          else if (['DISAPPROVED', 'PREAPPROVED'].includes(es)) no++;
        });
        return { ok, no };
      })
      .catch(() => ({ ok: 0, no: 0 }));
  const mapByRange = (data, ranges) =>
    ranges.map(r => {
      const found = (data || []).find(x => x.date_start === r.since && x.date_stop === r.until);
      return found ? parseFloat(found.spend) || 0 : 0;
    });
  const getInsightsMulti = (id, ranges) => {
    const tr = ranges.map(r => ({ since: r.since, until: r.until }));
    return new Promise(resolve => {
      const timeout = setTimeout(() => resolve(ranges.map(() => 0)), 12000);
      fetchJson(
        `https://graph.facebook.com/v25.0/${id}/insights?fields=spend,date_start,date_stop&time_ranges=${encodeURIComponent(JSON.stringify(tr))}&access_token=${encodeURIComponent(token)}`
      )
        .then(d => {
          clearTimeout(timeout);
          resolve(mapByRange(d.data, ranges));
        })
        .catch(() => {
          clearTimeout(timeout);
          resolve(ranges.map(() => 0));
        });
    });
  };
  const getInsightsPreset = (id, preset) =>
    new Promise(resolve => {
      const timeout = setTimeout(() => resolve(0), 12000);
      fetchJson(
        `https://graph.facebook.com/v25.0/${id}/insights?fields=spend&date_preset=${encodeURIComponent(preset)}&access_token=${encodeURIComponent(token)}`
      )
        .then(d => {
          clearTimeout(timeout);
          const arr = d.data || [];
          resolve(arr.length ? parseFloat(arr[0].spend) || 0 : 0);
        })
        .catch(() => {
          clearTimeout(timeout);
          resolve(0);
        });
    });
  const runBatched = async (items, limit, fn, onProgress) => {
    const results = new Array(items.length);
    let idx = 0;
    let doneCount = 0;
    const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
      while (idx < items.length) {
        const i = idx++;
        try {
          results[i] = await fn(items[i], i);
        } catch (e) {
          results[i] = null;
        }
        doneCount++;
        if (onProgress) onProgress(doneCount, items.length);
      }
    });
    await Promise.all(workers);
    return results;
  };
  const CUR_OFF = {
    JPY: 1,
    KRW: 1,
    VND: 1,
    CLP: 1,
    COP: 1,
    HUF: 1,
    ISK: 1,
    IDR: 1,
    UGX: 1,
    GNF: 1,
    RWF: 1,
    BHD: 1000,
    KWD: 1000,
    OMR: 1000,
    JOD: 1000,
    TND: 1000
  };
  function curOff(c) {
    return CUR_OFF[String(c || '').toUpperCase()] || 100;
  }
  function normCurField(f) {
    return String(f || '')
      .toLowerCase()
      .replace(/^(ad|adset|campaign|ads|adsets|campaigns)\./, '')
      .replace(/^(today|lifetime)_/, '')
      .replace(/_fb$/, '');
  }
  const CUR_FIELDS = new Set([
    'spent',
    'cost',
    'cpa',
    'cpr',
    'cpp',
    'cpc',
    'cpm',
    'cost_per_purchase',
    'cost_per_add_to_cart',
    'cost_per_lead',
    'cost_per_inline_link_click',
    'cost_per_action_type',
    'cost_per_unique_action_type',
    'cost_per_thruplay',
    'cost_per_landing_page_view',
    'cost_per_outbound_click',
    'cost_per_unique_click',
    'cost_per_video_view'
  ]);
  function isCurField(f) {
    const n = normCurField(f);
    return CUR_FIELDS.has(n) || (/^cost_per_/.test(n) && !/roas/.test(n));
  }
  function ruleToUSD(rule, rate, cur) {
    if (rate === 1) return rule;
    const out = JSON.parse(JSON.stringify(rule));
    const ao = curOff(cur),
      uo = curOff('USD');
    if (out.evaluation_spec && out.evaluation_spec.filters) {
      out.evaluation_spec.filters.forEach(f => {
        if (f.value != null && !isNaN(f.value) && isCurField(f.field)) {
          f.value = Math.round((parseFloat(f.value) / rate) * (uo / ao)).toString();
        }
      });
    }
    return out;
  }
  function ruleFromUSD(rule, rate, cur) {
    if (rate === 1) return rule;
    const out = JSON.parse(JSON.stringify(rule));
    const ao = curOff(cur),
      uo = curOff('USD');
    if (out.evaluation_spec && out.evaluation_spec.filters) {
      out.evaluation_spec.filters.forEach(f => {
        if (f.value != null && !isNaN(f.value) && isCurField(f.field)) {
          f.value = Math.round((parseFloat(f.value) / uo) * rate * ao).toString();
        }
      });
    }
    return out;
  }
  function tzOffsetMin(tz) {
    try {
      const s = new Date().toLocaleString('en-US', { timeZone: tz });
      const u = new Date().toLocaleString('en-US', { timeZone: 'UTC' });
      return Math.round((new Date(u) - new Date(s)) / 60000);
    } catch (e) {
      return 0;
    }
  }
  (function () {
    var s2 = document.createElement('style');
    s2.textContent =
      '.pa-dot-red{width:8px;height:8px;border-radius:50%;background:#ff5d6c;box-shadow:0 0 8px rgba(255,93,108,.7);animation:pa-pulse-red 2s infinite;}@keyframes pa-pulse-red{0%{box-shadow:0 0 0 0 rgba(255,93,108,.55);}70%{box-shadow:0 0 0 7px rgba(255,93,108,0);}100%{box-shadow:0 0 0 0 rgba(255,93,108,0);}}';
    document.head.appendChild(s2);
  })();
