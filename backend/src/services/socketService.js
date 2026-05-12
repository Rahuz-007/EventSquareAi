const logger = require('../config/logger');

const setupSocketHandlers = (io) => {
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Authenticate socket
    socket.on('authenticate', (userId) => {
      if (userId) {
        socket.join(userId);
        connectedUsers.set(socket.id, userId);
        logger.info(`User ${userId} authenticated on socket`);
        io.emit('online_count', connectedUsers.size);
      }
    });

    // Join event room (for real-time check-in updates)
    socket.on('join_event', (eventId) => {
      socket.join(eventId);
      logger.info(`Socket ${socket.id} joined event room: ${eventId}`);
    });

    // Leave event room
    socket.on('leave_event', (eventId) => {
      socket.leave(eventId);
    });

    // Real-time attendee count
    socket.on('request_attendee_count', async (eventId) => {
      const roomSize = io.sockets.adapter.rooms.get(eventId)?.size || 0;
      socket.emit('attendee_count', { eventId, count: roomSize });
    });

    // Disconnect
    socket.on('disconnect', () => {
      connectedUsers.delete(socket.id);
      io.emit('online_count', connectedUsers.size);
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = { setupSocketHandlers };
