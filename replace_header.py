import os
import re
import glob

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Remove the "x" button
    content = re.sub(r'<button class="mobile-nav-close[^>]*>.*?<i data-lucide="x"></i></button>\s*', '', content)

    new_header_right = """      <div class="header-right" style="display: flex; align-items: center; gap: 0.75rem;">
        <a href="login.html" id="auth-sign-in-btn" class="glass-btn btn-sm" style="display: none; white-space: nowrap;">Sign In</a>
        <div id="auth-profile-menu" style="display: none; position: relative;">
          <button id="profile-dropdown-btn" class="glass-btn" style="padding: 0.25rem 0.5rem; display: flex; align-items: center; gap: 0.5rem; border-radius: 20px; cursor: pointer;">
            <div id="auth-user-avatar" style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--color-blue), var(--color-turquoise)); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.95rem; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">?</div>
            <span id="auth-user-name" style="font-size: 0.9rem; font-weight: 600; color: var(--color-blue-dark); display: none; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"></span>
            <i data-lucide="chevron-down" style="width: 14px; height: 14px; color: var(--text-muted); margin-right: 0.25rem;"></i>
          </button>
          
          <div id="profile-dropdown-menu" class="glass-panel" style="display: none; position: absolute; top: calc(100% + 0.5rem); right: 0; min-width: 200px; z-index: 999; flex-direction: column; padding: 0.5rem; gap: 0.25rem; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border-radius: 12px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(12px);">
            <a href="profile.html" class="dropdown-item" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 8px; color: var(--text-color); text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: background 0.2s;">
              <i data-lucide="user" style="width: 16px; height: 16px; color: var(--color-blue);"></i> My Profile
            </a>
            <hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.05); margin: 0.25rem 0;">
            <button onclick="signOut()" class="dropdown-item" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 8px; color: var(--text-color); text-decoration: none; font-size: 0.9rem; font-weight: 500; background: none; border: none; cursor: pointer; width: 100%; text-align: left; transition: background 0.2s;">
              <i data-lucide="log-out" style="width: 16px; height: 16px; color: #ef4444;"></i> Sign Out
            </button>
          </div>
        </div>
        <button class="mobile-menu-btn" aria-label="Open Menu"><i data-lucide="menu"></i></button>
      </div>"""

    content = re.sub(r'<div class="header-right".*?</header>', new_header_right + '\n    </header>', content, flags=re.DOTALL)

    with open(filepath, 'w') as f:
        f.write(content)

for html_file in glob.glob('*.html'):
    if html_file != 'login.html':  # Don't modify login.html's header if it doesn't have one, or skip it
        process_file(html_file)
