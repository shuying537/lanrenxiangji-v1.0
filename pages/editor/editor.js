const { addWork, updateWork, getWorks, persistPhoto, removeFile } = require('../../utils/storage');
const { saveToAlbum, showAlbumDeniedModal } = require('../../utils/album');
const {
  getFrameSize,
  getBaseScale,
  clampOffsets,
  getSourceCrop,
  getOutputSize,
  getZoomedOffset,
  getOrientedSize,
  clamp
} = require('../../utils/crop');
const { templates } = require('../../data/templates');
const { FILTER_LABELS } = require('../../utils/format');
const { track } = require('../../utils/analytics');

const FILTERS = {
  original: { color: 'transparent', alpha: 0 },
  warm: { color: '#f5a65b', alpha: 0.17 },
  fresh: { color: '#d9f3e2', alpha: 0.16 },
  vintage: { color: '#8b684a', alpha: 0.18 }
};

const RATIOS = ['3:4', '4:5', '4:3', '16:9', '1:1', '9:16'];
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const MAX_EXPORT_EDGE = 2560;
const HISTORY_LIMIT = 20;

Page({
  data: {
    sourcePath: '',
    sourceWidth: 0,
    sourceHeight: 0,
    currentRatio: 'original',
    currentFilter: 'original',
    filterLevel: 100,
    filterColor: 'transparent',
    filterAlpha: 0,
    rotation: 0,
    flipX: false,
    frameW: 0,
    frameH: 0,
    displayW: 0,
    displayH: 0,
    imageW: 0,
    imageH: 0,
    offsetX: 0,
    offsetY: 0,
    cropZoom: 1,
    baseScale: 1,
    compareOriginal: false,
    saving: false,
    canUndo: false,
    canRedo: false,
    templateId: '',
    templateStyle: null,
    templateStyleLabel: '',
    workId: '',
    ratioOptions: [
      { value: 'original', label: '原图' },
      { value: '3:4', label: '3:4' },
      { value: '4:5', label: '4:5' },
      { value: '1:1', label: '1:1' },
      { value: '9:16', label: '9:16' },
      { value: '4:3', label: '4:3' },
      { value: '16:9', label: '16:9' }
    ],
    filterOptions: [
      { value: 'original', label: '原图' },
      { value: 'warm', label: '暖调' },
      { value: 'fresh', label: '清透' },
      { value: 'vintage', label: '复古' }
    ],
    errorMessage: '',
    canOpenSettings: false
  },

  onLoad(options) {
    let sourcePath = '';
    try {
      sourcePath = decodeURIComponent(options.src || '');
    } catch (error) {
      sourcePath = '';
    }
    if (!sourcePath) {
      this.setData({ errorMessage: '没有找到需要编辑的照片。' });
      return;
    }
    const ratio = RATIOS.indexOf(options.ratio) !== -1 ? options.ratio : 'original';
    const filter = FILTERS[options.filter] ? options.filter : 'original';
    const template = options.templateId
      ? templates.find((item) => item.id === options.templateId)
      : null;
    const templateStyle = template && template.editStyle && FILTERS[template.editStyle.filter]
      ? {
        filter: template.editStyle.filter,
        level: Math.round(clamp(Number(template.editStyle.level) || 100, 0, 100))
      }
      : null;
    this.setData({
      sourcePath,
      currentRatio: ratio,
      currentFilter: filter,
      templateId: options.templateId || '',
      templateStyle,
      templateStyleLabel: templateStyle
        ? `${FILTER_LABELS[templateStyle.filter] || '原图'} ${templateStyle.level}%`
        : '',
      workId: options.workId || ''
    }, () => {
      this.applyFilterStyle();
      this.loadSource();
    });
    wx.setNavigationBarTitle({ title: '调整照片' });
  },

  onResize() {
    setTimeout(() => this.measurePreview(false), 0);
  },

  onPageScroll(event) {
    this.pageScrollTop = event.scrollTop || 0;
  },

  loadSource() {
    wx.getImageInfo({
      src: this.data.sourcePath,
      success: (res) => {
        this.setData({ sourceWidth: res.width, sourceHeight: res.height }, () => {
          this.measurePreview();
        });
      },
      fail: () => this.setData({ errorMessage: '读取照片失败，请返回重试。' })
    });
  },

  measurePreview(reset) {
    if (!this.data.sourceWidth) return;
    wx.createSelectorQuery()
      .in(this)
      .select('#previewArea')
      .boundingClientRect((rect) => {
        if (!rect || !rect.width || !rect.height) return;
        this.previewRect = rect;
        this.previewScrollTop = this.pageScrollTop || 0;
        this.layoutCrop(reset !== false);
      })
      .exec();
  },

  getTargetRatio() {
    if (this.data.currentRatio === 'original') {
      const oriented = getOrientedSize(
        this.data.sourceWidth,
        this.data.sourceHeight,
        this.data.rotation
      );
      if (oriented.width && oriented.height) {
        return oriented.width / oriented.height;
      }
      return 3 / 4;
    }
    const parts = this.data.currentRatio.split(':');
    return Number(parts[0]) / Number(parts[1]);
  },

  layoutCrop(resetZoom, resetOffset, done) {
    const { sourceWidth, sourceHeight } = this.data;
    if (!this.previewRect || !sourceWidth || !sourceHeight) return;
    const oriented = getOrientedSize(sourceWidth, sourceHeight, this.data.rotation);
    const frame = getFrameSize(this.previewRect.width, this.previewRect.height, this.getTargetRatio(), 12);
    const baseScale = getBaseScale(frame.width, frame.height, oriented.width, oriented.height);
    const zoom = resetZoom ? 1 : Number(clamp(this.data.cropZoom, MIN_ZOOM, MAX_ZOOM).toFixed(2));
    const keepOffset = resetOffset === undefined ? !resetZoom : !resetOffset;
    const scale = baseScale * zoom;
    const offsets = clampOffsets(
      keepOffset ? this.data.offsetX : 0,
      keepOffset ? this.data.offsetY : 0,
      frame.width,
      frame.height,
      oriented.width,
      oriented.height,
      scale
    );
    this.setData({
      frameW: frame.width,
      frameH: frame.height,
      baseScale,
      cropZoom: zoom,
      displayW: Math.round(oriented.width * scale),
      displayH: Math.round(oriented.height * scale),
      imageW: Math.round(sourceWidth * scale),
      imageH: Math.round(sourceHeight * scale),
      offsetX: offsets.offsetX,
      offsetY: offsets.offsetY,
      compareOriginal: false
    }, () => {
      if (!this.historyReady) {
        this.historyReady = true;
        this.resetHistory();
      }
      if (typeof done === 'function') done();
    });
  },

  applyFilterStyle() {
    const filter = FILTERS[this.data.currentFilter] || FILTERS.original;
    const level = filter.alpha ? clamp(this.data.filterLevel, 0, 100) / 100 : 0;
    this.setData({
      filterColor: filter.color,
      filterAlpha: Number((filter.alpha * level).toFixed(3))
    });
  },

  createSnapshot() {
    const {
      currentRatio,
      currentFilter,
      filterLevel,
      rotation,
      flipX,
      cropZoom,
      offsetX,
      offsetY
    } = this.data;
    return {
      currentRatio,
      currentFilter,
      filterLevel,
      rotation,
      flipX,
      cropZoom,
      offsetX,
      offsetY
    };
  },

  isSameSnapshot(a, b) {
    if (!a || !b) return false;
    return ['currentRatio', 'currentFilter', 'filterLevel', 'rotation', 'flipX', 'cropZoom', 'offsetX', 'offsetY']
      .every((key) => a[key] === b[key]);
  },

  resetHistory() {
    this.history = [this.createSnapshot()];
    this.historyIndex = 0;
    this.syncHistoryState();
  },

  recordHistory() {
    if (!this.historyReady) return;
    const snapshot = this.createSnapshot();
    if (this.isSameSnapshot(this.history[this.historyIndex], snapshot)) return;
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(snapshot);
    if (this.history.length > HISTORY_LIMIT) {
      this.history.shift();
    }
    this.historyIndex = this.history.length - 1;
    this.syncHistoryState();
  },

  syncHistoryState() {
    this.setData({
      canUndo: this.historyIndex > 0,
      canRedo: this.historyIndex < this.history.length - 1
    });
  },

  applySnapshot(snapshot) {
    this.setData(Object.assign({}, snapshot, { compareOriginal: false }), () => {
      this.applyFilterStyle();
      if (this.previewRect && this.data.sourceWidth) {
        this.layoutCrop(false, false, () => this.syncHistoryState());
      } else {
        this.syncHistoryState();
      }
    });
  },

  undoEdit() {
    if (!this.historyReady || this.historyIndex <= 0) return;
    this.historyIndex -= 1;
    this.applySnapshot(this.history[this.historyIndex]);
  },

  redoEdit() {
    if (!this.historyReady || this.historyIndex >= this.history.length - 1) return;
    this.historyIndex += 1;
    this.applySnapshot(this.history[this.historyIndex]);
  },

  updateCrop(zoom, offsetX, offsetY, done) {
    const { baseScale, frameW, frameH, sourceWidth, sourceHeight, rotation } = this.data;
    const oriented = getOrientedSize(sourceWidth, sourceHeight, rotation);
    const scale = baseScale * zoom;
    const offsets = clampOffsets(offsetX, offsetY, frameW, frameH, oriented.width, oriented.height, scale);
    this.setData({
      cropZoom: zoom,
      displayW: Math.round(oriented.width * scale),
      displayH: Math.round(oriented.height * scale),
      imageW: Math.round(sourceWidth * scale),
      imageH: Math.round(sourceHeight * scale),
      offsetX: offsets.offsetX,
      offsetY: offsets.offsetY
    }, done);
  },

  selectRatio(event) {
    const value = event.currentTarget.dataset.value;
    this.setData({ currentRatio: value, compareOriginal: false }, () => {
      if (this.previewRect && this.data.sourceWidth) {
        this.layoutCrop(true, true, () => this.recordHistory());
      } else {
        this.measurePreview();
      }
    });
  },

  selectFilter(event) {
    const value = event.currentTarget.dataset.value;
    this.setData({ currentFilter: value, compareOriginal: false }, () => {
      this.applyFilterStyle();
      this.recordHistory();
    });
  },

  changeFilterLevel(event) {
    this.applyFilterLevel(event.detail.value, false);
  },

  commitFilterLevel(event) {
    this.applyFilterLevel(event.detail.value, true);
  },

  applyFilterLevel(value, commit) {
    const level = Math.round(clamp(Number(value) || 0, 0, 100));
    this.setData({ filterLevel: level }, () => {
      this.applyFilterStyle();
      if (commit) this.recordHistory();
    });
  },

  applyTemplateStyle() {
    const style = this.data.templateStyle;
    if (!style) return;
    this.setData({
      currentFilter: style.filter,
      filterLevel: style.level,
      compareOriginal: false
    }, () => {
      this.applyFilterStyle();
      this.recordHistory();
    });
  },

  rotateLeft() {
    this.rotateCrop(-90);
  },

  rotateRight() {
    this.rotateCrop(90);
  },

  rotateCrop(delta) {
    if (!this.data.frameW) return;
    const rotation = ((this.data.rotation + delta) % 360 + 360) % 360;
    this.setData({ rotation, compareOriginal: false }, () => {
      this.layoutCrop(false, true, () => this.recordHistory());
    });
  },

  flipImage() {
    if (!this.data.frameW) return;
    this.setData({
      flipX: !this.data.flipX,
      offsetX: -this.data.offsetX,
      compareOriginal: false
    }, () => {
      this.layoutCrop(false, false, () => this.recordHistory());
    });
  },

  zoomCrop(event) {
    const delta = Number(event.currentTarget.dataset.delta || 0);
    const nextZoom = Number(clamp(this.data.cropZoom + delta, MIN_ZOOM, MAX_ZOOM).toFixed(2));
    if (nextZoom === this.data.cropZoom) return;
    const oldScale = this.data.baseScale * this.data.cropZoom;
    const newScale = this.data.baseScale * nextZoom;
    const anchored = getZoomedOffset(this.data.offsetX, this.data.offsetY, oldScale, newScale, 0, 0);
    this.updateCrop(nextZoom, anchored.offsetX, anchored.offsetY, () => this.recordHistory());
  },

  cropTouchStart(event) {
    if (!this.previewRect || !this.data.sourceWidth) return;
    const touches = event.touches || [];
    this.setData({ compareOriginal: false });
    if (touches.length >= 2) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const midX = (touches[0].clientX + touches[1].clientX) / 2;
      const midY = (touches[0].clientY + touches[1].clientY) / 2;
      const rect = this.previewRect;
      const scrollDelta = (this.pageScrollTop || 0) - (this.previewScrollTop || 0);
      this.gesture = {
        mode: 'pinch',
        startDistance: Math.max(1, Math.sqrt(dx * dx + dy * dy)),
        startZoom: this.data.cropZoom,
        startOffsetX: this.data.offsetX,
        startOffsetY: this.data.offsetY,
        pointX: midX - (rect.left + rect.width / 2),
        pointY: midY - (rect.top - scrollDelta + rect.height / 2)
      };
      return;
    }
    if (touches.length === 1) {
      this.gesture = {
        mode: 'pan',
        startX: touches[0].clientX,
        startY: touches[0].clientY,
        startOffsetX: this.data.offsetX,
        startOffsetY: this.data.offsetY
      };
    }
  },

  cropTouchMove(event) {
    const gesture = this.gesture;
    const touches = event.touches || [];
    if (!gesture) return;
    if (gesture.mode === 'pinch' && touches.length >= 2) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const nextZoom = Number(clamp(
        gesture.startZoom * distance / gesture.startDistance,
        MIN_ZOOM,
        MAX_ZOOM
      ).toFixed(2));
      const oldScale = this.data.baseScale * gesture.startZoom;
      const newScale = this.data.baseScale * nextZoom;
      const anchored = getZoomedOffset(
        gesture.startOffsetX,
        gesture.startOffsetY,
        oldScale,
        newScale,
        gesture.pointX,
        gesture.pointY
      );
      this.updateCrop(nextZoom, anchored.offsetX, anchored.offsetY);
      return;
    }
    if (gesture.mode === 'pan' && touches.length === 1) {
      this.updateCrop(
        this.data.cropZoom,
        gesture.startOffsetX + (touches[0].clientX - gesture.startX),
        gesture.startOffsetY + (touches[0].clientY - gesture.startY)
      );
    }
  },

  cropTouchEnd() {
    this.gesture = null;
    this.recordHistory();
  },

  startCompare() {
    this.setData({ compareOriginal: true });
  },

  endCompare() {
    this.setData({ compareOriginal: false });
  },

  saveEdited() {
    if (this.data.saving || !this.data.frameW) return;
    this.setData({ saving: true, errorMessage: '', canOpenSettings: false });
    let albumSaved = false;
    this.exportImage()
      .then((tempPath) => saveToAlbum(tempPath).then(() => {
        albumSaved = true;
        return tempPath;
      }))
      .then((tempPath) => persistPhoto(tempPath))
      .then((photoPath) => this.recordWork(photoPath))
      .then(() => {
        track('photo_save', {
          templateId: this.data.templateId || '',
          source: 'editor'
        });
        this.setData({ saving: false });
        wx.showToast({ title: '已保存', icon: 'success' });
      })
      .catch((error) => {
        this.setData({ saving: false });
        if (error && error.denied) {
          this.setData({
            errorMessage: '需要相册权限，请点击这里前往设置。',
            canOpenSettings: true
          });
          showAlbumDeniedModal();
        } else if (albumSaved) {
          this.setData({ errorMessage: '已保存到相册，但作品记录失败，请重试。' });
        } else {
          this.setData({ errorMessage: '保存失败，请稍后重试。' });
        }
      });
  },

  recordWork(photoPath) {
    const { workId, templateId, currentRatio, currentFilter } = this.data;
    const existing = workId ? getWorks().find((item) => item.id === workId) : null;
    if (existing) {
      updateWork(workId, {
        photoPath,
        ratio: currentRatio,
        filter: currentFilter
      });
      if (existing.photoPath && existing.photoPath !== photoPath) {
        removeFile(existing.photoPath);
      }
      return;
    }
    const id = `work_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    addWork({
      id,
      photoPath,
      templateId: templateId || '',
      ratio: currentRatio,
      filter: currentFilter,
      createdAt: Date.now()
    });
    this.setData({ workId: id });
  },

  exportImage() {
    return new Promise((resolve, reject) => {
      const {
        sourcePath,
        sourceWidth,
        sourceHeight,
        baseScale,
        cropZoom,
        frameW,
        frameH,
        offsetX,
        offsetY,
        rotation,
        flipX,
        currentFilter,
        filterLevel
      } = this.data;
      if (!sourcePath || !sourceWidth || !sourceHeight || !frameW) {
        reject(new Error('photo not ready'));
        return;
      }
      const oriented = getOrientedSize(sourceWidth, sourceHeight, rotation);
      const scale = baseScale * cropZoom;
      const crop = getSourceCrop(frameW, frameH, oriented.width, oriented.height, scale, offsetX, offsetY);
      const output = getOutputSize(crop.width, crop.height, MAX_EXPORT_EDGE);
      const displayCropWidth = crop.width * scale;
      const displayCropHeight = crop.height * scale;
      const k = Math.max(output.width / displayCropWidth, output.height / displayCropHeight);
      const dx = (output.width - displayCropWidth * k) / 2;
      const dy = (output.height - displayCropHeight * k) / 2;
      wx.createSelectorQuery()
        .in(this)
        .select('#editorCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          const canvas = res && res[0] && res[0].node;
          if (!canvas) {
            reject(new Error('canvas missing'));
            return;
          }
          canvas.width = output.width;
          canvas.height = output.height;
          const ctx = canvas.getContext('2d');
          const image = canvas.createImage();
          image.onload = () => {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, output.width, output.height);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.save();
            ctx.translate(dx - crop.left * scale * k, dy - crop.top * scale * k);
            ctx.translate(oriented.width * scale * k / 2, oriented.height * scale * k / 2);
            ctx.scale(scale * k, scale * k);
            if (flipX) ctx.scale(-1, 1);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.drawImage(image, -sourceWidth / 2, -sourceHeight / 2, sourceWidth, sourceHeight);
            ctx.restore();
            const overlay = FILTERS[currentFilter];
            const alpha = overlay && overlay.alpha
              ? overlay.alpha * clamp(Number(filterLevel) || 0, 0, 100) / 100
              : 0;
            if (alpha) {
              ctx.globalAlpha = alpha;
              ctx.fillStyle = overlay.color;
              ctx.fillRect(0, 0, output.width, output.height);
              ctx.globalAlpha = 1;
            }
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
          image.onerror = reject;
          image.src = sourcePath;
        });
    });
  },

  dismissError() {
    this.setData({ errorMessage: '', canOpenSettings: false });
  },

  handleErrorTap() {
    if (!this.data.canOpenSettings) {
      this.setData({ errorMessage: '', canOpenSettings: false });
      return;
    }
    wx.openSetting({
      success: (res) => {
        const auth = (res && res.authSetting) || {};
        if (auth['scope.writePhotosAlbum']) {
          this.setData({ errorMessage: '', canOpenSettings: false });
        }
      }
    });
  }
});
