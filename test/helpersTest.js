const { assert } = require('chai');

const { getUserByEmail, urlsForUser} = require('../helpers.js');

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

describe("urlsForUser", function() {
  const urlDatabase = {
    "2Ko7eU": { longURL: "https://www.google.com", userID: "LW6p8S" },
    "6Jm2vQ": { longURL: "https://www.facebook.com", userID: "X9s4tD" },
    "4Dp5wV": { longURL: "https://www.twitter.com", userID: "LW6p8S" },
    "9Nk1rX": { longURL: "https://www.github.com", userID: "X9s4tD" }
  };

  it("should return an empty object if the user has no URLs", function() {
    const id = "user123";
    const result = urlsForUser(id, urlDatabase);
    assert.deepEqual(result, {});
  });

  it("should return an object containing URLs for the specified user", function() {
    const id = "LW6p8S";
    const result = urlsForUser(id, urlDatabase);
    const expected = {
      "2Ko7eU": { longURL: "https://www.google.com", userID: "LW6p8S" },
      "4Dp5wV": { longURL: "https://www.twitter.com", userID: "LW6p8S" }
    };
    assert.deepEqual(result, expected);
  });
});
