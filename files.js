// --- View State Management ---

let selectedClientId = '';

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
    },
    goals: {
      totalGoals: '6',
      goalsMastered: '2',
      goalsInProgress: '3',
      goalsOnHold: '1',
      goalsDiscontinued: '0',
      goalsNew: '3',
      responseToTreatment: 'John has responded positively to structured visual schedules and token economics. His rates of compliance with transitions have increased from 30% to 75% over this period. Skill acquisition was optimized by introducing high-preference edible reinforcers and peer modeling.'
    },
    skillAcquisition: {
      langComm: {
        medicalNecessity: 'Directly addresses core social-communication deficits in ASD. Improving functional manding reduces tantrum frequency by providing a functional communication replacement.',
        goalStatement: 'John will independently mand (request) desired items or actions using at least a 3-word phrase (e.g. "I want juice") across 3 different therapists and 2 environments for 80% of opportunities across 3 consecutive sessions by 12/15/2026.',
        baseline: 'Client currently mands using single words or pointing (approx. 15% of opportunities).',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'John has begun using 2-word approximations (e.g. "want toy") in 40% of trials under direct prompting.',
        barriers: 'Inconsistent parental reinforcement of 3-word phrases at home. Remedy: Parent training sessions will focus on prompting manding.'
      },
      social: {
        medicalNecessity: 'Addresses social interaction deficits of ASD. Increasing turn-taking skills enables integration into mainstream group settings.',
        goalStatement: 'John will engage in cooperative play with a peer by taking turns during a board game or structured activity for 5 turns with no more than 1 gestural prompt for 3 consecutive sessions by 12/15/2026.',
        baseline: 'Engages in parallel play only; does not take turns or share items (0% baseline).',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'Currently participates in turn-taking play with BCBA with gestural prompts (50% progress).',
        barriers: 'High rate of task-avoidant whining when peers take turns. Remedy: Incorporate high-density reinforcement schedules.'
      },
      adaptive: {
        medicalNecessity: 'Addresses deficits in adaptive functioning. Promoting hand washing independence decreases reliance on caregivers and ensures basic hygiene.',
        goalStatement: 'John will independently wash and dry his hands following the 7-step task analysis with 100% independence for 5 consecutive opportunities by 12/15/2026.',
        baseline: 'Requires hand-over-hand assistance for wetting, soaping, and drying (20% steps independent).',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'Now independent in turning on faucet and applying soap (45% independent steps).',
        barriers: 'Sensory aversion to paper towels. Remedy: Changed to soft cotton towels and provided verbal reinforcement.'
      }
    },
    replacementBehaviors: {
      aggression: {
        medicalNecessity: 'Aggressive behavior poses safety risks. Replacing aggression with functional requests (mands) is medically necessary to ensure client safety.',
        goalStatement: 'John will use functional communication (e.g., saying "break" or "no thank you") instead of engaging in aggressive behaviors (hitting, pushing) for 95% of demand transitions by 12/15/2026.',
        baseline: 'Engages in hitting/pushing during demand transitions (average 3 episodes per day).',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'Aggressive episodes reduced to average 1 episode per day when using functional communication cards.',
        barriers: 'Delayed response from therapists during high-intensity periods. Remedy: Ensure visual icons are always within reach.'
      },
      elopement: {
        medicalNecessity: 'Elopement poses severe safety concerns. Teaching John to stay in specified bounds is critical for safety.',
        goalStatement: 'John will remain in the designated work or play area for 15 minutes without eloping (running out of the room/area) for 90% of opportunities across 3 consecutive sessions by 12/15/2026.',
        baseline: 'Elopes from work table approximately 4 times per hour.',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'Elopement reduced to 1 time per hour with token board implementation.',
        barriers: 'High distractors in open areas. Remedy: Position work desk facing the wall to minimize visual distractions.'
      },
      propertyDestruction: {
        medicalNecessity: 'Destruction of materials limits access to educational settings. Replacing throwing behavior with requesting help is medically necessary.',
        goalStatement: 'John will request assistance (e.g., saying "help" or handing help card) instead of throwing or tearing materials during difficult tasks in 90% of opportunities by 12/15/2026.',
        baseline: 'Throws/tears tasks in 60% of presented difficult tasks.',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'Tears materials in only 20% of trials when "help" prompt is pre-emptively delivered.',
        barriers: 'Latency in therapist assistance. Remedy: Immediate reinforcement for "help" requests.'
      }
    },
    reductionBehaviors: {
      aggression: {
        goalStatement: 'John will decrease occurrences of physical aggression (hitting, pushing, biting others) to 0 episodes per week for 4 consecutive weeks by 12/15/2026.',
        baseline: '15 episodes per week.',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'Reduced to average 3 episodes per week.',
        barriers: 'Aggression reinforced by escape from demands. Consequence procedure modified to follow escape extinction protocol.'
      },
      elopement: {
        goalStatement: 'John will decrease occurrences of elopement (running away from supervising adult or leaving designated area) to 0 episodes per week for 4 consecutive weeks by 12/15/2026.',
        baseline: '24 episodes per week.',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'Reduced to average 4 episodes per week.',
        barriers: 'Access to outdoor areas. Remedy: Installed childproof safety locks on exterior doors.'
      },
      propertyDestruction: {
        goalStatement: 'John will decrease occurrences of property destruction (tearing papers, throwing toys/materials, slamming doors) to 1 or fewer episodes per week for 4 consecutive weeks by 12/15/2026.',
        baseline: '8 episodes per week.',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'Reduced to average 2 episodes per week.',
        barriers: 'Access to fragile items. Remedy: Relocated all instructional materials to closed cabinets.'
      }
    },
    bip: {
      behaviorAssessment: 'Functional Behavior Assessment (FBA) including FAST (Functional Analysis Screening Tool) and ABC data collection conducted in June 2026. Results indicate that aggression and property destruction are primarily maintained by social negative reinforcement (escape from academic demands), and secondarily by social positive reinforcement (access to tangible items like the iPad).',
      targetBehavior: 'Physical Aggression & Property Destruction',
      operationalDefinition: 'Physical Aggression: Any instance of John making contact with another person using his hand, fist, foot, or teeth (including hitting, kicking, pushing, biting) from a distance of 1 inch or greater. Property Destruction: Any instance of John forcefully throwing objects (e.g. chairs, books, puzzles), ripping instructional papers, or slamming doors with enough force to produce a loud sound.',
      hypothesizedFunction: 'Social Negative Reinforcement (Escape from academic demands/tablework) and Social Positive Reinforcement (Access to iPad).',
      replacementBehavior: 'Functional Communication Training (FCT): Requesting a break by saying "Break please" or handing a visual break card. Requesting assistance by saying "Help please". Requesting access to items by manding vocally.',
      antecedentIntervention: '1. Visual Schedules: Pre-program transitions using a first-then board. 2. Behavioral Momentum: Present 3 easy high-probability demands before introducing a low-probability demand. 3. Demand Fading: Start with 1 easy task, reinforce, then gradually increase task length. 4. Premack Principle: iPad is only available after completing targeted tasks.',
      consequenceProcedures: '1. Escape Extinction: If John engages in target behavior to escape a demand, guide him physically to complete the task. Do not remove the task. 2. Differential Reinforcement of Alternative Behavior (DRA): Provide immediate access to reinforcement (30 seconds break or praise) only when John uses his replacement communication (FCT). 3. Response Block: Physically block hitting/throwing immediately without eye contact or vocal statements.',
      deescalationProcedures: '1. Remove all throwable/dangerous objects from the immediate area. 2. Maintain a neutral facial expression and flat tone of voice. 3. Provide minimal verbal instructions. 4. Give the client physical space while maintaining visual supervision.',
      crisisPlan: 'If John\'s behavior escalates to a level that presents an imminent risk of injury to himself or others, and escape-extinction is unsafe: 1. Clear the room of peers. 2. Position therapist at least 3 feet away. 3. Contact the BCBA (Jane Vance at 555-0100) or Clinical Director immediately. 4. If safety cannot be maintained, contact emergency services (911). 5. Notify parent/guardian immediately.',
      generalizationPlan: '1. Generalization across therapists: Train mother and father to implement extinction and FCT protocols. 2. Generalization across settings: Generalize FCT visual cards to community outings (park, grocery store) and school settings.'
    },
    caregiverTraining: {
      goalStatement: 'Jane Doe will independently implement the escape extinction protocol and FCT prompt hierarchy during home-based transitions for 100% of observed opportunities across 3 consecutive parent coaching sessions by 12/15/2026.',
      baseline: 'Currently implements escape extinction in 20% of opportunities, frequently giving in to tantrum behaviors.',
      dateIntro: '2026-06-16',
      projectedMastery: '2026-12-15',
      progressData: 'Currently implements protocol correctly in 60% of opportunities during BCBA parent training sessions.',
      barriers: 'Father\'s work schedule limits consistency. Remedy: Schedule bi-weekly evening coaching sessions to include both parents.'
    },
    transitionDischarge: {
      maintenancePlan: 'Skills will be transitioned to intermittent reinforcement schedules once mastery criteria (80% independent across 3 sessions) are met. Visual schedules will be gradually simplified to checklist formats.',
      generalizationPlan: 'Generalization will be programmed by using natural environment teaching (NET), introducing novel instructions and materials, and conducting sessions in community settings.',
      transitionFadingPlan: 'Titration of direct RBT services will occur in 5-hour decrements every 6 months, conditional on John maintaining low rates of challenging behavior (less than 1 episode per week) and mastering at least 4 skill acquisition goals per authorization period.',
      dischargeCriteria: 'John will be recommended for discharge from intensive ABA services when: 1. Challenging behaviors are maintained at near-zero rates (less than 1 episode per month) without crisis intervention. 2. John communicates needs independently using multi-word phrases. 3. Parents report high confidence (rating of 4/5) in managing transitions independently. 4. John is able to learn in a mainstream group environment with a 1:15 ratio.',
      crisisPlan: 'In the event of a regression or sudden increase in severe challenging behavior: 1. Re-evaluate FBA and BIP. 2. Schedule immediate parent meeting. 3. Conduct direct observation sessions. 4. Coordinate with pediatrician to rule out medical causes.',
      titrationTable: [
        { criteria: 'Client maintains physical aggression at < 1 episode per week, and masters 3 communication goals.', bcbaReduction: 'Reduce from 2 hours/week to 1.5 hours/week', rbtReduction: 'Reduce from 20 hours/week to 15 hours/week' },
        { criteria: 'Client washes hands, dresses, and toilet trains independently with 90% accuracy.', bcbaReduction: 'Reduce from 1.5 hours/week to 1 hour/week', rbtReduction: 'Reduce from 15 hours/week to 10 hours/week' },
        { criteria: 'Client participates in mainstream classroom with no aggression for 3 consecutive months.', bcbaReduction: 'Reduce to 0.5 hours/week for consultation', rbtReduction: 'Reduce from 10 hours/week to 5 hours/week' },
        { criteria: 'Client engages in cooperative peer play and turn-taking without adult prompts.', bcbaReduction: '0.5 hours/week consult', rbtReduction: 'Transition to 0 hours/week (Fully Discharged)' },
        { criteria: 'Parent demonstrates complete independence in managing home routines for 6 months.', bcbaReduction: 'Discharge BCBA services', rbtReduction: 'Discharged' }
      ]
    },
    recommendations: {
      medicalNecessity: 'Given John\'s presentation of moderate-to-severe social-communication deficits and physical aggression (maintained by escape), intensive 1:1 ABA services are recommended. Direct therapy (97153) at 20 hours per week is required to provide the high frequency of learning trials necessary to establish a functional communication repertoire and safely implement escape extinction. BCBA supervision (97155) at 2 hours per week is required to monitor progress, modify programs, and ensure treatment integrity. Parent training (97156) at 1 hour per week is critical to ensure generalization and maintenance of skills in the home.',
      barriers: 'Parent work schedules and occasional child illness are potential barriers. General coordination of schedules has been resolved by securing an afternoon session slot.',
      CPT97151: { hours: '3 hours', units: '12 units', pos: 'Office/Clinic' },
      CPT97152: { hours: 'N/A', units: 'N/A', pos: 'N/A' },
      CPT97153: { hours: '20 hours/week', units: '2080 units (6 mo)', pos: 'Home & Clinic' },
      CPT97154: { hours: 'N/A', units: 'N/A', pos: 'N/A' },
      CPT97155: { hours: '2 hours/week', units: '208 units (6 mo)', pos: 'Home & Clinic' },
      CPT97156: { hours: '1 hour/week', units: '104 units (6 mo)', pos: 'Home & Clinic' },
      CPT97157: { hours: 'N/A', units: 'N/A', pos: 'N/A' },
      CPT97158: { hours: 'N/A', units: 'N/A', pos: 'N/A' },
      prior97153: { units: '1560 units', pos: 'Home', barrier: 'Occasional school holidays caused minor cancellation of sessions.' },
      prior97154: { units: 'N/A', pos: 'N/A', barrier: 'N/A' },
      prior97155: { units: '156 units', pos: 'Home', barrier: 'None' },
      prior97156: { units: '78 units', pos: 'Home', barrier: 'Father work travel limited some sessions.' },
      prior97157: { units: 'N/A', pos: 'N/A', barrier: 'N/A' },
      prior97158: { units: 'N/A', pos: 'N/A', barrier: 'N/A' },
      sched97153: { sun: '0.0', mon: '4.0', tue: '4.0', wed: '4.0', thu: '4.0', fri: '4.0', sat: '0.0' },
      sched97154: { sun: '0.0', mon: '0.0', tue: '0.0', wed: '0.0', thu: '0.0', fri: '0.0', sat: '0.0' },
      sched97155: { sun: '0.0', mon: '0.5', tue: '0.5', wed: '0.5', thu: '0.5', fri: '0.0', sat: '0.0' },
      sched97156: { sun: '0.0', mon: '1.0', tue: '0.0', wed: '0.0', thu: '0.0', fri: '0.0', sat: '0.0' },
      sched97157: { sun: '0.0', mon: '0.0', tue: '0.0', wed: '0.0', thu: '0.0', fri: '0.0', sat: '0.0' },
      sched97158: { sun: '0.0', mon: '0.0', tue: '0.0', wed: '0.0', thu: '0.0', fri: '0.0', sat: '0.0' }
    },
    providerInfo: {
      name: 'Jane Vance, BCBA',
      phone: '(555) 010-0234',
      email: 'jvance@prysmaba.com',
      address: 'Prysm Behavioral Services, 100 Main St, Suite A, Metuchen, NJ 08840',
      credentials: 'Board Certified Behavior Analyst (BCBA) #1-23-45678',
      signature: 'Jane Vance, BCBA'
    },
    telehealthChecklist: {
      date: '2026-06-16',
      participantName: 'John Doe',
      bcbaName: 'Jane Vance, BCBA',
      dateCompleted: '2026-06-16'
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
    },
    goals: {
      totalGoals: '8',
      goalsMastered: '3',
      goalsInProgress: '4',
      goalsOnHold: '1',
      goalsDiscontinued: '0',
      goalsNew: '4',
      responseToTreatment: 'Ethan is highly motivated by technology and toy cars. Escaping tasks is his primary escape behavior. Using token boards has been highly successful.'
    },
    skillAcquisition: {
      langComm: {
        medicalNecessity: 'Addresses communication deficits.',
        goalStatement: 'Ethan will vocally express his choices from a field of 3 objects in 80% of trials.',
        baseline: 'Client requires physical prompting to select objects (10%).',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'Currently choosing vocally in 35% of prompted trials.',
        barriers: 'Echolalia. Remedy: Use immediate modeling prompts.'
      },
      social: {
        medicalNecessity: 'Addresses peer avoidance.',
        goalStatement: 'Ethan will play cooperatively with a peer for 5 minutes with minimal prompts.',
        baseline: 'Avoids peer contact (0%).',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'Tolerates peers near him for 3 minutes.',
        barriers: 'Aggressive pushes when peers touch objects. Remedy: Constant supervision and response blocking.'
      },
      adaptive: {
        medicalNecessity: 'Self-help skill.',
        goalStatement: 'Ethan will tie his shoes independently.',
        baseline: 'Requires full physical guidance (0%).',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'Can cross and loop laces with verbal prompts.',
        barriers: 'Fine motor delays. Remedy: OT coordination.'
      }
    },
    replacementBehaviors: {
      aggression: {
        medicalNecessity: 'Physical aggression poses safety risks.',
        goalStatement: 'Ethan will hand a "Stop" visual card to peers instead of pushing.',
        baseline: 'Pushes peers average 5 times per session.',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'Reduced to 2 times per session.',
        barriers: 'Fast peer movements. Remedy: Position close to therapist.'
      },
      elopement: {
        medicalNecessity: 'Safety risk.',
        goalStatement: 'Ethan will request a break instead of running away.',
        baseline: 'Runs out of room average 3 times per session.',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'Runs out average 1 time per session.',
        barriers: 'None.'
      },
      propertyDestruction: {
        medicalNecessity: 'Safety risk.',
        goalStatement: 'Ethan will squeeze a sensory toy instead of throwing items.',
        baseline: 'Throws objects average 4 times per session.',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'Throws objects average 1 time per session.',
        barriers: 'None.'
      }
    },
    reductionBehaviors: {
      aggression: {
        goalStatement: 'Ethan will decrease physical aggression to 0 episodes per week.',
        baseline: '12 episodes per week.',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'Reduced to average 2 episodes per week.',
        barriers: 'Reinforced by peers giving up toys.'
      },
      elopement: {
        goalStatement: 'Ethan will decrease elopement to 0 episodes per week.',
        baseline: '10 episodes per week.',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'Reduced to average 1 episode per week.',
        barriers: 'None.'
      },
      propertyDestruction: {
        goalStatement: 'Ethan will decrease property destruction to 0 episodes per week.',
        baseline: '6 episodes per week.',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'Reduced to average 1 episode per week.',
        barriers: 'None.'
      }
    },
    bip: {
      behaviorAssessment: 'FBA indicates aggression and elopement are maintained by social negative reinforcement (escape from desk tasks).',
      targetBehavior: 'Aggression & Elopement',
      operationalDefinition: 'Aggression: Forceful pushing of peers. Elopement: Running out of the classroom.',
      hypothesizedFunction: 'Escape from tasks.',
      replacementBehavior: 'Using visual "break" card and vocally manding "no".',
      antecedentIntervention: 'Task interspersal, high reinforcer density, visual break card.',
      consequenceProcedures: 'Escape extinction, response block, differential reinforcement of alternative behavior (DRA).',
      deescalationProcedures: 'Provide physical space, turn off sensory triggers, speak in flat tone.',
      crisisPlan: 'Notify BCBA, evacuate classroom if aggression escalates, use protective blocking.',
      generalizationPlan: 'Parent coaching to implement the BIP at home.'
    },
    caregiverTraining: {
      goalStatement: 'Sarah Brooks will correctly implement the token board at home for 90% of transitions.',
      baseline: 'Uses token board in 10% of opportunities.',
      dateIntro: '2026-06-16',
      projectedMastery: '2026-12-15',
      progressData: 'Correctly implements token board in 50% of parent training opportunities.',
      barriers: 'None.'
    },
    transitionDischarge: {
      maintenancePlan: 'Thin reinforcement schedule from continuous to variable.',
      generalizationPlan: 'Coordinate with school teacher to utilize same visual tokens.',
      transitionFadingPlan: 'Titrate hours as communication skills increase.',
      dischargeCriteria: 'Client communicates needs vocally and stays within boundaries.',
      crisisPlan: 'Re-evaluate plan if self-injurious behavior returns.',
      titrationTable: [
        { criteria: 'Client maintains aggression at < 1 episode per week.', bcbaReduction: 'Reduce BCBA from 2 to 1.5 hours/week', rbtReduction: 'Reduce RBT from 20 to 15 hours/week' },
        { criteria: 'Client stays in designated boundaries for 2 weeks.', bcbaReduction: 'Reduce BCBA from 1.5 to 1 hour/week', rbtReduction: 'Reduce RBT from 15 to 10 hours/week' },
        { criteria: 'Client plays cooperatively with peers.', bcbaReduction: 'Reduce BCBA to 0.5 hours/week', rbtReduction: 'Reduce RBT from 10 to 5 hours/week' },
        { criteria: 'Client requires no prompts for transitions.', bcbaReduction: '0.5 hours consult', rbtReduction: 'transition to 0 hours' },
        { criteria: 'Parent demonstrates complete independence.', bcbaReduction: 'Discharge', rbtReduction: 'Discharge' }
      ]
    },
    recommendations: {
      medicalNecessity: 'Intensive direct therapy (97153) at 20 hours per week is required to address peer aggression.',
      barriers: 'Occasional illness. Resolution: Make up sessions on weekends.',
      CPT97151: { hours: '3 hours', units: '12 units', pos: 'Clinic' },
      CPT97152: { hours: 'N/A', units: 'N/A', pos: 'N/A' },
      CPT97153: { hours: '20 hours/week', units: '2080 units (6 mo)', pos: 'Home & Clinic' },
      CPT97154: { hours: 'N/A', units: 'N/A', pos: 'N/A' },
      CPT97155: { hours: '2 hours/week', units: '208 units (6 mo)', pos: 'Home & Clinic' },
      CPT97156: { hours: '1 hour/week', units: '104 units (6 mo)', pos: 'Home & Clinic' },
      CPT97157: { hours: 'N/A', units: 'N/A', pos: 'N/A' },
      CPT97158: { hours: 'N/A', units: 'N/A', pos: 'N/A' },
      prior97153: { units: '1400 units', pos: 'Clinic', barrier: 'None' },
      prior97154: { units: 'N/A', pos: 'N/A', barrier: 'N/A' },
      prior97155: { units: '140 units', pos: 'Clinic', barrier: 'None' },
      prior97156: { units: '70 units', pos: 'Clinic', barrier: 'None' },
      prior97157: { units: 'N/A', pos: 'N/A', barrier: 'N/A' },
      prior97158: { units: 'N/A', pos: 'N/A', barrier: 'N/A' },
      sched97153: { sun: '0.0', mon: '4.0', tue: '4.0', wed: '4.0', thu: '4.0', fri: '4.0', sat: '0.0' },
      sched97154: { sun: '0.0', mon: '0.0', tue: '0.0', wed: '0.0', thu: '0.0', fri: '0.0', sat: '0.0' },
      sched97155: { sun: '0.0', mon: '0.5', tue: '0.5', wed: '0.5', thu: '0.5', fri: '0.0', sat: '0.0' },
      sched97156: { sun: '0.0', mon: '1.0', tue: '0.0', wed: '0.0', thu: '0.0', fri: '0.0', sat: '0.0' },
      sched97157: { sun: '0.0', mon: '0.0', tue: '0.0', wed: '0.0', thu: '0.0', fri: '0.0', sat: '0.0' },
      sched97158: { sun: '0.0', mon: '0.0', tue: '0.0', wed: '0.0', thu: '0.0', fri: '0.0', sat: '0.0' }
    },
    providerInfo: {
      name: 'Jane Vance, BCBA',
      phone: '(555) 010-0234',
      email: 'jvance@prysmaba.com',
      address: 'Prysm Behavioral Services, 100 Main St, Suite A, Metuchen, NJ 08840',
      credentials: 'Board Certified Behavior Analyst (BCBA) #1-23-45678',
      signature: 'Jane Vance, BCBA'
    },
    telehealthChecklist: {
      date: '2026-06-16',
      participantName: 'Ethan Brooks',
      bcbaName: 'Jane Vance, BCBA',
      dateCompleted: '2026-06-16'
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
    },
    goals: {
      totalGoals: '5',
      goalsMastered: '1',
      goalsInProgress: '3',
      goalsOnHold: '0',
      goalsDiscontinued: '0',
      goalsNew: '4',
      responseToTreatment: 'Mia responds well to token reinforcement and positive praise. Transition times are reduced when visual timers are used.'
    },
    skillAcquisition: {
      langComm: {
        medicalNecessity: 'Addresses speech delays.',
        goalStatement: 'Mia will use correct pronouns (e.g., "I want" instead of "You want") in 85% of vocal requests.',
        baseline: 'Reverses pronouns in 90% of requests.',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'Correct pronoun use in 40% of requests.',
        barriers: 'Spanish/English syntax differences. Remedy: Coordinate bilingual phrasing.'
      },
      social: {
        medicalNecessity: 'Addresses peer isolation.',
        goalStatement: 'Mia will greet a peer vocally with "Hello" or "Hola" in 80% of opportunities.',
        baseline: 'Does not greet peers (0%).',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'Greets peers in 30% of trials with verbal prompt.',
        barriers: 'None.'
      },
      adaptive: {
        medicalNecessity: 'Self-care skill.',
        goalStatement: 'Mia will independently wash hands with soap.',
        baseline: 'Washes hands without soap (40% independence).',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'Uses soap in 70% of opportunities.',
        barriers: 'None.'
      }
    },
    replacementBehaviors: {
      aggression: {
        medicalNecessity: 'N/A',
        goalStatement: 'N/A',
        baseline: 'N/A',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'N/A',
        barriers: 'N/A'
      },
      elopement: {
        medicalNecessity: 'N/A',
        goalStatement: 'N/A',
        baseline: 'N/A',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'N/A',
        barriers: 'N/A'
      },
      propertyDestruction: {
        medicalNecessity: 'N/A',
        goalStatement: 'N/A',
        baseline: 'N/A',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'N/A',
        barriers: 'N/A'
      }
    },
    reductionBehaviors: {
      aggression: {
        goalStatement: 'N/A',
        baseline: 'N/A',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'N/A',
        barriers: 'N/A'
      },
      elopement: {
        goalStatement: 'N/A',
        baseline: 'N/A',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'N/A',
        barriers: 'N/A'
      },
      propertyDestruction: {
        goalStatement: 'N/A',
        baseline: 'N/A',
        dateIntro: '2026-06-16',
        projectedMastery: '2026-12-15',
        progressData: 'N/A',
        barriers: 'N/A'
      }
    },
    bip: {
      behaviorAssessment: 'Mia does not exhibit severe target behaviors requiring an active BIP at this time. Standard classroom transitions are managed via a general token economy.',
      targetBehavior: 'N/A',
      operationalDefinition: 'N/A',
      hypothesizedFunction: 'N/A',
      replacementBehavior: 'N/A',
      antecedentIntervention: 'Use visual timers and transition notifications.',
      consequenceProcedures: 'Praise for transition compliance.',
      deescalationProcedures: 'N/A',
      crisisPlan: 'Standard school crisis plan.',
      generalizationPlan: 'Bilingual routines generalized at home.'
    },
    caregiverTraining: {
      goalStatement: 'Carlos Hernandez will utilize English/Spanish hybrid communication cards at home during meals.',
      baseline: 'Never uses visual cards at home (0%).',
      dateIntro: '2026-06-16',
      projectedMastery: '2026-12-15',
      progressData: 'Uses cards in 50% of observed meals.',
      barriers: 'None.'
    },
    transitionDischarge: {
      maintenancePlan: 'Gradually fade visual cards to verbal prompts.',
      generalizationPlan: 'Train grandparents to use same vocabulary cards.',
      transitionFadingPlan: 'Titrate hours once Mia transitions to 1st grade.',
      dischargeCriteria: 'Mia communicates needs independently and performs self-help routines.',
      crisisPlan: 'N/A',
      titrationTable: [
        { criteria: 'Mia maintains 2-3 word vocal requests without prompts.', bcbaReduction: 'Reduce BCBA from 1.5 to 1 hour/week', rbtReduction: 'Reduce RBT from 15 to 12 hours/week' },
        { criteria: 'Mia uses soap independently in K settings.', bcbaReduction: 'Reduce BCBA to 0.75 hours/week', rbtReduction: 'Reduce RBT to 10 hours/week' },
        { criteria: 'Mia plays with peers in structured games.', bcbaReduction: 'Reduce BCBA to 0.5 hours/week', rbtReduction: 'Reduce RBT to 5 hours/week' },
        { criteria: 'Mia transitions without whining.', bcbaReduction: '0.5 hours consult', rbtReduction: 'Transition to 0 hours' },
        { criteria: 'Parents report complete satisfaction.', bcbaReduction: 'Discharge', rbtReduction: 'Discharge' }
      ]
    },
    recommendations: {
      medicalNecessity: 'Moderate direct therapy (97153) at 15 hours per week is recommended to establish social greetings and self-care independence.',
      barriers: 'None.',
      CPT97151: { hours: '3 hours', units: '12 units', pos: 'Clinic' },
      CPT97152: { hours: 'N/A', units: 'N/A', pos: 'N/A' },
      CPT97153: { hours: '15 hours/week', units: '1560 units (6 mo)', pos: 'Home & Clinic' },
      CPT97154: { hours: 'N/A', units: 'N/A', pos: 'N/A' },
      CPT97155: { hours: '1.5 hours/week', units: '156 units (6 mo)', pos: 'Home & Clinic' },
      CPT97156: { hours: '1 hour/week', units: '104 units (6 mo)', pos: 'Home & Clinic' },
      CPT97157: { hours: 'N/A', units: 'N/A', pos: 'N/A' },
      CPT97158: { hours: 'N/A', units: 'N/A', pos: 'N/A' },
      prior97153: { units: 'N/A', pos: 'N/A', barrier: 'No prior ABA history' },
      prior97154: { units: 'N/A', pos: 'N/A', barrier: 'N/A' },
      prior97155: { units: 'N/A', pos: 'N/A', barrier: 'N/A' },
      prior97156: { units: 'N/A', pos: 'N/A', barrier: 'N/A' },
      prior97157: { units: 'N/A', pos: 'N/A', barrier: 'N/A' },
      prior97158: { units: 'N/A', pos: 'N/A', barrier: 'N/A' },
      sched97153: { sun: '0.0', mon: '3.0', tue: '3.0', wed: '3.0', thu: '3.0', fri: '3.0', sat: '0.0' },
      sched97154: { sun: '0.0', mon: '0.0', tue: '0.0', wed: '0.0', thu: '0.0', fri: '0.0', sat: '0.0' },
      sched97155: { sun: '0.0', mon: '0.3', tue: '0.3', wed: '0.3', thu: '0.3', fri: '0.3', sat: '0.0' },
      sched97156: { sun: '0.0', mon: '1.0', tue: '0.0', wed: '0.0', thu: '0.0', fri: '0.0', sat: '0.0' },
      sched97157: { sun: '0.0', mon: '0.0', tue: '0.0', wed: '0.0', thu: '0.0', fri: '0.0', sat: '0.0' },
      sched97158: { sun: '0.0', mon: '0.0', tue: '0.0', wed: '0.0', thu: '0.0', fri: '0.0', sat: '0.0' }
    },
    providerInfo: {
      name: 'Jane Vance, BCBA',
      phone: '(555) 010-0234',
      email: 'jvance@prysmaba.com',
      address: 'Prysm Behavioral Services, 100 Main St, Suite A, Metuchen, NJ 08840',
      credentials: 'Board Certified Behavior Analyst (BCBA) #1-23-45678',
      signature: 'Jane Vance, BCBA'
    },
    telehealthChecklist: {
      date: '2026-06-16',
      participantName: 'Mia Hernandez',
      bcbaName: 'Jane Vance, BCBA',
      dateCompleted: '2026-06-16'
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
  
  if (clientId === 'ethan-brooks') {
    fileName = 'Ethan_Brooks_Assessment_Report_2025.pdf';
    detailText = 'Extracted: Client Info, BioPsychosocial, Clinical Observation, BIP, recommendations, schedules';
  } else if (clientId === 'john-doe') {
    fileName = 'John_Doe_Initial_Assessment_Report_2025.pdf';
    detailText = 'Extracted: Client Info, BioPsychosocial, Clinical Observation, BIP, recommendations, schedules';
  } else if (clientId === 'mia-hernandez') {
    fileName = 'Mia_Hernandez_Assessment_Evaluation_2025.docx';
    detailText = 'Extracted: Client Info, BioPsychosocial, Clinical Observation, BIP, recommendations, schedules';
  } else {
    fileName = `${clientName.replace(/\s+/g, '_')}_Assessment.pdf`;
    detailText = 'Extracted: Client Info, BioPsychosocial, Clinical Observation, BIP, recommendations, schedules';
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

function extractAssessmentData(text) {
  const data = {
    clientInfo: {
      dob: "",
      initialAssessmentDate: "",
      reassessmentDate: "",
      parentName: "🟠 FLAG FOR REVIEW",
      parentPhone: "🟠 FLAG FOR REVIEW",
      parentEmail: "🟠 FLAG FOR REVIEW"
    },
    biopsychosocial: {
      familyStructure: "🟠 FLAG FOR REVIEW",
      medications: "🟠 FLAG FOR REVIEW",
      medicalHistory: "🟠 FLAG FOR REVIEW",
      gradeIndex: 0,
      gradeText: "🟠 FLAG FOR REVIEW",
      schoolTypeIndex: 0,
      schoolTypeText: "🟠 FLAG FOR REVIEW",
      schoolHoursStart: "",
      schoolHoursEnd: "",
      academicSchedule: "🟠 FLAG FOR REVIEW",
      schoolHoursPerWeek: "🟠 FLAG FOR REVIEW",
      abaProvider: "🟠 FLAG FOR REVIEW",
      abaStartDate: "",
      abaEndDate: "",
      abaOutcomes: "🟠 FLAG FOR REVIEW",
      mentalHealthServices: "🟠 FLAG FOR REVIEW",
      otherServices: "🟠 FLAG FOR REVIEW",
      coordinationOfCare: "🟠 FLAG FOR REVIEW",
      majorLifeChanges: "🟠 FLAG FOR REVIEW"
    },
    narrative: {
      observationDate: "",
      clinicalNarrative: "🟠 FLAG FOR REVIEW",
      langStrengths: "🟠 FLAG FOR REVIEW",
      langChallenges: "🟠 FLAG FOR REVIEW",
      langSeverity: 0,
      socialStrengths: "🟠 FLAG FOR REVIEW",
      socialChallenges: "🟠 FLAG FOR REVIEW",
      socialSeverity: 0,
      adaptiveStrengths: "🟠 FLAG FOR REVIEW",
      adaptiveChallenges: "🟠 FLAG FOR REVIEW",
      adaptiveSeverity: 0,
      challengingBehaviors: "🟠 FLAG FOR REVIEW",
      challengingSeverity: 0,
      standardizedAssessment: "🟠 FLAG FOR REVIEW"
    },
    goals: {
      totalGoals: "0",
      goalsMastered: "0",
      goalsInProgress: "0",
      goalsOnHold: "0",
      goalsDiscontinued: "0",
      goalsNew: "0",
      responseToTreatment: "🟠 FLAG FOR REVIEW"
    },
    skillAcquisition: {
      langComm: {
        medicalNecessity: "🟠 FLAG FOR REVIEW",
        goalStatement: "🟠 FLAG FOR REVIEW",
        baseline: "🟠 FLAG FOR REVIEW",
        dateIntro: "",
        projectedMastery: "",
        progressData: "🟠 FLAG FOR REVIEW",
        barriers: "🟠 FLAG FOR REVIEW"
      },
      social: {
        medicalNecessity: "🟠 FLAG FOR REVIEW",
        goalStatement: "🟠 FLAG FOR REVIEW",
        baseline: "🟠 FLAG FOR REVIEW",
        dateIntro: "",
        projectedMastery: "",
        progressData: "🟠 FLAG FOR REVIEW",
        barriers: "🟠 FLAG FOR REVIEW"
      },
      adaptive: {
        medicalNecessity: "🟠 FLAG FOR REVIEW",
        goalStatement: "🟠 FLAG FOR REVIEW",
        baseline: "🟠 FLAG FOR REVIEW",
        dateIntro: "",
        projectedMastery: "",
        progressData: "🟠 FLAG FOR REVIEW",
        barriers: "🟠 FLAG FOR REVIEW"
      }
    },
    replacementBehaviors: {
      aggression: {
        medicalNecessity: "🟠 FLAG FOR REVIEW",
        goalStatement: "🟠 FLAG FOR REVIEW",
        baseline: "🟠 FLAG FOR REVIEW",
        dateIntro: "",
        projectedMastery: "",
        progressData: "🟠 FLAG FOR REVIEW",
        barriers: "🟠 FLAG FOR REVIEW"
      }
    },
    reductionBehaviors: {
      aggression: {
        goalStatement: "🟠 FLAG FOR REVIEW",
        baseline: "🟠 FLAG FOR REVIEW",
        dateIntro: "",
        projectedMastery: "",
        progressData: "🟠 FLAG FOR REVIEW",
        barriers: "🟠 FLAG FOR REVIEW"
      }
    },
    bip: {
      behaviorAssessment: "🟠 FLAG FOR REVIEW",
      targetBehavior: "🟠 FLAG FOR REVIEW",
      operationalDefinition: "🟠 FLAG FOR REVIEW",
      hypothesizedFunction: "🟠 FLAG FOR REVIEW",
      replacementBehavior: "🟠 FLAG FOR REVIEW",
      antecedentIntervention: "🟠 FLAG FOR REVIEW",
      consequenceProcedures: "🟠 FLAG FOR REVIEW",
      deescalationProcedures: "🟠 FLAG FOR REVIEW",
      crisisPlan: "🟠 FLAG FOR REVIEW",
      generalizationPlan: "🟠 FLAG FOR REVIEW"
    },
    caregiverTraining: {
      goalStatement: "🟠 FLAG FOR REVIEW",
      baseline: "🟠 FLAG FOR REVIEW",
      dateIntro: "",
      projectedMastery: "",
      progressData: "🟠 FLAG FOR REVIEW",
      barriers: "🟠 FLAG FOR REVIEW"
    },
    transitionDischarge: {
      maintenancePlan: "🟠 FLAG FOR REVIEW",
      generalizationPlan: "🟠 FLAG FOR REVIEW",
      transitionFadingPlan: "🟠 FLAG FOR REVIEW",
      dischargeCriteria: "🟠 FLAG FOR REVIEW",
      crisisPlan: "🟠 FLAG FOR REVIEW"
    },
    recommendations: {
      medicalNecessity: "🟠 FLAG FOR REVIEW",
      barriers: "🟠 FLAG FOR REVIEW"
    }
  };

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  function formatToISODate(dateStr) {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch(e) {}
    return dateStr;
  }

  function extractValue(keywords, regex, fallback = "🟠 FLAG FOR REVIEW") {
    for (let line of lines) {
      const lineLower = line.toLowerCase();
      for (let kw of keywords) {
        if (lineLower.includes(kw.toLowerCase())) {
          const match = line.match(regex);
          if (match) return match[1] || match[0];
          
          const idx = lines.indexOf(line);
          if (idx !== -1 && idx < lines.length - 1) {
            const nextLine = lines[idx + 1];
            const nextMatch = nextLine.match(regex);
            if (nextMatch) return nextMatch[1] || nextMatch[0];
          }
        }
      }
    }
    return fallback;
  }

  function extractParagraph(startKeywords, endKeywords, fallback = "🟠 FLAG FOR REVIEW") {
    let startIndex = -1;
    let endIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const lineLower = lines[i].toLowerCase();
      for (let kw of startKeywords) {
        if (lineLower.includes(kw.toLowerCase()) && startIndex === -1) {
          startIndex = i;
          break;
        }
      }
      if (startIndex !== -1) {
        for (let kw of endKeywords) {
          if (lineLower.includes(kw.toLowerCase()) && i > startIndex) {
            endIndex = i;
            break;
          }
        }
      }
      if (startIndex !== -1 && endIndex !== -1) break;
    }

    if (startIndex !== -1) {
      const end = endIndex !== -1 ? endIndex : Math.min(startIndex + 15, lines.length);
      const contentLines = lines.slice(startIndex + 1, end)
        .filter(l => !startKeywords.some(kw => l.toLowerCase().includes(kw.toLowerCase())));
      
      const filteredLines = [];
      for (let line of contentLines) {
        if (line.length > 40) {
          filteredLines.push(line);
        } else if (line.endsWith(':') || /^[A-Z\s]{4,25}$/.test(line)) {
          break;
        } else {
          filteredLines.push(line);
        }
      }
      
      if (filteredLines.length > 0) {
        return filteredLines.join(' ');
      }
    }
    return fallback;
  }

  // --- 1. Client Info ---
  const dobVal = extractValue(['dob', 'date of birth', 'birthdate', 'born on'], /\b(\d{4}[-\/]\d{2}[-\/]\d{2}|\d{2}[-\/]\d{2}[-\/]\d{4}|[A-Za-z]+\s\d{1,2},\s\d{4})\b/, "");
  if (dobVal) data.clientInfo.dob = formatToISODate(dobVal);

  const reassVal = extractValue(['assessment date', 'date of assessment', 'evaluation date', 'current reassessment', 'review date'], /\b(\d{4}[-\/]\d{2}[-\/]\d{2}|\d{2}[-\/]\d{2}[-\/]\d{4}|[A-Za-z]+\s\d{1,2},\s\d{4})\b/, "");
  if (reassVal) data.clientInfo.reassessmentDate = formatToISODate(reassVal);

  const initVal = extractValue(['initial assessment', 'first evaluation', 'initial evaluation'], /\b(\d{4}[-\/]\d{2}[-\/]\d{2}|\d{2}[-\/]\d{2}[-\/]\d{4}|[A-Za-z]+\s\d{1,2},\s\d{4})\b/, "");
  if (initVal) data.clientInfo.initialAssessmentDate = formatToISODate(initVal);

  data.clientInfo.parentName = extractValue(['parent/guardian', 'parent name', 'mother', 'father', 'caregiver', 'contact name'], /:\s*([A-Za-z\s]{3,30})/, "🟠 FLAG FOR REVIEW");
  data.clientInfo.parentPhone = extractValue(['parent phone', 'phone', 'contact number', 'mobile'], /:\s*([\d\(\)\-\s]{7,15})/, "🟠 FLAG FOR REVIEW");
  data.clientInfo.parentEmail = extractValue(['parent email', 'email', 'e-mail'], /:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/, "🟠 FLAG FOR REVIEW");

  // --- 2. Biopsychosocial ---
  data.biopsychosocial.familyStructure = extractParagraph(['biopsychosocial', 'family history', 'home environment', 'living situation', 'family structure', 'background'], ['medications', 'medical history', 'school setting', 'grade', 'education']);
  data.biopsychosocial.medications = extractValue(['medications', 'prescribed', 'meds'], /:\s*(.+)/, "None currently prescribed.");
  data.biopsychosocial.medicalHistory = extractParagraph(['medical history', 'medical background', 'birth history', 'physical health'], ['grade', 'school setting', 'education', 'academic']);
  
  const gradeStr = extractValue(['grade', 'grade level', 'school grade'], /:\s*(.+)/, "");
  if (gradeStr) {
    data.biopsychosocial.gradeText = gradeStr;
    if (gradeStr.toLowerCase().includes('kindergarten')) data.biopsychosocial.gradeIndex = 1;
    else if (gradeStr.toLowerCase().includes('1st')) data.biopsychosocial.gradeIndex = 2;
    else if (gradeStr.toLowerCase().includes('2nd')) data.biopsychosocial.gradeIndex = 3;
    else if (gradeStr.toLowerCase().includes('3rd')) data.biopsychosocial.gradeIndex = 4;
  }
  
  const schoolTypeStr = extractValue(['school type', 'school setting', 'placement', 'educational environment'], /:\s*(.+)/, "");
  if (schoolTypeStr) {
    data.biopsychosocial.schoolTypeText = schoolTypeStr;
    if (schoolTypeStr.toLowerCase().includes('public')) data.biopsychosocial.schoolTypeIndex = 0;
    else if (schoolTypeStr.toLowerCase().includes('private')) data.biopsychosocial.schoolTypeIndex = 1;
  }

  const startHrs = extractValue(['school hours', 'school time', 'class schedule'], /(\b\d{2}:\d{2}\b)/, "");
  if (startHrs) data.biopsychosocial.schoolHoursStart = startHrs;
  const endHrs = extractValue(['school hours', 'school time', 'class schedule'], /to\s*(\b\d{2}:\d{2}\b)/, "");
  if (endHrs) data.biopsychosocial.schoolHoursEnd = endHrs;

  data.biopsychosocial.academicSchedule = extractParagraph(['academic schedule', 'class schedule', 'daily schedule'], ['prior provider', 'aba provider', 'previous services']);
  data.biopsychosocial.schoolHoursPerWeek = extractValue(['school hours per week', 'hours per week', 'school hours count'], /:\s*([0-9.]+\s*hours)/i, "🟠 FLAG FOR REVIEW");
  data.biopsychosocial.abaProvider = extractValue(['aba provider', 'prior provider', 'previous provider'], /:\s*(.+)/, "🟠 FLAG FOR REVIEW");
  
  const abaStart = extractValue(['prior provider start', 'aba start'], /\b(\d{4}[-\/]\d{2}[-\/]\d{2})\b/, "");
  if (abaStart) data.biopsychosocial.abaStartDate = formatToISODate(abaStart);
  const abaEnd = extractValue(['prior provider end', 'aba end'], /\b(\d{4}[-\/]\d{2}[-\/]\d{2})\b/, "");
  if (abaEnd) data.biopsychosocial.abaEndDate = formatToISODate(abaEnd);

  data.biopsychosocial.abaOutcomes = extractParagraph(['prior outcomes', 'previous outcomes', 'prior results'], ['mental health', 'other services']);
  data.biopsychosocial.mentalHealthServices = extractParagraph(['mental health services', 'psychological services', 'counseling'], ['other services', 'coordination of care']);
  data.biopsychosocial.otherServices = extractParagraph(['other services', 'speech therapy', 'occupational therapy', 'physical therapy', 'ot/st/pt'], ['coordination of care', 'major life changes']);
  data.biopsychosocial.coordinationOfCare = extractParagraph(['coordination of care', 'interdisciplinary collaboration'], ['major life changes', 'family history']);
  data.biopsychosocial.majorLifeChanges = extractParagraph(['major life changes', 'significant events', 'transitions'], ['narrative', 'direct observation']);

  // --- 3. Narrative ---
  const obsDate = extractValue(['observation date', 'date of observation', 'evaluation date'], /\b(\d{4}[-\/]\d{2}[-\/]\d{2}|\d{2}[-\/]\d{2}[-\/]\d{4})\b/, "");
  if (obsDate) data.narrative.observationDate = formatToISODate(obsDate);

  data.narrative.clinicalNarrative = extractParagraph(['clinical narrative', 'direct observation', 'observer notes', 'session behavior', 'observations summary'], ['language strengths', 'communication strengths']);
  data.narrative.langStrengths = extractParagraph(['language strengths', 'communication strengths'], ['language challenges', 'communication challenges']);
  data.narrative.langChallenges = extractParagraph(['language challenges', 'communication challenges'], ['language severity', 'social strengths']);
  data.narrative.socialStrengths = extractParagraph(['social strengths', 'interpersonal strengths'], ['social challenges', 'peer interaction']);
  data.narrative.socialChallenges = extractParagraph(['social challenges', 'peer challenges'], ['social severity', 'adaptive strengths']);
  data.narrative.adaptiveStrengths = extractParagraph(['adaptive strengths', 'self-care strengths'], ['adaptive challenges', 'daily living challenges']);
  data.narrative.adaptiveChallenges = extractParagraph(['adaptive challenges', 'self-care challenges'], ['adaptive severity', 'challenging behaviors']);
  data.narrative.challengingBehaviors = extractParagraph(['challenging behaviors summary', 'problem behaviors', 'target behaviors description'], ['challenging severity', 'standardized assessment']);
  data.narrative.standardizedAssessment = extractParagraph(['standardized assessment', 'vb-mapp', 'peak', 'ablls-r'], ['goals', 'objectives']);

  const langSev = extractValue(['lang severity', 'language severity'], /:\s*(.+)/, "");
  if (langSev.toLowerCase().includes('mild')) data.narrative.langSeverity = 0;
  else if (langSev.toLowerCase().includes('moderate') || langSev.toLowerCase().includes('mod')) data.narrative.langSeverity = 1;
  else if (langSev.toLowerCase().includes('severe') || langSev.toLowerCase().includes('sev')) data.narrative.langSeverity = 2;

  const socialSev = extractValue(['social severity'], /:\s*(.+)/, "");
  if (socialSev.toLowerCase().includes('mild')) data.narrative.socialSeverity = 0;
  else if (socialSev.toLowerCase().includes('moderate') || socialSev.toLowerCase().includes('mod')) data.narrative.socialSeverity = 1;
  else if (socialSev.toLowerCase().includes('severe') || socialSev.toLowerCase().includes('sev')) data.narrative.socialSeverity = 2;

  const adaptSev = extractValue(['adaptive severity'], /:\s*(.+)/, "");
  if (adaptSev.toLowerCase().includes('mild')) data.narrative.adaptiveSeverity = 0;
  else if (adaptSev.toLowerCase().includes('moderate') || adaptSev.toLowerCase().includes('mod')) data.narrative.adaptiveSeverity = 1;
  else if (adaptSev.toLowerCase().includes('severe') || adaptSev.toLowerCase().includes('sev')) data.narrative.adaptiveSeverity = 2;

  const chalSev = extractValue(['challenging severity', 'behavior severity'], /:\s*(.+)/, "");
  if (chalSev.toLowerCase().includes('mild')) data.narrative.challengingSeverity = 0;
  else if (chalSev.toLowerCase().includes('moderate') || chalSev.toLowerCase().includes('mod')) data.narrative.challengingSeverity = 1;
  else if (chalSev.toLowerCase().includes('severe') || chalSev.toLowerCase().includes('sev')) data.narrative.challengingSeverity = 2;

  // --- 4. Goals & Response ---
  data.goals.totalGoals = extractValue(['total goals', 'goals count'], /:\s*(\d+)/, "0");
  data.goals.goalsMastered = extractValue(['goals mastered', 'mastered goals'], /:\s*(\d+)/, "0");
  data.goals.goalsInProgress = extractValue(['goals in progress', 'in-progress goals'], /:\s*(\d+)/, "0");
  data.goals.goalsOnHold = extractValue(['goals on hold', 'on-hold goals'], /:\s*(\d+)/, "0");
  data.goals.goalsDiscontinued = extractValue(['goals discontinued'], /:\s*(\d+)/, "0");
  data.goals.goalsNew = extractValue(['goals new', 'new goals count'], /:\s*(\d+)/, "0");
  data.goals.responseToTreatment = extractParagraph(['response to treatment', 'progress summary', 'treatment response'], ['skill acquisition', 'language goal']);

  // --- 5. Skill Acquisition ---
  data.skillAcquisition.langComm.goalStatement = extractParagraph(['language goal', 'lang goal', 'communication goal'], ['language baseline', 'lang baseline', 'language necessity']);
  data.skillAcquisition.langComm.baseline = extractValue(['language baseline', 'lang baseline', 'communication baseline'], /:\s*(.+)/, "🟠 FLAG FOR REVIEW");
  data.skillAcquisition.langComm.medicalNecessity = extractParagraph(['language necessity', 'lang necessity', 'communication necessity'], ['social goal', 'social skill goal']);
  data.skillAcquisition.langComm.progressData = extractParagraph(['language progress', 'lang progress'], ['language barriers', 'lang barriers']);
  data.skillAcquisition.langComm.barriers = extractParagraph(['language barriers', 'lang barriers'], ['social goal', 'social necessity']);

  const langIntro = extractValue(['language intro', 'lang intro'], /\b(\d{4}[-\/]\d{2}[-\/]\d{2})\b/, "");
  if (langIntro) data.skillAcquisition.langComm.dateIntro = formatToISODate(langIntro);
  const langMaster = extractValue(['language mastery', 'lang mastery'], /\b(\d{4}[-\/]\d{2}[-\/]\d{2})\b/, "");
  if (langMaster) data.skillAcquisition.langComm.projectedMastery = formatToISODate(langMaster);

  data.skillAcquisition.social.goalStatement = extractParagraph(['social goal', 'social skill goal'], ['social baseline', 'social necessity']);
  data.skillAcquisition.social.baseline = extractValue(['social baseline'], /:\s*(.+)/, "🟠 FLAG FOR REVIEW");
  data.skillAcquisition.social.medicalNecessity = extractParagraph(['social necessity', 'social skill necessity'], ['adaptive goal', 'adaptive necessity']);
  data.skillAcquisition.social.progressData = extractParagraph(['social progress'], ['social barriers']);
  data.skillAcquisition.social.barriers = extractParagraph(['social barriers'], ['adaptive goal', 'adaptive necessity']);

  const socIntro = extractValue(['social intro'], /\b(\d{4}[-\/]\d{2}[-\/]\d{2})\b/, "");
  if (socIntro) data.skillAcquisition.social.dateIntro = formatToISODate(socIntro);
  const socMaster = extractValue(['social mastery'], /\b(\d{4}[-\/]\d{2}[-\/]\d{2})\b/, "");
  if (socMaster) data.skillAcquisition.social.projectedMastery = formatToISODate(socMaster);

  data.skillAcquisition.adaptive.goalStatement = extractParagraph(['adaptive goal', 'self-care goal'], ['adaptive baseline', 'adaptive necessity']);
  data.skillAcquisition.adaptive.baseline = extractValue(['adaptive baseline'], /:\s*(.+)/, "🟠 FLAG FOR REVIEW");
  data.skillAcquisition.adaptive.medicalNecessity = extractParagraph(['adaptive necessity', 'self-care necessity'], ['replacement behaviors', 'aggression replacement']);
  data.skillAcquisition.adaptive.progressData = extractParagraph(['adaptive progress'], ['adaptive barriers']);
  data.skillAcquisition.adaptive.barriers = extractParagraph(['adaptive barriers'], ['replacement behaviors', 'aggression replacement']);

  const adaptIntro = extractValue(['adaptive intro'], /\b(\d{4}[-\/]\d{2}[-\/]\d{2})\b/, "");
  if (adaptIntro) data.skillAcquisition.adaptive.dateIntro = formatToISODate(adaptIntro);
  const adaptMaster = extractValue(['adaptive mastery'], /\b(\d{4}[-\/]\d{2}[-\/]\d{2})\b/, "");
  if (adaptMaster) data.skillAcquisition.adaptive.projectedMastery = formatToISODate(adaptMaster);

  // --- 6. Replacement Behaviors ---
  data.replacementBehaviors.aggression.goalStatement = extractParagraph(['aggression replacement goal', 'replacement goal statement'], ['aggression replacement baseline', 'aggression replacement necessity']);
  data.replacementBehaviors.aggression.baseline = extractValue(['aggression replacement baseline'], /:\s*(.+)/, "🟠 FLAG FOR REVIEW");
  data.replacementBehaviors.aggression.medicalNecessity = extractParagraph(['aggression replacement necessity', 'aggression replacement medical necessity'], ['reduction behaviors', 'aggression reduction']);
  data.replacementBehaviors.aggression.progressData = extractParagraph(['aggression replacement progress'], ['aggression replacement barriers']);
  data.replacementBehaviors.aggression.barriers = extractParagraph(['aggression replacement barriers'], ['reduction behaviors', 'aggression reduction']);

  const repIntro = extractValue(['aggression replacement intro'], /\b(\d{4}[-\/]\d{2}[-\/]\d{2})\b/, "");
  if (repIntro) data.replacementBehaviors.aggression.dateIntro = formatToISODate(repIntro);
  const repMaster = extractValue(['aggression replacement mastery'], /\b(\d{4}[-\/]\d{2}[-\/]\d{2})\b/, "");
  if (repMaster) data.replacementBehaviors.aggression.projectedMastery = formatToISODate(repMaster);

  // --- 7. Reduction Behaviors ---
  data.reductionBehaviors.aggression.goalStatement = extractParagraph(['aggression reduction goal', 'reduction goal statement'], ['aggression reduction baseline']);
  data.reductionBehaviors.aggression.baseline = extractValue(['aggression reduction baseline'], /:\s*(.+)/, "🟠 FLAG FOR REVIEW");
  data.reductionBehaviors.aggression.progressData = extractParagraph(['aggression reduction progress'], ['aggression reduction barriers']);
  data.reductionBehaviors.aggression.barriers = extractParagraph(['aggression reduction barriers'], ['bip', 'behavior intervention plan']);

  const redIntro = extractValue(['aggression reduction intro'], /\b(\d{4}[-\/]\d{2}[-\/]\d{2})\b/, "");
  if (redIntro) data.reductionBehaviors.aggression.dateIntro = formatToISODate(redIntro);
  const redMaster = extractValue(['aggression reduction mastery'], /\b(\d{4}[-\/]\d{2}[-\/]\d{2})\b/, "");
  if (redMaster) data.reductionBehaviors.aggression.projectedMastery = formatToISODate(redMaster);

  // --- 8. BIP ---
  data.bip.behaviorAssessment = extractParagraph(['behavior assessment summary', 'bba summary', 'fast assessment', 'mas assessment'], ['target behaviors', 'behavior definition']);
  data.bip.targetBehavior = extractValue(['target behavior names', 'bip target behaviors'], /:\s*(.+)/, "🟠 FLAG FOR REVIEW");
  data.bip.operationalDefinition = extractParagraph(['operational definition', 'behavior definition'], ['hypothesized function', 'behavior function']);
  data.bip.hypothesizedFunction = extractValue(['hypothesized function', 'behavior function'], /:\s*(.+)/, "🟠 FLAG FOR REVIEW");
  data.bip.replacementBehavior = extractParagraph(['replacement behaviors', 'bip replacement behaviors'], ['antecedent intervention', 'proactive strategies']);
  data.bip.antecedentIntervention = extractParagraph(['antecedent intervention', 'proactive strategies', 'antecedent strategies'], ['consequence procedures', 'reactive strategies']);
  data.bip.consequenceProcedures = extractParagraph(['consequence procedures', 'reactive strategies', 'consequence strategies'], ['deescalation procedures', 'crisis plan']);
  data.bip.deescalationProcedures = extractParagraph(['deescalation procedures', 'crisis deescalation'], ['crisis plan', 'emergency procedures']);
  data.bip.crisisPlan = extractParagraph(['crisis plan', 'emergency plan', 'safety plan'], ['generalization plan', 'caregiver training']);
  data.bip.generalizationPlan = extractParagraph(['generalization plan', 'generalization strategies'], ['caregiver training', 'transition plan']);

  // --- 9. Caregiver Training ---
  data.caregiverTraining.goalStatement = extractParagraph(['caregiver training goal', 'parent coaching goal'], ['caregiver training baseline', 'parent training baseline']);
  data.caregiverTraining.baseline = extractValue(['caregiver training baseline', 'parent coaching baseline'], /:\s*(.+)/, "🟠 FLAG FOR REVIEW");
  data.caregiverTraining.progressData = extractParagraph(['caregiver progress data', 'parent coaching progress'], ['caregiver training barriers', 'parent coaching barriers']);
  data.caregiverTraining.barriers = extractParagraph(['caregiver training barriers', 'parent coaching barriers'], ['transition plan', 'discharge plan']);

  const cgIntro = extractValue(['caregiver intro', 'parent coaching intro'], /\b(\d{4}[-\/]\d{2}[-\/]\d{2})\b/, "");
  if (cgIntro) data.caregiverTraining.dateIntro = formatToISODate(cgIntro);
  const cgMaster = extractValue(['caregiver mastery', 'parent coaching mastery'], /\b(\d{4}[-\/]\d{2}[-\/]\d{2})\b/, "");
  if (cgMaster) data.caregiverTraining.projectedMastery = formatToISODate(cgMaster);

  // --- 10. Transition & Discharge ---
  data.transitionDischarge.maintenancePlan = extractParagraph(['maintenance plan', 'transition maintenance'], ['generalization plan', 'titration plan']);
  data.transitionDischarge.generalizationPlan = extractParagraph(['transition generalization plan', 'discharge generalization'], ['transition fading plan', 'titration plan']);
  data.transitionDischarge.transitionFadingPlan = extractParagraph(['transition fading plan', 'titration plan', 'fading plan'], ['discharge criteria']);
  data.transitionDischarge.dischargeCriteria = extractParagraph(['discharge criteria'], ['transition crisis plan']);
  data.transitionDischarge.crisisPlan = extractParagraph(['transition crisis plan'], ['recommendations']);

  // --- 11. Recommendations ---
  data.recommendations.medicalNecessity = extractParagraph(['recommendations rationale', 'recommendations medical necessity'], ['recommendations barriers', 'treatment barriers']);
  data.recommendations.barriers = extractParagraph(['recommendations barriers', 'treatment barriers'], ['end of report']);

  return data;
}

}`;

  const payload = {
    contents: [{
      parts: [
        { text: systemInstructions },
        { text: `### TEXT TO EXTRACT:\n\n${text}` }
      ]
    }],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
async function handleFileUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  
  const uploadZone = document.getElementById('migration-upload-zone');
  const originalHtml = uploadZone.innerHTML;
  
  const file = files[0];
  
  uploadZone.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <i data-lucide="loader-2" class="lucide-loader-2" style="width: 48px; height: 48px; color: var(--color-blue); margin-bottom: 1rem; animation: spin 2s linear infinite;"></i>
      <h3 style="color: var(--color-blue-dark);">Parsing ${file.name}...</h3>
      <p style="color: var(--color-text-light);">Extracting content and mapping to template...</p>
    </div>
  `;
  lucide.createIcons();
  
  if (!document.getElementById('spin-anim')) {
    const style = document.createElement('style');
    style.id = 'spin-anim';
    style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }

  try {
    let extractedText = '';
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (file.type === 'application/pdf' || fileExtension === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        extractedText += textContent.items.map(s => s.str).join(' ') + '\n';
      }
    } else if (fileExtension === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
      extractedText = result.value;
    } else {
      extractedText = await file.text();
    }
    
    window.pendingMigrationData = extractAssessmentData(extractedText);
    
    uploadZone.innerHTML = originalHtml;
    lucide.createIcons();
    
    const draftList = document.getElementById('draft-migrations-list');
    const newDraft = document.createElement('div');
    newDraft.className = 'file-row';
    newDraft.style.borderLeft = '4px solid var(--color-turquoise)';
    newDraft.innerHTML = `
      <div>
        <strong>${file.name}</strong>
        <span style="color: var(--color-blue-dark); font-weight: 500;">Offline extraction complete</span>
      </div>
      <button class="glass-btn btn-sm" onclick="openReviewModal('${selectedClientId || 'ethan-brooks'}')">Review & Commit</button>
    `;
    draftList.prepend(newDraft);
    
    // Auto-open review modal right away
    openReviewModal(selectedClientId || 'ethan-brooks');
    
  } catch (error) {
    console.error('Extraction error:', error);
    alert('Error extracting text from document. Please ensure it is a valid PDF, DOCX, or text file.');
    uploadZone.innerHTML = originalHtml;
    lucide.createIcons();
  }
  
  event.target.value = '';
}

const FIELD_METADATA = {
  clientInfo: {
    dob: { label: 'Date of Birth', type: 'text', placeholder: 'YYYY-MM-DD' },
    initialAssessmentDate: { label: 'Initial Assessment Date', type: 'text', placeholder: 'YYYY-MM-DD' },
    reassessmentDate: { label: 'Reassessment Date', type: 'text', placeholder: 'YYYY-MM-DD' },
    parentName: { label: 'Parent/Guardian Name', type: 'text' },
    parentPhone: { label: 'Parent Phone Number', type: 'text' },
    parentEmail: { label: 'Parent Email Address', type: 'text' }
  },
  biopsychosocial: {
    familyStructure: { label: 'Family Structure & Living Situation', type: 'textarea' },
    medications: { label: 'Medications', type: 'textarea' },
    medicalHistory: { label: 'Medical History', type: 'textarea' },
    gradeIndex: { label: 'Grade Level Index (0-12, etc.)', type: 'number' },
    gradeText: { label: 'Grade Level Name', type: 'text', placeholder: 'e.g. 1st, Kindergarten' },
    schoolTypeIndex: { label: 'School Setting Index', type: 'number' },
    schoolTypeText: { label: 'School Setting Name', type: 'text', placeholder: 'e.g. Public school, Private school' },
    schoolHoursStart: { label: 'School Start Time', type: 'text', placeholder: 'HH:MM' },
    schoolHoursEnd: { label: 'School End Time', type: 'text', placeholder: 'HH:MM' },
    academicSchedule: { label: 'Academic Schedule Details', type: 'textarea' },
    schoolHoursPerWeek: { label: 'School Hours Per Week', type: 'text' },
    abaProvider: { label: 'Prior ABA Provider', type: 'text' },
    abaStartDate: { label: 'Prior ABA Start Date', type: 'text', placeholder: 'YYYY-MM-DD' },
    abaEndDate: { label: 'Prior ABA End Date', type: 'text', placeholder: 'YYYY-MM-DD' },
    abaOutcomes: { label: 'Prior ABA Outcomes', type: 'textarea' },
    mentalHealthServices: { label: 'Other Mental Health Services', type: 'textarea' },
    otherServices: { label: 'OT / ST / PT Services', type: 'textarea' },
    coordinationOfCare: { label: 'Care Coordination Details', type: 'textarea' },
    majorLifeChanges: { label: 'Major Life Changes', type: 'textarea' }
  },
  narrative: {
    observationDate: { label: 'Observation Date', type: 'text', placeholder: 'YYYY-MM-DD' },
    clinicalNarrative: { label: 'Direct Observation Narrative', type: 'textarea' },
    langStrengths: { label: 'Language Strengths', type: 'textarea' },
    langChallenges: { label: 'Language Challenges', type: 'textarea' },
    langSeverity: { label: 'Language Severity Index (0=Mild, 1=Mod, 2=Sev)', type: 'number' },
    socialStrengths: { label: 'Social Strengths', type: 'textarea' },
    socialChallenges: { label: 'Social Challenges', type: 'textarea' },
    socialSeverity: { label: 'Social Severity Index (0=Mild, 1=Mod, 2=Sev)', type: 'number' },
    adaptiveStrengths: { label: 'Adaptive/Self-Care Strengths', type: 'textarea' },
    adaptiveChallenges: { label: 'Adaptive/Self-Care Challenges', type: 'textarea' },
    adaptiveSeverity: { label: 'Adaptive Severity Index (0=Mild, 1=Mod, 2=Sev)', type: 'number' },
    challengingBehaviors: { label: 'Challenging Behaviors Summary', type: 'textarea' },
    challengingSeverity: { label: 'Challenging Behavior Severity Index (0=Mild, 1=Mod, 2=Sev)', type: 'number' },
    standardizedAssessment: { label: 'Standardized Assessment Results (VB-MAPP, PEAK, etc.)', type: 'textarea' }
  },
  goals: {
    totalGoals: { label: 'Total Goals Count', type: 'text' },
    goalsMastered: { label: 'Mastered Goals Count', type: 'text' },
    goalsInProgress: { label: 'In Progress Goals Count', type: 'text' },
    goalsOnHold: { label: 'On Hold Goals Count', type: 'text' },
    goalsDiscontinued: { label: 'Discontinued Goals Count', type: 'text' },
    goalsNew: { label: 'New Goals Count', type: 'text' },
    responseToTreatment: { label: 'Response to Treatment Narrative', type: 'textarea' }
  },
  bip: {
    behaviorAssessment: { label: 'Behavior Assessment (FBA, FAST, MAS)', type: 'textarea' },
    targetBehavior: { label: 'Target Behaviors', type: 'textarea' },
    operationalDefinition: { label: 'Operational Definition', type: 'textarea' },
    hypothesizedFunction: { label: 'Hypothesized Function', type: 'textarea' },
    replacementBehavior: { label: 'Replacement Behaviors', type: 'textarea' },
    antecedentIntervention: { label: 'Antecedent Interventions (Proactive)', type: 'textarea' },
    consequenceProcedures: { label: 'Consequence Procedures (Reactive)', type: 'textarea' },
    deescalationProcedures: { label: 'De-escalation Procedures', type: 'textarea' },
    crisisPlan: { label: 'Crisis Plan Steps', type: 'textarea' },
    generalizationPlan: { label: 'Generalization & Maintenance Plan', type: 'textarea' }
  },
  caregiverTraining: {
    goalStatement: { label: 'Caregiver Training Goal', type: 'textarea' },
    baseline: { label: 'Caregiver Training Baseline', type: 'textarea' },
    dateIntro: { label: 'Date Introduced', type: 'text', placeholder: 'YYYY-MM-DD' },
    projectedMastery: { label: 'Projected Mastery Date', type: 'text', placeholder: 'YYYY-MM-DD' },
    progressData: { label: 'Caregiver Progress Data', type: 'textarea' },
    barriers: { label: 'Caregiver Training Barriers', type: 'textarea' }
  },
  transitionDischarge: {
    maintenancePlan: { label: 'Maintenance Plan', type: 'textarea' },
    generalizationPlan: { label: 'Generalization Plan', type: 'textarea' },
    transitionFadingPlan: { label: 'Transition & Fading Plan', type: 'textarea' },
    dischargeCriteria: { label: 'Discharge Criteria', type: 'textarea' },
    crisisPlan: { label: 'Transition Crisis Plan', type: 'textarea' }
  },
  recommendations: {
    medicalNecessity: { label: 'Recommendations & Medical Necessity Rationale', type: 'textarea' },
    barriers: { label: 'Potential Barriers to Treatment', type: 'textarea' }
  }
};

let currentEditorTab = 'clientInfo';
let migrationViewMode = 'form';

function countFlagsInSection(sectionId, data) {
  let count = 0;
  function scan(val) {
    if (typeof val === 'string' && val === '🟠 FLAG FOR REVIEW') {
      count++;
    } else if (typeof val === 'object' && val !== null) {
      for (let k in val) {
        scan(val[k]);
      }
    }
  }
  if (data && data[sectionId]) {
    scan(data[sectionId]);
  }
  return count;
}

function countTotalFlags(data) {
  let count = 0;
  function scan(val) {
    if (typeof val === 'string' && val === '🟠 FLAG FOR REVIEW') {
      count++;
    } else if (typeof val === 'object' && val !== null) {
      for (let k in val) {
        scan(val[k]);
      }
    }
  }
  scan(data);
  return count;
}

function openReviewModal(clientId) {
  const modal = document.getElementById('migration-modal-overlay');
  const content = document.getElementById('migration-modal-content');
  if (!modal || !content) return;

  // Initialize or fetch pending migration data
  if (!window.pendingMigrationData) {
    window.pendingMigrationData = JSON.parse(JSON.stringify(MIGRATION_ASSESSMENTS[clientId] || MIGRATION_ASSESSMENTS['john-doe']));
  }
  
  // Set default view state
  currentEditorTab = 'clientInfo';
  migrationViewMode = 'form';
  
  // Update toggle state
  const formBtn = document.getElementById('toggle-editor-form');
  const jsonBtn = document.getElementById('toggle-editor-json');
  if (formBtn && jsonBtn) {
    formBtn.classList.add('active');
    jsonBtn.classList.remove('active');
  }

  // Render content
  renderMigrationEditor();
  
  modal.style.display = 'flex';
}

function closeReviewModal() {
  document.getElementById('migration-modal-overlay').style.display = 'none';
}

function setMigrationViewMode(mode) {
  if (mode === migrationViewMode) return;
  
  const formBtn = document.getElementById('toggle-editor-form');
  const jsonBtn = document.getElementById('toggle-editor-json');
  
  if (mode === 'json') {
    formBtn.classList.remove('active');
    jsonBtn.classList.add('active');
    migrationViewMode = 'json';
    renderMigrationEditor();
  } else {
    // Switching to form: parse first
    const textarea = document.getElementById('migration-json-textarea');
    if (textarea) {
      try {
        const parsed = JSON.parse(textarea.value);
        window.pendingMigrationData = parsed;
        
        formBtn.classList.add('active');
        jsonBtn.classList.remove('active');
        migrationViewMode = 'form';
        renderMigrationEditor();
      } catch (err) {
        alert('Invalid JSON syntax. Please correct it before switching to Form Editor.\n\nError: ' + err.message);
      }
    } else {
      migrationViewMode = 'form';
      renderMigrationEditor();
    }
  }
}

function validateJsonInput(val) {
  const statusEl = document.getElementById('json-parse-status');
  if (!statusEl) return;
  
  try {
    const parsed = JSON.parse(val);
    window.pendingMigrationData = parsed;
    statusEl.innerHTML = `<i data-lucide="check-circle" style="width:14px;height:14px;vertical-align:text-bottom;"></i> Valid JSON`;
    statusEl.style.color = '#2e7d32';
    updateFooterFlagCount();
  } catch (err) {
    statusEl.innerHTML = `<i data-lucide="x-circle" style="width:14px;height:14px;vertical-align:text-bottom;"></i> Invalid JSON syntax`;
    statusEl.style.color = '#c62828';
  }
  lucide.createIcons();
}

function renderMigrationEditor() {
  const contentContainer = document.getElementById('migration-modal-content');
  if (!contentContainer) return;
  
  if (migrationViewMode === 'json') {
    contentContainer.innerHTML = `
      <div style="padding: 1.5rem; flex: 1; display: flex; flex-direction: column;">
        <div class="migration-warning-banner" style="margin-bottom: 1rem;">
          <span><strong>JSON Editor View</strong>: Edit the raw structure directly. Be sure to keep keys matching the schema.</span>
          <span id="json-parse-status" style="font-weight: bold; color: #2e7d32;"><i data-lucide="check-circle" style="width:14px;height:14px;vertical-align:text-bottom;"></i> Valid JSON</span>
        </div>
        <textarea id="migration-json-textarea" style="flex: 1; font-family: Courier, monospace; font-size: 0.85rem; padding: 1rem; border-radius: 8px; border: 1px solid rgba(0,0,0,0.15); outline: none; background: #263238; color: #eceff1; resize: none; min-height: 400px;" oninput="validateJsonInput(this.value)">${JSON.stringify(window.pendingMigrationData, null, 2)}</textarea>
      </div>
    `;
    lucide.createIcons();
    updateFooterFlagCount();
  } else {
    contentContainer.innerHTML = `
      <div class="migration-editor-container" style="flex: 1; border: none; border-radius: 0;">
        <div class="migration-editor-sidebar" id="migration-sidebar">
          <!-- Sidebar tabs loaded dynamically -->
        </div>
        <div class="migration-editor-content" id="migration-fields-container">
          <!-- Form fields loaded dynamically -->
        </div>
      </div>
    `;
    
    renderSidebar();
    renderActiveTabFields();
    updateFooterFlagCount();
  }
}

function renderSidebar() {
  const sidebar = document.getElementById('migration-sidebar');
  if (!sidebar) return;
  
  const sections = [
    { id: 'clientInfo', name: 'Client Info' },
    { id: 'biopsychosocial', name: 'Biopsychosocial' },
    { id: 'narrative', name: 'Observation & Narrative' },
    { id: 'goals', name: 'Goals Summary' },
    { id: 'skillAcquisition', name: 'Skill Acquisition' },
    { id: 'replacementBehaviors', name: 'Replacement Behaviors' },
    { id: 'reductionBehaviors', name: 'Reduction Behaviors' },
    { id: 'bip', name: 'BIP' },
    { id: 'caregiverTraining', name: 'Caregiver Training' },
    { id: 'transitionDischarge', name: 'Transition & Discharge' },
    { id: 'recommendations', name: 'Recommendations' }
  ];
  
  sidebar.innerHTML = sections.map(sec => {
    const flagCount = countFlagsInSection(sec.id, window.pendingMigrationData);
    const badgeHtml = flagCount > 0 ? `<span class="migration-tab-badge" id="sidebar-badge-${sec.id}">${flagCount}</span>` : `<span class="migration-tab-badge" id="sidebar-badge-${sec.id}" style="display:none;"></span>`;
    const flaggedClass = flagCount > 0 ? 'flagged' : '';
    const activeClass = sec.id === currentEditorTab ? 'active' : '';
    
    return `
      <button class="migration-editor-tab ${activeClass} ${flaggedClass}" id="sidebar-tab-${sec.id}" onclick="switchEditorTab('${sec.id}')">
        <span>${sec.name}</span>
        ${badgeHtml}
      </button>
    `;
  }).join('');
}

function renderActiveTabFields() {
  const container = document.getElementById('migration-fields-container');
  if (!container) return;
  
  const flagCount = countFlagsInSection(currentEditorTab, window.pendingMigrationData);
  let warningBanner = '';
  if (flagCount > 0) {
    warningBanner = `
      <div class="migration-warning-banner" id="tab-warning-banner">
        <span><i data-lucide="alert-triangle" style="vertical-align: text-bottom; margin-right: 4px;"></i> This section contains <strong>${flagCount}</strong> flagged values that require review.</span>
        <button class="glass-btn btn-sm" style="background: rgba(255, 255, 255, 0.5); border: none; color: #e65100;" onclick="clearFlagsInSection('${currentEditorTab}')">Clear flags in this section</button>
      </div>
    `;
  }
  
  container.innerHTML = `
    <div style="max-width: 720px;">
      <h3 style="color: var(--color-blue-dark); margin-bottom: 0.5rem; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 0.5px;">
        ${currentEditorTab.replace(/([A-Z])/g, ' $1').trim()} Fields
      </h3>
      <p style="color: var(--color-text-light); font-size: 0.85rem; margin-bottom: 1.5rem;">Review the extracted data below. Values marked in yellow/dashed orange require input or verification.</p>
      ${warningBanner}
      ${renderFormFields(currentEditorTab)}
    </div>
  `;
  
  lucide.createIcons();
}

function switchEditorTab(sectionId) {
  document.querySelectorAll('.migration-editor-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  const activeTab = document.getElementById(`sidebar-tab-${sectionId}`);
  if (activeTab) activeTab.classList.add('active');
  
  currentEditorTab = sectionId;
  renderActiveTabFields();
}

function renderFormFields(sectionId) {
  const sectionData = window.pendingMigrationData[sectionId];
  if (!sectionData) return '';

  let html = '';

  function renderField(label, path, value, type, placeholder = '') {
    const isFlagged = value === '🟠 FLAG FOR REVIEW';
    const flaggedClass = isFlagged ? 'flagged' : '';
    const warningBadge = isFlagged ? `<span class="migration-tab-badge"><i data-lucide="alert-triangle" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:2px;"></i> Needs Review</span>` : '';
    
    let inputHtml = '';
    if (type === 'textarea') {
      inputHtml = `<textarea class="migration-input ${flaggedClass}" rows="4" placeholder="${placeholder}" oninput="updateMigrationField('${path}', this.value)">${escapeHtml(value)}</textarea>`;
    } else if (type === 'number') {
      inputHtml = `<input type="number" class="migration-input ${flaggedClass}" value="${value}" oninput="updateMigrationField('${path}', parseFloat(this.value) || 0)">`;
    } else {
      inputHtml = `<input type="text" class="migration-input ${flaggedClass}" value="${escapeHtml(value)}" placeholder="${placeholder}" oninput="updateMigrationField('${path}', this.value)">`;
    }

    return `
      <div class="migration-form-group">
        <label style="display:flex; justify-content:space-between; align-items:center;">
          <span>${label}</span>
          ${warningBadge}
        </label>
        ${inputHtml}
      </div>
    `;
  }

  if (sectionId === 'skillAcquisition') {
    const domains = {
      langComm: 'Language & Communication Domain',
      social: 'Social Skills Domain',
      adaptive: 'Adaptive Skills Domain'
    };
    
    for (let domKey in domains) {
      html += `<h4 style="margin-top: 1.5rem; margin-bottom: 0.75rem; color: var(--color-blue-dark); border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 0.25rem;">${domains[domKey]}</h4>`;
      const domainData = sectionData[domKey] || {};
      const fields = {
        goalStatement: { label: 'Goal Statement', type: 'textarea' },
        medicalNecessity: { label: 'Medical Necessity Rationale', type: 'textarea' },
        baseline: { label: 'Baseline Metrics', type: 'textarea' },
        dateIntro: { label: 'Date Introduced', type: 'text', placeholder: 'YYYY-MM-DD' },
        projectedMastery: { label: 'Projected Mastery Date', type: 'text', placeholder: 'YYYY-MM-DD' },
        progressData: { label: 'Progress Metrics/Data', type: 'textarea' },
        barriers: { label: 'Barriers & Remedies', type: 'textarea' }
      };
      
      for (let fKey in fields) {
        const val = domainData[fKey] || '';
        html += renderField(fields[fKey].label, `${sectionId}.${domKey}.${fKey}`, val, fields[fKey].type, fields[fKey].placeholder || '');
      }
    }
  } else if (sectionId === 'replacementBehaviors') {
    html += `<h4 style="margin-top: 1.5rem; margin-bottom: 0.75rem; color: var(--color-blue-dark); border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 0.25rem;">Aggression Replacement Behavior</h4>`;
    const aggData = sectionData.aggression || {};
    const fields = {
      goalStatement: { label: 'Goal Statement', type: 'textarea' },
      medicalNecessity: { label: 'Medical Necessity', type: 'textarea' },
      baseline: { label: 'Baseline Metrics', type: 'textarea' },
      dateIntro: { label: 'Date Introduced', type: 'text', placeholder: 'YYYY-MM-DD' },
      projectedMastery: { label: 'Projected Mastery Date', type: 'text', placeholder: 'YYYY-MM-DD' },
      progressData: { label: 'Progress Metrics/Data', type: 'textarea' },
      barriers: { label: 'Barriers & Remedies', type: 'textarea' }
    };
    for (let fKey in fields) {
      const val = aggData[fKey] || '';
      html += renderField(fields[fKey].label, `${sectionId}.aggression.${fKey}`, val, fields[fKey].type, fields[fKey].placeholder || '');
    }
  } else if (sectionId === 'reductionBehaviors') {
    html += `<h4 style="margin-top: 1.5rem; margin-bottom: 0.75rem; color: var(--color-blue-dark); border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 0.25rem;">Aggression Reduction Behavior</h4>`;
    const aggData = sectionData.aggression || {};
    const fields = {
      goalStatement: { label: 'Goal Statement', type: 'textarea' },
      baseline: { label: 'Baseline Metrics', type: 'textarea' },
      dateIntro: { label: 'Date Introduced', type: 'text', placeholder: 'YYYY-MM-DD' },
      projectedMastery: { label: 'Projected Mastery Date', type: 'text', placeholder: 'YYYY-MM-DD' },
      progressData: { label: 'Progress Metrics/Data', type: 'textarea' },
      barriers: { label: 'Barriers & Remedies', type: 'textarea' }
    };
    for (let fKey in fields) {
      const val = aggData[fKey] || '';
      html += renderField(fields[fKey].label, `${sectionId}.aggression.${fKey}`, val, fields[fKey].type, fields[fKey].placeholder || '');
    }
  } else {
    const meta = FIELD_METADATA[sectionId] || {};
    for (let key in meta) {
      const val = sectionData[key] !== undefined ? sectionData[key] : '';
      html += renderField(meta[key].label, `${sectionId}.${key}`, val, meta[key].type, meta[key].placeholder || '');
    }
  }

  return html;
}

function updateMigrationField(path, value) {
  const parts = path.split('.');
  if (parts.length === 2) {
    window.pendingMigrationData[parts[0]][parts[1]] = value;
  } else if (parts.length === 3) {
    if (!window.pendingMigrationData[parts[0]][parts[1]]) {
      window.pendingMigrationData[parts[0]][parts[1]] = {};
    }
    window.pendingMigrationData[parts[0]][parts[1]][parts[2]] = value;
  }
  
  updateTabFlagCount(parts[0]);
  updateFooterFlagCount();
  
  // Update class of input live
  const eventTarget = window.event?.target;
  if (eventTarget) {
    const isFlagged = value === '🟠 FLAG FOR REVIEW';
    eventTarget.classList.toggle('flagged', isFlagged);
    
    // Sibling label's badge update
    const labelEl = eventTarget.previousElementSibling;
    if (labelEl) {
      const badge = labelEl.querySelector('.migration-tab-badge');
      if (badge && !isFlagged) {
        badge.remove();
      } else if (!badge && isFlagged) {
        const span = document.createElement('span');
        span.className = 'migration-tab-badge';
        span.innerHTML = `<i data-lucide="alert-triangle" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:2px;"></i> Needs Review`;
        labelEl.appendChild(span);
        lucide.createIcons();
      }
    }
  }
}

function updateTabFlagCount(sectionId) {
  const flagCount = countFlagsInSection(sectionId, window.pendingMigrationData);
  const badge = document.getElementById(`sidebar-badge-${sectionId}`);
  const tab = document.getElementById(`sidebar-tab-${sectionId}`);
  
  if (badge) {
    if (flagCount > 0) {
      badge.textContent = flagCount;
      badge.style.display = 'flex';
      if (tab) tab.classList.add('flagged');
    } else {
      badge.style.display = 'none';
      if (tab) tab.classList.remove('flagged');
    }
  }
  
  if (sectionId === currentEditorTab) {
    const banner = document.getElementById('tab-warning-banner');
    if (flagCount > 0) {
      if (banner) {
        banner.style.display = 'flex';
        banner.querySelector('strong').textContent = flagCount;
      } else {
        renderActiveTabFields();
      }
    } else {
      if (banner) banner.style.display = 'none';
    }
  }
}

function updateFooterFlagCount() {
  const total = countTotalFlags(window.pendingMigrationData);
  const footerBadge = document.getElementById('migration-flag-summary-count');
  if (footerBadge) {
    if (total > 0) {
      footerBadge.textContent = `⚠️ ${total} fields left to review`;
      footerBadge.style.color = '#e65100';
      footerBadge.style.display = 'inline-block';
    } else {
      footerBadge.textContent = `✅ All flags resolved!`;
      footerBadge.style.color = '#2e7d32';
      footerBadge.style.display = 'inline-block';
    }
  }
}

function clearFlagsInSection(sectionId) {
  function clearFlags(obj) {
    for (let k in obj) {
      if (typeof obj[k] === 'string' && obj[k] === '🟠 FLAG FOR REVIEW') {
        obj[k] = '';
      } else if (typeof obj[k] === 'object' && obj[k] !== null) {
        clearFlags(obj[k]);
      }
    }
  }
  
  if (window.pendingMigrationData[sectionId]) {
    clearFlags(window.pendingMigrationData[sectionId]);
    updateTabFlagCount(sectionId);
    updateFooterFlagCount();
    renderActiveTabFields();
  }
}

function clearAllMigrationFlags() {
  function clearFlags(obj) {
    for (let k in obj) {
      if (typeof obj[k] === 'string' && obj[k] === '🟠 FLAG FOR REVIEW') {
        obj[k] = '';
      } else if (typeof obj[k] === 'object' && obj[k] !== null) {
        clearFlags(obj[k]);
      }
    }
  }
  
  clearFlags(window.pendingMigrationData);
  
  if (migrationViewMode === 'form') {
    renderSidebar();
    renderActiveTabFields();
  } else {
    renderMigrationEditor();
  }
  updateFooterFlagCount();
  alert('All flagged fields have been cleared and set to empty strings.');
}

async function commitMigration() {
  // If in JSON view, parse the latest edits before committing
  if (migrationViewMode === 'json') {
    const textarea = document.getElementById('migration-json-textarea');
    if (textarea) {
      try {
        window.pendingMigrationData = JSON.parse(textarea.value);
      } catch (err) {
        alert('Cannot commit: Invalid JSON syntax in the editor. Please fix it first.');
        return;
      }
    }
  }

  const btn = document.querySelector('#migration-modal-overlay button[onclick="commitMigration()"]');
  if (!btn) return;
  const originalText = btn.innerHTML;
  btn.innerHTML = `<i data-lucide="loader-2" class="lucide-loader-2" style="width: 18px; height: 18px; animation: spin 2s linear infinite;"></i> Committing...`;
  lucide.createIcons();

  const clientId = selectedClientId || 'ethan-brooks';
  const data = window.pendingMigrationData;
  
  // Persist the full assessment data structure to localStorage
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
    alert(`Success! The complete legacy assessment report details have been successfully imported and mapped to the template.`);
    
    window.pendingMigrationData = null; // Clear out extracted data

    // Remove the committed item from the draft list
    const draftList = document.getElementById('draft-migrations-list');
    if (draftList && draftList.children.length > 0) {
      draftList.removeChild(draftList.children[0]);
    }
  }, 1500);
}

async function handleTextPasteExtraction() {
  const pasteArea = document.getElementById('migration-text-paste');
  if (!pasteArea) return;
  const text = pasteArea.value.trim();
  if (!text) {
    alert('Please paste some legacy assessment text to extract.');
    return;
  }
  
  const btn = document.querySelector('button[onclick="handleTextPasteExtraction()"]');
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i data-lucide="loader-2" class="lucide-loader-2" style="width: 16px; height: 16px; animation: spin 2s linear infinite; display: inline-block; vertical-align: middle; margin-right: 4px;"></i> Extracting...`;
  lucide.createIcons();
  
  try {
    window.pendingMigrationData = extractAssessmentData(text);
    
    // Add the draft to the list
    const draftList = document.getElementById('draft-migrations-list');
    const newDraft = document.createElement('div');
    newDraft.className = 'file-row';
    newDraft.style.borderLeft = '4px solid var(--color-turquoise)';
    
    const client = typeof getClientById === 'function' ? getClientById(selectedClientId || 'ethan-brooks') : null;
    const clientName = client ? client.name : 'Client';
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    newDraft.innerHTML = `
      <div>
        <strong>Pasted_Text_Assessment_${timestamp}.txt</strong>
        <span style="color: var(--color-blue-dark); font-weight: 500;">Offline extraction complete</span>
      </div>
      <button class="glass-btn btn-sm" onclick="openReviewModal('${selectedClientId || 'ethan-brooks'}')">Review & Commit</button>
    `;
    draftList.prepend(newDraft);
    
    // Clear the textarea
    pasteArea.value = '';
    
    // Auto-open the review modal right away
    openReviewModal(selectedClientId || 'ethan-brooks');
    
  } catch (error) {
    console.error('Extraction error:', error);
    alert('Error extracting text. Please check the console for details.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
    lucide.createIcons();
  }
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
