import swaggerJsdoc from 'swagger-jsdoc';
import dotenv from 'dotenv';

dotenv.config();

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Anime Learning Platform API',
      version: '1.0.0',
      description: 'API documentation for Anime Learning Platform',
      contact: {
        name: 'API Support',
        email: 'support@animelearning.com'
      }
    },
    servers: [
      {
        url: process.env.FRONTEND_URL || 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            }
          }
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts', './src/controllers/*.ts'] // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options); 