const { templates } = require('../../data/templates');
const { addRecentTemplate, addWork, persistPhoto } = require('../../utils/storage');
const { saveToAlbum, showAlbumDeniedModal } = require('../../utils/album');
const { getOutputSize } = require('../../utils/crop');
const { track } = require('../../utils/analytics');

const MAX_PHOTO_EDGE = 2560;

const PERSON_MIRROR = {
  'person-left-bottom': 'person-right-bottom',
  'person-right-bottom': 'person-left-bottom',
  'person-right-middle': 'person-left-middle',
  'person-left-middle': 'person-right-middle',
  'person-left-wide': 'person-right-wide',
  'person-right-wide': 'person-left-wide'
};

const OBJECT_MIRROR = {
  'object-right-top': 'object-left-top',
  'object-left-top': 'object-right-top',
  'object-edge-left': 'object-edge-right',
  'object-edge-right': 'object-edge-left',
  'object-window-right': 'object-window-left',
  'object-window-left': 'object-window-right'
};

function mirrorClass(className) {
  if (!className) return '';
  return PERSON_MIRROR[className] || OBJECT_MIRROR[className] || className;
}

function getWindowSize() {
  const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
  return {
    width: info.windowWidth || 375,
    height: info.windowHeight || 667
  };
}

function getCenterCrop(width, height, ratio) {
  let cropWidth = width;
  let cropHeight = height;
  if (width / height > ratio) {
    cropWidth = height * ratio;
  } else {
    cropHeight = width / ratio;
  }
  return {
    left: (width - cropWidth) / 2,
    top: (height - cropHeight) / 2,
    width: cropWidth,
    height: cropHeight
  };
}

Page({
  data: {
    template: null,
    devicePosition: 'back',
    guideVisible: true,
    gridVisible: true,
    guideStep: 0,
    guideMirrored: false,
    personGuideClass: '',
    objectGuideClass: '',
    personGuideLabel: '',
    objectGuideLabel: '',
    cameraWidth: 0,
    cameraHeight: 0,
    cameraVisible: true,
    targetRatio: '3:4',
    horizonState: 'level',
    horizonText: '保持手机水平',
    photoPath: '',
    isTaking: false,
    saving: false,
    saved: false,
    errorMessage: '',
    canOpenSettings: false,
    labels: {
      hideGuide: '隐藏引导',
      showGuide: '显示引导',
      hideGrid: '隐藏网格',
      showGrid: '九宫格',
      switchCamera: '换镜头',
      flip: '镜像引导',
      flipBack: '还原引导',
      step: '步骤',
      previous: '上一步',
      next: '下一步',
      photographer: '拍摄者',
      ratio: '建议比例',
      saved: '已保存到相册',
      preview: '看看这张',
      resultNote: '参考引导只用于取景，不会出现在成片中。',
      retake: '重拍',
      edit: '裁剪调色',
      saveAgain: '再存一次',
      save: '保存到相册',
      saving: '保存中…',
      cameraReadyFail: '相机还没有准备好，请稍后重试。',
      takeFail: '拍摄失败，请检查相机权限后重试。',
      cameraError: '无法打开相机，请点击这里前往设置。',
      permissionFail: '需要相册权限，请点击这里前往设置。',
      saveFail: '保存失败，请稍后重试。',
      localFail: '已存入相册，但本地作品保存失败，请重试。',
      horizonLevel: '保持手机水平',
      horizonLeft: '向右轻微调整',
      horizonRight: '向左轻微调整',
      missing: '没有找到这个拍摄模板。'
    }
  },

  onLoad(options) {
    const template = templates.find((item) => item.id === options.id) || templates[0];
    if (!template) return;
    const overlay = template.overlay || {};
    this.overlay = overlay;
    this.setData({
      template,
      personGuideClass: overlay.personClass || '',
      objectGuideClass: overlay.objectClass || '',
      personGuideLabel: overlay.personLabel || '人物放这里',
      objectGuideLabel: overlay.objectLabel || '主体放这里'
    });
    this.computeCameraSize(template);
    this.cameraContext = wx.createCameraContext();
    addRecentTemplate(template.id);
    track('camera_start', {
      templateId: template.id,
      title: template.title,
      category: template.category
    });
    wx.setNavigationBarTitle({ title: '拍摄引导' });
  },

  onShow() {
    if (this.data.template && !this.data.photoPath) this.startHorizonMonitor();
  },

  onHide() {
    this.stopHorizonMonitor();
  },

  onUnload() {
    this.stopHorizonMonitor();
    this.cameraContext = null;
  },

  onResize() {
    if (this.data.template) this.computeCameraSize(this.data.template);
  },

  computeCameraSize(template) {
    const win = getWindowSize();
    const isLandscape = template.orientation === '横幅';
    const ratio = isLandscape ? 4 / 3 : 3 / 4;
    let width = win.width;
    let height = width / ratio;
    const maxHeight = Math.max(160, Math.min(Math.round(win.height * 0.6), win.height - 220));
    if (height > maxHeight) {
      height = maxHeight;
      width = height * ratio;
    }
    this.setData({
      cameraWidth: Math.round(width),
      cameraHeight: Math.round(height),
      targetRatio: isLandscape ? '4:3' : '3:4'
    });
  },

  startHorizonMonitor() {
    if (this.horizonListener || !wx.onAccelerometerChange) return;
    this.horizonListener = (res) => {
      const tilt = Math.round(Number(res.x || 0) * 100) / 100;
      let horizonState = 'level';
      let horizonText = this.data.labels.horizonLevel;
      if (tilt > 0.1) {
        horizonState = 'left';
        horizonText = this.data.labels.horizonLeft;
      } else if (tilt < -0.1) {
        horizonState = 'right';
        horizonText = this.data.labels.horizonRight;
      }
      if (horizonState !== this.data.horizonState) this.setData({ horizonState, horizonText });
    };
    wx.startAccelerometer({ interval: 'ui' });
    wx.onAccelerometerChange(this.horizonListener);
  },

  stopHorizonMonitor() {
    if (!this.horizonListener) return;
    if (wx.offAccelerometerChange) wx.offAccelerometerChange(this.horizonListener);
    if (wx.stopAccelerometer) wx.stopAccelerometer();
    this.horizonListener = null;
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
    if (!this.overlay) return;
    const mirrored = !this.data.guideMirrored;
    this.setData({
      guideMirrored: mirrored,
      personGuideClass: mirrored ? mirrorClass(this.overlay.personClass) : this.overlay.personClass || '',
      objectGuideClass: mirrored ? mirrorClass(this.overlay.objectClass) : this.overlay.objectClass || ''
    });
  },

  prevStep() {
    if (this.data.guideStep > 0) this.setData({ guideStep: this.data.guideStep - 1 });
  },

  nextStep() {
    const total = (this.data.template.steps || []).length;
    if (this.data.guideStep < total - 1) this.setData({ guideStep: this.data.guideStep + 1 });
  },

  cameraError(event) {
    if (event && event.detail) console.warn('[camera]', event.detail);
    this.errorScope = 'camera';
    this.setData({ errorMessage: this.data.labels.cameraError, canOpenSettings: true });
  },

  takePhoto() {
    if (this.data.isTaking || this.data.saving) return;
    this.setData({ isTaking: true, errorMessage: '', canOpenSettings: false });
    if (!this.cameraContext) {
      this.errorScope = 'camera';
      this.setData({ isTaking: false, errorMessage: this.data.labels.cameraReadyFail });
      return;
    }
    this.cameraContext.takePhoto({
      quality: 'high',
      success: (res) => {
        this.stopHorizonMonitor();
        const rawPath = res.tempImagePath;
        this.cropToRatio(rawPath, this.data.targetRatio).then((photoPath) => {
          this.photoWorkId = null;
          this.setData({ photoPath, isTaking: false, saved: false });
        });
      },
      fail: () => {
        this.errorScope = 'camera';
        this.setData({ isTaking: false, errorMessage: this.data.labels.takeFail, canOpenSettings: true });
        this.startHorizonMonitor();
      }
    });
  },

  cropToRatio(src, ratioLabel) {
    const ratio = ratioLabel === '4:3' ? 4 / 3 : 3 / 4;
    return new Promise((resolve) => {
      wx.getImageInfo({
        src,
        success: (info) => {
          const crop = getCenterCrop(info.width, info.height, ratio);
          const output = getOutputSize(crop.width, crop.height, MAX_PHOTO_EDGE);
          this.drawCrop(src, crop, output).then(resolve).catch(() => resolve(src));
        },
        fail: () => resolve(src)
      });
    });
  },

  drawCrop(src, crop, output) {
    return new Promise((resolve, reject) => {
      wx.createSelectorQuery().in(this).select('#cropCanvas').fields({ node: true, size: true }).exec((res) => {
        const canvas = res && res[0] && res[0].node;
        if (!canvas) {
          reject(new Error('canvas not ready'));
          return;
        }
        canvas.width = output.width;
        canvas.height = output.height;
        const ctx = canvas.getContext('2d');
        const image = canvas.createImage();
        image.onload = () => {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, output.width, output.height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(
            image,
            crop.left,
            crop.top,
            crop.width,
            crop.height,
            0,
            0,
            output.width,
            output.height
          );
          wx.canvasToTempFilePath({
            canvas,
            x: 0,
            y: 0,
            width: output.width,
            height: output.height,
            destWidth: output.width,
            destHeight: output.height,
            fileType: 'jpg',
            quality: 0.92,
            success: (result) => resolve(result.tempFilePath),
            fail: reject
          });
        };
        image.onerror = () => reject(new Error('image load failed'));
        image.src = src;
      });
    });
  },

  retake() {
    this.photoWorkId = null;
    this.errorScope = '';
    this.setData({
      photoPath: '',
      saved: false,
      saving: false,
      isTaking: false,
      errorMessage: '',
      canOpenSettings: false
    }, () => {
      this.cameraContext = wx.createCameraContext();
      this.startHorizonMonitor();
    });
  },

  openEditor() {
    if (!this.data.photoPath || !this.data.template) return;
    const workParam = this.photoWorkId ? `&workId=${this.photoWorkId}` : '';
    wx.navigateTo({
      url: `/pages/editor/editor?src=${encodeURIComponent(this.data.photoPath)}&templateId=${this.data.template.id}&ratio=${this.data.targetRatio}${workParam}`
    });
  },

  savePhoto() {
    if (!this.data.photoPath || this.data.saving) return;
    this.setData({ saving: true, errorMessage: '', canOpenSettings: false });
    let albumSaved = false;
    saveToAlbum(this.data.photoPath)
      .then(() => {
        albumSaved = true;
        if (this.photoWorkId) return null;
        return persistPhoto(this.data.photoPath).then((photoPath) => {
          const workId = `work_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          const template = this.data.template;
          addWork({
            id: workId,
            photoPath,
            templateId: template.id,
            ratio: this.data.targetRatio,
            filter: 'original',
            createdAt: Date.now()
          });
          this.photoWorkId = workId;
          track('photo_save', {
            templateId: template.id,
            title: template.title,
            category: template.category,
            source: 'camera'
          });
          return null;
        });
      })
      .then(() => {
        this.errorScope = '';
        this.setData({ saving: false, saved: true, errorMessage: '' });
        wx.showToast({ title: '已保存', icon: 'success' });
      })
      .catch((error) => {
        if (error && error.denied) {
          this.errorScope = 'album';
          this.setData({ saving: false, errorMessage: this.data.labels.permissionFail, canOpenSettings: true });
          showAlbumDeniedModal();
          return;
        }
        this.setData({
          saving: false,
          errorMessage: albumSaved ? this.data.labels.localFail : this.data.labels.saveFail
        });
      });
  },

  dismissError() {
    this.errorScope = '';
    this.setData({ errorMessage: '', canOpenSettings: false });
  },

  handleErrorTap() {
    if (!this.data.canOpenSettings) {
      this.setData({ errorMessage: '', canOpenSettings: false });
      return;
    }
    const scope = this.errorScope || (this.data.photoPath ? 'album' : 'camera');
    wx.openSetting({
      success: (res) => {
        const auth = (res && res.authSetting) || {};
        if (scope === 'album') {
          if (auth['scope.writePhotosAlbum']) {
            this.errorScope = '';
            this.setData({ errorMessage: '', canOpenSettings: false });
          }
          return;
        }
        if (auth['scope.camera']) {
          this.restartCamera();
          return;
        }
        if (auth['scope.writePhotosAlbum']) {
          this.errorScope = '';
          this.setData({ errorMessage: '', canOpenSettings: false });
        }
      }
    });
  },

  restartCamera() {
    this.stopHorizonMonitor();
    this.errorScope = '';
    this.setData({ cameraVisible: false, errorMessage: '', canOpenSettings: false }, () => {
      wx.nextTick(() => {
        this.setData({ cameraVisible: true }, () => {
          this.cameraContext = wx.createCameraContext();
          if (!this.data.photoPath) this.startHorizonMonitor();
        });
      });
    });
  }
});
