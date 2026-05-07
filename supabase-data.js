// ═══════════════════════════════════════════════════════════════
// PRYSM ABA LMS — Supabase Data Access Layer
// Replaces localStorage-based program-data.js functions with
// async Supabase queries. Keeps the same function signatures
// so existing UI code requires minimal changes.
// ═══════════════════════════════════════════════════════════════

// ─── CLIENT OPERATIONS ───────────────────────────────────────

/**
 * Load all clients the current user is assigned to.
 * @returns {Promise<Array>} Array of client objects
 */
async function loadAssignedClients() {
  const { data, error } = await window.supabaseClient
    .from('clients')
    .select('*')
    .eq('status', 'active')
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Error loading clients:', error);
    return [];
  }

  return data.map(client => ({
    id: client.id,
    clinicalId: client.clinical_id,
    name: client.full_name,
    initials: client.initials,
    dob: client.dob,
    status: client.status,
    subtitle: 'Open Session Book and Treatment Planning'
  }));
}

/**
 * Get a single client by ID.
 * @param {string} clientId
 * @returns {Promise<Object|null>}
 */
async function getClientByIdAsync(clientId) {
  const { data, error } = await window.supabaseClient
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (error) return null;

  return {
    id: data.id,
    clinicalId: data.clinical_id,
    name: data.full_name,
    initials: data.initials,
    dob: data.dob,
    status: data.status
  };
}


// ─── TARGET OPERATIONS ───────────────────────────────────────

/**
 * Load all targets for a specific client.
 * Returns data in the same shape as the old program-data.js format.
 * @param {string} clientId
 * @returns {Promise<Object>} { clientName, targets[] }
 */
async function loadProgramDataAsync(clientId) {
  // Load client info
  const client = await getClientByIdAsync(clientId);
  if (!client) {
    return { clientName: 'Unknown', targets: [] };
  }

  // Load targets
  const { data: targets, error } = await window.supabaseClient
    .from('targets')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error loading targets:', error);
    return { clientName: client.name, targets: [] };
  }

  return {
    clientName: client.name,
    targets: targets.map(normalizeTargetFromDB)
  };
}

/**
 * Load past session data for a specific target (for graphing).
 * @param {string} targetId
 * @param {number} limit - Max number of sessions to return
 * @returns {Promise<Array>}
 */
async function loadSessionHistory(targetId, limit = 10) {
  const { data, error } = await window.supabaseClient
    .from('session_data')
    .select('*')
    .eq('target_id', targetId)
    .order('session_date', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error loading session history:', error);
    return [];
  }

  return data;
}

/**
 * Save session data for a target.
 * @param {string} clientId
 * @param {string} targetId
 * @param {Object} dataJson - The measurement data
 * @param {number} durationSecs - Total session duration
 * @param {string} notes - Session notes
 * @returns {Promise<Object|null>}
 */
async function saveSessionDataAsync(clientId, targetId, dataJson, durationSecs, notes) {
  const { data, error } = await window.supabaseClient
    .from('session_data')
    .insert({
      client_id: clientId,
      target_id: targetId,
      rbt_id: window.PRYSM_USER.id,
      duration_secs: durationSecs,
      data_json: dataJson,
      notes: notes || null
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving session data:', error);
    return null;
  }

  return data;
}

/**
 * Create or update a target (BCBA only).
 * @param {string} clientId
 * @param {Object} target - Target data in frontend format
 * @returns {Promise<Object>} The saved target in frontend format
 */
async function upsertTargetAsync(clientId, target) {
  const payload = normalizeTargetToDB(clientId, target);

  const { data, error } = await window.supabaseClient
    .from('targets')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('Error saving target:', error);
    throw error;
  }

  return normalizeTargetFromDB(data);
}

/**
 * Delete a target (BCBA only).
 * @param {string} targetId
 * @returns {Promise<boolean>}
 */
async function deleteTargetAsync(targetId) {
  const { error } = await window.supabaseClient
    .from('targets')
    .delete()
    .eq('id', targetId);

  if (error) {
    console.error('Error deleting target:', error);
    return false;
  }

  return true;
}

/**
 * Get a single target by ID.
 * @param {string} targetId
 * @returns {Promise<Object|null>}
 */
async function getTargetByIdAsync(targetId) {
  const { data, error } = await window.supabaseClient
    .from('targets')
    .select('*')
    .eq('id', targetId)
    .single();

  if (error) return null;
  return normalizeTargetFromDB(data);
}


// ─── FILE OPERATIONS ─────────────────────────────────────────

/**
 * Load files for a client grouped by category.
 * @param {string} clientId
 * @returns {Promise<Object>} { insurance: [], assessment: [], treatment: [], additional: [] }
 */
async function loadClientFiles(clientId) {
  const { data, error } = await window.supabaseClient
    .from('client_files')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading files:', error);
    return { insurance: [], assessment: [], treatment: [], additional: [] };
  }

  const grouped = { insurance: [], assessment: [], treatment: [], additional: [] };
  data.forEach(file => {
    if (grouped[file.category]) {
      grouped[file.category].push(file);
    }
  });

  return grouped;
}


// ─── NORMALIZERS (DB ↔ Frontend format) ──────────────────────

/**
 * Convert a database target row into the frontend format
 * (camelCase, matching the shape in program-data.js).
 */
function normalizeTargetFromDB(row) {
  const target = {
    id: row.id,
    name: row.name,
    domain: row.domain,
    measurementType: row.measurement_type,
    phase: row.phase,
    opDef: row.op_def || '',
    procedures: row.procedures || '',
    example: row.example || '',
    nonExample: row.non_example || '',
    lastStaff: row.last_staff_name || '—',
    masteryCriteria: {},
    sessionData: [] // Will be loaded separately if needed
  };

  // Mastery criteria
  if (row.domain === 'problem') {
    target.masteryCriteria = {
      maxOccurrences: row.mastery_max_occ || 2,
      consecutiveSessions: row.mastery_consecutive || 3
    };
  } else {
    target.masteryCriteria = {
      threshold: row.mastery_threshold || 90,
      consecutiveSessions: row.mastery_consecutive || 3
    };
  }

  // Task Analysis steps
  if (row.measurement_type === 'ta' && row.steps) {
    target.steps = row.steps;
  }

  // Interval config
  if (row.measurement_type === 'interval') {
    target.intervalLength = row.interval_length || 60;
    target.intervalUnit = row.interval_unit || 'seconds';
    target.intervalKind = row.interval_kind || 'whole';
  }

  return target;
}

/**
 * Convert a frontend target object into the database row format
 * (snake_case, matching the targets table schema).
 */
function normalizeTargetToDB(clientId, target) {
  const row = {
    client_id: clientId,
    name: target.name,
    domain: target.domain,
    measurement_type: target.measurementType,
    phase: target.phase || 'Acquisition',
    op_def: target.opDef || null,
    procedures: target.procedures || null,
    example: target.example || null,
    non_example: target.nonExample || null,
    last_staff_name: target.lastStaff || null
  };

  // Preserve ID for updates
  if (target.id) {
    row.id = target.id;
  }

  // TA steps
  if (target.measurementType === 'ta') {
    row.steps = target.steps || [];
  }

  // Interval config
  if (target.measurementType === 'interval') {
    row.interval_length = target.intervalLength || 60;
    row.interval_unit = target.intervalUnit || 'seconds';
    row.interval_kind = target.intervalKind || 'whole';
  }

  // Mastery criteria
  if (target.masteryCriteria) {
    row.mastery_threshold = target.masteryCriteria.threshold || null;
    row.mastery_consecutive = target.masteryCriteria.consecutiveSessions || 3;
    row.mastery_max_occ = target.masteryCriteria.maxOccurrences || null;
  }

  return row;
}


// ─── CURRENT CLIENT CONTEXT ──────────────────────────────────
// Tracks which client is currently selected in the UI

let _currentClientId = null;

function setCurrentClient(clientId) {
  _currentClientId = clientId;
  sessionStorage.setItem('prysm_current_client', clientId);
}

function getCurrentClientId() {
  if (_currentClientId) return _currentClientId;
  return sessionStorage.getItem('prysm_current_client');
}
