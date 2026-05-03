// === 全局状态 ===
let appData=loadData();
let curDate=todayKey();
let curView='today';
let activeSection='food';

// === 渲染入口 ===
function render(){
  const app=document.getElementById('app'); app.innerHTML='';
  renderHeader(app); renderNav(app);
  const w=document.createElement('div'); w.className='content';
  if(curView==='today') renderToday(w);
  if(curView==='history') renderHistory(w);
  if(curView==='trends') renderTrends(w);
  app.appendChild(w);
}
function renderHeader(p){
  const h=document.createElement('header');
  h.innerHTML='<div class="header-inner"><span class="logo">🥗 营养追踪</span><span class="date-display">'+fmtDate(curDate)+'</span></div>';
  p.appendChild(h);
}
function renderNav(p){
  const n=document.createElement('nav');
  [{k:'today',i:'📋',l:'今日'},{k:'history',i:'📅',l:'历史'},{k:'trends',i:'📊',l:'趋势'}].forEach(t=>{
    const b=document.createElement('button');
    b.className='tab-btn'+(curView===t.k?' active':'');
    b.innerHTML=t.i+' '+t.l; b.onclick=()=>{curView=t.k; if(curView==='today') curDate=todayKey(); render();};
    n.appendChild(b);
  });
  p.appendChild(n);
}

// === 今日视图（三区Tab）===
function renderToday(p){
  const day=appData[curDate]||{food:[],supp:[],med:[]};
  const tabs=document.createElement('div'); tabs.className='section-tabs';
  [{k:'food',i:'🔥',l:'热量/营养'},{k:'supp',i:'💊',l:'营养补充'},{k:'med',i:'💉',l:'药品'}].forEach(t=>{
    const b=document.createElement('button');
    b.className='sec-tab'+(activeSection===t.k?' active':'');
    b.innerHTML=t.i+' '+t.l; b.onclick=()=>{activeSection=t.k;render();};
    tabs.appendChild(b);
  });
  p.appendChild(tabs);
  if(activeSection==='food') renderFoodSec(p,day);
  if(activeSection==='supp') renderSuppSec(p,day);
  if(activeSection==='med') renderMedSec(p,day);
}

// === 食物区 ===
function renderFoodSec(p,day){
  const dash=document.createElement('div'); dash.className='dashboard';
  const items=day.food||[];
  const sum={cal:0,ca:0,b1:0,b2:0,b6:0,vc:0};
  items.forEach(it=>{
    const f=FOOD_DB.find(x=>x.id===it.id); if(!f)return;
    const q=it.qty||1;
    sum.cal+=(f.cal||0)*q; sum.ca+=(f.ca||0)*q; sum.b1+=(f.b1||0)*q;
    sum.b2+=(f.b2||0)*q; sum.b6+=(f.b6||0)*q; sum.vc+=(f.vc||0)*q;
  });
  dash.innerHTML='<div class="dash-title">📊 今日营养摄入</div>'+
    barHtml('🔥 热量','kcal',sum.cal,DRI.cal)+
    barHtml('🦷 钙','mg',sum.ca,DRI.ca)+
    barHtml('💊 维生素B1','mg',sum.b1,DRI.b1)+
    barHtml('💊 维生素B2','mg',sum.b2,DRI.b2)+
    barHtml('💊 维生素B6','mg',sum.b6,DRI.b6)+
    barHtml('🍊 维生素C','mg',sum.vc,DRI.vc);
  p.appendChild(dash);

  // 按餐次分组
  const meals={};
  items.forEach(it=>{ const m=it.meal||'午餐'; if(!meals[m]) meals[m]=[]; meals[m].push(it); });
  ['早餐','午餐','晚餐','加餐'].forEach(meal=>{
    if(!meals[meal]) return;
    const blk=document.createElement('div'); blk.className='meal-block';
    let html='<div class="meal-title">'+meal+'（'+meals[meal].reduce((s,it)=>s+Math.round((FOOD_DB.find(x=>x.id===it.id)||{cal:0}).cal*it.qty),0)+' kcal）</div>';
    meals[meal].forEach(it=>{
      const f=FOOD_DB.find(x=>x.id===it.id)||{};
      html+='<div class="food-item"><span class="food-name">'+f.name+' ×'+it.qty+' '+f.unit+'</span>'+
        '<span class="food-meta">'+Math.round((f.cal||0)*it.qty)+' kcal</span>'+
        '<button class="del-btn" onclick="delItem(\'food\','+items.indexOf(it)+')">✕</button></div>';
    });
    blk.innerHTML=html; p.appendChild(blk);
  });

  const ab=document.createElement('button'); ab.className='add-btn'; ab.innerHTML='＋ 添加食物/菜品';
  ab.onclick=()=>showModal('food'); p.appendChild(ab);
}

// === 营养补充区 ===
function renderSuppSec(p,day){
  const info=document.createElement('div'); info.className='med-info';
  info.innerHTML='💡 记录每日营养补充剂，确保摄入达标。';
  p.appendChild(info);

  const items=day.supp||[];
  const sum={ca:0,b1:0,b2:0,b6:0,vc:0};
  items.forEach(it=>{
    const s=SUPP_DB.find(x=>x.id===it.id); if(!s)return;
    const q=it.qty||1;
    sum.ca+=(s.ca||0)*q; sum.b1+=(s.b1||0)*q; sum.b2+=(s.b2||0)*q;
    sum.b6+=(s.b6||0)*q; sum.vc+=(s.vc||0)*q;
  });
  const dash=document.createElement('div'); dash.className='dashboard';
  dash.innerHTML='<div class="dash-title">💊 补充剂摄入</div>'+
    barHtml('🦷 钙(补剂)','mg',sum.ca,DRI.ca)+
    barHtml('💊 维生素B1(补剂)','mg',sum.b1,DRI.b1)+
    barHtml('💊 维生素B2(补剂)','mg',sum.b2,DRI.b2)+
    barHtml('💊 维生素B6(补剂)','mg',sum.b6,DRI.b6)+
    barHtml('🍊 维生素C(补剂)','mg',sum.vc,DRI.vc);
  p.appendChild(dash);

  if(items.length){
    const blk=document.createElement('div'); blk.className='meal-block';
    let html='<div class="meal-title">今日补充记录</div>';
    items.forEach(it=>{
      const s=SUPP_DB.find(x=>x.id===it.id)||{};
      html+='<div class="food-item"><span class="food-name">'+s.name+' ×'+it.qty+' '+s.unit+'</span>'+
        '<button class="del-btn" onclick="delItem(\'supp\','+items.indexOf(it)+')">✕</button></div>';
    });
    blk.innerHTML=html; p.appendChild(blk);
  }

  const qk=document.createElement('div'); qk.className='med-quick';
  SUPP_DB.forEach(s=>{
    const b=document.createElement('button'); b.className='med-btn';
    b.innerHTML='＋ '+s.name; b.onclick=()=>addQuick('supp',s.id);
    qk.appendChild(b);
  });
  p.appendChild(qk);
}

// === 药品记录区 ===
function renderMedSec(p,day){
  const info=document.createElement('div'); info.className='med-info';
  info.innerHTML='💉 记录每日药品服用情况。优甲乐建议早晨空腹服用。';
  p.appendChild(info);

  const items=day.med||[];
  if(items.length){
    const blk=document.createElement('div'); blk.className='meal-block';
    let html='<div class="meal-title">今日药品记录</div>';
    items.forEach(it=>{
      const m=MED_DB.find(x=>x.id===it.id)||{};
      html+='<div class="food-item"><span class="food-name">'+m.name+' ×'+it.qty+' '+m.unit+'</span>'+
        '<span class="tag" style="background:#dcfce7;color:#166534">已服用</span>'+
        '<button class="del-btn" onclick="delItem(\'med\','+items.indexOf(it)+')">✕</button></div>';
    });
    blk.innerHTML=html; p.appendChild(blk);
  } else {
    const emp=document.createElement('div'); emp.className='empty-tip';
    emp.innerHTML='暂无药品记录，点击下方按钮添加。';
    p.appendChild(emp);
  }

  const qk=document.createElement('div'); qk.className='med-quick';
  MED_DB.forEach(m=>{
    const taken=(day.med||[]).some(it=>it.id===m.id);
    const b=document.createElement('button');
    b.className='med-btn'+(taken?' taken':'');
    b.innerHTML=(taken?'✅ ':'＋ ')+m.name;
    b.onclick=()=>{ if(!taken) addQuick('med',m.id); else alert('今日已记录服用'); };
    qk.appendChild(b);
  });
  p.appendChild(qk);
}

// === 历史视图 ===
function renderHistory(p){
  const dates=Object.keys(appData).sort().reverse().slice(0,30);
  if(!dates.length){ p.innerHTML='<div class="empty-tip">暂无历史记录</div>'; return; }
  dates.forEach(dt=>{
    const day=appData[dt]||{food:[],supp:[],med:[]};
    const sum={cal:0,ca:0,b1:0,b2:0,b6:0,vc:0};
    (day.food||[]).forEach(it=>{
      const f=FOOD_DB.find(x=>x.id===it.id); if(!f)return;
      const q=it.qty||1;
      sum.cal+=(f.cal||0)*q; sum.ca+=(f.ca||0)*q; sum.b1+=(f.b1||0)*q;
      sum.b2+=(f.b2||0)*q; sum.b6+=(f.b6||0)*q; sum.vc+=(f.vc||0)*q;
    });
    const blk=document.createElement('div'); blk.className='meal-block';
    blk.innerHTML='<div class="meal-title">📅 '+fmtDate(dt)+'</div>'+
      '<div class="history-row">🔥 热量: <b>'+Math.round(sum.cal)+'</b> kcal</div>'+
      '<div class="history-row">🦷 钙: <b>'+Math.round(sum.ca)+'</b> mg</div>'+
      '<div class="history-row">🍊 维C: <b>'+Math.round(sum.vc)+'</b> mg</div>'+
      '<div class="history-row">药品: '+(day.med||[]).map(it=>(MED_DB.find(x=>x.id===it.id)||{}).name||'').join(', ')+'</div>';
    p.appendChild(blk);
  });
}

// === 趋势视图 ===
function renderTrends(p){
  const dates=Object.keys(appData).sort().slice(-7);
  if(dates.length<2){ p.innerHTML='<div class="empty-tip">需要至少2天数据才能显示趋势</div>'; return; }
  const blk=document.createElement('div'); blk.className='meal-block';
  let html='<div class="meal-title">📈 近7天营养趋势</div>';
  dates.forEach(dt=>{
    const day=appData[dt]||{food:[],supp:[],med:[]};
    const sum={cal:0,ca:0,vc:0};
    (day.food||[]).forEach(it=>{
      const f=FOOD_DB.find(x=>x.id===it.id); if(!f)return;
      const q=it.qty||1;
      sum.cal+=(f.cal||0)*q; sum.ca+=(f.ca||0)*q; sum.vc+=(f.vc||0)*q;
    });
    (day.supp||[]).forEach(it=>{
      const s=SUPP_DB.find(x=>x.id===it.id); if(!s)return;
      const q=it.qty||1;
      sum.ca+=(s.ca||0)*q; sum.vc+=(s.vc||0)*q;
    });
    html+='<div class="history-row">'+dt+' → 🔥'+Math.round(sum.cal)+'kcal 🦷'+Math.round(sum.ca)+'mg 🍊'+Math.round(sum.vc)+'mg</div>';
  });
  blk.innerHTML=html; p.appendChild(blk);

  const advice=document.createElement('div'); advice.className='med-info';
  const lastDt=dates[dates.length-1];
  const day=appData[lastDt]||{food:[],supp:[]};
  const sumCa=(day.food||[]).reduce((s,it)=>{ const f=FOOD_DB.find(x=>x.id===it.id); return s+(f?f.ca*it.qty:0); },0) +
              (day.supp||[]).reduce((s,it)=>{ const s2=SUPP_DB.find(x=>x.id===it.id); return s+(s2?s2.ca*it.qty:0); },0);
  advice.innerHTML='💡 建议：'+(sumCa<DRI.ca?'钙摄入不足，建议增加奶制品或钙片补充。':'钙摄入良好。');
  p.appendChild(advice);
}

// === 辅助函数 ===
function barHtml(label,unit,val,max){
  const pct=Math.min(100,Math.round(val/max*100));
  const color=pct>90?'#22c55e':pct>60?'#f59e0b':'#ef4444';
  return '<div class="nutrient-bar"><span class="nb-label">'+label+'</span>'+
    '<div class="nb-track"><div class="nb-fill" style="width:'+pct+'%;background:'+color+'"></div></div>'+
    '<span class="nb-val">'+Math.round(val)+'/'+max+' '+unit+'</span></div>';
}
function fmtDate(s){
  const d=new Date(s); return s+' 周'+['日','一','二','三','四','五','六'][d.getDay()];
}
