const CLIENT_PROFILES = [
  {
    id: 'john-doe',
    name: 'John Doe',
    initials: 'JD',
    subtitle: 'Open Session Book and Treatment Planning',
    caregiver: 'Jane Doe — Mother',
    dob: '05/12/2018',
    phone: '(555) 012-3456',
    diagnosis: 'ASD Level 2'
  },
  {
    id: 'mia-hernandez',
    name: 'Mia Hernandez',
    initials: 'MH',
    subtitle: 'Open Session Book and Treatment Planning',
    caregiver: 'Carlos Hernandez — Father',
    dob: '11/03/2019',
    phone: '(555) 987-6543',
    diagnosis: 'ASD Level 1'
  },
  {
    id: 'ethan-brooks',
    name: 'Ethan Brooks',
    initials: 'EB',
    subtitle: 'Open Session Book and Treatment Planning',
    caregiver: 'Sarah Brooks — Mother',
    dob: '08/22/2017',
    phone: '(555) 456-7890',
    diagnosis: 'ASD Level 2'
  }
];

let _clientProfilesCache = null;

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
  
  if (!client.subtitle) {
    client.subtitle = 'Open Session Book and Treatment Planning';
  }
  
  profiles.push(client);
  _clientProfilesCache = profiles;
  localStorage.setItem('prysm_client_profiles', JSON.stringify(profiles));
  return client;
}
