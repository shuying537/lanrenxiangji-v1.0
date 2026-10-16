Page({
  data: {
    sourcePath: '',
    previewPath: '',
    currentRatio: 'original',
    currentFilter: 'original',
    compareOriginal: false,
    canvasWidth: 750,
    canvasHeight: 1000,
    sourceWidth: 0,
    sourceHeight: 0,
    ratioOptions: [
      { value: 'original', label: '原图' },
      { value: '3:4', label: '3:4' },
      { value: '4:3', label: '4:3' },
      { value: '1:1', label: '1:1' },
      { value: '9:16', label: '9:16' }
    ],
    filterOptions: [
      { value: 'original', label: '原图' },
      { value: 'warm', label: '暖调' },
      { value: 'fresh', label: '清透' },
      { value: 'vintage', label: '复古' }
    ],
    errorMessage: '',
    saving: false
  },

  onLoad(options) {
    const sourcePath = decodeURIComponent(options.src || '');
    if (!sourcePath) {
      this.setData({ errorMessage: '没有找到需要编辑的照片。' });
      return;
    }
    this.setData({ sourcePath, previewPath: sourcePath });
    wx.setNavigationBarTitle({ title: '调整照片' });
    wx.getImageInfo({
      src: sourcePath,
      success: (res) => {
        this.setData({ sourceWidth: res.width, sourceHeight: res.height }, () => this.renderImage());
      },
      fail: () => this.setData({ errorMessage: '读取照片失败，请返回重拍。' })
    });
  },

  getTargetRatio() {
    if (this.data.currentRatio === 'original') {
      return this.data.sourceWidth / this.data.sourceHeight || 3 / 4;
    }
    const parts = this.data.currentRatio.split(':');
    return Number(parts[0]) / Number(parts[1]);
  },

  getCropRect() {
    const sourceRatio = this.data.sourceWidth / this.data.sourceHeight;
    const targetRatio = this.getTargetRatio();
    let width = this.data.sourceWidth;
    let height = this.data.sourceHeight;
    let left = 0;
    let top = 0;
    if (sourceRatio > targetRatio) {
      width = Math.round(this.data.sourceHeight * targetRatio);
      left = Math.round((this.data.sourceWidth - width) / 2);
    } else if (sourceRatio < targetRatio) {
      height = Math.round(this.data.sourceWidth / targetRatio);
      top = Math.round((this.data.sourceHeight - height) / 2);
    }
    return { left, top, width, height };
  },

  renderImage() {
    if (!this.data.sourceWidth || !this.data.sourceHeight) return;
    const ratio = this.getTargetRatio();
    const canvasWidth = 750;
    const canvasHeight = Math.max(300, Math.round(canvasWidth / ratio));
    this.setData({ canvasWidth, canvasHeight });
    const ctx = wx.createCanvasContext('editorCanvas', this);
    const crop = this.getCropRect();
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(this.data.sourcePath, crop.left, crop.top, crop.width, crop.height, 0, 0, canvasWidth, canvasHeight);
    const overlay = {
      warm: { color: '#f5a65b', alpha: 0.17 },
      fresh: { color: '#d9f3e2', alpha: 0.16 },
      vintage: { color: '#8b684a', alpha: 0.18 }
    }[this.data.currentFilter];
    if (overlay) {
      ctx.setGlobalAlpha(overlay.alpha);
      ctx.setFillStyle(overlay.color);
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.setGlobalAlpha(1);
    }
    ctx.draw(false, () => {
      wx.canvasToTempFilePath({
        canvasId: 'editorCanvas',
        x: 0,
        y: 0,
        width: canvasWidth,
        height: canvasHeight,
        destWidth: canvasWidth,
        destHeight: canvasHeight,
        fileType: 'jpg',
        quality: 0.92,
        success: (res) => this.setData({ previewPath: res.tempFilePath, errorMessage: '' }),
        fail: () => this.setData({ errorMessage: '处理照片失败，请重试。' })
      }, this);
    });
  },

  selectRatio(event) {
    this.setData({ currentRatio: event.currentTarget.dataset.value, compareOriginal: false }, () => this.renderImage());
  },

  selectFilter(event) {
    this.setData({ currentFilter: event.currentTarget.dataset.value, compareOriginal: false }, () => this.renderImage());
  },

  toggleCompare() {
    this.setData({ compareOriginal: !this.data.compareOriginal });
  },

  saveEdited() {
    if (!this.data.previewPath || this.data.saving) return;
    this.setData({ saving: true });
    wx.saveImageToPhotosAlbum({
      filePath: this.data.previewPath,
      success: () => {
        this.setData({ saving: false });
        wx.showToast({ title: '已保存', icon: 'success' });
      },
      fail: (error) => {
        const denied = error && /auth deny|authorize|denied/i.test(error.errMsg || '');
        this.setData({ saving: false, errorMessage: denied ? '需要相册权限，请点击这里前往设置。' : '保存失败，请稍后重试。' });
      }
    });
  },

  openSettings() {
    wx.openSetting({});
  }
});

