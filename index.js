const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
dotenv.config();

const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const connectDB = require('./config/connection');

// ── App ───────────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware (must come BEFORE routes) ──────────────────────────────────────
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }
  next();
});

// ── Entities (register Mongoose models) ──────────────────────────────────────
require('./entities/user');
require('./entities/admin');
require('./entities/registration');
require('./entities/payment');
require('./entities/course');
require('./entities/contactTicket');

// ── Routes ────────────────────────────────────────────────────────────────────
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const courseRoutes = require('./routes/courseRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const contactTicketRoutes = require('./routes/contactTicketRoutes');
const healthRoutes = require('./routes/healthRoutes');

app.use('/api/users', userRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/contact-tickets', contactTicketRoutes);
app.use('/api/health', healthRoutes);

// ── Swagger ───────────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// ── Root ──────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('iTbenuk Backend API is running...');
});

// ── Database + Start ──────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
  });
});
