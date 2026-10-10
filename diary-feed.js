export const owner = 'pha0028-a11y';
export const repository = 'tracy-little-corner';
export const marker = '<!-- tracy-diary:v1 -->';
export function parseDiary(issue) {
  if (issue.pull_request || issue.user?.login !== owner || issue.state !== 'open' || !issue.title?.startsWith('[Diary] ') || !issue.body?.startsWith(marker + '\n')) return null;
  const match = issue.body.match(/^<!-- tracy-diary:v1 -->\r?\nDate: (\d{4}-\d{2}-\d{2})\r?\n\r?\n([\s\S]+)$/);
  if (!match || Number.isNaN(new Date(match[1] + 'T12:00:00').getTime())) return null;
  return { id: 'github-' + issue.number, date: match[1], title: issue.title.slice(8), body: match[2], url: 'https://github.com/' + owner + '/' + repository + '/issues/' + issue.number };
}
export async function loadDiary() {
  const entries = [];
  for (let page = 1; ; page++) {
    const url = new URL('https://api.github.com/repos/' + owner + '/' + repository + '/issues');
    url.search = new URLSearchParams({ creator: owner, state: 'open', per_page: '100', page: String(page) });
    const response = await fetch(url, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' });
    if (!response.ok) throw new Error('Không tải được bài đã đăng. Vui lòng thử lại sau.');
    const issues = await response.json();
    if (!Array.isArray(issues)) throw new Error('Không tải được bài đã đăng.');
    entries.push(...issues.map(parseDiary).filter(Boolean));
    if (issues.length < 100) break;
  }
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}
export function makePost(date, title, body) {
  return { title: '[Diary] ' + title.trim(), body: marker + '\nDate: ' + date + '\n\n' + body.trim() };
}
export function postURL(post, includeBody = true) {
  const url = new URL('https://github.com/' + owner + '/' + repository + '/issues/new');
  url.searchParams.set('title', post.title);
  if (includeBody) url.searchParams.set('body', post.body);
  return url.href;
}
