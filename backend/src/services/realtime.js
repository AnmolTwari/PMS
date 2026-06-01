let socketServer = null;

function setSocketServer(server) {
  socketServer = server;
}

function emitEvent(eventName, payload = {}) {
  if (!socketServer) return;
  socketServer.emit(eventName, payload);
}

function emitParkingUpdate(payload = {}) {
  emitEvent('parking:updated', payload);
}

module.exports = {
  setSocketServer,
  emitEvent,
  emitParkingUpdate,
};