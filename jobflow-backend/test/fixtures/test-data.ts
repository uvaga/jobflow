export const testUsers = {
  validUser: {
    email: 'test@example.com',
    password: 'Test123456',
    firstName: 'John',
    lastName: 'Doe',
  },
  anotherUser: {
    email: 'another@example.com',
    password: 'Another123456',
    firstName: 'Jane',
    lastName: 'Smith',
  },
  weakPasswordUser: {
    email: 'weak@example.com',
    password: 'weak',
    firstName: 'Weak',
    lastName: 'User',
  },
  invalidEmailUser: {
    email: 'invalid-email',
    password: 'Test123456',
    firstName: 'Invalid',
    lastName: 'Email',
  },
};

export const testVacancies = {
  // Real vacancy ID from hh.ru for testing
  validVacancyId: '130111907',
  invalidVacancyId: '999999999999',
};

export const testVacancyProgress = {
  validData: {
    notes: 'Interested in this position',
    priority: 3,
    tags: ['frontend', 'remote'],
  },
  validStatuses: [
    'saved',
    'applied',
    'interview_scheduled',
    'interview_completed',
    'rejected',
    'offer_received',
    'offer_accepted',
    'withdrawn',
  ] as const,
};
