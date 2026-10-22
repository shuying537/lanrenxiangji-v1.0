const FILTER_LABELS = {
  original: '原图',
  warm: '暖调',
  fresh: '清透',
  vintage: '复古'
};

const RATIO_LABELS = {
  original: '原图',
  '3:4': '3:4',
  '4:5': '4:5',
  '4:3': '4:3',
  '16:9': '16:9',
  '1:1': '1:1',
  '9:16': '9:16'
};

function decorateWork(work) {
  return Object.assign({}, work, {
    filterLabel: FILTER_LABELS[work.filter] || work.filter || '原图',
    ratioLabel: RATIO_LABELS[work.ratio] || work.ratio || '原图'
  });
}

module.exports = { FILTER_LABELS, RATIO_LABELS, decorateWork };
