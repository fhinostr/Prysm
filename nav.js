document.addEventListener('DOMContentLoaded', () => {
  initializeToggleBars();
  initializeMobileMenu();
  registerServiceWorker();
  initializeAuthUI();
});

function initializeAuthUI() {
  if (window.supabaseClient) {
    window.supabaseClient.auth.getSession().then(({ data: { session } }) => {
      updateAuthUI(session);
    });

    window.supabaseClient.auth.onAuthStateChange((event, session) => {
      updateAuthUI(session);
    });
  }
}

function updateAuthUI(session) {
  const authProfile = document.getElementById('auth-profile-menu');
  const authSignIn = document.getElementById('auth-sign-in-btn');
  
  if (session) {
    if (authSignIn) authSignIn.style.display = 'none';
    if (authProfile) {
      authProfile.style.display = 'flex';
      const avatar = document.getElementById('auth-user-avatar');
      const nameEl = document.getElementById('auth-user-name');
      const email = session.user.email;
      if (email) {
        if (avatar) avatar.textContent = email.charAt(0).toUpperCase();
        if (nameEl) {
          nameEl.textContent = email.split('@')[0];
          nameEl.style.display = 'inline'; // Show name on larger screens if desired, but we keep it hidden by default in CSS if space is tight.
        }
      }
    }
  } else {
    if (authSignIn) authSignIn.style.display = 'inline-flex';
    if (authProfile) authProfile.style.display = 'none';
  }
}

async function signOut() {
  if (window.supabaseClient) {
    await window.supabaseClient.auth.signOut();
    window.location.href = 'index.html';
  }
}

function initializeMobileMenu() {
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const closeBtn = document.querySelector('.mobile-nav-close');
  const navLinks = document.querySelectorAll('.site-toggle-link');

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      document.body.classList.add('menu-open');
      
      // Sync slider position when menu opens
      const siteToggle = document.querySelector('.site-toggle');
      if (siteToggle) {
        const activeLink = siteToggle.querySelector('.active') || siteToggle.querySelector('a');
        if (activeLink) {
          // Sync slider after the overlay animation has completed for perfect positioning
          setTimeout(() => updateToggleSlider(siteToggle, activeLink), 450);
        }
      }
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
    // 1. Force a reload when a new service worker takes control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        window.location.reload();
        refreshing = true;
      }
    });

    window.addEventListener('load', () => {
      // 2. Add version query to force the browser to check for a new script
      navigator.serviceWorker.register('sw.js?v=4')
        .then(registration => {
          console.log('ServiceWorker registered:', registration.scope);
          
          // 3. Periodically check for updates
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour
        })
        .catch(err => {
          console.error('ServiceWorker failed:', err);
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
