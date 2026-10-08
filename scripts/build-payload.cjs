#!/usr/bin/env node
"use strict";
const fs=require("fs");
const path=require("path");
const ROOT=path.resolve(__dirname,"..");
const SRC=path.join(ROOT,"src");
const OUT=path.join(ROOT,"parseraccs.js");
const order=["i18n.js","styles.js","accounts.js","modal.js","rules.js","bindings.js"];
const read=(name)=>fs.readFileSync(path.join(SRC,name),"utf8");
// CloneAds source = src/clone.js + src/clone.2.js + src/clone.3.js ... (numeric order)
function readClone(){
  const clonePath=path.join(SRC,"clone.js");
  if(!fs.existsSync(clonePath)) return null;
  const extra=fs.readdirSync(SRC).filter(n=>/^clone\.\d+\.js$/.test(n)).sort((a,b)=>parseInt(a.split(".")[1],10)-parseInt(b.split(".")[1],10));
  return [fs.readFileSync(clonePath,"utf8")].concat(extra.map(n=>read(n))).join("\n");
}
function assemble(){
  let modal=read("modal.js"), bindings=read("bindings.js");
  const clone=readClone();
  if(clone!==null){
    const split="/*__SECTION_LATE__*/", earlyMark="/*__PA_CLONE_EARLY__*/", lateMark="/*__PA_CLONE_LATE__*/";
    const at=clone.indexOf(split);
    const early=(at>=0?clone.slice(0,at):clone).replace("/*__SECTION_EARLY__*/","");
    const late=at>=0?clone.slice(at+split.length):"";
    if(!modal.includes(earlyMark)||!bindings.includes(lateMark)) throw new Error("CloneAds insertion markers are missing.");
    modal=modal.split(earlyMark).join(early);
    bindings=bindings.split(lateMark).join(late);
  }
  const parts=[read("i18n.js"),read("styles.js"),read("accounts.js"),modal,read("rules.js"),bindings];
  return parts.join("\n").replace(/^\uFEFF/,"").trim()+"\n";
}
const source=assemble();
if(process.argv.includes("--check")){
  const current=fs.existsSync(OUT)?fs.readFileSync(OUT,"utf8"):"";
  if(current!==source) throw new Error("parseraccs.js is out of date. Run npm run build:payload.");
  console.log("parseraccs.js is up to date.");
}else{
  fs.writeFileSync(OUT,source);
  console.log(`Generated parseraccs.js (${Buffer.byteLength(source)} bytes).`);
}
