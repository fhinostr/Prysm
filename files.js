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
  const data = JSON.parse(JSON.stringify(MIGRATION_ASSESSMENTS['john-doe']));
  
  // Clear mock data and set flags to avoid hallucinations like "john"
  function clearMockData(obj) {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        if (key.toLowerCase().includes('date') || key.toLowerCase() === 'dob' || key.toLowerCase().includes('time') || key.toLowerCase().includes('start') || key.toLowerCase().includes('end')) {
          obj[key] = ''; // Keep date/time fields empty to avoid input validation issues
        } else {
          obj[key] = '🟠 FLAG FOR REVIEW';
        }
      } else if (typeof obj[key] === 'number') {
        obj[key] = 0;
      } else if (Array.isArray(obj[key])) {
        obj[key] = []; 
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        clearMockData(obj[key]);
      }
    }
  }
  clearMockData(data);
  
  const dobMatch = text.match(/(?:DOB|Date of Birth):\s*([\d\/\-]+)/i);
  if (dobMatch) data.clientInfo.dob = dobMatch[1].trim();
  
  const assessmentDateMatch = text.match(/(?:Assessment Date|Date of Assessment):\s*([\d\/\-]+)/i);
  if (assessmentDateMatch) data.clientInfo.reassessmentDate = assessmentDateMatch[1].trim();

  const parentMatch = text.match(/(?:Parent|Guardian|Mother|Father)(?:'s Name| Name)?:\s*([A-Za-z\s]+?)(?:\n|$)/i);
  if (parentMatch) data.clientInfo.parentName = parentMatch[1].trim();

  const bioMatch = text.match(/(?:Biopsychosocial|Background|Family Structure)[\s\S]*?(?:Goals|Assessment|Narrative|Behaviors)/i);
  if (bioMatch) {
    let extractedBio = bioMatch[0].replace(/(?:Goals|Assessment|Narrative|Behaviors)$/i, '').trim();
    if (extractedBio.length > 50) data.biopsychosocial.familyStructure = extractedBio.substring(0, 300) + '...';
  }

  const narrativeMatch = text.match(/(?:Observation|Clinical Narrative)[\s\S]*?(?:Goals|Target Behaviors|Recommendations)/i);
  if (narrativeMatch) {
    let extractedNarrative = narrativeMatch[0].replace(/(?:Goals|Target Behaviors|Recommendations)$/i, '').trim();
    if (extractedNarrative.length > 50) data.narrative.clinicalNarrative = extractedNarrative.substring(0, 500) + '...';
  }
  
  const goalMatch = text.match(/Goal(?:s| Statement)?:\s*([\s\S]*?)(?:\n\n|\n[A-Z]|$)/i);
  if (goalMatch) {
    // If we only have an array of goals, we might need to recreate the structure if we cleared it
    // Wait, we cleared string values, but the object structure of data.skillAcquisition.langComm is intact.
    data.skillAcquisition.langComm.goalStatement = goalMatch[1].trim().substring(0, 200);
  }

  return data;
}

async function handleFileUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  
  const uploadZone = document.getElementById('migration-upload-zone');
  const originalHtml = uploadZone.innerHTML;
  
  const file = files[0];
  
  uploadZone.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <i data-lucide="loader-2" class="lucide-loader-2" style="width: 48px; height: 48px; color: var(--color-blue); margin-bottom: 1rem; animation: spin 2s linear infinite;"></i>
      <h3 style="color: var(--color-blue-dark);">AI is analyzing ${file.name}...</h3>
      <p style="color: var(--color-text-light);">Extracting content and mapping to assessment template...</p>
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
        <span style="color: var(--color-blue-dark); font-weight: 500;">Dynamic extraction complete</span>
      </div>
      <button class="glass-btn btn-sm" onclick="openReviewModal('${selectedClientId || 'ethan-brooks'}')">Review & Commit</button>
    `;
    draftList.prepend(newDraft);
    
  } catch (error) {
    console.error('Extraction error:', error);
    alert('Error extracting text from document. Please ensure it is a valid PDF, DOCX, or text file.');
    uploadZone.innerHTML = originalHtml;
    lucide.createIcons();
  }
  
  event.target.value = '';
}

function openReviewModal(clientId) {
  const modal = document.getElementById('migration-modal-overlay');
  const content = document.getElementById('migration-modal-content');
  if (!modal || !content) return;

  const client = typeof getClientById === 'function' ? getClientById(clientId) : null;
  const clientName = client ? client.name : 'Unknown Client';
  const clientDiag = client ? client.diagnosis : 'ASD Level 2';
  
  const data = window.pendingMigrationData ? window.pendingMigrationData : (MIGRATION_ASSESSMENTS[clientId] || MIGRATION_ASSESSMENTS['john-doe']);
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

    <div style="margin-bottom: 1.5rem;">
      <h3 style="color: var(--color-blue-dark); margin-bottom: 0.8rem; display: flex; align-items: center; gap: 6px; font-size: 1.1rem;">
        <i data-lucide="target" style="width: 18px; height: 18px; color: var(--color-blue);"></i> Goals & Skill Acquisition (All Domains)
      </h3>
      <div style="display: flex; flex-direction: column; gap: 0.75rem; background: rgba(0,0,0,0.02); padding: 1rem; border-radius: 12px; border: 1px solid rgba(0,0,0,0.05); font-size: 0.9rem;">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem;">
          <div style="background: white; padding: 0.5rem; border-radius: 8px; text-align: center; border: 1px solid rgba(0,0,0,0.05);"><strong>Total Goals:</strong> ${data.goals.totalGoals}</div>
          <div style="background: white; padding: 0.5rem; border-radius: 8px; text-align: center; border: 1px solid rgba(0,0,0,0.05);"><strong>Mastered:</strong> ${data.goals.goalsMastered}</div>
          <div style="background: white; padding: 0.5rem; border-radius: 8px; text-align: center; border: 1px solid rgba(0,0,0,0.05);"><strong>New:</strong> ${data.goals.goalsNew}</div>
        </div>
        <div style="margin-top: 0.25rem;"><strong>Language Goal:</strong> ${escapeHtml(data.skillAcquisition.langComm.goalStatement)}</div>
        <div><strong>Social Goal:</strong> ${escapeHtml(data.skillAcquisition.social.goalStatement)}</div>
        <div><strong>Adaptive Goal:</strong> ${escapeHtml(data.skillAcquisition.adaptive.goalStatement)}</div>
      </div>
    </div>

    <div style="margin-bottom: 1.5rem;">
      <h3 style="color: var(--color-blue-dark); margin-bottom: 0.8rem; display: flex; align-items: center; gap: 6px; font-size: 1.1rem;">
        <i data-lucide="shield-alert" style="width: 18px; height: 18px; color: var(--color-blue);"></i> Behavior Intervention Plan (BIP)
      </h3>
      <div style="display: flex; flex-direction: column; gap: 0.75rem; background: rgba(0,0,0,0.02); padding: 1rem; border-radius: 12px; border: 1px solid rgba(0,0,0,0.05); font-size: 0.9rem;">
        <div><strong>Target Behavior:</strong> <span style="color: var(--color-text); font-weight: 500;">${escapeHtml(data.bip.targetBehavior)}</span></div>
        <div><strong>Operational Definition:</strong> <span style="color: var(--color-text);">${escapeHtml(data.bip.operationalDefinition)}</span></div>
        <div><strong>Hypothesized Function:</strong> <span style="color: var(--color-text);">${escapeHtml(data.bip.hypothesizedFunction)}</span></div>
        <div><strong>Antecedent Interventions:</strong> <span style="color: var(--color-text);">${escapeHtml(data.bip.antecedentIntervention)}</span></div>
        <div><strong>Consequence Procedures:</strong> <span style="color: var(--color-text);">${escapeHtml(data.bip.consequenceProcedures)}</span></div>
      </div>
    </div>

    <div style="margin-bottom: 1.5rem;">
      <h3 style="color: var(--color-blue-dark); margin-bottom: 0.8rem; display: flex; align-items: center; gap: 6px; font-size: 1.1rem;">
        <i data-lucide="file-check-2" style="width: 18px; height: 18px; color: var(--color-blue);"></i> Recommendations & Provider
      </h3>
      <div style="display: flex; flex-direction: column; gap: 0.75rem; background: rgba(0,0,0,0.02); padding: 1rem; border-radius: 12px; border: 1px solid rgba(0,0,0,0.05); font-size: 0.9rem;">
        <div><strong>Medical Necessity Synopsis:</strong> <span style="color: var(--color-text);">${escapeHtml(data.recommendations.medicalNecessity.substring(0, 150))}...</span></div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div style="background: white; padding: 0.5rem; border-radius: 8px; border: 1px solid rgba(0,0,0,0.05);">
            <strong>Direct (97153):</strong> ${data.recommendations.CPT97153.hours} (${data.recommendations.CPT97153.pos})
          </div>
          <div style="background: white; padding: 0.5rem; border-radius: 8px; border: 1px solid rgba(0,0,0,0.05);">
            <strong>Supervision (97155):</strong> ${data.recommendations.CPT97155.hours}
          </div>
        </div>
        <div><strong>BCBA Signature:</strong> <span style="color: var(--color-text); font-weight: 500;">${escapeHtml(data.providerInfo.signature)}</span></div>
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
  const data = window.pendingMigrationData ? window.pendingMigrationData : (MIGRATION_ASSESSMENTS[clientId] || MIGRATION_ASSESSMENTS['john-doe']);
  
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
