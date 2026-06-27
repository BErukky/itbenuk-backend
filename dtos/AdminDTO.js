class AdminDTO {
  constructor(admin) {
    this.id = admin._id;
    this.username = admin.username;
    this.email = admin.email;
    this.role = admin.role;
    this.createdAt = admin.createdAt;
    this.updatedAt = admin.updatedAt;
  }

  static format(admin) {
    if (Array.isArray(admin)) {
      return admin.map(item => new AdminDTO(item));
    }
    return new AdminDTO(admin);
  }
}

module.exports = AdminDTO;
