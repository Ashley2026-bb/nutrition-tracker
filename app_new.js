// ============================================================
//  本地存储 & 全局状态
// ============================================================
const DB_KEY = 'diet_tracker_data';
function loadData()  { try{return JSON.parse(localStorage.getItem(DB_KEY))||{}} catch(e){ return {}; } }
function saveData(d)  { localStorage.setItem(DB_KEY, JSON.stringify(d)); }
function todayKey()   { return new Date().toISOString().slice(0,10); }

let appData     = loadData();
let curDate     = todayKey();
let curView     = 'today';      // today | history | trends
let activeSection = 'food';     // food  | supp   | med

// ============================================================
//  渲染总入口
// ============================================================
function render(){
  const app = document.getElementById('app'); app.innerHTML='';
  renderHeader(app); renderNav(app);
  const w = document.createElement('div'); w.className='content';
  if(curView==='today')   renderToday(w);
  if(curView==='history') renderHistory(w);
  if(curView==='trends')  renderTrends(w);
  app.appendChild(w);
}

function renderHeader(p){
  const h=document.createElement('header');
  h.innerHTML=`<div class="header-inner"><span class="logo">🥗 营养追踪</span><span class="date-display">${fmtDate(curDate)}</span></div>`;
  p.appendChild(h);
}
function renderNav(p){
  const n=document.createElement('nav');
  [ {k:'today', i:'📋', l:'今日'}, {k:'history', i:'📅', l:'历史'}, {k:'trends', i:'📊', l:'趋势'} ].forEach(t=>{
    const b=document.createElement('button');
    b.className='tab-btn'+(curView===t.k?' active':'');
    b.innerHTML=`${t.i} ${t.l}`;
    b.onclick=()=>{ curView=t.k; if(t.k==='today') curDate=todayKey(); render(); };
    n.appendChild(b);
  });
  p.appendChild(n);
}

// ============================================================
//  今日 — 三区切换 Tabs
// ============================================================
function renderToday(p){
  const day = appData[curDate] || { food:[], supp:[], med:[] };

  // 子分区 Tab
  const tabs=document.createElement('div'); tabs.className='section-tabs';
  [ {k:'food',i:'🔥',l:'热量营养'}, {k:'supp',i:'💊',l:'营养补充'}, {k:'med',i:'💉',l:'药品记录'} ].forEach(t=>{
    const b=document.createElement('button');
    b.className='sec-tab'+(activeSection===t.k?' active':'');
    b.innerHTML=`${t.i} ${t.l}`;
    b.onclick=()=>{ activeSection=t.k; render(); };
    tabs.appendChild(b);
  });
  p.appendChild(tabs);

  if(activeSection==='food') renderFoodSec(p,day);
  if(activeSection==='supp') renderSuppSec(p,day);
  if(activeSection==='med')  renderMedSec(p,day);
}

// ============================================================
//  分区 1：热量/营养 — 食品记录
// ============================================================
function renderFoodSec(p,day){
  // ---- 营养汇总卡片 ----
  const totals = calcTotals(day.food||[]);
  p.appendChild(makeNutCard(totals));

  // ---- 添加按钮 ----
  const btn=document.createElement('button');
  btn.className='btn-primary add-btn'; btn.innerHTML='＋ 记录食品';
  btn.onclick=()=>showModal('food');
  p.appendChild(btn);

  if(!day.food||!day.food.length){ p.appendChild(emptyDiv('还没有记录，点上方按钮开始')); return; }

  ['早餐','午餐','晚餐','加餐'].forEach(mt=>{
    const items=(day.food||[]).filter(m=>m.mealType===mt);
    if(!items.length) return;
    const sec=document.createElement('div'); sec.className='meal-section';
    sec.innerHTML=`<div class="meal-section-title">${mealIcon(mt)} ${mt}</div>`;
    items.forEach((item,i)=>{
      const gi=(day.food||[]).indexOf(item);
      sec.appendChild(makeFoodCard(item,gi,false));
    });
    p.appendChild(sec);
  });
}

// ============================================================
//  分区 2：营养补充剂
// ============================================================
function renderSuppSec(p,day){
  const totals=calcTotals(day.supp||[]);
  const card=document.createElement('div'); card.className='nutrition-card';
  card.innerHTML='<div class="card-title">💊 今日补充剂汇总</div>'+
    ['calcium','vitB1','vitB2','vitB6','vitC'].map(k=>{
      const L={calcium:'钙',vitB1:'维生素B1',vitB2:'维生素B2',vitB6:'维生素B6',vitC:'维生素C'};
      const U={calcium:'mg',vitB1:'mg',vitB2:'mg',vitB6:'mg',vitC:'mg'};
      const d=DRI[k]; const v=(totals[k]||0);
      const pct=Math.min(100,Math.round(v/d*100));
      const cls=pct>=80?'ok':pct>=50?'low':'deficient';
      const col=k==='calcium'?'#3b82f6':k==='vitC'?'#f59e0b':'#a855f7';
      return `<div class="nutrient-row">
        <div class="nutrient-label"><span>${L[k]}</span><span class="status-badge ${cls}">${pct>=80?'充足':pct>=50?'偏低':'不足'}</span></div>
        <div class="progress-wrap"><div class="progress-bar" style="width:${pct}%;background:${col}"></div></div>
        <div class="nutrient-val">${Math.round(v*10)/10} / ${d} ${U[k]} (${pct}%)</div>
      </div>`;
    }).join('');
  p.appendChild(card);

  const btn=document.createElement('button');
  btn.className='btn-primary add-btn'; btn.innerHTML='＋ 记录补充剂';
  btn.onclick=()=>showModal('supp');
  p.appendChild(btn);

  if(!day.supp||!day.supp.length){ p.appendChild(emptyDiv('还没有补充剂记录')); return; }
  const sec=document.createElement('div'); sec.className='meal-section';
  sec.innerHTML='<div class="meal-section-title">💊 今日补充剂</div>';
  (day.supp||[]).forEach((item,i)=>{ sec.appendChild(makeFoodCard(item,i,false)); });
  p.appendChild(sec);
}

// ============================================================
//  分区 3：药品记录
// ============================================================
function renderMedSec(p,day){
  // 说明
  const info=document.createElement('div'); info.className='med-info';
  info.innerHTML='💡 记录每日服药情况，数据独立保存，不参与营养计算';
  p.appendChild(info);

  // 常备药品快速打卡
  const qd=document.createElement('div'); qd.className='med-quick';
  MED_DB.forEach(med=>{
    const taken=(day.med||[]).some(m=>m.id===med.id);
    const b=document.createElement('button');
    b.className='med-btn'+(taken?' taken':'');
    b.innerHTML=(taken?'✅ ':'🔲 ')+med.name;
    b.onclick=()=>toggleMed(med);
    qd.appendChild(b);
  });
  p.appendChild(qd);

  // 添加其他药品按钮
  const ab=document.createElement('button');
  ab.className='btn-secondary'; ab.innerHTML='＋ 记录其他药品';
  ab.onclick=()=>showModal('med');
  p.appendChild(ab);

  // 已记录列表
  if(day.med&&day.med.length){
    const sec=document.createElement('div'); sec.className='meal-section';
    sec.innerHTML='<div class="meal-section-title">📋 今日药品</div>';
    (day.med||[]).forEach((item,i)=>{
      const row=document.createElement('div'); row.className='meal-item';
      row.innerHTML=`<div class="meal-item-info"><span class="meal-name">${item.taken?'✅':'🔲'} ${item.name}</span></div>
        <button class="del-btn" onclick="delRec('${curDate}','med',${i})">✕</button>`;
      sec.appendChild(row);
    });
    p.appendChild(sec);
  }
}

function toggleMed(med){
  if(!appData[curDate]) appData[curDate]={food:[],supp:[],med:[]};
  const idx=(appData[curDate].med||[]).findIndex(m=>m.id===med.id);
  if(idx>=0){ appData[curDate].med.splice(idx,1); }
  else { appData[curDate].med.push({id:med.id,name:med.name,unitLabel:med.unit,qty:1,taken:true}); }
  saveData(appData); render();
}

// ============================================================
//  通用：弹窗添加
// ============================================================
function showModal(section){
  closeModal();
  const ov=document.createElement('div'); ov.className='modal-overlay'; ov.id='addModal';
  let db;
  if(section==='food') db=FOOD_DB;
  if(section==='supp') db=SUPP_DB;
  if(section==='med')  db=MED_DB;
  window._curDB=db; window._curSec=section;

  ov.innerHTML=`
    <div class="modal">
      <div class="modal-header"><span>添加${section==='food'?'食品':section==='supp'?'补充剂':'药品'}</span><button class="close-btn" onclick="closeModal()">✕</button></div>
      <div class="modal-body">
        ${section==='food'?`<div class="form-group"><label>餐次</label><select id="mealType"><option>早餐</option><option selected>午餐</option><option>晚餐</option><option>加餐</option></select></div>`:''}
        <div class="form-group"><label>搜索</label><input type="text" id="srch" oninput="filterDb(this.value)" autocomplete="off"/></div>
        <div id="srchList" class="food-list"></div>
        <div id="selBox" class="selected-item hidden">
          <div id="selName"></div>
          <div class="qty-row"><label>数量</label><button onclick="chgQty(-0.5)">－</button><input type="number" id="qtyInp" value="1" min="0.5" step="0.5" style="width:60px;text-align:center"/><button onclick="chgQty(0.5)">＋</button><span id="qtyU" class="unit-label"></span></div>
          <div id="prevBox" class="nutrient-preview"></div>
          <button class="btn-primary" style="width:100%;margin-top:12px" onclick="doConfirm('${section}')">✓ 确认添加</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(ov);
  filterDb('');
  ov.addEventListener('click',e=>{if(e.target===ov)closeModal();});
}

function filterDb(q){
  const list=document.getElementById('srchList'); if(!list) return;
  const db=window._curDB||[];
  const r=(q||'').trim().toLowerCase();
  const res=r?db.filter(f=>f.name.toLowerCase().includes(r)):db;
  list.innerHTML=res.map(f=>{
    return `<div class="food-item" onclick="pickItem('${f.id}')"><span class="food-name">${f.name}</span><span class="food-meta">${f.unit||''}</span></div>`;
  }).join('');
}

function pickItem(id){
  const db=window._curDB||[];
  window._picked=db.find(f=>f.id===id);
  const p=window._picked; if(!p) return;
  document.getElementById('selName').textContent='✓ '+p.name;
  document.getElementById('qtyInp').value='1';
  document.getElementById('qtyU').textContent=p.unit||'';
  document.getElementById('selBox').classList.remove('hidden');
  document.getElementById('srchList').style.display='none';
  if(document.getElementById('srch')) document.getElementById('srch').value=p.name;
  updPreview();
}

function chgQty(d){
  const i=document.getElementById('qtyInp');
  i.value=Math.max(0.5,(parseFloat(i.value)||1)+d);
  updPreview();
}
function updPreview(){
  const p=window._picked; if(!p) return;
  const q=parseFloat(document.getElementById('qtyInp').value)||1;
  const b=document.getElementById('prevBox'); if(!b) return;
  const parts=[];
  if(p.calories) parts.push(`🔥 ${Math.round(p.calories*q)} kcal`);
  parts.push(`🦷 钙 ${Math.round((p.calcium||0)*q)}mg`);
  parts.push(`B1 ${((p.vitB1||0)*q).toFixed(2)}mg`);
  parts.push(`B2 ${((p.vitB2||0)*q).toFixed(2)}mg`);
  parts.push(`B6 ${((p.vitB6||0)*q).toFixed(2)}mg`);
  parts.push(`🍊 VC ${Math.round((p.vitC||0)*q)}mg`);
  b.innerHTML=parts.map(s=>`<span>${s}</span>`).join('');
}

function doConfirm(section){
  const p=window._picked; if(!p) return;
  const q=parseFloat(document.getElementById('qtyInp').value)||1;
  if(!appData[curDate]) appData[curDate]={food:[],supp:[],med:[]};
  const arr=appData[curDate][section]||(appData[curDate][section]=[]);
  arr.push({
    id:p.id, name:p.name,
    mealType: section==='food'?document.getElementById('mealType').value:'',
    qty:q, unitLabel:p.unit||'',
    calories:(p.calories||0), calcium:(p.calcium||0),
    vitB1:(p.vitB1||0), vitB2:(p.vitB2||0),
    vitB6:(p.vitB6||0), vitC:(p.vitC||0),
  });
  saveData(appData); closeModal(); render();
}

function closeModal(){
  const m=document.getElementById('addModal'); if(m) m.remove();
  window._picked=null;
}

// ============================================================
//  HTML 辅助
// ============================================================
function emptyDiv(t){
  const d=document.createElement('div'); d.className='empty-tip'; d.textContent=t; return d;
}
function mealIcon(t){ return{早餐:'🌅',午餐:'☀️',晚餐:'🌙',加餐:'🍎'}[t]||'🍽'; }
function fmtDate(s){
  const d=new Date(s+'T00:00:00');
  return (d.getMonth()+1)+'月'+d.getDate()+'日 '+'日一二三四五六'.charAt(d.getDay());
}
function makeNutCard(t){
  const c=document.createElement('div'); c.className='nutrition-card';
  const nutri=[ {k:'calories',L:'热量',U:'kcal',I:'🔥',C:'#f97316'}
    ,{k:'calcium',L:'钙',     U:'mg',  I:'🦷',C:'#3b82f6'}
    ,{k:'vitB1',  L:'维生素B1',U:'mg', I:'🌾',C:'#a855f7'}
    ,{k:'vitB2',  L:'维生素B2',U:'mg', I:'🥛',C:'#ec4899'}
    ,{k:'vitB6',  L:'维生素B6',U:'mg', I:'🐟',C:'#14b8a6'}
    ,{k:'vitC',   L:'维生素C', U:'mg', I:'🍊',C:'#f59e0b'} ];
  c.innerHTML='<div class="card-title">今日营养摄入</div>'+nutri.map(n=>{
    const v=t[n.k]||0; const d=DRI[n.k];
    const pct=Math.min(100,Math.round(v/d*100));
    const cls=pct>=80?'ok':pct>=50?'low':'deficient';
    const disp=n.k==='calories'?Math.round(v):v.toFixed(1);
    return `<div class="nutrient-row">
        <div class="nutrient-label"><span>${n.I} ${n.L}</span><span class="status-badge ${cls}">${pct>=80?'达标':pct>=50?'偏低':'不足'}</span></div>
        <div class="progress-wrap"><div class="progress-bar" style="width:${pct}%;background:${n.C}"></div></div>
        <div class="nutrient-val">${disp} / ${d} ${n.U} (${pct}%)</div>
      </div>`;
  }).join('');
  return c;
}
function makeFoodCard(item,idx,isMed){
  const d=document.createElement('div'); d.className='meal-item';
  const cal=Math.round((item.calories||0)*(item.qty||1));
  d.innerHTML=`
    <div class="meal-item-info">
      <span class="meal-name">${item.name}</span>
      <span class="meal-qty">${(item.qty||1)} ${item.unitLabel||''}</span>
    </div>
    <div class="meal-item-nutrients">
      ${cal?'<span class="tag cal">'+cal+' kcal</span>':''}
      <span class="tag ca">🦷 ${Math.round((item.calcium||0)*(item.qty||1))}mg</span>
    </div>
    <button class="del-btn" onclick="delRec('${curDate}','${isMed?"med":window._curSec||"food"}',${idx})">✕</button>`;
  return d;
}
function delRec(date,sec,idx){
  if(!appData[date]||!appData[date][sec]) return;
  appData[date][sec].splice(idx,1);
  saveData(appData); render();
}

// ============================================================
//  计算汇总
// ============================================================
function calcTotals(items){
  const t={calories:0,calcium:0,vitB1:0,vitB2:0,vitB6:0,vitC:0};
  (items||[]).forEach(m=>{
    t.calories+=(m.calories||0)*(m.qty||1);
    t.calcium+=(m.calcium||0)*(m.qty||1);
    t.vitB1+=(m.vitB1||0)*(m.qty||1);
    t.vitB2+=(m.vitB2||0)*(m.qty||1);
    t.vitB6+=(m.vitB6||0)*(m.qty||1);
    t.vitC+=(m.vitC||0)*(m.qty||1);
  });
  return t;
}

// ============================================================
//  历史视图
// ============================================================
function renderHistory(p){
  const t=document.createElement('div'); t.className='section-title'; t.textContent='历史记录'; p.appendChild(t);
  const dates=Object.keys(appData).sort().reverse();
  if(!dates.length){ p.appendChild(emptyDiv('暂无历史记录')); return; }
  dates.forEach(date=>{
    const day=appData[date]; if(!day) return;
    const all=[...(day.food||[]),...(day.supp||[])];
    if(!all.length) return;
    const tot=calcTotals(all);
    const card=document.createElement('div'); card.className='history-card';
    card.innerHTML=`
      <div class="history-date">${fmtDate(date)}${date===todayKey()?'（今天）':''}</div>
      <div class="history-summary">
        <span class="hist-tag cal">🔥 ${Math.round(tot.calories)} kcal</span>
        <span class="hist-tag ca">🦷 钙 ${Math.round(tot.calcium)}mg</span>
        <span class="hist-tag vc">🍊 VC ${Math.round(tot.vitC)}mg</span>
        <span class="hist-tag b">B族 ${((tot.vitB1+tot.vitB2+tot.vitB6)).toFixed(1)}mg</span>
      </div>
      <button class="view-detail-btn" onclick="viewDay('${date}')">查看详情 ›</button>`;
    p.appendChild(card);
  });
}
function viewDay(d){ curDate=d; curView='today'; render(); }

// ============================================================
//  趋势视图（含补充建议）
// ============================================================
function renderTrends(p){
  const t=document.createElement('div'); t.className='section-title'; t.textContent='近7天趋势'; p.appendChild(t);
  const today=new Date(); const last7=[];
  for(let i=6;i>=0;i--){ const d=new Date(today); d.setDate(d.getDate()-i); last7.push(d.toISOString().slice(0,10)); }

  [ {k:'calories',L:'热量',    U:'kcal',C:'#f97316'}
   ,{k:'calcium', L:'钙',      U:'mg',  C:'#3b82f6'}
   ,{k:'vitC',    L:'维生素C',U:'mg',  C:'#f59e0b'}
   ,{k:'vitB1',  L:'维生素B1',U:'mg',  C:'#a855f7'}
   ,{k:'vitB2',  L:'维生素B2',U:'mg',  C:'#ec4899'}
   ,{k:'vitB6',  L:'维生素B6',U:'mg',  C:'#14b8a6'} ].forEach(n=>{
    const vals=last7.map(dt=>{ const day=appData[dt]; return day?calcTotals([...(day.food||[]),...(day.supp||[]))[n.k]||0:0; });
    const mx=Math.max(...vals,DRI[n.k]);
    const cc=document.createElement('div'); cc.className='chart-card';
    cc.innerHTML=`<div class="chart-title">${n.L}（${n.U}）</div>`;
    const body=document.createElement('div'); body.className='bar-chart';
    last7.forEach((dt,i)=>{
      const v=vals[i]; const pct=Math.max(2,Math.round(v/mx*100));
      const dp=Math.round(DRI[n.k]/mx*100);
      const col=document.createElement('div'); col.className='bar-col';
      col.innerHTML=`<div class="bar-val">${n.k==='calories'?Math.round(v):v.toFixed(1)}</div>
        <div class="bar-outer"><div class="bar-inner" style="height:${pct}%;background:${n.C}"></div><div class="dri-line" style="bottom:${dp}%"></div></div>
        <div class="bar-date${dt===todayKey()?' today':''}">${dt===todayKey()?'今天':dt.slice(5)}</div>`;
      body.appendChild(col);
    });
    cc.appendChild(body);
    const note=document.createElement('div'); note.className='dri-note'; note.textContent=`推荐摄入：${DRI[n.k]} ${n.U}／天（虚线）`;
    cc.appendChild(note); p.appendChild(cc);
  });

  // 补充建议
  const sc=document.createElement('div'); sc.className='suggest-card';
  sc.innerHTML='<div class="chart-title">💊 营养补充建议</div>';
  let sug=[];
  const avg={};
  ['calcium','vitB1','vitB2','vitB6','vitC'].forEach(k=>{
    const vals=last7.map(dt=>{ const day=appData[dt]; if(!day) return 0;
      return calcTotals([...(day.food||[]),...(day.supp||[]))[k]||0; }).filter(v=>v>0);
    avg[k]=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0;
  });
  if(avg.calcium<DRI.calcium*0.8) sug.push({i:'🦷',t:`钙摄入不足（平均 ${Math.round(avg.calcium)}mg），建议补充钙片`});
  if(avg.vitC<DRI.vitC*0.8)     sug.push({i:'🍊',t:`维生素C不足，建议补充维生素C片`});
  if(avg.vitB1<DRI.vitB1*0.8||avg.vitB2<DRI.vitB2*0.8||avg.vitB6<DRI.vitB6*0.8)
    sug.push({i:'💊',t:'维生素B族摄入不足，建议补充复合维生素B片'});
  if(!sug.length) sc.innerHTML+='<div class="suggest-ok">🎉 近7天营养摄入均衡，继续保持！</div>';
  else sug.forEach(s=>{ sc.innerHTML+=`<div class="suggest-item">${s.i} ${s.t}</div>`; });
  p.appendChild(sc);
}

// ============================================================
//  PWA 安装 & Service Worker
// ============================================================
if('serviceWorker' in navigator){ window.addEventListener('load',()=>{ navigator.serviceWorker.register('./sw.js').catch()=>{}); }); }

let _dpt;
window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); _dpt=e;
  if(!isPWAInstalled()){ document.getElementById('installGuide')&&(document.getElementById('installGuide').style.display='block'); }
});
['installBtn','installBtn2'].forEach(id=>{
  document.getElementById(id)&&document.getElementById(id).addEventListener('click',async()=>{
    if(!_dpt){ alert('请在浏览器菜单中选择「添加到主屏幕'); return; }
    _dpt.prompt(); const{r}=await _dpt.userChoice;
    if(r==='accepted'){ hideInstall(); } _dpt=null;
  });
});
window.addEventListener('appinstalled',()=>{ hideInstall(); });
function hideInstall(){ ['installGuide','installBanner'].forEach(id=>{ const e=document.getElementById(id); if(e) e.style.display='none'; }); }
function isPWAInstalled(){ return window.matchMedia('(display-mode:standalone)').matches||window.navigator.standalone===true; }

// 启动
window.addEventListener('DOMContentLoaded', render);