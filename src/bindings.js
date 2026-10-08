    /* ===== Bindings ===== */ document.querySelectorAll('.pa-tab').forEach(
      tb =>
        (tb.onclick = function () {
          const tab = this.dataset.tab;
          document.querySelectorAll('.pa-tab').forEach(x => x.classList.remove('active'));
          this.classList.add('active');
          document.getElementById('pa-tab-parser').style.display = tab === 'parser' ? 'flex' : 'none';
          document.getElementById('pa-tab-rules').style.display = tab === 'rules' ? 'flex' : 'none';
          var clPanel = document.getElementById('pa-tab-clone');
          if (clPanel) {
            clPanel.style.display = tab === 'clone' ? 'flex' : 'none';
            clPanel.style.flexDirection = 'column';
          }
          document.getElementById('pa-tab-rules').style.flexDirection = 'column';
          if (tab === 'rules' && !arCountsLoaded) {
            arCountsLoaded = true;
            loadArCounts(accs);
          }
          if (tab === 'clone' && typeof clLoadCampCounts === 'function' && !clCountsLoaded) {
            clCountsLoaded = true;
            clLoadCampCounts(accs);
          }
        })
    );
    document.querySelectorAll('.pa-p').forEach(
      b =>
        (b.onclick = function () {
          applyRange(this.dataset.p);
        })
    );
    const applyBtn = document.getElementById('fb-apply');
    if (applyBtn)
      applyBtn.onclick = function () {
        applyRange('custom', document.getElementById('fb-d1').value, document.getElementById('fb-d2').value);
      };
    const d7 = getRange('last_7_days');
    document.getElementById('fb-d1').value = d7.since;
    document.getElementById('fb-d2').value = d7.until;
    document.querySelectorAll('.pa-th[data-col]').forEach(th => {
      th.title = t('sort_th_title');
      th.onclick = function (e) {
        const col = this.dataset.col;
        if (e.shiftKey) {
          const ex = sortSpec.find(s => s.col === col);
          if (ex) ex.dir *= -1;
          else sortSpec.push({ col: col, dir: 1 });
        } else {
          const only = sortSpec.length === 1 && sortSpec[0].col === col ? sortSpec[0] : null;
          if (only) only.dir *= -1;
          else sortSpec = [{ col: col, dir: 1 }];
        }
        updateSortIndicators();
        rerender();
      };
    });
    document.querySelectorAll('.pa-f').forEach(
      b =>
        (b.onclick = function () {
          filter = this.dataset.f;
          document.querySelectorAll('.pa-f').forEach(x => x.classList.remove('active'));
          this.classList.add('active');
          const note = document.getElementById('pa-recalc-note');
          if (note)
            note.innerHTML =
              t('recalc_pre') +
              '<span id="fb-fl" style="color:#2dd4bf;">' +
              filterLabel() +
              '</span>' +
              t('recalc_suf');
          rerender();
        })
    );
    const sEl = document.getElementById('fb-s');
    if (sEl)
      sEl.oninput = function () {
        rerender();
      };
    const hdrCb = document.getElementById('fb-hdr-cb');
    function toggleHeader(on) {
      const vis = getVisible();
      vis.forEach(a => {
        if (on) selectedIds.add(a.id);
        else selectedIds.delete(a.id);
      });
      modal.querySelectorAll('.pa-cb[data-id]').forEach(cb => {
        cb.checked = selectedIds.has(cb.dataset.id);
      });
      updateSelUI();
    }
    if (hdrCb) {
      hdrCb.addEventListener('change', function () {
        toggleHeader(this.checked);
      });
      const hth = hdrCb.closest('th');
      if (hth && !hth._paBound) {
        hth._paBound = 1;
        hth.style.cursor = 'pointer';
        hth.addEventListener('click', function (e) {
          if (e.target.closest('input')) return;
          hdrCb.checked = !hdrCb.checked;
          hdrCb.dispatchEvent(new Event('change'));
        });
      }
    }
    const langBtn = document.getElementById('pa-lang-btn');
    if (langBtn)
      langBtn.onclick = function () {
        LANG = LANG === 'ru' ? 'en' : 'ru';
        try {
          localStorage.setItem('pa_lang', LANG);
        } catch (e) {}
        applyLang();
        if (typeof clApplyLang === 'function') clApplyLang();
      };
    const refreshBtn = document.getElementById('pa-refresh');
    if (refreshBtn)
      refreshBtn.onclick = function () {
        refreshData().then(function () {
          var ACT = [1, 3, 7, 8, 9];
          var bn = document.getElementById('pa-badge-n');
          if (bn)
            bn.textContent = accs.filter(function (a) {
              return ACT.includes(a.account_status);
            }).length;
          var bd = document.getElementById('pa-badge-dis');
          if (bd)
            bd.textContent = accs.filter(function (a) {
              return !ACT.includes(a.account_status);
            }).length;
        });
      };
    const cpBtn = document.getElementById('fb-cp');
    if (cpBtn)
      cpBtn.onclick = function () {
        const list = getExportList();
        if (!list.length) {
          alert(t('no_copy'));
          return;
        }
        navigator.clipboard.writeText(list.map(a => accountId(a.id)).join('\n')).then(() => {
          this.dataset.busy = '1';
          this.textContent = t('copied');
          this.style.background = '#37d67a';
          setTimeout(() => {
            this.dataset.busy = '0';
            this.textContent = copyLabel();
            this.style.background = '';
          }, 1500);
        });
      };
    const csvBtn = document.getElementById('fb-csv');
    if (csvBtn)
      csvBtn.onclick = function () {
        const list = getExportList();
        if (!list.length) {
          alert(t('no_csv'));
          return;
        }
        downloadCSV(list);
        this.dataset.busy = '1';
        this.textContent = t('saved');
        setTimeout(() => {
          this.dataset.busy = '0';
          this.textContent = csvLabel();
        }, 1500);
      };
    const arSrcSearchEl = document.getElementById('ar-src-search');
    if (arSrcSearchEl)
      arSrcSearchEl.oninput = function () {
        filterArSrcOpts(this.value.toLowerCase());
      };
    const arExportBtn = document.getElementById('ar-export');
    if (arExportBtn) arExportBtn.onclick = arExport;
    const arImportBtn = document.getElementById('ar-import');
    if (arImportBtn) arImportBtn.onclick = arImport;
    document.getElementById('ar-enable').onclick = function () {
      arBulk('ENABLED');
    };
    document.getElementById('ar-disable').onclick = function () {
      arBulk('DISABLED');
    };
    document.getElementById('ar-delete').onclick = function () {
      arBulk('DELETE');
    };
    document.querySelectorAll('.ar-cf').forEach(function (b) {
      b.onclick = function () {
        arSortMode = this.dataset.cf;
        document.querySelectorAll('.ar-cf').forEach(function (x) {
          x.classList.remove('active');
        });
        this.classList.add('active');
        if ((arSortMode === 'rules_first' || arSortMode === 'no_rules_first') && !arCountsLoaded) {
          arCountsLoaded = true;
          loadArCounts(accs).then(function () {
            renderArTargets();
          });
        }
        renderArTargets();
      };
    });
    function toggleArHdr(on) {
      const vis = arGetTargets();
      vis.forEach(a => {
        if (on) arSelectedTargets.add(a.id);
        else arSelectedTargets.delete(a.id);
      });
      renderArTargets();
    }
    const arHdrCb = document.getElementById('ar-hdr-cb');
    if (arHdrCb) {
      arHdrCb.addEventListener('change', function () {
        toggleArHdr(this.checked);
      });
      const arhth = arHdrCb.closest('div');
      if (arhth && !arhth._paBound) {
        arhth._paBound = 1;
        arhth.style.cursor = 'pointer';
        arhth.addEventListener('click', function (e) {
          if (e.target.closest('input')) return;
          arHdrCb.checked = !arHdrCb.checked;
          arHdrCb.dispatchEvent(new Event('change'));
        });
      }
    }
    const arSearchEl = document.getElementById('ar-search');
    if (arSearchEl)
      arSearchEl.oninput = function () {
        renderArTargets();
      };
    document.querySelectorAll('.ar-f').forEach(
      b =>
        (b.onclick = function () {
          arFilter = this.dataset.f;
          document.querySelectorAll('.ar-f').forEach(x => x.classList.remove('active'));
          this.classList.add('active');
          renderArTargets();
        })
    );
    document.getElementById('ar-expjson').onclick = arExportJson;
    document.getElementById('ar-impjson').onchange = function () {
      if (this.files && this.files[0]) arImportJson(this.files[0]);
      this.value = '';
    };
    /*__PA_CLONE_LATE__*/ function closeAll() {
      hideRecalc();
      if (modal._paStop) modal._paStop();
      modal.remove();
      bd.remove();
    }
    document.getElementById('pa-x').onclick = closeAll;
    document.getElementById('pa-close2').onclick = closeAll;
    fillArSrc();
    renderArTargets();
    bindCbs();
    updateSelUI();
    updateSortIndicators();
  }
})();
