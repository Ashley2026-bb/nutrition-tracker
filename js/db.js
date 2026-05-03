// ============================================================
// db.js  —  食材数据库 + 用户信息 + 营养参考值
// ============================================================

// 个人数据
const USER_PROFILE = {
  age: 29, gender: 'female', height: 163, weight: 51,
  // BMR (Mifflin-St Jeor)
  get bmr(){ return 10*this.weight + 6.25*this.height - 5*this.age - 161; },
  // TDEE: 轻体力 × 1.375
  get tdee(){ return Math.round(this.bmr * 1.375); }
};

// DRI 每日推荐摄入量（中国营养学会标准）
const DRI = {
  cal:  USER_PROFILE.tdee,  // 动态，每次用 USER_PROFILE.tdee
  protein: 55,   // g  成年女性
  ca:  800,      // mg
  b1:  1.2,      // mg
  b2:  1.2,      // mg
  b6:  1.4,      // mg
  vc:  100       // mg
};

// 食材数据库（每100g含量）
// 字段: id, name, cal(kcal), protein(g), ca(mg), b1(mg), b2(mg), b6(mg), vc(mg)
const FOOD_DB = [
  // 主食
  {id:'f01',name:'白米饭',    cal:116, protein:2.6, ca:13,  b1:0.02, b2:0.03, b6:0.02, vc:0},
  {id:'f02',name:'煮面条',    cal:109, protein:3.5, ca:12,  b1:0.11, b2:0.04, b6:0.04, vc:0},
  {id:'f03',name:'馒头',      cal:223, protein:7.0, ca:38,  b1:0.07, b2:0.06, b6:0.05, vc:0},
  {id:'f04',name:'白面包',    cal:265, protein:8.0, ca:65,  b1:0.14, b2:0.08, b6:0.05, vc:0},
  {id:'f05',name:'全麦面包',  cal:247, protein:9.0, ca:60,  b1:0.20, b2:0.11, b6:0.12, vc:0},
  {id:'f06',name:'燕麦片',    cal:367, protein:13,  ca:54,  b1:0.46, b2:0.15, b6:0.12, vc:0},
  {id:'f07',name:'小米粥',    cal:46,  protein:1.4, ca:10,  b1:0.07, b2:0.02, b6:0.05, vc:0},
  {id:'f08',name:'糯米饭',    cal:350, protein:7.3, ca:26,  b1:0.11, b2:0.04, b6:0.07, vc:0},
  {id:'f09',name:'玉米',      cal:112, protein:4.0, ca:14,  b1:0.16, b2:0.11, b6:0.15, vc:12},
  {id:'f10',name:'土豆',      cal:77,  protein:2.0, ca:8,   b1:0.08, b2:0.03, b6:0.30, vc:14},
  {id:'f11',name:'红薯',      cal:99,  protein:1.5, ca:23,  b1:0.04, b2:0.04, b6:0.29, vc:26},
  {id:'f12',name:'粉丝',      cal:337, protein:0.5, ca:31,  b1:0.01, b2:0.01, b6:0.01, vc:0},
  // 肉禽
  {id:'m01',name:'鸡胸肉',    cal:133, protein:24,  ca:9,   b1:0.07, b2:0.11, b6:0.90, vc:0},
  {id:'m02',name:'猪瘦肉',    cal:143, protein:20,  ca:6,   b1:0.54, b2:0.10, b6:0.40, vc:0},
  {id:'m03',name:'猪五花',    cal:349, protein:14,  ca:9,   b1:0.36, b2:0.08, b6:0.32, vc:0},
  {id:'m04',name:'牛肉',      cal:125, protein:20,  ca:9,   b1:0.04, b2:0.14, b6:0.38, vc:0},
  {id:'m05',name:'羊肉',      cal:203, protein:19,  ca:9,   b1:0.05, b2:0.14, b6:0.32, vc:0},
  {id:'m06',name:'鸡腿肉',    cal:181, protein:16,  ca:9,   b1:0.07, b2:0.15, b6:0.63, vc:0},
  {id:'m07',name:'火腿肠',    cal:212, protein:14,  ca:10,  b1:0.20, b2:0.08, b6:0.30, vc:0},
  {id:'m08',name:'培根',      cal:302, protein:12,  ca:10,  b1:0.41, b2:0.17, b6:0.28, vc:0},
  {id:'m09',name:'鸭肉',      cal:240, protein:16,  ca:11,  b1:0.08, b2:0.22, b6:0.20, vc:0},
  // 水产
  {id:'s01',name:'草鱼',      cal:113, protein:16,  ca:38,  b1:0.04, b2:0.11, b6:0.12, vc:0},
  {id:'s02',name:'三文鱼',    cal:208, protein:20,  ca:13,  b1:0.23, b2:0.38, b6:0.63, vc:4},
  {id:'s03',name:'虾仁',      cal:93,  protein:19,  ca:35,  b1:0.01, b2:0.04, b6:0.10, vc:0},
  {id:'s04',name:'对虾',      cal:93,  protein:18,  ca:62,  b1:0.01, b2:0.05, b6:0.10, vc:0},
  {id:'s05',name:'鱿鱼',      cal:92,  protein:17,  ca:43,  b1:0.03, b2:0.09, b6:0.04, vc:0},
  {id:'s06',name:'带鱼',      cal:127, protein:17,  ca:28,  b1:0.02, b2:0.06, b6:0.19, vc:0},
  {id:'s07',name:'金枪鱼罐头',cal:116, protein:26,  ca:17,  b1:0.01, b2:0.10, b6:0.30, vc:0},
  {id:'s08',name:'螃蟹',      cal:103, protein:17,  ca:126, b1:0.06, b2:0.28, b6:0.18, vc:7},
  // 蛋奶豆
  {id:'e01',name:'鸡蛋',      cal:144, protein:13,  ca:56,  b1:0.11, b2:0.32, b6:0.11, vc:0},
  {id:'e02',name:'荷包蛋',    cal:154, protein:12,  ca:55,  b1:0.08, b2:0.25, b6:0.10, vc:0},
  {id:'e03',name:'全脂牛奶',  cal:66,  protein:3.3, ca:120, b1:0.04, b2:0.17, b6:0.04, vc:1},
  {id:'e04',name:'低脂牛奶',  cal:42,  protein:3.5, ca:130, b1:0.04, b2:0.18, b6:0.04, vc:1},
  {id:'e05',name:'酸奶',      cal:72,  protein:3.0, ca:118, b1:0.04, b2:0.19, b6:0.07, vc:1},
  {id:'e06',name:'豆浆',      cal:30,  protein:3.0, ca:10,  b1:0.04, b2:0.02, b6:0.03, vc:0},
  {id:'e07',name:'豆腐',      cal:81,  protein:8.1, ca:164, b1:0.04, b2:0.03, b6:0.06, vc:0},
  {id:'e08',name:'奶酪',      cal:328, protein:25,  ca:799, b1:0.02, b2:0.38, b6:0.07, vc:0},
  {id:'e09',name:'豆腐干',    cal:140, protein:15,  ca:308, b1:0.04, b2:0.05, b6:0.08, vc:0},
  // 蔬菜
  {id:'v01',name:'菠菜',      cal:28,  protein:2.9, ca:99,  b1:0.04, b2:0.11, b6:0.20, vc:32},
  {id:'v02',name:'西兰花',    cal:34,  protein:3.7, ca:67,  b1:0.07, b2:0.12, b6:0.18, vc:89},
  {id:'v03',name:'大白菜',    cal:17,  protein:1.5, ca:50,  b1:0.04, b2:0.05, b6:0.10, vc:47},
  {id:'v04',name:'番茄',      cal:18,  protein:0.9, ca:10,  b1:0.03, b2:0.03, b6:0.08, vc:19},
  {id:'v05',name:'黄瓜',      cal:16,  protein:0.8, ca:24,  b1:0.03, b2:0.03, b6:0.07, vc:9},
  {id:'v06',name:'胡萝卜',    cal:41,  protein:0.9, ca:32,  b1:0.04, b2:0.04, b6:0.14, vc:13},
  {id:'v07',name:'茄子',      cal:25,  protein:1.1, ca:24,  b1:0.03, b2:0.04, b6:0.09, vc:5},
  {id:'v08',name:'豆角',      cal:30,  protein:2.0, ca:45,  b1:0.07, b2:0.07, b6:0.15, vc:18},
  {id:'v09',name:'青椒',      cal:27,  protein:1.4, ca:14,  b1:0.04, b2:0.04, b6:0.27, vc:72},
  {id:'v10',name:'西红柿炒鸡蛋',cal:95,protein:5.0,ca:40, b1:0.06, b2:0.14, b6:0.08, vc:15},
  {id:'v11',name:'花椰菜',    cal:25,  protein:2.0, ca:23,  b1:0.06, b2:0.06, b6:0.22, vc:46},
  {id:'v12',name:'生菜',      cal:16,  protein:1.3, ca:35,  b1:0.07, b2:0.08, b6:0.10, vc:13},
  {id:'v13',name:'洋葱',      cal:40,  protein:1.1, ca:23,  b1:0.05, b2:0.02, b6:0.18, vc:7},
  {id:'v14',name:'蘑菇',      cal:22,  protein:3.1, ca:6,   b1:0.07, b2:0.35, b6:0.11, vc:2},
  {id:'v15',name:'木耳',      cal:205, protein:12,  ca:247, b1:0.17, b2:0.44, b6:0.20, vc:0},
  {id:'v16',name:'海带',      cal:17,  protein:1.2, ca:241, b1:0.02, b2:0.15, b6:0.02, vc:2},
  {id:'v17',name:'芹菜',      cal:14,  protein:0.8, ca:80,  b1:0.01, b2:0.04, b6:0.09, vc:8},
  {id:'v18',name:'韭菜',      cal:29,  protein:2.4, ca:42,  b1:0.02, b2:0.09, b6:0.27, vc:24},
  // 水果
  {id:'fr1',name:'苹果',      cal:54,  protein:0.3, ca:4,   b1:0.02, b2:0.01, b6:0.04, vc:4},
  {id:'fr2',name:'香蕉',      cal:93,  protein:1.1, ca:7,   b1:0.03, b2:0.05, b6:0.37, vc:9},
  {id:'fr3',name:'橙子',      cal:48,  protein:0.9, ca:20,  b1:0.05, b2:0.04, b6:0.06, vc:33},
  {id:'fr4',name:'猕猴桃',    cal:61,  protein:1.1, ca:34,  b1:0.02, b2:0.05, b6:0.05, vc:62},
  {id:'fr5',name:'草莓',      cal:32,  protein:0.7, ca:16,  b1:0.02, b2:0.02, b6:0.05, vc:58},
  {id:'fr6',name:'葡萄',      cal:69,  protein:0.6, ca:5,   b1:0.05, b2:0.02, b6:0.09, vc:4},
  {id:'fr7',name:'西瓜',      cal:30,  protein:0.6, ca:8,   b1:0.02, b2:0.01, b6:0.05, vc:6},
  {id:'fr8',name:'梨',        cal:50,  protein:0.4, ca:9,   b1:0.02, b2:0.03, b6:0.03, vc:4},
  {id:'fr9',name:'蓝莓',      cal:57,  protein:0.7, ca:6,   b1:0.04, b2:0.04, b6:0.05, vc:9},
  {id:'fr10',name:'芒果',     cal:65,  protein:0.6, ca:10,  b1:0.03, b2:0.04, b6:0.12, vc:23},
  {id:'fr11',name:'桃子',     cal:39,  protein:0.9, ca:6,   b1:0.02, b2:0.03, b6:0.02, vc:9},
  {id:'fr12',name:'柚子',     cal:42,  protein:0.8, ca:4,   b1:0.04, b2:0.02, b6:0.04, vc:23},
  // 坚果零食
  {id:'n01',name:'核桃',      cal:654, protein:15,  ca:98,  b1:0.17, b2:0.13, b6:0.54, vc:1},
  {id:'n02',name:'杏仁',      cal:578, protein:21,  ca:248, b1:0.24, b2:1.01, b6:0.15, vc:0},
  {id:'n03',name:'花生',      cal:567, protein:26,  ca:92,  b1:0.64, b2:0.13, b6:0.35, vc:0},
  {id:'n04',name:'腰果',      cal:553, protein:18,  ca:37,  b1:0.42, b2:0.06, b6:0.42, vc:0},
  {id:'n05',name:'瓜子',      cal:616, protein:23,  ca:72,  b1:0.67, b2:0.35, b6:0.48, vc:0},
  // 调味品/常见组合
  {id:'c01',name:'食用油(烹调)',cal:900,protein:0,  ca:0,   b1:0,    b2:0,    b6:0,    vc:0},
  {id:'c02',name:'米粉',      cal:105, protein:1.6, ca:6,   b1:0.02, b2:0.01, b6:0.03, vc:0},
  {id:'c03',name:'饺子',      cal:239, protein:7.0, ca:18,  b1:0.06, b2:0.05, b6:0.07, vc:1},
  {id:'c04',name:'包子',      cal:226, protein:7.5, ca:20,  b1:0.07, b2:0.06, b6:0.05, vc:0},
  {id:'c05',name:'煮鸡蛋',    cal:144, protein:13,  ca:56,  b1:0.10, b2:0.28, b6:0.10, vc:0},
  {id:'c06',name:'皮蛋',      cal:171, protein:15,  ca:63,  b1:0.06, b2:0.18, b6:0.10, vc:0},
  {id:'c07',name:'咸鸭蛋',    cal:190, protein:13,  ca:118, b1:0.15, b2:0.30, b6:0.12, vc:0}
];

// 固定药品列表
const MED_DB = [
  {id:'med01', name:'优甲乐', unit:'片', note:'左甲状腺素钠，建议早晨空腹'},
  {id:'med02', name:'钙片',   unit:'片', note:'补充钙质，饭后服用'},
  {id:'med03', name:'维生素B1', unit:'片', note:'补充维生素B1'},
  {id:'med04', name:'维生素B2', unit:'片', note:'补充维生素B2'},
  {id:'med05', name:'维生素B3', unit:'片', note:'补充维生素B3（烟酸）'},
  {id:'med06', name:'维生素C', unit:'片', note:'补充维生素C，增强免疫'}
];

// ——— 本地数据存取 ———
function todayKey(){ return new Date().toISOString().slice(0,10); }

function loadData(){
  try { return JSON.parse(localStorage.getItem('dietTrackerV3')||'{}'); }
  catch(e){ return {}; }
}
function saveData(d){ localStorage.setItem('dietTrackerV3', JSON.stringify(d)); }

function getDayData(dateKey){
  const d = loadData();
  if(!d[dateKey]) d[dateKey] = {food:[], med:[]};
  return d;
}

function saveDayData(dateKey, dayObj){
  const d = loadData();
  d[dateKey] = dayObj;
  saveData(d);
}

// 查找食材（fuzzy match）
function lookupFood(name){
  const n = name.trim();
  // 精确匹配
  let hit = FOOD_DB.find(f => f.name === n);
  if(hit) return hit;
  // 模糊包含
  hit = FOOD_DB.find(f => f.name.includes(n) || n.includes(f.name));
  return hit || null;
}
