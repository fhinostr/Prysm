import os
import re
import glob

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Remove the "x" button
    content = re.sub(r'<button class="mobile-nav-close[^>]*>.*?<i data-lucide="x"></i></button>\s*', '', content)

    # 2. Update header-right
    new_header_right = """      <div class="header-right" style="display: flex; align-items: center; gap: 0.75rem;">
        <a href="login.html" id="auth-sign-in-btn" class="glass-btn btn-sm" style="display: none; white-space: nowrap;">Sign In</a>
        <div id="auth-profile-menu" style="display: none; align-items: center; gap: 0.5rem;">
          <div id="auth-user-avatar" style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--color-blue), var(--color-turquoise)); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1rem; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">?</div>
          <span id="auth-user-name" style="font-size: 0.9rem; font-weight: 600; color: var(--color-blue-dark); display: none;"></span>
          <button class="glass-btn btn-sm" onclick="signOut()" title="Sign Out" style="padding: 0.5rem;" aria-label="Sign Out"><i data-lucide="log-out"></i></button>
        </div>
        <button class="mobile-menu-btn" aria-label="Open Menu"><i data-lucide="menu"></i></button>
      </div>"""

    content = re.sub(r'<div class="header-right">.*?</div>', new_header_right, content, flags=re.DOTALL)

    with open(filepath, 'w') as f:
        f.write(content)

for html_file in glob.glob('*.html'):
    if html_file != 'login.html':  # Don't modify login.html's header if it doesn't have one, or skip it
        process_file(html_file)
