const io = require('socket.io')(server, {
  cors: { origin: '*' }
});

const connectedUsers = new Map(); // userId -> socket.id

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Client sends their userId after connecting
  socket.on('register', (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`Registered user ${userId} to socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    for (const [userId, sockId] of connectedUsers.entries()) {
      if (sockId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

app.use((req, res, next) => {
  req.io = io;
  req.connectedUsers = connectedUsers;
  next();
});
