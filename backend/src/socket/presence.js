// Har ek uniqueId ke saath multiple sockets ho sakte hain
const onlineUsers = new Map();

const RIYA_ID = 'riya_22';

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
  if (uniqueId === RIYA_ID) return true; // Always online
  return onlineUsers.has(uniqueId);
}

function getOnlineIds() {
  const ids = Array.from(onlineUsers.keys());
  if (!ids.includes(RIYA_ID)) ids.push(RIYA_ID);
  return ids;
}

function getOnlineList() {
  const list = Array.from(onlineUsers.entries()).map(([uniqueId, d]) => ({
    uniqueId,
    level: d.level,
    sockets: d.socketIds.size,
  }));

  if (!list.find((u) => u.uniqueId === RIYA_ID)) {
    list.push({ uniqueId: RIYA_ID, level: 0, sockets: 1 });
  }
  return list;
}

function getCount() {
  return onlineUsers.size + 1; // +1 for Riya
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
  getSocketIds,
  RIYA_ID,
};