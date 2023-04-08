
/*
Function returns user object if inputted email matches existing
*/
const getUserByEmail = (email,database) => {
  for (const userId in database) {
    const user = database[userId];
    if (user.email === email) {
      return user;
    }
  }

  return null;
};

module.exports = {
  getUserByEmail
}