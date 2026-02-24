/**
 * Singer view: add name (once), view queue. No edit after submit.
 */

(function () {
  const form = document.getElementById('add-form');
  const nameInput = document.getElementById('name-input');
  const submitBtn = document.getElementById('submit-btn');
  const queueList = document.getElementById('queue-list');
  const addedNotice = document.getElementById('added-notice');

  let hasSubmitted = false;

  function renderQueue(entries) {
    if (!entries || entries.length === 0) {
      queueList.innerHTML = '<li class="queue-empty">No one in the queue yet. Be the first!</li>';
      return;
    }
    queueList.innerHTML = entries
      .map(
        (e, i) =>
          '<li>' +
          '<span class="position" aria-hidden="true">' + (i + 1) + '</span>' +
          '<span class="name">' +
          escapeHtml(e.name) +
          (e.isCurrentlySinging ? ' <span class="now-badge">Now singing</span>' : '') +
          '</span></li>'
      )
      .join('');
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function fetchQueue() {
    fetch('/api/queue')
      .then(function (res) {
        return res.ok ? res.json() : [];
      })
      .catch(function () {
        return [];
      })
      .then(renderQueue);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (hasSubmitted) return;
    const name = nameInput.value.trim();
    if (!name) return;
    submitBtn.disabled = true;
    fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name }),
    })
      .then(function (res) {
        if (res.ok) {
          hasSubmitted = true;
          nameInput.disabled = true;
          submitBtn.disabled = true;
          addedNotice.classList.add('visible');
          return res.json();
        }
        return res.json().then(function (data) {
          throw new Error(data.error || 'Failed to add');
        });
      })
      .then(function (data) {
        renderQueue(data);
        setTimeout(function () {
          window.location.reload();
        }, 3000);
      })
      .catch(function (err) {
        submitBtn.disabled = false;
        alert(err.message || 'Could not add you. Try again.');
      });
  });

  fetchQueue();
  setInterval(fetchQueue, 4000);
})();
