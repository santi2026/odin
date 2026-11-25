(() => {
  const KEY = 'odin-appearance-v1';
  const modes = ['auto', 'dark', 'light'];
  const labels = {auto:'Automático', dark:'Noche', light:'Día'};
  const system = matchMedia('(prefers-color-scheme: dark)');
  const documents = new Set([document]);
  const read = () => { try { const value=JSON.parse(localStorage.getItem(KEY)); return modes.includes(value?.mode)?value.mode:'dark'; } catch { return 'dark'; } };
  let mode = read();
  function apply() {
    const resolved = mode==='auto'?(system.matches?'dark':'light'):mode;
    for (const doc of documents) {
      doc.documentElement.dataset.theme=resolved;
      doc.documentElement.style.colorScheme=resolved;
      doc.querySelectorAll('[data-theme-mode]').forEach(button=>button.setAttribute('aria-checked',String(button.dataset.themeMode===mode)));
      const trigger=doc.querySelector('.theme-trigger');
      if(trigger){trigger.title=`Tema: ${labels[mode]}`;trigger.setAttribute('aria-label',`Tema: ${labels[mode]}`);trigger.querySelector('span').textContent=mode==='auto'?'◐':mode==='dark'?'☾':'☀';}
    }
  }
  function attach(doc, page=({'/herramientas/alarmas/':'preview-alarms','/herramientas/concentracion/':'preview-focus','/herramientas/cronometro-temporizador/':'preview-timer','/herramientas/mi-ip/':'preview-ip','/herramientas/reloj-negro/':'preview','/herramientas/relojes-del-mundo/':'preview-world'})[location.pathname]||location.pathname.split('/').filter(Boolean)[0]||'preview-home') {
    documents.add(doc);
    if(doc!==document)doc.defaultView?.addEventListener('pagehide',()=>documents.delete(doc),{once:true});
    if(!doc.querySelector('[data-odin-theme-style]')) {
      for(const href of [`/theme-light/${page}.css?v=4`,'/theme.css?v=4']){const link=doc.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.odinThemeStyle='';doc.head.append(link);}
    }
    apply();
  }
  function setMode(next){if(!modes.includes(next))return;mode=next;try{localStorage.setItem(KEY,JSON.stringify({mode}));}catch{}apply();}
  function mount() {
    const nav=document.querySelector('.site-header nav');
    if(!nav||nav.querySelector('.theme-control'))return;
    const control=document.createElement('div');control.className='theme-control';
    control.innerHTML='<button class="theme-trigger" type="button" aria-haspopup="menu" aria-expanded="false"><span aria-hidden="true">◐</span></button><div class="theme-menu" role="menu" aria-label="Apariencia" hidden>'+modes.map(value=>`<button type="button" role="menuitemradio" data-theme-mode="${value}" aria-checked="false">${labels[value]}</button>`).join('')+'</div>';
    nav.prepend(control);
    const trigger=control.querySelector('.theme-trigger'),menu=control.querySelector('.theme-menu');
    function close(){menu.hidden=true;trigger.setAttribute('aria-expanded','false');}
    trigger.addEventListener('click',()=>{menu.hidden=!menu.hidden;trigger.setAttribute('aria-expanded',String(!menu.hidden));if(!menu.hidden)menu.querySelector('[aria-checked="true"]').focus();});
    menu.addEventListener('click',event=>{const button=event.target.closest('[data-theme-mode]');if(button){setMode(button.dataset.themeMode);close();trigger.focus();}});
    control.addEventListener('keydown',event=>{if(event.key==='Escape'){close();trigger.focus();}if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const buttons=[...menu.querySelectorAll('button')],index=buttons.indexOf(document.activeElement);buttons[event.key==='Home'?0:event.key==='End'?2:(index+(event.key==='ArrowDown'?1:2))%3].focus();}});
    document.addEventListener('click',event=>{if(!control.contains(event.target))close();});
    apply();
  }
  window.odinTheme={attach,setMode,refresh(){mode=read();apply();}};
  attach(document);
  system.addEventListener('change',apply);
  window.addEventListener('storage',()=>{mode=read();apply();});
  document.addEventListener('odin:appearance-updated',()=>{mode=read();apply();});
  document.addEventListener('DOMContentLoaded',()=>{mount();new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});},{once:true});
})();
