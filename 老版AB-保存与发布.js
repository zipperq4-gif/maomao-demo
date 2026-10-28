'use strict';
const originalLongDraftKey='maomao-old-long-drafts';
let originalLongDrafts={};
try{originalLongDrafts=JSON.parse(localStorage.getItem(originalLongDraftKey))||{};}catch{}
for(const [name,saved] of Object.entries(originalLongDrafts))originalDrafts[name]=structuredClone(saved.original);
saveOriginalCourt=function(name,confirmed=false){
 const saved=originalValidated(name);if(!saved)return;
 const missing=[6,7].filter(day=>!saved.rules.some(rule=>rule.days.includes(day)));
 if(saved.original.pattern!=='暂不配置'&&missing.length&&!confirmed){const dialog=temporaryDialog();dialog.innerHTML=`<h3>确认周末不开放？</h3><p class="original-note">${missing.map(day=>'周'+days[day-1]).join('、')}尚未配置任何时段，保存后这些日期不开放预约。</p><button class="btn" onclick="closeTemporaryDialog();saveOriginalCourt('${name}',true)">确认周末留空并保存</button><button class="btn secondary" onclick="closeTemporaryDialog()">返回补充时段</button>`;dialog.showModal();return;}
 const next={...originalLongDrafts,[name]:saved};
 try{localStorage.setItem(originalLongDraftKey,JSON.stringify(next));}catch{return toast('草稿保存失败，请重试');}
 originalLongDrafts=next;originalOpen.delete(name);render();toast(name+'草稿已保存，尚未发布');
};
const renderBeforePublishSeparation=render;
render=function(){
 renderBeforePublishSeparation();if(originalTab!=='long')return;
 app.querySelectorAll('.original-card').forEach((card,index)=>{
  const name=['1号场','2号场','3号场'][index],saved=originalLongDrafts[name];
  if(saved&&!originalOpen.has(name))card.innerHTML=`<h2>${index+1}号网球场</h2><p class="original-note">草稿已保存 · 尚未发布${oldPlans[name]?'；原已发布价格继续生效':''}</p>${saved.original.pattern==='暂不配置'?'<p>暂不配置，不开放预约</p>':saved.rules.map(rule=>`<div class="original-summary">周${rule.days.map(day=>days[day-1]).join('、')}<p>${rule.start}–${rule.end}　¥${rule.price}/小时</p></div>`).join('')}<button class="btn secondary" onclick="originalOpen.add('${name}');render()">继续编辑草稿</button><button class="btn" onclick="previewOriginalLong('${name}')">预览发布</button>`;
  card.querySelector('.original-sync')?.remove();
  const controls=document.createElement('div');controls.className='original-copy-actions';controls.innerHTML=`<button class="original-sync" onclick="copyOriginalCourt('${name}')">复制</button><button class="original-sync" onclick="pasteOriginalCourt('${name}')">清空并粘贴</button>`;card.querySelector('h2').after(controls);
  const draft=originalDrafts[name],select=card.querySelector('select');
  if(originalOpen.has(name)&&select){const option=document.createElement('option');option.textContent='暂不配置';option.selected=draft.pattern==='暂不配置';select.append(option);if(draft.pattern==='暂不配置'){const first=card.querySelector('.field');let sibling=first.nextElementSibling;while(sibling){const next=sibling.nextElementSibling;if(!sibling.matches('.original-error,.btn:not(.original-add)'))sibling.remove();sibling=next;}first.insertAdjacentHTML('afterend','<p class="original-note">该场地暂不配置价格，不开放预约。保存为草稿，确认发布后移除原有定价。</p>');}}
 });
};
function previewOriginalLong(name){
 const saved=originalLongDrafts[name];if(!saved)return;
 const dialog=temporaryDialog();dialog.innerHTML=`<h3>${name} · 发布前预览</h3><p class="original-note">仅发布当前场地，不要求其他场地填写价格。</p>${saved.original.pattern==='暂不配置'?'<p>暂不配置：移除该场地的长期与临时定价，不开放新预约。已有订单不变。</p>':`<p>${saved.start}起 · ${esc(saved.original.expiry)}</p>`}${saved.rules.map(rule=>`<div class="original-summary">周${rule.days.map(day=>days[day-1]).join('、')}<p>${rule.start}–${rule.end}　¥${rule.price}/小时</p></div>`).join('')}<button class="btn" onclick="publishOriginalLong('${name}')">确认发布</button><button class="btn secondary" onclick="closeTemporaryDialog()">返回，暂不发布</button>`;dialog.showModal();
}
function publishOriginalLong(name){
 const saved=originalLongDrafts[name];if(!saved)return;
 const next={...oldPlans,[name]:{...structuredClone(saved),temporary:oldPlans[name]?.temporary||[]}};
 if(saved.original.pattern==='暂不配置')delete next[name];
 try{localStorage.setItem('maomao-old-ab-plans',JSON.stringify(next));}catch{return toast('发布失败，请重试');}
 oldPlans=next;delete originalLongDrafts[name];
 try{localStorage.setItem(originalLongDraftKey,JSON.stringify(originalLongDrafts));}catch{}
 closeTemporaryDialog();render();toast(name+'价格已正式发布');
}
let originalClipboard=null;
const validateOriginalBeforeOptional=originalValidated;
originalValidated=function(name){const draft=originalDrafts[name];if(draft.pattern==='暂不配置')return {original:structuredClone(draft),rules:[],start:draft.start,temporary:[]};return validateOriginalBeforeOptional(name);};
const changePatternBeforeOptional=changeOriginalPattern;
changeOriginalPattern=function(name,value){if(value==='暂不配置'){originalDrafts[name].pattern=value;originalDrafts[name].groups=[];originalGroups[name]=0;render();return;}changePatternBeforeOptional(name,value);};
function copyOriginalCourt(name){const draft=originalDrafts[name]||originalLongDrafts[name]?.original||oldPlans[name]?.original;if(!draft)return toast('该场地没有可复制配置');originalClipboard=structuredClone(draft);toast('已复制'+name+'配置，请到目标场地清空并粘贴');}
function pasteOriginalCourt(name){if(!originalClipboard)return toast('请先复制来源场地配置');const dialog=temporaryDialog();dialog.innerHTML=`<h3>清空并粘贴到${name}？</h3><p class="original-note">替换该场地的编辑内容，已发布价格在确认发布前保持不变。</p><button class="btn" onclick="confirmOriginalPaste('${name}')">确认清空并粘贴</button><button class="btn secondary" onclick="closeTemporaryDialog()">取消</button>`;dialog.showModal();}
function confirmOriginalPaste(name){originalDrafts[name]=structuredClone(originalClipboard);originalGroups[name]=0;originalOpen.add(name);closeTemporaryDialog();render();toast('已粘贴，请保存草稿并预览发布');}
const copyStyle=document.createElement('style');copyStyle.textContent='.original-copy-actions{display:flex;justify-content:flex-end;gap:8px;margin:8px 0}.original-copy-actions button{padding:5px 9px}';document.head.append(copyStyle);
render();
