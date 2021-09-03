const { assert } = require('chai');

const { getUserByEmail, checkEmail } = require('../helpers.js');

const testUsers = {
  userRandomID: {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur'
  },
  user2RandomID: {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk'
  }
};

describe('getUserByEmail', () => {
  it('should return a user with valid email', () => {
    const user = getUserByEmail('user@example.com', testUsers);
    const expectedOutput = 'userRandomID';
    assert.equal(user, expectedOutput);
  });
  it('should return undefined with invalid email', () => {
    const user = getUserByEmail('user400@example.com', testUsers);
    const expectedOutput = undefined;
    assert.equal(user, expectedOutput);
  });
  it('should return object inside of user', () => {
    const userObj = checkEmail('user@example.com', testUsers);
    const expectedOutput = testUsers.userRandomID;
    assert.equal(userObj, expectedOutput);
  });
});
