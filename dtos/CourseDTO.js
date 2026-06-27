class CourseDTO {
  /**
   * Formats a course object or an array of course objects for public API response.
   * @param {object|object[]} data - The course object or array of courses from Mongoose.
   * @returns {object|object[]|null}
   */
  static format(data) {
    if (Array.isArray(data)) {
      return data.map(course => this.format(course));
    }

    if (!data) {
      return null;
    }

    return {
      id: data._id,
      title: data.title,
      slug: data.slug,
      description: data.description,
      durationHours: data.durationHours,
      priceNGN: data.priceNGN,
      status: data.status,
      curriculum: data.curriculum,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}

module.exports = CourseDTO;