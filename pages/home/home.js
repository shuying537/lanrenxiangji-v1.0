const { templates } = require('../../data/templates');
const { getRecentIds } = require('../../utils/storage');

function withImageState(template, broken) {
  return Object.assign({}, template, { imageBroken: !!broken });
}

const initialTemplates = templates.map((template) => withImageState(template, false));

Page({
  data: {
    title: '懒人相机',
    subtitle: '不会拍，就照着模板拍。',
    labels: {
      heroNote: '选择一个场景，跟着引导就能开始。',
      featured: '首次体验',
      start: '开始拍摄',
      chooseScene: '选择场景',
      sceneNote: '每个模板都包含机位和姿势提示',
      recent: '最近使用',
      albumEntry: '从相册开始',
      albumFail: '打开相册失败'
    },
    categories: [
      { id: 'all', name: '全部' },
      { id: 'travel', name: '旅行景点' },
      { id: 'cafe', name: '咖啡馆' },
      { id: 'couple', name: '双人合照' }
    ],
    activeCategory: 'all',
    visibleTemplates: initialTemplates,
    featured: initialTemplates[0],
    recentTemplates: []
  },

  onLoad() {
    this.brokenImages = {};
  },

  onShow() {
    const recentTemplates = getRecentIds()
      .map((id) => templates.find((item) => item.id === id))
      .filter(Boolean)
      .slice(0, 3);
    this.setData({ recentTemplates });
  },

  decorateList(list) {
    const broken = this.brokenImages || {};
    return list.map((template) => withImageState(template, broken[template.id]));
  },

  selectCategory(event) {
    const category = event.currentTarget.dataset.category;
    const list = category === 'all'
      ? templates
      : templates.filter((item) => item.category === category);
    this.setData({ activeCategory: category, visibleTemplates: this.decorateList(list) });
  },

  openTemplate(event) {
    wx.navigateTo({ url: `/pages/template/template?id=${event.currentTarget.dataset.id}` });
  },

  openFeatured() {
    wx.navigateTo({ url: `/pages/template/template?id=${this.data.featured.id}` });
  },

  onImageError(event) {
    const id = event.currentTarget.dataset.id;
    const scope = event.currentTarget.dataset.scope;
    if (!id) return;
    this.brokenImages = this.brokenImages || {};
    this.brokenImages[id] = true;
    if (scope === 'featured') {
      this.setData({ featured: withImageState(this.data.featured, true) });
      return;
    }
    const list = this.data.activeCategory === 'all'
      ? templates
      : templates.filter((item) => item.category === this.data.activeCategory);
    this.setData({ visibleTemplates: this.decorateList(list) });
  },

  openAlbum() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const path = res.tempFiles && res.tempFiles[0] && res.tempFiles[0].tempFilePath;
        if (path) wx.navigateTo({ url: `/pages/editor/editor?src=${encodeURIComponent(path)}&ratio=original` });
      },
      fail: (error) => {
        if (error && /cancel/i.test(error.errMsg || '')) return;
        wx.showToast({ title: this.data.labels.albumFail, icon: 'none' });
      }
    });
  }
});
