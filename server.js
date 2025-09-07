const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const errorHandler = require("./middleware/errorHandler");
const securityHeaders = require("./middleware/securityHeaders");
const rateLimiter = require("./middleware/rateLimiter");
const supabase = require("./config/supabaseClient");
const logger = require("./utils/logger");

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require("./routes/auth/authRoutes");
const profileRoutes = require("./routes/users/profiles/profileRoutes");
const customerRoutes = require("./routes/users/customers/customerRoutes");
const shipperRoutes = require("./routes/users/shippers/shippersRoutes");
const adminRoutes = require("./routes/users/admins/adminRoutes");
const superAdminRoutes = require("./routes/users/superadmins/superadminRoutes");
const shipmentRoutes = require("./routes/shipments/shipmentRoutes");
const quotationRoutes = require("./routes/quotations/quotationRoutes");
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(securityHeaders); // Security headers
app.use(rateLimiter);     // Rate limiting
app.use(express.json());  // parse JSON request body
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")); // request logger

// ✅ Production-ready CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(origin => origin.trim())
  : process.env.NODE_ENV === "production" 
    ? [] // No default origins in production
    : ["http://localhost:3000", "http://localhost:5173"]; // default for local dev

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked origin', { origin });
      callback(new Error("Not allowed by CORS policy"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "X-Requested-With",
    "Accept",
    "Origin"
  ],
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/shippers", shipperRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/quotations", quotationRoutes);

// Root route (for testing server health)
app.get("/", (req, res) => {
  res.json({ 
    message: "DevPort Backend API is running 🚀",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint for monitoring
app.get("/health", async (req, res) => {
  try {
    // Test database connection
    const { data, error } = await supabase.from("profiles").select("id").limit(1);
    
    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
      services: {
        database: error ? "unhealthy" : "healthy",
        api: "healthy"
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB"
      }
    };

    const statusCode = error ? 503 : 200;
    res.status(statusCode).json(healthStatus);
  } catch (err) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: err.message,
      services: {
        database: "unhealthy",
        api: "healthy"
      }
    });
  }
});

// Error handler (must be last middleware)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info('Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    healthCheckUrl: `http://localhost:${PORT}/health`
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', null, {
    reason: reason?.message || reason,
    promise: promise?.toString()
  });
  process.exit(1);
});
