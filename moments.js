export function renderMoments(grid, moments, editable = false) {
  grid.replaceChildren();
  for (const moment of moments) for (const photo of moment.photos) {
    const frame = document.createElement('figure');
    frame.className = 'moment-frame';
    const link = document.createElement('a');
    link.href = photo.url; link.target = '_blank'; link.rel = 'noopener';
    const image = document.createElement('img');
    image.src = photo.url; image.alt = photo.alt || moment.title;
    image.loading = 'lazy'; image.decoding = 'async';
    link.append(image);
    const caption = document.createElement('figcaption');
    const title = document.createElement('span'); title.textContent = moment.title;
    const date = document.createElement('time'); date.dateTime = moment.date;
    date.textContent = new Date(moment.date+'T12:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
    caption.append(title, date); frame.append(link, caption);
    if (editable) {
      const edit = document.createElement('a'); edit.href = moment.url;
      edit.target = '_blank'; edit.rel = 'noopener'; edit.className = 'edit';
      edit.textContent = 'Edit moment ↗'; frame.append(edit);
    }
    grid.append(frame);
  }
  if (!grid.children.length) for (let i=0;i<3;i++) {
    const frame = document.createElement('div'); frame.className = 'moment-placeholder';
    frame.setAttribute('aria-hidden','true'); frame.textContent = '✳'; grid.append(frame);
  }
}
