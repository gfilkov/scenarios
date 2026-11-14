(() => {
  const gallery        = document.getElementById('gallery');
  const settings       = document.getElementById('settings');
  const backdrop       = document.getElementById('backdrop');
  const closeBtn       = document.getElementById('closeSettings');
  const previewImg     = document.getElementById('settingsPreview');
  const txtText        = document.getElementById('txtText');
  const txtMessage     = document.getElementById('txtMessage');
  const txtColor       = document.getElementById('txtColor');
  const btnPlay        = document.getElementById('btnPlay');
  const btnCancel      = document.getElementById('btnCancel');

  let current = null; // currently selected scenario

  // --- 1. Load manifest ---
  async function loadManifest() {
      const res = await fetch('thumbnails/thumbnails.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('Failed to load thumbnails.json');
    return (await res.json()).thumbnails;
  }

  // --- 2. Render gallery ---
  function render(items) {
    gallery.innerHTML = '';
    for (const item of items) {
      const card = document.createElement('figure');
      card.className = 'thumb-card';
      card.dataset.id = item.id;

      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.title || item.id;
      img.loading = 'lazy';
      img.width = 500;
      img.height = 333;
      img.decoding = 'async';

      const cap = document.createElement('figcaption');
      cap.textContent = item.title || item.id;

      card.append(img, cap);
      card.addEventListener('click', () => openSettings(item));
      gallery.appendChild(card);
    }
  }

    function restoreScroll() {
        const id = localStorage.getItem('lastViewed');
        if (!id) return;

        const card = document.querySelector(`.thumb-card[data-id="${CSS.escape(id)}"]`);
        if (!card) return;   // stale id (manifest changed) — just ignore

        // Wait one frame so layout is settled before scrolling
        requestAnimationFrame(() => {
            card.scrollIntoView({ block: 'center', behavior: 'instant' });
            card.focus({ preventScroll: true });   // optional: keyboard users land there
            highlightCard(id);
        });
    }

    function highlightCard(id) {
        // id: just clicked card, current.id
        const idPrev = localStorage.getItem('lastViewed');

        // DEBUG
        console.log(`highlightCard(${id}); idPrev: ${idPrev}`);

        // remove highlight from previous card
        if (idPrev) {
            if (idPrev != id) {
                const cardPrev = document.querySelector(`.thumb-card[data-id="${CSS.escape(idPrev)}"]`);
                cardPrev.classList.remove("last-viewed");

                console.log(`cardPrev: ${cardPrev.innerText}`);
            }
        }

        const card = document.querySelector(`.thumb-card[data-id="${CSS.escape(id)}"]`);
        card.classList.add('last-viewed');  // highlight

        // Persist locally
        localStorage.setItem('lastViewed', id);   // thumbnail
    }

    // --- 3. Drawer open/close ---
    let prevCard;
  function openSettings(item) {
    current = item;
    previewImg.src = item.src;
    previewImg.alt = item.title || item.id;
    highlightCard(item.id);

    txtText.placeholder = current.scene;

    // Restore any per-scenario saved settings, else defaults
    const saved = JSON.parse(localStorage.getItem('settings:' + item.id) || 'null');
    txtText.value    = saved?.text ?? '';
    txtMessage.value = saved?.message ?? '';
      txtColor.value = saved?.color ?? '#00ff88';

      // do not restore Type, use recommended (optional in JSON)
      //const type = saved?.type ?? 'LED';
      let type = 'TTF';
      if (item.type)
          type = item.type;

      document.querySelector(`input[name="type"][value="${type}"]`).checked = true;

      const txtDescription = document.getElementById('txtDescription');
      txtDescription.value = item.description ?? '';

    settings.classList.add('open');
    settings.setAttribute('aria-hidden', 'false');
    backdrop.hidden = false;
    txtText.focus();
  }

    function closeSettings() {
        if (current) {
            const card = document.querySelector(`.thumb-card[data-id="${current.id}"]`);
            if (card) {
                card.setAttribute('tabindex', '0');  // Ensure focusability
                card.focus();
            }
        }

        settings.classList.remove('open');
        settings.setAttribute('aria-hidden', 'true');
        backdrop.hidden = true;
        current = null;
    }

  closeBtn.addEventListener('click', closeSettings);
  btnCancel.addEventListener('click', closeSettings);
  backdrop.addEventListener('click', closeSettings);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && current) closeSettings();
  });

  // --- 4. Play / save ---
    btnPlay.addEventListener('click', () => {
        if (!current) return;

        //// default text to scene
        //if (!txtText.value)
        //    txtText.value = current.scene;

        const payload = {
            scene: current.scene,                    // e.g. "birds"
            text: txtText.value,
            message: txtMessage.value,
            color: txtColor.value,
            type: document.querySelector('input[name="type"]:checked').value
        };

        // Persist locally as before (nice to have)
////        localStorage.setItem('lastViewed', current.id);   // thumbnail
        localStorage.setItem('settings:' + current.id, JSON.stringify(payload));   // thumbnail settings

        // Navigate to the Play page with query parameters
        const qs = new URLSearchParams(payload).toString();
        window.location.href = `Play.html?${qs}`;
    });

  // --- 5. Boot ---
  loadManifest()
      .then(items => {
          render(items);
          restoreScroll();
      })
    .catch(err => {
      console.error(err);
      gallery.innerHTML = '<p style="color:#f66">Could not load thumbnails.</p>';
    });
})();