const express = require('express');
const session = require('express-session');
const passport = require('passport'); // ✅ core passport
require('./config/passport');         // ✅ load custom config (no assignment)

const connectDB = require('./config/database');
const routes = require('./routes/index');
const progressRoutes = require('./routes/progressRoutes');
const followRoutes = require('./routes/followRoutes');
const cors = require('cors');

const app = express();
const port = 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ['http://localhost:19000', 'http://10.100.55.3:8081','http://localhost:8081'], // Your React Native app
    credentials: true,
  })
);
app.use(
  session({
    secret: 'this is our little secret.',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/', routes);
app.use('/api/progress', progressRoutes);
app.use('/api/follow', followRoutes);

const messageRoutes = require('./routes/messageRoutes');
app.use('/api/messages', messageRoutes);


// Start the Server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
