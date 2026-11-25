import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import vm from 'node:vm';
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
  const palette=head.indexOf(`/theme-light/${folder}.css?v=3`),control=head.indexOf('/theme.css?v=3'),script=head.indexOf('/theme.js?v=2');
  assert.ok(palette>=0&&control>palette&&script>control,`${folder}: theme styles must load before the first paint`);
  assert.ok(!/\b(async|defer)\b/.test(head.slice(head.lastIndexOf('<script',script),head.indexOf('</script>',script))),`${folder}: apply theme synchronously`);
}
console.log('THEME_TESTS=PASS');
