const { templates } = require('../../data/templates');

Page({
  data: {
    template: null,
    devicePosition: 'back',
    guideVisible: true,
    gridVisible: true,
    guideStep: 0,
    photoPath: '',
    errorMessage: '',
    saved: false,
    isTaking: false,
    personGuideClass: '',
    objectGuideClass: '',
    personGuideLabel: '',
    objectGuideLabel: '',
    guideSwapped: false,
    labels: {
      safeArea: '取景范围',
      hideGuide: '隐藏引导',
      showGuide: '显示引导',
      switchCamera: '换镜头',
      currentStep: '当前步骤',
      saved: '已保存到相册',
      preview: '看看这张',
      resultNote: '参考引导只用于取景，不会出现在成片中。',
      retake: '重拍',
      edit: '裁剪调色',
      saveAgain: '再次保存',
      save: '保存到相册',
      grid: '九宫格',
      flip: '左右翻转'
    }
  },

  onLoad(options) {
    const template = templates.find((item) => item.id === options.id) || templates[0];
    const recentIds = wx.getStorageSync('lazy_camera_recent') || [];
    wx.setStorageSync('lazy_camera_recent', [template.id].concat(recentIds.filter((id) => id !== template.id)).slice(0, 6));
    this.cameraContext = wx.createCameraContext();
    const overlay = template.overlay || {};
    this.setData({
      template,
      personGuideClass: overlay.personClass || '',
      objectGuideClass: overlay.objectClass || '',
      personGuideLabel: overlay.personLabel || '人物放这里',
      objectGuideLabel: overlay.objectLabel || '主体放这里'
    });
    wx.setNavigationBarTitle({ title: '拍摄引导' });
  },

  onUnload() {
    this.cameraContext = null;
  },

  toggleGuide() {
    this.setData({ guideVisible: !this.data.guideVisible });
  },

  toggleGrid() {
    this.setData({ gridVisible: !this.data.gridVisible });
  },

  switchCamera() {
    this.setData({ devicePosition: this.data.devicePosition === 'back' ? 'front' : 'back' });
  },

  mirrorGuide() {
    this.setData({
      personGuideClass: this.data.objectGuideClass,
      objectGuideClass: this.data.personGuideClass,
      personGuideLabel: this.data.objectGuideLabel,
      objectGuideLabel: this.data.personGuideLabel,
      guideSwapped: !this.data.guideSwapped
    });
  },

  performTakePhoto() {
    if (!this.cameraContext) {
      this.setData({ isTaking: false, errorMessage: '相机还没有准备好，请重试。' });
      return;
    }
    this.cameraContext.takePhoto({
      quality: 'high',
      success: (res) => this.setData({ photoPath: res.tempImagePath, isTaking: false, errorMessage: '' }),
      fail: () => this.setData({ isTaking: false, errorMessage: '拍摄失败，请检查权限后重试。' })
    });
  },

  takePhoto() {
    if (this.data.isTaking) return;
    this.setData({ errorMessage: '', isTaking: true });
    this.performTakePhoto();
  },

  retake() {
    this.setData({ photoPath: '', saved: false, errorMessage: '', isTaking: false });
  },

  openEditor() {
    if (!this.data.photoPath) return;
    wx.navigateTo({
      url: `/pages/editor/editor?src=${encodeURIComponent(this.data.photoPath)}&templateId=${this.data.template.id}`
    });
  },

  savePhoto() {
    if (!this.data.photoPath) return;
    wx.saveImageToPhotosAlbum({
      filePath: this.data.photoPath,
      success: () => {
        this.setData({ saved: true, errorMessage: '' });
        wx.showToast({ title: '已保存', icon: 'success' });
      },
      fail: (error) => {
        const denied = error && /auth deny|authorize|denied/i.test(error.errMsg || '');
        this.setData({ errorMessage: denied ? '需要相册权限，请点击这里前往设置。' : '保存失败，请稍后重试。' });
      }
    });
  },

  openSettings() {
    wx.openSetting({});
  },

  cameraError() {
    this.setData({ errorMessage: '无法打开相机，请检查设备权限。' });
  }
});

