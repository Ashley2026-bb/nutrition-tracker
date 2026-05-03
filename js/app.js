// ============================================================
// app.js  —  主逻辑：状态、导航、数据操作、启动
// ============================================================

let currentDate = todayKey();
let activeTab = 'food';       // food | calories | nutrition | meds
let appData = {};             // 所有日期数据缓存

// ——— 初始化 ———
document.addEventListener('DOMContentLoaded', () => {
  appData = loadData();
  ensureDay(currentDate);
  initTabs();
  renderCurrentTab();
  setupInstall();
  // 每日食物输入弹窗关闭时保存
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if(e.target === document.getElementById('modalOverlay')) closeModal();
  });
});

function ensureDay(dk){
  if(!appData[dk]) appData[dk] = {food:[], med:[]};
}

// ——— Tab 导航 ———
function initTabs(){
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(t => t.addEventListener('click', () => {
    activeTab = t.dataset.tab;
    tabs.forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    renderCurrentTab();
  }));
  // 设置默认选中
  document.querySelector('[data-tab="food"]').classList.add('active');
}

function renderCurrentTab(){
  const page = document.getElementById('mainPage');
  page.innerHTML = '';
  switch(activeTab){
    case 'food':      renderFoodTab(page); break;
    case 'calories':  renderCaloriesTab(page); break;
    case 'nutrition': renderNutritionTab(page); break;
    case 'meds':      renderMedsTab(page); break;
  }
}

// =============================================
// 分区1：饮食记录
// =============================================
function renderFoodTab(p){
  const day = appData[currentDate] || {food:[], med:[]};

  // 日期导航
  p.appendChild(makeDateNav());

  // 添加按钮
  const addBtn = document.createElement('button');
  addBtn.className = 'add-food-btn';
  addBtn.innerHTML = '＋ 添加食物';
  addBtn.onclick = () => openAddFoodModal();
  p.appendChild(addBtn);

  // 按餐次分组显示
  const MEALS = ['早餐','午餐','晚餐','下午茶','加餐'];
  const byMeal = {};
  (day.food || []).forEach((item, idx) => {
    const m = item.meal || '午餐';
    if(!byMeal[m]) byMeal[m] = [];
    byMeal[m].push({...item, _idx: idx});
  });

  const hasFoods = (day.food || []).length > 0;
  if(!hasFoods){
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<div class="empty-icon">🍽️</div><p>今天还没有记录饮食</p><p class="empty-sub">点击上方「添加食物」开始记录</p>';
    p.appendChild(empty);
    return;
  }

  MEALS.forEach(meal => {
    if(!byMeal[meal] || !byMeal[meal].length) return;
    const block = document.createElement('div');
    block.className = 'meal-block';

    // 计算该餐热量
    const mealCal = byMeal[meal].reduce((s, it) => s + calcCal(it), 0);

    block.innerHTML = `<div class="meal-header"><span class="meal-name">${mealEmoji(meal)} ${meal}</span><span class="meal-cal">${Math.round(mealCal)} kcal</span></div>`;

    byMeal[meal].forEach(item => {
      const row = document.createElement('div');
      row.className = 'food-row';
      const matched = item.matchedId ? FOOD_DB.find(f => f.id === item.matchedId) : null;
      const calStr = matched
        ? `${Math.round(matched.cal * item.grams / 100)} kcal`
        : (item.customCal ? `${item.customCal} kcal(手动)` : '未知热量');
      row.innerHTML = `
        <div class="food-row-main">
          <span class="food-name-text">${item.name}</span>
          <span class="food-gram">${item.grams}g</span>
        </div>
        <div class="food-row-sub">
          <span class="food-cal-text">${calStr}</span>
          ${matched ? '<span class="match-badge">已匹配</span>' : '<span class="match-badge nomatch">手动</span>'}
          <button class="del-btn" onclick="deleteFoodItem(${item._idx})">✕</button>
        </div>`;
      block.appendChild(row);
    });
    p.appendChild(block);
  });
}

function mealEmoji(m){
  return {早餐:'🌅',午餐:'☀️',晚餐:'🌙',下午茶:'☕',加餐:'🍪'}[m] || '🍽️';
}

function calcCal(item){
  if(item.matchedId){
    const f = FOOD_DB.find(x => x.id === item.matchedId);
    if(f) return f.cal * item.grams / 100;
  }
  return item.customCal || 0;
}

function calcNutrient(item, key){
  if(item.matchedId){
    const f = FOOD_DB.find(x => x.id === item.matchedId);
    if(f) return (f[key] || 0) * item.grams / 100;
  }
  if(key === 'cal') return item.customCal || 0;
  return item['custom_'+key] || 0;
}

function deleteFoodItem(idx){
  const day = appData[currentDate];
  day.food.splice(idx, 1);
  saveDayData(currentDate, day);
  appData = loadData();
  renderCurrentTab();
}

// =============================================
// 分区2：热量分析
// =============================================
function renderCaloriesTab(p){
  const day = appData[currentDate] || {food:[], med:[]};
  p.appendChild(makeDateNav());

  const tdee = USER_PROFILE.tdee;
  const totalCal = (day.food || []).reduce((s, it) => s + calcCal(it), 0);
  const pct = Math.min(150, Math.round(totalCal / tdee * 100));
  const diff = totalCal - tdee;

  // 个人信息卡
  const profileCard = document.createElement('div');
  profileCard.className = 'info-card';
  profileCard.innerHTML = `
    <div class="info-card-title">👤 个人信息</div>
    <div class="info-grid">
      <div class="info-item"><span class="info-label">年龄</span><span class="info-val">29岁</span></div>
      <div class="info-item"><span class="info-label">性别</span><span class="info-val">女性</span></div>
      <div class="info-item"><span class="info-label">身高</span><span class="info-val">163 cm</span></div>
      <div class="info-item"><span class="info-label">体重</span><span class="info-val">51 kg</span></div>
      <div class="info-item"><span class="info-label">基础代谢</span><span class="info-val">${Math.round(USER_PROFILE.bmr)} kcal</span></div>
      <div class="info-item"><span class="info-label">每日目标</span><span class="info-val">${tdee} kcal</span></div>
    </div>
    <div class="info-note">* 按轻体力活动水平估算（TDEE = BMR × 1.375）</div>`;
  p.appendChild(profileCard);

  // 热量仪表盘
  const gauge = document.createElement('div');
  gauge.className = 'cal-gauge';
  const gaugeColor = pct > 110 ? '#ef4444' : pct > 90 ? '#22c55e' : '#f59e0b';
  gauge.innerHTML = `
    <div class="gauge-title">🔥 今日热量</div>
    <div class="gauge-ring-wrap">
      <svg class="gauge-svg" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" stroke-width="12"/>
        <circle cx="60" cy="60" r="50" fill="none" stroke="${gaugeColor}" stroke-width="12"
          stroke-dasharray="${Math.min(100,pct)*3.14},314"
          stroke-linecap="round"
          transform="rotate(-90 60 60)"/>
      </svg>
      <div class="gauge-center">
        <div class="gauge-val">${Math.round(totalCal)}</div>
        <div class="gauge-unit">kcal</div>
      </div>
    </div>
    <div class="gauge-target">目标 ${tdee} kcal · 已达 ${pct}%</div>`;
  p.appendChild(gauge);

  // 状态提示
  const tip = document.createElement('div');
  tip.className = 'status-tip ' + (diff > 200 ? 'tip-danger' : diff < -200 ? 'tip-warn' : 'tip-ok');
  if(diff > 200){
    tip.innerHTML = `⚠️ 今日热量超出 <b>${Math.round(diff)} kcal</b>，建议减少主食或高脂食物，适量增加运动。`;
  } else if(diff < -300){
    tip.innerHTML = `💡 今日热量不足，还差 <b>${Math.round(-diff)} kcal</b>，建议适当补充主食或蛋白质，避免过度节食。`;
  } else if(diff < -100){
    tip.innerHTML = `✅ 热量略微偏低，还差 <b>${Math.round(-diff)} kcal</b>，可适当补充。`;
  } else {
    tip.innerHTML = `✅ 热量摄入良好，在目标范围内，继续保持！`;
  }
  p.appendChild(tip);

  // 按餐次热量分布
  if((day.food || []).length > 0){
    const distCard = document.createElement('div');
    distCard.className = 'dist-card';
    distCard.innerHTML = '<div class="dist-title">餐次热量分布</div>';
    const MEALS = ['早餐','午餐','晚餐','下午茶','加餐'];
    MEALS.forEach(meal => {
      const items = (day.food || []).filter(it => (it.meal || '午餐') === meal);
      if(!items.length) return;
      const mc = items.reduce((s, it) => s + calcCal(it), 0);
      const mpct = totalCal > 0 ? Math.round(mc / totalCal * 100) : 0;
      distCard.innerHTML += `
        <div class="dist-row">
          <span class="dist-label">${mealEmoji(meal)} ${meal}</span>
          <div class="dist-bar-wrap"><div class="dist-bar" style="width:${mpct}%"></div></div>
          <span class="dist-val">${Math.round(mc)} kcal (${mpct}%)</span>
        </div>`;
    });
    p.appendChild(distCard);
  }

  // 减肥建议
  const advCard = document.createElement('div');
  advCard.className = 'adv-card';
  advCard.innerHTML = `
    <div class="adv-title">💡 减肥参考</div>
    <div class="adv-body">
      <p>你的每日维持热量约 <b>${tdee} kcal</b>。</p>
      <p>每减少摄入 <b>500 kcal/天</b>，每周可减约 <b>0.5kg</b> 体重。</p>
      <p>建议控制在 <b>${tdee - 300}～${tdee - 100} kcal/天</b> 之间，既能减肥又不影响健康。</p>
      <p style="margin-top:8px;color:#ef4444">⚠️ 不建议低于 <b>1200 kcal/天</b>，否则可能影响基础代谢。</p>
    </div>`;
  p.appendChild(advCard);
}

// =============================================
// 分区3：营养分析
// =============================================
function renderNutritionTab(p){
  const day = appData[currentDate] || {food:[], med:[]};
  p.appendChild(makeDateNav());

  // 计算今日各营养素摄入
  const intake = {cal:0, protein:0, ca:0, b1:0, b2:0, b6:0, vc:0};
  (day.food || []).forEach(item => {
    intake.cal     += calcNutrient(item, 'cal');
    intake.protein += calcNutrient(item, 'protein');
    intake.ca      += calcNutrient(item, 'ca');
    intake.b1      += calcNutrient(item, 'b1');
    intake.b2      += calcNutrient(item, 'b2');
    intake.b6      += calcNutrient(item, 'b6');
    intake.vc      += calcNutrient(item, 'vc');
  });

  const nutrients = [
    {key:'protein', label:'蛋白质',  icon:'💪', unit:'g',  dri:DRI.protein, tipFood:'鸡胸肉、鱼肉、鸡蛋、豆腐', tipSupp:null},
    {key:'ca',      label:'钙',      icon:'🦷', unit:'mg', dri:DRI.ca,      tipFood:'牛奶、豆腐、虾皮、海带、奶酪', tipSupp:'钙片'},
    {key:'b1',      label:'维生素B1',icon:'🌾', unit:'mg', dri:DRI.b1,      tipFood:'瘦猪肉、全麦面包、燕麦片、花生', tipSupp:'维生素B1片'},
    {key:'b2',      label:'维生素B2',icon:'🥛', unit:'mg', dri:DRI.b2,      tipFood:'牛奶、鸡蛋、木耳、蘑菇、杏仁', tipSupp:'维生素B2片'},
    {key:'b6',      label:'维生素B6',icon:'🐟', unit:'mg', dri:DRI.b6,      tipFood:'鸡胸肉、三文鱼、土豆、香蕉', tipSupp:'维生素B6片'},
    {key:'vc',      label:'维生素C', icon:'🍊', unit:'mg', dri:DRI.vc,      tipFood:'西兰花、青椒、猕猴桃、草莓、橙子', tipSupp:'维生素C片'}
  ];

  const header = document.createElement('div');
  header.className = 'nutr-header';
  header.innerHTML = '<div class="section-title">🌿 营养素摄入分析</div>';
  p.appendChild(header);

  nutrients.forEach(n => {
    const val = intake[n.key];
    const pct = Math.min(150, Math.round(val / n.dri * 100));
    const status = pct >= 100 ? 'ok' : pct >= 60 ? 'low' : 'vlow';
    const statusText = {ok:'✅ 达标', low:'⚠️ 偏低', vlow:'❌ 不足'}[status];
    const statusClass = {ok:'badge-ok', low:'badge-warn', vlow:'badge-danger'}[status];

    const card = document.createElement('div');
    card.className = 'nutr-card';

    let tipHtml = '';
    if(status !== 'ok'){
      tipHtml = `<div class="nutr-tip">
        🥗 <b>优先食补：</b>${n.tipFood}`;
      if(n.tipSupp) tipHtml += `<br>💊 <b>食补不足时：</b>可考虑服用${n.tipSupp}`;
      tipHtml += `</div>`;
    } else {
      // 超标提示
      if(pct > 200){
        tipHtml = `<div class="nutr-tip nutr-over">⚠️ 今日摄入超过推荐量2倍，注意控制。</div>`;
      }
    }

    card.innerHTML = `
      <div class="nutr-row1">
        <span class="nutr-icon">${n.icon}</span>
        <span class="nutr-label">${n.label}</span>
        <span class="badge ${statusClass}">${statusText}</span>
      </div>
      <div class="nutr-bar-wrap">
        <div class="nutr-bar ${status}" style="width:${Math.min(100,pct)}%"></div>
      </div>
      <div class="nutr-vals">
        <span>已摄入 <b>${val < 1 ? val.toFixed(2) : Math.round(val)} ${n.unit}</b></span>
        <span>每日推荐 ${n.dri} ${n.unit}</span>
        <span>${pct}%</span>
      </div>
      ${tipHtml}`;
    p.appendChild(card);
  });

  // 综合建议
  const lacks = nutrients.filter(n => (intake[n.key] / n.dri) < 0.6);
  if(lacks.length > 0){
    const sumCard = document.createElement('div');
    sumCard.className = 'adv-card';
    sumCard.innerHTML = `<div class="adv-title">📋 今日综合建议</div><div class="adv-body">
      <p>以下营养素摄入不足：<b>${lacks.map(n=>n.label).join('、')}</b></p>
      <p>建议明日饮食中重点补充相应食物。长期不足可考虑适当服用营养补充剂。</p>
    </div>`;
    p.appendChild(sumCard);
  }
}

// =============================================
// 分区4：吃药记录
// =============================================
function renderMedsTab(p){
  const day = appData[currentDate] || {food:[], med:[]};
  p.appendChild(makeDateNav());

  const header = document.createElement('div');
  header.className = 'section-title';
  header.innerHTML = '💊 今日用药记录';
  p.appendChild(header);

  const note = document.createElement('div');
  note.className = 'med-note';
  note.innerHTML = '📝 此区域仅用于记录，不做营养分析。';
  p.appendChild(note);

  // 已记录药品
  if((day.med || []).length > 0){
    const list = document.createElement('div');
    list.className = 'med-list';
    (day.med || []).forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'med-row';
      const medInfo = MED_DB.find(m => m.id === item.medId);
      const name = medInfo ? medInfo.name : (item.customName || '未知');
      const note2 = medInfo ? medInfo.note : '';
      row.innerHTML = `
        <div class="med-row-main">
          <span class="med-dot"></span>
          <div class="med-row-info">
            <span class="med-name">${name}</span>
            <span class="med-dose">${item.dose} ${item.unit || '片'}</span>
          </div>
        </div>
        <div class="med-row-sub">
          <span class="med-time">${item.time || ''}</span>
          ${note2 ? `<span class="med-hint">${note2}</span>` : ''}
          <button class="del-btn" onclick="deleteMedItem(${idx})">✕</button>
        </div>`;
      list.appendChild(row);
    });
    p.appendChild(list);
  } else {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<div class="empty-icon">💊</div><p>今天还没有用药记录</p>';
    p.appendChild(empty);
  }

  // 快捷添加固定药品
  const quickTitle = document.createElement('div');
  quickTitle.className = 'quick-title';
  quickTitle.innerHTML = '快捷添加';
  p.appendChild(quickTitle);

  const grid = document.createElement('div');
  grid.className = 'med-grid';
  MED_DB.forEach(med => {
    const taken = (day.med || []).some(it => it.medId === med.id);
    const btn = document.createElement('button');
    btn.className = 'med-quick-btn' + (taken ? ' taken' : '');
    btn.innerHTML = (taken ? '✅ ' : '＋ ') + med.name;
    btn.onclick = () => openAddMedModal(med);
    grid.appendChild(btn);
  });
  p.appendChild(grid);

  // 自定义药品入口
  const customBtn = document.createElement('button');
  customBtn.className = 'custom-med-btn';
  customBtn.innerHTML = '＋ 添加其他药品';
  customBtn.onclick = () => openAddMedModal(null);
  p.appendChild(customBtn);
}

function deleteMedItem(idx){
  const day = appData[currentDate] || {food:[], med:[]};
  (day.med || []).splice(idx, 1);
  saveDayData(currentDate, day);
  appData = loadData();
  renderCurrentTab();
}

// =============================================
// 日期导航
// =============================================
function makeDateNav(){
  const nav = document.createElement('div');
  nav.className = 'date-nav';
  const prev = document.createElement('button');
  prev.className = 'date-btn';
  prev.innerHTML = '‹';
  prev.onclick = () => shiftDate(-1);
  const label = document.createElement('div');
  label.className = 'date-label';
  const d = new Date(currentDate);
  const isToday = currentDate === todayKey();
  label.innerHTML = `<span class="date-main">${currentDate}</span><span class="date-sub">${['周日','周一','周二','周三','周四','周五','周六'][d.getDay()]}${isToday?' · 今天':''}</span>`;
  const next = document.createElement('button');
  next.className = 'date-btn';
  next.innerHTML = '›';
  next.onclick = () => shiftDate(1);
  next.disabled = isToday;
  nav.appendChild(prev); nav.appendChild(label); nav.appendChild(next);
  return nav;
}

function shiftDate(delta){
  const d = new Date(currentDate);
  d.setDate(d.getDate() + delta);
  const newKey = d.toISOString().slice(0,10);
  if(newKey > todayKey()) return;
  currentDate = newKey;
  ensureDay(currentDate);
  renderCurrentTab();
}

// =============================================
// 弹窗：添加食物
// =============================================
function openAddFoodModal(){
  const overlay = document.getElementById('modalOverlay');
  const modal   = document.getElementById('modalBox');
  overlay.style.display = 'flex';

  modal.innerHTML = `
    <div class="modal-header"><h3>🍽️ 添加食物</h3><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="field-row">
        <label>餐次</label>
        <select id="mealSelect">
          <option>早餐</option><option selected>午餐</option><option>晚餐</option><option>下午茶</option><option>加餐</option>
        </select>
      </div>
      <div class="field-row">
        <label>食物名称</label>
        <input id="foodNameInput" type="text" placeholder="如：白米饭、西兰花、鸡胸肉…" oninput="onFoodNameInput(this.value)"/>
      </div>
      <div id="matchHint" class="match-hint"></div>
      <div class="field-row">
        <label>克重 (g)</label>
        <input id="foodGramInput" type="number" placeholder="如：150" min="1" max="9999"/>
      </div>
      <div id="manualNutrBox" style="display:none">
        <div class="manual-hint">⚠️ 未匹配到食材数据库，请手动输入（可选）：</div>
        <div class="field-row">
          <label>热量 (kcal)</label>
          <input id="manualCal" type="number" placeholder="每100g热量"/>
        </div>
        <div class="field-row">
          <label>蛋白质 (g)</label>
          <input id="manualProtein" type="number" placeholder="每100g蛋白质"/>
        </div>
        <div class="field-row">
          <label>钙 (mg)</label>
          <input id="manualCa" type="number" placeholder="每100g钙"/>
        </div>
        <div class="field-row">
          <label>维生素C (mg)</label>
          <input id="manualVc" type="number" placeholder="每100g维C"/>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-cancel" onclick="closeModal()">取消</button>
      <button class="btn-confirm" onclick="confirmAddFood()">确认添加</button>
    </div>`;
}

let _currentMatchedFood = null;

function onFoodNameInput(val){
  const hint = document.getElementById('matchHint');
  const manualBox = document.getElementById('manualNutrBox');
  if(!val.trim()){ hint.innerHTML = ''; manualBox.style.display='none'; _currentMatchedFood=null; return; }
  const matched = lookupFood(val);
  _currentMatchedFood = matched;
  if(matched){
    hint.innerHTML = `<span class="matched">✅ 已匹配：<b>${matched.name}</b>（每100g：${matched.cal}kcal，蛋白质${matched.protein}g，钙${matched.ca}mg，维C${matched.vc}mg）</span>`;
    manualBox.style.display = 'none';
  } else {
    hint.innerHTML = `<span class="unmatched">❓ 未找到"${val}"，可手动输入营养数据（或留空跳过）</span>`;
    manualBox.style.display = 'block';
  }
}

function confirmAddFood(){
  const name  = document.getElementById('foodNameInput').value.trim();
  const grams = parseFloat(document.getElementById('foodGramInput').value);
  const meal  = document.getElementById('mealSelect').value;
  if(!name){ alert('请输入食物名称'); return; }
  if(!grams || grams <= 0){ alert('请输入有效的克重'); return; }

  const item = {name, grams, meal, time: new Date().toTimeString().slice(0,5)};
  if(_currentMatchedFood){
    item.matchedId = _currentMatchedFood.id;
  } else {
    const mc = parseFloat(document.getElementById('manualCal').value);
    const mp = parseFloat(document.getElementById('manualProtein').value);
    const mca = parseFloat(document.getElementById('manualCa').value);
    const mvc = parseFloat(document.getElementById('manualVc').value);
    if(mc && !isNaN(mc)) item.customCal     = Math.round(mc * grams / 100);
    if(mp && !isNaN(mp)) item.custom_protein = Math.round(mp * grams / 100 * 10) / 10;
    if(mca && !isNaN(mca)) item.custom_ca   = Math.round(mca * grams / 100);
    if(mvc && !isNaN(mvc)) item.custom_vc   = Math.round(mvc * grams / 100);
  }

  const day = appData[currentDate] || {food:[], med:[]};
  day.food.push(item);
  saveDayData(currentDate, day);
  appData = loadData();
  closeModal();
  // 添加完自动回到饮食分区
  activeTab = 'food';
  document.querySelectorAll('.tab-btn').forEach(t => t.classList.toggle('active', t.dataset.tab === 'food'));
  renderCurrentTab();
}

// =============================================
// 弹窗：添加药品
// =============================================
function openAddMedModal(med){
  const overlay = document.getElementById('modalOverlay');
  const modal   = document.getElementById('modalBox');
  overlay.style.display = 'flex';

  const isCustom = !med;
  modal.innerHTML = `
    <div class="modal-header"><h3>💊 ${isCustom ? '添加其他药品' : '记录服药：' + med.name}</h3><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      ${isCustom ? `<div class="field-row"><label>药品名称</label><input id="customMedName" type="text" placeholder="输入药品名称"/></div>` : `<div class="med-modal-info">${med.note || ''}</div>`}
      <div class="field-row">
        <label>剂量</label>
        <input id="medDoseInput" type="number" step="0.5" min="0.5" max="20" value="1" placeholder="如 1、1.5、2"/>
      </div>
      <div class="field-row">
        <label>单位</label>
        <select id="medUnitSelect">
          <option value="片">片</option>
          <option value="粒">粒</option>
          <option value="mg">mg</option>
          <option value="ml">ml</option>
        </select>
      </div>
      <div class="field-row">
        <label>服药时间</label>
        <input id="medTimeInput" type="time" value="${new Date().toTimeString().slice(0,5)}"/>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-cancel" onclick="closeModal()">取消</button>
      <button class="btn-confirm" onclick="confirmAddMed(${isCustom ? 'null' : `'${med.id}'`})">确认记录</button>
    </div>`;
}

function confirmAddMed(medId){
  const dose = parseFloat(document.getElementById('medDoseInput').value);
  const unit = document.getElementById('medUnitSelect').value;
  const time = document.getElementById('medTimeInput').value;
  if(!dose || dose <= 0){ alert('请输入有效剂量'); return; }

  const item = {dose, unit, time};
  if(medId && medId !== 'null'){
    item.medId = medId;
  } else {
    const customName = document.getElementById('customMedName')?.value?.trim();
    if(!customName){ alert('请输入药品名称'); return; }
    item.customName = customName;
  }

  const day = appData[currentDate] || {food:[], med:[]};
  if(!day.med) day.med = [];
  day.med.push(item);
  saveDayData(currentDate, day);
  appData = loadData();
  closeModal();
  renderCurrentTab();
}

function closeModal(){
  document.getElementById('modalOverlay').style.display = 'none';
  _currentMatchedFood = null;
}

// =============================================
// PWA 安装提示
// =============================================
let _deferredPrompt = null;
function setupInstall(){
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _deferredPrompt = e;
    const banner = document.getElementById('installBanner');
    if(banner) banner.style.display = 'flex';
  });
  const installBtn = document.getElementById('installBtn');
  if(installBtn) installBtn.addEventListener('click', async () => {
    if(!_deferredPrompt) return;
    _deferredPrompt.prompt();
    await _deferredPrompt.userChoice;
    _deferredPrompt = null;
    document.getElementById('installBanner').style.display = 'none';
  });
}
