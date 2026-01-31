const homeFlap = document.querySelector('.home-page .flap');
const homeEnvelope = document.querySelector('.home-page .envelope');
const homeCard = document.querySelector('.home-page .card');

let isOpen = false;
let animating = false;

function onFlapClick() {
  if (animating || !homeFlap || !homeEnvelope || !homeCard) return;

  if (!isOpen) {
    animating = true;

    // mark opening state (used for hover effects)
    homeEnvelope.classList.add('opening');

    // open flap
    homeFlap.classList.add('open-flap');

    // flap transition end
    const onFlapTransition = function (e) {
      if (e.propertyName !== 'transform') return;
      homeFlap.removeEventListener('transitionend', onFlapTransition);

      // pull envelope to reveal card
      homeEnvelope.classList.add('pull-envelope');

      const onEnvelopeEnd = function (ev) {
        if (ev.propertyName !== 'transform') return;
        homeEnvelope.removeEventListener('transitionend', onEnvelopeEnd);
        homeEnvelope.classList.remove('opening');
        animating = false;
        isOpen = true;

        // after 1 second, rotate the card
        setTimeout(() => {
          homeCard.classList.add('rotated');
        }, 1000);
      };

      homeEnvelope.addEventListener('transitionend', onEnvelopeEnd);
    };

    homeFlap.addEventListener('transitionend', onFlapTransition);

  } else {
    animating = true;

    // mark reclosing state (subtle hover)
    homeEnvelope.classList.add('reclosing');

    // reset card rotation
    homeCard.classList.remove('rotated');

    // wait for card to shrink/unrotate, then reseal envelope
    setTimeout(() => {
      homeEnvelope.classList.remove('pull-envelope');

      const onEnvelopeTransition = function (e) {
        if (e.propertyName !== 'transform') return;
        homeEnvelope.removeEventListener('transitionend', onEnvelopeTransition);
        homeEnvelope.classList.remove('reclosing');

        // close flap
        homeFlap.classList.remove('open-flap');

        const onFlapClose = function (ev) {
          if (ev.propertyName !== 'transform') return;
          homeFlap.removeEventListener('transitionend', onFlapClose);
          animating = false;
          isOpen = false;
        };

        homeFlap.addEventListener('transitionend', onFlapClose);
      };

      homeEnvelope.addEventListener('transitionend', onEnvelopeTransition);
    }, 600);
  }
}

if (homeFlap) {
  homeFlap.addEventListener('click', onFlapClick);
}

const musicPage = document.querySelector('.music-page');
if (musicPage) {
  const musicEnvelopes = Array.from(document.querySelectorAll('.music-page .music-envelope-container'));
  const smallScreenQuery = window.matchMedia('(max-width: 2599px)');

  const clearTouchHover = () => {
    musicEnvelopes.forEach((container) => container.classList.remove('touch-hover'));
  };

  musicEnvelopes.forEach((container) => {
    container.addEventListener('click', (e) => {
      if (!smallScreenQuery.matches) return;
      e.preventDefault();

      const isActive = container.classList.contains('touch-hover');
      clearTouchHover();
      if (!isActive) {
        container.classList.add('touch-hover');
      }
    });
  });

  window.addEventListener('resize', () => {
    if (!smallScreenQuery.matches) {
      clearTouchHover();
    }
  });
}

const bribeEmailLink = document.querySelector('.bribe-email');
if (bribeEmailLink) {
  const mailtoHref = 'mailto:brownenvelope.music@gmail.com';
  const gmailHref = 'https://mail.google.com/mail/?view=cm&fs=1&to=brownenvelope.music@gmail.com';
  const outlookHref = 'https://outlook.live.com/mail/0/deeplink/compose?to=brownenvelope.music@gmail.com';
  const smallScreenQuery = window.matchMedia('(max-width: 2599px)');

  bribeEmailLink.addEventListener('click', (e) => {
    e.preventDefault();

    const openedAt = Date.now();

    if (smallScreenQuery.matches) {
      window.location.href = mailtoHref;

      setTimeout(() => {
        if (document.hidden) return;
        if (Date.now() - openedAt < 800) {
          window.open(gmailHref, '_blank', 'noopener');
          setTimeout(() => {
            if (document.hidden) return;
            window.open(outlookHref, '_blank', 'noopener');
          }, 200);
        }
      }, 650);
    } else {
      const gmailWindow = window.open(gmailHref, '_blank', 'noopener');
      if (!gmailWindow) {
        const outlookWindow = window.open(outlookHref, '_blank', 'noopener');
        if (!outlookWindow) {
          window.location.href = mailtoHref;
        }
      } else {
        setTimeout(() => {
          if (document.hidden) return;
          if (Date.now() - openedAt < 800) {
            window.location.href = mailtoHref;
          }
        }, 650);
      }
    }
  });
}
