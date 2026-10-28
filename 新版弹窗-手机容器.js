(()=>{
 const phone=document.querySelector('.phone');if(!phone)return;
 const style=document.createElement('style');
 style.textContent='.phone{position:relative}.phone-dialog-mask{position:absolute;inset:0;background:#18201466;z-index:80;pointer-events:none}.phone-scoped-dialog::backdrop{background:transparent}.phone-scoped-dialog{position:fixed;inset:auto;margin:0;box-sizing:border-box;overscroll-behavior:contain;overflow:auto;max-width:none;border:0;border-radius:18px;padding:0;box-shadow:0 12px 40px #0002}.phone-scoped-dialog:not(.pricing-dialog){padding:20px}.phone-scoped-dialog:not(.pricing-dialog) button{padding:10px 12px;background:#eef1e9;border-radius:8px;margin:8px 4px 0 0}.phone>.toast{position:absolute;bottom:95px;left:50%;max-width:calc(100% - 32px);width:max-content;white-space:normal;overflow-wrap:anywhere;text-align:center;z-index:90}';
 document.head.append(style);
 const toastElement=document.getElementById('toast');if(toastElement)phone.append(toastElement);
 const nativeShowModal=HTMLDialogElement.prototype.showModal;
 const active=new Map();
 function position(dialog){
  if(!dialog.open)return;
  const bounds=phone.getBoundingClientRect();
  const inset=16,width=Math.max(0,bounds.width-inset*2),height=Math.max(0,bounds.height-inset*2);
  dialog.style.width=width+'px';dialog.style.maxHeight=height+'px';
  dialog.style.left=bounds.left+inset+'px';
  dialog.style.top=bounds.top+Math.max(inset,(bounds.height-dialog.getBoundingClientRect().height)/2)+'px';
 }
 HTMLDialogElement.prototype.showModal=function(){
  if(this.open)return nativeShowModal.call(this);
  this.classList.add('phone-scoped-dialog');
  phone.append(this);
  nativeShowModal.call(this);
  const mask=document.createElement('div');mask.className='phone-dialog-mask';mask.setAttribute('aria-hidden','true');phone.append(mask);
  const observer=new ResizeObserver(()=>position(this));observer.observe(this);
  const cleanup=()=>{mask.remove();observer.disconnect();active.delete(this);};
  this.addEventListener('close',cleanup,{once:true});
  active.set(this,{cleanup});position(this);
 };
 const update=()=>active.forEach((value,dialog)=>{if(!dialog.isConnected||!dialog.open)value.cleanup();else position(dialog);});
 new ResizeObserver(update).observe(phone);
 window.addEventListener('resize',update);
 window.addEventListener('scroll',update,{passive:true,capture:true});
 new MutationObserver(update).observe(phone,{childList:true,subtree:true});
})();
