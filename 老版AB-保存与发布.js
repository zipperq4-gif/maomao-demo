'use strict';
const originalLongDraftKey='maomao-old-long-drafts';
let originalLongDrafts={};
try{originalLongDrafts=JSON.parse(localStorage.getItem(originalLongDraftKey))||{};}catch{}
for(const [name,saved] of Object.entries(originalLongDrafts))originalDrafts[name]=structuredClone(saved.original);
saveOriginalCourt=function(name){
 const saved=originalValidated(name);if(!saved)return;
 const next={...originalLongDrafts,[name]:saved};
 try{localStorage.setItem(originalLongDraftKey,JSON.stringify(next));}catch{return toast('草稿保存失败，请重试');}
 originalLongDrafts=next;originalOpen.delete(name);render();toast(name+'草稿已保存，尚未发布');
};
const renderBeforePublishSeparation=render;
render=function(){
 renderBeforePublishSeparation();if(originalTab!=='long')return;
 app.querySelectorAll('.original-card').forEach((card,index)=>{
  const name=['1号场','2号场','3号场'][index],saved=originalLongDrafts[name];
  if(!saved||originalOpen.has(name))return;
  card.innerHTML=`<h2>${index+1}号网球场</h2><p class="original-note">草稿已保存 · 尚未发布${oldPlans[name]?'；原已发布价格继续生效':''}</p>${saved.rules.map(rule=>`<div class="original-summary">周${rule.days.map(day=>days[day-1]).join('、')}<p>${rule.start}–${rule.end}　¥${rule.price}/小时</p></div>`).join('')}<button class="btn secondary" onclick="originalOpen.add('${name}');render()">继续编辑草稿</button><button class="btn" onclick="previewOriginalLong('${name}')">预览发布</button>`;
 });
};
function previewOriginalLong(name){
 const saved=originalLongDrafts[name];if(!saved)return;
 const dialog=temporaryDialog();dialog.innerHTML=`<h3>${name} · 发布前预览</h3><p class="original-note">仅发布当前场地，不要求其他场地填写价格。</p><p>${saved.start}起 · ${esc(saved.original.expiry)}</p>${saved.rules.map(rule=>`<div class="original-summary">周${rule.days.map(day=>days[day-1]).join('、')}<p>${rule.start}–${rule.end}　¥${rule.price}/小时</p></div>`).join('')}<button class="btn" onclick="publishOriginalLong('${name}')">确认发布</button><button class="btn secondary" onclick="closeTemporaryDialog()">返回，暂不发布</button>`;dialog.showModal();
}
function publishOriginalLong(name){
 const saved=originalLongDrafts[name];if(!saved)return;
 const next={...oldPlans,[name]:{...structuredClone(saved),temporary:oldPlans[name]?.temporary||[]}};
 try{localStorage.setItem('maomao-old-ab-plans',JSON.stringify(next));}catch{return toast('发布失败，请重试');}
 oldPlans=next;delete originalLongDrafts[name];
 try{localStorage.setItem(originalLongDraftKey,JSON.stringify(originalLongDrafts));}catch{}
 closeTemporaryDialog();render();toast(name+'价格已正式发布');
}
render();
