class PaymentDTO {
  /**
   * Formats a payment object or an array of objects for public API response.
   * @param {object|object[]} data - The payment object or array from Mongoose.
   * @returns {object|object[]|null}
   */
  static format(data) {
    if (Array.isArray(data)) {
      return data.map(payment => this.format(payment));
    }

    if (!data) {
      return null;
    }

    return {
      id: data._id,
      registrationId: data.registrationId,
      paystackReference: data.paystackReference,
      amountKobo: data.amountKobo,
      currency: data.currency,
      channel: data.channel,
      status: data.status,
      verifiedAt: data.verifiedAt,
      createdAt: data.createdAt,
    };
  }
}

module.exports = PaymentDTO;