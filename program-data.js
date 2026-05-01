const PROGRAM_STORAGE_KEY = 'aba-program-data-v1';

const DEFAULT_PROGRAM = {
  clientName: 'John Doe',
  targets: [
    {
      id: 'ta-shoes',
      name: 'Tying Shoes',
      domain: 'skill',
      measurementType: 'ta',
      phase: 'Acquisition',
      lastStaff: 'Maria R.',
      opDef: 'The learner will independently complete all steps of tying their shoes within 2 minutes of the discriminative stimulus (Sd) "Tie your shoes".',
      procedures: 'Total Task Presentation with least-to-most prompting. Wait 3 seconds for independent response before providing next level prompting. Reinforce immediately upon completion.',
      example: 'Learner pulls loops tight securely without the knot slipping.',
      nonExample: 'Learner ties a "granny knot" that falls apart immediately.',
      steps: [
        'Pick up one lace in each hand',
        'Cross the laces',
        'Tuck one lace under the other',
        'Pull tight',
        'Make a loop with one lace',
        'Wrap the other lace around the loop',
        'Push the lace through the hole',
        'Pull both loops tight'
      ],
      masteryCriteria: { threshold: 90, consecutiveSessions: 3 },
      sessionData: [85, 88, 91, 93, 94]
    },
    {
      id: 'pc-colors',
      name: 'Tacting Colors',
      domain: 'skill',
      measurementType: 'percent',
      phase: 'Acquisition',
      lastStaff: 'James T.',
      opDef: 'Saying the correct color name (verbal response) within 3 seconds of the therapist pointing to a colored card and asking "What color?".',
      procedures: 'Present Sd "What color?". Wait 3s. If incorrect, use echoic prompt and mark (-). If correct, provide vocal praise and mark (+).',
      example: 'Saying "Blue" clearly. Approximations like "Bwue" are acceptable.',
      nonExample: 'Saying the wrong color, no response, or saying "color".',
      masteryCriteria: { threshold: 90, consecutiveSessions: 3 },
      sessionData: [72, 80, 84]
    },
    {
      id: 'int-play',
      name: 'Independent Play',
      domain: 'skill',
      measurementType: 'interval',
      phase: 'Generalization',
      lastStaff: 'Maria R.',
      opDef: 'Engaging appropriately with toys continuously for the entire 1-minute interval without seeking adult attention.',
      procedures: 'Whole interval recording. Mark the interval ONLY if the child played independently for the entire 60 seconds without interruption.',
      example: 'Stacking blocks, looking at book pages quietly.',
      nonExample: 'Throwing toys, bringing toy to therapist during the interval.',
      intervalLength: 60,
      intervalUnit: 'seconds',
      intervalKind: 'whole',
      masteryCriteria: { threshold: 90, consecutiveSessions: 3 },
      sessionData: [91, 92, 95]
    },
    {
      id: 'freq-hitting',
      name: 'Hitting',
      domain: 'problem',
      measurementType: 'frequency',
      phase: 'Intervention',
      lastStaff: 'James T.',
      opDef: 'Any instance of open or closed hand making forceful contact with another person from a distance greater than 6 inches.',
      procedures: 'Block when possible. Do not provide verbal attention. Re-direct neutrally.',
      example: "Slapping therapist's arm.",
      nonExample: 'High-five, gently resting hand on shoulder.',
      masteryCriteria: { maxOccurrences: 2, consecutiveSessions: 3 },
      sessionData: [8, 5, 3]
    },
    {
      id: 'dur-tantrum',
      name: 'Tantrum',
      domain: 'problem',
      measurementType: 'duration',
      phase: 'Intervention',
      lastStaff: 'Sara L.',
      opDef: 'Engaging in crying with tears or whining accompanied by dropping to the floor or throwing items.',
      procedures: 'Start timer at onset. Stop timer when 30 seconds of calm behavior occurs. Planned ignoring. Ensure safety.',
      example: 'Crying loudly while kicking floor.',
      nonExample: 'Brief protest without crying, calmly saying "no".',
      masteryCriteria: { maxOccurrences: 2, consecutiveSessions: 3 },
      sessionData: [1, 1, 0]
    }
  ]
};

const MEASUREMENT_META = {
  ta: { label: 'Task Analysis', icon: 'list-ordered' },
  percent: { label: '% Correct', icon: 'check-circle' },
  interval: { label: 'Interval', icon: 'clock' },
  frequency: { label: 'Frequency', icon: 'plus-circle' },
  duration: { label: 'Duration', icon: 'timer' }
};

function cloneProgramData(data) {
  return JSON.parse(JSON.stringify(data));
}

function getDefaultMasteryCriteria(target) {
  if (target.domain === 'problem') {
    return { maxOccurrences: 2, consecutiveSessions: 3 };
  }
  return { threshold: 90, consecutiveSessions: 3 };
}

function normalizeProgramData(program) {
  if (!program || !Array.isArray(program.targets) || program.targets.length === 0) {
    return cloneProgramData(DEFAULT_PROGRAM);
  }

  return {
    clientName: program.clientName || DEFAULT_PROGRAM.clientName,
    targets: program.targets.map((target, index) => ({
      ...target,
      id: target.id || slugify(`${target.name || 'target'}-${index + 1}`),
      masteryCriteria: target.masteryCriteria || getDefaultMasteryCriteria(target),
      sessionData: target.sessionData || [],
      phase: target.phase || 'Acquisition',
      lastStaff: target.lastStaff || '—'
    }))
  };
}

function loadProgramData() {
  const raw = localStorage.getItem(PROGRAM_STORAGE_KEY);
  if (!raw) {
    const defaults = cloneProgramData(DEFAULT_PROGRAM);
    saveProgramData(defaults);
    return defaults;
  }

  try {
    return normalizeProgramData(JSON.parse(raw));
  } catch (error) {
    const defaults = cloneProgramData(DEFAULT_PROGRAM);
    saveProgramData(defaults);
    return defaults;
  }
}

function saveProgramData(program) {
  const normalized = normalizeProgramData(program);
  localStorage.setItem(PROGRAM_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

function upsertTarget(target) {
  const program = loadProgramData();
  const existingIds = new Set(program.targets.map(item => item.id));
  let nextId = target.id || slugify(target.name);

  if (!target.id) {
    let suffix = 2;
    while (existingIds.has(nextId)) {
      nextId = `${slugify(target.name)}-${suffix}`;
      suffix += 1;
    }
  }

  const nextTarget = {
    ...target,
    id: nextId
  };

  const existingIndex = program.targets.findIndex(item => item.id === nextTarget.id);
  if (existingIndex >= 0) {
    program.targets[existingIndex] = nextTarget;
  } else {
    program.targets.unshift(nextTarget);
  }

  return saveProgramData(program);
}

function deleteTarget(targetId) {
  const program = loadProgramData();
  program.targets = program.targets.filter(target => target.id !== targetId);
  return saveProgramData(program);
}

function getTargetById(targetId) {
  return loadProgramData().targets.find(target => target.id === targetId) || null;
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `target-${Date.now()}`;
}
