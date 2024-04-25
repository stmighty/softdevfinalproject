const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const { xss } = require("express-xss-sanitizer");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");

//Load env vars
dotenv.config({ path: "./config/config.env" });

//connect to DB
connectDB();

//Route files
const restaurants = require("./routes/restaurants");
const appointments = require("./routes/appointments");
const auth = require("./routes/auth");
const { payAppointment } = require("./controllers/appointments");
const app = express();
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10mins
  max: 100,
});

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Library API",
      version: "1.0.0",
      description: "A simple Express VacQ API",
    },
    servers: [
      {
        url: "http://localhost:5050/api/v1",
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

// Define specific raw parsing middleware for Stripe webhook route
const rawBodyBuffer = express.raw({ type: "application/json" });
app.post("/api/v1/appointments/pay", rawBodyBuffer, payAppointment);

// Apply body parser middleware after the Stripe webhook
app.use(express.json());

// Sanitize data
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
app.use(limiter);

// Parameter pollution prevention
app.use(hpp());

//Mount routers
app.use("/api/v1/restaurants", restaurants);
app.use("/api/v1/appointments", appointments);
app.use("/api/v1/auth", auth);
app.use(cookieParser());

// Catch-all 404 handler for unmatched routes
app.use((req, res, next) => {
  res.status(404).send("Sorry, can't find that!");
});

const PORT = process.env.PORT || 5050;
const server = app.listen(
  PORT,
  console.log(
    "Server running in ",
    process.env.NODE_ENV,
    " mode on port ",
    PORT
  )
);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit
  server.close(() => process.exit(1));
});
