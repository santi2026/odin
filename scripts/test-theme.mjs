import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import vm from 'node:vm';
import postcss from 'postcss';
import {convert} from './build-theme.mjs';
import {buildBackup,applySections,resetSections,validateImportedSections} from '../preview-admin/admin-core.js';
const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
const listeners={},system={matches:false,addEventListener(type,callback){this.change=callback;}};
const doc=()=>({documentElement:{dataset:{},style:{}},head:{append(){}},querySelector:selector=>selector.includes("data-odin-theme-style")?true:null,querySelectorAll:()=>[],addEventListener(){}});
const document=doc(),window={addEventListener:(name,callback)=>listeners[name]=callback};
vm.runInNewContext(await readFile(new URL('../theme.js',import.meta.url),'utf8'),{document,window,location:{pathname:'/preview-home/'},localStorage:storage,matchMedia:()=>system,Set,JSON});
assert.equal(document.documentElement.dataset.theme,'dark','Existing users retain night mode');
window.odinTheme.setMode('auto');assert.equal(document.documentElement.dataset.theme,'light');
system.matches=true;system.change();assert.equal(document.documentElement.dataset.theme,'dark');
window.odinTheme.setMode('light');system.change();assert.equal(document.documentElement.dataset.theme,'light','Explicit day ignores OS changes');
const floating=doc();window.odinTheme.attach(floating,'preview-time-control');assert.equal(floating.documentElement.dataset.theme,'light');
const backup=buildBackup(storage,['apariencia']);assert.equal(backup.secciones.apariencia.mode,'light');
resetSections(storage,['apariencia']);window.odinTheme.refresh();assert.equal(document.documentElement.dataset.theme,'dark');
applySections(storage,backup.secciones,['apariencia'],'replace');window.odinTheme.refresh();assert.equal(document.documentElement.dataset.theme,'light');assert.equal(floating.documentElement.dataset.theme,'light');
storage.setItem('odin-appearance-v1','{"mode":"dark"}');listeners.storage();assert.equal(document.documentElement.dataset.theme,'dark');
assert.throws(()=>validateImportedSections({apariencia:{mode:'invalid'}}));
storage.setItem('odin-appearance-v1','broken');window.odinTheme.refresh();assert.equal(document.documentElement.dataset.theme,'dark');
// A parser-blocking theme script must follow render-blocking palettes in the head.
// Dynamically appending styles permits an initial dark paint on a cold navigation.
for(const folder of (await readdir(new URL('../',import.meta.url))).filter(name=>name==='preview'||name.startsWith('preview-'))){
  const html=await readFile(new URL(`../${folder}/index.html`,import.meta.url),'utf8');
  const head=html.slice(0,html.indexOf('</head>'));
  const palette=head.indexOf(`/theme-light/${folder}.css?v=4`),control=head.indexOf('/theme.css?v=4'),script=head.indexOf('/theme.js?v=3');
  assert.ok(palette>=0&&control>palette&&script>control,`${folder}: theme styles must load before the first paint`);
  assert.ok(!/\b(async|defer)\b/.test(head.slice(head.lastIndexOf('<script',script),head.indexOf('</script>',script))),`${folder}: apply theme synchronously`);
}
for(const selector of ['.dates-tabs button[aria-selected="true"]','.timer-tabs button.active','.admin-tabs button[aria-selected="true"]','.category-list button.active']){
  const css=postcss.parse(convert(`${selector}{color:#171209;background:var(--gold);border:1px solid var(--gold)}`));
  const declarations=Object.fromEntries(css.first.nodes.map(node=>[node.prop,node.value]));
  assert.equal(declarations.color,'#30240d',`${selector}: preserve explicit dark text on a pale gold control`);
  assert.equal(declarations.background,'var(--gold-fill, #f5d58d)');
  assert.ok(declarations.border.includes('var(--gold-border, #d4ae56)'));
}
const illustration='.cover-countdown b{color:var(--gold);background:#17131a}';
assert.equal(convert(illustration),'','Decorative covers keep their own palette');
console.log('THEME_TESTS=PASS');
