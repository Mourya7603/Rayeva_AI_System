require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const categoryController = require('./controllers/categoryController');
const proposalController = require('./controllers/proposalController');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    "https://rayeva-ai-system-frontend.vercel.app",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.options('*', cors());
// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    logger.info('Connected to MongoDB');
}).catch(err => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
});

// ============= ROUTES - ORDER MATTERS! =============
// Put specific routes BEFORE parameterized routes

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        modules: ['category-tag-generator', 'b2b-proposal-generator']
    });
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        modules: ['category-tag-generator', 'b2b-proposal-generator']
    });
});

// MODULE 1: Category & Tag Generator routes
app.post('/api/products/generate-category', categoryController.generateCategory);
app.get('/api/prompt-logs', categoryController.getPromptLogs);
app.get('/api/products/:id', categoryController.getProduct);  // This comes AFTER specific routes

// MODULE 2: B2B Proposal Generator routes
app.post('/api/proposals/generate', proposalController.generateProposal);  // This must come BEFORE :id
app.get('/api/proposals', proposalController.listProposals);  // List all proposals
app.get('/api/proposals/:id', proposalController.getProposal);  // This comes LAST

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    console.log(`
    ╔════════════════════════════════════╗
    ║   🚀 Rayeva AI System              ║
    ║   Server running on port ${PORT}       ║
    ║   Environment: ${process.env.NODE_ENV}    ║
    ╚════════════════════════════════════╝
    `);
    console.log('📡 Endpoints available:');
    console.log('   GET  /health - Health check');
    console.log('   POST /api/products/generate-category - Module 1');
    console.log('   GET  /api/products/:id - Get product');
    console.log('   POST /api/proposals/generate - Module 2');
    console.log('   GET  /api/proposals - List all proposals');
    console.log('   GET  /api/proposals/:id - Get proposal');
    console.log('   GET  /api/prompt-logs - View AI logs');
});

module.exports = app;