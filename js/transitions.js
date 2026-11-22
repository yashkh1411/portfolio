// Chapter entry is one perspective move, preserving the object-to-evidence connection.
export function createChapterEntrance(lenis,reduced){
 const entries={promptforge:['PromptForge','52 to 64','A better prompt, without giving away control.','assets/proof/14-retry-final-composer.png'],do:['DO','Your say.','A plan is only useful when you stay in control.'],finpulse:['FinPulse X','₹4,840','One dataset. Every view in agreement.'],roam:['SteadyNest','A little less lost.','Real Delhi footprints. A day that connects.']};
 let busy=false;
 function enter(id,rect){
  const target=document.getElementById(id);if(!target||busy)return;
  const jump=()=>{let y=target.getBoundingClientRect().top+scrollY;if(id==='finpulse'&&!reduced)y+=Math.max(0,target.offsetHeight-innerHeight)*.17;if(id==='roam'&&!reduced)y+=Math.max(0,target.offsetHeight-innerHeight)*.06;lenis?lenis.scrollTo(y,{immediate:true,force:true}):scrollTo(0,y);history.replaceState(null,'','#'+id)};
  const focus=()=>{const h=target.querySelector('h2,h1');if(h){h.tabIndex=-1;h.focus({preventScroll:true})}};
  if(reduced||!entries[id]){jump();focus();return}
  busy=true;lenis?.stop();
  const [name,proof,why,img]=entries[id];const overlay=document.createElement('div');overlay.className='zoom-portal';overlay.setAttribute('aria-hidden','true');
  const frame=document.createElement('div');frame.className='zoom-portal__frame';const small=document.createElement('small');small.textContent=name+' / Enter the build';const strong=document.createElement('strong');strong.textContent=proof;const p=document.createElement('p');p.textContent=why;frame.append(small,strong);if(img){const image=new Image();image.src=img;image.alt='';frame.append(image)}frame.append(p);
  const aperture=document.createElement('i');aperture.className='zoom-portal__aperture';
  const left=document.createElement('i');left.className='zoom-portal__leaf zoom-portal__leaf--left';
  const right=document.createElement('i');right.className='zoom-portal__leaf zoom-portal__leaf--right';
  const monogram=document.createElement('span');monogram.className='zoom-portal__monogram';monogram.textContent='YK';
  overlay.append(aperture,frame,left,right,monogram);document.body.append(overlay);
  const cx=(rect?.left??innerWidth/2)+(rect?.width??0)/2-innerWidth/2,cy=(rect?.top??innerHeight/2)+(rect?.height??0)/2-innerHeight/2;
  overlay.animate([{opacity:0},{opacity:1}],{duration:190,fill:'forwards'});
  left.animate([{transform:'perspective(1200px) rotateY(0deg)'},{transform:'perspective(1200px) rotateY(-94deg)'}],{duration:920,delay:110,easing:'cubic-bezier(.75,0,.2,1)',fill:'forwards'});
  right.animate([{transform:'perspective(1200px) rotateY(0deg)'},{transform:'perspective(1200px) rotateY(94deg)'}],{duration:920,delay:110,easing:'cubic-bezier(.75,0,.2,1)',fill:'forwards'});
  monogram.animate([{opacity:1,transform:'translate(-50%,-50%) scale(1)'},{opacity:0,transform:'translate(-50%,-50%) scale(1.22)'}],{duration:510,delay:190,easing:'ease-in',fill:'forwards'});
  frame.animate([{transform:`translate(calc(-50% + ${cx*.15}px),calc(-50% + ${cy*.15}px)) scale(.85) rotateY(-5deg)`,opacity:.2},{transform:'translate(-50%,-50%) scale(1) rotateY(0deg)',opacity:1,offset:.48},{transform:'translate(-50%,-50%) scale(4) translateZ(180px)',opacity:0}],{duration:1290,delay:280,easing:'cubic-bezier(.52,0,.22,1)',fill:'forwards'});
  let ended=false;const timers=[];
  const finish=()=>{if(ended)return;ended=true;timers.forEach(clearTimeout);overlay.remove();target.classList.remove('chapter-entering');lenis?.start();busy=false;document.removeEventListener('keydown',onKey);focus()};
  const onKey=e=>{if(e.key==='Escape'){jump();finish()}};document.addEventListener('keydown',onKey);
  timers.push(setTimeout(()=>{jump();target.classList.add('chapter-entering');overlay.animate([{opacity:1},{opacity:0}],{duration:390,fill:'forwards'})},1240));timers.push(setTimeout(finish,1650));
 }
 return{enter};
}
export function initChapterLinks(){
 const items=[['promptforge','do','Next: DO','An assistant that waits for your yes.'],['do','finpulse','Next: FinPulse X','Make the numbers make sense.'],['finpulse','roam','Next: SteadyNest','Turn a city into a connected day.']];
 for(const [from,to,label,description] of items){const a=document.createElement('a');a.className='project-next';a.href='#'+to;a.dataset.door=to;a.innerHTML=`<span><small>${label}</small><strong>${description}</strong></span><span>Enter chapter</span>`;document.getElementById(from).after(a)}
 const nav=document.querySelector('.nav');
 const update=()=>{const y=scrollY+90;const dark=['finpulse','contact'].some(id=>{const e=document.getElementById(id),t=e.getBoundingClientRect().top+scrollY;return y>=t&&y<t+e.offsetHeight});nav.classList.toggle('is-dark',dark)};
 addEventListener('scroll',update,{passive:true});update();
}
