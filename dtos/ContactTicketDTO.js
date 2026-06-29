class ContactTicketDTO {
  /**
   * Formats a contact ticket or array of tickets for API response.
   * @param {object|object[]} data
   * @returns {object|object[]|null}
   */
  static format(data) {
    if (Array.isArray(data)) {
      return data.map(ticket => this.format(ticket));
    }

    if (!data) {
      return null;
    }

    return {
      id: data._id,
      ticketId: data.ticketId,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      subject: data.subject,
      message: data.message,
      status: data.status,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}

module.exports = ContactTicketDTO;
