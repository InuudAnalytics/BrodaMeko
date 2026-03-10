// TODO: replace towing mock data with GET /towing-companies endpoint when available.
// TODO: backend response should include service area, dispatch ETA, and verified contact lines.
const towingCompanies = [
  {
    id: 'tow-1',
    name: 'Lagos state towing company',
    rating: 4.9,
    distance: '1.3km away',
    address: '12 Ahmadu Bello Way, Victoria Island, Lagos',
    phoneNumbers: ['+234 803 111 2200', '+234 809 444 1100'],
    instructions: 'Call ahead before dispatch. Service available 24/7.',
    image:
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'tow-2',
    name: 'Omoniyi stand towing service',
    rating: 4.9,
    distance: '1.3km away',
    address: '21 Ikorodu Road, Palmgrove, Lagos',
    phoneNumbers: ['+234 805 992 3100'],
    instructions: 'Supports sedan and SUV towing. Estimated dispatch 20-30 mins.',
    image:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'tow-3',
    name: 'Motoring Nigeria',
    rating: 4.9,
    distance: '1.3km away',
    address: '8 Admiralty Way, Lekki Phase 1, Lagos',
    phoneNumbers: ['+234 807 556 8822'],
    instructions: 'Driver will request location pin in chat before dispatch.',
    image:
      'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'tow-4',
    name: 'Rescue and recovery Nig Ltd',
    rating: 4.9,
    distance: '1.3km away',
    address: '34 Allen Avenue, Ikeja, Lagos',
    phoneNumbers: ['+234 816 700 3311'],
    instructions: 'Heavy-duty flatbed available. Valid ID may be requested on pickup.',
    image:
      'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'tow-5',
    name: 'Qevla',
    rating: 4.9,
    distance: '1.3km away',
    address: '5 Bode Thomas Street, Surulere, Lagos',
    phoneNumbers: ['+234 812 550 9088'],
    instructions: 'Towing plus roadside diagnostics on request.',
    image:
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=200&q=80',
  },
];

export default towingCompanies;
