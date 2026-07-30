document.addEventListener('DOMContentLoaded', () => {
  initializeToggleBars();
  initializeMobileMenu();
  registerServiceWorker();
  initializeAuthUI();
  initializeProfileDropdown();
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

async function updateAuthUI(session) {
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
          nameEl.style.display = 'inline';
          
          if (window.PrysmAuth && typeof window.PrysmAuth.loadOrCreateProfile === 'function') {
            try {
              const profile = await window.PrysmAuth.loadOrCreateProfile(session.user);
              if (profile && profile.full_name) {
                nameEl.textContent = profile.full_name;
              }
            } catch (err) {
              console.warn('Failed to load profile for nav', err);
            }
          }
        }
      }
    }
  } else {
    if (authSignIn) authSignIn.style.display = 'inline-flex';
    if (authProfile) authProfile.style.display = 'none';
  }
}

/**
 * Nuclear Sign-Out — delegates to PrysmAuth for full cleanup.
 * Falls back to basic signOut if PrysmAuth isn't loaded.
 */
async function signOut() {
  if (window.PrysmAuth && window.PrysmAuth.nuclearSignOut) {
    await window.PrysmAuth.nuclearSignOut();
  } else {
    // Fallback: basic sign-out with storage clear
    if (window.supabaseClient) {
      await window.supabaseClient.auth.signOut();
    }
    try { localStorage.clear(); } catch(e) {}
    try { sessionStorage.clear(); } catch(e) {}

    // Unregister service workers
    if (navigator.serviceWorker) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) { await reg.unregister(); }
    }

    // Clear cache storage
    if (window.caches) {
      const keys = await caches.keys();
      for (const key of keys) { await caches.delete(key); }
    }

    window.location.href = 'index.html?signed_out=' + Date.now();
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

    // Listen for cache-cleared messages from SW
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data === 'CACHES_CLEARED') {
        console.log('Service Worker caches cleared.');
      }
    });

    window.addEventListener('load', () => {
      // Cache-busted SW registration with updated version
      navigator.serviceWorker.register('sw.js?v=16')
        .then(registration => {
          console.log('ServiceWorker registered:', registration.scope);
          
          // Periodically check for updates
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

        // For view-toggle buttons, delegate to switchMainPane
        if (link.tagName.toLowerCase() === 'button' && link.dataset.pane !== undefined) {
          event.preventDefault();
          if (typeof switchMainPane === 'function') {
            switchMainPane(parseInt(link.dataset.pane, 10));
          }
          return;
        }

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

function initializeProfileDropdown() {
  const btn = document.getElementById('profile-dropdown-btn');
  const menu = document.getElementById('profile-dropdown-menu');
  
  if (btn && menu) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.style.display = menu.style.display === 'none' || menu.style.display === '' ? 'flex' : 'none';
    });
    
    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target) && !menu.contains(e.target)) {
        menu.style.display = 'none';
      }
    });
  }
}
