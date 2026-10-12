// Har ek uniqueId ke saath multiple sockets ho sakte hain
// (ek user, multiple tabs/devices se)
const onlineUsers = new Map(); // uniqueId -> { level, socketIds: Set }

function addUser(uniqueId, level, socketId) {
  if (!onlineUsers.has(uniqueId)) {
    onlineUsers.set(uniqueId, { level, socketIds: new Set() });
  }
  onlineUsers.get(uniqueId).socketIds.add(socketId);
}

function removeUser(uniqueId, socketId) {
  const entry = onlineUsers.get(uniqueId);
  if (!entry) return;
  entry.socketIds.delete(socketId);
  if (entry.socketIds.size === 0) {
    onlineUsers.delete(uniqueId);
  }
}

function isOnline(uniqueId) {
  return onlineUsers.has(uniqueId);
}

function getOnlineIds() {
  return Array.from(onlineUsers.keys());
}

function getOnlineList() {
  return Array.from(onlineUsers.entries()).map(([uniqueId, d]) => ({
    uniqueId,
    level: d.level,
    sockets: d.socketIds.size
  }));
}

function getCount() {
  return onlineUsers.size;
}

function getSocketIds(uniqueId) {
  const entry = onlineUsers.get(uniqueId);
  if (!entry) return [];
  return Array.from(entry.socketIds);
}


module.exports = {
  addUser,
  removeUser,
  isOnline,
  getOnlineIds,
  getOnlineList,
  getCount,
  getSocketIds
};