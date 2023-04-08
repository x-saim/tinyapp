
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

/**
 * Returns a randomly generated string with a length of six characters.
 *
 * @returns {string} A randomly generated string with a length of six characters.
 */

const generateRandomString = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; //62 characters
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};


module.exports = {
  getUserByEmail
};