(()=>{
 'use strict';
 const config=window.EXPERIMENT_CONFIG||{};
 const queueKey='maomao-experiment-outbox-v1';
 const runKey='maomao-experiment-active-run';
 let queue=[],run=null,busy=false,status='未配置上传接口',retryAt=0,failures=0;
 const read=(store,key,fallback)=>{try{return JSON.parse(store.getItem(key))||fallback;}catch{return fallback;}};
 queue=read(localStorage,queueKey,[]);
 run=read(sessionStorage,runKey,null);
 const persist=()=>{try{localStorage.setItem(queueKey,JSON.stringify(queue));return true;}catch{status='本地存储失败，请保留页面并导出备份';paintStatus();return false;}};
 function paintStatus(){const label=document.getElementById('experimentUploadStatus');if(label)label.textContent=status+(queue.length?' · 待传 '+queue.length+' 条':'');}
 function track(type,data={}){
  if(!run||run.ended)return;
  const event={id:crypto.randomUUID(),study:config.study||'pricing-ab',runId:run.id,participant:run.participant,version:run.version,caseId:run.caseId,order:run.order,type,time:new Date().toISOString(),elapsedMs:Math.max(0,Date.now()-run.startedAt),page:decodeURIComponent(location.pathname).split('/').pop(),data};
  queue.push(event);
  if(persist()){status=config.endpoint?'等待上传':'未配置上传接口';paintStatus();}
  return event;
 }
 async function flush(){
  if(busy||!queue.length||!config.endpoint||Date.now()<retryAt)return;
  busy=true;
  const batch=queue.slice(0,40);
  status='正在上传';paintStatus();
  try{
   const response=await fetch(config.endpoint.replace(/\/$/,'')+'/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:config.writeKey,events:batch}),signal:AbortSignal.timeout(12000),keepalive:JSON.stringify(batch).length<45000});
   if(!response.ok)throw Error('HTTP '+response.status);
   const result=await response.json();
   if(!Array.isArray(result.accepted))throw Error('接收端未确认');
   const sent=new Set(result.accepted);
   if(!batch.every(event=>sent.has(event.id)))throw Error('接收端未完整确认');
   queue=queue.filter(event=>!sent.has(event.id));persist();
   failures=0;retryAt=0;status=queue.length?'等待上传':'已自动上传';
  }catch{failures++;retryAt=Date.now()+Math.min(60000,2000*2**Math.min(failures,5));status='上传失败，已保留，稍后重试';}
  finally{busy=false;paintStatus();}
 }
 function begin({participant,version,caseId,order}){
  run={id:crypto.randomUUID(),participant,version,caseId,order,startedAt:Date.now(),ended:false};
  sessionStorage.setItem(runKey,JSON.stringify(run));track('task_start');flush();
 }
 function finish(outcome){
  if(!run||run.ended)return;
  const submission=window.ExperimentSubmission?.capture();
  if(submission)track('submission_result',submission);
  track('task_end',{outcome,verified:submission?.passed,checks:submission?.checks});run.ended=true;sessionStorage.setItem(runKey,JSON.stringify(run));flush();
  document.getElementById('experimentFinish')?.setAttribute('disabled','');
  document.getElementById('experimentHelp')?.setAttribute('disabled','');
 }
 function download(){const blob=new Blob([JSON.stringify({run,events:queue},null,2)],{type:'application/json'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='实验待上传备份.json';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);}
 window.Experiment={track,flush,begin,finish,pending:()=>queue.length};
 const path=decodeURIComponent(location.pathname);
 const isPrototype=path.includes('老版本AB')||path.includes('规则对比版')||path.endsWith('/index.html')||path.endsWith('/maomao-demo/');
 if(isPrototype&&run&&!run.ended){
  const style=document.createElement('style');
  style.textContent='.experiment-panel{position:fixed;right:8px;top:4px;z-index:30;font:11px/1.5 sans-serif;background:#fff;border:1px solid #ddd;border-radius:8px;padding:5px;box-shadow:0 2px 9px #0001}.experiment-panel summary{cursor:pointer;color:#777}.experiment-panel button,.experiment-panel a{display:inline-block;font:11px sans-serif;padding:7px;margin:3px;background:#eee;color:#333;border:0;border-radius:5px;text-decoration:none}';
  document.head.append(style);
  const panel=document.createElement('details');panel.className='experiment-panel';
  panel.innerHTML='<summary>实验记录 · <span id="experimentUploadStatus"></span></summary><p id="experimentRunLabel"></p><button id="experimentHelp">记录一次求助</button><button id="experimentFinish">结束本轮</button><button id="experimentBackup">导出待传备份</button><a href="AB测试入口.html">返回测试入口</a>';
  document.body.append(panel);
  document.getElementById('experimentRunLabel').textContent=run.participant+' · '+run.version+' · '+run.caseId;
  document.getElementById('experimentHelp').onclick=()=>track('help_requested');
  document.getElementById('experimentBackup').onclick=download;
  document.getElementById('experimentFinish').onclick=()=>{
   const dialog=document.createElement('dialog');dialog.innerHTML='<h3>结束本轮测试</h3><p>此处记录完成状态，配置是否正确由主持人核对。</p><button data-outcome="reported_complete">已完成</button> <button data-outcome="gave_up">未完成 / 放弃</button> <button data-cancel>继续操作</button>';
   dialog.querySelectorAll('[data-outcome]').forEach(button=>button.onclick=()=>{finish(button.dataset.outcome);dialog.close();dialog.remove();});
   dialog.querySelector('[data-cancel]').onclick=()=>{dialog.close();dialog.remove();};document.body.append(dialog);dialog.showModal();
  };
  track('page_open');
  document.addEventListener('click',event=>{
   const button=event.target.closest('button,a');
   if(!button||button.closest('.experiment-panel,.task-panel')||button.matches('[data-temporary-key],[data-paint]'))return;
   track('click',{target:(button.getAttribute('aria-label')||button.textContent||'').trim().slice(0,100),action:(button.getAttribute('onclick')||'').slice(0,160)});
  },true);
  document.addEventListener('change',event=>{
   const input=event.target;if(!input.matches('input,select')||input.closest('.experiment-panel'))return;
   const value=input.type==='number'||input.type==='date'||input.type==='time'||input.tagName==='SELECT'?input.value:input.type==='checkbox'?input.checked:undefined;
   track('field_change',{field:input.id||input.getAttribute('aria-label')||input.closest('label')?.textContent.trim().slice(0,40)||input.type,value});
  },true);
  let lastSelection=null;
  document.addEventListener('pointerdown',event=>{if(event.target.closest('[data-paint]'))lastSelection={pointer:event.pointerId,start:performance.now()};},true);
  document.addEventListener('pointerup',event=>{if(lastSelection?.pointer!==event.pointerId)return;setTimeout(()=>{track('grid_selection',{grid:'weekly',method:'rectangle',count:document.querySelectorAll('[data-paint][aria-pressed="true"]').length,durationMs:Math.round(performance.now()-lastSelection.start)});lastSelection=null;},0);},true);
  const toasts=document.getElementById('toast');
  if(toasts)new MutationObserver(()=>{const message=toasts.textContent.trim();if(message)track(/失败|请先|请输入|请选择|重叠|无效|须在|请检查/.test(message)?'validation_error':'feedback',{message:message.slice(0,300)});}).observe(toasts,{childList:true,characterData:true,subtree:true});
  let lastError='';
  const captureErrors=()=>{const message=[...document.querySelectorAll('[role="alert"],.error')].map(element=>element.textContent.trim()).filter(Boolean).join(' | ');if(message&&message!==lastError)track('validation_error',{message:message.slice(0,500)});lastError=message;};
  new MutationObserver(captureErrors).observe(document.getElementById('app')||document.body,{childList:true,characterData:true,subtree:true});
  const nativeSet=Storage.prototype.setItem;
  Storage.prototype.setItem=function(key,value){nativeSet.call(this,key,value);if(this===localStorage&&['maomao-old-ab-plans','maomao-pricing-workflow-v1'].includes(key)){try{track('plan_saved',{key,snapshot:JSON.parse(value)});}catch{}}};
  window.addEventListener('error',event=>track('runtime_error',{message:String(event.message).slice(0,300)}));
 }
 window.addEventListener('online',()=>{retryAt=0;flush();});
 document.addEventListener('visibilitychange',()=>{if(run&&!run.ended)track('visibility',{state:document.visibilityState});flush();});
 window.addEventListener('pagehide',()=>{if(run&&!run.ended)track('page_leave');flush();});
 setInterval(flush,4000);paintStatus();flush();
})();
