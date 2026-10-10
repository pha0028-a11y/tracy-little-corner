(() => {
  const list = document.querySelector('#diary-entries');
  fetch('updates.json', { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error('Updates unavailable');
      return response.json();
    })
    .then(data => {
      for (const key of ['music', 'joy', 'dream']) {
        if (typeof data.favourites?.[key] === 'string') {
          document.getElementById(key).textContent = data.favourites[key];
        }
      }
      if (!Array.isArray(data.entries)) throw new Error('Invalid entries');
      const entries = data.entries.filter(entry => entry &&
        /^\d{4}-\d{2}-\d{2}$/.test(entry.date) &&
        typeof entry.title === 'string' && typeof entry.body === 'string');
      entries.sort((a, b) => b.date.localeCompare(a.date));
      list.replaceChildren();
      for (const entry of entries) {
        const page = document.createElement('article');
        page.className = 'diary-page';
        const time = document.createElement('time');
        time.dateTime = entry.date;
        const date = new Date(entry.date + 'T12:00:00');
        time.textContent = Number.isNaN(date.getTime()) ? entry.date :
          date.toLocaleDateString(undefined, {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
          });
        const heading = document.createElement('h4');
        heading.textContent = entry.title || 'A little thought';
        const body = document.createElement('p');
        body.textContent = entry.body;
        page.append(time, heading, body);
        list.append(page);
      }
    })
    .catch(() => {
      const message = document.createElement('p');
      message.textContent = 'Updates could not load. Please refresh the page.';
      list.replaceChildren(message);
    });
})();
