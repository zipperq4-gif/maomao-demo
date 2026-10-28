(()=>{
 const specifications={
  S1:{base:80,rows:[[0,5,18,22,120],[5,7,8,22,130]]},
  S2:{base:90,rows:[[0,5,14,18,110],[5,7,8,22,140]]},
  C1:{base:80,rows:[[0,5,8,10,60],[0,5,18,20,120],[0,5,20,22,150],[5,7,8,14,110],[5,7,14,22,160]],extra:[5,18,20,180],temporary:[[10,12,70],[18,20,140]]},
  C2:{base:90,rows:[[0,5,10,12,70],[0,5,16,18,130],[0,5,18,20,160],[5,7,8,16,170],[5,7,16,22,120]],extra:[6,10,12,190],temporary:[[8,10,80],[16,18,150]]}
 };
 const read=key=>{try{return JSON.parse(localStorage.getItem(key));}catch{return null;}};
 const time=value=>{const [hour,minute]=value.split(':').map(Number);return hour+minute/60;};
 const clock=hour=>String(Math.floor(hour)).padStart(2,'0')+':'+(hour%1?'30':'00');
 function capture(){
  const run=readSession(),spec=specifications[run?.caseId];if(!spec)return null;
  const raw=run.version==='A'?read('maomao-old-ab-plans')||{}:read('maomao-pricing-workflow-v1')||[];
  const courts=[0,1,2].map(index=>run.version==='A'?raw[(index+1)+'号场']:raw.find(group=>group.courts.includes(index))?.plan);
  function longPrice(plan,day,hour){if(!plan)return null;const rule=plan.rules.find(row=>row.days.includes(run.version==='A'?day+1:day)&&hour>=(run.version==='A'?time(row.start):row.start)&&hour<(run.version==='A'?time(row.end):row.end));return rule?Number(rule.price):run.version==='A'?null:Number(plan.base);}
  const checks=[],mismatches=[];
  const add=(label,passed,detail='')=>checks.push({label,passed,detail});
  const complex=run.caseId.startsWith('C');
  for(let court=0;court<3;court++){
   const plan=courts[court],name=(court+1)+'号场';
   if(court===2&&!complex){add('3号场保持未运营',!plan,plan?'存在已发布定价，应保持未设置':'未发布价格，无需填写');continue;}
   add(name+'已正式发布',Boolean(plan),plan?'已发布':'尚未发布；保存草稿或打开预览不算发布');
   if(!plan)continue;
   add(name+'生效日期',plan.start==='2026-11-01','要求2026-11-01，实际'+plan.start);
   if(run.version==='A')add(name+'长期有效',plan.original?.expiry==='长期有效');
   const errors=[];
   for(let day=0;day<7;day++)for(let hour=8;hour<22;hour+=.5){let expected=spec.base;for(const [fromDay,toDay,from,to,price] of spec.rows)if(day>=fromDay&&day<toDay&&hour>=from&&hour<to)expected=price;if(court===2&&spec.extra&&day===spec.extra[0]&&hour>=spec.extra[1]&&hour<spec.extra[2])expected=spec.extra[3];const actual=longPrice(plan,day,hour);if(actual!==expected)errors.push({court:name,day:day+1,start:clock(hour),expected,actual});}
   add(name+'整周长期价格',!errors.length,errors.length?'有'+errors.length+'个半小时时段与题目不一致':'7天全部营业时段匹配');mismatches.push(...errors);
   const slots=run.version==='A'?plan.temporary||[]:plan.special||[];
   if(court!==2||!complex){add(name+'没有额外临时改价',slots.length===0);continue;}
   const temporaryErrors=[];
   for(let hour=8;hour<22;hour+=.5){let expected=longPrice(plan,5,hour);for(const [from,to,price] of spec.temporary)if(hour>=from&&hour<to)expected=price;const override=[...slots].reverse().find(row=>row.date==='2026-11-14'&&hour>=(run.version==='A'?time(row.start):(row.start??8))&&hour<(run.version==='A'?time(row.end):(row.end??22)));const actual=override?Number(override.price):longPrice(plan,5,hour);if(actual!==expected)temporaryErrors.push({court:name,date:'2026-11-14',start:clock(hour),expected,actual});}
   add('3号场11月14日临时价格',!temporaryErrors.length,temporaryErrors.length?'有'+temporaryErrors.length+'个半小时时段不匹配':'活动日全部营业时段匹配');
   add('没有修改其他日期',slots.every(row=>row.date==='2026-11-14'));
   mismatches.push(...temporaryErrors);
  }
  return {caseId:run.caseId,passed:checks.every(check=>check.passed),checks,mismatches,snapshot:raw};
 }
 function readSession(){try{return JSON.parse(sessionStorage.getItem('maomao-experiment-active-run'));}catch{return null;}}
 window.ExperimentSubmission={capture};
})();
