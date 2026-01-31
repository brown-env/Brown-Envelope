const flap = document.querySelector('.flap');
const envelope = document.querySelector('.envelope');
const card = document.querySelector('.card');

let isOpen = false;
let animating = false;

function onFlapClick() {
  if (animating) return;

  if (!isOpen) {
    animating = true;

    // mark opening state (used for hover effects)
    envelope.classList.add('opening');

    // open flap
    flap.classList.add('open-flap');

    // flap transition end
    const onFlapTransition = function (e) {
      if (e.propertyName !== 'transform') return;
      flap.removeEventListener('transitionend', onFlapTransition);

      // pull envelope to reveal card
      envelope.classList.add('pull-envelope');

      const onEnvelopeEnd = function (ev) {
        if (ev.propertyName !== 'transform') return;
        envelope.removeEventListener('transitionend', onEnvelopeEnd);
        envelope.classList.remove('opening');
        animating = false;
        isOpen = true;

        // after 1 second, rotate the card
        setTimeout(() => {
          card.classList.add('rotated');
        }, 1000);
      };

      envelope.addEventListener('transitionend', onEnvelopeEnd);
    };

    flap.addEventListener('transitionend', onFlapTransition);

  } else {
    animating = true;

    // mark reclosing state (subtle hover)
    envelope.classList.add('reclosing');

    // reset card rotation
    card.classList.remove('rotated');

    // wait for card to shrink/unrotate, then reseal envelope
    setTimeout(() => {
      envelope.classList.remove('pull-envelope');

      const onEnvelopeTransition = function (e) {
        if (e.propertyName !== 'transform') return;
        envelope.removeEventListener('transitionend', onEnvelopeTransition);
        envelope.classList.remove('reclosing');

        // close flap
        flap.classList.remove('open-flap');

        const onFlapClose = function (ev) {
          if (ev.propertyName !== 'transform') return;
          flap.removeEventListener('transitionend', onFlapClose);
          animating = false;
          isOpen = false;
        };

        flap.addEventListener('transitionend', onFlapClose);
      };

      envelope.addEventListener('transitionend', onEnvelopeTransition);
    }, 600);
  }
}

if (flap && envelope && card) {
  flap.addEventListener('click', onFlapClick);
}

const embeddedFrames = document.querySelectorAll('iframe[src]');
if (embeddedFrames.length > 0) {
  const ensureResourceHint = (origin, rel) => {
    const selector = `link[rel="${rel}"][href="${origin}"]`;
    if (document.head.querySelector(selector)) return;
    const link = document.createElement('link');
    link.rel = rel;
    link.href = origin;
    document.head.appendChild(link);
  };

  embeddedFrames.forEach((frame) => {
    try {
      const url = new URL(frame.src, window.location.href);
      ensureResourceHint(url.origin, 'preconnect');
      ensureResourceHint(url.origin, 'dns-prefetch');
    } catch {
      // ignore invalid URLs
    }

    frame.setAttribute('loading', 'eager');
    frame.setAttribute('fetchpriority', 'high');
  });
}
