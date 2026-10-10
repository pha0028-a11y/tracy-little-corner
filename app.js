const dialog=document.querySelector('#edit-dialog');
let activeKey='',hasStorage=true;
const get=(key)=>{try{return localStorage.getItem('tracy:'+key)}catch{hasStorage=false;return null}};
const put=(key,value)=>{try{localStorage.setItem('tracy:'+key,value);return true}catch{hasStorage=false;return false}};
for(const key of ['music','joy','dream']){const value=get(key);if(value)document.getElementById(key).textContent=value;}
for(const button of document.querySelectorAll('.edit'))button.addEventListener('click',()=>{activeKey=button.dataset.key;document.querySelector('#edit-title').textContent=button.dataset.title;document.querySelector('#edit-value').value=get(activeKey)||'';dialog.showModal();});
document.querySelector('.close').addEventListener('click',()=>dialog.close());
document.querySelector('#edit-form').addEventListener('submit',event=>{event.preventDefault();const value=document.querySelector('#edit-value').value.trim();if(!value)return;document.getElementById(activeKey).textContent=value;const saved=put(activeKey,value);const status=document.querySelector('.storage-note');if(status)status.textContent=saved?'':'Your edit is visible now, but this browser could not save it.';dialog.close();});
