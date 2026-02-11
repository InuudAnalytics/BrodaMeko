const NETWORK_DELAY_MS = 800;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createMockUser = (email) => ({
  id: 'user_001',
  name: 'Toluwalase Daniel',
  email,
});

const shouldFail = (email) => String(email || '').toLowerCase().includes('fail');

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
    user: createMockUser(email),
  };
};

export const mockSignup = async (payload) => {
  await wait(NETWORK_DELAY_MS);

  const email = payload?.email;

  if (!payload?.name || !email || !payload?.password) {
    throw {
      message: 'Name, email, and password are required.',
      status: 400,
      data: null,
    };
  }

  if (shouldFail(email)) {
    throw {
      message: 'Signup failed (mock failure).',
      status: 422,
      data: {
        field: 'email',
      },
    };
  }

  return {
    token: 'mock-token',
    role: 'CAR_OWNER',
    user: {
      id: 'user_002',
      name: payload.name,
      email,
    },
  };
};
