import os

files = [
    'index.html',
    'treatment-plan.html',
    'billing.html',
    'files.html',
    'contacts.html',
    'session-book.html',
    'bcba.html',
    'client-hub.html',
    'get-started.html'
]

path = '/Users/flaviohinostroza/Desktop/TEST/LMS/aba-data'

for filename in files:
    filepath = os.path.join(path, filename)
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Add mobile menu button in header
    # Usually after brand-chip or before site-toggle
    if '<div class="header-right"></div>' in content:
         content = content.replace('<div class="header-right"></div>', '<div class="header-right"><button class="mobile-menu-btn" aria-label="Open Menu"><i data-lucide="menu"></i></button></div>')
    elif '<div class="header-right"' in content:
         # For session-book.html which has timer in header-right
         content = content.replace('<div class="header-right"', '<button class="mobile-menu-btn" aria-label="Open Menu" style="margin-left: auto; margin-right: 1rem;"><i data-lucide="menu"></i></button><div class="header-right"')

    # Add close button inside site-toggle
    if '<nav class="site-toggle"' in content:
        content = content.replace('<nav class="site-toggle"', '<nav class="site-toggle"><button class="mobile-nav-close btn-icon" aria-label="Close Menu"><i data-lucide="x"></i></button>')

    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Added mobile controls to {filename}")
