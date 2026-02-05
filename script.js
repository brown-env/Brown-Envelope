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
    }, 1100);
  }
}

if (homeFlap) {
  homeFlap.addEventListener('click', onFlapClick);
}

const contactEmailLink = document.querySelector('.contact-email');
if (contactEmailLink) {
  const mailtoHref = contactEmailLink.getAttribute('data-mailto');
  const gmailHref = contactEmailLink.getAttribute('data-gmail');
  const outlookHref = contactEmailLink.getAttribute('data-outlook');
  const mailtoFirstQuery = window.matchMedia('(max-width: 1600px)');

  contactEmailLink.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const openedAt = Date.now();

    if (mailtoFirstQuery.matches) {
      if (mailtoHref) {
        window.location.href = mailtoHref;
      }

      setTimeout(() => {
        if (document.hidden) return;
        if (Date.now() - openedAt < 800) {
          const gmailWindow = gmailHref ? window.open(gmailHref, '_blank', 'noopener') : null;
          if (!gmailWindow) {
            setTimeout(() => {
              if (document.hidden) return;
              if (outlookHref) {
                window.open(outlookHref, '_blank', 'noopener');
              }
            }, 200);
          }
        }
      }, 650);
    } else {
      const gmailWindow = gmailHref ? window.open(gmailHref, '_blank', 'noopener') : null;
      if (!gmailWindow) {
        const outlookWindow = outlookHref ? window.open(outlookHref, '_blank', 'noopener') : null;
        if (!outlookWindow) {
          if (mailtoHref) {
            window.location.href = mailtoHref;
          }
        }
      }
    }
  });
}
