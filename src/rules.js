    function logKind(m) {
      if (/━/.test(m)) return 'sep';
      if (/⛔/.test(m)) return 'err';
      if (/✗/.test(m)) return 'err';
      if (/✓/.test(m)) return 'ok';
      if (/⚠/.test(m)) return 'warn';
      if (/🔬/.test(m)) return 'probe';
      if (/📥|🚀|📂/.test(m)) return 'info';
      return 'plain';
    }
    function arLog(m, kind) {
      const el = document.getElementById('ar-log');
      if (!el) return;
      const gen = typeof m === 'function' ? m : () => m;
      const html = gen();
      const k = kind || logKind(html);
      const tm = new Date().toLocaleTimeString();
      arLogEntries.push({ tm, k, gen });
      const div = document.createElement('div');
      div.className = 'pa-logline ll-' + k;
      div.innerHTML = '<span class="ll-time">' + tm + '</span>' + html;
      el.appendChild(div);
      el.scrollTop = el.scrollHeight;
    }
    function rerenderLog() {
      const el = document.getElementById('ar-log');
      if (!el) return;
      el.innerHTML = '';
      arLogEntries.forEach(e => {
        const div = document.createElement('div');
        div.className = 'pa-logline ll-' + e.k;
        div.innerHTML = '<span class="ll-time">' + e.tm + '</span>' + e.gen();
        el.appendChild(div);
      });
      el.scrollTop = el.scrollHeight;
    }
    function renderArFound() {
      const f = document.getElementById('ar-found');
      if (f) f.textContent = arFoundGen ? arFoundGen() : '';
    }
    function paintArCount(id) {
      const c = arRuleCounts[id];
      document.querySelectorAll('[data-rc="' + id + '"]').forEach(el => {
        if (!c) {
          el.textContent = '…';
          el.style.color = '#9aa0ab';
        } else if (c.err) {
          el.textContent = '?';
          el.style.color = '#ff5d6c';
        } else {
          el.innerHTML =
            '<span style="color:#37d67a">✓' +
            c.on +
            '</span> <span style="color:#9aa0ab">⏸' +
            c.off +
            '</span>';
        }
      });
    }
    function paintVisibleArCounts() {
      modal
        .querySelectorAll('#pa-tab-rules [data-rc]')
        .forEach(el => paintArCount(el.getAttribute('data-rc')));
    }
    function loadArCounts(list) {
      return runBatched(list, 12, async a => {
        try {
          const d = await fetchJson(
            `https://graph.facebook.com/v25.0/${a.id}/adrules_library?fields=status&limit=200&access_token=${encodeURIComponent(token)}`
          );
          let on = 0,
            off = 0;
          (d.data || []).forEach(r => {
            if (r.status === 'ENABLED') on++;
            else off++;
          });
          arRuleCounts[a.id] = { on, off };
        } catch (e) {
          arRuleCounts[a.id] = { on: 0, off: 0, err: 1 };
        }
        paintArCount(a.id);
      });
    }
    function arSrcOptHtml(a) {
      return `<div class="ar-src-opt" data-id="${a.id}"><span style="font-family:ui-monospace,monospace;color:#3b8cff;">${esc(accountId(a.id))}</span><span style="flex:1;color:#e8eaef;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(a.name || '—')}</span><span class="ar-rc" data-rc="${a.id}" style="font-size:10px;color:#9aa0ab;">…</span><span style="font-size:10px;color:#9aa0ab;">${esc(a.currency || '')}</span></div>`;
    }
    function fillArSrc() {
      const box = document.getElementById('ar-src-list');
      if (!box) return;
      box.innerHTML = accs.map(arSrcOptHtml).join('');
      box.querySelectorAll('.ar-src-opt').forEach(o => {
        o.onclick = function () {
          selectArSrc(this.dataset.id);
        };
      });
      paintVisibleArCounts();
    }
    function selectArSrc(id) {
      arSrcId = id;
      document.querySelectorAll('.ar-src-opt').forEach(o => o.classList.toggle('sel', o.dataset.id === id));
      const inp = document.getElementById('ar-src-search');
      const a = accs.find(x => x.id === id);
      if (inp && a) inp.value = accountId(a.id) + ' — ' + (a.name || '') + ' (' + (a.currency || '') + ')';
    }
    function filterArSrcOpts(q) {
      document.querySelectorAll('.ar-src-opt').forEach(o => {
        const a = accs.find(x => x.id === o.dataset.id);
        const hay = (
          o.dataset.id +
          ' ' +
          (a ? a.name : '') +
          ' ' +
          (a && a.accessibleBM ? a.accessibleBM.name : '') +
          ' ' +
          (a ? a.currency : '')
        ).toLowerCase();
        o.style.display = !q || hay.indexOf(q) >= 0 ? 'flex' : 'none';
      });
    }
    function arGetTargets() {
      let list = accs;
      if (arFilter === 'active') list = list.filter(a => isAct(a.account_status));
      else if (arFilter === 'disabled') list = list.filter(a => !isAct(a.account_status));
      const s = (document.getElementById('ar-search') || {}).value || '';
      if (s) {
        const q = s.toLowerCase();
        list = list.filter(
          a =>
            (a.name || '').toLowerCase().includes(q) ||
            a.id.includes(q) ||
            (a.accessibleBM?.name || '').toLowerCase().includes(q)
        );
      }
      if (arSortMode === 'rules_first') {
        list = list.filter(a => {
          const c = arRuleCounts[a.id];
          return c && c.on + c.off > 0;
        });
      } else if (arSortMode === 'no_rules_first') {
        list = list.filter(a => {
          const c = arRuleCounts[a.id];
          return !(c && c.on + c.off > 0);
        });
      } else if (arSortMode === 'name') {
        list = list.slice();
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      } else if (arSortMode === 'id') {
        list = list.slice();
        list.sort((a, b) => String(a.id).localeCompare(String(b.id)));
      }
      return list;
    }
    function updateArCnt() {
      const el = document.getElementById('ar-tgtcnt');
      const vis = arGetTargets();
      const selVis = vis.filter(a => arSelectedTargets.has(a.id)).length;
      if (el)
        el.innerHTML =
          '<b style="color:#2dd4bf;">' +
          selVis +
          '</b><span style="color:#6b7280;"> / ' +
          vis.length +
          '</span>';
      const hdr = document.getElementById('ar-hdr-cb');
      if (hdr) hdr.checked = vis.length > 0 && selVis === vis.length;
    }
    function renderArTargets() {
      const box = document.getElementById('ar-targets');
      if (!box) return;
      const list = arGetTargets();
      box.innerHTML =
        list
          .map(a => {
            const st = stM[a.account_status] || { t: '?', c: '#8a8d91' };
            const chk = arSelectedTargets.has(a.id);
            const actNum = (a.id || '').replace(/^act_/, '');
            return `<div class="ar-tgt"><input type="checkbox" class="pa-cb ar-tgt-cb" data-id="${a.id}" ${chk ? 'checked' : ''}><a href="https://www.facebook.com/adsmanager/manage/campaigns?act=${actNum}" target="_blank" class="pa-link">${accountId(a.id)}</a><span style="flex:1;font-size:11px;color:#e8eaef;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(a.name || '—')}</span><span class="ar-rc" data-rc="${a.id}" style="font-size:10px;color:#9aa0ab;">…</span><span style="color:${st.c};font-size:10px;">● ${st.t}</span><span style="font-size:10px;color:#9aa0ab;">${a.currency || ''}</span></div>`;
          })
          .join('') || '<div class="pa-empty" style="padding:16px;">' + t('empty') + '</div>';
      box.querySelectorAll('.ar-tgt-cb').forEach(cb => {
        cb.onchange = function () {
          if (this.checked) arSelectedTargets.add(this.dataset.id);
          else arSelectedTargets.delete(this.dataset.id);
          popCb(this);
          updateArCnt();
        };
      });
      updateArCnt();
      paintVisibleArCounts();
    }
    function renderArRules() {
      const box = document.getElementById('ar-rules');
      if (!box) return;
      if (!arRules.length) {
        box.innerHTML = '<div class="pa-empty" style="padding:20px;">' + t('ar_no_rules') + '</div>';
        return;
      }
      box.innerHTML = arRules
        .map((r, i) => {
          const stc = r.status === 'ENABLED' ? '#37d67a' : '#9aa0ab';
          const et = (r.evaluation_spec && r.evaluation_spec.evaluation_type) || '?';
          const ac = (r.execution_spec && r.execution_spec.execution_type) || '?';
          return `<label class="ar-row"><input type="checkbox" class="pa-cb ar-rule-cb" data-i="${i}" checked><span style="flex:1;font-size:12px;color:#e8eaef;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(r.name)}</span><span style="color:${stc};font-size:10px;">● ${r.status || '?'}</span><span style="font-size:9px;color:#9aa0ab;font-family:ui-monospace,monospace;">${et}·${ac}</span></label>`;
        })
        .join('');
      box.querySelectorAll('.ar-rule-cb').forEach(cb => {
        cb.onchange = function () {
          popCb(this);
        };
      });
    }
    function arSelectedRules() {
      return arRules.filter((r, i) => {
        const cb = document.querySelector('.ar-rule-cb[data-i="' + i + '"]');
        return cb && cb.checked;
      });
    }
    function arExportJson() {
      const sel = arSelectedRules();
      if (!sel.length) {
        alert(t('ar_no_rules_export'));
        return;
      }
      const clean = sel.map(r => ({
        name: r.name,
        status: r.status,
        evaluation_spec: r.evaluation_spec,
        execution_spec: r.execution_spec,
        schedule_spec: r.schedule_spec
      }));
      const json = JSON.stringify(clean, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const aEl = document.createElement('a');
      aEl.href = url;
      aEl.download = 'parseraccs_rules_' + stampNow() + '.json';
      document.body.appendChild(aEl);
      aEl.click();
      aEl.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      arLog(() => '💾 JSON: ' + clean.length);
    }
    function arImportJson(file) {
      const rd = new FileReader();
      rd.onload = ev => {
        try {
          const raw = JSON.parse(String(ev.target.result || '').replace(/^\uFEFF/, ''));
          let arr = Array.isArray(raw) ? raw : raw && Array.isArray(raw.rules) ? raw.rules : null;
          if (!arr || !arr.length || !arr.some(x => x && x.evaluation_spec)) {
            alert(t('ar_json_bad'));
            arLog(() => '✗ ' + t('ar_json_bad'));
            return;
          }
          arRules = arr.map(r => ({
            name: r.name || 'rule',
            status: r.status || 'ENABLED',
            evaluation_spec: r.evaluation_spec,
            execution_spec: r.execution_spec,
            schedule_spec: r.schedule_spec
          }));
          renderArRules();
          arFoundGen = () => t('ar_found') + ': ' + arRules.length + ' (' + t('ar_json_ok') + ')';
          renderArFound();
          arLog(() => '📂 ' + t('ar_json_ok') + ': ' + arRules.length);
        } catch (e) {
          alert(t('ar_json_bad'));
          arLog(() => '✗ ' + e.message);
        }
      };
      rd.readAsText(file);
    }
    async function arExport() {
      if (!arSrcId) {
        alert(t('ar_select_src'));
        return;
      }
      const src = arSrcId;
      const srcAcc = accs.find(a => a.id === src);
      const rate = srcAcc ? srcAcc.ratio || 1 : 1;
      const cur = srcAcc ? srcAcc.currency || 'USD' : 'USD';
      arLog(() => '📥 ' + src + ' (' + cur + ') …');
      if (srcAcc && srcAcc.timezone_name) arLog(() => t('ar_tz_donor') + ' ' + srcAcc.timezone_name);
      try {
        const d = await fetchJson(
          `https://graph.facebook.com/v25.0/${src}/adrules_library?fields=id,name,status,evaluation_spec,execution_spec,schedule_spec&limit=200&access_token=${encodeURIComponent(token)}`
        );
        let rules = (d.data || [])
          .map(r => {
            try {
              if (typeof r.evaluation_spec === 'string') r.evaluation_spec = JSON.parse(r.evaluation_spec);
              if (typeof r.execution_spec === 'string') r.execution_spec = JSON.parse(r.execution_spec);
              if (typeof r.schedule_spec === 'string') r.schedule_spec = JSON.parse(r.schedule_spec);
              return ruleToUSD(
                {
                  id: r.id,
                  name: r.name,
                  status: r.status,
                  evaluation_spec: r.evaluation_spec,
                  execution_spec: r.execution_spec,
                  schedule_spec: r.schedule_spec
                },
                rate,
                cur
              );
            } catch (e) {
              return null;
            }
          })
          .filter(Boolean);
        arRules = rules;
        renderArRules();
        arFoundGen = () => t('ar_found') + ': ' + rules.length;
        renderArFound();
        arLog(() => '✓ ' + t('ar_found') + ': ' + rules.length);
      } catch (e) {
        arLog(() => '✗ ' + e.message);
      }
    }
    async function arImport() {
      const selRules = arSelectedRules();
      const tgts = [...arSelectedTargets];
      if (!selRules.length) {
        alert(t('ar_select_rules'));
        return;
      }
      if (!tgts.length) {
        alert(t('ar_select_tgt'));
        return;
      }
      if (!confirm(t('ar_confirm').replace('{n}', selRules.length).replace('{m}', tgts.length))) return;
      const convert = document.getElementById('ar-convert').checked;
      const purge = document.getElementById('ar-purge').checked;
      const asPaused = document.getElementById('ar-paused').checked;
      const srcAcc = arSrcId ? accs.find(a => a.id === arSrcId) : null;
      let ok = 0,
        err = 0;
      for (const tgtId of tgts) {
        const tgt = accs.find(a => a.id === tgtId);
        const rate = tgt ? tgt.ratio || 1 : 1;
        const cur = tgt ? tgt.currency || 'USD' : 'USD';
        arLog('━━━ ' + tgtId + ' (' + cur + ') ━━━');
        const hasSched = selRules.some(r => r.schedule_spec && r.schedule_spec.schedule_type === 'SCHEDULED');
        if (hasSched) {
          const tTz = tgt && tgt.timezone_name;
          const sTz = srcAcc && srcAcc.timezone_name;
          if (tTz && sTz) {
            const dH = (tzOffsetMin(tTz) - tzOffsetMin(sTz)) / 60;
            arLog(() =>
              t('ar_tz_sched_delta')
                .replace('{s}', sTz)
                .replace('{t}', tTz)
                .replace('{d}', (dH > 0 ? '+' : '') + dH)
            );
          } else arLog(() => t('ar_tz_sched_notz').replace('{t}', tTz || '?'));
        }
        if (purge) {
          try {
            const ex = await fetchJson(
              `https://graph.facebook.com/v25.0/${tgtId}/adrules_library?fields=id,name&limit=200&access_token=${encodeURIComponent(token)}`
            );
            const old = ex.data || [];
            for (const r of old) {
              try {
                await apiCall(
                  `https://graph.facebook.com/v25.0/${r.id}?method=delete&access_token=${encodeURIComponent(token)}`,
                  { method: 'POST' }
                );
              } catch (e) {}
            }
            arLog(() => '🗑 ' + old.length + ' ' + t('ar_deleted'));
          } catch (e) {
            arLog('✗ purge: ' + e.message);
          }
        }
        for (const rule of selRules) {
          try {
            const convRule = convert ? ruleFromUSD(rule, rate, cur) : rule;
            const body = new URLSearchParams();
            body.append('locale', 'en_US');
            body.append('name', convRule.name || 'rule');
            body.append('status', asPaused ? 'DISABLED' : convRule.status || 'ENABLED');
            body.append('evaluation_spec', JSON.stringify(convRule.evaluation_spec || {}));
            body.append('execution_spec', JSON.stringify(convRule.execution_spec || {}));
            body.append(
              'schedule_spec',
              JSON.stringify(convRule.schedule_spec || { schedule_type: 'SEMI_HOURLY' })
            );
            body.append('access_token', token);
            const res = await apiCall(`https://graph.facebook.com/v25.0/${tgtId}/adrules_library`, {
              method: 'POST',
              body
            });
            if (res.error) {
              arLog('✗ ' + esc(convRule.name) + ': ' + (res.error.message || JSON.stringify(res.error)));
              err++;
            } else {
              arLog('✓ ' + esc(convRule.name) + ' → ' + res.id);
              ok++;
            }
          } catch (e) {
            arLog('✗ ' + esc(rule.name) + ': ' + e.message);
            err++;
          }
        }
      }
      arLog(
        () =>
          '━━━ ' +
          t('ar_done') +
          ': ' +
          t('ar_created') +
          ' ✓' +
          ok +
          ' · ' +
          t('ar_errors') +
          ' ✗' +
          err +
          ' ━━━',
        'done'
      );
    }
    async function arBulk(mode) {
      const tgts = [...arSelectedTargets];
      if (!tgts.length) {
        alert(t('ar_select_tgt'));
        return;
      }
      const label =
        mode === 'DELETE' ? t('ar_delete') : mode === 'ENABLED' ? t('ar_enable') : t('ar_disable');
      if (!confirm(label + ' → ' + tgts.length + '?')) return;
      let ok = 0,
        err = 0;
      for (const tgtId of tgts) {
        arLog('━━━ ' + tgtId + ' ━━━');
        try {
          const ex = await fetchJson(
            `https://graph.facebook.com/v25.0/${tgtId}/adrules_library?fields=id,name&limit=200&access_token=${encodeURIComponent(token)}`
          );
          const rules = ex.data || [];
          for (const r of rules) {
            try {
              if (mode === 'DELETE')
                await apiCall(
                  `https://graph.facebook.com/v25.0/${r.id}?method=delete&access_token=${encodeURIComponent(token)}`,
                  { method: 'POST' }
                );
              else {
                const b = new URLSearchParams();
                b.append('locale', 'en_US');
                b.append('status', mode);
                b.append('access_token', token);
                await apiCall(`https://graph.facebook.com/v25.0/${r.id}`, { method: 'POST', body: b });
              }
              ok++;
            } catch (e) {
              err++;
              arLog('✗ ' + esc(r.name) + ': ' + e.message);
            }
          }
          arLog((mode === 'DELETE' ? '🗑' : mode === 'ENABLED' ? '▶' : '⏸') + ' ' + rules.length);
        } catch (e) {
          arLog('✗ ' + e.message);
          err++;
        }
      }
      arLog(() => '━━━ ' + t('ar_done') + ': ✓' + ok + ' · ✗' + err + ' ━━━', 'done');
    }
    async function refreshData() {
      showLoadOv(t('refreshing'));
      try {
        const newAccs = await loadAccounts(txt => setLoadOv(txt));
        const oldSel = new Set(selectedIds);
        accs.splice(0, accs.length, ...newAccs);
        selectedIds.clear();
        oldSel.forEach(id => {
          if (accs.some(a => a.id === id)) selectedIds.add(id);
        });
        const bn = document.getElementById('pa-badge-n');
        if (bn) bn.textContent = accs.length;
        const pt = document.getElementById('pa-total');
        if (pt) pt.textContent = accs.length;
        currentRange = getRange('last_7_days');
        currentPeriodKey = 'last_7_days';
        const ph = document.getElementById('fb-ph');
        if (ph) ph.textContent = 'Spend (Last 7 days)';
        const d7 = getRange('last_7_days');
        document.getElementById('fb-d1').value = d7.since;
        document.getElementById('fb-d2').value = d7.until;
        document.querySelectorAll('.pa-p').forEach(x => x.classList.remove('active'));
        const b7 = document.querySelector('.pa-p[data-p="last_7_days"]');
        if (b7) b7.classList.add('active');
        arCountsLoaded = false;
        arRuleCounts = {};
        arSrcId = '';
        const sse = document.getElementById('ar-src-search');
        if (sse) sse.value = '';
        fillArSrc();
        renderArTargets();
        if (typeof clDonorOpts === 'function') {
          clDonorOpts();
          clRenderTargets();
          clCountsLoaded = false;
          clCampCounts = {};
        }
        const rulesVisible = document.getElementById('pa-tab-rules').style.display !== 'none';
        if (rulesVisible) {
          arCountsLoaded = true;
          loadArCounts(accs);
        }
        var cloneVisibleEl = document.getElementById('pa-tab-clone');
        if (
          cloneVisibleEl &&
          cloneVisibleEl.style.display !== 'none' &&
          typeof clLoadCampCounts === 'function'
        ) {
          clCountsLoaded = true;
          clLoadCampCounts(accs);
        }
        rerender();
      } catch (e) {
        alert(t('err') + (e && e.message ? e.message : e));
      } finally {
        hideLoadOv();
      }
    }
