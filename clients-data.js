const CLIENT_PROFILES = [
  {
    id: 'john-doe',
    name: 'John Doe',
    initials: 'JD',
    subtitle: 'Open Session Book and Treatment Planning'
  },
  {
    id: 'mia-hernandez',
    name: 'Mia Hernandez',
    initials: 'MH',
    subtitle: 'Open Session Book and Treatment Planning'
  },
  {
    id: 'ethan-brooks',
    name: 'Ethan Brooks',
    initials: 'EB',
    subtitle: 'Open Session Book and Treatment Planning'
  }
];

function getClientProfiles() {
  return CLIENT_PROFILES.slice();
}

function getClientById(clientId) {
  return CLIENT_PROFILES.find(client => client.id === clientId) || null;
}
