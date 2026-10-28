'use strict';

function todayInShanghai(){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());return ['year','month','day'].map(type=>parts.find(part=>part.type===type).value).join('-');}
function publishedState(group){return group.plan.start>todayInShanghai()?'已发布 · 待生效':'已发布 · 生效中';}
document.title='毛毛球 · 排期定价';
document.querySelector('.aside').innerHTML='<strong>毛毛球 / 排期定价</strong><h1>一次设置，<br>多片场地使用。</h1><p>选择场地 → 框选分时价格 → 核对发布 → 管理已发布方案。</p><p>课程价格不在这里设置。已有订单、课程占用和锁场不受调价影响。</p><p>体验数据仅保存在当前浏览器，不向真实场馆发布。</p><button class="btn secondary" onclick="resetPricingExperience()">重新体验首次设置</button>';
const stateOverview=showOverview;
showOverview=function(){
  stateOverview();
  const cards=[...app.querySelectorAll('.card')];
  cards.forEach(card=>{const badge=card.querySelector('.flow-state');if(badge?.textContent==='已保存'){const button=card.querySelector('button');const group=publishedGroups.find(item=>button?.getAttribute('onclick')?.includes(item.id));if(group)badge.textContent=publishedState(group);}});
  const courtCard=cards.find(card=>card.querySelector('h2')?.textContent==='全部场地');
  if(courtCard)courtCard.innerHTML='<h2>场地定价状态</h2>'+courtNames.map((name,index)=>{const group=groupForCourt(index);return `<div class="saved-rule"><div class="row"><strong>${name}</strong><span class="flow-state">${group?publishedState(group):'未设置'}</span></div><p class="muted">${group?'基础价 ¥'+group.plan.base+'/小时 · '+group.plan.start+'起':'尚未发布场地价格'}</p><button class="link" onclick="${group?`editPublishedGroup('${group.id}')`:`setupCourt(${index})`}">${group?'查看价格方案':'设置此场地价格'} ›</button></div>`;}).join('');
  app.insertAdjacentHTML('beforeend','<button class="link" onclick="resetPricingExperience()">清除本机测试数据，重新体验首次设置</button>');
  document.querySelector('.top button').style.visibility='hidden';
};
function setupCourt(index){if(localStorage.getItem(draftStorageKey)){startPricingFlow();return;}beginFreshDraft();selectedCourts=[index];showCourtSelection();saveWorkingDraft();}
function resetPricingExperience(){pricingDialog.innerHTML='<div class="pricing-editor"><h2>重新体验首次设置？</h2><p class="notice">将清除本浏览器的定价草稿和已发布样例。其他人的数据不受影响。</p><button class="btn" onclick="localStorage.removeItem(workflowKey);localStorage.removeItem(draftStorageKey);publishedGroups=[];selectedCourts=[];paintedSelection.clear();pricingDialog.close();showOverview()">清除并重新开始</button><button class="btn secondary" onclick="pricingDialog.close()">保留数据</button></div>';pricingDialog.showModal();}
const stateFooter=footer;
footer=function(text,action){stateFooter(text,action);document.querySelector('.top button').style.visibility=workflowStage==='overview'?'hidden':'visible';};
const stateHome=home;
home=function(){stateHome();const date=document.getElementById('effective');if(date){date.min=todayInShanghai();date.insertAdjacentHTML('afterend','<p class="muted">选择未来日期将显示“待生效”；发布前当前价格保持不变。</p>');}document.querySelectorAll('a[href="商家中心.html"]').forEach(link=>link.remove());};
const stateReview=showPublishReview;
showPublishReview=function(){const date=document.getElementById('effective');if(date&&date.value<todayInShanghai()){toast('生效日期不能早于今天，请重新选择');date.focus();return;}stateReview();};
const statePublish=publishWorkflow;
publishWorkflow=function(){statePublish();if(workflowStage==='success'){const group=publishedGroups.find(item=>item.id===editingGroup);const title=app.querySelector('.flow-title');if(title)title.textContent='价格方案发布成功';app.querySelector('.notice')?.insertAdjacentHTML('beforebegin',`<p class="flow-state">${publishedState(group)}</p>`);app.insertAdjacentHTML('beforeend','<button class="btn secondary" onclick="showOverview()">查看全部场地状态</button>');}};
const stateView=editPublishedGroup;
editPublishedGroup=function(id){stateView(id);const group=publishedGroups.find(item=>item.id===id);if(group){const badge=app.querySelector('.flow-state');if(badge)badge.textContent=publishedState(group)+' · 只读';}};
showOverview();
