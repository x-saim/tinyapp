
/**
 * Returns a user object from a database that matches a given email address, ignoring any leading or trailing white spaces, and case-insensitive.
 * @param {string} email - The email address to search for in the database.
 * @param {Object} database - The database object to search for the user with the given email address.
 * @returns {Object|undefined} - The user object from the database that matches the given email address, or undefined if no such user exists in the database.
 */

const getUserByEmail = (email,database) => {
  for (const userId in database) {
    const user = database[userId];
    if (user.email === email.toLowerCase().trim()) {
      return user;
    }
  }

  return undefined;
};

module.exports = {
  getUserByEmail
};