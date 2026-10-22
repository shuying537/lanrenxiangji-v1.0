function saveToAlbum(filePath) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      wx.saveImageToPhotosAlbum({
        filePath,
        success: resolve,
        fail: (error) => {
          const message = (error && error.errMsg) || '';
          reject({
            denied: /auth deny|authorize|denied|权限/i.test(message),
            error
          });
        }
      });
    };

    wx.getSetting({
      success: (res) => {
        const setting = (res && res.authSetting) || {};
        if (setting['scope.writePhotosAlbum'] === false) {
          reject({ denied: true });
          return;
        }
        attempt();
      },
      fail: attempt
    });
  });
}

function showAlbumDeniedModal() {
  wx.showModal({
    title: '需要相册权限',
    content: '请在设置中允许“添加到相册”，然后重新保存。',
    confirmText: '去设置',
    success: (res) => {
      if (res.confirm) wx.openSetting({});
    }
  });
}

module.exports = { saveToAlbum, showAlbumDeniedModal };
