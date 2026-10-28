'use strict';
let temporaryGesture=null;
const temporaryRectangleStyle=document.createElement('style');
temporaryRectangleStyle.textContent='.temporary-table{touch-action:none;user-select:none;-webkit-user-select:none}.temporary-table td button{touch-action:none}.phone{position:relative}.phone>.toast{position:absolute;left:50%;bottom:95px;width:max-content;max-width:calc(100% - 32px);white-space:normal;overflow-wrap:anywhere;box-sizing:border-box;text-align:center;z-index:40}.temporary-inline-error{font-size:12px;color:#b13f2a;background:#fff0eb;padding:12px;border-radius:10px;margin:12px 0;overflow-wrap:anywhere}.temporary-inline-error:empty{display:none}.temporary-date-caption{display:block;font-size:9px;color:#999;font-style:normal}.temporary-range-note{font-size:11px;color:#888;margin-top:10px}dialog.temporary-dialog{max-height:80dvh;overflow:auto}';
document.head.append(temporaryRectangleStyle);
document.querySelector('.phone').append(document.getElementById('toast'));
const renderTemporaryBeforeRectangle=renderOriginalTemporary;
renderOriginalTemporary=function(){renderTemporaryBeforeRectangle();app.querySelectorAll('.temporary-table thead th').forEach((header,index)=>{if(!index)return;const date=temporaryDateAt(index-1);const caption=document.createElement('small');caption.className='temporary-date-caption';caption.textContent=temporaryHeaderMode==='weekday'?date.slice(5).replace('-','.'):'周'+days[(new Date(date+'T12:00:00').getDay()+6)%7];header.append(caption);});const fields=app.querySelector('.temporary-fields');fields.insertAdjacentHTML('beforeend','<p class="temporary-range-note">保存所选格子的价格时，结束日期会自动延长至最后一个改价日期。</p><p id="temporaryPublishError" class="temporary-inline-error" role="alert"></p>');installTemporaryRectangle();};
function showTemporaryError(message){const error=document.getElementById('temporaryPublishError');if(!error)return toast(message);error.textContent=message;error.scrollIntoView({block:'nearest',behavior:'smooth'});}
function installTemporaryRectangle(){
 const grid=app.querySelector('.temporary-table');
 if(!grid)return;
 const cells=[...grid.querySelectorAll('[data-temporary-key]')];
 cells.forEach((cell,index)=>{
  cell.dataset.column=index%7;
  cell.dataset.row=Math.floor(index/7);
  cell.removeAttribute('onclick');
  cell.onkeydown=event=>{
   if(event.key!==' '&&event.key!=='Enter')return;
   event.preventDefault();
   const [date,hour]=cell.dataset.temporaryKey.split('|');
   editTemporaryCell(date,Number(hour));
   window.Experiment?.track('grid_selection',{grid:'temporary',method:'keyboard',count:temporarySelection.size});
  };
 });
 grid.onpointerdown=event=>{
  const cell=event.target.closest('[data-temporary-key]');
  if(!cell||event.button>0)return;
  event.preventDefault();
  temporaryGesture={pointer:event.pointerId,column:Number(cell.dataset.column),row:Number(cell.dataset.row),baseline:new Set(temporarySelection),add:!temporarySelection.has(cell.dataset.temporaryKey)};
  grid.setPointerCapture(event.pointerId);
  updateTemporaryRectangle(cell);
 };
 grid.onpointermove=event=>{
  if(!temporaryGesture||event.pointerId!==temporaryGesture.pointer)return;
  const cell=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-temporary-key]');
  if(cell&&grid.contains(cell))updateTemporaryRectangle(cell);
 };
 grid.onpointerup=event=>{
  if(!temporaryGesture||event.pointerId!==temporaryGesture.pointer)return;
  const gesture=temporaryGesture;
  temporaryGesture=null;
  if(grid.hasPointerCapture(event.pointerId))grid.releasePointerCapture(event.pointerId);
  window.Experiment?.track('grid_selection',{grid:'temporary',method:'rectangle',count:temporarySelection.size,add:gesture.add,keys:[...temporarySelection]});
 };
 grid.onpointercancel=event=>{
  if(!temporaryGesture||event.pointerId!==temporaryGesture.pointer)return;
  temporarySelection.clear();
  temporaryGesture.baseline.forEach(key=>temporarySelection.add(key));
  temporaryGesture=null;
  refreshTemporarySelection();
 };
 grid.onlostpointercapture=()=>{if(temporaryGesture){temporarySelection.clear();temporaryGesture.baseline.forEach(key=>temporarySelection.add(key));temporaryGesture=null;refreshTemporarySelection();}};
}
function updateTemporaryRectangle(cell){
 const column=Number(cell.dataset.column),row=Number(cell.dataset.row),gesture=temporaryGesture;
 temporarySelection.clear();
 gesture.baseline.forEach(key=>temporarySelection.add(key));
 app.querySelectorAll('[data-temporary-key]').forEach(button=>{
  const buttonColumn=Number(button.dataset.column),buttonRow=Number(button.dataset.row);
  if(buttonColumn<Math.min(column,gesture.column)||buttonColumn>Math.max(column,gesture.column)||buttonRow<Math.min(row,gesture.row)||buttonRow>Math.max(row,gesture.row))return;
  if(gesture.add)temporarySelection.add(button.dataset.temporaryKey);
  else temporarySelection.delete(button.dataset.temporaryKey);
 });
 refreshTemporarySelection();
}
if(originalTab==='temp')render();
