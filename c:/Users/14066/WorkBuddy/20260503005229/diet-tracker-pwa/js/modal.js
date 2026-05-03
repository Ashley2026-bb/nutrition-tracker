// === 弹窗功能 ===
function showModal(section){
  closeModal();
  const ov=document.createElement('div'); ov.className='modal-overlay'; ov.id='addModal';
  const db=section==='food'?FOOD_DB:(section==='supp'?SUPP_DB:MED_DB);
  window._curDB=db; window._curSec=section;
  let mealOpt='';
  if(section==='food') mealOpt='<div class="form-group"><label>餐次</label><select id="mealType"><option>早餐</option><option selected>午餐</option><option>晚餐</option><option>加餐</option></select></div>';
  ov.innerHTML=`<div class="modal"><div class="modal-header"><span>添加${section==='food'?'食品':section==='supp'?'补充剂':'药品'}</span><button class="close-btn" onclick="closeModal()">✕</button></div>
    <div class="modal-body">${mealOpt}
      <div class="form-group"><label>搜索</label><input type="text" id="srch" oninput="filterDb(this.value)" placeholder="输入名称" autocomplete="off"/></div>
      <div id="srchList" class="food-list"></div>
      <div id="selBox" class="selected-item hidden">
        <div id="selName"></div>
        <div class="qty-row"><label>数量</label><button onclick="chgQty(-0.5)">－</button><input type="number" id="qtyInp" value="1" min="0.5" step="0.5" style="width:60px;text-align:center"/><button onclick="chgQty(0.5)">＋</button><span id="qtyU" class="unit-label"></span></div>
        <div id="prevBox" class="nutrient-preview"></div>
        <button class="btn-primary" style="width:100%;margin-top:12px" onclick="doConfirm('${section}')">✓ 确认添加</button>
      </div>
    </div></div>`;
  document.body.appendChild(ov); filterDb('');
  ov.addEventListener('click',e=>{ if(e.target===ov) closeModal(); });
}

function filterDb(q){
  const list=document.getElementById('srchList'); if(!list) return;
  const db=window._curDB||[];
  const r=(q||'').trim().toLowerCase();
  list.innerHTML=db.filter(f=>!r||f.name.toLowerCase().includes(r)).map(f=>{
    return '<div class="food-item" onclick="pickItem(\''+f.id+'\')"><span class="food-name">'+f.name+'</span><span class="food-meta">'+(f.unit||'')+'</span></div>';
  }).join('');
}

function pickItem(id){
  const db=window._curDB||[]; window._picked=db.find(f=>f.id===id);
  const p=window._picked; if(!p) return;
  document.getElementById('selName').textContent='✓ '+p.name;
  document.getElementById('qtyInp').value='1';
  document.getElementById('qtyU').textContent=p.unit||'';
  document.getElementById('selBox').classList.remove('hidden');
  document.getElementById('srchList').style.display='none';
  const srch=document.getElementById('srch'); if(srch) srch.value=p.name;
  updPreview();
}

function chgQty(d){
  const i=document.getElementById('qtyInp');
  i.value=Math.max(0.5,(parseFloat(i.value)||1)+d); updPreview();
}

function updPreview(){
  const p=window._picked; if(!p) return;
  const q=parseFloat(document.getElementById('qtyInp').value)||1;
  const b=document.getElementById('prevBox'); if(!b) return;
  let parts=[];
  if(p.cal!==undefined) parts.push('🔥 '+Math.round(p.cal*q)+' kcal');
  parts.push('🦷 钙 '+Math.round((p.ca||0)*q)+'mg');
  if(p.b1) parts.push('B1 '+Math.round(p.b1*q*100)/100+'mg');
  if(p.b2) parts.push('B2 '+Math.round(p.b2*q*100)/100+'mg');
  if(p.b6) parts.push('B6 '+Math.round(p.b6*q*100)/100+'mg');
  if(p.vc) parts.push('🍊 维C '+Math.round(p.vc*q)+'mg');
  b.innerHTML=parts.map(p=>`<span class="tag" style="background:#f0fdf4;color:#166534;margin:2px">${p}</span>`).join('');
}

function doConfirm(section){
  const p=window._picked; if(!p) return;
  const q=parseFloat(document.getElementById('qtyInp').value)||1;
  const meal=section==='food'?(document.getElementById('mealType')||{}).value||'午餐':'';
  const day=appData[curDate]||{food:[],supp:[],med:[]};
  day[section]=day[section]||[];
  const entry={id:p.id,qty:q};
  if(meal) entry.meal=meal;
  entry.time=new Date().toLocaleTimeString();
  day[section].push(entry);
  appData[curDate]=day;
  saveData(appData);
  closeModal();
  render();
}

function closeModal(){
  const ov=document.getElementById('addModal'); if(ov) ov.remove();
}
