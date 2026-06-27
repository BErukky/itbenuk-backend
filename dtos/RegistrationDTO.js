const UserDTO = require('./UserDTO');
const CourseDTO = require('./CourseDTO');
const PaymentDTO = require('./PaymentDTO');

class RegistrationDTO {
  /**
   * Formats a registration object or an array of objects for public API response.
   * @param {object|object[]} data - The registration object or array from Mongoose.
   * @returns {object|object[]|null}
   */
  static format(data) {
    if (Array.isArray(data)) {
      return data.map(reg => this.format(reg));
    }

    if (!data) {
      return null;
    }

    return {
      id: data._id,
      registrationId: data.registrationId,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      message: data.message,
      status: data.status,
      ipAddress: data.ipAddress,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      // Handle populated fields
      user: data.userId ? UserDTO.format(data.userId) : null,
      course: data.courseId ? CourseDTO.format(data.courseId) : null,
      payment: data.paymentId ? PaymentDTO.format(data.paymentId) : null,
    };
  }
}

module.exports = RegistrationDTO;