const sampleImages = {
  'travel-landmark': '/images/templates/travel-landmark.jpg',
  'travel-lines': '/images/templates/travel-lines.jpg',
  'travel-frame': '/images/templates/travel-frame.jpg',
  'cafe-window': '/images/templates/cafe-window.jpg',
  'cafe-table': '/images/templates/cafe-table.jpg',
  'cafe-side': '/images/templates/cafe-side.jpg',
  'couple-side': '/images/templates/couple-side.jpg',
  'couple-depth': '/images/templates/couple-depth.jpg',
  'couple-interact': '/images/templates/couple-interact.jpg'
};

const templates = [
  {
    id: 'travel-landmark',
    category: 'travel',
    editStyle: { filter: 'warm', level: 70 },
    categoryName: '旅行/景点',
    title: '地标同框·单人全身',
    visualClass: 'visual-landmark',
    people: '单人',
    orientation: '竖幅',
    difficulty: '入门',
    problem: '让人物和地标都完整出现。',
    cameraGuide: '退后 3–5 步，手机放在胸口高度。',
    subjectGuide: '站在画面左下方，身体轻转向地标。',
    focus: '平视或轻微低机位，顶部给地标留空间。',
    conditions: '适合单人、竖拍；人物距背景 1–3 米。',
    fallback: '地标放不全时，改拍半身并保留标志性局部。',
    steps: [
      '让人物站到人物框内左下方。',
      '让地标位于拍摄对象框内。',
      '保持手机稳定，按快门拍摄。'
    ],
    overlay: {
      personLabel: '人物站这里',
      objectLabel: '地标放这里',
      personClass: 'person-left-bottom',
      objectClass: 'object-right-top'
    }
  },
  {
    id: 'travel-lines',
    category: 'travel',
    editStyle: { filter: 'fresh', level: 60 },
    categoryName: '旅行/景点',
    title: '建筑线条引导·侧身',
    visualClass: 'visual-lines',
    people: '单人',
    orientation: '竖幅',
    difficulty: '入门',
    problem: '用建筑线条帮画面变得更有方向。',
    cameraGuide: '找到建筑边线，镜头保持水平。',
    subjectGuide: '站在线条一侧，身体轻转，看向前方。',
    focus: '让线条从画面边缘延向人物。',
    conditions: '需要有明显建筑或道路线条。',
    fallback: '背景太乱时，改拍半身并靠近线条背景。',
    steps: [
      '让线条从画面下方进入。',
      '让人物站在人物框内、靠近线条。',
      '保持镜头水平后拍摄。'
    ],
    overlay: {
      personLabel: '人物站这里',
      objectLabel: '建筑线条从这里进入',
      personClass: 'person-right-bottom',
      objectClass: 'object-line-bottom'
    }
  },
  {
    id: 'travel-frame',
    category: 'travel',
    editStyle: { filter: 'vintage', level: 65 },
    categoryName: '旅行/景点',
    title: '前景框景·人物留白',
    visualClass: 'visual-frame',
    people: '单人',
    orientation: '竖幅',
    difficulty: '入门',
    problem: '用前景让景色更有层次。',
    cameraGuide: '靠近一个框子或叶片。',
    subjectGuide: '站在前景后方，保留一侧留白。',
    focus: '前景只占边缘，不要遮住脸部。',
    conditions: '适合有门框、窗框或叶片的环境。',
    fallback: '找不到前景时，使用墙面或栏杆作框。',
    steps: [
      '找到可以靠近的前景物。',
      '让前景位于前景框内、靠近画面边缘。',
      '调整人物到人物框留白区域。'
    ],
    overlay: {
      personLabel: '人物站在留白区',
      objectLabel: '前景框放这里',
      personClass: 'person-right-middle',
      objectClass: 'object-edge-left'
    }
  },
  {
    id: 'cafe-window',
    category: 'cafe',
    editStyle: { filter: 'fresh', level: 75 },
    categoryName: '咖啡馆/室内',
    title: '窗边坐姿·半身',
    visualClass: 'visual-window',
    people: '单人',
    orientation: '竖幅',
    difficulty: '入门',
    problem: '让室内坐姿照不显僵。',
    cameraGuide: '在桌边保持与眼睛平齐。',
    subjectGuide: '靠近窗边，身体轻转向光源。',
    focus: '保留窗外环境，让脸部明亮。',
    conditions: '适合靠窗、有自然光的座位。',
    fallback: '光线不足时，改为面向光源的半身照。',
    steps: [
      '让人物坐到人物框内。',
      '让窗户和光线位于拍摄对象框内。',
      '眼睛看向光源旁边。'
    ],
    overlay: {
      personLabel: '人物坐这里',
      objectLabel: '窗户/光线放这里',
      personClass: 'person-left-middle',
      objectClass: 'object-window-right'
    }
  },
  {
    id: 'cafe-table',
    category: 'cafe',
    editStyle: { filter: 'warm', level: 75 },
    categoryName: '咖啡馆/室内',
    title: '桌边生活感·手部动作',
    visualClass: 'visual-table',
    people: '单人',
    orientation: '竖幅',
    difficulty: '入门',
    problem: '用手部互动让室内照更自然。',
    cameraGuide: '距离桌边一步，拍半身和桌面。',
    subjectGuide: '轻轻拿起杯子或书本。',
    focus: '让手部有动作，脸部保持放松。',
    conditions: '需要桌子和一个可互动的物品。',
    fallback: '没有道具时，用手撑住下巴。',
    steps: [
      '让桌面占画面下方三分之一。',
      '让手和道具位于拍摄对象框内。',
      '不要直盯镜头，看向手中物品。'
    ],
    overlay: {
      personLabel: '人物坐这里',
      objectLabel: '桌面和道具放这里',
      personClass: 'person-right-middle',
      objectClass: 'object-table-bottom'
    }
  },
  {
    id: 'cafe-side',
    category: 'cafe',
    editStyle: { filter: 'fresh', level: 55 },
    categoryName: '咖啡馆/室内',
    title: '侧身看窗外·环境人像',
    visualClass: 'visual-side',
    people: '单人',
    orientation: '横幅',
    difficulty: '入门',
    problem: '让人物和室内环境同时成为主体。',
    cameraGuide: '保留窗户和一部桌面。',
    subjectGuide: '身体侧向窗户，眼睛看向外面。',
    focus: '人物不要站在画面正中，给窗外留空间。',
    conditions: '适合窗外有街景或风景的室内环境。',
    fallback: '窗外景色不好时，改拍室内墙面和桌面。',
    steps: [
      '让人物站到人物框内一侧。',
      '让窗外或室内细节位于拍摄对象框内。',
      '轻轻转身，按快门。'
    ],
    overlay: {
      personLabel: '人物站这里',
      objectLabel: '窗外景色放这里',
      personClass: 'person-left-middle',
      objectClass: 'object-window-right'
    }
  },
  {
    id: 'couple-side',
    category: 'couple',
    editStyle: { filter: 'fresh', level: 50 },
    categoryName: '双人合照',
    title: '并肩留白·双人合照',
    visualClass: 'visual-couple',
    people: '双人',
    orientation: '横幅',
    difficulty: '入门',
    problem: '让两个人不贴成一排，画面更轻松。',
    cameraGuide: '保留两人周围留白，镜头与眼睛平齐。',
    subjectGuide: '肩膀不必平齐，一人轻轻侧身。',
    focus: '让两个人之间留一点空间。',
    conditions: '适合两人横拍。',
    fallback: '空间太小时，改拍半身并靠近两人。',
    steps: [
      '第一个人站到左侧人物框。',
      '第二个人站到右侧人物框。',
      '两人同时看向镜头。'
    ],
    overlay: {
      personLabel: '人物 A 站这里',
      objectLabel: '人物 B 站这里',
      personClass: 'person-left-wide',
      objectClass: 'person-right-wide'
    }
  },
  {
    id: 'couple-depth',
    category: 'couple',
    editStyle: { filter: 'warm', level: 60 },
    categoryName: '双人合照',
    title: '前后层次·双人合照',
    visualClass: 'visual-depth',
    people: '双人',
    orientation: '竖幅',
    difficulty: '入门',
    problem: '用前后距离让双人照更有立体感。',
    cameraGuide: '保持距离，以前面人物为对焦。',
    subjectGuide: '一人靠近镜头，一人后退一步。',
    focus: '前后两人不要重叠，脸部都要可见。',
    conditions: '适合有足够前后空间的场景。',
    fallback: '空间不足时，改为并排坐姿。',
    steps: [
      '人物 A 站到前景人物框。',
      '人物 B 站到后景人物框。',
      '缩小后让两张脸都进入画面。'
    ],
    overlay: {
      personLabel: '人物 A 站这里',
      objectLabel: '人物 B 站后面',
      personClass: 'person-front-center',
      objectClass: 'person-back-center'
    }
  },
  {
    id: 'couple-interact',
    category: 'couple',
    editStyle: { filter: 'vintage', level: 55 },
    categoryName: '双人合照',
    title: '静态互动·看同一件事物',
    visualClass: 'visual-interact',
    people: '双人',
    orientation: '横幅',
    difficulty: '入门',
    problem: '用静态互动让合照更自然。',
    cameraGuide: '选择杯子、地图或风景作为互动物。',
    subjectGuide: '靠近，同时看向手中的东西。',
    focus: '不需要夸张动作，只需要有同一个注意力中心。',
    conditions: '需要一个可以两人共同看的物品。',
    fallback: '没有物品时，让两人同时看向风景或远方。',
    steps: [
      '两人分别站到人物框内。',
      '把互动物放到中间拍摄对象框。',
      '保持肩膀放松，按快门。'
    ],
    overlay: {
      personLabel: '两人站在这里',
      objectLabel: '互动物放这里',
      personClass: 'person-couple-wide',
      objectClass: 'object-center'
    }
  }
];

templates.forEach((template) => {
  template.shortTitle = template.title.split('·')[0];
  template.sampleImage = sampleImages[template.id] || '';
});

module.exports = { templates };
