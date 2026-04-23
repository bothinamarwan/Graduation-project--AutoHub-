const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Automotive API',
      version: '1.0.0',
      description: 'graduation-project-autohub-production.up.railway.app',
    },
    servers: [
      {
        url: 'https://graduation-project-autohub-production.up.railway.app',
        description: 'Production server',
      },
      {
        url: 'http://localhost:' + (process.env.PORT || 3000),
        description: 'Local server',
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
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Paths to files containing OpenAPI definitions
  apis: ['./src/routes/*.js', './src/index.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
