const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', () => {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.equal(user.id,expectedUserID);
  });

  it(`should return undefined if non-existent email`, () => {
    const user = getUserByEmail("invalid@email.com", testUsers);
    assert.isUndefined(user);
  });

  it('should return undefined if the database is empty', function() {
    const emptyDatabase = {};
    const user = getUserByEmail("user@example.com", emptyDatabase);
    assert.isUndefined(user);
  });

  it('should return a user with valid email that has uppercase characters', function() {
    const user = getUserByEmail("USER@EXAMPLE.COM", testUsers);
    const expectedUserID = "userRandomID";
    assert.equal(user.id, expectedUserID);
  });

  it('should return a user with valid email that has leading and/or trailing spaces', function() {
    const user = getUserByEmail("  user@example.com  ", testUsers);
    const expectedUserID = "userRandomID";
    assert.equal(user.id, expectedUserID);
  });

  it('should return undefined if the email is an empty string', function() {
    const user = getUserByEmail("", testUsers);
    assert.isUndefined(user);
  });

});