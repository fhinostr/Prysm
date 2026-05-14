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

function getClientProfiles() {
  return CLIENT_PROFILES.slice();
}

function getClientById(clientId) {
  return CLIENT_PROFILES.find(client => client.id === clientId) || null;
}
