const { templates } = require('../../data/templates');
Page({
  data: { template: null, isFavorite: false, labels: { favoriteOn: '\u2665', favoriteOff: '\u2661', problem: '\u8fd9\u5f20\u7167\u7247\u8981\u89e3\u51b3\u4ec0\u4e48', guide: '\u73b0\u573a\u6307\u5f15', photographer: '\u62cd\u6444\u8005', subject: '\u88ab\u62cd\u8005', focus: '\u6784\u56fe\u91cd\u70b9', conditions: '\u9002\u7528\u6761\u4ef6', fallback: '\u62cd\u4e0d\u597d\u600e\u4e48\u529e', steps: '\u62cd\u6444\u65f6\u6309\u8fd9 3 \u6b65\u8d70', start: '\u5f00\u59cb\u62cd\u6444' } },
  onLoad(options) {
    const template = templates.find((item) => item.id === options.id) || templates[0];
    const favorites = wx.getStorageSync('lazy_camera_favorites') || [];
    this.setData({ template, isFavorite: favorites.indexOf(template.id) !== -1 });
    wx.setNavigationBarTitle({ title: template.shortTitle });
  },
  toggleFavorite() {
    const id = this.data.template.id;
    let favorites = wx.getStorageSync('lazy_camera_favorites') || [];
    favorites = favorites.indexOf(id) === -1 ? favorites.concat(id) : favorites.filter((item) => item !== id);
    wx.setStorageSync('lazy_camera_favorites', favorites);
    this.setData({ isFavorite: favorites.indexOf(id) !== -1 });
  },
  startCamera() { wx.navigateTo({ url: `/pages/camera/camera?id=${this.data.template.id}` }); }
});