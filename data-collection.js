// ═══════════════════════════════════════════════════════════════
// PRYSM ABA — Data Collection & Session Tracking Module
// data-collection.js
//
// ACCESS RESTRICTION: This module is ONLY visible to Dawenn's login.
// Detection: window.PRYSM_USER.email.includes('dawenn') or
//            auth_id === 'f372230c-d8d3-4f75-9c11-76c119a26111'
// ═══════════════════════════════════════════════════════════════

'use strict';

// ── IDENTITY GUARD ────────────────────────────────────────────
const DAWENN_EMAIL_FRAGMENT = 'dawenn';
const DAWENN_AUTH_ID        = 'f372230c-d8d3-4f75-9c11-76c119a26111';
const DAWENN_DEMO_ID        = 'dawenn-demo-id';

// ── DEMO DATA ─────────────────────────────────────────────────
const DEMO_CLIENTS = [
  {
    id: 'CLT-001',
    full_name: 'Ethan Rodriguez',
    date_of_birth: '2018-03-15',
    age: 7,
    diagnosis: 'ASD Level 2',
    insurance: 'Blue Cross Blue Shield',
    status: 'active',
    programs: [
      { id: 'TGT-A', name: 'Manding for Items', promptLevel: 'Partial Physical', scores: [], correct: 0, total: 0 },
      { id: 'TGT-B', name: 'Following 2-Step Directions', promptLevel: 'Verbal', scores: [], correct: 0, total: 0 },
      { id: 'TGT-C', name: 'Greeting Peers', promptLevel: 'Gestural', scores: [], correct: 0, total: 0 },
    ],
    behaviors: [
      { id: 'BHV-A', name: 'Aggression', count: 0 },
      { id: 'BHV-B', name: 'Elopement', count: 0 },
    ],
    historyPct: [62, 70, 75, 80, 78]
  },
  {
    id: 'CLT-002',
    full_name: 'Sophia Chen',
    date_of_birth: '2017-06-22',
    age: 8,
    diagnosis: 'ASD Level 1',
    insurance: 'Aetna',
    status: 'active',
    programs: [
      { id: 'TGT-D', name: 'Conversation Turn-Taking', promptLevel: 'Verbal', scores: [], correct: 0, total: 0 },
      { id: 'TGT-E', name: 'Requesting Break', promptLevel: 'Independent', scores: [], correct: 0, total: 0 },
    ],
    behaviors: [
      { id: 'BHV-C', name: 'Self-Injury', count: 0 },
    ],
    historyPct: [55, 60, 72, 68, 80]
  },
  {
    id: 'CLT-003',
    full_name: 'Liam Thompson',
    date_of_birth: '2019-11-08',
    age: 5,
    diagnosis: 'ASD Level 3',
    insurance: 'United Health',
    status: 'active',
    programs: [
      { id: 'TGT-F', name: 'Eye Contact on Demand', promptLevel: 'Full Physical', scores: [], correct: 0, total: 0 },
      { id: 'TGT-G', name: 'Tolerating Touch', promptLevel: 'Partial Physical', scores: [], correct: 0, total: 0 },
    ],
    behaviors: [
      { id: 'BHV-D', name: 'Tantrum', count: 0 },
      { id: 'BHV-E', name: 'Property Destruction', count: 0 },
    ],
    historyPct: [30, 38, 42, 50, 55]
  },
  {
    id: 'CLT-004',
    full_name: 'Mia Johnson',
    date_of_birth: '2016-02-14',
    age: 9,
    diagnosis: 'ADHD',
    insurance: 'Cigna',
    status: 'active',
    programs: [
      { id: 'TGT-H', name: 'On-Task Behavior', promptLevel: 'Verbal', scores: [], correct: 0, total: 0 },
      { id: 'TGT-I', name: 'Raising Hand', promptLevel: 'Gestural', scores: [], correct: 0, total: 0 },
    ],
    behaviors: [
      { id: 'BHV-F', name: 'Out of Seat', count: 0 },
    ],
    historyPct: [45, 55, 60, 70, 75]
  },
  {
    id: 'CLT-005',
    full_name: 'Noah Williams',
    date_of_birth: '2020-05-30',
    age: 4,
    diagnosis: 'ASD Level 2',
    insurance: 'Medicaid',
    status: 'active',
    programs: [
      { id: 'TGT-J', name: 'Imitation: Motor', promptLevel: 'Model', scores: [], correct: 0, total: 0 },
      { id: 'TGT-K', name: 'Attending to Name', promptLevel: 'Partial Physical', scores: [], correct: 0, total: 0 },
    ],
    behaviors: [
      { id: 'BHV-G', name: 'Aggression', count: 0 },
    ],
    historyPct: [20, 30, 40, 48, 55]
  }
];

// ── AVATAR COLORS ─────────────────────────────────────────────
const AVATAR_COLORS = [
  'linear-gradient(135deg,#20b2aa,#0288d1)',
  'linear-gradient(135deg,#7c5ecf,#3b82f6)',
  'linear-gradient(135deg,#10b981,#0288d1)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#ec4899,#8b5cf6)',
];

function avatarColor(name) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function initials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ═══════════════════════════════════════════════════════════════
// MAIN MANAGER
// ═══════════════════════════════════════════════════════════════
const DCManager = {

  // ── STATE ────────────────────────────────────────────────────
  mode: 'group',                // Always use grid mode!
  allClients: [],               // master roster (demo data)
  sessionClients: [],           // clients added to individual session list
  activeClientId: null,         // currently focused individual client
  groupClients: [],             // up to 5 clients in active group
  activeGroupName: null,
  savedTemplates: [],           // [{name, type, clients[]}]
  abcEvents: [],                // ABC log entries
  abcIntensity: 3,
  targetTags: [],               // new client form tags
  assignedClientIds: new Set(), // group modal selections

  // Timers
  globalRunning: false,
  globalSeconds: 0,
  globalIntervalId: null,
  indRunning: false,
  indSeconds: 0,
  indIntervalId: null,
  clientTimers: {},             // { clientId: { seconds, running, intervalId } }
  intervalDuration: 10,        // global interval sync (seconds)
  intervalElapsed: 0,
  intervalRunning: false,
  intervalSyncId: null,
  intervalBeepId: null,

  // ── INIT ─────────────────────────────────────────────────────
  init() {
    // Load demo client data
    this.allClients = JSON.parse(JSON.stringify(DEMO_CLIENTS));

    // Load saved templates from localStorage
    try {
      const saved = localStorage.getItem('prysm_dc_templates');
      if (saved) this.savedTemplates = JSON.parse(saved);
    } catch(e) {}

    // Check if redirected from main Client Hub with a selected client in the URL
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const launchClientId = urlParams.get('client');
      
      if (launchClientId) {
        
        const storedProfiles = JSON.parse(localStorage.getItem('prysm_client_profiles') || '[]');
        const targetProfile = storedProfiles.find(c => c.id === launchClientId);
        
        if (targetProfile) {
          // Helper to convert a hub profile into a Data Collection client
          const mapProfileToDcClient = (p) => {
            if (this.allClients.some(c => c.id === p.id)) return null;
            
            let allTargets = [];
            if (typeof loadProgramData === 'function') {
              const memberProgramsData = loadProgramData(p.id).targets;
              const groupProgramsData = targetProfile.type === 'group' ? loadProgramData(targetProfile.id).targets : [];
              allTargets = [...memberProgramsData, ...groupProgramsData];
            }
            
            const uniqueTargets = Array.from(new Map(allTargets.map(item => [item.id, item])).values());
            
            const programs = uniqueTargets.filter(t => t.domain === 'skill').map(t => ({
              id: t.id,
              name: t.name,
              promptLevel: 'Independent', // Default starting prompt
              correct: 0,
              total: 0,
              scores: [],
              measurementType: t.measurementType
            }));

            const behaviors = uniqueTargets.filter(t => t.domain === 'problem').map(t => ({
              id: t.id,
              name: t.name,
              count: 0,
              measurementType: t.measurementType
            }));

            if (programs.length === 0) programs.push({ id: `TGT-NEW-${Date.now()}-${Math.random()}`, name: 'Skill Acquisition Protocol', promptLevel: 'Partial Physical', correct: 0, total: 0, scores: [] });
            if (behaviors.length === 0) behaviors.push({ id: `BHV-NEW-${Date.now()}-${Math.random()}`, name: 'Disruption', count: 0 });

            return {
              id: p.id,
              full_name: p.name,
              date_of_birth: p.dob || '',
              age: p.dob ? Math.floor((Date.now() - new Date(p.dob)) / 3.156e10) : 0,
              diagnosis: p.diagnosis || 'Pending Setup',
              insurance: 'Unspecified',
              status: 'active',
              programs,
              behaviors,
              historyPct: [50, 60, 65, 70]
            };
          };

          if (targetProfile.type === 'group') {
            this.mode = 'group';
            this.activeGroupName = targetProfile.name || 'Active Group Cohort';
            const memberIds = targetProfile.members || [];
            
            // For a group, push all members into groupClients
            memberIds.forEach(mId => {
              const memProfile = storedProfiles.find(c => c.id === mId);
              if (memProfile) {
                const existing = this.allClients.find(c => c.id === mId);
                if (existing) {
                  this.groupClients.push(existing);
                } else {
                  const newClient = mapProfileToDcClient(memProfile);
                  if (newClient) {
                    this.allClients.push(newClient);
                    this.groupClients.push(newClient);
                  }
                }
              }
            });
          } else {
            // Force Grid Mode for Individual Sessions too!
            this.mode = 'group';
            this.activeGroupName = targetProfile.name || 'Individual Session';
            
            let clientToLoad = this.allClients.find(c => c.id === targetProfile.id);
            if (!clientToLoad) {
              clientToLoad = mapProfileToDcClient(targetProfile);
              if (clientToLoad) this.allClients.push(clientToLoad);
            }
            if (clientToLoad) {
              this.groupClients.push(clientToLoad);
            }
          }
        } else {
          // No client ID in URL -> fallback to grid with demo client
          this.activeGroupName = 'Individual Session';
          this.groupClients.push(this.allClients[0]); // Jane Doe
        }
      } else {
        this.activeGroupName = 'Individual Session';
        this.groupClients.push(this.allClients[0]);
      }
    } catch(e) {
        this.activeGroupName = 'Individual Session';
        if(this.groupClients.length === 0) this.groupClients.push(this.allClients[0]);
    }

    // Start global session clock
    this._startGlobalClock();

    // Setup initial DOM state based on mode
    if (this.mode === 'group') {
      const indPane = document.getElementById('dc-pane-individual');
      if(indPane) indPane.style.display = 'none';
      
      const grpPane = document.getElementById('dc-pane-group');
      if(grpPane) grpPane.style.display = 'flex';
      
      const b2 = document.getElementById('btn-mode-grp');
      const b1 = document.getElementById('btn-mode-ind');
      if (b2) b2.classList.add('active');
      if (b1) b1.classList.remove('active');
    }

    // Populate individual client chips with empty state
    this._renderIndividualClientChips();
    this._renderGroupChips();
    this._renderBatchClientSelect();
    
    if (this.mode === 'group') {
      this._renderGroupGrid();
    } else if (this.activeClientId) {
      this.setActiveClient(this.activeClientId);
    }

    // Pre-populate assign list
    this._renderAssignList('');

    // Pre-populate search results with all clients
    this._renderSearchResults('');

    // Lucide icons re-init after DOM mutations
    setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 100);
  },

  // ── ACCESS CHECK (Dawenn only) ────────────────────────────────
  checkAccess() {
    const user = window.PRYSM_USER;
    if (!user) return false;
    const emailMatch = (user.email || '').toLowerCase().includes(DAWENN_EMAIL_FRAGMENT);
    const idMatch = user.id === DAWENN_AUTH_ID || user.id === DAWENN_DEMO_ID;
    return emailMatch || idMatch;
  },

  // ── GLOBAL SESSION CLOCK ──────────────────────────────────────
  _startGlobalClock() {
    const tick = () => {
      if (this.globalRunning) {
        this.globalSeconds++;
        document.getElementById('dc-clock-display').textContent = this._formatTime(this.globalSeconds);
      }
    };
    this.globalIntervalId = setInterval(tick, 1000);
  },

  toggleGlobalSession() {
    this.globalRunning = !this.globalRunning;
    const icon = document.getElementById('icon-global-toggle');
    if (icon) {
      icon.setAttribute('data-lucide', this.globalRunning ? 'pause' : 'play');
      if (window.lucide) lucide.createIcons();
    }
  },

  // ── INDIVIDUAL TIMER ──────────────────────────────────────────
  toggleIndTimer() {
    this.indRunning = !this.indRunning;
    if (this.indRunning && !this.indIntervalId) {
      this.indIntervalId = setInterval(() => {
        if (this.indRunning) {
          this.indSeconds++;
          const el = document.getElementById('dc-ind-timer');
          if (el) el.textContent = this._formatTime(this.indSeconds);
        }
      }, 1000);
    }
    const btn = document.getElementById('dc-ind-timer-toggle');
    const icon = document.getElementById('icon-ind-timer');
    if (btn) btn.classList.toggle('running', this.indRunning);
    if (icon) {
      icon.setAttribute('data-lucide', this.indRunning ? 'pause' : 'play');
      if (window.lucide) lucide.createIcons();
    }
  },

  resetIndTimer() {
    this.indRunning = false;
    this.indSeconds = 0;
    clearInterval(this.indIntervalId);
    this.indIntervalId = null;
    const el = document.getElementById('dc-ind-timer');
    if (el) el.textContent = '00:00:00';
    const btn = document.getElementById('dc-ind-timer-toggle');
    if (btn) btn.classList.remove('running');
  },

  // ── MODE SWITCH ───────────────────────────────────────────────
  switchMode(mode) {
    this.mode = mode;
    const paneInd   = document.getElementById('dc-pane-individual');
    const paneGroup = document.getElementById('dc-pane-group');
    const btnInd    = document.getElementById('btn-mode-individual');
    const btnGroup  = document.getElementById('btn-mode-group');

    if (mode === 'individual') {
      paneInd.style.display   = 'flex';
      paneGroup.style.display = 'none';
      btnInd.classList.add('active');
      btnGroup.classList.remove('active');
    } else {
      paneInd.style.display   = 'none';
      paneGroup.style.display = 'flex';
      btnInd.classList.remove('active');
      btnGroup.classList.add('active');
    }

    // Re-init toggle slider
    if (window.initializeToggleBars) {
      setTimeout(initializeToggleBars, 50);
    }
  },

  // ── CLIENT DRAWER ─────────────────────────────────────────────
  openAddClientDrawer() {
    document.getElementById('dc-client-drawer').classList.add('open');
    document.getElementById('dc-client-drawer-overlay').classList.add('open');
    this._renderSearchResults('');
  },

  closeClientDrawer() {
    document.getElementById('dc-client-drawer').classList.remove('open');
    document.getElementById('dc-client-drawer-overlay').classList.remove('open');
  },

  searchClients(query) {
    this._renderSearchResults(query);
  },

  _renderSearchResults(query) {
    const container = document.getElementById('dc-client-search-results');
    if (!container) return;
    const q = (query || '').toLowerCase();
    const filtered = this.allClients.filter(c =>
      c.full_name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
    if (filtered.length === 0) {
      container.innerHTML = '<div class="dc-abc-empty">No clients found.</div>';
      return;
    }
    container.innerHTML = filtered.map(c => `
      <div class="dc-search-result-item" onclick="DCManager.addClientToSession('${c.id}')">
        <div class="dc-sri-avatar" style="background:${avatarColor(c.full_name)}">${initials(c.full_name)}</div>
        <div>
          <div class="dc-sri-name">${this._esc(c.full_name)}</div>
          <div class="dc-sri-meta">${this._esc(c.diagnosis)} · ${c.age} yrs</div>
        </div>
        <button class="dc-sri-add-btn" onclick="event.stopPropagation();DCManager.addClientToSession('${c.id}')">
          + Add
        </button>
      </div>
    `).join('');
  },

  addClientToSession(clientId) {
    if (this.sessionClients.find(c => c.id === clientId)) {
      this.toast('Client already in session', 'warning');
      return;
    }
    const client = this.allClients.find(c => c.id === clientId);
    if (!client) return;
    this.sessionClients.push(client);
    this.closeClientDrawer();
    this._renderIndividualClientChips();
    this.setActiveClient(clientId);
    this.toast(`${client.full_name} added to session`, 'success');
  },

  _renderIndividualClientChips() {
    const container = document.getElementById('dc-client-chips');
    if (!container) return;

    if (this.sessionClients.length === 0) {
      container.innerHTML = '<span style="font-size:0.75rem;color:var(--color-text-light);opacity:0.6;">No clients added yet.</span>';
      this._showIndividualEmpty(true);
      return;
    }

    container.innerHTML = this.sessionClients.map(c => `
      <div class="dc-client-chip ${c.id === this.activeClientId ? 'active' : ''}"
           onclick="DCManager.setActiveClient('${c.id}')">
        <div style="width:20px;height:20px;border-radius:50%;background:${avatarColor(c.full_name)};
                    color:white;display:flex;align-items:center;justify-content:center;
                    font-size:0.55rem;font-weight:700;">${initials(c.full_name)}</div>
        ${this._esc(c.full_name.split(' ')[0])}
        <button class="dc-client-chip-remove" onclick="event.stopPropagation();DCManager.removeClientFromSession('${c.id}')"
                title="Remove">✕</button>
      </div>
    `).join('');
  },

  removeClientFromSession(clientId) {
    this.sessionClients = this.sessionClients.filter(c => c.id !== clientId);
    if (this.activeClientId === clientId) {
      this.activeClientId = this.sessionClients[0]?.id || null;
    }
    this._renderIndividualClientChips();
    if (this.activeClientId) {
      this.setActiveClient(this.activeClientId);
    } else {
      this._showIndividualEmpty(true);
    }
  },

  setActiveClient(clientId) {
    this.activeClientId = clientId;
    this._renderIndividualClientChips();
    this._showIndividualEmpty(false);
    this._renderIndividualWorkspace(clientId);
  },

  _showIndividualEmpty(show) {
    const empty = document.getElementById('dc-individual-empty');
    const workspace = document.getElementById('dc-individual-workspace');
    if (empty) empty.style.display = show ? 'flex' : 'none';
    if (workspace) workspace.style.display = show ? 'none' : 'flex';
  },

  _renderIndividualWorkspace(clientId) {
    const client = this.sessionClients.find(c => c.id === clientId);
    if (!client) return;

    // Header
    const avatar = document.getElementById('dc-ind-avatar');
    const name   = document.getElementById('dc-ind-name');
    const diag   = document.getElementById('dc-ind-diagnosis');
    const age    = document.getElementById('dc-ind-age');

    if (avatar) { avatar.textContent = initials(client.full_name); avatar.style.background = avatarColor(client.full_name); }
    if (name)   name.textContent = client.full_name;
    if (diag)   diag.textContent = client.diagnosis;
    if (age)    age.textContent  = `Age ${client.age}`;

    // Render targets
    this._renderSkillTargets(client);
    this._renderBehaviorGrid(client);
    this._renderMiniGraphs(client);
    this._renderABCLog();
    this._updateCounts(client);

    // Re-run Lucide
    setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 60);
  },

  // ── SKILL TARGETS ─────────────────────────────────────────────
  setTargetView(view) {
    ['discrete','task','interval'].forEach(v => {
      const btn = document.getElementById(`btn-view-${v}`);
      if (btn) btn.classList.toggle('active', v === view);
    });
    const client = this.sessionClients.find(c => c.id === this.activeClientId);
    if (client) this._renderSkillTargets(client, view);
  },

  _renderSkillTargets(client, view = 'discrete') {
    const container = document.getElementById('dc-skill-targets-list');
    if (!container) return;

    const PROMPT_LEVELS = ['Indep.', 'Verbal', 'Gesture', 'Model', 'Part. Phys.', 'Full Phys.'];

    if (!client.programs || client.programs.length === 0) {
      container.innerHTML = '<div class="dc-abc-empty">No active targets. Add targets to this client\'s program.</div>';
      return;
    }

    container.innerHTML = client.programs.map((prog, pi) => {
      const pct = prog.total > 0 ? Math.round((prog.correct / prog.total) * 100) : 0;

      if (view === 'discrete') {
        return `
          <div class="dc-target-row" id="target-row-${prog.id}">
            <div class="dc-target-info">
              <div class="dc-target-name">${this._esc(prog.name)}</div>
              <div class="dc-target-prompt">${prog.promptLevel}</div>
            </div>
            <div class="dc-target-score-strip">
              <button class="dc-score-btn dc-score-btn-minus"
                      onclick="DCManager.scoreTarget('${client.id}',${pi},'incorrect')"
                      aria-label="Mark incorrect">−</button>
              <div>
                <div class="dc-score-tally" id="tally-${prog.id}">${prog.correct}/${prog.total}</div>
                <div class="dc-score-pct" id="pct-${prog.id}">${pct}%</div>
              </div>
              <button class="dc-score-btn dc-score-btn-plus"
                      onclick="DCManager.scoreTarget('${client.id}',${pi},'correct')"
                      aria-label="Mark correct">+</button>
            </div>
          </div>`;
      } else if (view === 'task') {
        return `
          <div class="dc-target-row" id="target-row-${prog.id}">
            <div class="dc-target-info">
              <div class="dc-target-name">${this._esc(prog.name)}</div>
              <div class="dc-target-prompt">Task Analysis — select prompt level:</div>
            </div>
            <div class="dc-prompt-pills">
              ${PROMPT_LEVELS.map(lvl => `
                <button class="dc-prompt-pill ${prog.promptLevel === lvl || prog.promptLevel.startsWith(lvl.replace('.','')) ? 'active' : ''}"
                        onclick="DCManager.setPromptLevel('${client.id}',${pi},'${lvl}')">${lvl}</button>
              `).join('')}
            </div>
          </div>`;
      } else {
        // interval view — yes/no per interval
        return `
          <div class="dc-target-row" id="target-row-${prog.id}">
            <div class="dc-target-info">
              <div class="dc-target-name">${this._esc(prog.name)}</div>
              <div class="dc-target-prompt">Interval — mark occurrence per interval</div>
            </div>
            <div class="dc-target-score-strip">
              <button class="dc-score-btn dc-score-btn-plus"
                      onclick="DCManager.scoreTarget('${client.id}',${pi},'correct')"
                      title="Occurred">✓</button>
              <div class="dc-score-tally" id="tally-${prog.id}">${prog.correct}/${prog.total}</div>
              <button class="dc-score-btn dc-score-btn-minus"
                      onclick="DCManager.scoreTarget('${client.id}',${pi},'incorrect')"
                      title="Did not occur">✗</button>
            </div>
          </div>`;
      }
    }).join('');
  },

  scoreTarget(clientId, progIndex, outcome) {
    const client = this.allClients.find(c => c.id === clientId);
    const sessClient = this.sessionClients.find(c => c.id === clientId);
    const target = sessClient ? sessClient.programs[progIndex] : null;
    if (!target) return;

    target.total++;
    if (outcome === 'correct') target.correct++;

    const pct = target.total > 0 ? Math.round((target.correct / target.total) * 100) : 0;

    // Update display in place
    const tallyEl = document.getElementById(`tally-${target.id}`);
    const pctEl   = document.getElementById(`pct-${target.id}`);
    if (tallyEl) tallyEl.textContent = `${target.correct}/${target.total}`;
    if (pctEl)   pctEl.textContent   = `${pct}%`;

    // Pulse feedback
    const row = document.getElementById(`target-row-${target.id}`);
    if (row) {
      const cls = outcome === 'correct' ? 'dc-pulse-green' : 'dc-pulse-red';
      row.style.background = outcome === 'correct' ? 'rgba(32,178,170,0.18)' : 'rgba(239,68,68,0.12)';
      setTimeout(() => { row.style.background = ''; }, 400);
    }

    this._updateCounts(sessClient);
    this._updateMiniGraph(target, pct);
  },

  setPromptLevel(clientId, progIndex, level) {
    const sessClient = this.sessionClients.find(c => c.id === clientId);
    if (!sessClient) return;
    sessClient.programs[progIndex].promptLevel = level;
    this._renderSkillTargets(sessClient, 'task');
  },

  // ── BEHAVIOR GRID ─────────────────────────────────────────────
  _renderBehaviorGrid(client) {
    const container = document.getElementById('dc-behavior-grid');
    if (!container) return;
    if (!client.behaviors || client.behaviors.length === 0) {
      container.innerHTML = '<div class="dc-abc-empty">No problem behaviors tracked.</div>';
      return;
    }
    container.innerHTML = client.behaviors.map((b, bi) => `
      <div class="dc-behavior-tile">
        <button class="dc-behavior-tally-btn"
                id="bhv-btn-${b.id}"
                onclick="DCManager.incrementBehavior('${client.id}',${bi})"
                aria-label="Log ${this._esc(b.name)}">+1</button>
        <div class="dc-behavior-name">${this._esc(b.name)}</div>
        <div class="dc-behavior-count-display" id="bhv-count-${b.id}">${b.count} today</div>
      </div>
    `).join('');
  },

  incrementBehavior(clientId, behaviorIndex) {
    const client = this.sessionClients.find(c => c.id === clientId);
    if (!client) return;
    client.behaviors[behaviorIndex].count++;
    const b = client.behaviors[behaviorIndex];
    const el = document.getElementById(`bhv-count-${b.id}`);
    if (el) el.textContent = `${b.count} today`;

    // Pulse feedback
    const btn = document.getElementById(`bhv-btn-${b.id}`);
    if (btn) {
      btn.style.transform = 'scale(0.9)';
      btn.style.background = 'rgba(239,68,68,0.35)';
      setTimeout(() => { btn.style.transform = ''; btn.style.background = ''; }, 250);
    }

    this._updateCounts(client);
    this.toast(`${b.name} logged — ${b.count}`, 'warning');
  },

  // ── COUNTS ────────────────────────────────────────────────────
  _updateCounts(client) {
    if (!client) return;
    const skillCount = client.programs?.length || 0;
    const behaviorCount = client.behaviors?.reduce((s, b) => s + b.count, 0) || 0;
    const skillEl = document.getElementById('dc-skill-count');
    const behaviorEl = document.getElementById('dc-behavior-count');
    const abcEl = document.getElementById('dc-abc-count');
    if (skillEl) skillEl.textContent = skillCount;
    if (behaviorEl) behaviorEl.textContent = behaviorCount;
    if (abcEl) abcEl.textContent = this.abcEvents.length;
  },

  // ── MINI GRAPHS ───────────────────────────────────────────────
  _renderMiniGraphs(client) {
    const container = document.getElementById('dc-mini-graphs');
    if (!container || !client.programs) return;
    container.innerHTML = client.programs.map(prog => {
      const pct = prog.total > 0 ? Math.round((prog.correct / prog.total) * 100) : 0;
      const histPct = (client.historyPct || []).slice(-4);
      const allPcts = [...histPct, pct];
      const avgPct = Math.round(allPcts.reduce((s, v) => s + v, 0) / allPcts.length);
      return `
        <div class="dc-mini-graph-item" id="mgraph-${prog.id}">
          <div class="dc-mg-header">
            <div class="dc-mg-name">${this._esc(prog.name)}</div>
            <div class="dc-mg-pct" id="mgraph-pct-${prog.id}">${pct}%</div>
          </div>
          <div class="dc-mg-bar-track">
            <div class="dc-mg-bar-fill" id="mgraph-fill-${prog.id}" style="width:${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  _updateMiniGraph(target, pct) {
    const fillEl = document.getElementById(`mgraph-fill-${target.id}`);
    const pctEl  = document.getElementById(`mgraph-pct-${target.id}`);
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (pctEl)  pctEl.textContent  = `${pct}%`;
  },

  // ── SESSION NOTES ─────────────────────────────────────────────
  saveSessionNote() {
    const ta = document.getElementById('dc-session-notes');
    if (!ta || !ta.value.trim()) { this.toast('Note is empty', 'warning'); return; }
    this.toast('Session note saved', 'success');
    // In production: save to Supabase session_notes table
  },

  // ── ABC LOGGER ────────────────────────────────────────────────
  openABCLogger() {
    this._openModal('dc-abc-modal-overlay');
  },

  closeABCModal() {
    this._closeModal('dc-abc-modal-overlay');
  },

  setIntensity(level) {
    this.abcIntensity = level;
    document.querySelectorAll('.dc-intensity-pill').forEach(p => {
      p.classList.toggle('active', parseInt(p.dataset.level) === level);
    });
  },

  submitABCEvent() {
    const antecedent  = document.getElementById('dc-abc-antecedent')?.value || '';
    const behavior    = document.getElementById('dc-abc-behavior')?.value   || '';
    const consequence = document.getElementById('dc-abc-consequence')?.value || '';
    const antNote     = document.getElementById('dc-abc-ant-note')?.value    || '';
    const conNote     = document.getElementById('dc-abc-con-note')?.value    || '';
    const duration    = document.getElementById('dc-abc-duration')?.value    || '';

    const event = {
      id: Date.now(),
      time: this._timeNow(),
      antecedent, antNote,
      behavior,
      intensity: this.abcIntensity,
      duration,
      consequence, conNote
    };
    this.abcEvents.unshift(event);
    this._renderABCLog();
    this._updateCounts(this.sessionClients.find(c => c.id === this.activeClientId));
    this.closeABCModal();
    this.toast('ABC event logged', 'success');
  },

  _renderABCLog() {
    const container = document.getElementById('dc-abc-log-list');
    if (!container) return;
    if (this.abcEvents.length === 0) {
      container.innerHTML = '<div class="dc-abc-empty">No ABC events logged this session.</div>';
      return;
    }
    container.innerHTML = this.abcEvents.slice(0, 8).map(e => `
      <div class="dc-abc-log-entry">
        <div class="dc-abc-entry-time">${e.time}</div>
        <div class="dc-abc-entry-body">
          <div class="dc-abc-entry-row">
            <span class="dc-abc-entry-label">A</span>
            <span>${this._esc(e.antecedent)}</span>
          </div>
          <div class="dc-abc-entry-row">
            <span class="dc-abc-entry-label">B</span>
            <span>${this._esc(e.behavior)} (Intensity: ${e.intensity}${e.duration ? ` · ${e.duration}` : ''})</span>
          </div>
          <div class="dc-abc-entry-row">
            <span class="dc-abc-entry-label">C</span>
            <span>${this._esc(e.consequence)}</span>
          </div>
        </div>
      </div>
    `).join('');
  },

  // ══════════════════════════════════════════════════════════════
  // GROUP MODE
  // ══════════════════════════════════════════════════════════════

  openCreateGroupModal() {
    this.assignedClientIds = new Set();
    const nameInput = document.getElementById('dc-group-name');
    if (nameInput) nameInput.value = '';
    const templateCheck = document.getElementById('dc-save-template');
    if (templateCheck) templateCheck.checked = false;
    document.getElementById('dc-template-name-wrap').style.display = 'none';
    this._renderAssignList('');
    this._updateAssignedCount();
    this._openModal('dc-group-modal-overlay');
  },

  closeGroupModal() {
    this._closeModal('dc-group-modal-overlay');
  },

  searchAssignClients(query) {
    this._renderAssignList(query);
  },

  _renderAssignList(query) {
    const container = document.getElementById('dc-assign-list');
    if (!container) return;
    const q = (query || '').toLowerCase();
    const filtered = this.allClients.filter(c =>
      c.full_name.toLowerCase().includes(q) || c.diagnosis.toLowerCase().includes(q)
    );
    if (filtered.length === 0) {
      container.innerHTML = '<div class="dc-abc-empty">No clients found.</div>';
      return;
    }
    container.innerHTML = filtered.map(c => `
      <div class="dc-assign-item ${this.assignedClientIds.has(c.id) ? 'selected' : ''}"
           onclick="DCManager.toggleAssignClient('${c.id}')">
        <div class="dc-assign-avatar" style="background:${avatarColor(c.full_name)}">${initials(c.full_name)}</div>
        <div class="dc-assign-name">${this._esc(c.full_name)}</div>
        <span style="font-size:0.65rem;color:var(--color-text-light);">${c.diagnosis}</span>
        <div class="dc-assign-check">
          ${this.assignedClientIds.has(c.id) ? '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
        </div>
      </div>
    `).join('');
  },

  toggleAssignClient(clientId) {
    const maxClients = parseInt(document.getElementById('dc-group-max')?.value || '5');
    if (this.assignedClientIds.has(clientId)) {
      this.assignedClientIds.delete(clientId);
    } else {
      if (this.assignedClientIds.size >= maxClients) {
        this.toast(`Max ${maxClients} clients per group`, 'warning');
        return;
      }
      this.assignedClientIds.add(clientId);
    }
    this._renderAssignList(document.getElementById('dc-assign-search')?.value || '');
    this._updateAssignedCount();
  },

  _updateAssignedCount() {
    const el = document.getElementById('dc-assigned-count');
    if (el) el.textContent = this.assignedClientIds.size;
  },

  toggleTemplateName(checked) {
    const wrap = document.getElementById('dc-template-name-wrap');
    if (wrap) wrap.style.display = checked ? 'block' : 'none';
  },

  submitCreateGroup() {
    const name = document.getElementById('dc-group-name')?.value.trim();
    const type = document.getElementById('dc-group-type')?.value;
    if (!name) { this.toast('Please enter a group name', 'warning'); return; }
    if (this.assignedClientIds.size === 0) { this.toast('Assign at least one client', 'warning'); return; }

    const clients = this.allClients.filter(c => this.assignedClientIds.has(c.id));
    this.groupClients = JSON.parse(JSON.stringify(clients)); // deep copy
    this.activeGroupName = name;

    // Save template?
    const saveTemplate = document.getElementById('dc-save-template')?.checked;
    if (saveTemplate) {
      const templateName = document.getElementById('dc-template-name')?.value.trim() || name;
      const tpl = { id: Date.now(), name: templateName, type, clientIds: [...this.assignedClientIds], clientNames: clients.map(c => c.full_name) };
      this.savedTemplates.push(tpl);
      try { localStorage.setItem('prysm_dc_templates', JSON.stringify(this.savedTemplates)); } catch(e) {}
    }

    this.closeGroupModal();
    this._renderGroupChips();
    this._renderGroupGrid();
    this.toast(`"${name}" launched — ${clients.length} client${clients.length > 1 ? 's' : ''}`, 'success');
  },

  _renderGroupChips() {
    const container = document.getElementById('dc-group-chips');
    if (!container) return;
    if (!this.activeGroupName) {
      container.innerHTML = '<span style="font-size:0.75rem;color:var(--color-text-light);opacity:0.6;">No active group.</span>';
      return;
    }
    container.innerHTML = `
      <div class="dc-group-chip active">
        <i data-lucide="layout-grid" style="width:12px;height:12px;"></i>
        ${this._esc(this.activeGroupName)}
        <span style="opacity:0.6;">(${this.groupClients.length})</span>
      </div>
    `;
    setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 50);
  },

  _renderGroupGrid() {
    const empty     = document.getElementById('dc-group-empty');
    const workspace = document.getElementById('dc-group-workspace');
    const batchDock = document.getElementById('dc-batch-dock');
    const grid      = document.getElementById('dc-client-grid');
    if (!grid) return;

    if (this.groupClients.length === 0) {
      if (empty) empty.style.display = 'flex';
      if (workspace) workspace.style.display = 'none';
      if (batchDock) batchDock.style.display = 'none';
      return;
    }

    if (empty) empty.style.display = 'none';
    if (workspace) workspace.style.display = 'flex';
    if (batchDock) batchDock.style.display = 'flex';

    // set grid count class
    const n = this.groupClients.length;
    grid.className = `dc-client-grid count-${n}`;

    // init timers for each group client
    this.groupClients.forEach(c => {
      if (!this.clientTimers[c.id]) {
        this.clientTimers[c.id] = { seconds: 0, running: false, intervalId: null };
      }
    });

    grid.innerHTML = this.groupClients.map((c, i) =>
      this._buildClientCard(c, i)
    ).join('');

    this._renderBatchClientSelect();
    setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 80);
  },

  _buildClientCard(client, cardIndex) {
    const initStr = initials(client.full_name);
    const color   = avatarColor(client.full_name);
    
    // Helper to get meta info
    const getMeta = (type) => {
      switch(type) {
        case 'percent': return { label: '% Correct', icon: 'check-circle' };
        case 'ta': return { label: 'Task Analysis', icon: 'list-ordered' };
        case 'interval': return { label: 'Interval', icon: 'clock' };
        case 'frequency': return { label: 'Frequency', icon: 'plus-circle' };
        case 'duration': return { label: 'Duration', icon: 'timer' };
        default: return { label: type || 'Target', icon: 'circle' };
      }
    };

    // 1. SKILL TARGETS
    const skillCardsHtml = client.programs?.map((p, pi) => {
      const meta = getMeta(p.measurementType || 'percent');
      
      let bodyHtml = '';
      if (p.measurementType === 'ta') {
        const steps = (p.steps || ['Push the lace through the hole', 'Pull both loops tight']).map((step, index) => `
          <div class="ta-step-row">
            <span>${index + 1}. ${this._esc(step)}</span>
            <div class="ta-prompt-levels">
              ${['I', 'V', 'M', 'P'].map(level => `<button class="prompt-btn" type="button" title="Score ${level}">${level}</button>`).join('')}
            </div>
          </div>
        `).join('');
        bodyHtml = `<div class="ta-steps">${steps}</div>`;
      } else if (p.measurementType === 'interval') {
        bodyHtml = `
          <div class="interval-controls">
            <button class="glass-btn btn-primary" onclick="DCManager.markInterval('${client.id}','yes')" style="margin-bottom: 1rem; width: 100%;">
              <i data-lucide="play"></i> Start Interval Timer
            </button>
          </div>
          <div class="intervals-grid">
            ${Array.from({ length: 10 }, (_, index) => `<div class="interval-box">${index + 1}</div>`).join('')}
          </div>
        `;
      } else {
        // Default to % Correct
        const pct = p.total === 0 ? '0%' : Math.round((p.correct / p.total) * 100) + '%';
        bodyHtml = `
          <div class="pc-layout">
            <div class="pc-controls">
              <button class="glass-btn btn-incorrect" onclick="DCManager.groupScoreTarget('${client.id}',${pi},'incorrect')" aria-label="Mark Incorrect">
                <i data-lucide="x"></i>
              </button>
              <button class="glass-btn btn-correct" onclick="DCManager.groupScoreTarget('${client.id}',${pi},'correct')" aria-label="Mark Correct">
                <i data-lucide="check"></i>
              </button>
            </div>
            <div class="pc-stats">
              <div class="stat-box">
                <span class="stat-label">Correct</span>
                <span class="stat-value" id="grp-tgt-correct-${client.id}-${pi}">${p.correct}</span>
              </div>
              <div class="stat-box">
                <span class="stat-label">Total</span>
                <span class="stat-value" id="grp-tgt-total-${client.id}-${pi}">${p.total}</span>
              </div>
              <div class="stat-box stat-highlight">
                <span class="stat-label">%</span>
                <span class="stat-value" id="grp-tgt-pct-${client.id}-${pi}">${pct}</span>
              </div>
            </div>
          </div>
        `;
      }

      return `
        <article class="data-card glass-panel" style="margin-bottom: 1rem;">
          <header class="card-header">
            <div class="card-title-group">
              <i data-lucide="${meta.icon}" class="card-icon"></i>
              <h3>${this._esc(p.name)}</h3>
            </div>
            <div class="card-actions">
              <span class="badge">${meta.label}</span>
              <button class="btn-info" aria-label="Target Menu"><i data-lucide="more-vertical"></i></button>
            </div>
          </header>
          <div class="card-body">
            ${bodyHtml}
          </div>
        </article>
      `;
    }).join('') || '<div class="dc-abc-empty">No skill acquisition targets.</div>';


    // 2. PROBLEM BEHAVIORS
    const pbCardsHtml = client.behaviors?.map((b, bi) => {
      const meta = getMeta(b.measurementType || 'frequency');
      
      let pbBodyHtml = '';
      if (b.measurementType === 'duration') {
        pbBodyHtml = `
          <div class="duration-display">00:00</div>
          <div class="duration-controls">
            <button class="glass-btn btn-action" aria-label="Start or stop timer"><i data-lucide="play"></i></button>
            <button class="glass-btn btn-reset" aria-label="Reset timer"><i data-lucide="rotate-ccw"></i></button>
          </div>
        `;
      } else {
        pbBodyHtml = `
          <button class="glass-btn btn-minus" onclick="DCManager.groupDecrementBehavior('${client.id}',${bi})" aria-label="Decrease count">
            <i data-lucide="minus"></i>
          </button>
          <div class="large-counter" id="grp-bhv-count-${client.id}-${bi}">${b.count}</div>
          <button class="glass-btn btn-plus" id="grp-bhv-btn-${client.id}-${bi}" onclick="DCManager.groupIncrementBehavior('${client.id}',${bi})" aria-label="Increase count">
            <i data-lucide="plus"></i>
          </button>
        `;
      }

      return `
        <article class="data-card glass-panel warning-glass" style="margin-bottom: 1rem;">
          <header class="card-header pb-header">
            <div class="card-title-group">
              <h4>${this._esc(b.name)}</h4>
            </div>
            <div class="card-actions">
              <span class="badge badge-warning">${meta.label === 'Frequency' ? 'Freq' : 'Dur'}</span>
              <button class="btn-info" aria-label="Target Menu"><i data-lucide="more-vertical"></i></button>
            </div>
          </header>
          <div class="card-body pb-layout">
            ${pbBodyHtml}
          </div>
        </article>
      `;
    }).join('') || '';

    // We no longer wrap the PBs in a banner dock
    const pbDockHtml = pbCardsHtml;

    return `
      <div class="dc-client-card" id="grp-card-${client.id}">
        <!-- Card Header -->
        <div class="dc-card-header glass-panel" style="padding: 1rem; margin-bottom: 1rem; border-radius: 12px;">
          <div class="dc-card-avatar" style="background:${color}">${initStr}</div>
          <div class="dc-card-identity">
            <div class="dc-card-name">${this._esc(client.full_name)}</div>
            <div class="dc-card-meta">${this._esc(client.diagnosis)}</div>
          </div>
          <div class="dc-card-timer-ui">
            <div class="dc-card-timer-display" id="grp-timer-${client.id}">00:00:00</div>
            <button class="dc-card-timer-btn" id="grp-timer-btn-${client.id}"
                    onclick="DCManager.toggleGroupClientTimer('${client.id}')"
                    title="Start/Pause">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </button>
          </div>
          <button class="dc-card-focus-btn" onclick="DCManager.focusClientFromGroup('${client.id}')"
                  title="Switch to Individual Focus Mode">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
          </button>
        </div>

        <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
          ${skillCardsHtml}
          ${pbDockHtml}
        </div>
      </div>
    `;
  },

  // Group client actions
  groupIncrementBehavior(clientId, behaviorIndex) {
    const client = this.groupClients.find(c => c.id === clientId);
    if (!client || !client.behaviors[behaviorIndex]) return;
    client.behaviors[behaviorIndex].count++;
    const count = client.behaviors[behaviorIndex].count;
    const el = document.getElementById(`grp-bhv-count-${clientId}-${behaviorIndex}`);
    if (el) el.textContent = count;
    const btn = document.getElementById(`grp-bhv-btn-${clientId}-${behaviorIndex}`);
    if (btn) {
      btn.style.transform = 'scale(0.88)';
      btn.style.background = 'rgba(239,68,68,0.4)';
      setTimeout(() => { btn.style.transform = ''; btn.style.background = ''; }, 200);
    }
    this.toast(`${client.full_name.split(' ')[0]}: ${client.behaviors[behaviorIndex].name} ×${count}`, 'warning');
  },
  groupDecrementBehavior(clientId, behaviorIndex) {
    const client = this.groupClients.find(c => c.id === clientId);
    if (!client || !client.behaviors[behaviorIndex]) return;
    if (client.behaviors[behaviorIndex].count > 0) {
      client.behaviors[behaviorIndex].count--;
      const count = client.behaviors[behaviorIndex].count;
      const el = document.getElementById(`grp-bhv-count-${clientId}-${behaviorIndex}`);
      if (el) el.textContent = count;
    }
  },

  groupScoreTarget(clientId, progIndex, outcome) {
    const client = this.groupClients.find(c => c.id === clientId);
    if (!client || !client.programs[progIndex]) return;
    const prog = client.programs[progIndex];
    prog.total++;
    if (outcome === 'correct') prog.correct++;
    
    const pct = prog.total === 0 ? '0%' : Math.round((prog.correct / prog.total) * 100) + '%';
    
    const correctEl = document.getElementById(`grp-tgt-correct-${clientId}-${progIndex}`);
    const totalEl = document.getElementById(`grp-tgt-total-${clientId}-${progIndex}`);
    const pctEl = document.getElementById(`grp-tgt-pct-${clientId}-${progIndex}`);
    
    if (correctEl) correctEl.textContent = prog.correct;
    if (totalEl) totalEl.textContent = prog.total;
    if (pctEl) pctEl.textContent = pct;
    
    this.toast(`${client.full_name.split(' ')[0]}: ${prog.name} ${outcome}`, outcome === 'correct' ? 'success' : 'info');
  },

  markInterval(clientId, value) {
    const yesBtn = document.getElementById(`grp-int-yes-${clientId}`);
    const noBtn  = document.getElementById(`grp-int-no-${clientId}`);
    if (yesBtn) yesBtn.classList.toggle('selected-yes', value === 'yes');
    if (noBtn)  noBtn.classList.toggle('selected-no',  value === 'no');
    if (yesBtn) yesBtn.classList.toggle('selected-no',  false);
    if (noBtn)  noBtn.classList.toggle('selected-yes',  false);
  },

  focusClientFromGroup(clientId) {
    // Add to individual session and switch mode
    if (!this.sessionClients.find(c => c.id === clientId)) {
      const client = this.groupClients.find(c => c.id === clientId);
      if (client) this.sessionClients.push(client);
    }
    this.setActiveClient(clientId);
    this.switchMode('individual');
    this.toast('Switched to Individual Focus Mode', 'success');
  },

  // Group client timers
  toggleGroupClientTimer(clientId) {
    const t = this.clientTimers[clientId];
    if (!t) return;
    t.running = !t.running;
    if (t.running && !t.intervalId) {
      t.intervalId = setInterval(() => {
        if (t.running) {
          t.seconds++;
          const el = document.getElementById(`grp-timer-${clientId}`);
          if (el) el.textContent = this._formatTime(t.seconds);
        }
      }, 1000);
    }
  },

  resetGroupClientTimer(clientId) {
    const t = this.clientTimers[clientId];
    if (!t) return;
    t.running = false;
    t.seconds = 0;
    clearInterval(t.intervalId);
    t.intervalId = null;
    const el = document.getElementById(`grp-timer-${clientId}`);
    if (el) el.textContent = '00:00:00';
  },

  // ── GLOBAL INTERVAL SYNC ──────────────────────────────────────
  setIntervalDuration(val) {
    this.intervalDuration = parseInt(val);
    this.intervalElapsed  = 0;
    const el = document.getElementById('dc-interval-current');
    if (el) el.textContent = val >= 60 ? '1m' : `${val}s`;
    const fill = document.getElementById('dc-interval-fill');
    if (fill) fill.style.width = '0%';
  },

  toggleInterval() {
    this.intervalRunning = !this.intervalRunning;
    const btn  = document.getElementById('btn-interval-toggle');
    const icon = document.getElementById('icon-interval-toggle');

    if (this.intervalRunning) {
      if (btn) { btn.textContent = ''; btn.innerHTML = '<i data-lucide="pause" style="width:13px;height:13px;"></i> Pause Interval'; btn.classList.add('running'); }
      this.intervalSyncId = setInterval(() => {
        this.intervalElapsed++;
        const pct = Math.min((this.intervalElapsed / this.intervalDuration) * 100, 100);
        const fill = document.getElementById('dc-interval-fill');
        if (fill) fill.style.width = `${pct}%`;
        if (this.intervalElapsed >= this.intervalDuration) {
          this.intervalElapsed = 0;
          this._onIntervalComplete();
        }
      }, 1000);
    } else {
      clearInterval(this.intervalSyncId);
      if (btn) { btn.innerHTML = '<i data-lucide="play" style="width:13px;height:13px;"></i> Start Interval'; btn.classList.remove('running'); }
    }

    setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 50);
  },

  _onIntervalComplete() {
    // Visual ping on all cards
    this.groupClients.forEach(c => {
      const card = document.getElementById(`grp-card-${c.id}`);
      if (card) {
        card.style.boxShadow = '0 0 0 3px rgba(32,178,170,0.7)';
        setTimeout(() => { card.style.boxShadow = ''; }, 800);
      }
      // Reset interval buttons
      const yesBtn = document.getElementById(`grp-int-yes-${c.id}`);
      const noBtn  = document.getElementById(`grp-int-no-${c.id}`);
      if (yesBtn) { yesBtn.classList.remove('selected-yes', 'selected-no'); }
      if (noBtn)  { noBtn.classList.remove('selected-yes', 'selected-no'); }
    });
  },

  endGroupSession() {
    if (!confirm('End the group session? All data will be saved.')) return;
    clearInterval(this.intervalSyncId);
    this.intervalRunning = false;
    this.groupClients = [];
    this.activeGroupName = null;
    this._renderGroupChips();
    this._renderGroupGrid();
    const fill = document.getElementById('dc-interval-fill');
    if (fill) fill.style.width = '0%';
    this.toast('Group session ended', 'success');
  },

  // ── BATCH ACTIONS ─────────────────────────────────────────────
  batchLogEvent(type) {
    const labels = { meal: 'Mealtime', transition: 'Transition', break: 'Break Start', prompt_check: 'Prompt Check' };
    this.toast(`"${labels[type]}" logged for all ${this.groupClients.length} clients`, 'success');
  },

  openBatchNoteModal() {
    this._renderBatchClientSelect();
    this._openModal('dc-batch-note-overlay');
  },

  closeBatchNoteModal() {
    this._closeModal('dc-batch-note-overlay');
  },

  _renderBatchClientSelect() {
    const container = document.getElementById('dc-batch-client-select');
    if (!container || this.groupClients.length === 0) return;
    container.innerHTML = this.groupClients.map(c => `
      <button class="dc-batch-client-chip selected" data-clientid="${c.id}"
              onclick="this.classList.toggle('selected')">
        <div style="width:16px;height:16px;border-radius:50%;background:${avatarColor(c.full_name)};
                    color:white;display:flex;align-items:center;justify-content:center;
                    font-size:0.5rem;font-weight:700;">${initials(c.full_name)}</div>
        ${this._esc(c.full_name.split(' ')[0])}
      </button>
    `).join('');
  },

  submitBatchNote() {
    const note = document.getElementById('dc-batch-note-text')?.value.trim();
    if (!note) { this.toast('Note is empty', 'warning'); return; }
    const selectedChips = document.querySelectorAll('.dc-batch-client-chip.selected');
    const count = selectedChips.length;
    this.closeBatchNoteModal();
    this.toast(`Group note saved for ${count} client${count !== 1 ? 's' : ''}`, 'success');
    const ta = document.getElementById('dc-batch-note-text');
    if (ta) ta.value = '';
  },

  // ── GROUP TEMPLATES ───────────────────────────────────────────
  openLoadGroupTemplateModal() {
    this._renderTemplateList();
    this._openModal('dc-template-modal-overlay');
  },

  closeTemplateModal() {
    this._closeModal('dc-template-modal-overlay');
  },

  _renderTemplateList() {
    const container = document.getElementById('dc-template-list');
    const empty     = document.getElementById('dc-template-empty');
    if (!container) return;

    if (this.savedTemplates.length === 0) {
      container.innerHTML = '';
      if (empty) empty.style.display = 'flex';
      return;
    }

    if (empty) empty.style.display = 'none';
    container.innerHTML = this.savedTemplates.map(tpl => `
      <div class="dc-template-item">
        <div class="dc-template-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        </div>
        <div class="dc-template-info">
          <div class="dc-template-name">${this._esc(tpl.name)}</div>
          <div class="dc-template-sub">${tpl.type} · ${tpl.clientNames?.length || 0} client${(tpl.clientNames?.length || 0) !== 1 ? 's' : ''}</div>
        </div>
        <button class="dc-template-load-btn" onclick="DCManager.loadTemplate(${tpl.id})">
          Load →
        </button>
      </div>
    `).join('');
  },

  loadTemplate(templateId) {
    const tpl = this.savedTemplates.find(t => t.id === templateId);
    if (!tpl) return;
    const clients = this.allClients.filter(c => tpl.clientIds.includes(c.id));
    this.groupClients = JSON.parse(JSON.stringify(clients));
    this.activeGroupName = tpl.name;
    this.groupClients.forEach(c => {
      if (!this.clientTimers[c.id]) this.clientTimers[c.id] = { seconds: 0, running: false, intervalId: null };
    });
    this.closeTemplateModal();
    this._renderGroupChips();
    this._renderGroupGrid();
    this.toast(`Template "${tpl.name}" loaded`, 'success');
  },

  // ── ADD CLIENT FORM ───────────────────────────────────────────
  addTargetTag(event) {
    if (event.key !== 'Enter' && event.key !== ',') return;
    event.preventDefault();
    const input = document.getElementById('dc-target-input');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;
    this.targetTags.push(val);
    input.value = '';
    this._renderTargetTags();
  },

  _renderTargetTags() {
    const wrap = document.getElementById('dc-target-tags');
    const input = document.getElementById('dc-target-input');
    if (!wrap || !input) return;
    const tags = this.targetTags.map((tag, i) => `
      <span class="dc-tag">
        ${this._esc(tag)}
        <button class="dc-tag-remove" onclick="DCManager.removeTargetTag(${i})" aria-label="Remove tag">✕</button>
      </span>
    `).join('');
    wrap.innerHTML = tags;
    wrap.appendChild(input);
  },

  removeTargetTag(index) {
    this.targetTags.splice(index, 1);
    this._renderTargetTags();
  },

  selectClientModeDest(mode) {
    const indLbl = document.getElementById('lbl-client-mode-ind');
    const grpLbl = document.getElementById('lbl-client-mode-grp');
    const indRad = document.getElementById('radio-mode-ind');
    const grpRad = document.getElementById('radio-mode-grp');
    if (mode === 'group') {
      if (indLbl) indLbl.classList.remove('active');
      if (grpLbl) grpLbl.classList.add('active');
      if (indRad) indRad.checked = false;
      if (grpRad) grpRad.checked = true;
    } else {
      if (indLbl) indLbl.classList.add('active');
      if (grpLbl) grpLbl.classList.remove('active');
      if (indRad) indRad.checked = true;
      if (grpRad) grpRad.checked = false;
    }
  },

  submitAddClient(event) {
    event.preventDefault();

    // Raw input values — all fields optional
    const rawName = document.getElementById('dc-client-fullname')?.value.trim();
    const defaultNum = this.allClients.length + 1;
    const name = rawName || `Client #${defaultNum}`;

    const dob = document.getElementById('dc-client-dob')?.value || '';
    const age = dob ? Math.floor((Date.now() - new Date(dob)) / 3.156e10) : 0;
    const diagnosis = document.getElementById('dc-client-diagnosis')?.value || 'Pending Setup';
    const insurance = document.getElementById('dc-client-insurance')?.value || 'Unspecified';
    const promptLevel = document.getElementById('dc-client-prompt')?.value || 'Partial Physical';
    const mastery = document.getElementById('dc-client-mastery')?.value || 'Standard';
    const notes = document.getElementById('dc-client-notes-form')?.value || 'No initial notes provided.';

    // Mode assignment choice: individual vs group
    const isGroupMode = document.getElementById('radio-mode-grp')?.checked || false;

    // Targets list — if blank, provide default starter target
    const initialPrograms = this.targetTags.length > 0
      ? this.targetTags.map((tag, i) => ({
          id: `TGT-NEW-${Date.now()}-${i}`,
          name: tag,
          promptLevel,
          correct: 0,
          total: 0,
          scores: []
        }))
      : [
          {
            id: `TGT-NEW-${Date.now()}-0`,
            name: 'Skill Acquisition Protocol',
            promptLevel,
            correct: 0,
            total: 0,
            scores: []
          }
        ];

    const newClient = {
      id: `CLT-${Date.now()}`,
      full_name: name,
      date_of_birth: dob,
      age: Math.max(age, 0),
      diagnosis,
      insurance,
      status: 'active',
      programs: initialPrograms,
      behaviors: [
        { id: `BHV-NEW-${Date.now()}-0`, name: 'Disruption', count: 0 }
      ],
      historyPct: [50, 60, 65, 70]
    };

    // Store in master roster
    this.allClients.push(newClient);

    // Reset drawer form state
    this.targetTags = [];
    event.target.reset();
    this._renderTargetTags();
    this.selectClientModeDest('individual'); // reset selector to default
    this.closeClientDrawer();

    if (isGroupMode) {
      // Add to group session
      if (this.groupClients.length >= 5) {
        this.toast('Group max capacity reached (5). Client added to roster.', 'warning');
      } else {
        this.groupClients.push(JSON.parse(JSON.stringify(newClient)));
        if (!this.activeGroupName) this.activeGroupName = 'Active Group Cohort';
      }
      this.switchMode('group');
      this._renderGroupChips();
      this._renderGroupGrid();
      this.toast(`Created ${name} → Group Session launched!`, 'success');
    } else {
      // Add to individual focus session
      this.sessionClients.push(newClient);
      this.switchMode('individual');
      this._renderIndividualClientChips();
      this.setActiveClient(newClient.id);
      this.toast(`Created ${name} → Individual Session launched!`, 'success');
    }
  },

  // ── MODAL HELPERS ─────────────────────────────────────────────
  _openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
  },

  _closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  },

  // ── TOAST ─────────────────────────────────────────────────────
  toast(msg, type = 'info') {
    const container = document.getElementById('dc-toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `dc-toast ${type}`;
    const icons = { success: '✓', warning: '⚠', error: '✕', info: 'ℹ' };
    toast.innerHTML = `<span>${icons[type] || '·'}</span> ${this._esc(msg)}`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 320);
    }, 3000);
  },

  // ── UTILITY ───────────────────────────────────────────────────
  _formatTime(seconds) {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  },

  _timeNow() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  },

  _esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

};

// ═══════════════════════════════════════════════════════════════
// BOOT — Listen for Prysm auth-ready event then check access
// ═══════════════════════════════════════════════════════════════
document.addEventListener('prysm:auth-ready', (event) => {
  const workspace    = document.getElementById('dc-workspace');
  const accessDenied = document.getElementById('dc-access-denied');

  if (DCManager.checkAccess()) {
    if (workspace)    workspace.style.display    = 'flex';
    if (accessDenied) accessDenied.style.display = 'none';
    DCManager.init();
  } else {
    if (workspace)    workspace.style.display    = 'none';
    if (accessDenied) accessDenied.style.display = 'flex';
    if (window.lucide) lucide.createIcons();
  }
});

// Fallback: if prysm:auth-ready never fires (demo / no Supabase),
// poll for PRYSM_USER after a short delay.
setTimeout(() => {
  if (document.getElementById('dc-workspace').style.display === 'none' &&
      document.getElementById('dc-access-denied').style.display === 'none') {
    // Auth guard hasn't fired yet — might be demo mode
    const user = window.PRYSM_USER;
    const workspace    = document.getElementById('dc-workspace');
    const accessDenied = document.getElementById('dc-access-denied');
    if (user) {
      if (DCManager.checkAccess()) {
        if (workspace)    workspace.style.display    = 'flex';
        if (accessDenied) accessDenied.style.display = 'none';
        DCManager.init();
      } else {
        if (workspace)    workspace.style.display    = 'none';
        if (accessDenied) accessDenied.style.display = 'flex';
        if (window.lucide) lucide.createIcons();
      }
    }
  }
}, 2500);
