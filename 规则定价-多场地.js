'use strict';

const multiCourtKey='maomao-rule-pricing-courts-v1';
const courtNames=['1号网球场','2号网球场','3号网球场'];
let activeCourt=0;
let courtPlans=courtNames.map(()=>structuredClone(plan));
let publishedCourts={};
try{
  const saved=JSON.parse(localStorage.getItem(multiCourtKey));
  if(saved&&Array.isArray(saved.plans)&&saved.plans.length===courtNames.length){courtPlans=saved.plans;publishedCourts=saved.published||{};}
}catch{}
plan=structuredClone(courtPlans[activeCourt]);
const homeBeforeMultiCourt=home;
home=function(){
  homeBeforeMultiCourt();
  const card=app.querySelector('.card');
  card.innerHTML=`<label class="field" style="margin:0">当前编辑场地<select id="activeCourt" onchange="switchCourt(Number(this.value))">${courtNames.map((name,index)=>`<option value="${index}" ${index===activeCourt?'selected':''}>${name}</option>`).join('')}</select></label><p class="muted" style="margin-top:8px">室内硬地 · 营业 08:00–22:00</p><p class="muted">${publishedCourts[activeCourt]?'已有发布方案 · 修改后需重新发布':'尚未发布 · 当前为示例草稿'}</p>`;
  footer('选择场地并发布','openCourtPublish()');
};
function captureCourtDraft(){
  const base=document.getElementById('baseInline');
  if(base){
    if(!base.value||!Number.isFinite(Number(base.value))||Number(base.value)<0){document.getElementById('baseError').textContent='请输入有效基础价格';base.focus();return false;}
    plan.base=Number(base.value);
  }
  const effective=document.getElementById('effective');
  if(effective){if(!effective.value){toast('请选择生效日期');return false;}plan.start=effective.value;}
  courtPlans[activeCourt]=structuredClone(plan);
  return true;
}
function switchCourt(index){
  if(!captureCourtDraft()){document.getElementById('activeCourt').value=activeCourt;return;}
  activeCourt=index;
  plan=structuredClone(courtPlans[index]);
  home();
  toast('已切换场地，上一片场地的修改保留为本次草稿');
}
function openCourtPublish(){
  if(!captureCourtDraft())return;
  pricingDialog.innerHTML=`<div class="pricing-editor"><header><h2>发布到哪些场地？</h2><button onclick="pricingDialog.close()" aria-label="关闭发布确认">×</button></header><p class="muted" style="margin-top:12px">使用${courtNames[activeCourt]}当前编辑的完整方案</p><div class="notice">基础价 ¥${plan.base}/小时 · ${plan.rules.length}条分时规则<br>${plan.start}起生效 · 长期有效<br>包含节日策略及${plan.special.length}个特殊日期</div><div role="group" aria-label="发布目标场地">${courtNames.map((name,index)=>`<label style="display:flex;gap:10px;align-items:center;padding:14px 0;border-bottom:1px solid #ecefe6"><input type="checkbox" name="publishCourt" value="${index}" ${index===activeCourt?'checked':''} onchange="updatePublishCount()" style="width:18px;height:18px;accent-color:#292d27"><span style="flex:1">${name}<small class="muted" style="display:block">${publishedCourts[index]?'已发布 · 场地基础价 ¥'+publishedCourts[index].base:'未发布 · 草稿基础价 ¥'+courtPlans[index].base}</small></span><small class="muted">${index===activeCourt?'当前场地':''}</small></label>`).join('')}</div><p class="muted" style="margin-top:15px">将完整替换所选场地的定价方案，包括基础价、规则及节日设置。已有订单、课程占用和锁场不变。</p><p class="muted">独立演示：仅保存于本浏览器，不发布到真实场馆。</p><p id="publishError" class="error" role="alert"></p><div class="editor-actions"><button class="btn secondary" onclick="pricingDialog.close()">返回修改</button><button class="btn" id="publishConfirm" onclick="confirmCourtPublish()"></button></div></div>`;
  updatePublishCount();
  pricingDialog.showModal();
}
function updatePublishCount(){
  const count=pricingDialog.querySelectorAll('input[name="publishCourt"]:checked').length;
  const button=document.getElementById('publishConfirm');
  button.textContent=count?'确认发布到 '+count+' 片场地':'请选择场地';
  button.disabled=!count;
  button.style.opacity=count?'1':'.45';
}
function confirmCourtPublish(){
  const targets=[...pricingDialog.querySelectorAll('input[name="publishCourt"]:checked')].map(input=>Number(input.value));
  if(!targets.length)return;
  const nextPlans=structuredClone(courtPlans),nextPublished=structuredClone(publishedCourts);
  targets.forEach(index=>{nextPlans[index]=structuredClone(plan);nextPublished[index]=structuredClone(plan);});
  try{localStorage.setItem(multiCourtKey,JSON.stringify({plans:nextPlans,published:nextPublished}));}
  catch{document.getElementById('publishError').textContent='浏览器未允许保存，未完成发布。请重试。';return;}
  courtPlans=nextPlans;publishedCourts=nextPublished;
  pricingDialog.close();home();toast('演示方案已发布到 '+targets.length+' 片场地');
}
home();
