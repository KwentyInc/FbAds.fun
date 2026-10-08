  /* CloneAds part 3/3: campaign cloning, run loop, language switch, late bindings. */
  function clCreativeSig(f) {
    if (f.feed) {
      const vids = (f.feed.videos || [])
        .map(v => String(v.video_id || ''))
        .slice()
        .sort()
        .join(',');
      const links = (f.feed.link_urls || [])
        .map(l => String(l.website_url || ''))
        .slice()
        .sort()
        .join(',');
      const locs = (f.feed.asset_customization_rules || [])
        .map(r =>
          ((r && r.customization_spec && r.customization_spec.locales) || [])
            .slice()
            .sort((a, b) => a - b)
            .join('.')
        )
        .slice()
        .sort()
        .join(',');
      return 'F|' + vids + '|' + links + '|' + locs;
    }
    return 'S|' + (f.video || '') + '|' + (f.imageHash || '') + '|' + (f.ig || '') + '|' + (f.link || '');
  }
  function clAdsSig(as) {
    return (as._ads || []).map(ad => clCreativeSig(clExtractCreative(ad.creative || {}))).join('||');
  }
  function clDraftHint() {
    clLog(
      '&nbsp;💡 ' +
        clL(
          'Открой этот кабинет в Ads Manager в соседней вкладке и запусти ещё раз — или сними галочку «' +
            t('cl_draft_mode') +
            '», чтобы создать кампанию сразу (на паузе).',
          'Open this account in Ads Manager in another tab and run again — or uncheck «' +
            t('cl_draft_mode') +
            '» to create the campaign directly (paused).'
        )
    );
  }
  async function clCloneCampaign(camp, tgt, baseMaps) {
    const useDraft = (document.getElementById('cl-draft-mode') || {}).checked;
    const userStatus = (document.getElementById('cl-status') || {}).value || 'PAUSED';
    const fpOvEl = document.getElementById('cl-fp-override');
    const fpOverride = fpOvEl && fpOvEl.value ? String(fpOvEl.value).trim() : '';
    const randPage = !!(document.getElementById('cl-rand-page') || {}).checked;
    const doDedup = !!(document.getElementById('cl-dedup-creative') || {}).checked;
    const isIgErrTxt = s =>
      /instagram|нет доступа к этому аккаунту|permissions error|1772103/i.test(String(s || ''));
    const adsets = camp._adsets || (await clFetchStructure(camp.id));
    clLog('🚀 ' + t('cl_camp') + ' «' + esc(camp.name) + '»');
    let donorPageId = '';
    for (const a of adsets) {
      if (donorPageId) break;
      for (const ad of a._ads || []) {
        const oss = ad.creative && ad.creative.object_story_spec;
        if (oss && typeof oss === 'object' && oss.page_id) {
          donorPageId = oss.page_id;
          break;
        }
      }
    }
    const donorPage = await clResolvePage(tgt, donorPageId, fpOverride);
    let page = donorPage;
    let isRand = false;
    if (randPage) {
      const f0 =
        adsets[0] && adsets[0]._ads && adsets[0]._ads[0]
          ? clExtractCreative(adsets[0]._ads[0].creative || {})
          : null;
      if (!(f0 && !f0.feed)) {
        clLog(
          '&nbsp;⚠ ' +
            clL(
              'Рандом Fan page не применяется к мультиязычным креативам — оставляю страницу донора',
              'Random Fan page does not apply to multilingual creatives — keeping the donor page'
            )
        );
      } else if (baseMaps._randFail) {
        clLog(
          '&nbsp;⚠ ' +
            clL(
              'Случайная страница в этом кабинете уже не прошла проверку Instagram — беру страницу донора',
              'The random page already failed the Instagram check in this account — using the donor page'
            )
        );
      } else {
        let rp = baseMaps._randPage || null;
        if (!rp) {
          const pageList = await clGetPageList(tgt);
          if (pageList && pageList.length) {
            rp = pageList[Math.floor(Math.random() * pageList.length)];
            baseMaps._randPage = rp;
          }
        }
        if (!rp) {
          clLog(
            '&nbsp;⚠ ' +
              clL(
                'В кабинете нет доступных страниц для рандома — беру страницу донора',
                'No pages available for random selection — using the donor page'
              )
          );
        } else if (donorPage && String(rp.id) === String(donorPage.id)) {
          clLog(
            '&nbsp;🎲 ' +
              clL('Случайная страница совпала с донорской: «', 'Random page matches the donor page: «') +
              esc(rp.name) +
              '»'
          );
        } else {
          const rig = await clGetInstagramActor(tgt, rp.id, true);
          if (!rig && donorPage) {
            baseMaps._randFail = true;
            clLog(
              '&nbsp;⚠ ' +
                clL(
                  'У случайной страницы «' +
                    esc(rp.name) +
                    '» нет Instagram — беру страницу донора «' +
                    esc(donorPage.name) +
                    '»',
                  'Random page «' +
                    esc(rp.name) +
                    '» has no Instagram — using donor page «' +
                    esc(donorPage.name) +
                    '»'
                )
            );
          } else {
            page = rp;
            isRand = true;
            clLog(
              '&nbsp;🎲 ' +
                clL('Случайная Fan page (одна на кабинет): «', 'Random Fan page (one per account): «') +
                esc(rp.name) +
                '»'
            );
          }
        }
      }
    }
    const ig = await clGetInstagramActor(tgt, page ? page.id : null, isRand);
    if (ig) clLog('&nbsp;📷 ' + t('cl_ig') + ': ' + esc(ig.username || ig.id));
    else clLog('&nbsp;⚠ ' + t('cl_ig') + ' ' + t('cl_ig_no'));
    const maps = Object.assign({}, baseMaps, {
      page: page,
      ig: ig,
      _objective: camp.objective,
      pixelMap: {},
      _paused: useDraft,
      _isRand: isRand
    });
    const creativePool = {};
    const crKey = ad => {
      const nm = String((ad && ad.name) || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
      return (
        String((maps.page && maps.page.id) || '') +
        '|' +
        (nm || 'sig:' + clCreativeSig(clExtractCreative((ad && ad.creative) || {})))
      );
    };
    const toDonor = async why => {
      if (!maps._isRand || !donorPage) return false;
      clLog(
        '&nbsp;&nbsp;🔄 ' +
          clL(
            'Meta не приняла Instagram случайной страницы — переключаюсь на страницу донора «',
            'Meta rejected the random page Instagram — switching to donor page «'
          ) +
          esc(donorPage.name) +
          '»'
      );
      clLogDbg(esc(String(why || '').slice(0, 160)));
      maps.page = donorPage;
      page = donorPage;
      maps._isRand = false;
      baseMaps._randFail = true;
      maps.ig = await clGetInstagramActor(tgt, donorPage.id, false);
      if (maps.ig) clLog('&nbsp;&nbsp;📷 ' + t('cl_ig') + ': ' + esc(maps.ig.username || maps.ig.id));
      return true;
    };
    const reuseTag = () =>
      ' <span style="color:var(--teal)">(' + clL('креатив переиспользован', 'creative reused') + ')</span>';
    const pixelLog = (as, px) => {
      if (!(as._promoted && as._promoted.pixel_id)) return;
      if (px) clLog('&nbsp;&nbsp;🎯 ' + t('cl_pixel') + ': «' + esc(px.name || px.id) + '»');
      else
        clLog(
          '&nbsp;&nbsp;⚠ ' +
            clL('Пиксель донора не найден в этом кабинете', 'Donor pixel not found in this account') +
            (as._pixelName ? ' («' + esc(as._pixelName) + '»)' : '')
        );
    };
    if (useDraft) {
      let draftId = baseMaps._draftId || null;
      if (!draftId) {
        clLog('&nbsp;📝 ' + clL('Готовлю черновик в кабинете…', 'Preparing a draft in the account…'));
        const dr = await clEnsureDraft(tgt);
        if (!dr.id) {
          clLog('&nbsp;✗ ' + clL('Черновик не создан: ', 'Draft not created: ') + esc(dr.err));
          clDraftHint();
          return {
            c: 0,
            a: 0,
            ad: 0,
            erAds: 0,
            skipped: true,
            lastErr: clL('черновик не создан: ', 'draft not created: ') + dr.err
          };
        }
        draftId = dr.id;
        baseMaps._draftId = draftId;
        if (!baseMaps._draftCleared) {
          baseMaps._draftCleared = true;
          const cleared = await clClearDraftFragments(tgt);
          if (cleared)
            clLog(
              '&nbsp;🧹 ' + clL('Удалено старых элементов черновика: ', 'Old draft items removed: ') + cleared
            );
        }
        clLog(
          '&nbsp;✓ ' +
            clL('Черновик готов', 'Draft ready') +
            ' <span style="color:var(--mut)">· ID ' +
            esc(draftId) +
            '</span>'
        );
      }
      let campDraftId;
      const campName = clBuildName(camp.name, tgt, { lvl: 'camp', camp: camp, page: maps.page });
      try {
        campDraftId = await clCreateCampaignDraft(tgt, draftId, {
          name: campName,
          objective: camp.objective,
          daily_budget: clRandBudget() || camp.daily_budget,
          bid_strategy: camp.bid_strategy,
          buying_type: camp.buying_type,
          special_ad_categories: camp.special_ad_categories || []
        });
        clLog(
          '&nbsp;✓ ' +
            t('cl_camp') +
            ' «' +
            esc(campName) +
            '» ' +
            clL('добавлена в черновик', 'added to the draft')
        );
      } catch (e) {
        clLog(
          '&nbsp;✗ ' +
            t('cl_camp') +
            ' «' +
            esc(campName) +
            '» ' +
            clL('не добавлена в черновик: ', 'not added to the draft: ') +
            esc(clErr(e))
        );
        return { c: 0, a: 0, ad: 0, erAds: 0, lastErr: clErr(e) };
      }
      let okA = 0,
        okAd = 0,
        erAds = 0;
      for (let ai = 0; ai < adsets.length; ai++) {
        const as = adsets[ai];
        if (clAbort) break;
        const px = as._promoted && as._promoted.pixel_id ? await clResolvePixel(tgt, as._pixelName) : null;
        if (px && as._promoted) maps.pixelMap[as._promoted.pixel_id] = px.id;
        pixelLog(as, px);
        let adsetDraftId;
        const asName = clBuildName(as.name, tgt, {
          lvl: 'adset',
          camp: camp,
          as: as,
          i: ai,
          page: maps.page
        });
        try {
          const draftPo = Object.assign({}, as._promoted || {});
          if (maps.page && maps.page.id) draftPo.page_id = maps.page.id;
          adsetDraftId = await clCreateAdsetDraft(
            tgt,
            draftId,
            campDraftId,
            {
              name: asName,
              optimization_goal: as.optimization_goal,
              billing_event: as.billing_event,
              daily_budget: clRandBudget() || as.daily_budget,
              targeting: clCleanTargeting(as.targeting),
              promoted_object: draftPo,
              attribution_spec: as.attribution_spec
            },
            maps.pixelMap
          );
        } catch (e) {
          clLog(
            '&nbsp;&nbsp;✗ ' +
              t('cl_adset') +
              ' «' +
              esc(asName) +
              '» ' +
              clL('не добавлен в черновик: ', 'not added to the draft: ') +
              esc(clErr(e))
          );
          continue;
        }
        okA++;
        clLog(
          '&nbsp;&nbsp;✓ ' +
            t('cl_adset') +
            ' «' +
            esc(asName) +
            '» ' +
            clL('добавлен в черновик', 'added to the draft')
        );
        const adsArr = as._ads || [];
        for (let di = 0; di < adsArr.length; di++) {
          const ad = adsArr[di];
          if (clAbort) break;
          maps._nctx = { camp: camp, as: as, ad: ad, i: di };
          const adName = clBuildName(ad.name || 'ad', tgt, {
            lvl: 'ad',
            camp: camp,
            as: as,
            ad: ad,
            i: di,
            page: maps.page
          });
          try {
            let ref = doDedup ? creativePool[crKey(ad)] || null : null;
            const isReuse = !!ref;
            if (!ref) {
              const f = clExtractCreative(ad.creative || {});
              try {
                ref = await clMakeCreativeRef(tgt, ad, f, maps.page, maps.ig, maps);
              } catch (e1) {
                if (isIgErrTxt(e1 && e1.message) && (await toDonor(e1 && e1.message))) {
                  ref = await clMakeCreativeRef(tgt, ad, f, maps.page, maps.ig, maps);
                } else throw e1;
              }
              if (ref && doDedup) creativePool[crKey(ad)] = ref;
            }
            if (!ref) {
              erAds++;
              clLog(
                '&nbsp;&nbsp;&nbsp;&nbsp;✗ ' +
                  t('cl_ad') +
                  ' «' +
                  esc(adName) +
                  '»: ' +
                  clL('у донора нет данных для креатива', 'the donor has no creative data')
              );
              continue;
            }
            await clAddAdDraftSmart(
              tgt,
              draftId,
              campDraftId,
              adsetDraftId,
              Object.assign({}, ad, { name: adName }),
              ref
            );
            okAd++;
            clLog(
              '&nbsp;&nbsp;&nbsp;&nbsp;✓ ' +
                t('cl_ad') +
                ' «' +
                esc(adName) +
                '» ' +
                clL('добавлено в черновик', 'added to the draft') +
                (isReuse ? reuseTag() : '')
            );
          } catch (e2) {
            erAds++;
            clLog(
              '&nbsp;&nbsp;&nbsp;&nbsp;✗ ' +
                t('cl_ad') +
                ' «' +
                esc(adName) +
                '» ' +
                clL('не добавлено: ', 'not added: ') +
                esc(clErr(e2))
            );
          }
        }
      }
      const v = await clVerifyDraft(tgt, draftId);
      if (!v.found || !v.frags.length) {
        const why = v.err || clL('Meta не сохранила элементы черновика', 'Meta did not save the draft items');
        clLog('&nbsp;✗ ' + clL('Черновик не сохранился: ', 'Draft was not saved: ') + esc(why));
        clDraftHint();
        baseMaps._draftId = null;
        return {
          c: 0,
          a: okA,
          ad: 0,
          erAds: erAds + okAd,
          skipped: true,
          lastErr: clL('черновик не сохранился: ', 'draft not saved: ') + why
        };
      }
      const cnt = k => v.frags.filter(f => String(f.ad_object_type || '') === k).length;
      const invalid = v.frags.filter(
        f =>
          f.validation_status === 'HAS_ERRORS' ||
          (Array.isArray(f.active_errors) && f.active_errors.length) ||
          f.publish_error
      );
      const typeTxt = k => ({ campaign: t('cl_camp'), ad_set: t('cl_adset'), ad: t('cl_ad') })[k] || k;
      if (invalid.length) {
        clLog(
          '&nbsp;⚠ ' +
            clL('В черновике есть ошибки (', 'The draft has errors (') +
            invalid.length +
            clL(
              ') — Meta не даст опубликовать, пока их не исправить:',
              ') — Meta will not publish until they are fixed:'
            )
        );
        invalid.forEach(f => {
          const errs = (Array.isArray(f.active_errors) ? f.active_errors : [])
            .map(e => (e && (e.error_message || e.message)) || JSON.stringify(e))
            .join('; ');
          clLog(
            '&nbsp;&nbsp;&nbsp;✗ ' +
              esc(typeTxt(String(f.ad_object_type || ''))) +
              ': ' +
              esc(errs || f.publish_error || f.validation_status)
          );
        });
      }
      if (!v.visible)
        clLog(
          '&nbsp;⚠ ' +
            clL(
              'Черновик создан, но Ads Manager может его не показать. Если не видишь его — запусти ещё раз с открытой вкладкой Ads Manager.',
              'The draft was created, but Ads Manager may not show it. If you do not see it, run again with Ads Manager open.'
            )
        );
      clLog(
        '&nbsp;📋 ' +
          clL('Черновик сохранён: ', 'Draft saved: ') +
          cnt('campaign') +
          ' ' +
          clL('камп.', 'camp.') +
          ' · ' +
          cnt('ad_set') +
          ' ' +
          clL('адсет.', 'ad sets') +
          ' · ' +
          cnt('ad') +
          ' ' +
          clL('объявл.', 'ads') +
          '. <a href="' +
          clAmUrl(tgt) +
          '" target="_blank" class="pa-link">' +
          clL('Открыть Ads Manager', 'Open Ads Manager') +
          '</a> — ' +
          clL('проверь и нажми «Опубликовать».', 'review and click «Publish».'),
        'ok'
      );
      const noAdsD = okAd === 0 && erAds > 0;
      return {
        c: 1,
        a: okA,
        ad: okAd,
        erAds: erAds,
        skipped: false,
        noAds: noAdsD,
        lastErr: noAdsD ? clL('ни одно объявление не добавлено', 'no ads were added') : ''
      };
    }
    const st = userStatus;
    const campName = clBuildName(camp.name, tgt, { lvl: 'camp', camp: camp, page: maps.page });
    const body = {
      name: campName,
      objective: camp.objective,
      status: st,
      special_ad_categories: camp.special_ad_categories || [],
      buying_type: camp.buying_type || 'AUCTION'
    };
    if (camp.bid_strategy) body.bid_strategy = camp.bid_strategy;
    const isCBO = camp.daily_budget && parseFloat(camp.daily_budget) > 0;
    if (isCBO) body.daily_budget = clRandBudget() || camp.daily_budget;
    if (!isCBO) body.is_adset_budget_sharing_enabled = camp.is_adset_budget_sharing_enabled === true;
    let cRes;
    try {
      cRes = await clPost(tgt + '/campaigns', body);
    } catch (netE) {
      cRes = { error: { code: 0, message: String((netE && netE.message) || netE) || 'network' } };
    }
    if (cRes.error) {
      if (isAccountBlockErr(cRes.error)) {
        clLog('&nbsp;⛔ ' + clL('Кабинет недоступен: ', 'Account unavailable: ') + esc(clErr(cRes.error)));
        return { c: 0, a: 0, ad: 0, erAds: 0, skipped: true, lastErr: clErr(cRes.error) };
      }
      clLog(
        '&nbsp;✗ ' +
          t('cl_camp') +
          ' «' +
          esc(campName) +
          '» ' +
          clL('не создана: ', 'not created: ') +
          esc(clErr(cRes.error))
      );
      return { c: 0, a: 0, ad: 0, erAds: 0, lastErr: clErr(cRes.error) };
    }
    const newCampId = cRes.id;
    clLog(
      '&nbsp;✓ ' +
        t('cl_camp') +
        ' «' +
        esc(campName) +
        '» ' +
        clL('создана', 'created') +
        ' <span style="color:var(--mut)">· ID ' +
        esc(newCampId) +
        '</span>'
    );
    let okA = 0,
      okAd = 0,
      erAds = 0,
      campSkipped = false,
      campLastErr = '';
    for (let ai = 0; ai < adsets.length; ai++) {
      const as = adsets[ai];
      if (clAbort) break;
      const asName = clBuildName(as.name, tgt, { lvl: 'adset', camp: camp, as: as, i: ai, page: maps.page });
      let asRes;
      try {
        const asBody = {
          name: asName,
          campaign_id: newCampId,
          billing_event: as.billing_event || 'IMPRESSIONS',
          optimization_goal: as.optimization_goal || 'OFFSITE_CONVERSIONS',
          targeting: clCleanTargeting(as.targeting),
          status: 'ACTIVE'
        };
        if (!isCBO) asBody.daily_budget = clRandBudget() || as.daily_budget || 1000;
        if (as.attribution_spec) asBody.attribution_spec = as.attribution_spec;
        if (as.bid_strategy) asBody.bid_strategy = as.bid_strategy;
        if (as.bid_amount) asBody.bid_amount = as.bid_amount;
        if (as.bid_constraints) asBody.bid_constraints = as.bid_constraints;
        asBody.multi_advertiser_ads_enabled = !!as.multi_advertiser_ads_enabled;
        if (!(
          as.targeting &&
          as.targeting.targeting_automation &&
          as.targeting.targeting_automation.advantage_audience
        )) {
          asBody.targeting = Object.assign({}, asBody.targeting, {
            targeting_automation: { advantage_audience: 0 }
          });
        }
        if (as._x) for (const k in as._x) asBody[k] = as._x[k];
        {
          const po = {};
          if (maps.page && maps.page.id) po.page_id = maps.page.id;
          if (as._promoted && as._promoted.pixel_id) {
            const px2 = await clResolvePixel(tgt, as._pixelName);
            if (px2) {
              maps.pixelMap[as._promoted.pixel_id] = px2.id;
              po.pixel_id = px2.id;
              if (as._promoted.custom_event_type) po.custom_event_type = as._promoted.custom_event_type;
            }
            pixelLog(as, px2);
          }
          if (Object.keys(po).length) asBody.promoted_object = po;
        }
        asRes = await clPostRetry(tgt + '/adsets', asBody);
      } catch (netE) {
        asRes = { error: { code: 0, message: String((netE && netE.message) || netE) || 'network' } };
      }
      if (asRes.error) {
        if (isAccountBlockErr(asRes.error)) {
          campSkipped = true;
          campLastErr = clErr(asRes.error);
          clLog('&nbsp;&nbsp;⛔ ' + clL('Кабинет недоступен: ', 'Account unavailable: ') + esc(campLastErr));
          break;
        }
        clLog(
          '&nbsp;&nbsp;✗ ' +
            t('cl_adset') +
            ' «' +
            esc(asName) +
            '» ' +
            clL('не создан: ', 'not created: ') +
            esc(clErr(asRes.error))
        );
        continue;
      }
      okA++;
      clLog(
        '&nbsp;&nbsp;✓ ' +
          t('cl_adset') +
          ' «' +
          esc(asName) +
          '» ' +
          clL('создан', 'created') +
          ' <span style="color:var(--mut)">· ID ' +
          esc(asRes.id) +
          '</span>'
      );
      clCurIds = [];
      const adsArr = as._ads || [];
      for (let di = 0; di < adsArr.length; di++) {
        const ad = adsArr[di];
        if (clAbort) break;
        maps._nctx = { camp: camp, as: as, ad: ad, i: di };
        const hit = doDedup ? creativePool[crKey(ad)] || null : null;
        if (hit) {
          const nm = clBuildName(ad.name || 'ad', tgt, {
            lvl: 'ad',
            camp: camp,
            as: as,
            ad: ad,
            i: di,
            page: maps.page
          });
          let adRes;
          try {
            adRes = await clPostRetry(tgt + '/ads', {
              name: nm,
              adset_id: asRes.id,
              creative: { creative_id: hit },
              status: 'ACTIVE'
            });
          } catch (netE) {
            adRes = { error: { code: 0, message: String((netE && netE.message) || netE) || 'network' } };
          }
          if (adRes && !adRes.error) {
            okAd++;
            clLog(
              '&nbsp;&nbsp;&nbsp;&nbsp;✓ ' +
                t('cl_ad') +
                ' «' +
                esc(nm) +
                '» ' +
                clL('создано', 'created') +
                reuseTag() +
                ' <span style="color:var(--mut)">· ID ' +
                esc(adRes.id) +
                '</span>'
            );
            continue;
          }
          if (adRes && adRes.error && isAccountBlockErr(adRes.error)) {
            campSkipped = true;
            campLastErr = clErr(adRes.error);
            erAds++;
            clLog(
              '&nbsp;&nbsp;&nbsp;&nbsp;⛔ ' +
                clL('Кабинет недоступен: ', 'Account unavailable: ') +
                esc(campLastErr)
            );
            break;
          }
          clLog(
            '&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:var(--amber)">⤷ «' +
              esc(nm) +
              '»: ' +
              clL(
                'общий креатив не подошёл — создаю отдельный',
                'shared creative did not fit — creating a separate one'
              ) +
              '</span>'
          );
          clLogDbg(esc(adRes ? clErr(adRes.error) : 'net'));
          delete creativePool[crKey(ad)];
        }
        let r;
        maps._lastCrId = null;
        try {
          r = await clCloneAd(ad, asRes.id, tgt, maps);
        } catch (netE) {
          r = { ok: false, lastErr: String((netE && netE.message) || netE) };
        }
        if (r && r !== true && !r.skipAccount && isIgErrTxt(r.lastErr) && (await toDonor(r.lastErr))) {
          maps._lastCrId = null;
          try {
            r = await clCloneAd(ad, asRes.id, tgt, maps);
          } catch (netE) {
            r = { ok: false, lastErr: String((netE && netE.message) || netE) };
          }
        }
        if (r && r.skipAccount) {
          campSkipped = true;
          campLastErr = r.lastErr || campLastErr;
          erAds++;
          clLog(
            '&nbsp;&nbsp;&nbsp;&nbsp;⛔ ' +
              clL('Кабинет недоступен: ', 'Account unavailable: ') +
              esc(campLastErr)
          );
          break;
        }
        if (r === true) {
          okAd++;
          if (doDedup && maps._lastCrId) creativePool[crKey(ad)] = maps._lastCrId;
        } else {
          erAds++;
          if (r && r.lastErr) campLastErr = r.lastErr;
        }
      }
      if (campSkipped) break;
    }
    const noAds = okAd === 0 && erAds > 0;
    if (noAds) campLastErr = campLastErr || clL('ни одно объявление не создано', 'no ads were created');
    return {
      c: 1,
      a: okA,
      ad: okAd,
      erAds: erAds,
      skipped: campSkipped,
      noAds: noAds,
      lastErr: noAds ? campLastErr : campSkipped ? campLastErr : ''
    };
  }
  async function clFetchStructure(campId) {
    const tk = encodeURIComponent(token);
    const as = await fetchJson(
      `${CL_GRAPH}${campId}/adsets?fields=id,name,status,billing_event,optimization_goal,daily_budget,bid_strategy,bid_amount,bid_constraints,targeting,attribution_spec,promoted_object,multi_advertiser_ads_enabled,start_time,end_time&limit=200&access_token=${tk}`
    );
    const adsets = as.data || [];
    const CRE_FULL =
      'id,image_hash,thumbnail_url,object_story_spec,asset_feed_spec,object_type,url_tags,product_set_id,template_url_spec,use_page_actor_override,actor_id,object_id,call_to_action_type,branded_content_sponsor_page_id';
    const CRE_MIN = 'id,image_hash,thumbnail_url,object_story_spec,asset_feed_spec,object_type,url_tags';
    for (const a of adsets) {
      a._promoted = a.promoted_object || null;
      if (a._promoted && a._promoted.pixel_id) {
        a._pixelName = await clDonorPixelName(a._promoted.pixel_id);
      } else {
        a._pixelName = '';
      }
      try {
        const ads = await fetchJson(
          `${CL_GRAPH}${a.id}/ads?fields=id,name,status,creative{${CRE_FULL}}&limit=200&access_token=${tk}`
        );
        a._ads = ads.data || [];
      } catch (e) {
        try {
          const ads2 = await fetchJson(
            `${CL_GRAPH}${a.id}/ads?fields=id,name,status,creative{${CRE_MIN}}&limit=200&access_token=${tk}`
          );
          a._ads = ads2.data || [];
        } catch (e2) {
          a._ads = [];
        }
      }
      const XTRA = [
        'targeting_optimization_types',
        'multi_advertiser_ads_enabled',
        'use_displayed_link',
        'dsa_beneficiary',
        'dsa_payor'
      ];
      a._x = {};
      for (const k of XTRA) {
        try {
          const ex = await fetchJson(`${CL_GRAPH}${a.id}?fields=${k}&access_token=${tk}`);
          if (ex && ex[k] !== undefined) a._x[k] = ex[k];
        } catch (e) {}
      }
    }
    return adsets;
  }
  async function clRun() {
    const selCamps = clCampaigns.filter(c => c.selected);
    const tgts = [...clSelectedTargets];
    if (!selCamps.length) {
      alert(t('cl_select_camps'));
      return;
    }
    if (!tgts.length) {
      alert(t('cl_select_tgt'));
      return;
    }
    if (!confirm(t('cl_confirm').replace('{n}', selCamps.length).replace('{m}', tgts.length))) return;
    const btn = document.getElementById('cl-run');
    const stopBtn = document.getElementById('cl-stop');
    const runLbl = document.getElementById('cl-running-lbl');
    const resetBtn = document.getElementById('cl-reset-prog');
    clAbort = false;
    if (btn) btn.disabled = true;
    if (resetBtn) resetBtn.disabled = true;
    if (stopBtn) {
      stopBtn.disabled = false;
      stopBtn.textContent = t('cl_stop');
    }
    if (runLbl) runLbl.style.display = '';
    let tc = 0,
      ta = 0,
      tad = 0,
      er = 0;
    try {
      clLog(
        '📥 ' +
          clL(
            'Читаю структуру донора (один раз для всех кабинетов)…',
            'Reading the donor structure (once for all accounts)…'
          )
      );
      for (const camp of selCamps) {
        if (clAbort) break;
        if (!camp._adsets) {
          try {
            camp._adsets = await clFetchStructure(camp.id);
            clLog(
              '&nbsp;✓ «' + esc(camp.name) + '»: ' + clL('адсетов', 'ad sets') + ' ' + camp._adsets.length
            );
          } catch (e) {
            camp._adsets = [];
            clLog('&nbsp;✗ «' + esc(camp.name) + '»: ' + esc(e.message));
          }
        }
      }
      for (const tgt of tgts) {
        if (clAbort) break;
        const tgtAcc = accs.find(a => a.id === tgt);
        clLog(
          '━━━ ' + esc(accountId(tgt)) + (tgtAcc && tgtAcc.name ? ' · ' + esc(tgtAcc.name) : '') + ' ━━━'
        );
        const tst = tgtAcc ? tgtAcc.account_status : 0;
        if (![1, 3, 7, 8, 9].includes(tst)) {
          clLog(
            '&nbsp;⚠ ' +
              clL(
                'Кабинет в статусе «' +
                  esc(stM[tst] ? stM[tst].t : tst) +
                  '» — Meta может отклонять создание',
                'Account status is «' + esc(stM[tst] ? stM[tst].t : tst) + '» — Meta may reject creation'
              )
          );
        }
        let tgtSkipped = false,
          tgtCampOk = 0,
          tgtDoneSkip = 0,
          tgtLastErr = '';
        const baseMaps = {};
        for (const camp of selCamps) {
          if (clAbort) break;
          const pairKey = tgt + '::' + camp.id;
          if (donePairs.has(pairKey)) {
            tgtDoneSkip++;
            clLog('&nbsp;· «' + esc(camp.name) + '» — ' + t('cl_skip_done'));
            continue;
          }
          let r;
          try {
            r = await clCloneCampaign(camp, tgt, baseMaps);
          } catch (netE) {
            r = { c: 0, a: 0, ad: 0, erAds: 0, lastErr: String((netE && netE.message) || netE) };
            clLog('&nbsp;✗ ' + esc(r.lastErr));
          }
          tc += r.c;
          ta += r.a;
          tad += r.ad;
          er += r.erAds || 0;
          if (r.lastErr) tgtLastErr = r.lastErr;
          if (r.c > 0) {
            tgtCampOk += r.c;
            if (!r.noAds) donePairs.add(pairKey);
          }
          if (r.skipped || r.noAds) {
            tgtSkipped = true;
            if (r.lastErr) failReason[tgt] = r.lastErr;
          }
        }
        if (clAbort) break;
        if (tgtSkipped) {
          failedAccounts.add(tgt);
          okAccounts.delete(tgt);
        } else if (tgtCampOk > 0) {
          okAccounts.add(tgt);
          failedAccounts.delete(tgt);
          delete failReason[tgt];
        } else if (tgtDoneSkip > 0) {
          okAccounts.add(tgt);
        } else {
          failedAccounts.add(tgt);
          if (!failReason[tgt])
            failReason[tgt] =
              tgtLastErr || clL('ни одна кампания/объявление не созданы', 'no campaign/ad created');
        }
        updateCopyRow();
        clLog(
          '━━━ ' +
            esc(accountId(tgt)) +
            ' → ' +
            (tgtSkipped
              ? t('cl_res_skip')
              : tgtCampOk > 0
                ? t('cl_res_ok')
                : tgtDoneSkip > 0
                  ? t('cl_res_prev')
                  : t('cl_res_none')) +
            ' ━━━'
        );
      }
      clLog(
        '━━━ ' +
          (clAbort ? '⏹ ' + clL('Остановлено', 'Stopped') : t('cl_done')) +
          ': ' +
          t('cl_camp') +
          ' ✓' +
          tc +
          ' · ' +
          t('cl_adset') +
          ' ✓' +
          ta +
          ' · ' +
          t('cl_ad') +
          ' ✓' +
          tad +
          ' · ' +
          t('cl_errors') +
          ' ✗' +
          er +
          ' ━━━',
        clAbort ? 'warn' : 'done'
      );
    } finally {
      if (btn) btn.disabled = false;
      if (resetBtn) resetBtn.disabled = false;
      if (stopBtn) {
        stopBtn.disabled = true;
        stopBtn.textContent = t('cl_stop');
      }
      if (runLbl) runLbl.style.display = 'none';
      updateCopyRow();
    }
  }
  function clApplyLang() {
    const map = {
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
      'cl-running-lbl': 'cl_running',
      'cl-copyrow-lbl': 'cl_copyrow_lbl',
      'cl-reset-prog': 'cl_reset_prog',
      'cl-draft-lbl': 'cl_draft_mode'
    };
    for (const id in map) {
      const el = document.getElementById(id);
      if (el) el.textContent = t(map[id]);
    }
    const xmap = {
      'cl-fp-lbl': 'fp_lbl',
      'cl-rand-budget-lbl': 'rand_budget',
      'cl-rand-page-lbl': 'rand_page',
      'cl-dedup-lbl': 'dedup',
      'cl-tpl-camp-lbl': 'tpl_camp',
      'cl-tpl-adset-lbl': 'tpl_adset',
      'cl-tpl-ad-lbl': 'tpl_ad',
      'cl-tpl-hint': 'tpl_hint'
    };
    for (const id in xmap) {
      const el = document.getElementById(id);
      if (el) el.textContent = clT(xmap[id]);
    }
    const sb = document.getElementById('cl-stop');
    if (sb && sb.disabled) sb.textContent = t('cl_stop');
    const dl = document.getElementById('cl-dedup-lbl');
    if (dl) dl.title = clT('dedup_tip');
    const fp = document.getElementById('cl-fp-override');
    if (fp) fp.placeholder = clT('fp_ph');
    const hc = document.getElementById('cl-hdr-cb');
    if (hc) hc.title = clT('all_visible');
    document.querySelectorAll('.cl-mc').forEach(function (el) {
      const m = CL_MACROS.find(x => '{' + x[0] + '}' === el.getAttribute('data-m'));
      if (m) el.title = clL(m[1], m[2]);
    });
    document.querySelectorAll('.cl-f').forEach(function (b) {
      var k = { all: 'all', active: 'active', disabled: 'disabled' }[b.dataset.f];
      if (k) b.textContent = t(k);
    });
    document.querySelectorAll('.cl-cf').forEach(function (b) {
      var cf = b.dataset.cf;
      b.textContent = clT(cf === 'all' ? 'sort_all' : cf === 'camps_first' ? 'sort_with' : 'sort_without');
    });
    document.querySelectorAll('#pa-tab-clone .cl-rc').forEach(function (el) {
      el.title = clT('camps_in_acc');
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
      if (nm.options[3]) nm.options[3].textContent = clT('nm_tpl');
    }
    var cf = document.getElementById('cl-find');
    if (cf) cf.placeholder = t('cl_find');
    var cr = document.getElementById('cl-repl');
    if (cr) cr.placeholder = t('cl_repl');
    if (!clCampaigns.length) {
      var b = document.getElementById('cl-camps');
      if (b) b.innerHTML = '<div class="pa-empty" style="padding:20px;">' + t('cl_no_camps') + '</div>';
    }
    paintVisibleClCounts();
    updateCopyRow();
  }
  function flashCopyBtn(btn) {
    if (!btn) return;
    var o = btn.textContent;
    btn.textContent = t('copied');
    btn.style.opacity = '1';
    setTimeout(function () {
      btn.textContent = o;
      updateCopyRow();
    }, 1300);
  }
  function updateCopyRow() {
    var row = document.getElementById('cl-copyrow');
    if (!row) return;
    var ok = [...okAccounts],
      fail = [...failedAccounts];
    row.style.display = ok.length || fail.length ? 'flex' : 'none';
    var bok = document.getElementById('cl-copy-ok'),
      bfail = document.getElementById('cl-copy-fail');
    if (bok) {
      bok.textContent = t('cl_copy_ok') + ok.length + ')';
      bok.disabled = !ok.length;
    }
    if (bfail) {
      bfail.textContent = t('cl_copy_fail') + fail.length + ')';
      bfail.disabled = !fail.length;
    }
  }
  function fallbackCopyTxt(txt) {
    var ta = document.createElement('textarea');
    ta.value = txt;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch (e) {}
    ta.remove();
  }
  function clCopyIds(btn, txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(txt)
        .then(function () {
          flashCopyBtn(btn);
        })
        .catch(function () {
          fallbackCopyTxt(txt);
          flashCopyBtn(btn);
        });
    } else {
      fallbackCopyTxt(txt);
      flashCopyBtn(btn);
    }
  }
  /*__SECTION_LATE__*/

  document.getElementById('cl-load').onclick = clLoadCampaigns;
  document.getElementById('cl-run').onclick = clRun;
  document.getElementById('cl-stop').onclick = function () {
    if (this.disabled) return;
    clAbort = true;
    this.disabled = true;
    this.textContent = clT('stopping');
    clLog('&nbsp;⏹ ' + clL('Останавливаю после текущего шага…', 'Stopping after the current step…'), 'warn');
  };
  document.getElementById('cl-expstruct').onclick = clExportStructure;
  document.getElementById('cl-impstruct').onchange = function () {
    if (this.files && this.files[0]) clImportStructure(this.files[0]);
    this.value = '';
  };
  document.querySelectorAll('.cl-cf').forEach(function (b) {
    b.onclick = function () {
      clSortMode = this.dataset.cf;
      document.querySelectorAll('.cl-cf').forEach(function (x) {
        x.classList.remove('active');
      });
      this.classList.add('active');
      if ((clSortMode === 'camps_first' || clSortMode === 'no_camps_first') && !clCountsLoaded) {
        clCountsLoaded = true;
        clLoadCampCounts(accs).then(function () {
          clRenderTargets();
        });
      } else {
        clRenderTargets();
      }
    };
  });
  var clCopyOkBtn = document.getElementById('cl-copy-ok');
  if (clCopyOkBtn)
    clCopyOkBtn.onclick = function () {
      var ids = [...okAccounts];
      if (!ids.length) return;
      clCopyIds(clCopyOkBtn, ids.map(accountId).join('\n'));
    };
  var clCopyFailBtn = document.getElementById('cl-copy-fail');
  if (clCopyFailBtn)
    clCopyFailBtn.onclick = function () {
      var ids = [...failedAccounts];
      if (!ids.length) return;
      clCopyIds(
        clCopyFailBtn,
        ids
          .map(function (id) {
            return accountId(id) + ' — ' + (failReason[id] || '?');
          })
          .join('\n')
      );
    };
  var clResetProgBtn = document.getElementById('cl-reset-prog');
  if (clResetProgBtn)
    clResetProgBtn.onclick = function () {
      donePairs.clear();
      okAccounts.clear();
      failedAccounts.clear();
      failReason = {};
      updateCopyRow();
      clLog(
        '↺ ' +
          clL(
            'Прогресс сброшен — уже выполненные кабинеты будут обработаны заново',
            'Progress reset — completed accounts will be processed again'
          ),
        'warn'
      );
    };
  document.getElementById('cl-donor-search').oninput = function () {
    const q = this.value.toLowerCase();
    document.querySelectorAll('#cl-donor-list .ar-src-opt').forEach(o => {
      const a = accs.find(x => x.id === o.dataset.id);
      const hay = (
        o.dataset.id +
        ' ' +
        (a ? a.name : '') +
        ' ' +
        (a && a.accessibleBM ? a.accessibleBM.name : '')
      ).toLowerCase();
      o.style.display = !q || hay.indexOf(q) >= 0 ? 'flex' : 'none';
    });
  };
  document.getElementById('cl-search').oninput = function () {
    clRenderTargets();
  };
  document.getElementById('cl-naming').onchange = function () {
    clNameMode = this.value;
    document.getElementById('cl-fr-row').style.display = clNameMode === 'findrep' ? 'flex' : 'none';
    const tr = document.getElementById('cl-tpl-row');
    if (tr) tr.style.display = clNameMode === 'template' ? 'flex' : 'none';
    clTplSave();
  };
  (function () {
    if (!document.getElementById('cl-mc-style')) {
      const s = document.createElement('style');
      s.id = 'cl-mc-style';
      s.textContent =
        '.cl-mc{font-family:ui-monospace,monospace;font-size:10px;padding:2px 6px;border:1px solid #33373f;border-radius:10px;color:#2dd4bf;cursor:pointer;background:rgba(45,212,191,.06);user-select:none;}.cl-mc:hover{border-color:#2dd4bf;}';
      (document.head || document.documentElement).appendChild(s);
    }
    let lastTpl = document.getElementById('cl-tpl-camp');
    document.querySelectorAll('.cl-tpl-in').forEach(function (inp) {
      inp.addEventListener('focus', function () {
        lastTpl = inp;
      });
      inp.addEventListener('input', clTplSave);
    });
    document.querySelectorAll('.cl-mc').forEach(function (ch) {
      ch.addEventListener('mousedown', function (e) {
        e.preventDefault();
      });
      ch.addEventListener('click', function () {
        const inp = lastTpl || document.getElementById('cl-tpl-camp');
        if (!inp) return;
        const m = ch.getAttribute('data-m') || '';
        const a = inp.selectionStart != null ? inp.selectionStart : inp.value.length;
        const b = inp.selectionEnd != null ? inp.selectionEnd : a;
        inp.value = inp.value.slice(0, a) + m + inp.value.slice(b);
        inp.focus();
        try {
          inp.setSelectionRange(a + m.length, a + m.length);
        } catch (e) {}
        clTplSave();
      });
    });
    clTplLoad();
  })();
  document.getElementById('cl-sufon').onchange = function () {
    const s = document.getElementById('cl-suf');
    s.disabled = !this.checked;
    s.style.opacity = this.checked ? '1' : '.5';
  };
  document.querySelectorAll('.cl-f').forEach(
    b =>
      (b.onclick = function () {
        clFilter = this.dataset.f;
        document.querySelectorAll('.cl-f').forEach(x => x.classList.remove('active'));
        this.classList.add('active');
        clRenderTargets();
      })
  );
  const clHdr = document.getElementById('cl-hdr-cb');
  if (clHdr)
    clHdr.onchange = function () {
      const vis = clGetTargets();
      if (this.checked) vis.forEach(a => clSelectedTargets.add(a.id));
      else vis.forEach(a => clSelectedTargets.delete(a.id));
      clRenderTargets();
    };
  clDonorOpts();
  clRenderTargets();
