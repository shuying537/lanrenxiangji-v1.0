const { templates } = require('../../data/templates');
const { getWorks } = require('../../utils/storage');
const { decorateWork } = require('../../utils/format');
const { saveToAlbum, showAlbumDeniedModal } = require('../../utils/album');
const { track } = require('../../utils/analytics');

Page({
  data: {
    work: null,
    template: null,
    notFound: false,
    saving: false,
    errorMessage: '',
    canOpenSettings: false,
    labels: {
      title: '我的作品',
      missing: '这条作品记录已经不存在了。',
      back: '回到我的作品',
      missingImage: '照片文件已丢失',
      shootAgain: '再次拍摄',
      edit: '重新编辑',
      save: '保存到相册',
      share: '分享这张照片',
      saving: '保存中…',
      permissionFail: '需要相册权限，请点击这里前往设置。',
      saveFail: '保存失败，请稍后重试。',
      noTemplate: '没有关联模板'
    }
  },

  onLoad(options) {
    this.workId = options.id || '';
    wx.setNavigationBarTitle({ title: '作品详情' });
    if (!this.workId) this.setData({ notFound: true });
  },

  onShow() {
    if (this.workId) this.loadWork();
  },

  onShareAppMessage() {
    const { work, template } = this.data;
    if (!work) {
      return { title: '懒人相机', path: '/pages/home/home' };
    }
    const templateId = work.templateId || '';
    const path = template
      ? `/pages/template/template?id=${encodeURIComponent(template.id)}&from=share`
      : '/pages/home/home';
    track('share', {
      templateId,
      title: template ? template.title : '',
      category: template ? template.category : '',
      source: 'work',
      channel: 'message'
    });
    const share = {
      title: template
        ? `用「${template.shortTitle}」拍了一张，你也来试试`
        : '用懒人相机，照着框就能拍'
    };
    if (!work.imageBroken && work.photoPath) share.imageUrl = work.photoPath;
    share.path = path;
    return share;
  },

  loadWork() {
    const work = getWorks().find((item) => item.id === this.workId);
    if (!work) {
      this.setData({ work: null, template: null, notFound: true });
      return;
    }
    const view = decorateWork(work);
    view.imageBroken = !!this.imageBroken;
    const template = templates.find((item) => item.id === work.templateId) || null;
    this.setData({ work: view, template, notFound: false });
    wx.setNavigationBarTitle({ title: template ? template.shortTitle : '作品详情' });
  },

  onImageError() {
    this.imageBroken = true;
    if (this.data.work) {
      this.setData({ work: Object.assign({}, this.data.work, { imageBroken: true }) });
    }
  },

  shootAgain() {
    if (!this.data.template) {
      wx.showToast({ title: this.data.labels.noTemplate, icon: 'none' });
      return;
    }
    wx.navigateTo({ url: `/pages/camera/camera?id=${this.data.template.id}` });
  },

  editWork() {
    const { work } = this.data;
    if (!work || work.imageBroken) return;
    wx.navigateTo({
      url: `/pages/editor/editor?src=${encodeURIComponent(work.photoPath)}&templateId=${encodeURIComponent(work.templateId || '')}&ratio=${work.ratio}&workId=${work.id}`
    });
  },

  saveWork() {
    const { work } = this.data;
    if (!work || work.imageBroken || this.data.saving) return;
    this.setData({ saving: true, errorMessage: '', canOpenSettings: false });
    saveToAlbum(work.photoPath)
      .then(() => {
        this.setData({ saving: false });
        wx.showToast({ title: '已保存', icon: 'success' });
      })
      .catch((error) => {
        if (error && error.denied) {
          this.setData({
            saving: false,
            errorMessage: this.data.labels.permissionFail,
            canOpenSettings: true
          });
          showAlbumDeniedModal();
          return;
        }
        this.setData({ saving: false, errorMessage: this.data.labels.saveFail });
      });
  },

  backToWorks() {
    wx.switchTab({ url: '/pages/works/works' });
  },

  handleErrorTap() {
    if (!this.data.canOpenSettings) return;
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
