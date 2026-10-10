(() => {
  const storageKey='tracy:diary-v1', draftKey='tracy:diary-draft-v1';
  const form=document.querySelector('#note-form'), note=document.querySelector('#note');
  const dateInput=document.querySelector('#entry-date'), titleInput=document.querySelector('#entry-title');
  const status=document.querySelector('#save-status'), list=document.querySelector('#diary-entries');
  const cancel=document.querySelector('#cancel-edit'), save=document.querySelector('#save-entry');
  let entries=[], editingId=null, storageReady=true;
  const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
  const isEntry=e=>e&&typeof e.id==='string'&&typeof e.body==='string'&&typeof e.title==='string'&&typeof e.createdAt==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(e.date);
  const read=key=>{try{return localStorage.getItem(key);}catch{storageReady=false;return null;}};
  const write=(key,value)=>{try{localStorage.setItem(key,value);return true;}catch{status.textContent='Could not save. Keep this page open and download a backup.';return false;}};
  const raw=read(storageKey);
  if(raw){try{const data=JSON.parse(raw);if(!Array.isArray(data)||!data.every(isEntry))throw Error();entries=data;}catch{storageReady=false;status.textContent='Saved diary could not be read. Saving is paused to protect it.';}}
  const persist=next=>{if(!storageReady){status.textContent='Browser storage is unavailable. Your saved diary has not been changed.';return false;}if(!write(storageKey,JSON.stringify(next)))return false;entries=next;render();return true;};
  const clearDraft=()=>{try{localStorage.removeItem(draftKey);}catch{}};
  const reset=()=>{form.reset();dateInput.value=today();editingId=null;cancel.hidden=true;save.textContent='Save today’s thought ↗';clearDraft();};
  function render(){
    list.replaceChildren();document.querySelector('#entry-count').textContent=entries.length+' '+(entries.length===1?'entry':'entries');
    if(!entries.length){const empty=document.createElement('p');empty.className='empty-diary';empty.textContent='Your first page is waiting. Write a little thought above to begin.';list.append(empty);return;}
    const sorted=[...entries].sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt));
    for(const entry of sorted){
      const page=document.createElement('article');page.className='diary-page';
      const time=document.createElement('time');time.dateTime=entry.date;
      time.textContent=new Date(entry.date+'T12:00:00').toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'});
      const heading=document.createElement('h4');heading.textContent=entry.title||'A little thought';
      const body=document.createElement('p');body.textContent=entry.body;
      const actions=document.createElement('div');actions.className='page-actions';
      const edit=document.createElement('button');edit.type='button';edit.className='edit';edit.textContent='Edit this page ↗';edit.setAttribute('aria-label','Edit '+(entry.title||entry.date));
      edit.addEventListener('click',()=>{
        if((note.value.trim()||titleInput.value.trim())&&!confirm('Replace the thought currently in the editor?'))return;
        editingId=entry.id;dateInput.value=entry.date;titleInput.value=entry.title;note.value=entry.body;
        cancel.hidden=false;save.textContent='Save changes ↗';status.textContent='Editing a saved page.';form.scrollIntoView({block:'center'});note.focus();
      });
      const remove=document.createElement('button');remove.type='button';remove.className='edit';remove.textContent='Delete';remove.setAttribute('aria-label','Delete '+(entry.title||entry.date));
      remove.addEventListener('click',()=>{if(!confirm('Delete this diary page? This cannot be undone.'))return;if(persist(entries.filter(e=>e.id!==entry.id))){if(editingId===entry.id)reset();status.textContent='Diary page deleted.';}});
      actions.append(edit,remove);page.append(time,heading,body,actions);list.append(page);
    }
  }
  dateInput.value=today();
  const draft=read(draftKey);
  if(draft){try{const value=JSON.parse(draft);if(typeof value.body==='string')note.value=value.body;if(typeof value.title==='string')titleInput.value=value.title;if(/^\d{4}-\d{2}-\d{2}$/.test(value.date))dateInput.value=value.date;if(typeof value.editingId==='string'&&entries.some(e=>e.id===value.editingId)){editingId=value.editingId;cancel.hidden=false;save.textContent='Save changes ↗';}status.textContent='Your unfinished thought is here.';}catch{}}
  else{const previous=read('tracy:note');if(previous){note.value=previous;status.textContent='Your earlier note is here. Save it as your first diary page.';}}
  if(!storageReady)status.textContent='Browser storage is unavailable or could not be read. Copy your thought before leaving.';
  render();
  form.addEventListener('submit',event=>{
    event.preventDefault();const body=note.value.trim();if(!body){note.setCustomValidity('Write a little thought before saving.');note.reportValidity();return;}note.setCustomValidity('');
    const existing=entries.find(e=>e.id===editingId);
    const entry={id:existing?.id||(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)),date:dateInput.value,title:titleInput.value.trim(),body,createdAt:existing?.createdAt||new Date().toISOString()};
    const next=existing?entries.map(e=>e.id===existing.id?entry:e):[...entries,entry];
    if(persist(next)){reset();try{localStorage.removeItem('tracy:note');}catch{}status.textContent=existing?'Changes saved in this browser.':'A new page saved in this browser.';}
  });
  form.addEventListener('input',()=>{note.setCustomValidity('');if(storageReady&&write(draftKey,JSON.stringify({body:note.value,title:titleInput.value,date:dateInput.value,editingId})))status.textContent='Draft kept. Save to add it to your diary.';});
  cancel.addEventListener('click',()=>{reset();status.textContent='Edit cancelled. Your saved page is unchanged.';});
  document.querySelector('#export-diary').addEventListener('click',()=>{
    const data={format:'tracy-diary',version:1,entries,draft:{date:dateInput.value,title:titleInput.value,body:note.value,editingId},exportedAt:new Date().toISOString()};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='tracy-diary-'+today()+'.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    status.textContent='Diary backup downloaded. Keep it somewhere safe.';
  });
})();
