import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=(a,b,x)=>{let t=clamp((x-a)/(b-a));return t*t*(3-2*t)};

// A real proof surface, in a product-shot scene. No stock product or invented interface.
export async function initHero({reduced=false}={}) {
 const host=document.querySelector('.cinema-hero'),canvas=document.querySelector('#hero-water');
 if(!host||!canvas)return null;
 let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:innerWidth>860,powerPreference:'low-power'});}catch{return null}
 renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<860?1:1.35));
 renderer.setClearColor(0x2f2334,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,100);
 const key=new THREE.DirectionalLight(0xffe8dd,3.1);key.position.set(-3,5,7);scene.add(key,new THREE.AmbientLight(0xffeee6,1.3));
 const rim=new THREE.DirectionalLight(0xe8a3ab,1.6);rim.position.set(6,2,-2);scene.add(rim);
 const material=new THREE.MeshPhysicalMaterial({color:0x78546a,metalness:.3,roughness:.16,clearcoat:1,clearcoatRoughness:.08});
 const ivory=new THREE.MeshStandardMaterial({color:0xfff7f0,roughness:.28,metalness:.11});
 const body=new THREE.Group(),front=new THREE.Group();body.add(front);scene.add(body);
 const frame=new THREE.Mesh(new RoundedBoxGeometry(2.95,3.95,.23,4,.09),material);front.add(frame);
 const cv=document.createElement('canvas');cv.width=960;cv.height=1280;const ctx=cv.getContext('2d');
 const texture=new THREE.CanvasTexture(cv);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const plate=new THREE.Mesh(new THREE.PlaneGeometry(2.74,3.73),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));plate.position.z=.126;front.add(plate);
 const glass=new THREE.Mesh(new THREE.PlaneGeometry(2.74,3.73),new THREE.MeshPhysicalMaterial({color:0xffffff,transparent:true,opacity:.085,metalness:.08,roughness:.06,clearcoat:1,depthWrite:false}));glass.position.z=.132;front.add(glass);
 const shot=new Image();shot.src='assets/proof/14-retry-final-composer.png';
 await Promise.allSettled([document.fonts.ready,shot.decode()]);
 ctx.fillStyle='#f7f6f1';ctx.fillRect(0,0,960,1280);
 ctx.fillStyle='#191817';ctx.font='500 27px "Geist Mono"';ctx.fillText('PROMPTFORGE',66,92);ctx.fillStyle='#bf3e22';ctx.font='400 25px "Geist Mono"';ctx.fillText('PROOF / 01',672,92);
 ctx.strokeStyle='#19181733';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(66,126);ctx.lineTo(894,126);ctx.stroke();
 ctx.fillStyle='#191817';ctx.font='500 186px "Host Grotesk"';ctx.fillText('52',56,340);ctx.fillStyle='#bf3e22';ctx.font='italic 114px "Instrument Serif"';ctx.fillText('to',355,330);ctx.fillStyle='#191817';ctx.font='500 186px "Host Grotesk"';ctx.fillText('64',544,340);
 ctx.font='400 34px "Host Grotesk"';ctx.fillText('A sharper prompt. The choice stays yours.',66,410);
 ctx.fillStyle='#191817';ctx.fillRect(66,480,828,425);
 if(shot.naturalWidth){ctx.drawImage(shot,0,240,shot.naturalWidth,500,66,480,828,425)}
 ctx.fillStyle='#696862';ctx.font='400 23px "Geist Mono"';ctx.fillText('REAL CAPTURE / LOCAL TEST PAGE',66,950);
 ctx.fillStyle='#191817';ctx.font='500 73px "Host Grotesk"';ctx.fillText('473 / 475',66,1084);ctx.font='400 29px "Host Grotesk"';ctx.fillText('tests passing on the last recorded run',66,1134);
 ctx.fillStyle='#696862';ctx.font='400 22px "Geist Mono"';ctx.fillText('10 NOV 2026',66,1210);ctx.fillStyle='#bf3e22';ctx.fillText('YOU PRESS SEND.',645,1210);texture.needsUpdate=true;
 // Offset ivory leaf gives the proof a physical edge, without a decorative card carousel.
 const leaf=new THREE.Mesh(new RoundedBoxGeometry(2.95,3.95,.13,3,.07),ivory);leaf.position.set(.22,.15,-.16);leaf.rotation.z=-.045;body.add(leaf);
 const seam=new THREE.Mesh(new THREE.BoxGeometry(.035,3.4,.02),new THREE.MeshBasicMaterial({color:0xd79da6}));seam.position.set(1.48,0,.07);body.add(seam);
 // A dozen small droplets detach from the real proof object during its rise.
 const droplets=[];const dropMat=new THREE.MeshPhysicalMaterial({color:0xf7ded5,transparent:true,opacity:.75,roughness:.12,metalness:.18});
 for(let i=0;i<12;i++){const d=new THREE.Mesh(new THREE.SphereGeometry(.012+(i%3)*.005,8,6),dropMat);scene.add(d);droplets.push(d)}
 const reflection=body.clone(true);reflection.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.19;o.material.depthWrite=false;o.material.clippingPlanes=[new THREE.Plane(new THREE.Vector3(0,-1,0),-1.65)];}});scene.add(reflection);renderer.localClippingEnabled=true;
 const water=new THREE.Mesh(new THREE.PlaneGeometry(80,80,1,1),new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0},uCenter:{value:new THREE.Vector2(2.3,0)}},vertexShader:`varying vec3 vWorld;void main(){vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,fragmentShader:`precision highp float;varying vec3 vWorld;uniform float uTime;uniform vec2 uCenter;
 void main(){vec2 p=vWorld.xz;float d=length(p-uCenter);float rings=sin(d*11.-uTime*.42)*exp(-d*.66);float fine=sin(p.y*20.+sin(p.x*1.8+uTime*.1))*0.5+0.5;float sheen=max(0.,rings)*.045+fine*.026;vec3 col=vec3(.69,.44,.52)+vec3(sheen,sheen*.8,sheen*.7);float alpha=.15+smoothstep(0.,9.,d)*.16;gl_FragColor=vec4(col,alpha);}` }));water.rotation.x=-Math.PI/2;water.position.y=-1.65;water.renderOrder=4;scene.add(water);
 let width=0,height=0,visible=true,start=performance.now(),disposed=false;
 const io=new IntersectionObserver(es=>{visible=es[0].isIntersecting});io.observe(host);
 function resize(){const r=canvas.getBoundingClientRect();width=r.width;height=r.height;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix()}
 resize();const ro=new ResizeObserver(resize);ro.observe(canvas);
 document.documentElement.classList.add('has-water');
 const copy=host.querySelector('.hero__intro'),meta=host.querySelector('.hero__meta'),foot=host.querySelector('.hero__foot');
 const nav=document.querySelector('.nav');let frameId;
 let lastFrame=0;
 function render(now){if(disposed)return;frameId=requestAnimationFrame(render);if(!visible||document.hidden||now-lastFrame<33)return;lastFrame=now;
  const mobile=width<860,p=reduced?0:clamp(-host.getBoundingClientRect().top/Math.max(1,host.offsetHeight-height));
  // The proof rises calmly and remains in the landscape. No lens-rushing zoom.
  const intro=reduced?1:smooth(0,1,(now-start)/2400),push=smooth(.18,.91,p),exit=smooth(.85,1,p);
  const x=mobile?.45:2.48,y=mobile?-1.08:.12;
  body.position.set(x,y-1.65*(1-intro),0);body.rotation.set(-.04,-.17+push*.08,.025*(1-push));body.scale.setScalar(mobile?.60:.86);
  reflection.position.set(x,-3.3-body.position.y,0);reflection.rotation.set(-body.rotation.x,body.rotation.y,-body.rotation.z);reflection.scale.set(body.scale.x,-body.scale.y,body.scale.z);
  const z=mobile?10.8:10.6;camera.position.set(x*.1*push,mobile?1.1-.25*push:1.05-.18*push,z-(mobile?.6:.75)*push);camera.lookAt(x*.08*push,mobile?-.22:.1,0);
  water.material.uniforms.uTime.value=reduced?0:(now-start)*.001;water.material.uniforms.uCenter.value.set(x,0);
  for(let i=0;i<droplets.length;i++){const d=droplets[i],drift=((now-start)*.00036+i*.137)%1;d.visible=intro>.28&&intro<1&&drift<.84;d.position.set(x-1.15+(i%6)*.47,y+1.9-drift*3.25-(1-intro)*3.4,.31);d.scale.setScalar(.6+drift*.8)}
  const fade=1-smooth(.44,.86,p);copy.style.opacity=String(fade);copy.style.transform=`translateY(${-p*18}px)`;meta.style.opacity=String(fade);foot.style.opacity=String(fade);canvas.style.opacity=String(1-exit);
  renderer.render(scene,camera);
 }
 frameId=requestAnimationFrame(render);
 return{dispose(){disposed=true;cancelAnimationFrame(frameId);io.disconnect();ro.disconnect();scene.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose()}});renderer.dispose()}};
}
