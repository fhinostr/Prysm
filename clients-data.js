const CLIENT_PROFILES = [];

let _clientProfilesCache = null;

function invalidateClientCache() {
  _clientProfilesCache = null;
}

function getClientProfiles() {
  if (typeof window === 'undefined') {
    return CLIENT_PROFILES.slice();
  }
  
  if (!_clientProfilesCache) {
    const stored = localStorage.getItem('prysm_client_profiles');
    if (stored) {
      try {
        _clientProfilesCache = JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse client profiles from localStorage:', e);
      }
    }
    if (!_clientProfilesCache) {
      _clientProfilesCache = CLIENT_PROFILES.slice();
      localStorage.setItem('prysm_client_profiles', JSON.stringify(_clientProfilesCache));
    }
  }
  return _clientProfilesCache.slice();
}

function getClientById(clientId) {
  const profiles = getClientProfiles();
  return profiles.find(client => client.id === clientId) || null;
}

function saveClientProfile(client) {
  const profiles = getClientProfiles();
  
  // Clean / normalize fields
  if (!client.id) {
    client.id = client.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let count = 1;
    let baseId = client.id;
    while (profiles.some(c => c.id === client.id)) {
      client.id = `${baseId}-${count}`;
      count++;
    }
  }
  
  if (!client.initials) {
    client.initials = client.name
      .split(' ')
      .filter(n => n.length > 0)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 3);
  }

  // Ensure type exists
  if (!client.type) {
    client.type = 'individual';
  }

  // Default subtitle based on type
  if (!client.subtitle) {
    client.subtitle = client.type === 'group' 
      ? 'Manage Cohort and Launch Data Collection' 
      : 'Open Session Book and Treatment Planning';
  }
  
  if (client.type === 'group' && !client.members) {
    client.members = [];
  }

  // Update existing or add new
  const index = profiles.findIndex(c => c.id === client.id);
  if (index >= 0) {
    profiles[index] = { ...profiles[index], ...client };
  } else {
    profiles.push(client);
  }
  
  _clientProfilesCache = profiles;
  localStorage.setItem('prysm_client_profiles', JSON.stringify(profiles));
  return client;
}

function deleteClientProfile(clientId) {
  let profiles = getClientProfiles();
  profiles = profiles.filter(c => c.id !== clientId);
  
  // Also remove this client from any group members arrays
  profiles = profiles.map(p => {
    if (p.type === 'group' && p.members && p.members.includes(clientId)) {
      p.members = p.members.filter(id => id !== clientId);
    }
    return p;
  });

  _clientProfilesCache = profiles;
  localStorage.setItem('prysm_client_profiles', JSON.stringify(profiles));
}
