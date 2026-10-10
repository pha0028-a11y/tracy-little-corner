import { loadPublished, makePost, postURL } from './diary-feed.js?v=2';
const form=document.querySelector('#note-form'),note=document.querySelector('#note'),date=document.querySelector('#entry-date'),title=document.querySelector('#entry-title'),status=document.querySelector('#save-status'),list=document.querySelector('#diary-entries');
const dialog=document.querySelector('#edit-dialog');
let activeKey='',entries=[],favourites={},ready=false;
const draftKey='tracy:online-diary-draft-v1';
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
date.value=today();
try { const draft=JSON.parse(localStorage.getItem(draftKey)||'null'); if(draft){date.value=draft.date||today();title.value=draft.title||'';note.value=draft.body||'';} } catch {}
form.addEventListener('input',()=>{try{localStorage.setItem(draftKey,JSON.stringify({date:date.value,title:title.value,body:note.value}));status.textContent='Draft kept.';}catch{status.textContent='Could not save this draft. Keep this page open.';}});
function publish(post) {
  if(!ready){status.textContent='Please wait for published updates to load before posting.';return;}
  const url=postURL(post);
  if(url.length<=7000){window.open(url,'_blank','noopener');status.textContent='Confirm on GitHub as pha0028-a11y to publish. Your draft is kept.';return;}
  const handoff=document.createElement('dialog');
  const heading=document.createElement('h2');heading.textContent='Keep this thought.';
  const help=document.createElement('p');help.textContent='Copy the full entry below, open GitHub, paste it into the body, and confirm to publish.';
  const text=document.createElement('textarea');text.value=post.body;text.readOnly=true;text.rows=8;
  const copy=document.createElement('button');copy.type='button';copy.className='button';copy.textContent='Copy entry';copy.onclick=async()=>{try{await navigator.clipboard.writeText(post.body);help.textContent='Copied. Open GitHub and paste it into the body.';}catch{text.select();help.textContent='Select and copy the entry below.';}};
  const link=document.createElement('a');link.href=postURL(post,false);link.target='_blank';link.rel='noopener';link.className='edit';link.textContent='Open GitHub ↗';
  const close=document.createElement('button');close.type='button';close.className='close';close.textContent='×';close.setAttribute('aria-label','Close');close.onclick=()=>{handoff.close();handoff.remove()};
  handoff.append(close,heading,help,text,copy,link);document.body.append(handoff);handoff.showModal();
}
form.addEventListener('submit',event=>{event.preventDefault();if(!note.value.trim())return;publish(makePost(date.value,title.value.trim()||'A little thought',note.value));});
for(const button of document.querySelectorAll('.edit[data-key]'))button.addEventListener('click',()=>{activeKey=button.dataset.key;document.querySelector('#edit-title').textContent=button.dataset.title;document.querySelector('#edit-value').value=favourites[activeKey]||document.getElementById(activeKey).textContent;dialog.showModal();});
document.querySelector('.close').addEventListener('click',()=>dialog.close());
document.querySelector('#edit-form').addEventListener('submit',event=>{event.preventDefault();const value=document.querySelector('#edit-value').value.trim();if(!value)return;const next={...favourites,[activeKey]:value};publish({title:'[Favourites] My little world',body:'<!-- tracy-favourites:v1 -->\n'+JSON.stringify(next,null,2)});dialog.close();});
document.querySelector('#export-diary').addEventListener('click',()=>{const data={format:'tracy-diary',version:1,entries,draft:{date:date.value,title:title.value,body:note.value},exportedAt:new Date().toISOString()};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='tracy-diary-'+today()+'.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);});
async function refresh(){
  try{
    const base=await fetch('updates.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()});
    const published=await loadPublished();favourites=published.favourites||base.favourites;entries=[...(base.entries||[]),...published.entries].sort((a,b)=>b.date.localeCompare(a.date));
    for(const key of ['music','joy','dream']){if(typeof favourites[key]==='string')document.getElementById(key).textContent=favourites[key];}
    ready=true;list.replaceChildren();
    for(const entry of entries){const page=document.createElement('article');page.className='diary-page';const time=document.createElement('time');time.dateTime=entry.date;time.textContent=new Date(entry.date+'T12:00:00').toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'});const heading=document.createElement('h4');heading.textContent=entry.title||'A little thought';const body=document.createElement('p');body.textContent=entry.body;page.append(time,heading,body);if(entry.url){const edit=document.createElement('a');edit.className='edit';edit.href=entry.url;edit.target='_blank';edit.rel='noopener';edit.textContent='Edit this page ↗';page.append(edit);}list.append(page);}
  }catch{status.textContent='Published updates could not load. Please refresh before posting.';}
}
window.addEventListener('focus',refresh);refresh();
