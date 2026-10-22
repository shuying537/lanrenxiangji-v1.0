const { templates } = require('../../data/templates');
const {
  getFavorites,
  getRecentIds,
  getWorks,
  removeWork,
  clearFavoritesAndRecent
} = require('../../utils/storage');
const { decorateWork } = require('../../utils/format');

Page({
  data: {
    favorites: [],
    recentTemplates: [],
    works: [],
    labels: {
      title: '我的',
      favorites: '收藏模板',
      recent: '最近使用',
      works: '我的作品',
      emptyFavorites: '还没有收藏模板，去发现页挑一个吧。',
      emptyRecent: '还没有使用过模板。',
      emptyWorks: '拍一张照片，作品会显示在这里。',
      stats: '数据看板',
      statsSub: '查看本机模板浏览、拍摄、保存和分享转化',
      shootAgain: '再次拍摄',
      delete: '删除',
      deleteTitle: '删除作品',
      deleteContent: '确定删除这条作品记录吗？本机缓存的照片也会一起删除。',
      missing: '照片已丢失',
      privacyTitle: '隐私说明',
      privacyText: '照片只保存在本机：拍摄、编辑和作品记录都在当前设备完成，不会上传服务器。收藏、最近使用和作品记录缓存在本机，最多保留 30 件作品。',
      clear: '清空本地记录',
      confirmClear: '清空',
      clearTitle: '清空本地记录',
      clearContent: '会清空收藏、最近使用和作品记录，并删除本机缓存的照片；不会删除手机相册里的照片。',
      cleared: '已清空'
    }
  },

  onLoad() {
    this.brokenImages = {};
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const broken = this.brokenImages || {};
    const works = getWorks().map((work) => {
      const view = decorateWork(work);
      view.imageBroken = !!broken[work.id];
      return view;
    });
    this.setData({
      favorites: getFavorites()
        .map((id) => templates.find((item) => item.id === id))
        .filter(Boolean),
      recentTemplates: getRecentIds()
        .map((id) => templates.find((item) => item.id === id))
        .filter(Boolean)
        .slice(0, 6),
      works
    });
  },

  openTemplate(event) {
    wx.navigateTo({ url: `/pages/template/template?id=${event.currentTarget.dataset.id}` });
  },

  openStats() {
    wx.navigateTo({ url: '/pages/stats/stats' });
  },

  shootAgain(event) {
    wx.navigateTo({ url: `/pages/camera/camera?id=${event.currentTarget.dataset.id}` });
  },

  openWork(event) {
    const id = event.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: `/pages/work-detail/work-detail?id=${id}` });
  },

  onWorkImageError(event) {
    const id = event.currentTarget.dataset.id;
    if (!id) return;
    this.brokenImages = this.brokenImages || {};
    this.brokenImages[id] = true;
    this.setData({
      works: this.data.works.map((item) => (
        item.id === id ? Object.assign({}, item, { imageBroken: true }) : item
      ))
    });
  },

  deleteWork(event) {
    const id = event.currentTarget.dataset.id;
    wx.showModal({
      title: this.data.labels.deleteTitle,
      content: this.data.labels.deleteContent,
      confirmText: this.data.labels.delete,
      confirmColor: '#a85e55',
      success: (res) => {
        if (!res.confirm) return;
        removeWork(id);
        this.refresh();
      }
    });
  },

  clearLocalData() {
    wx.showModal({
      title: this.data.labels.clearTitle,
      content: this.data.labels.clearContent,
      confirmText: this.data.labels.confirmClear,
      confirmColor: '#a85e55',
      success: (res) => {
        if (!res.confirm) return;
        getWorks().forEach((work) => removeWork(work.id));
        clearFavoritesAndRecent();
        this.brokenImages = {};
        this.refresh();
        wx.showToast({ title: this.data.labels.cleared, icon: 'success' });
      }
    });
  }
});
