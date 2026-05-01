document.addEventListener('DOMContentLoaded', () => {
  initializeToggleBars();
  initializeMobileMenu();
  registerServiceWorker();
});

function initializeMobileMenu() {
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const closeBtn = document.querySelector('.mobile-nav-close');
  const navLinks = document.querySelectorAll('.site-toggle-link');

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      document.body.classList.add('menu-open');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.body.classList.remove('menu-open');
    });
  }

  // Close menu when a link is clicked
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      document.body.classList.remove('menu-open');
    });
  });
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(err => {
          console.log('ServiceWorker registration failed: ', err);
        });
    });
  }
}

function initializeToggleBars() {
  const toggleBars = document.querySelectorAll('.site-toggle, .view-toggle');

  toggleBars.forEach(toggleBar => {
    const links = Array.from(toggleBar.querySelectorAll('a, button'));
    if (links.length === 0) return;

    let slider = toggleBar.querySelector('.toggle-slider');
    if (!slider) {
      slider = document.createElement('span');
      slider.className = 'toggle-slider';
      toggleBar.prepend(slider);
    }

    const activeLink = toggleBar.querySelector('.active') || links[0];
    updateToggleSlider(toggleBar, activeLink);

    links.forEach(link => {
      link.addEventListener('click', event => {
        if (link.tagName.toLowerCase() === 'a' && link.classList.contains('active')) return;

        updateToggleSlider(toggleBar, link);

        if (link.tagName.toLowerCase() === 'a') {
          event.preventDefault();
          window.setTimeout(() => {
            window.location.href = link.href;
          }, 180);
        }
      });
    });
  });

  window.addEventListener('resize', () => {
    document.querySelectorAll('.site-toggle, .view-toggle').forEach(toggleBar => {
      const activeLink = toggleBar.querySelector('.active') || toggleBar.querySelector('a, button');
      if (activeLink) updateToggleSlider(toggleBar, activeLink);
    });
  });
}

function updateToggleSlider(toggleBar, link) {
  const slider = toggleBar.querySelector('.toggle-slider');
  if (!slider || !link) return;

  slider.classList.remove('is-shimmering');
  slider.classList.remove('is-flowing');
  // Force restart so the shimmer can replay on each movement.
  void slider.offsetWidth;
  slider.classList.add('is-flowing');
  slider.classList.add('is-shimmering');

  slider.style.width = `${link.offsetWidth}px`;
  slider.style.height = `${link.offsetHeight}px`;
  slider.style.transform = `translate(${link.offsetLeft}px, ${link.offsetTop}px)`;

  window.clearTimeout(slider._flowTimer);
  slider._flowTimer = window.setTimeout(() => {
    slider.classList.remove('is-flowing');
  }, 520);
}
