const { templates } = require('../../data/templates');
Page({
  data: {
    title: '\u61d2\u4eba\u76f8\u673a',
    subtitle: '\u4e0d\u4f1a\u62cd\uff0c\u5c31\u7167\u7740\u6a21\u677f\u62cd\u3002',
    labels: { heroNote: '\u9009\u62e9\u4e00\u4e2a\u573a\u666f\uff0c\u8ddf\u7740\u5f15\u5bfc\u5c31\u80fd\u5f00\u59cb\u3002', featured: '\u9996\u6b21\u4f53\u9a8c', start: '\u5f00\u59cb\u62cd\u6444', chooseScene: '\u9009\u62e9\u573a\u666f', sceneNote: '\u6bcf\u4e2a\u6a21\u677f\u90fd\u5305\u542b\u673a\u4f4d\u548c\u59ff\u52bf\u63d0\u793a', recent: '\u6700\u8fd1\u4f7f\u7528' },
    categories: [{ id: 'all', name: '\u5168\u90e8' }, { id: 'travel', name: '\u65c5\u884c\u666f\u70b9' }, { id: 'cafe', name: '\u5496\u5561\u9986' }, { id: 'couple', name: '\u53cc\u4eba\u5408\u7167' }],
    activeCategory: 'all', visibleTemplates: templates, featured: templates[0], recentTemplates: []
  },
  onShow() { const ids = wx.getStorageSync('lazy_camera_recent') || []; this.setData({ recentTemplates: ids.map((id) => templates.find((item) => item.id === id)).filter(Boolean).slice(0, 3) }); },
  selectCategory(event) { const category = event.currentTarget.dataset.category; this.setData({ activeCategory: category, visibleTemplates: category === 'all' ? templates : templates.filter((item) => item.category === category) }); },
  openTemplate(event) { wx.navigateTo({ url: `/pages/template/template?id=${event.currentTarget.dataset.id}` }); },
  openFeatured() { this.openTemplate({ currentTarget: { dataset: { id: this.data.featured.id } } }); }
});