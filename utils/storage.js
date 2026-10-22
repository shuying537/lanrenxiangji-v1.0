const KEYS = {
  favorites: 'lazy_camera_favorites',
  recent: 'lazy_camera_recent',
  works: 'lazy_camera_works'
};

const RECENT_LIMIT = 6;
const WORKS_LIMIT = 30;
const STORED_EDGE = 1800;

function readList(key) {
  const value = wx.getStorageSync(key);
  return Array.isArray(value) ? value : [];
}

function getFavorites() {
  return readList(KEYS.favorites);
}

function isFavorite(id) {
  return getFavorites().indexOf(id) !== -1;
}

function toggleFavorite(id) {
  const favorites = getFavorites();
  const next = favorites.indexOf(id) === -1
    ? favorites.concat(id)
    : favorites.filter((item) => item !== id);
  wx.setStorageSync(KEYS.favorites, next);
  return next;
}

function getRecentIds() {
  return readList(KEYS.recent);
}

function addRecentTemplate(id) {
  const next = [id]
    .concat(getRecentIds().filter((item) => item !== id))
    .slice(0, RECENT_LIMIT);
  wx.setStorageSync(KEYS.recent, next);
  return next;
}

function clearFavoritesAndRecent() {
  wx.removeStorageSync(KEYS.favorites);
  wx.removeStorageSync(KEYS.recent);
}

function getWorks() {
  return readList(KEYS.works);
}

function setWorks(works) {
  wx.setStorageSync(KEYS.works, works);
}

function removeFile(filePath) {
  if (!filePath || typeof filePath !== 'string') return;
  if (filePath.indexOf(wx.env.USER_DATA_PATH) !== 0) return;
  try {
    wx.getFileSystemManager().unlinkSync(filePath);
  } catch (error) {
    // The file may already be gone; the record is what matters.
  }
}

function addWork(work) {
  const previous = getWorks();
  const next = [work]
    .concat(previous.filter((item) => item.id !== work.id))
    .slice(0, WORKS_LIMIT);
  const kept = next.reduce((map, item) => {
    map[item.id] = true;
    return map;
  }, {});
  previous.forEach((item) => {
    if (!kept[item.id]) removeFile(item.photoPath);
  });
  setWorks(next);
  return next;
}

function updateWork(id, patch) {
  const next = getWorks().map((item) => (
    item.id === id ? Object.assign({}, item, patch) : item
  ));
  setWorks(next);
  return next;
}

function removeWork(id) {
  const works = getWorks();
  const target = works.find((item) => item.id === id);
  const next = works.filter((item) => item.id !== id);
  if (target) removeFile(target.photoPath);
  setWorks(next);
  return next;
}

function getImageInfo(src) {
  return new Promise((resolve, reject) => {
    wx.getImageInfo({ src, success: resolve, fail: reject });
  });
}

function compressImage(src, width, height) {
  return new Promise((resolve, reject) => {
    wx.compressImage({
      src,
      quality: 82,
      compressedWidth: width,
      compressedHeight: height,
      success: resolve,
      fail: () => {
        wx.compressImage({ src, quality: 82, success: resolve, fail: reject });
      }
    });
  });
}

function ensureWorkDir() {
  const dir = `${wx.env.USER_DATA_PATH}/works`;
  try {
    wx.getFileSystemManager().mkdirSync(dir, true);
  } catch (error) {
    // Directory already exists or cannot be created; copy will report the real error.
  }
  return dir;
}

function copyToUserFile(tempPath, destPath) {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().copyFile({
      srcPath: tempPath,
      destPath,
      success: () => resolve(destPath),
      fail: reject
    });
  });
}

function persistPhoto(tempPath) {
  if (!tempPath) return Promise.reject(new Error('missing photo'));
  return getImageInfo(tempPath)
    .then((info) => {
      const maxEdge = Math.max(info.width, info.height);
      const scale = maxEdge > STORED_EDGE ? STORED_EDGE / maxEdge : 1;
      return compressImage(
        tempPath,
        Math.max(1, Math.round(info.width * scale)),
        Math.max(1, Math.round(info.height * scale))
      );
    })
    .catch(() => compressImage(tempPath))
    .then((result) => {
      const compressedPath = result.tempFilePath || tempPath;
      const match = /\.([a-zA-Z0-9]+)(?:\?|$)/.exec(compressedPath);
      const ext = match ? match[1].toLowerCase() : 'jpg';
      const destPath = `${ensureWorkDir()}/work_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      return copyToUserFile(compressedPath, destPath);
    });
}

module.exports = {
  KEYS,
  RECENT_LIMIT,
  WORKS_LIMIT,
  getFavorites,
  isFavorite,
  toggleFavorite,
  getRecentIds,
  addRecentTemplate,
  clearFavoritesAndRecent,
  getWorks,
  addWork,
  updateWork,
  removeWork,
  persistPhoto,
  removeFile
};
