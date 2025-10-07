// Backend API Server for MongoDB Authentication
import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['VITE_MONGODB_URI', 'VITE_MONGODB_DATABASE', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Environment variables (no fallback credentials for security)
const MONGODB_URI = process.env.VITE_MONGODB_URI;
const MONGODB_DATABASE = process.env.VITE_MONGODB_DATABASE;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const PORT = process.env.PORT || 3001;

const app = express();
let db;
let mongoClient;

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      error: 'Authorization token required' 
    });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Token verification error:', error);
    return res.status(401).json({ 
      success: false,
      error: 'Invalid or expired token' 
    });
  }
}

// Rate limiting middleware
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // More lenient for development
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased from 100 to 500 requests per windowMs for general endpoints
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Input validation middleware
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Validation error handler
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
}

// CORS deve ser configurado ANTES de outros middlewares para evitar conflitos
// CORS Configuration with environment-based origins
const corsOrigins = process.env.NODE_ENV === 'production' 
  ? [
      'https://planing-ita.com',
      'https://www.planing-ita.com',
      process.env.CORS_ORIGIN || 'https://planing-ita.com'
    ].filter(Boolean)
  : [
      'http://localhost:8080', 
      'http://localhost:3000', 
      'http://127.0.0.1:8080',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ];

console.log(`🌐 CORS configured for origins:`, corsOrigins);

// Middleware adicional para OPTIONS requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // Cache preflight por 24 horas
  res.sendStatus(200);
});

// Middleware - Configuração completa para resolver problemas de preflight
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in our allowed list
    if (corsOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 200, // Para suportar navegadores legados
  preflightContinue: false // Finaliza o preflight aqui
}));

// Security middleware (aplicado APÓS CORS para evitar conflitos)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Apply general rate limiting to all requests
app.use(generalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    if (!mongoClient) {
      mongoClient = new MongoClient(MONGODB_URI);
      await mongoClient.connect();
      db = mongoClient.db(MONGODB_DATABASE);
      console.log('✅ Connected to MongoDB Atlas');
    }
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Authentication Routes

// Register endpoint
app.post('/api/auth/register', authLimiter, validateRegistration, handleValidationErrors, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Connect to database
    const database = await connectToMongoDB();
    
    // Check if user already exists
    const existingUser = await database.collection('users').findOne({ 
      email: email.toLowerCase().trim() 
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        error: 'User already exists with this email' 
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = {
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name || email.split('@')[0],
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert user into database
    const result = await database.collection('users').insertOne(newUser);

    // Create JWT payload
    const payload = {
      id: result.insertedId.toString(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role
    };

    // Generate JWT token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Create session
    const session = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user: payload,
      token: token,
      expires_at: new Date(Date.now() + (JWT_EXPIRES_IN === '400d' ? 400 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)).toISOString()
    };

    console.log('✅ User registered successfully:', email);
    res.status(201).json({ 
      success: true,
      message: 'User registered successfully',
      user: payload, 
      session: session,
      token: token
    });
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Login endpoint (renamed from signin for consistency)
app.post('/api/auth/login', authLimiter, validateLogin, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Connect to database
    const database = await connectToMongoDB();
    
    // Find user in database
    const user = await database.collection('users').findOne({ 
      email: email.toLowerCase().trim() 
    });
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    // Update last login
    await database.collection('users').updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    // Create JWT payload
    const payload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name || user.email.split('@')[0],
      role: user.role || 'user'
    };

    // Generate JWT token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Create session with JWT
    const session = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user: payload,
      token: token,
      expires_at: new Date(Date.now() + (JWT_EXPIRES_IN === '400d' ? 400 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)).toISOString()
    };

    console.log('✅ User authenticated with JWT:', email);
    res.json({ 
      success: true,
      message: 'Login successful',
      user: session.user, 
      session: session,
      token: token
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', verifyToken, async (req, res) => {
  try {
    // In a JWT-based system, logout is primarily handled client-side
    // by removing the token from storage. However, we can log the event
    // and potentially implement token blacklisting if needed.
    
    const userId = req.user.id;
    const database = await connectToMongoDB();
    
    // Update last logout time
    await database.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { lastLogout: new Date() } }
    );

    console.log('✅ User logged out:', req.user.email);
    res.json({ 
      success: true,
      message: 'Logout successful' 
    });
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Legacy signin endpoint (for backward compatibility)
app.post('/api/signin', async (req, res) => {
  // Redirect to new login endpoint
  req.url = '/api/auth/login';
  return app._router.handle(req, res);
});

// Get user profile endpoint (protected with JWT)
app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    // User information is available in req.user from JWT token
    const userId = req.user.id;
    
    // Connect to database
    const database = await connectToMongoDB();
    
    // Get user from database
    const user = await database.collection('users').findOne({ _id: new ObjectId(userId) });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user profile (without password)
    const { password, ...userProfile } = user;
    res.json({ 
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name || user.email.split('@')[0],
        role: user.role || 'user'
      }
    });
    
  } catch (error) {
    console.error('❌ Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User validation middleware
const validateUser = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('full_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('role')
    .isIn(['admin', 'supervisor', 'operador'])
    .withMessage('Role must be one of: admin, supervisor, operador'),
  body('sector')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Sector must not exceed 50 characters'),
  body('shift')
    .optional()
    .isIn(['manha', 'tarde', 'noite', 'comercial'])
    .withMessage('Shift must be one of: manha, tarde, noite, comercial'),
];

// Users API Routes (Protected with JWT)

// Get all users
app.get('/api/users', verifyToken, async (req, res) => {
  try {
    const database = await connectToMongoDB();
    const users = await database.collection('users').find({}).toArray();
    
    // Convert MongoDB _id to id for frontend compatibility and remove passwords
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      user_id: user._id.toString(),
      full_name: user.full_name || user.name,
      email: user.email,
      role: user.role,
      sector: user.sector || '',
      shift: user.shift || '',
      status: user.active !== false ? 'active' : 'inactive',
      last_login: user.lastLogin || '',
      created_at: user.created_at || user.createdAt,
      updated_at: user.updated_at || user.updatedAt
    }));
    
    res.json({
      success: true,
      data: formattedUsers
    });
    
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// Create new user
app.post('/api/users', verifyToken, validateUser, handleValidationErrors, async (req, res) => {
  try {
    const { email, full_name, role, sector, shift } = req.body;
    
    // Check if user has admin privileges
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can create users'
      });
    }
    
    // Connect to database
    const database = await connectToMongoDB();
    
    // Check if user already exists
    const existingUser = await database.collection('users').findOne({ 
      email: email.toLowerCase().trim() 
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        error: 'User already exists with this email' 
      });
    }

    // Generate a temporary password (user should change it on first login)
    const tempPassword = Math.random().toString(36).slice(-8);
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

    // Create new user
    const newUser = {
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: full_name,
      full_name: full_name,
      role: role,
      sector: sector || '',
      shift: shift || '',
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: req.user.id
    };

    // Insert user into database
    const result = await database.collection('users').insertOne(newUser);

    // Return user data (without password)
    const userData = {
      id: result.insertedId.toString(),
      user_id: result.insertedId.toString(),
      full_name: newUser.full_name,
      email: newUser.email,
      role: newUser.role,
      sector: newUser.sector,
      shift: newUser.shift,
      status: 'active',
      last_login: '',
      created_at: newUser.created_at,
      updated_at: newUser.updated_at,
      temp_password: tempPassword // Only for initial setup
    };

    console.log('✅ User created successfully:', email);
    res.status(201).json({ 
      success: true,
      message: 'User created successfully',
      data: userData
    });
    
  } catch (error) {
    console.error('❌ User creation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Delete user
app.delete('/api/users/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user has admin privileges
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can delete users'
      });
    }
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }
    
    const database = await connectToMongoDB();
    
    // Check if user exists
    const user = await database.collection('users').findOne({ _id: new ObjectId(id) });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Prevent self-deletion
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }
    
    // Delete user
    await database.collection('users').deleteOne({ _id: new ObjectId(id) });
    
    console.log('✅ User deleted successfully:', user.email);
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
});

// Machine validation middleware
const validateMachine = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Machine name must be between 2 and 100 characters'),
  body('code')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Machine code must be between 2 and 20 characters')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Machine code must contain only uppercase letters, numbers, and hyphens'),
  body('model')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Machine model must not exceed 100 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Machine location must not exceed 100 characters'),
  body('status')
    .isIn(['ativa', 'inativa', 'manutenção'])
    .withMessage('Machine status must be one of: ativa, inativa, manutenção'),
];

// Machines API Routes (Protected with JWT)

// Get all machines
app.get('/api/machines', verifyToken, async (req, res) => {
  try {
    const database = await connectToMongoDB();
    const machines = await database.collection('machines').find({}).toArray();
    
    // Convert MongoDB _id to id for frontend compatibility
    const formattedMachines = machines.map(machine => ({
      ...machine,
      id: machine._id.toString(),
      _id: undefined
    }));
    
    res.json({
      success: true,
      data: formattedMachines
    });
    
  } catch (error) {
    console.error('❌ Error fetching machines:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch machines'
    });
  }
});

// Get machine by ID
app.get('/api/machines/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid machine ID'
      });
    }
    
    const database = await connectToMongoDB();
    const machine = await database.collection('machines').findOne({ _id: new ObjectId(id) });
    
    if (!machine) {
      return res.status(404).json({
        success: false,
        error: 'Machine not found'
      });
    }
    
    // Convert MongoDB _id to id for frontend compatibility
    const formattedMachine = {
      ...machine,
      id: machine._id.toString(),
      _id: undefined
    };
    
    res.json({
      success: true,
      data: formattedMachine
    });
    
  } catch (error) {
    console.error('❌ Error fetching machine:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch machine'
    });
  }
});

// Create new machine
app.post('/api/machines', verifyToken, validateMachine, handleValidationErrors, async (req, res) => {
  try {
    const { name, code, model, location, status } = req.body;
    const database = await connectToMongoDB();
    
    // Check if machine code already exists
    const existingMachine = await database.collection('machines').findOne({ code: code.toUpperCase() });
    if (existingMachine) {
      return res.status(409).json({
        success: false,
        error: 'Machine code already exists'
      });
    }
    
    // Create new machine
    const newMachine = {
      name: name.trim(),
      code: code.toUpperCase().trim(),
      model: model?.trim() || null,
      location: location?.trim() || null,
      status: status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: req.user.id
    };
    
    const result = await database.collection('machines').insertOne(newMachine);
    
    // Return created machine with formatted ID
    const createdMachine = {
      ...newMachine,
      id: result.insertedId.toString(),
      _id: undefined
    };
    
    console.log('✅ Machine created:', createdMachine.name);
    res.status(201).json({
      success: true,
      data: createdMachine,
      message: 'Machine created successfully'
    });
    
  } catch (error) {
    console.error('❌ Error creating machine:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create machine'
    });
  }
});

// Update machine
app.put('/api/machines/:id', verifyToken, validateMachine, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, model, location, status } = req.body;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid machine ID'
      });
    }
    
    const database = await connectToMongoDB();
    
    // Check if machine exists
    const existingMachine = await database.collection('machines').findOne({ _id: new ObjectId(id) });
    if (!existingMachine) {
      return res.status(404).json({
        success: false,
        error: 'Machine not found'
      });
    }
    
    // Check if code is being changed and if new code already exists
    if (code.toUpperCase() !== existingMachine.code) {
      const codeExists = await database.collection('machines').findOne({ 
        code: code.toUpperCase(),
        _id: { $ne: new ObjectId(id) }
      });
      if (codeExists) {
        return res.status(409).json({
          success: false,
          error: 'Machine code already exists'
        });
      }
    }
    
    // Update machine
    const updateData = {
      name: name.trim(),
      code: code.toUpperCase().trim(),
      model: model?.trim() || null,
      location: location?.trim() || null,
      status: status,
      updated_at: new Date().toISOString(),
      updated_by: req.user.id
    };
    
    const result = await database.collection('machines').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Machine not found'
      });
    }
    
    // Get updated machine
    const updatedMachine = await database.collection('machines').findOne({ _id: new ObjectId(id) });
    
    // Format response
    const formattedMachine = {
      ...updatedMachine,
      id: updatedMachine._id.toString(),
      _id: undefined
    };
    
    console.log('✅ Machine updated:', formattedMachine.name);
    res.json({
      success: true,
      data: formattedMachine,
      message: 'Machine updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating machine:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update machine'
    });
  }
});

// Delete machine
app.delete('/api/machines/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid machine ID'
      });
    }
    
    const database = await connectToMongoDB();
    
    // Check if machine exists
    const existingMachine = await database.collection('machines').findOne({ _id: new ObjectId(id) });
    if (!existingMachine) {
      return res.status(404).json({
        success: false,
        error: 'Machine not found'
      });
    }
    
    // Check if machine has production records (prevent deletion if it does)
    const productionRecords = await database.collection('production_records').findOne({ machine_id: id });
    if (productionRecords) {
      return res.status(409).json({
        success: false,
        error: 'Cannot delete machine with existing production records'
      });
    }
    
    // Check if machine has production orders
    const productionOrders = await database.collection('production_orders').findOne({ machine_id: id });
    if (productionOrders) {
      return res.status(409).json({
        success: false,
        error: 'Cannot delete machine with existing production orders'
      });
    }
    
    // Delete machine
    const result = await database.collection('machines').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Machine not found'
      });
    }
    
    console.log('✅ Machine deleted:', existingMachine.name);
    res.json({
      success: true,
      message: 'Machine deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting machine:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete machine'
    });
  }
});

// Get machines by status
app.get('/api/machines/status/:status', verifyToken, async (req, res) => {
  try {
    const { status } = req.params;
    
    if (!['ativa', 'inativa', 'manutenção'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: ativa, inativa, manutenção'
      });
    }
    
    const database = await connectToMongoDB();
    const machines = await database.collection('machines').find({ status }).toArray();
    
    // Convert MongoDB _id to id for frontend compatibility
    const formattedMachines = machines.map(machine => ({
      ...machine,
      id: machine._id.toString(),
      _id: undefined
    }));
    
    res.json({
      success: true,
      data: formattedMachines
    });
    
  } catch (error) {
    console.error('❌ Error fetching machines by status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch machines by status'
    });
  }
});

// Search machines
app.get('/api/machines/search/:query', verifyToken, async (req, res) => {
  try {
    const { query } = req.params;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      });
    }
    
    const database = await connectToMongoDB();
    const searchRegex = new RegExp(query.trim(), 'i');
    
    const machines = await database.collection('machines').find({
      $or: [
        { name: searchRegex },
        { code: searchRegex },
        { model: searchRegex },
        { location: searchRegex }
      ]
    }).toArray();
    
    // Convert MongoDB _id to id for frontend compatibility
    const formattedMachines = machines.map(machine => ({
      ...machine,
      id: machine._id.toString(),
      _id: undefined
    }));
    
    res.json({
      success: true,
      data: formattedMachines
    });
    
  } catch (error) {
    console.error('❌ Error searching machines:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search machines'
    });
  }
});

// Start server
// Production Orders validation
const validateProductionOrder = [
  body('code')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Order code must be between 2 and 50 characters'),
  body('product_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('machine_id')
    .trim()
    .notEmpty()
    .withMessage('Machine ID is required'),
  body('planned_quantity')
    .isInt({ min: 1 })
    .withMessage('Planned quantity must be a positive integer'),
  body('pallet_quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Pallet quantity must be a non-negative integer'),
  body('shift')
    .isIn(['morning', 'afternoon', 'night'])
    .withMessage('Shift must be one of: morning, afternoon, night'),
  body('status')
    .isIn(['pending', 'in_progress', 'completed', 'cancelled', 'running'])
    .withMessage('Status must be one of: pending, in_progress, completed, cancelled, running'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
];

// Validation for partial updates (PUT requests)
const validateProductionOrderUpdate = [
  body('code')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Order code must be between 2 and 50 characters'),
  body('product_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('machine_id')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Machine ID cannot be empty'),
  body('planned_quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Planned quantity must be a positive integer'),
  body('pallet_quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Pallet quantity must be a non-negative integer'),
  body('shift')
    .optional()
    .isIn(['morning', 'afternoon', 'night'])
    .withMessage('Shift must be one of: morning, afternoon, night'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'cancelled', 'running'])
    .withMessage('Status must be one of: pending, in_progress, completed, cancelled, running'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
];

// Get all production orders
app.get('/api/production-orders', verifyToken, async (req, res) => {
  try {
    const orders = await db.collection('production_orders').find({}).toArray();
    
    // Convert MongoDB _id to id for frontend compatibility
    const formattedOrders = orders.map(order => ({
      ...order,
      id: order._id.toString(),
      _id: undefined
    }));
    
    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('Error fetching production orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch production orders'
    });
  }
});

// Get production order by ID
app.get('/api/production-orders/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID format'
      });
    }
    
    const order = await db.collection('production_orders').findOne({ _id: new ObjectId(id) });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Production order not found'
      });
    }
    
    // Convert MongoDB _id to id for frontend compatibility
    const formattedOrder = {
      ...order,
      id: order._id.toString(),
      _id: undefined
    };
    
    res.json({
      success: true,
      data: formattedOrder
    });
  } catch (error) {
    console.error('Error fetching production order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch production order'
    });
  }
});

// Create new production order
app.post('/api/production-orders', verifyToken, validateProductionOrder, handleValidationErrors, async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const result = await db.collection('production_orders').insertOne(orderData);
    
    if (!result.insertedId) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create production order'
      });
    }
    
    // Fetch the created order to return it
    const createdOrder = await db.collection('production_orders').findOne({ _id: result.insertedId });
    
    // Convert MongoDB _id to id for frontend compatibility
    const formattedOrder = {
      ...createdOrder,
      id: createdOrder._id.toString(),
      _id: undefined
    };
    
    res.status(201).json({
      success: true,
      message: 'Production order created successfully',
      data: formattedOrder
    });
  } catch (error) {
    console.error('Error creating production order:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Production order with this code already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create production order'
    });
  }
});

// Update production order
app.put('/api/production-orders/:id', verifyToken, validateProductionOrderUpdate, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID format'
      });
    }
    
    const updateData = {
      ...req.body,
      updated_at: new Date()
    };
    
    const result = await db.collection('production_orders').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Production order not found'
      });
    }
    
    // Fetch the updated order to return it
    const updatedOrder = await db.collection('production_orders').findOne({ _id: new ObjectId(id) });
    
    // Convert MongoDB _id to id for frontend compatibility
    const formattedOrder = {
      ...updatedOrder,
      id: updatedOrder._id.toString(),
      _id: undefined
    };
    
    res.json({
      success: true,
      message: 'Production order updated successfully',
      data: formattedOrder
    });
  } catch (error) {
    console.error('Error updating production order:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Production order with this code already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update production order'
    });
  }
});

// Delete production order
app.delete('/api/production-orders/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID format'
      });
    }
    
    const result = await db.collection('production_orders').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Production order not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Production order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting production order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete production order'
    });
  }
});

// Get production orders by machine
app.get('/api/production-orders/machine/:machineId', verifyToken, async (req, res) => {
  try {
    const { machineId } = req.params;
    
    const orders = await db.collection('production_orders').find({ machine_id: machineId }).toArray();
    
    // Convert MongoDB _id to id for frontend compatibility
    const formattedOrders = orders.map(order => ({
      ...order,
      id: order._id.toString(),
      _id: undefined
    }));
    
    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('Error fetching production orders by machine:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch production orders by machine'
    });
  }
});

// Get production orders by status
app.get('/api/production-orders/status/:status', verifyToken, async (req, res) => {
  try {
    const { status } = req.params;
    
    const orders = await db.collection('production_orders').find({ status }).toArray();
    
    // Convert MongoDB _id to id for frontend compatibility
    const formattedOrders = orders.map(order => ({
      ...order,
      id: order._id.toString(),
      _id: undefined
    }));
    
    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('Error fetching production orders by status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch production orders by status'
    });
  }
});

// Get production orders by shift
app.get('/api/production-orders/shift/:shift', verifyToken, async (req, res) => {
  try {
    const { shift } = req.params;
    
    const orders = await db.collection('production_orders').find({ shift }).toArray();
    
    // Convert MongoDB _id to id for frontend compatibility
    const formattedOrders = orders.map(order => ({
      ...order,
      id: order._id.toString(),
      _id: undefined
    }));
    
    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('Error fetching production orders by shift:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch production orders by shift'
    });
  }
});

// Get production orders by date
app.get('/api/production-orders/date/:date', verifyToken, async (req, res) => {
  try {
    const { date } = req.params;
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD format'
      });
    }
    
    const orders = await db.collection('production_orders').find({ production_date: date }).toArray();
    
    // Convert MongoDB _id to id for frontend compatibility
    const formattedOrders = orders.map(order => ({
      ...order,
      id: order._id.toString(),
      _id: undefined
    }));
    
    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('Error fetching production orders by date:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch production orders by date'
    });
  }
});

// Search production orders
app.get('/api/production-orders/search/:query', verifyToken, async (req, res) => {
  try {
    const { query } = req.params;
    
    const orders = await db.collection('production_orders').find({
      $or: [
        { code: { $regex: query, $options: 'i' } },
        { product_name: { $regex: query, $options: 'i' } },
        { machine_id: { $regex: query, $options: 'i' } }
      ]
    }).toArray();
    
    // Convert MongoDB _id to id for frontend compatibility
    const formattedOrders = orders.map(order => ({
      ...order,
      id: order._id.toString(),
      _id: undefined
    }));
    
    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('Error searching production orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search production orders'
    });
  }
});

// Production Records API Endpoints

// Validation for production records
const validateProductionRecord = [
  body('order_id')
    .trim()
    .notEmpty()
    .withMessage('Order ID is required'),
  body('operator_id')
    .optional()
    .trim(),
  body('machine_id')
    .optional()
    .trim(),
  body('produced_quantity')
    .isInt({ min: 0 })
    .withMessage('Produced quantity must be a non-negative integer'),
  body('reject_quantity')
    .isInt({ min: 0 })
    .withMessage('Reject quantity must be a non-negative integer'),
  body('downtime_minutes')
    .isInt({ min: 0 })
    .withMessage('Downtime minutes must be a non-negative integer'),
  body('recorded_at')
    .optional()
    .isISO8601()
    .withMessage('Recorded at must be a valid ISO 8601 date'),
  body('downtime_type_id')
    .optional()
    .trim(),
  body('downtime_start_time')
    .optional()
    .isISO8601()
    .withMessage('Downtime start time must be a valid ISO 8601 date'),
  body('downtime_end_time')
    .optional()
    .isISO8601()
    .withMessage('Downtime end time must be a valid ISO 8601 date'),
  body('downtime_description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Downtime description must not exceed 500 characters'),
];

// Get all production records
app.get('/api/production-records', verifyToken, async (req, res) => {
  try {
    const { order_id } = req.query;
    
    let query = {};
    if (order_id) {
      query.order_id = order_id;
    }
    
    const records = await db.collection('production_records')
      .find(query)
      .sort({ recorded_at: -1 })
      .toArray();
    
    // Convert MongoDB _id to id for frontend compatibility
    const formattedRecords = records.map(record => ({
      ...record,
      id: record._id.toString(),
      _id: undefined
    }));
    
    res.json({
      success: true,
      data: formattedRecords
    });
  } catch (error) {
    console.error('Error fetching production records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch production records'
    });
  }
});

// Get production record by ID
app.get('/api/production-records/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid record ID format'
      });
    }
    
    const record = await db.collection('production_records').findOne({ _id: new ObjectId(id) });
    
    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Production record not found'
      });
    }
    
    // Convert MongoDB _id to id for frontend compatibility
    const formattedRecord = {
      ...record,
      id: record._id.toString(),
      _id: undefined
    };
    
    res.json({
      success: true,
      data: formattedRecord
    });
  } catch (error) {
    console.error('Error fetching production record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch production record'
    });
  }
});

// Create new production record
app.post('/api/production-records', verifyToken, validateProductionRecord, handleValidationErrors, async (req, res) => {
  try {
    const recordData = {
      ...req.body,
      recorded_at: req.body.recorded_at ? new Date(req.body.recorded_at) : new Date(),
      created_at: new Date(),
      downtime_start_time: req.body.downtime_start_time ? new Date(req.body.downtime_start_time) : null,
      downtime_end_time: req.body.downtime_end_time ? new Date(req.body.downtime_end_time) : null,
    };
    
    // Calculate efficiency and production metrics if this is a production record
    if (recordData.produced_quantity > 0) {
      // Get the latest record for this order to calculate metrics
      const latestRecord = await db.collection('production_records')
        .findOne(
          { 
            order_id: recordData.order_id,
            produced_quantity: { $gt: 0 }
          },
          { sort: { recorded_at: -1 } }
        );
      
      if (latestRecord) {
        const timeDiff = recordData.recorded_at.getTime() - new Date(latestRecord.recorded_at).getTime();
        const timeElapsedMinutes = Math.round(timeDiff / (1000 * 60));
        
        if (timeElapsedMinutes > 0) {
          recordData.time_elapsed_minutes = timeElapsedMinutes;
          recordData.production_rate_per_minute = recordData.produced_quantity / timeElapsedMinutes;
          recordData.cycle_time_minutes = timeElapsedMinutes / recordData.produced_quantity;
          
          // Calculate efficiency (assuming 100% efficiency is 1 unit per minute)
          recordData.efficiency_percentage = Math.min(100, (recordData.production_rate_per_minute * 100));
        }
        
        recordData.previous_record_id = latestRecord._id.toString();
      }
    }
    
    const result = await db.collection('production_records').insertOne(recordData);
    
    if (!result.insertedId) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create production record'
      });
    }
    
    // Fetch the created record to return it
    const createdRecord = await db.collection('production_records').findOne({ _id: result.insertedId });
    
    // Convert MongoDB _id to id for frontend compatibility
    const formattedRecord = {
      ...createdRecord,
      id: createdRecord._id.toString(),
      _id: undefined
    };
    
    res.status(201).json({
      success: true,
      message: 'Production record created successfully',
      data: formattedRecord
    });
  } catch (error) {
    console.error('Error creating production record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create production record'
    });
  }
});

// Update production record
app.put('/api/production-records/:id', verifyToken, validateProductionRecord, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid record ID format'
      });
    }
    
    const updateData = {
      ...req.body,
      recorded_at: req.body.recorded_at ? new Date(req.body.recorded_at) : undefined,
      downtime_start_time: req.body.downtime_start_time ? new Date(req.body.downtime_start_time) : undefined,
      downtime_end_time: req.body.downtime_end_time ? new Date(req.body.downtime_end_time) : undefined,
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    const result = await db.collection('production_records').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Production record not found'
      });
    }
    
    // Fetch the updated record to return it
    const updatedRecord = await db.collection('production_records').findOne({ _id: new ObjectId(id) });
    
    // Convert MongoDB _id to id for frontend compatibility
    const formattedRecord = {
      ...updatedRecord,
      id: updatedRecord._id.toString(),
      _id: undefined
    };
    
    res.json({
      success: true,
      message: 'Production record updated successfully',
      data: formattedRecord
    });
  } catch (error) {
    console.error('Error updating production record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update production record'
    });
  }
});

// Delete production record
app.delete('/api/production-records/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid record ID format'
      });
    }
    
    const result = await db.collection('production_records').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Production record not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Production record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting production record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete production record'
    });
  }
});

// Get production records by order ID
app.get('/api/production-records/order/:orderId', verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const records = await db.collection('production_records')
      .find({ order_id: orderId })
      .sort({ recorded_at: -1 })
      .toArray();
    
    // Convert MongoDB _id to id for frontend compatibility
    const formattedRecords = records.map(record => ({
      ...record,
      id: record._id.toString(),
      _id: undefined
    }));
    
    res.json({
      success: true,
      data: formattedRecords
    });
  } catch (error) {
    console.error('Error fetching production records by order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch production records by order'
    });
  }
});

// Get production records by machine ID
app.get('/api/production-records/machine/:machineId', verifyToken, async (req, res) => {
  try {
    const { machineId } = req.params;
    
    const records = await db.collection('production_records')
      .find({ machine_id: machineId })
      .sort({ recorded_at: -1 })
      .toArray();
    
    // Convert MongoDB _id to id for frontend compatibility
    const formattedRecords = records.map(record => ({
      ...record,
      id: record._id.toString(),
      _id: undefined
    }));
    
    res.json({
      success: true,
      data: formattedRecords
    });
  } catch (error) {
    console.error('Error fetching production records by machine:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch production records by machine'
    });
  }
});

// Clear all production records (for testing/cleanup)
app.delete('/api/production-records', verifyToken, async (req, res) => {
  try {
    // First, archive all records to history collection
    const recordsToArchive = await db.collection('production_records').find({}).toArray();
    
    if (recordsToArchive.length > 0) {
      const historyRecords = recordsToArchive.map(record => ({
        ...record,
        _id: undefined, // Let MongoDB generate new IDs
        original_id: record._id.toString(),
        archived_at: new Date(),
        archived_reason: 'manual_cleanup'
      }));
      
      await db.collection('production_history').insertMany(historyRecords);
    }
    
    // Clear all production records
    const result = await db.collection('production_records').deleteMany({});
    
    res.json({
      success: true,
      message: `${result.deletedCount} production records cleared and archived`
    });
  } catch (error) {
    console.error('Error clearing production records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear production records'
    });
  }
});

// ===== MATERIAL LOSSES ENDPOINTS =====

// Validation for loss types
const validateLossType = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Loss type name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category must not exceed 50 characters'),
];

// Validation for material losses
const validateMaterialLoss = [
  body('loss_type_id')
    .trim()
    .notEmpty()
    .withMessage('Loss type ID is required'),
  body('quantity')
    .isFloat({ min: 0 })
    .withMessage('Quantity must be a non-negative number'),
  body('unit')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Unit must be between 1 and 10 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('machine_id')
    .optional()
    .trim(),
  body('operator_id')
    .optional()
    .trim(),
  body('order_id')
    .optional()
    .trim(),
  body('recorded_at')
    .optional()
    .isISO8601()
    .withMessage('Recorded at must be a valid ISO 8601 date'),
];

// Loss Types Endpoints
// GET /api/loss-types - Get all loss types
app.get('/api/loss-types', verifyToken, async (req, res) => {
  try {
    const lossTypes = await db.collection('loss_types').find({}).toArray();
    res.json({
      success: true,
      data: lossTypes
    });
  } catch (error) {
    console.error('Error fetching loss types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch loss types'
    });
  }
});

// GET /api/loss-types/:id - Get specific loss type
app.get('/api/loss-types/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid loss type ID format'
      });
    }

    const lossType = await db.collection('loss_types').findOne({ _id: new ObjectId(id) });
    
    if (!lossType) {
      return res.status(404).json({
        success: false,
        error: 'Loss type not found'
      });
    }

    res.json({
      success: true,
      data: lossType
    });
  } catch (error) {
    console.error('Error fetching loss type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch loss type'
    });
  }
});

// POST /api/loss-types - Create new loss type
app.post('/api/loss-types', verifyToken, validateLossType, handleValidationErrors, async (req, res) => {
  try {
    const { name, description, category } = req.body;

    // Check if loss type with same name already exists
    const existingLossType = await db.collection('loss_types').findOne({ name });
    if (existingLossType) {
      return res.status(409).json({
        success: false,
        error: 'Loss type with this name already exists'
      });
    }

    const newLossType = {
      name,
      description: description || null,
      category: category || null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await db.collection('loss_types').insertOne(newLossType);
    
    res.status(201).json({
      success: true,
      data: {
        _id: result.insertedId,
        ...newLossType
      }
    });
  } catch (error) {
    console.error('Error creating loss type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create loss type'
    });
  }
});

// PUT /api/loss-types/:id - Update loss type
app.put('/api/loss-types/:id', verifyToken, validateLossType, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid loss type ID format'
      });
    }

    // Check if loss type exists
    const existingLossType = await db.collection('loss_types').findOne({ _id: new ObjectId(id) });
    if (!existingLossType) {
      return res.status(404).json({
        success: false,
        error: 'Loss type not found'
      });
    }

    // Check if another loss type with same name exists (excluding current one)
    const duplicateLossType = await db.collection('loss_types').findOne({ 
      name, 
      _id: { $ne: new ObjectId(id) } 
    });
    if (duplicateLossType) {
      return res.status(409).json({
        success: false,
        error: 'Loss type with this name already exists'
      });
    }

    const updateData = {
      name,
      description: description || null,
      category: category || null,
      updated_at: new Date()
    };

    const result = await db.collection('loss_types').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Loss type not found'
      });
    }

    const updatedLossType = await db.collection('loss_types').findOne({ _id: new ObjectId(id) });
    
    res.json({
      success: true,
      data: updatedLossType
    });
  } catch (error) {
    console.error('Error updating loss type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update loss type'
    });
  }
});

// DELETE /api/loss-types/:id - Delete loss type
app.delete('/api/loss-types/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid loss type ID format'
      });
    }

    // Check if loss type exists
    const existingLossType = await db.collection('loss_types').findOne({ _id: new ObjectId(id) });
    if (!existingLossType) {
      return res.status(404).json({
        success: false,
        error: 'Loss type not found'
      });
    }

    // Check if there are material losses using this loss type
    const relatedLosses = await db.collection('material_losses').findOne({ loss_type_id: id });
    if (relatedLosses) {
      return res.status(409).json({
        success: false,
        error: 'Cannot delete loss type that has associated material losses'
      });
    }

    const result = await db.collection('loss_types').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Loss type not found'
      });
    }

    res.json({
      success: true,
      message: 'Loss type deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting loss type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete loss type'
    });
  }
});

// Material Losses Endpoints
// GET /api/material-losses - Get all material losses with pagination and filters
app.get('/api/material-losses', verifyToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      loss_type_id, 
      machine_id, 
      operator_id, 
      order_id,
      start_date,
      end_date 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    // Add filters
    if (loss_type_id) query.loss_type_id = loss_type_id;
    if (machine_id) query.machine_id = machine_id;
    if (operator_id) query.operator_id = operator_id;
    if (order_id) query.order_id = order_id;

    // Date range filter
    if (start_date || end_date) {
      query.recorded_at = {};
      if (start_date) query.recorded_at.$gte = new Date(start_date);
      if (end_date) query.recorded_at.$lte = new Date(end_date);
    }

    const [materialLosses, total] = await Promise.all([
      db.collection('material_losses')
        .aggregate([
          { $match: query },
          {
            $lookup: {
              from: 'loss_types',
              localField: 'loss_type_id',
              foreignField: '_id',
              as: 'loss_type',
              pipeline: [{ $project: { name: 1, category: 1 } }]
            }
          },
          { $unwind: { path: '$loss_type', preserveNullAndEmptyArrays: true } },
          { $sort: { recorded_at: -1 } },
          { $skip: skip },
          { $limit: parseInt(limit) }
        ])
        .toArray(),
      db.collection('material_losses').countDocuments(query)
    ]);

    res.json({
      success: true,
      data: materialLosses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching material losses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch material losses'
    });
  }
});

// GET /api/material-losses/:id - Get specific material loss
app.get('/api/material-losses/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid material loss ID format'
      });
    }

    const materialLoss = await db.collection('material_losses')
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: 'loss_types',
            localField: 'loss_type_id',
            foreignField: '_id',
            as: 'loss_type'
          }
        },
        { $unwind: { path: '$loss_type', preserveNullAndEmptyArrays: true } }
      ])
      .toArray();
    
    if (!materialLoss || materialLoss.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Material loss not found'
      });
    }

    res.json({
      success: true,
      data: materialLoss[0]
    });
  } catch (error) {
    console.error('Error fetching material loss:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch material loss'
    });
  }
});

// POST /api/material-losses - Create new material loss
app.post('/api/material-losses', verifyToken, validateMaterialLoss, handleValidationErrors, async (req, res) => {
  try {
    const { 
      loss_type_id, 
      quantity, 
      unit, 
      description, 
      machine_id, 
      operator_id, 
      order_id,
      recorded_at 
    } = req.body;

    // Verify loss type exists
    if (ObjectId.isValid(loss_type_id)) {
      const lossType = await db.collection('loss_types').findOne({ _id: new ObjectId(loss_type_id) });
      if (!lossType) {
        return res.status(400).json({
          success: false,
          error: 'Invalid loss type ID'
        });
      }
    }

    const newMaterialLoss = {
      loss_type_id: ObjectId.isValid(loss_type_id) ? new ObjectId(loss_type_id) : loss_type_id,
      quantity: parseFloat(quantity),
      unit,
      description: description || null,
      machine_id: machine_id || null,
      operator_id: operator_id || null,
      order_id: order_id || null,
      recorded_at: recorded_at ? new Date(recorded_at) : new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await db.collection('material_losses').insertOne(newMaterialLoss);
    
    // Fetch the created loss with loss type info
    const createdLoss = await db.collection('material_losses')
      .aggregate([
        { $match: { _id: result.insertedId } },
        {
          $lookup: {
            from: 'loss_types',
            localField: 'loss_type_id',
            foreignField: '_id',
            as: 'loss_type'
          }
        },
        { $unwind: { path: '$loss_type', preserveNullAndEmptyArrays: true } }
      ])
      .toArray();
    
    res.status(201).json({
      success: true,
      data: createdLoss[0]
    });
  } catch (error) {
    console.error('Error creating material loss:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create material loss'
    });
  }
});

// PUT /api/material-losses/:id - Update material loss
app.put('/api/material-losses/:id', verifyToken, validateMaterialLoss, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      loss_type_id, 
      quantity, 
      unit, 
      description, 
      machine_id, 
      operator_id, 
      order_id,
      recorded_at 
    } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid material loss ID format'
      });
    }

    // Check if material loss exists
    const existingLoss = await db.collection('material_losses').findOne({ _id: new ObjectId(id) });
    if (!existingLoss) {
      return res.status(404).json({
        success: false,
        error: 'Material loss not found'
      });
    }

    // Verify loss type exists
    if (ObjectId.isValid(loss_type_id)) {
      const lossType = await db.collection('loss_types').findOne({ _id: new ObjectId(loss_type_id) });
      if (!lossType) {
        return res.status(400).json({
          success: false,
          error: 'Invalid loss type ID'
        });
      }
    }

    const updateData = {
      loss_type_id: ObjectId.isValid(loss_type_id) ? new ObjectId(loss_type_id) : loss_type_id,
      quantity: parseFloat(quantity),
      unit,
      description: description || null,
      machine_id: machine_id || null,
      operator_id: operator_id || null,
      order_id: order_id || null,
      recorded_at: recorded_at ? new Date(recorded_at) : existingLoss.recorded_at,
      updated_at: new Date()
    };

    const result = await db.collection('material_losses').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Material loss not found'
      });
    }

    // Fetch the updated loss with loss type info
    const updatedLoss = await db.collection('material_losses')
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: 'loss_types',
            localField: 'loss_type_id',
            foreignField: '_id',
            as: 'loss_type'
          }
        },
        { $unwind: { path: '$loss_type', preserveNullAndEmptyArrays: true } }
      ])
      .toArray();
    
    res.json({
      success: true,
      data: updatedLoss[0]
    });
  } catch (error) {
    console.error('Error updating material loss:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update material loss'
    });
  }
});

// DELETE /api/material-losses/:id - Delete material loss
app.delete('/api/material-losses/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid material loss ID format'
      });
    }

    const result = await db.collection('material_losses').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Material loss not found'
      });
    }

    res.json({
      success: true,
      message: 'Material loss deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting material loss:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete material loss'
    });
  }
});

// GET /api/material-losses/stats - Get material losses statistics
app.get('/api/material-losses/stats', verifyToken, async (req, res) => {
  try {
    const { start_date, end_date, loss_type_id, machine_id } = req.query;
    
    const matchQuery = {};
    
    // Date range filter
    if (start_date || end_date) {
      matchQuery.recorded_at = {};
      if (start_date) matchQuery.recorded_at.$gte = new Date(start_date);
      if (end_date) matchQuery.recorded_at.$lte = new Date(end_date);
    }
    
    if (loss_type_id) matchQuery.loss_type_id = ObjectId.isValid(loss_type_id) ? new ObjectId(loss_type_id) : loss_type_id;
    if (machine_id) matchQuery.machine_id = machine_id;

    const stats = await db.collection('material_losses').aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
          totalRecords: { $sum: 1 },
          avgQuantity: { $avg: '$quantity' },
          maxQuantity: { $max: '$quantity' },
          minQuantity: { $min: '$quantity' }
        }
      }
    ]).toArray();

    const byLossType = await db.collection('material_losses').aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'loss_types',
          localField: 'loss_type_id',
          foreignField: '_id',
          as: 'loss_type'
        }
      },
      { $unwind: { path: '$loss_type', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$loss_type_id',
          loss_type_name: { $first: '$loss_type.name' },
          totalQuantity: { $sum: '$quantity' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalQuantity: -1 } }
    ]).toArray();

    res.json({
      success: true,
      data: {
        overall: stats[0] || {
          totalQuantity: 0,
          totalRecords: 0,
          avgQuantity: 0,
          maxQuantity: 0,
          minQuantity: 0
        },
        byLossType
      }
    });
  } catch (error) {
    console.error('Error fetching material losses stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch material losses statistics'
    });
  }
});

async function startServer() {
  try {
    await connectToMongoDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down server...');
  if (mongoClient) {
    await mongoClient.close();
  }
  process.exit(0);
});

startServer();