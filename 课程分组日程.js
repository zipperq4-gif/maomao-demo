const coursesBeforeShelfActions=coursesView;
coursesView=function(){
const html=coursesBeforeShelfActions();
if(ops.editCourse||ops.editSession||!elevated())return html;
return html.replace(/(<button class="btn " onclick="openCourse\((\d+)\)">详情 \/ 编辑<\/button>)/g,(match,original,index)=>original+button(ops.courses[Number(index)].hidden?'重新上架':'下架课程',`toggleCourse(${index})`));
};
toggleCourse=function(index){
if(!elevated())return;
const course=ops.courses[index];
if(!course||course.archived)return;
const content=course.hidden?`<p>重新上架「${safe(course.name)}」？</p><p>恢复课程展示；尚未取消、未结束且符合报名条件的场次可以继续接收新报名。</p><p>已取消或已结束的场次不会恢复。已有订单仍按原规则履约；修改后的课程资料仅用于后续新发布场次。</p>`:`<p>确认下架「${safe(course.name)}」？</p><p><b>下架后：</b>停止课程对外展示及所有场次的新报名。</p><p><b>已有安排：</b>不取消已发布场次，不释放场地；已报名订单继续履约、核销和售后，不自动退款。</p><p><b>后续操作：</b>课程仍可编辑、查看排期，并可在“已下架”中重新上架。若需停止已有场次，请单独取消并处理报名订单。</p>`;
sheet(course.hidden?'重新上架课程':'下架课程',content,button('取消','closeModal()')+button(course.hidden?'确认上架':'确认下架',`confirmToggleCourse(${index})`,true));
};
ops.scheduleGroups=[];
const scheduleFormBeforeGroups=sessionForm;
sessionForm=function(){ops.scheduleExpanded=false;ops.scheduleGroupId='';ops.useScheduleGroup=false;scheduleFormBeforeGroups()};
function chooseScheduleGroup(value){
ops.scheduleGroupId=value;
const group=ops.scheduleGroups[Number(value)];
if(value!==''&&group){
ops.scheduleCells=structuredClone(group.cells);
ops.scheduleCourt=group.cells[0]?.court??0;
ops.useScheduleGroup=true;
}
render();
}
function toggleScheduleGroup(checked){
if(checked&&!ops.scheduleGroups.length){ops.useScheduleGroup=false;render();return problem('暂无分组日程。请先添加排课，并保存为分组日程。')}
ops.useScheduleGroup=checked;
if(checked&&ops.scheduleGroupId==='')ops.scheduleGroupId='0';
if(checked&&ops.scheduleGroupId!=='')chooseScheduleGroup(ops.scheduleGroupId);else render();
}
function saveScheduleGroup(){
if(!ops.scheduleCells.length)return problem('请先在排课表添加安排');
sheet('保存为分组日程',field('分组名称',input('scheduleGroupName','','text','placeholder="例如：少儿周末组" maxlength="30"'))+'<p>保存每周开始时间与场地；不会复制订单或报名。其他课程需主动选择沿用。</p>',button('取消','closeModal()')+button('保存分组','commitScheduleGroup()',true));
}
function commitScheduleGroup(){
const name=$('scheduleGroupName').value.trim();
if(!name)return toast('请填写分组名称');
ops.scheduleGroups.push({name,cells:structuredClone(ops.scheduleCells)});
ops.scheduleGroupId=String(ops.scheduleGroups.length-1);ops.useScheduleGroup=true;closeModal();render();toast('分组日程已保存，可供其他课程沿用');
}
const gridSessionEditorBeforeGroups=sessionEditor;
sessionEditor=function(){
if(ops.batchPreview)return batchPreviewView();
const courseIndex=ops.sessionDraft.course||0,course=ops.courses[courseIndex];
if(!course)return page('', '<div class="empty">请先创建课程</div>',button('返回课程','backCourses()'));
const published=ops.sessions.filter(session=>session.course===courseIndex&&!session.cancelled);
const names=['周日','周一','周二','周三','周四','周五','周六'];
return page('',`${field('当前课程',`<select onchange="ops.sessionDraft.course=Number(this.value);ops.scheduleCells=[];ops.useScheduleGroup=false;ops.scheduleGroupId='';render()">${ops.courses.map((item,index)=>`<option value="${index}" ${index===courseIndex?'selected':''}>${safe(item.name)}</option>`).join('')}</select>`)}<div class="ops-row">${field('开始日期',input('groupFrom',ops.sessionFrom,'date','onchange="ops.sessionFrom=this.value"'))}${field('结束日期',input('groupUntil',ops.sessionUntil,'date','onchange="ops.sessionUntil=this.value"'))}</div><section class="schedule-group-card"><div class="row"><h3>沿用分组日程</h3><label class="schedule-switch"><input type="checkbox" ${ops.useScheduleGroup?'checked':''} onchange="toggleScheduleGroup(this.checked)">启用</label></div><p>主动选择共享的每周安排，价格、时长和名额仍使用当前课程规则。</p>${ops.useScheduleGroup?field('选择分组',`<select onchange="chooseScheduleGroup(this.value)"><option value="">请选择分组</option>${ops.scheduleGroups.map((group,index)=>`<option value="${index}" ${ops.scheduleGroupId===String(index)?'selected':''}>${safe(group.name)}</option>`).join('')}</select>`)+(ops.scheduleGroups.length?'':'<p>暂无分组。先单独设置日程，再保存为分组供其他课程沿用。</p>'):''}</section><h3 class="section-title">已安排日程</h3><section class="schedule-group-card">${published.map(session=>`<div class="kv"><span>${session.date} ${session.start}–${session.end}<br>${safe(state.courts[session.court])}</span><b>已发布${session.booked?' · 已报名':''}</b></div>`).join('')}${ops.scheduleCells.map((cell,index)=>`<div class="kv"><span>${safe(state.courts[cell.court])} · ${names[cell.week]} ${cell.start}<br>每场${course.duration}分钟 · 待发布</span>${button('移除',`ops.scheduleCells.splice(${index},1);render()`)}</div>`).join('')}${!published.length&&!ops.scheduleCells.length?'<p>尚未安排，请沿用分组或添加日程。</p>':''}${published.length?button('管理已发布场次',`ops.editSession=false;openSessions(${courseIndex})`):''}</section>${button(ops.scheduleExpanded?'收起排课表':'＋ 添加 / 修改排课','ops.scheduleExpanded=!ops.scheduleExpanded;render()',true)}${ops.scheduleExpanded?`<div class="notice">正在编辑当前课程的独立草稿；不会同步修改分组或其他课程。</div>${tabs(state.courts,state.courts[ops.scheduleCourt],'scheduleCourtTab')}<p>点击开始时间添加或取消，每次按课程时长生成一场；重叠安排将在预览中提示。</p>${scheduleGrid(course)}${button('保存为分组日程','saveScheduleGroup()')}`:''}`,button('返回课程','backCourses()')+button('下一步：预览','generateGridSessions()',true)).replace('class="ops"','class="ops schedule-group-design"');
};
const groupPreviewBefore=batchPreviewView;
const scheduleEditorWithSource=sessionEditor;
sessionEditor=function(){
const html=scheduleEditorWithSource();
const group=ops.useScheduleGroup&&ops.scheduleGroupId!==''?ops.scheduleGroups[Number(ops.scheduleGroupId)]:null;
const message=group?`当前沿用「${safe(group.name)}」分组日程，已载入${group.cells.length}个每周安排；列表与排课表同步显示。调整仅保存到当前课程，原分组保持不变。`:ops.useScheduleGroup?'请先选择分组，选择后将同步显示该分组的每周安排。':'正在设置当前课程的独立日程；可保存为分组供其他课程沿用。';
return html.replace('正在编辑当前课程的独立草稿；不会同步修改分组或其他课程。',message).replace(/<button class="btn " onclick="ops.editSession=false;openSessions\(\d+\)">管理已发布场次<\/button>/,'');
};
function scheduleConflictHelp(reason){
if(reason.includes('截止'))return '调整到未来日期或更晚的开课时间，再重新检查。';
if(reason.includes('下架'))return '先恢复课程上架状态，再重新检查。';
if(reason.includes('营业')||reason.includes('对齐'))return '调整到营业范围内，并将开始时间对齐半小时。';
return '返回调整场地、时间或教练；也可跳过本场。已有预约和已发布课程不会被覆盖。';
}
function skipScheduleCandidate(index){ops.batchPreview.splice(index,1);render()}
batchPreviewView=function(){
const list=ops.batchPreview,valid=list.filter(session=>!session.error),conflicts=list.length-valid.length;
return page('',`<h3 class="section-title">日程预览与发布检查</h3><div class="summary-bar"><b>共${list.length}场</b><span class="good">可发布${valid.length}</span><span class="${conflicts?'bad':'mini'}">需处理${conflicts}</span></div><details class="notice"><summary>什么情况需要处理？</summary><p>场地已有预约、支付占位、锁场或其他课程；同一教练时间重叠；本次安排自身重叠或重复；课程已下架、超过报名截止或时间不符合营业要求。</p><p>返回调整后重新检查，或逐场跳过。发布只写入通过检查的场次，不覆盖原有日程。</p></details>${tabs(['全部','冲突','可发布'],ops.previewFilter,'setBatchFilter')}${list.map((session,index)=>({session,index})).filter(({session})=>ops.previewFilter==='全部'||(ops.previewFilter==='冲突'?session.error:!session.error)).map(({session,index})=>`<section class="schedule-group-card"><h3>${session.date} ${session.start}–${session.end}</h3><p>${safe(state.courts[session.court])} · ${safe(session.coach||'教练待安排')}</p><b class="${session.error?'bad':'good'}">${safe(session.error||'检查通过')}</b>${session.error?`<p>${safe(scheduleConflictHelp(session.error))}</p>${button('返回调整','ops.batchPreview=null;ops.scheduleExpanded=true;render()')}${button('跳过本场',`skipScheduleCandidate(${index})`)}`:''}</section>`).join('')}${!list.length?'<p>本次暂无待发布场次，请返回添加安排。</p>':''}`,button('返回调整','ops.batchPreview=null;ops.scheduleExpanded=true;render()')+`<button class="btn primary" ${valid.length?'':'disabled'} onclick="commitSessions()">${conflicts?'仅发布通过检查的':'发布'}${valid.length}场</button>`).replace('class="ops"','class="ops schedule-group-design"');
};
const publishGroupsBefore=commitSessions;
commitSessions=function(){
if(!elevated()||!ops.batchPreview)return;
const candidates=[];let changed=false;
for(const session of ops.batchPreview){if(session.error)continue;const reason=candidateError(session,candidates);if(reason){session.error=reason;changed=true}else candidates.push(session)}
if(changed){render();return problem('场地或教练状态已变化，请核对新的冲突后再发布')}
publishGroupsBefore();
};
style.textContent+=`.schedule-group-design{font-size:15px;line-height:24px}.schedule-group-design .schedule-group-card{padding:16px;border-radius:20px;background:#fff;box-shadow:0 4px 20px #19232d0a;border:1px solid #f0f1f2;margin:16px 0}.schedule-group-design h3{font-size:17px;line-height:24px}.schedule-group-design p{font-size:13px;line-height:20px;color:#626d70}.schedule-group-design label{font-size:13px;line-height:20px}.schedule-group-design input,.schedule-group-design select{font-size:15px;min-height:44px}.schedule-group-design .schedule-switch{display:flex;align-items:center;margin:0;gap:4px}.schedule-group-design .schedule-switch input{min-height:0;accent-color:#d84925}.schedule-group-design .btn{border-radius:12px;font-size:14px}.schedule-group-design .btn.primary{background:#d84925;color:white}.schedule-group-design .kv{font-size:13px;line-height:20px}.schedule-group-design .ops-footer{bottom:0}.schedule-group-design>.btn.primary{width:100%;min-height:44px}.schedule-group-design .notice{font-size:13px;line-height:20px}`;
render();
