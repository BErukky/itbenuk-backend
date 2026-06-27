class UserDTO {
  /**
   * Formats a user object or an array of user objects for public API response.
   * @param {object|object[]} data - The user object or array of users from Mongoose.
   * @returns {object|object[]|null}
   */
  static format(data) {
    if (Array.isArray(data)) {
      return data.map(user => this.format(user));
    }

    if (!data) {
      return null;
    }

    return {
      id: data._id,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      role: data.role,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}

module.exports = UserDTO;
