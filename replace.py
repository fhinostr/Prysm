import re

with open("index.html", "r", encoding="utf-8") as f:
    text = f.read()

def replacer(match):
    # match.group(1) is the identifier e.g. "ta-shoes"
    # match.group(2) is the target-details class "target-details" or "target-details warning-details"
    # match.group(3) is the inner html contents
    
    target_id = match.group(1)
    classes = match.group(2) + " target-menu"
    inner = match.group(3)
    
    return f"""<button class="btn-info" onclick="toggleMenu('menu-{target_id}')" aria-label="Target Menu">
                <i data-lucide="more-vertical"></i>
              </button>
            </div>
          </header>
          
          <div class="{classes}" id="menu-{target_id}" style="display: none;">
            <div class="menu-tabs">
              <button class="menu-tab" onclick="switchTab(event, 'menu-{target_id}', 'data')">Data</button>
              <button class="menu-tab active" onclick="switchTab(event, 'menu-{target_id}', 'info')">Info</button>
              <button class="menu-tab" onclick="switchTab(event, 'menu-{target_id}', 'notes')">Notes</button>
            </div>
            
            <div class="tab-content data-content" style="display: none;">
              <div class="past-data">
                <h4>Last 3 Sessions</h4>
                <div class="mini-graph">
                  <div class="bar-container"><div class="bar" style="height: 60%;" title="Session -3"><span>60%</span></div></div>
                  <div class="bar-container"><div class="bar" style="height: 80%;" title="Session -2"><span>80%</span></div></div>
                  <div class="bar-container"><div class="bar" style="height: 100%;" title="Last Session"><span>100%</span></div></div>
                </div>
              </div>
              <button class="glass-btn btn-primary btn-sm btn-graph-current" onclick="graphCurrentData('{target_id}')">
                <i data-lucide="line-chart"></i> Graph Current Session
              </button>
            </div>
            
            <div class="tab-content info-content active">
{inner}
            </div>
            
            <div class="tab-content notes-content" style="display: none;">
              <textarea class="glass-textarea" placeholder="Leave notes for the BCBA regarding this target..."></textarea>
              <button class="glass-btn btn-primary btn-sm" onclick="saveNote('{target_id}', event)">Save Note</button>
            </div>
          </div>"""

# Ensure we use an explicit and precise regex.
pattern = re.compile(
    r'<button class="btn-info" onclick="toggleDetails\(\'details-([^\']+)\'\)" aria-label="Review Target Info">\s*'
    r'<i data-lucide="info"></i>\s*'
    r'</button>\s*'
    r'</div>\s*'
    r'</header>\s*'
    r'<div class="([^"]+)" id="details-\1" style="display: none;">\s*(.*?)\s*</div>',
    re.DOTALL
)

new_text = pattern.sub(replacer, text)

with open("index.html", "w", encoding="utf-8") as f:
    f.write(new_text)

print("Replacement complete. Targets successfully updated.")
