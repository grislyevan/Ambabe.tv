/**
 * Host view: reorder (up/down), remove. Full control over queue.
 */

(function () {
  const queueList = document.getElementById('queue-list');

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function move(array, fromIndex, toIndex) {
    var arr = array.slice();
    var item = arr.splice(fromIndex, 1)[0];
    arr.splice(toIndex, 0, item);
    return arr;
  }

  function reorderQueue(orderedEntries) {
    fetch('/api/queue/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderedIds: orderedEntries.map(function (e) {
          return e.id;
        }),
      }),
    })
      .then(function (res) {
        return res.ok ? res.json() : res.json().then(Promise.reject);
      })
      .then(renderQueue)
      .catch(function () {
        alert('Failed to reorder. Try again.');
      });
  }

  function removeSinger(id) {
    if (!confirm('Remove this singer from the queue?')) return;
    fetch('/api/queue/' + encodeURIComponent(id), { method: 'DELETE' })
      .then(function (res) {
        return res.ok ? res.json() : res.json().then(Promise.reject);
      })
      .then(renderQueue)
      .catch(function () {
        alert('Failed to remove. Try again.');
      });
  }

  function setCurrentlySinging(id) {
    fetch('/api/queue/currently-singing', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id }),
    })
      .then(function (res) {
        return res.ok ? res.json() : res.json().then(Promise.reject);
      })
      .then(renderQueue)
      .catch(function () {
        alert('Failed to update. Try again.');
      });
  }

  function moveToBottom(id) {
    fetch('/api/queue/' + encodeURIComponent(id) + '/move-to-bottom', {
      method: 'POST',
    })
      .then(function (res) {
        return res.ok ? res.json() : res.json().then(Promise.reject);
      })
      .then(renderQueue)
      .catch(function () {
        alert('Failed to update. Try again.');
      });
  }

  function renderQueue(list) {
    entries = Array.isArray(list) ? list : entries;
    if (!entries.length) {
      queueList.innerHTML = '<li class="queue-empty">Queue is empty.</li>';
      return;
    }

    queueList.innerHTML = entries
      .map(function (e, i) {
        var upDisabled = i === 0 ? ' disabled' : '';
        var downDisabled = i === entries.length - 1 ? ' disabled' : '';
        var nowClass = e.isCurrentlySinging ? ' now-singing' : '';
        return (
          '<li data-id="' +
          escapeHtml(e.id) +
          '" class="' +
          nowClass +
          '">' +
          '<span class="position">' +
          (i + 1) +
          '</span>' +
          '<span class="name">' +
          escapeHtml(e.name) +
          (e.isCurrentlySinging ? ' <span class="now-badge">Now singing</span>' : '') +
          '</span>' +
          '<span class="host-actions">' +
          '<button type="button" class="btn-now secondary" data-action="now" aria-label="Mark as now singing">Now</button>' +
          '<button type="button" class="btn-done secondary" data-action="done" aria-label="Done, move to bottom">Done</button>' +
          '<button type="button" class="move-btn secondary" data-action="up" aria-label="Move up"' +
          upDisabled +
          '>↑</button>' +
          '<button type="button" class="move-btn secondary" data-action="down" aria-label="Move down"' +
          downDisabled +
          '>↓</button>' +
          '<button type="button" class="danger" data-action="remove" aria-label="Remove">Remove</button>' +
          '</span></li>'
        );
      })
      .join('');

    queueList.querySelectorAll('[data-action="now"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.closest('li').getAttribute('data-id');
        setCurrentlySinging(id);
      });
    });

    queueList.querySelectorAll('[data-action="done"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.closest('li').getAttribute('data-id');
        moveToBottom(id);
      });
    });

    queueList.querySelectorAll('[data-action="up"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var li = btn.closest('li');
        var id = li.getAttribute('data-id');
        var idx = entries.findIndex(function (e) {
          return e.id === id;
        });
        if (idx <= 0) return;
        var next = move(entries, idx, idx - 1);
        reorderQueue(next);
      });
    });

    queueList.querySelectorAll('[data-action="down"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var li = btn.closest('li');
        var id = li.getAttribute('data-id');
        var idx = entries.findIndex(function (e) {
          return e.id === id;
        });
        if (idx < 0 || idx >= entries.length - 1) return;
        var next = move(entries, idx, idx + 1);
        reorderQueue(next);
      });
    });

    queueList.querySelectorAll('[data-action="remove"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.closest('li').getAttribute('data-id');
        removeSinger(id);
      });
    });
  }

  var entries = [];

  function fetchQueue() {
    fetch('/api/queue')
      .then(function (res) {
        return res.ok ? res.json() : [];
      })
      .catch(function () {
        return [];
      })
      .then(function (data) {
        entries = data;
        renderQueue(entries);
      });
  }

  fetchQueue();
  setInterval(fetchQueue, 3000);
})();
