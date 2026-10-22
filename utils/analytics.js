const { templates } = require('../data/templates');

const STORAGE_KEY = 'lazy_camera_analytics';
const EVENT_LIMIT = 500;
const META_FIELDS = ['templateId', 'title', 'category', 'source', 'channel'];
const METRIC_DEFS = [
  { key: 'template_view', label: '模板浏览' },
  { key: 'camera_start', label: '开始拍摄' },
  { key: 'photo_save', label: '保存作品' },
  { key: 'share', label: '分享' }
];
const TEMPLATE_MAP = templates.reduce((map, template) => {
  map[template.id] = template;
  return map;
}, {});

function readEvents() {
  try {
    const value = wx.getStorageSync(STORAGE_KEY);
    if (!Array.isArray(value)) return [];
    return value.filter((event) => (
      event && typeof event.name === 'string' && typeof event.ts === 'number'
    ));
  } catch (error) {
    return [];
  }
}

function track(name, meta) {
  if (!name) return;
  const event = { name, ts: Date.now() };
  if (meta) {
    META_FIELDS.forEach((field) => {
      const value = meta[field];
      if (value !== undefined && value !== null && value !== '') {
        event[field] = typeof value === 'string' ? value.slice(0, 80) : value;
      }
    });
  }
  if (event.templateId) {
    const template = TEMPLATE_MAP[event.templateId];
    if (template) {
      event.title = event.title || template.title;
      event.category = event.category || template.category;
    }
  }
  const events = readEvents();
  events.push(event);
  if (events.length > EVENT_LIMIT) events.splice(0, events.length - EVENT_LIMIT);
  try {
    wx.setStorageSync(STORAGE_KEY, events);
  } catch (error) {
    // Analytics must never block the shooting or saving flow.
  }
}

function rate(part, base) {
  if (!base) return { value: 0, text: '—' };
  const value = Math.min(100, Math.round(part / base * 100));
  return { value, text: `${value}%` };
}

function getSummary() {
  const events = readEvents();
  const counts = METRIC_DEFS.reduce((map, item) => {
    map[item.key] = 0;
    return map;
  }, {});
  const templateStats = {};

  events.forEach((event) => {
    if (counts[event.name] !== undefined) counts[event.name] += 1;
    if (!event.templateId) return;
    const template = TEMPLATE_MAP[event.templateId];
    const row = templateStats[event.templateId] || {
      id: event.templateId,
      title: (template && template.title) || event.title || event.templateId,
      views: 0,
      starts: 0,
      saves: 0,
      shares: 0
    };
    if (event.name === 'template_view') row.views += 1;
    else if (event.name === 'camera_start') row.starts += 1;
    else if (event.name === 'photo_save') row.saves += 1;
    else if (event.name === 'share') row.shares += 1;
    templateStats[event.templateId] = row;
  });

  const metrics = METRIC_DEFS.map((item) => ({
    key: item.key,
    label: item.label,
    count: counts[item.key]
  }));
  const rates = [
    Object.assign({ key: 'viewShoot', label: '浏览 → 拍摄' }, rate(counts.camera_start, counts.template_view)),
    Object.assign({ key: 'shootSave', label: '拍摄 → 保存' }, rate(counts.photo_save, counts.camera_start)),
    Object.assign({ key: 'saveShare', label: '保存 → 分享' }, rate(counts.share, counts.photo_save))
  ];
  const topTemplates = Object.keys(templateStats)
    .map((id) => {
      const row = templateStats[id];
      return Object.assign({}, row, {
        total: row.views + row.starts + row.saves + row.shares
      });
    })
    .sort((a, b) => b.views - a.views || b.total - a.total)
    .slice(0, 5);

  return {
    hasData: events.length > 0,
    totalEvents: events.length,
    eventLimit: EVENT_LIMIT,
    metrics,
    rates,
    topTemplates
  };
}

function clearEvents() {
  try {
    wx.removeStorageSync(STORAGE_KEY);
  } catch (error) {
    // The dashboard can still show an empty state.
  }
}

module.exports = {
  track,
  getSummary,
  clearEvents
};
