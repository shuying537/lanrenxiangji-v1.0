const { templates } = require('../../data/templates');
Page({
  data: { favorites: [], recent: [], labels: { mine: '\u6211\u7684', keep: '\u628a\u597d\u7528\u7684\u6a21\u677f\u7559\u4e0b\u6765', localOnly: '\u4f60\u7684\u6536\u85cf\u548c\u6700\u8fd1\u4f7f\u7528\u53ea\u4fdd\u5b58\u5728\u5f53\u524d\u8bbe\u5907\u3002', favorites: '\u6211\u7684\u6536\u85cf', recent: '\u6700\u8fd1\u4f7f\u7528', noFavorites: '\u8fd8\u6ca1\u6709\u6536\u85cf\u6a21\u677f\uff0c\u53bb\u53d1\u73b0\u9875\u9009\u4e00\u4e2a\u5427\u3002', noRecent: '\u4f60\u8fd8\u6ca1\u6709\u5f00\u59cb\u4e00\u6b21\u62cd\u6444\u3002', privacy: '\u9690\u79c1\u8bf4\u660e', privacyText: '\u7b2c\u4e00\u7248\u4e0d\u4e0a\u4f20\u7167\u7247\uff0c\u62cd\u6444\u548c\u4fdd\u5b58\u5747\u5728\u5f53\u524d\u8bbe\u5907\u5b8c\u6210\u3002', clear: '\u6e05\u7a7a\u672c\u5730\u6536\u85cf\u8bb0\u5f55' } },
  onShow() {
    const fav = wx.getStorageSync('lazy_camera_favorites') || [];
    const recent = wx.getStorageSync('lazy_camera_recent') || [];
    this.setData({ favorites: fav.map((id) => templates.find((item) => item.id === id)).filter(Boolean), recent: recent.map((id) => templates.find((item) => item.id === id)).filter(Boolean).slice(0, 6) });
  },
  openTemplate(event) { wx.navigateTo({ url: `/pages/template/template?id=${event.currentTarget.dataset.id}` }); },
  clearLocalData() {
    wx.showModal({ title: '\u6e05\u7a7a\u672c\u5730\u8bb0\u5f55', content: '\u53ea\u4f1a\u6e05\u7a7a\u6536\u85cf\u548c\u6700\u8fd1\u4f7f\u7528\uff0c\u4e0d\u4f1a\u5220\u9664\u624b\u673a\u76f8\u518c\u7167\u7247\u3002', confirmText: '\u786e\u5b9a\u6e05\u7a7a', success: (res) => { if (res.confirm) { wx.removeStorageSync('lazy_camera_favorites'); wx.removeStorageSync('lazy_camera_recent'); this.onShow(); } } });
  }
});