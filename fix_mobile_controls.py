import os
import re

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
    
    # Fix the broken nav tag
    content = re.sub(r'<nav class="site-toggle"><button[^>]*>.*?</button>\s*aria-label="Site Navigation">', r'<nav class="site-toggle" aria-label="Site Navigation"><button class="mobile-nav-close btn-icon" aria-label="Close Menu"><i data-lucide="x"></i></button>', content, flags=re.DOTALL)
    
    # If it was already clean but missing button (unlikely now)
    if '<button class="mobile-nav-close' not in content:
        content = content.replace('<nav class="site-toggle" aria-label="Site Navigation">', '<nav class="site-toggle" aria-label="Site Navigation"><button class="mobile-nav-close btn-icon" aria-label="Close Menu"><i data-lucide="x"></i></button>')

    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Fixed mobile controls in {filename}")
