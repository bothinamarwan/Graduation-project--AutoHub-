
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const passport = require('./config/passport');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const apiResponse = require('./utils/apiResponse');

const authRoutes = require('./routes/Auth.routes');
const userRoutes = require('./routes/user.routes');
const dealerRoutes = require('./routes/dealer.routes');
const postRoutes = require('./routes/post.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const aiRoutes = require('./routes/ai.routes');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();
connectDB();

// ── Security ──────────────────────────────────────────────────────────────────
// Trust the first proxy (Railway) so rate limiting and IPs work correctly
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, max: 100,
  validate: { xForwardedForHeader: false, trustProxy: false, default: false },
  message: { success: false, message: 'Too many requests, try again later.' },
}));

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, max: 10,
  validate: { xForwardedForHeader: false, trustProxy: false, default: false },
  message: { success: false, message: 'AI rate limit reached. Wait a moment.' },
});

// ── Sessions ──────────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 7 * 24 * 60 * 60,
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

// ── Passport ──────────────────────────────────────────────────────────────────
app.use(passport.initialize());

// ── Body & static ─────────────────────────────────────────────────────────────
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Attach res.success / res.fail / res.created to every response ─────────────
app.use(apiResponse);

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dealers', dealerRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the status of the API
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: API is running successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     env:
 *                       type: string
 */
app.get('/api/health', (req, res) =>
  res.success({ env: process.env.NODE_ENV }, 'Automotive API is running 🚗')
);

app.use((req, res) =>
  res.fail(`Route ${req.originalUrl} not found.`, 404)
);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚗  Automotive Backend on port ${PORT}`);
  console.log(`🔗  http://localhost:${PORT}/api/health\n`);
});

module.exports = app;