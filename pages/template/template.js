const { templates } = require('../../data/templates');
const { isFavorite, toggleFavorite } = require('../../utils/storage');
const { track } = require('../../utils/analytics');

Page({
  data: {
    template: null,
    isFavorite: false,
    sampleBroken: false,
    notFound: false,
    labels: {
      favoriteOn: '♥',
      favoriteOff: '♡',
      problem: '这张照片要解决什么',
      guide: '现场指引',
      photographer: '拍摄者',
      subject: '被拍者',
      focus: '构图重点',
      conditions: '适用条件',
      fallback: '拍不好怎么办',
      steps: '拍摄时按步骤走',
      start: '开始拍摄',
      share: '分享给朋友',
      sampleTitle: '示例构图',
      sampleNote: '先看人物和主体的大致位置，再打开相机照着摆。',
      missing: '没有找到这个模板，正在返回上一页。'
    }
  },

  onLoad(options) {
    const template = templates.find((item) => item.id === options.id);
    if (!template) {
      this.setData({ notFound: true });
      wx.showToast({ title: '模板不存在', icon: 'none' });
      setTimeout(() => {
        wx.navigateBack({
          fail: () => wx.switchTab({ url: '/pages/home/home' })
        });
      }, 800);
      return;
    }
    this.setData({
      template,
      isFavorite: isFavorite(template.id),
      sampleBroken: !template.sampleImage
    });
    track('template_view', {
      templateId: template.id,
      title: template.title,
      category: template.category,
      source: options.from || 'direct'
    });
    if (wx.showShareMenu) {
      wx.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] });
    }
    wx.setNavigationBarTitle({ title: template.shortTitle });
  },

  onShareAppMessage() {
    const template = this.data.template;
    if (!template) {
      return { title: '懒人相机', path: '/pages/home/home' };
    }
    track('share', {
      templateId: template.id,
      title: template.title,
      category: template.category,
      source: 'template',
      channel: 'message'
    });
    const share = {
      title: `不会拍？照着「${template.shortTitle}」的框拍`,
      path: `/pages/template/template?id=${encodeURIComponent(template.id)}&from=share`
    };
    if (template.sampleImage) share.imageUrl = template.sampleImage;
    return share;
  },

  onShareTimeline() {
    const template = this.data.template;
    if (!template) return {};
    track('share', {
      templateId: template.id,
      title: template.title,
      category: template.category,
      source: 'template',
      channel: 'timeline'
    });
    return {
      title: `不会拍？照着「${template.shortTitle}」的框拍`,
      query: `id=${encodeURIComponent(template.id)}&from=share`
    };
  },

  toggleFavorite() {
    if (!this.data.template) return;
    const favorites = toggleFavorite(this.data.template.id);
    this.setData({ isFavorite: favorites.indexOf(this.data.template.id) !== -1 });
  },

  onSampleError() {
    this.setData({ sampleBroken: true });
  },

  startCamera() {
    if (!this.data.template) return;
    wx.navigateTo({ url: `/pages/camera/camera?id=${this.data.template.id}` });
  }
});
