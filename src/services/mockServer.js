const NETWORK_DELAY_MS = 800;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createMockUser = ({ name, email, phone }) => ({
  id: 'user_001',
  name: name || 'Toluwalase Daniel',
  email: email || `user${String(phone || '').replace(/\D/g, '').slice(-4)}@brodameko.local`,
});

const shouldFail = (value) => String(value || '').toLowerCase().includes('fail');

export const mockLogin = async (email, password) => {
  await wait(NETWORK_DELAY_MS);

  if (!email || !password) {
    throw {
      message: 'Email and password are required.',
      status: 400,
      data: null,
    };
  }

  if (shouldFail(email)) {
    throw {
      message: 'Invalid credentials (mock failure).',
      status: 401,
      data: null,
    };
  }

  return {
    token: 'mock-token',
    role: 'CAR_OWNER',
    user: createMockUser({ email }),
  };
};

export const mockSignup = async (payload) => {
  await wait(NETWORK_DELAY_MS);

  const name = payload?.name;
  const email = payload?.email;
  const phone = payload?.phone;
  const role = payload?.role || 'CAR_OWNER';

  if (!name || !payload?.password || (!email && !phone)) {
    throw {
      message: 'Name, password, and either email or phone are required.',
      status: 400,
      data: null,
    };
  }

  if (shouldFail(email || phone)) {
    throw {
      message: 'Signup failed (mock failure).',
      status: 422,
      data: {
        field: email ? 'email' : 'phone',
      },
    };
  }

  return {
    token: 'mock-token',
    role,
    user: {
      id: 'user_002',
      name,
      email: email || `user${String(phone || '').replace(/\D/g, '').slice(-4)}@brodameko.local`,
      phone: phone || '',
    },
  };
};
