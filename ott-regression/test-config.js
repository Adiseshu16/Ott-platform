// test-config.js
module.exports = {
  BASE_URL: 'https://www.tvbanywhereplusna.com',

  VALID_USER: {
    email:    'adiseshu@tv2z.com',
    password: 'adiseshu',
  },
  INVALID_USER: {
    email:    'invalid@example.com',
    password: 'WrongPassword',
  },

  TEST_CONTENT: {
    searchQuery:    'news',
    expectedTitle:  '',
    shortClipTitle: '',
  },

  TIMEOUTS: {
    pageLoad:   30_000,
    videoStart: 20_000,
    animation:   1_000,
    short:       3_000,
  },
};
