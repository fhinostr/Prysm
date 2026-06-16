// --- View State Management ---

let selectedClientId = '';
let importType = 'treatment';

function setImportType(type) {
  importType = type;
  const treatmentBtn = document.getElementById('import-type-treatment');
  const assessmentBtn = document.getElementById('import-type-assessment');
  if (treatmentBtn) treatmentBtn.classList.toggle('active', type === 'treatment');
  if (assessmentBtn) assessmentBtn.classList.toggle('active', type === 'assessment');
  renderDraftMigrations(selectedClientId);
}

document.addEventListener('DOMContentLoaded', () => {
  renderClientList();
  
  // Default to first tab if already in file view (for testing)
  if (document.getElementById('client-files-view').style.display !== 'none') {
    switchFilesTab('assessments');
  }
});

function renderClientList() {
  const listContainer = document.getElementById('client-list');
  const countBadge = document.getElementById('client-count-badge');
  if (!listContainer || !countBadge) return;

  // Assuming getClientProfiles is globally available from clients-data.js
  const clients = typeof getClientProfiles === 'function' ? getClientProfiles() : [];
  countBadge.textContent = `${clients.length} Client${clients.length === 1 ? '' : 's'}`;

  listContainer.innerHTML = clients.map(client => `
    <div class="client-row" onclick="selectClient('${client.id}', '${escapeHtml(client.name)}')">
      <div class="client-avatar">${client.initials}</div>
      <div class="client-copy">
        <strong>${escapeHtml(client.name)}</strong>
        <span>${escapeHtml(client.subtitle)}</span>
      </div>
      <i data-lucide="chevron-right"></i>
    </div>
  `).join('');

  lucide.createIcons();
}

function selectClient(clientId, clientName) {
  selectedClientId = clientId;
  // Update UI text
  document.getElementById('selected-client-name').textContent = clientName;
  document.getElementById('selected-client-eyebrow').textContent = `Files for ${clientName}`;
  
  // Switch views
  document.getElementById('client-selection-view').style.display = 'none';
  document.getElementById('client-files-view').style.display = 'block';
  
  // Reset to default tab
  switchFilesTab('assessments');
  
  // Render draft migrations for this client
  renderDraftMigrations(clientId);
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showClientSelection() {
  document.getElementById('client-selection-view').style.display = 'block';
  document.getElementById('client-files-view').style.display = 'none';
}

function openAssessment(assessmentId) {
  document.getElementById('assessments-list-view').style.display = 'none';
  document.getElementById('assessment-document-view').style.display = 'block';
  
  // Reset to the first tab (Client Info)
  switchAssessmentTab('client-info');
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeAssessment() {
  document.getElementById('assessments-list-view').style.display = 'flex'; // file-group uses flex
  document.getElementById('assessment-document-view').style.display = 'none';
}

function switchAssessmentTab(tabId) {
  document.querySelectorAll('.assessment-tab-btn').forEach(button => {
    button.classList.toggle('active', button.dataset.assessmentTab === tabId);
  });

  document.querySelectorAll('.assessment-tab-pane').forEach(pane => {
    const isActive = pane.dataset.assessmentPane === tabId;
    // pane.classList.toggle('active', isActive); // Optional: if you use CSS classes for display
    pane.style.display = isActive ? 'block' : 'none';
  });
}

function switchFilesTab(tabId) {
  document.querySelectorAll('.files-tab-btn').forEach(button => {
    button.classList.toggle('active', button.dataset.filesTab === tabId);
  });

  document.querySelectorAll('.files-tab-pane').forEach(pane => {
    const isActive = pane.dataset.filesPane === tabId;
    pane.classList.toggle('active', isActive);
    pane.style.display = isActive ? 'flex' : 'none';
  });

  if (window.initializeToggleBars) {
    initializeToggleBars();
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// --- AI Migration Hub Logic ---

const MIGRATION_TARGETS = {
  'ethan-brooks': [
    {
      name: 'Tacting Objects',
      domain: 'skill',
      measurementType: 'percent',
      category: 'Communication',
      masteryCriteria: { threshold: 90, consecutiveSessions: 3 },
      phase: 'Acquisition',
      opDef: "Ability to tact (label) 3D objects and 2D pictures when presented with the antecedent 'What is this?' or when they naturally appear in the environment.",
      procedures: "Present the item, ask 'What is this?'. Praise correct response within 3s. Prompt with echoic if no response.",
      example: "Saying 'dog' when shown a picture of a dog.",
      nonExample: "Saying 'bark' or pointing without saying the word."
    },
    {
      name: 'Washing Hands',
      domain: 'skill',
      measurementType: 'ta',
      category: 'Daily Living',
      masteryCriteria: { threshold: 100, consecutiveSessions: 3 },
      phase: 'Acquisition',
      opDef: 'Independently complete the sequence of hand washing steps from turning on the water to drying hands.',
      procedures: 'Prompt at each step using least-to-most prompting hierarchy. Record plus for independent steps, minus for prompted.',
      example: 'Turning on the tap, washing with soap, and drying hands fully.',
      nonExample: 'Rinsing hands without soap or leaving water running.',
      steps: [
        'Turn on water',
        'Wet hands',
        'Apply soap',
        'Rub hands together for 20 seconds',
        'Rinse hands',
        'Turn off water',
        'Dry hands with towel'
      ]
    }
  ],
  'john-doe': [
    {
      name: 'Manding / Requesting',
      domain: 'skill',
      measurementType: 'percent',
      category: 'Communication',
      masteryCriteria: { threshold: 80, consecutiveSessions: 3 },
      phase: 'Acquisition',
      opDef: "Initiating requests for desired items, actions, or assistance using at least a 2-word phrase.",
      procedures: "Set up motivating operations (contrive situations where child needs help or items). Wait for mand. Prompt if needed.",
      example: 'Saying "want juice" or "help please".',
      nonExample: 'Grabbing, crying, or pointing without vocalization.'
    },
    {
      name: 'Social Play',
      domain: 'skill',
      measurementType: 'percent',
      category: 'Social Skills',
      masteryCriteria: { threshold: 90, consecutiveSessions: 5 },
      phase: 'Acquisition',
      opDef: "Engaging in parallel or cooperative play with peers for at least 5 minutes with no more than 1 prompt.",
      procedures: "Place client in play setting with peer. Provide reinforcement for cooperative interactions every 1 minute.",
      example: 'Building a train track together with a peer.',
      nonExample: 'Playing in isolation or taking toys away from peers.'
    }
  ],
  'mia-hernandez': [
    {
      name: 'Intraverbals / Conversation',
      domain: 'skill',
      measurementType: 'percent',
      category: 'Communication',
      masteryCriteria: { threshold: 80, consecutiveSessions: 3 },
      phase: 'Acquisition',
      opDef: "Responding to conversational prompts or fill-in-the-blank statements vocally within 3 seconds.",
      procedures: "Present statement (e.g. 'A cow says...'). Wait 3s. Praise correct response. Prompt with echoic if incorrect.",
      example: "Saying 'moo' in response to 'A cow says...'.",
      nonExample: "Repeating 'A cow says' (echolalia) or remaining silent."
    },
    {
      name: 'Independent Dressing',
      domain: 'skill',
      measurementType: 'ta',
      category: 'Daily Living',
      masteryCriteria: { threshold: 100, consecutiveSessions: 3 },
      phase: 'Acquisition',
      opDef: 'Completing the steps of putting on a shirt independently.',
      procedures: 'Forward chaining method. Prompt using least-to-most hierarchy.',
      example: 'Correctly sliding head and arms through holes.',
      nonExample: 'Putting shirt on backwards or inside out and leaving it.',
      steps: [
        'Orient shirt front-side down',
        'Gather shirt from bottom to neck',
        'Pull head through neck hole',
        'Push right arm through right sleeve',
        'Push left arm through left sleeve',
        'Pull shirt down to waist'
      ]
    }
  ]
};

const MIGRATION_ASSESSMENTS = {
  'john-doe': {
    clientInfo: {
      dob: '2018-05-12',
      initialAssessmentDate: '2025-01-15',
      reassessmentDate: '2026-06-15',
      parentName: 'Jane Doe',
      parentPhone: '(555) 012-3456',
      parentEmail: 'jane.doe@example.com'
    },
    biopsychosocial: {
      familyStructure: 'John lives with his biological mother and father in a suburban home. He has an older sister (age 9) who is typically developing. The primary language spoken at home is English.',
      medications: 'None currently prescribed.',
      medicalHistory: 'Born at 39 weeks via uncomplicated vaginal delivery. Reached physical developmental milestones (crawling, walking) within normal limits. History of chronic ear infections at age 2, resolved with tympanostomy tubes. No seizure activity reported.',
      gradeIndex: 2, // 1st Grade
      gradeText: '1st',
      schoolTypeIndex: 0, // Public school
      schoolTypeText: 'Public school',
      schoolHoursStart: '08:30',
      schoolHoursEnd: '15:00',
      academicSchedule: 'Language Arts (reading and phonics): 09:00 - 10:30, Mathematics: 11:00 - 12:00, Social Studies/Science: 13:00 - 13:45, Recess & Lunch: 12:00 - 13:00, Guided Social Play: 14:00 - 14:30.',
      schoolHoursPerWeek: '32.5 hours',
      abaProvider: 'Behavioral Milestones Clinic',
      abaStartDate: '2024-03-01',
      abaEndDate: '2025-05-15',
      abaOutcomes: 'John acquired a basic manding repertoire consisting of 15 single word requests. He also improved cooperation with transitions and daily living routines, such as hand washing, with gestural cues.',
      mentalHealthServices: 'N/A - no other mental health services or hospitalizations.',
      otherServices: 'Speech Therapy: 1 session per week, 1 hour overall. Occupational Therapy: 1 session per week, 1 hour overall.',
      coordinationOfCare: 'Regular monthly meetings with Speech Therapist (Sarah Vance) and OT (Mark L.) to coordinate visual prompts and language strategies.',
      majorLifeChanges: 'Family moved to a new neighborhood in December 2024; client transitioned to a new school in January 2025.'
    },
    narrative: {
      observationDate: '2026-06-10',
      clinicalNarrative: 'Observer monitored John in his home environment for 2 hours. John spent the majority of the session playing alone with toy trains and building blocks. When he wanted juice, he walked to the refrigerator, pulled Jane by the hand, and pointed. If Jane prompted him to request, he said "juice" with low voice volume. John engaged in hand flapping and high-pitched vocalizations when excited. He resisted clean-up demands by crying and lying on the floor, but complied after a visual schedule was presented.',
      langStrengths: 'Able to vocally name 40+ common household items and animals when shown pictures. Receptively identifies primary colors and shapes. Responds to basic, one-step commands.',
      langChallenges: 'Does not spontaneously initiate verbal conversation. Rarely uses multi-word phrases. Struggles with intraverbal tasks (e.g., cannot complete common sentences or answer "what/who/where" questions).',
      langSeverity: 1, // Moderate
      socialStrengths: 'Enjoys cooperative tickling games and physical play with his father. Shows interest in watching his older sister play.',
      socialChallenges: 'Does not initiate play with peers or sustain parallel play beyond 2 minutes. Limits eye contact to brief moments (under 2 seconds) during high motivation.',
      socialSeverity: 1, // Moderate
      adaptiveStrengths: 'Spoon-feeds independently during meal times. Daytime toilet trained. Can pull up pants with light assistance.',
      adaptiveChallenges: 'Requires hand-over-hand assistance for buttoning, zipping, and tying shoes. Needs physical guidance to turn faucets off.',
      adaptiveSeverity: 1, // Moderate
      challengingBehaviors: 'Engages in tantrums (screaming, dropping) when access to preferred items is denied or when demand is presented. Average duration: 5 minutes.',
      challengingSeverity: 1, // Moderate
      standardizedAssessment: 'VB-MAPP milestones assessment was conducted. Scores indicate a strong Level 1 profile with emerging Level 2 milestones in manding and visual-perceptual skills. Significant deficits remain in listener responding, play, and social skills.'
    }
  },
  'ethan-brooks': {
    clientInfo: {
      dob: '2017-08-22',
      initialAssessmentDate: '2024-11-10',
      reassessmentDate: '2026-06-12',
      parentName: 'Sarah Brooks',
      parentPhone: '(555) 456-7890',
      parentEmail: 'sbrooks@example.org'
    },
    biopsychosocial: {
      familyStructure: 'Ethan resides with his mother and maternal grandmother. He is an only child. His father resides out of state and has visitation every other weekend.',
      medications: 'Melatonin (3mg) at bedtime for sleep management.',
      medicalHistory: 'Born at 37 weeks via scheduled C-section. Early developmental history significant for speech delays (first words at age 3). General physical health is good; no food allergies or dietary restrictions.',
      gradeIndex: 3, // 2nd Grade
      gradeText: '2nd',
      schoolTypeIndex: 0, // Public school
      schoolTypeText: 'Public school',
      schoolHoursStart: '08:15',
      schoolHoursEnd: '14:45',
      academicSchedule: 'Special Education Classroom. Structured Reading: 08:30 - 09:30, Mathematics: 09:45 - 10:45, Speech-Language Therapy: 11:00 - 11:30 (Tues/Thurs), Lunch/Recess: 11:30 - 12:30, Motor Skills: 13:00 - 13:45.',
      schoolHoursPerWeek: '32.5 hours',
      abaProvider: 'Hope ABA Center',
      abaStartDate: '2023-06-15',
      abaEndDate: '2024-10-30',
      abaOutcomes: 'Ethan successfully reduced self-injurious head tapping and learned to utilize a picture exchange communication system (PECS) for 8 high-preference food items.',
      mentalHealthServices: 'N/A - no other mental health services or hospitalizations.',
      otherServices: 'Speech Therapy: 2 sessions per week, 1 hour overall. Occupational Therapy: 1 session per week, 1 hour overall.',
      coordinationOfCare: 'Regular progress updates shared between speech therapist and ABA team to align on communication vocabulary.',
      majorLifeChanges: 'N/A'
    },
    narrative: {
      observationDate: '2026-06-08',
      clinicalNarrative: 'Ethan was observed in his classroom setting. During structured desk work, he required frequent verbal and gestural prompts to stay on task. During free play, he lined up cars by color and resisted peer attempts to join his play space. When a peer touched his car, Ethan screamed and pushed the peer. In home observation, Ethan cooperated well with his mother, but exhibited severe resistance (screaming, dropping) when transitioned away from the iPad.',
      langStrengths: 'Excellent receptive language skills; points to complex actions and scenes in books. Can follow 2-step instructions when visual support is provided.',
      langChallenges: 'Exhibits high rates of immediate echolalia (repeating questions instead of answering). Vocalizations are mostly non-functional unless highly motivated.',
      langSeverity: 1, // Moderate
      socialStrengths: 'Smiles and waves when greeted by familiar instructors. Will sit next to peers during circle time.',
      socialChallenges: 'Does not respond to peer initiations. Avoids eye contact when asked a direct question. Does not engage in joint attention.',
      socialSeverity: 2, // Severe
      adaptiveStrengths: 'Able to dress himself with loose clothing (sweatpants, t-shirt). Feeds himself with fork and spoon. Daytime toilet trained.',
      adaptiveChallenges: 'Requires physical assistance with shoes and buttons. Refuses to wash hands without physical prompts. Does not blow nose independently.',
      adaptiveSeverity: 1, // Moderate
      challengingBehaviors: 'Engages in physical aggression (pushing, scratching) when peers interfere with repetitive play or preferred items. Tantrums occur during transitions.',
      challengingSeverity: 1, // Moderate
      standardizedAssessment: 'AFLS (Assessment of Functional Living Skills) and VB-MAPP conducted. Scoring indicates significant deficits in social/communication fields but strong progress in basic self-help domains.'
    }
  },
  'mia-hernandez': {
    clientInfo: {
      dob: '2019-11-03',
      initialAssessmentDate: '2025-05-20',
      reassessmentDate: '2026-06-14',
      parentName: 'Carlos Hernandez',
      parentPhone: '(555) 987-6543',
      parentEmail: 'carlos.h@hernandezfamily.net'
    },
    biopsychosocial: {
      familyStructure: 'Mia lives with her parents and two younger brothers (ages 2 and 6 months) in a single-family home. The family is bilingual (Spanish/English). Mia is exposed to Spanish at home and English at daycare.',
      medications: 'None currently prescribed.',
      medicalHistory: 'Uncomplicated pregnancy and delivery. Diagnosed with Autism Spectrum Disorder at age 2.5. Mild sensory sensitivities to loud noises (vacuum cleaner, sirens). Normal hearing and vision.',
      gradeIndex: 1, // Kindergarten
      gradeText: 'K',
      schoolTypeIndex: 1, // Private school
      schoolTypeText: 'Private school',
      schoolHoursStart: '09:00',
      schoolHoursEnd: '13:00',
      academicSchedule: 'Daycare/Pre-K structure. Circle Time: 09:15 - 09:45, Tabletop activities (coloring, puzzles): 10:00 - 10:45, Outdoor Play: 11:00 - 12:00, Lunch: 12:00 - 12:30, Storytime: 12:30 - 13:00.',
      schoolHoursPerWeek: '20 hours',
      abaProvider: 'N/A',
      abaStartDate: '',
      abaEndDate: '',
      abaOutcomes: 'No prior formal ABA history. Mia received speech therapy for 6 months (ended in early 2025).',
      mentalHealthServices: 'N/A',
      otherServices: 'Speech Therapy: 1 session per week, 1 hour overall.',
      coordinationOfCare: 'Care coordination with pediatrician regarding milestone updates and daycare placement.',
      majorLifeChanges: 'Welcomed a new baby brother in late 2025.'
    },
    narrative: {
      observationDate: '2026-06-09',
      clinicalNarrative: 'Mia was observed during tabletop work. She sat for 10 minutes playing with a sensory puzzle, demonstrating good fine motor control. She communicates using Spanish/English hybrid vocalizations of 2-3 words (e.g., "quiero agua", "more play"). When prompted to transition to circle time, she whimpered but walked to the rug when shown a token board. During outdoor play, she ran near peers but did not interact.',
      langStrengths: 'Uses 2-3 word vocal combinations. Strong bilingual receptive understanding. Labels common foods and toys in both Spanish and English.',
      langChallenges: 'Exhibits pronoun reversals (using "you" instead of "I"). Speaks with a quiet, flat intonation. Struggles with conversation and answering questions.',
      langSeverity: 1, // Moderate
      socialStrengths: 'Sustained eye contact during face-to-face play. Approaches peers and sits near them. Shows toys to adults to share interest.',
      socialChallenges: 'Does not vocalize to peers. Does not understand rules of cooperative games (e.g. tag, hide-and-seek). Rejects peer toys.',
      socialSeverity: 1, // Moderate
      adaptiveStrengths: 'Drinks from an open cup without spilling. Wipes face with a napkin. Can unzip her jacket.',
      adaptiveChallenges: 'Requires assistance with buttoning, snapping pants, and hand washing steps (requires reminders to use soap). Not fully night-time trained.',
      adaptiveSeverity: 0, // Mild
      challengingBehaviors: 'Engages in whining, crying, and vocal protests during transitions or when denied access. Non-aggressive. Sensory avoidance noted during loud sounds.',
      challengingSeverity: 0, // Mild
      standardizedAssessment: 'Vineland-3 Adaptive Behavior Scales and VB-MAPP administered. Mia scores in the moderately low range for communication and social skills, with adequate scores in daily living skills.'
    }
  }
};

function renderDraftMigrations(clientId) {
  const draftList = document.getElementById('draft-migrations-list');
  if (!draftList) return;

  const client = typeof getClientById === 'function' ? getClientById(clientId) : null;
  const clientName = client ? client.name : 'Client';

  let fileName = '';
  let detailText = '';
  
  if (importType === 'assessment') {
    if (clientId === 'ethan-brooks') {
      fileName = 'Ethan_Brooks_Assessment_Report_2025.pdf';
      detailText = 'Extracted: Client Info, Biopsychosocial, Clinical Observation';
    } else if (clientId === 'john-doe') {
      fileName = 'John_Doe_Initial_Assessment_Report_2025.pdf';
      detailText = 'Extracted: Client Info, Biopsychosocial, Clinical Observation';
    } else if (clientId === 'mia-hernandez') {
      fileName = 'Mia_Hernandez_Assessment_Evaluation_2025.docx';
      detailText = 'Extracted: Client Info, Biopsychosocial, Clinical Observation';
    } else {
      fileName = `${clientName.replace(/\s+/g, '_')}_Assessment.pdf`;
      detailText = 'Extracted: Client Info, Biopsychosocial, Clinical Observation';
    }
  } else {
    if (clientId === 'ethan-brooks') {
      fileName = 'Ethan_Brooks_Intake_&_Treatment_Plan_2025.pdf';
      detailText = 'Extracted: 2 Goals, 2 Targets';
    } else if (clientId === 'john-doe') {
      fileName = 'John_Doe_Legacy_Plan_2025.pdf';
      detailText = 'Extracted: 2 Goals, 2 Targets';
    } else if (clientId === 'mia-hernandez') {
      fileName = 'Mia_Hernandez_Treatment_Plan_2025.docx';
      detailText = 'Extracted: 2 Goals, 2 Targets';
    } else {
      fileName = `${clientName.replace(/\s+/g, '_')}_Intake.pdf`;
      detailText = 'Extracted: 1 Goal, 2 Targets';
    }
  }

  draftList.innerHTML = `
    <div class="file-row" style="border-left: 4px solid var(--color-turquoise);">
      <div>
        <strong>${fileName}</strong>
        <span style="color: var(--color-blue-dark); font-weight: 500;">${detailText}</span>
      </div>
      <button class="glass-btn btn-sm" onclick="openReviewModal('${clientId}')">Review & Commit</button>
    </div>
  `;
}

function triggerBulkUpload() {
  document.getElementById('migration-file-input').click();
}

function handleFileUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  
  const uploadZone = document.getElementById('migration-upload-zone');
  const originalHtml = uploadZone.innerHTML;
  
  // Simulate AI parsing loading state
  uploadZone.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <i data-lucide="loader-2" class="lucide-loader-2" style="width: 48px; height: 48px; color: var(--color-blue); margin-bottom: 1rem; animation: spin 2s linear infinite;"></i>
      <h3 style="color: var(--color-blue-dark);">AI is analyzing ${files.length} document(s)...</h3>
      <p style="color: var(--color-text-light);">${importType === 'assessment' ? 'Extracting client details, biopsychosocial history, and clinical observations.' : 'Extracting targets, baselines, and mastery criteria.'}</p>
    </div>
  `;
  lucide.createIcons();
  
  // Adding spin animation if not exists
  if (!document.getElementById('spin-anim')) {
    const style = document.createElement('style');
    style.id = 'spin-anim';
    style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }

  setTimeout(() => {
    uploadZone.innerHTML = originalHtml;
    lucide.createIcons();
    
    // Add new draft to list
    const draftList = document.getElementById('draft-migrations-list');
    const newDraft = document.createElement('div');
    newDraft.className = 'file-row';
    newDraft.style.borderLeft = '4px solid var(--color-turquoise)';
    newDraft.innerHTML = `
      <div>
        <strong>${files[0].name}</strong>
        <span style="color: var(--color-blue-dark); font-weight: 500;">${importType === 'assessment' ? 'Extracted: Client Info, Biopsychosocial, Clinical Observation' : 'Extracted: 2 Goals, 2 Targets'}</span>
      </div>
      <button class="glass-btn btn-sm" onclick="openReviewModal('${selectedClientId || 'ethan-brooks'}')">Review & Commit</button>
    `;
    draftList.prepend(newDraft);
    
    // Reset file input
    event.target.value = '';
  }, 2500);
}

function openReviewModal(clientId) {
  const modal = document.getElementById('migration-modal-overlay');
  const content = document.getElementById('migration-modal-content');
  if (!modal || !content) return;

  const client = typeof getClientById === 'function' ? getClientById(clientId) : null;
  const clientName = client ? client.name : 'Unknown Client';
  const clientDob = client ? client.dob : '—';
  const clientDiag = client ? client.diagnosis : 'ASD Level 2';
  
  if (importType === 'assessment') {
    const data = MIGRATION_ASSESSMENTS[clientId] || MIGRATION_ASSESSMENTS['john-doe'];
    const severities = ['Mild', 'Moderate', 'Severe'];
    
    let mockDataHtml = `
      <div style="margin-bottom: 1.5rem;">
        <h3 style="color: var(--color-blue-dark); margin-bottom: 0.8rem; display: flex; align-items: center; gap: 6px; font-size: 1.1rem;">
          <i data-lucide="user" style="width: 18px; height: 18px; color: var(--color-blue);"></i> Client & Family Details
        </h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; background: rgba(2, 136, 209, 0.03); padding: 1rem; border-radius: 12px; border: 1px solid rgba(2, 136, 209, 0.08); font-size: 0.9rem;">
          <div><strong>Name:</strong> ${escapeHtml(clientName)}</div>
          <div><strong>DOB:</strong> ${escapeHtml(data.clientInfo.dob)}</div>
          <div><strong>Diagnosis:</strong> ${escapeHtml(clientDiag)}</div>
          <div><strong>Assessment Date:</strong> ${escapeHtml(data.clientInfo.reassessmentDate)}</div>
          <div><strong>Parent/Guardian:</strong> ${escapeHtml(data.clientInfo.parentName)}</div>
          <div><strong>Phone:</strong> ${escapeHtml(data.clientInfo.parentPhone)}</div>
          <div><strong>Email:</strong> ${escapeHtml(data.clientInfo.parentEmail)}</div>
          <div><strong>Source File:</strong> ${escapeHtml(clientName.replace(/\s+/g, '_'))}_Assessment_2025.pdf</div>
        </div>
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <h3 style="color: var(--color-blue-dark); margin-bottom: 0.8rem; display: flex; align-items: center; gap: 6px; font-size: 1.1rem;">
          <i data-lucide="activity" style="width: 18px; height: 18px; color: var(--color-blue);"></i> Biopsychosocial History
        </h3>
        <div style="display: flex; flex-direction: column; gap: 0.75rem; background: rgba(0,0,0,0.02); padding: 1rem; border-radius: 12px; border: 1px solid rgba(0,0,0,0.05); font-size: 0.9rem;">
          <div><strong>Family Structure:</strong> <span style="color: var(--color-text);">${escapeHtml(data.biopsychosocial.familyStructure)}</span></div>
          <div><strong>Medical History & Medications:</strong> <span style="color: var(--color-text);">${escapeHtml(data.biopsychosocial.medicalHistory)} (Medications: ${escapeHtml(data.biopsychosocial.medications)})</span></div>
          <div><strong>School Setting:</strong> <span style="color: var(--color-text);">Grade: ${escapeHtml(data.biopsychosocial.gradeText)} | ${escapeHtml(data.biopsychosocial.schoolTypeText)} (${escapeHtml(data.biopsychosocial.schoolHoursStart)} - ${escapeHtml(data.biopsychosocial.schoolHoursEnd)})</span></div>
          <div><strong>Previous ABA Services:</strong> <span style="color: var(--color-text);">Provider: ${escapeHtml(data.biopsychosocial.abaProvider)} (${escapeHtml(data.biopsychosocial.abaStartDate)} to ${escapeHtml(data.biopsychosocial.abaEndDate)}) - ${escapeHtml(data.biopsychosocial.abaOutcomes)}</span></div>
          <div><strong>Other Services:</strong> <span style="color: var(--color-text);">${escapeHtml(data.biopsychosocial.otherServices)}</span></div>
        </div>
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <h3 style="color: var(--color-blue-dark); margin-bottom: 0.8rem; display: flex; align-items: center; gap: 6px; font-size: 1.1rem;">
          <i data-lucide="clipboard" style="width: 18px; height: 18px; color: var(--color-blue);"></i> Observation & Clinical Narrative
        </h3>
        <div style="display: flex; flex-direction: column; gap: 0.75rem; background: rgba(0,0,0,0.02); padding: 1rem; border-radius: 12px; border: 1px solid rgba(0,0,0,0.05); font-size: 0.9rem;">
          <div><strong>Direct Observation (${escapeHtml(data.narrative.observationDate)}):</strong> <span style="color: var(--color-text);">${escapeHtml(data.narrative.clinicalNarrative)}</span></div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 0.25rem;">
            <div style="background: white; padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid rgba(0,0,0,0.05);">
              <strong>Language:</strong> Severity: <span class="badge" style="background: rgba(2, 136, 209, 0.1); color: var(--color-blue);">${severities[data.narrative.langSeverity]}</span>
            </div>
            <div style="background: white; padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid rgba(0,0,0,0.05);">
              <strong>Social Skills:</strong> Severity: <span class="badge" style="background: rgba(2, 136, 209, 0.1); color: var(--color-blue);">${severities[data.narrative.socialSeverity]}</span>
            </div>
            <div style="background: white; padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid rgba(0,0,0,0.05);">
              <strong>Adaptive Self-Care:</strong> Severity: <span class="badge" style="background: rgba(2, 136, 209, 0.1); color: var(--color-blue);">${severities[data.narrative.adaptiveSeverity]}</span>
            </div>
            <div style="background: white; padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid rgba(0,0,0,0.05);">
              <strong>Challenging Behaviors:</strong> Severity: <span class="badge" style="background: rgba(2, 136, 209, 0.1); color: var(--color-blue);">${severities[data.narrative.challengingSeverity]}</span>
            </div>
          </div>
          <div><strong>Standardized Assessment Info:</strong> <span style="color: var(--color-text);">${escapeHtml(data.narrative.standardizedAssessment)}</span></div>
        </div>
      </div>
    `;
    
    content.innerHTML = mockDataHtml;
    lucide.createIcons();
    modal.style.display = 'flex';
    return;
  }

  const targets = MIGRATION_TARGETS[clientId] || [
    {
      name: 'Functional Communication Training',
      domain: 'skill',
      measurementType: 'percent',
      category: 'Communication',
      masteryCriteria: { threshold: 90, consecutiveSessions: 3 },
      phase: 'Acquisition',
      opDef: 'Requesting items or breaks using words or PECS.',
      procedures: 'Prompt when child indicates desire for item.'
    }
  ];

  let targetsHtml = targets.map((target, index) => {
    const isTa = target.measurementType === 'ta';
    const detailString = isTa 
      ? `${target.steps.length} Steps Extracted`
      : `Domain: ${target.domain === 'skill' ? 'Skill' : 'Problem'} &bull; Baseline: 10% &bull; Mastery: ${target.masteryCriteria.threshold || 90}% across ${target.masteryCriteria.consecutiveSessions || 3} sessions`;

    return `
      <div style="background: white; padding: 1rem; border-radius: 12px; border: 1px solid rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <div>
          <div style="font-weight: 600; color: var(--color-text);">${target.name} (${target.measurementType === 'ta' ? 'Task Analysis' : '% Correct'})</div>
          <div style="font-size: 0.85rem; color: var(--color-text-light);">${detailString}</div>
        </div>
        <i data-lucide="edit-2" style="width: 16px; height: 16px; color: var(--color-blue); cursor: pointer;"></i>
      </div>
    `;
  }).join('');

  let mockDataHtml = `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="color: var(--color-blue-dark); margin-bottom: 0.5rem;">Client Details</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: rgba(0,0,0,0.03); padding: 1rem; border-radius: 12px; border: 1px solid rgba(0,0,0,0.05);">
        <div><strong>Name:</strong> ${clientName}</div>
        <div><strong>DOB:</strong> ${clientDob}</div>
        <div><strong>Diagnosis:</strong> ${clientDiag}</div>
        <div><strong>Found in:</strong> ${clientName.replace(/\s+/g, '_')}_Intake.pdf</div>
      </div>
    </div>
    
    <div style="margin-bottom: 1.5rem;">
      <h3 style="color: var(--color-blue-dark); margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
        Skill/Problem Targets (${targets.length})
        <button class="glass-btn btn-sm" style="font-size: 0.8rem; padding: 0.3rem 0.6rem;">+ Add Missing</button>
      </h3>
      
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        ${targetsHtml}
      </div>
    </div>
  `;
  
  content.innerHTML = mockDataHtml;
  lucide.createIcons();
  
  modal.style.display = 'flex';
}

function closeReviewModal() {
  document.getElementById('migration-modal-overlay').style.display = 'none';
}

async function commitMigration() {
  const btn = document.querySelector('#migration-modal-overlay .btn-primary, #migration-modal-overlay button[onclick="commitMigration()"]');
  if (!btn) return;
  const originalText = btn.innerHTML;
  btn.innerHTML = `<i data-lucide="loader-2" class="lucide-loader-2" style="width: 18px; height: 18px; animation: spin 2s linear infinite;"></i> Committing...`;
  lucide.createIcons();

  const clientId = selectedClientId || 'ethan-brooks';

  if (importType === 'assessment') {
    const data = MIGRATION_ASSESSMENTS[clientId] || MIGRATION_ASSESSMENTS['john-doe'];
    localStorage.setItem('aba-assessment-data-' + clientId, JSON.stringify(data));
    
    // Also save the clientName in the program data so everything syncs up perfectly
    if (typeof loadProgramData === 'function' && typeof saveProgramData === 'function') {
      const client = typeof getClientById === 'function' ? getClientById(clientId) : null;
      const program = loadProgramData();
      if (client) {
        program.clientName = client.name;
        saveProgramData(program);
      }
    }

    setTimeout(() => {
      closeReviewModal();
      btn.innerHTML = originalText;
      alert(`Success! The legacy assessment report details have been successfully imported and mapped to the template.`);
      
      // Remove the committed item from the draft list
      const draftList = document.getElementById('draft-migrations-list');
      if (draftList && draftList.children.length > 0) {
          draftList.removeChild(draftList.children[0]);
      }
    }, 1500);
    return;
  }

  const targetsToImport = MIGRATION_TARGETS[clientId] || [
    {
      name: 'Functional Communication Training',
      domain: 'skill',
      measurementType: 'percent',
      category: 'Communication',
      masteryCriteria: { threshold: 90, consecutiveSessions: 3 },
      phase: 'Acquisition',
      opDef: 'Requesting items or breaks using words or PECS.',
      procedures: 'Prompt when child indicates desire for item.'
    }
  ];

  let successCount = 0;

  try {
    // Check if we are connected to Supabase
    if (typeof upsertTargetAsync === 'function' && window.supabaseClient && window.supabaseClient.auth?.session?.()) {
      console.log(`Importing targets to Supabase for client: ${clientId}`);
      for (const target of targetsToImport) {
        await upsertTargetAsync(clientId, target);
        successCount++;
      }
    } else {
      // LocalStorage fallback
      console.log(`Importing targets to LocalStorage for client: ${clientId}`);
      if (typeof upsertTarget === 'function') {
        // Update the client name in local storage program to match the selected client
        if (typeof loadProgramData === 'function' && typeof saveProgramData === 'function') {
          const client = typeof getClientById === 'function' ? getClientById(clientId) : null;
          const program = loadProgramData();
          if (client) {
            program.clientName = client.name;
            saveProgramData(program);
          }
        }
        for (const target of targetsToImport) {
          upsertTarget(target);
          successCount++;
        }
      }
    }
  } catch (error) {
    console.error('Error committing migration:', error);
  }

  setTimeout(() => {
    closeReviewModal();
    btn.innerHTML = originalText;
    
    // Show a success toast or alert
    alert(`Success! ${successCount} targets from the legacy plan have been successfully imported and committed to the database.`);
    
    // Remove the committed item from the draft list
    const draftList = document.getElementById('draft-migrations-list');
    if (draftList && draftList.children.length > 0) {
        draftList.removeChild(draftList.children[0]);
    }
  }, 1500);
}

function addAssessmentGoal(btn) {
  // Find the container for this domain
  const container = btn.closest('.assessment-domain-container');
  if (!container) return;
  
  // Clone the first table in the container
  const firstTable = container.querySelector('.assessment-table');
  const newTable = firstTable.cloneNode(true);
  
  // Clear inputs in the new table
  newTable.querySelectorAll('textarea').forEach(ta => ta.value = '');
  newTable.querySelectorAll('input[type="date"]').forEach(inp => inp.value = '');
  newTable.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  
  // Add some spacing between tables
  newTable.style.marginTop = '1.5rem';
  
  // Append to the container
  container.appendChild(newTable);
  
  // Re-initialize lucide icons if any were cloned
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

function addNewBehavior() {
  const behaviorName = prompt("Enter the name of the new behavior (e.g., 'Spitting', 'Biting'):");
  if (!behaviorName || behaviorName.trim() === '') return;
  
  const name = behaviorName.trim();
  
  // Create Replacement Behaviors Domain HTML
  const rbDomain = document.createElement('div');
  rbDomain.className = 'assessment-domain-container';
  rbDomain.style.cssText = 'background: rgba(255,255,255,0.4); border-top: 1px solid rgba(0,0,0,0.1);';
  rbDomain.innerHTML = `
    <h3 style="position: relative; font-size: 1.1rem; color: var(--color-blue-dark); text-align: center; padding: 1rem; margin: 0; background: rgba(2, 136, 209, 0.05); border-bottom: 1px solid rgba(0,0,0,0.05);">
      ${name}
      <button type="button" class="glass-btn btn-sm" onclick="addAssessmentGoal(this)" style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); padding: 0.25rem 0.75rem; font-size: 0.8rem; display: flex; align-items: center; gap: 4px;">
        <i data-lucide="plus" style="width: 14px; height: 14px;"></i> Add Goal
      </button>
    </h3>
    <table class="assessment-table">
      <tr><td class="assessment-label-cell">Medical Necessity Rationale:</td><td class="assessment-input-cell"><textarea class="assessment-textarea"></textarea></td></tr>
      <tr><td class="assessment-label-cell">Goal Statement:<span class="assessment-sub-label" style="text-transform: none; margin-top: 0.25rem;">Goals should include mastery criteria.</span></td><td class="assessment-input-cell"><textarea class="assessment-textarea"></textarea></td></tr>
      <tr><td class="assessment-label-cell">Baseline:<span class="assessment-sub-label" style="text-transform: none; margin-top: 0.25rem;">Must be a quantitative measure. (e.g., per hour/week/month, etc.)</span></td><td class="assessment-input-cell"><textarea class="assessment-textarea"></textarea></td></tr>
      <tr><td class="assessment-label-cell">Date of Introduction:</td><td class="assessment-input-cell"><input type="date" class="assessment-input-date"></td></tr>
      <tr><td class="assessment-label-cell">Projected Mastery:</td><td class="assessment-input-cell"><input type="date" class="assessment-input-date"></td></tr>
      <tr><td class="assessment-label-cell">Progress Data:<ul style="font-size: 0.75rem; color: var(--color-text-light); padding-left: 1rem; margin-top: 0.25rem; margin-bottom: 0;"><li>Measure must match baseline measure (e.g., per hour/week/month, etc.).</li><li>If applicable, include narrative of any changes in teaching procedures that occurred to assist.</li></ul></td><td class="assessment-input-cell"><textarea class="assessment-textarea"></textarea></td></tr>
      <tr><td class="assessment-label-cell">Barriers:<span class="assessment-sub-label" style="text-transform: none; margin-top: 0.25rem;">Include specific actionable measures completed to remediate these barriers as well as actionable steps for the next authorization period.</span></td><td class="assessment-input-cell"><textarea class="assessment-textarea"></textarea></td></tr>
      <tr><td class="assessment-label-cell">Graphs (optional):</td><td class="assessment-input-cell"><div class="upload-zone glass-panel" style="border: 2px dashed rgba(1, 87, 155, 0.3); text-align: center; padding: 2rem; cursor: pointer; transition: all 0.3s ease;" onclick="this.querySelector('input').click()"><i data-lucide="image-plus" style="width: 32px; height: 32px; color: var(--color-blue); margin-bottom: 0.5rem;"></i><h4 style="margin: 0; color: var(--color-blue-dark); font-size: 0.95rem;">Drag & Drop Graphs</h4><p style="color: var(--color-text-light); font-size: 0.8rem; margin-top: 0.25rem;">Or click to import screenshots</p><input type="file" multiple style="display: none;" accept="image/*"></div></td></tr>
    </table>
  `;

  // Create Reduction Behavior Domain HTML
  const reductionDomain = document.createElement('div');
  reductionDomain.className = 'assessment-domain-container';
  reductionDomain.style.cssText = 'background: rgba(255,255,255,0.4); border-top: 1px solid rgba(0,0,0,0.1);';
  reductionDomain.innerHTML = `
    <h3 style="position: relative; font-size: 1.1rem; color: var(--color-blue-dark); text-align: center; padding: 1rem; margin: 0; background: rgba(2, 136, 209, 0.05); border-bottom: 1px solid rgba(0,0,0,0.05);">
      ${name}
    </h3>
    <table class="assessment-table">
      <tr><td class="assessment-label-cell">Goal Statement:<span class="assessment-sub-label" style="text-transform: none; margin-top: 0.25rem;">Goals should include mastery criteria.</span></td><td class="assessment-input-cell"><textarea class="assessment-textarea"></textarea></td></tr>
      <tr><td class="assessment-label-cell">Baseline:<span class="assessment-sub-label" style="text-transform: none; margin-top: 0.25rem;">Must be a quantitative measure. (e.g., per hour/week/month, etc.)</span></td><td class="assessment-input-cell"><textarea class="assessment-textarea"></textarea></td></tr>
      <tr><td class="assessment-label-cell">Date of Introduction:</td><td class="assessment-input-cell"><input type="date" class="assessment-input-date"></td></tr>
      <tr><td class="assessment-label-cell">Projected Mastery:</td><td class="assessment-input-cell"><input type="date" class="assessment-input-date"></td></tr>
      <tr><td class="assessment-label-cell">Progress Data:<ul style="font-size: 0.75rem; color: var(--color-text-light); padding-left: 1rem; margin-top: 0.25rem; margin-bottom: 0;"><li>Measure must match baseline measure (e.g., per hour/week/month, etc.).</li></ul></td><td class="assessment-input-cell"><textarea class="assessment-textarea"></textarea></td></tr>
      <tr><td class="assessment-label-cell">Graphs (required):</td><td class="assessment-input-cell"><div class="upload-zone glass-panel" style="border: 2px dashed rgba(1, 87, 155, 0.3); text-align: center; padding: 2rem; cursor: pointer; transition: all 0.3s ease;" onclick="this.querySelector('input').click()"><i data-lucide="image-plus" style="width: 32px; height: 32px; color: var(--color-blue); margin-bottom: 0.5rem;"></i><h4 style="margin: 0; color: var(--color-blue-dark); font-size: 0.95rem;">Drag & Drop Graphs</h4><p style="color: var(--color-text-light); font-size: 0.8rem; margin-top: 0.25rem;">Or click to import screenshots</p><input type="file" multiple style="display: none;" accept="image/*"></div></td></tr>
      <tr><td class="assessment-label-cell">Barriers:<span class="assessment-sub-label" style="text-transform: none; margin-top: 0.25rem;">Include specific actionable measures you completed to remediate these barriers as well as actionable steps for the next authorization period. If applicable, include narrative of any changes in the behavior intervention plan that occurred to assist with reduction of the behavior.</span></td><td class="assessment-input-cell"><textarea class="assessment-textarea"></textarea></td></tr>
    </table>
  `;

  // Append to the respective sections
  const rbSection = document.querySelector('[data-assessment-pane="replacement-behaviors"]');
  const reductionSection = document.querySelector('[data-assessment-pane="reduction-behaviors"]');
  
  if (rbSection) rbSection.appendChild(rbDomain);
  if (reductionSection) reductionSection.appendChild(reductionDomain);
  
  // Re-initialize lucide icons for the newly added buttons
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

function openAssessmentInNewTab() {
  let clientName = document.getElementById('selected-client-name').textContent || '';
  if (clientName === 'Document Library') clientName = '';
  window.open(`assessment.html?clientName=${encodeURIComponent(clientName)}`, '_blank');
}
