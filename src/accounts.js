  async function loadAccounts(onProgress) {
    let bmData;
    try {
      bmData = await fetchJson(
        `https://graph.facebook.com/v25.0/me/businesses?fields=id,name,is_disabled,verification_status&limit=500&access_token=${encodeURIComponent(token)}`
      );
    } catch (e) {
      bmData = await fetchJson(
        `https://graph.facebook.com/v25.0/me/businesses?fields=id,name&limit=500&access_token=${encodeURIComponent(token)}`
      );
    }
    const businesses = bmData.data || [];
    const accountToBM = {};
    let bmDone = 0;
    for (const bm of businesses) {
      const bmBad =
        !!bm.is_disabled || /failed|revoked|rejected|banned/.test(String(bm.verification_status || ''));
      try {
        const [cl, ow] = await Promise.all([
          fetchJson(
            `https://graph.facebook.com/v25.0/${bm.id}/client_ad_accounts?fields=id&limit=500&access_token=${encodeURIComponent(token)}`
          ).catch(() => ({ data: [] })),
          fetchJson(
            `https://graph.facebook.com/v25.0/${bm.id}/owned_ad_accounts?fields=id&limit=500&access_token=${encodeURIComponent(token)}`
          ).catch(() => ({ data: [] }))
        ]);
        [...cl.data, ...ow.data].forEach(acc => {
          if (!accountToBM[acc.id]) accountToBM[acc.id] = { id: bm.id, name: bm.name, bad: bmBad };
        });
      } catch (e) {}
      bmDone++;
      if (onProgress) onProgress('BM: ' + bmDone + '/' + businesses.length);
    }
    const data = await fetchJson(
      `https://graph.facebook.com/v25.0/me/adaccounts?fields=id,name,account_status,balance,currency,business,timezone_name,adtrust_dsl,account_currency_ratio_to_usd,adspaymentcycle{threshold_amount}&limit=500&access_token=${encodeURIComponent(token)}`
    );
    if (data.error) throw new Error(data.error.message);
    const accs = data.data || [];
    accs.forEach(a => {
      if (accountToBM[a.id]) a.accessibleBM = accountToBM[a.id];
      a.ratio = a.account_currency_ratio_to_usd || 1;
    });
    const ACT = [1, 3, 7, 8, 9];
    const badIds = {};
    (businesses || []).forEach(bm => {
      if (
        bm.is_disabled === true ||
        /failed|revoked|rejected|banned/.test(String(bm.verification_status || ''))
      )
        badIds[bm.id] = true;
    });
    const byBm = {};
    accs.forEach(a => {
      const b = a.accessibleBM || a.business;
      if (b && b.id) {
        (byBm[b.id] = byBm[b.id] || []).push(a);
      }
    });
    Object.keys(byBm).forEach(id => {
      const arr = byBm[id];
      if (arr.length && arr.every(a => !ACT.includes(a.account_status))) badIds[id] = true;
    });
    accs.forEach(a => {
      [a.accessibleBM, a.business].forEach(b => {
        if (b && badIds[b.id]) b.bad = true;
      });
    });
    let done = 0;
    const total = accs.length * 3;
    await runBatched(accs, 12, async a => {
      const tz = a.timezone_name || undefined;
      const initRanges = [getRange('today', tz), getRange('yesterday', tz), getRange('last_7_days', tz)];
      const [ads, sp, life] = await Promise.all([
        getAds(a.id),
        getInsightsMulti(a.id, initRanges),
        getInsightsPreset(a.id, 'maximum')
      ]);
      done += 3;
      if (onProgress) onProgress(done + '/' + total);
      a.ads = ads;
      try {
        const stD = await fetchJson(
          `https://graph.facebook.com/v25.0/${a.id}/ads?fields=id,status,effective_status&limit=1000&access_token=${encodeURIComponent(token)}`
        );
        let act = 0,
          pau = 0,
          rej = 0;
        (stD.data || []).forEach(x => {
          const es = String(x.effective_status || '');
          if (es.indexOf('DISAPPROVED') >= 0) rej++;
          else if (es === 'ACTIVE') act++;
          else if (es.indexOf('PAUSED') >= 0) pau++;
        });
        a.adStats = { active: act, paused: pau, rejected: rej };
      } catch (e) {
        a.adStats = { active: 0, paused: 0, rejected: 0 };
      }
      a.dailyLimit = a.adtrust_dsl ? Math.round(a.adtrust_dsl / a.ratio) : 0;
      a.billing =
        a.adspaymentcycle && a.adspaymentcycle.data && a.adspaymentcycle.data[0]
          ? Math.round(a.adspaymentcycle.data[0].threshold_amount / 100 / a.ratio)
          : 0;
      a.spend = { today: sp[0], yesterday: sp[1], last7Days: sp[2], lifetime: life };
      a.periodSpend = a.spend.last7Days;
      a._periodKey = 'last_7_days';
    });
    return accs;
  }
  let loadOv = null,
    loadOvSt = null;
  function showLoadOv(title) {
    hideLoadOv();
    loadOv = document.createElement('div');
    loadOv.className = 'pa-overlay';
    loadOv.style.zIndex = '1000003';
    loadOv.innerHTML =
      '<div class="pa-load-box"><div class="pa-load-title">' +
      (title || t('loading')) +
      '</div><div class="pa-load-spinner"></div><div id="pa-load-st" style="margin-top:15px;font-size:12px;color:#9aa0ab;font-family:ui-monospace,monospace;">0/0</div></div>';
    document.body.appendChild(loadOv);
    loadOvSt = document.getElementById('pa-load-st');
  }
  function setLoadOv(txt) {
    if (loadOvSt) loadOvSt.textContent = txt;
  }
  function hideLoadOv() {
    if (loadOv) {
      loadOv.remove();
      loadOv = null;
      loadOvSt = null;
    }
  }
  showLoadOv(t('loading'));
  loadAccounts(txt => setLoadOv(txt))
    .then(accs => {
      hideLoadOv();
      if (!accs || !accs.length) {
        alert(t('no_accs'));
        return;
      }
      showModal(accs);
    })
    .catch(e => {
      hideLoadOv();
      alert(t('err') + (e && e.message ? e.message : e));
    });
