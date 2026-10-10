import { loadDiary, makePost, postURL } from './diary-feed.js?v=1';
const form = document.querySelector('#writer-form');
const date = document.querySelector('#post-date');
const title = document.querySelector('#post-title');
const body = document.querySelector('#post-body');
const status = document.querySelector('#writer-status');
const draftKey = 'tracy:online-diary-draft-v1';
const now = new Date();
date.value = [now.getFullYear(), String(now.getMonth()+1).padStart(2,'0'), String(now.getDate()).padStart(2,'0')].join('-');
try {
  const draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
  if (draft) { if (draft.date) date.value = draft.date; title.value = draft.title || ''; body.value = draft.body || ''; }
} catch { status.textContent = 'Trình duyệt không đọc được bản nháp.'; }
form.addEventListener('input', () => {
  try { localStorage.setItem(draftKey, JSON.stringify({ date: date.value, title: title.value, body: body.value })); status.textContent = 'Bản nháp đã lưu trên trình duyệt.'; }
  catch { status.textContent = 'Không lưu được bản nháp. Hãy giữ trang mở cho đến khi đăng xong.'; }
});
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!title.value.trim() || !body.value.trim()) { status.textContent = 'Điền tiêu đề và nội dung trước khi đăng nhé.'; return; }
  const post = makePost(date.value, title.value, body.value);
  const url = postURL(post);
  if (url.length > 7000) {
    document.querySelector('#long-post').hidden = false;
    document.querySelector('#prepared-body').value = post.body;
    document.querySelector('#open-github').href = postURL(post, false);
    status.textContent = 'Bài dài: dùng phần sao chép bên dưới để đăng đầy đủ.';
  } else {
    status.textContent = 'Đăng nhập tài khoản pha0028-a11y rồi bấm “Create” trên GitHub để đăng. Bản nháp vẫn được giữ lại.';
    window.open(url, '_blank', 'noopener');
  }
});
document.querySelector('#copy-post').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(document.querySelector('#prepared-body').value); status.textContent = 'Đã sao chép. Mở GitHub và dán vào ô nội dung.'; }
  catch { document.querySelector('#prepared-body').select(); status.textContent = 'Chọn nội dung bên dưới rồi sao chép bằng bàn phím.'; }
});
async function refreshPosts() {
  const list = document.querySelector('#published-posts');
  list.textContent = 'Đang tải…';
  try {
    const entries = await loadDiary();
    list.replaceChildren();
    if (!entries.length) { list.textContent = 'Chưa có bài đã đăng.'; return; }
    for (const entry of entries) {
      const link = document.createElement('a'); link.href = entry.url; link.target = '_blank'; link.rel = 'noopener';
      const time = document.createElement('time'); time.dateTime = entry.date; time.textContent = entry.date;
      const heading = document.createElement('strong'); heading.textContent = entry.title;
      link.append(time, heading); list.append(link);
    }
  } catch (error) { list.textContent = error.message; }
}
document.querySelector('#refresh-posts').addEventListener('click', refreshPosts);
refreshPosts();
