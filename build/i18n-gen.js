const fs=require('fs');
const rows=fs.readFileSync('build/i18n-en.tsv','utf8').split('\n').filter(Boolean).map(l=>l.split('\t'));
const map={};for(const [a,e] of rows){ if(a&&e!==undefined) map[a.replace(/\\\\/g,'\\')]=e.replace(/\\\\/g,'\\'); }
const keys=Object.keys(map).sort((a,b)=>b.length-a.length);
const dict=keys.map(k=>[k,map[k]]);
const src=`/* English UI layer: replaces Arabic UI text with English when lang=en */
(function(){
const DICT=${JSON.stringify(dict)}.map(([a,e])=>[a,e,new RegExp('(?<![\\u0621-\\u064A])'+a.replace(/[.*+?^\${}()|[\\]\\\\]/g,'\\\\$&')+'(?![\\u0621-\\u064A])','g')]);
const AR=/[\\u0600-\\u06FF]/;
let on=false, obs=null;
const orig=new WeakMap();
function tr(s){
  if(!s||!AR.test(s)) return s;
  const lead=s.match(/^\\s*/)[0], trail=s.match(/\\s*$/)[0];
  const core=s.trim();
  for(const [a,e] of DICT) if(core===a) return lead+e+trail;
  let out=s;
  for(const [a,e,re] of DICT){ if(out.indexOf(a)>=0){ re.lastIndex=0; out=out.replace(re,()=>e); if(!AR.test(out)) break; } }
  return out;
}
function doText(n){
  const v=n.nodeValue; if(!AR.test(v)) return;
  if(!orig.has(n)) orig.set(n,v);
  n.nodeValue=tr(v);
}
const ATTRS=['placeholder','title','aria-label'];
function doEl(el){
  for(const a of ATTRS){ const v=el.getAttribute&&el.getAttribute(a); if(v&&AR.test(v)){ el.setAttribute('data-ar-'+a,v); el.setAttribute(a,tr(v)); } }
  if(el.tagName==='INPUT'&&(el.type==='button'||el.type==='submit')&&AR.test(el.value)) el.value=tr(el.value);
}
function walk(root){
  if(root.nodeType===3){ doText(root); return; }
  if(root.nodeType!==1) return;
  if(root.closest&&root.closest('[data-noi18n],textarea,[contenteditable]')) return;
  doEl(root);
  const w=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{acceptNode(n){
    const p=n.nodeType===3?n.parentElement:n;
    if(p&&p.closest('[data-noi18n],textarea,script,style,[contenteditable]')) return NodeFilter.FILTER_REJECT;
    return NodeFilter.FILTER_ACCEPT;}});
  let n; while((n=w.nextNode())){ if(n.nodeType===3) doText(n); else doEl(n); }
}
function start(){
  if(obs) return;
  obs=new MutationObserver(ms=>{ obs.disconnect(); for(const m of ms){
    if(m.type==='characterData') doText(m.target);
    else if(m.type==='attributes') doEl(m.target);
    else m.addedNodes.forEach(walk);
  } obs.observe(document.body,OPT); });
  const OPT={childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTRS};
  start.OPT=OPT;
  walk(document.body); obs.observe(document.body,OPT);
}
function stop(){ if(obs){obs.disconnect();obs=null;} }
window.I18N={
  tr:(s)=>on?tr(s):s,
  get lang(){return on?'en':'ar'},
  set(lang){
    on=lang==='en';
    document.documentElement.lang=on?'en':'ar';
    document.documentElement.dir=on?'ltr':'rtl';
    if(on) start(); else { stop(); }
  }
};
})();
`;
fs.writeFileSync('renderer/i18n.js',src);
console.log(dict.length);
