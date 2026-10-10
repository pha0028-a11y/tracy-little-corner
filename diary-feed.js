export const owner = 'pha0028-a11y';
export const repository = 'tracy-little-corner';
export const marker = '<!-- tracy-diary:v1 -->';
export function trusted(issue) { return !issue.pull_request && issue.user?.login === owner && issue.state === 'open'; }
export function parseDiary(issue) {
  if (!trusted(issue) || !issue.title?.startsWith('[Diary] ')) return null;
  const match = issue.body?.match(/^<!-- tracy-diary:v1 -->\r?\nDate: (\d{4}-\d{2}-\d{2})\r?\n\r?\n([\s\S]+)$/);
  if (!match || Number.isNaN(new Date(match[1] + 'T12:00:00').getTime())) return null;
  return { id: 'github-' + issue.number, date: match[1], title: issue.title.slice(8), body: match[2], url: 'https://github.com/' + owner + '/' + repository + '/issues/' + issue.number };
}
export function parseFavourites(issue) {
  if (!trusted(issue) || issue.title !== '[Favourites] My little world') return null;
  const prefix = '<!-- tracy-favourites:v1 -->\n';
  if (!issue.body?.startsWith(prefix)) return null;
  try {
    const data = JSON.parse(issue.body.slice(prefix.length));
    if (!['music','joy','dream'].every(key => typeof data[key] === 'string' && data[key].length <= 180)) return null;
    return { data, updatedAt: issue.updated_at || '', number: issue.number };
  } catch { return null; }
}
export async function loadPublished() {
  const entries = [], favourites = [], moments = [];
  for (let page = 1; ; page++) {
    const url = new URL('https://api.github.com/repos/' + owner + '/' + repository + '/issues');
    url.search = new URLSearchParams({ creator: owner, state: 'open', per_page: '100', page: String(page) });
    const response = await fetch(url, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' });
    if (!response.ok) throw new Error('Published updates could not load. Please try again later.');
    const issues = await response.json();
    if (!Array.isArray(issues)) throw new Error('Published updates could not load.');
    for (const issue of issues) {
      const entry = parseDiary(issue), favourite = parseFavourites(issue);
      const moment = parseMoments(issue);
      if (moment) moments.push(moment);
      if (entry) entries.push(entry);
      if (favourite) favourites.push(favourite);
    }
    if (issues.length < 100) break;
  }
  favourites.sort((a,b) => b.updatedAt.localeCompare(a.updatedAt) || b.number-a.number);
  return { moments: moments.sort((a,b) => b.date.localeCompare(a.date) || b.number-a.number), entries: entries.sort((a,b) => b.date.localeCompare(a.date)), favourites: favourites[0]?.data || null };
}
export async function loadDiary() { return (await loadPublished()).entries; }
export function makePost(date, title, body) { return { title: '[Diary] ' + title.trim(), body: marker + '\nDate: ' + date + '\n\n' + body.trim() }; }
export function postURL(post, includeBody = true) {
  const url = new URL('https://github.com/' + owner + '/' + repository + '/issues/new');
  url.searchParams.set('title', post.title);
  if (includeBody) url.searchParams.set('body', post.body);
  return url.href;
}

// Read only image attachments from open posts authored by the site owner.
export function imageURL(value) {
  try {
    const url = new URL(value.replace(/&amp;/g, '&'));
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    if ((url.hostname === 'github.com' && url.pathname.startsWith('/user-attachments/assets/')) ||
        ['user-images.githubusercontent.com','cloud.githubusercontent.com'].includes(url.hostname)) return url.href;
  } catch {}
  return null;
}
export function parseMoments(issue) {
  if (!trusted(issue) || !issue.title?.startsWith('[Moment] ')) return null;
  const match = issue.body?.match(/^<!-- tracy-moments:v1 -->\r?\nDate: (\d{4}-\d{2}-\d{2})\r?\n\r?\n([\s\S]*)$/);
  if (!match || Number.isNaN(new Date(match[1]+'T12:00:00').getTime())) return null;
  const photos = [];
  const pattern = /!\[([^\]]*)\]\(<?(https:\/\/[^\s)>]+)>?(?:\s+"[^"]*")?\)|<img\b[^>]*>/gi;
  for (const image of match[2].matchAll(pattern)) {
    const source = image[2] || image[0].match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    const url = source && imageURL(source);
    if (url && !photos.some(photo => photo.url === url)) photos.push({url,alt:image[1] || issue.title.slice(9)});
  }
  if (!photos.length) return null;
  return {number:issue.number,date:match[1],title:issue.title.slice(9),photos,url:'https://github.com/'+owner+'/'+repository+'/issues/'+issue.number};
}
export function makeMoment(date,title) {
  return {title:'[Moment] '+(title.trim() || 'A little moment'), body:'<!-- tracy-moments:v1 -->\nDate: '+date+'\n\n<!-- Drop your photos below this line, wait for uploads to finish, then create this issue. Keep the marker and date above. -->\n'};
}
