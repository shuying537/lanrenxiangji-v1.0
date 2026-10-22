const { getSummary, clearEvents } = require('../../utils/analytics');

Page({
  data: {
    hasData: false,
    totalEvents: 0,
    eventLimit: 0,
    metrics: [],
    rates: [],
    topTemplates: [],
    labels: {
      title: '数据看板',
      subtitle: '看看模板从浏览到分享的转化，全部数据只在本机。',
      funnel: '相邻步骤转化',
      funnelHint: '按事件次数统计',
      top: '热门模板',
      topHint: '按浏览排序',
      emptyTitle: '还没有数据',
      emptyText: '去发现页看看模板、拍一张照片，数据会自动记录在这里。',
      emptyAction: '去发现模板',
      clear: '清除统计数据',
      clearTitle: '清除统计数据',
      clearContent: '会删除本机记录的浏览、拍摄、保存和分享事件，不影响收藏和作品。',
      clearConfirm: '清除',
      cleared: '已清除'
    }
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    this.setData(getSummary());
  },

  goHome() {
    wx.switchTab({ url: '/pages/home/home' });
  },

  clearStats() {
    wx.showModal({
      title: this.data.labels.clearTitle,
      content: this.data.labels.clearContent,
      confirmText: this.data.labels.clearConfirm,
      confirmColor: '#a85e55',
      success: (res) => {
        if (!res.confirm) return;
        clearEvents();
        this.refresh();
        wx.showToast({ title: this.data.labels.cleared, icon: 'success' });
      }
    });
  }
});
