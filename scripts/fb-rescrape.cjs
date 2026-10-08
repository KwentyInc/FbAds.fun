#!/usr/bin/env node
"use strict";
// After deploy: ask Facebook to re-scrape the OG manifest/chunks so the bookmarklet loader
// immediately sees the new build. Uses an app access token (FB_APP_ID|FB_APP_SECRET) from
// Workers Builds environment variables. Never fails the deploy: problems are only logged.
const fs=require("fs");
const path=require("path");
const ROOT=path.resolve(__dirname,"..");
const info=JSON.parse(fs.readFileSync(path.join(ROOT,"dist","parseraccs","latest","package-info.json"),"utf8"));
const appId=process.env.FB_APP_ID||"", appSecret=process.env.FB_APP_SECRET||"";
const token=process.env.FB_APP_TOKEN||(appId&&appSecret?`${appId}|${appSecret}`:"");
const urls=info.manualScrapeUrls||[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function scrape(url){
  const api=`https://graph.facebook.com/?id=${encodeURIComponent(url)}&scrape=true&access_token=${encodeURIComponent(token)}`;
  const res=await fetch(api,{method:"POST"});
  const json=await res.json().catch(()=>({}));
  if(!res.ok||json.error) throw new Error((json.error&&json.error.message)||`HTTP ${res.status}`);
  return json;
}
(async()=>{
  if(!token){console.log("fb-rescrape: FB_APP_ID/FB_APP_SECRET not set — skipping. Re-scrape manually:");urls.forEach(u=>console.log(`- ${u}`));return;}
  if(!urls.length){console.log("fb-rescrape: no URLs in package-info.json");return;}
  await sleep(5000); // let the new deployment propagate before Facebook fetches it
  let failed=0;
  for(const url of urls){
    let ok=false,last="";
    for(let attempt=1;attempt<=4&&!ok;attempt++){
      try{
        const r=await scrape(url);
        const title=String(r.title||"");
        if(title.includes(info.build)){ok=true;console.log(`fb-rescrape: ✓ ${url} → ${title}`);}
        else{last=`Facebook still sees "${title||"?"}"`;await sleep(5000*attempt);}
      }catch(e){last=e.message;await sleep(5000*attempt);}
    }
    if(!ok){failed++;console.log(`fb-rescrape: ✗ ${url}: ${last}`);}
  }
  console.log(failed?`fb-rescrape: ${failed} URL(s) not refreshed — re-scrape manually in Sharing Debugger.`:`fb-rescrape: Facebook now serves build ${info.build}.`);
})().catch(e=>console.log(`fb-rescrape: skipped (${e.message})`));
