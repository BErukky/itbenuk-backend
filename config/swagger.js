const swaggerJsdoc = require('swagger-jsdoc');

const isProduction = process.env.NODE_ENV === 'production';
const serverUrl = isProduction
  ? process.env.RENDER_EXTERNAL_URL || 'https://itbenuk-backend.onrender.com'
  : 'http://localhost:5000';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'iTbenuk Backend API',
      version: '1.0.0',
      description: 'API documentation for the iTbenuk backend',
    },
    servers: [
      {
        url: serverUrl,
        description: isProduction ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);
module.exports = specs;
