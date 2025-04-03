const express = require('express');
const session = require('express-session');
const passport = require('./config/passport');
const connectDB = require('./config/database');
const routes = require('./routes/index');
const cors = require('cors');
// Import the progress routes
const progressRoutes = require('./routes/progressRoutes');
const app = express();
const port = 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: 'http://localhost:19000', // React Native app URL
    credentials: true,
  })
);
app.use(
  session({
    secret: 'this is our little secret.',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/', routes);
// Add the progress routes
app.use('/api/progress', progressRoutes);
// Start the Server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
