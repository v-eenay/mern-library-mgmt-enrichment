const express = require('express');
const { seedingRateLimit } = require('../middleware/uploadRateLimit');
const seedController = require('../controllers/seedController');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     SeedResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         message:
 *           type: string
 *           example: Admin user created successfully
 *         data:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *               example: admin@library.com
 *             name:
 *               type: string
 *               example: System Administrator
 *             role:
 *               type: string
 *               example: admin
 *             created:
 *               type: boolean
 *               example: true
 *
 *     SeedStatusResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         message:
 *           type: string
 *           example: Seeding status retrieved successfully
 *         data:
 *           type: object
 *           properties:
 *             environment:
 *               type: string
 *               example: development
 *             seedingAllowed:
 *               type: boolean
 *               example: true
 *             database:
 *               type: object
 *               properties:
 *                 users:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 3
 *                     admins:
 *                       type: integer
 *                       example: 1
 *                     librarians:
 *                       type: integer
 *                       example: 1
 *                     borrowers:
 *                       type: integer
 *                       example: 1
 *                 categories:
 *                   type: integer
 *                   example: 8
 *             recommendations:
 *               type: array
 *               items:
 *                 type: string
 *               example: []
 */

/**
 * @swagger
 * /api/seed/status:
 *   get:
 *     summary: Get seeding status
 *     description: |
 *       Check the current database seeding status and get recommendations.
 *       Only available in development environment.
 *     tags: [Database Seeding]
 *     security: []
 *     responses:
 *       200:
 *         description: Seeding status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SeedStatusResponse'
 *       400:
 *         description: Seeding not allowed in current environment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Database seeding is only allowed in development environment
 */
router.get('/status', seedController.getSeedingStatus);

/**
 * @swagger
 * /api/seed/admin:
 *   post:
 *     summary: Seed admin user
 *     description: |
 *       Create a default admin user for the system. Only available in development environment.
 *       
 *       **Environment Variables:**
 *       - `ADMIN_EMAIL`: Admin email (default: admin@library.com)
 *       - `ADMIN_PASSWORD`: Admin password (required from environment)
 *       - `ADMIN_NAME`: Admin name (default: System Administrator)
 *       
 *       **Security:**
 *       - Rate limited to 5 attempts per hour
 *       - Only works in development environment
 *       - Idempotent operation (safe to run multiple times)
 *     tags: [Database Seeding]
 *     security: []
 *     responses:
 *       201:
 *         description: Admin user created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SeedResponse'
 *       200:
 *         description: Admin user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SeedResponse'
 *             example:
 *               status: success
 *               message: Admin user already exists
 *               data:
 *                 email: admin@library.com
 *                 existing: true
 *       400:
 *         description: Seeding not allowed or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/admin', seedingRateLimit, seedController.seedAdmin);

/**
 * @swagger
 * /api/seed/librarian:
 *   post:
 *     summary: Seed librarian user
 *     description: |
 *       Create a default librarian user for the system. Only available in development environment.
 *       
 *       **Environment Variables:**
 *       - `LIBRARIAN_EMAIL`: Librarian email (default: librarian@library.com)
 *       - `LIBRARIAN_PASSWORD`: Librarian password (required from environment)
 *       - `LIBRARIAN_NAME`: Librarian name (default: Head Librarian)
 *     tags: [Database Seeding]
 *     security: []
 *     responses:
 *       201:
 *         description: Librarian user created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SeedResponse'
 *       200:
 *         description: Librarian user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SeedResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/librarian', seedingRateLimit, seedController.seedLibrarian);

/**
 * @swagger
 * /api/seed/categories:
 *   post:
 *     summary: Seed default categories
 *     description: |
 *       Create default book categories for the system. Only available in development environment.
 *       
 *       **Default Categories:**
 *       - Fiction, Non-Fiction, Science Fiction, Mystery, Romance, Biography, History, Technology
 *     tags: [Database Seeding]
 *     security: []
 *     responses:
 *       201:
 *         description: Categories created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Default categories created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 8
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: Fiction
 *                           id:
 *                             type: string
 *                             example: 507f1f77bcf86cd799439011
 *       200:
 *         description: Categories already exist
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/categories', seedingRateLimit, seedController.seedCategories);

/**
 * @swagger
 * /api/seed/all:
 *   post:
 *     summary: Seed all initial data
 *     description: |
 *       Create all initial data including admin user, librarian user, and default categories.
 *       Only available in development environment.
 *       
 *       **This endpoint will:**
 *       - Create admin user (if not exists)
 *       - Create librarian user (if not exists)
 *       - Create default categories (if not exist)
 *     tags: [Database Seeding]
 *     security: []
 *     responses:
 *       201:
 *         description: Database seeding completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Database seeding completed. 3/3 operations successful.
 *                 data:
 *                   type: object
 *                   properties:
 *                     admin:
 *                       $ref: '#/components/schemas/SeedResponse'
 *                     librarian:
 *                       $ref: '#/components/schemas/SeedResponse'
 *                     categories:
 *                       type: object
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *       200:
 *         description: Database seeding completed with some existing data
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/all', seedingRateLimit, seedController.seedAll);

/**
 * @swagger
 * /api/seed/reset:
 *   delete:
 *     summary: Reset database (DANGER)
 *     description: |
 *       **⚠️ DANGER: This will delete ALL data from the database!**
 *       
 *       Only available in development environment. Requires confirmation token.
 *       This operation is irreversible and will delete all users, books, borrows, reviews, etc.
 *     tags: [Database Seeding]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               confirmationToken:
 *                 type: string
 *                 description: Must be exactly "RESET_DATABASE_CONFIRM"
 *                 example: RESET_DATABASE_CONFIRM
 *             required:
 *               - confirmationToken
 *     responses:
 *       200:
 *         description: Database reset completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Database reset completed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCounts:
 *                       type: object
 *                       properties:
 *                         users:
 *                           type: integer
 *                           example: 5
 *                         books:
 *                           type: integer
 *                           example: 10
 *                         categories:
 *                           type: integer
 *                           example: 8
 *                     warning:
 *                       type: string
 *                       example: All data has been permanently deleted
 *       400:
 *         description: Invalid confirmation token or environment error
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/reset', seedingRateLimit, seedController.resetDatabase);

module.exports = router;
