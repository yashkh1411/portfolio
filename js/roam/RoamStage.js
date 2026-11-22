// Ported from the earlier ChatGPT portfolio (types stripped, logic unchanged).
import * as THREE from 'three';
import { buildAtlas,                } from './atlas.js?v=16';
import { sampleAtlasCamera } from './camera.js?v=14';
import { isPortraitScene } from './scene-layout.js?v=14';

                                                               
                                                                                        
                                                                                                                        
const clamp=(n       ,a=0,b=1)=>Math.max(a,Math.min(b,n));
const smooth=(a       ,b       ,n       )=>{const t=clamp((n-a)/(b-a));return t*t*(3-2*t);};
const stops=[[1.964,.045,-2.858],[-.896,.045,-2.438],[-.826,.045,3.366]].map(p=>new THREE.Vector3(...p));
const markerHeights=[1.47,1.05,1.03];

/** One renderer; geography, architecture and camera interpolation are independent
 * modules. Rendering is demanded by scrolling, resizing or an asset becoming ready. */
export function mountRoamStage(canvas                  ,parent            ,options        )          {
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene(),city=new THREE.Group();scene.add(city);
  scene.fog=new THREE.Fog('#faf4e5',34,64);
  const camera=new THREE.PerspectiveCamera(39,1,.1,100);
  scene.add(new THREE.HemisphereLight('#fff9ed','#c9bbc8',1.8));
  const sun=new THREE.DirectionalLight('#ffeccc',2.15);sun.position.set(-5,11,5);sun.castShadow=true;
  sun.shadow.camera.left=-8;sun.shadow.camera.right=8;sun.shadow.camera.top=9;sun.shadow.camera.bottom=-9;sun.shadow.camera.near=.5;sun.shadow.camera.far=28;sun.shadow.bias=-.0002;sun.shadow.normalBias=.014;sun.shadow.radius=3;scene.add(sun);
  const fill=new THREE.DirectionalLight('#f4dae8',.5);fill.position.set(6,3,-5);scene.add(fill);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.ShadowMaterial({color:'#77516d',opacity:.12}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-.064;shadow.receiveShadow=true;scene.add(shadow);
  let dead=false,visible=true,raf=0,width=1,height=1,progress=options.reduced?1:0,selected=1;
  let atlas                                        ;
  const abort=new AbortController();
  const position=new THREE.Vector3(),target=new THREE.Vector3(),scratch=new THREE.Vector3();

  const pins              =[],heads             =[],halos             =[];
  const poleMaterial=new THREE.MeshStandardMaterial({color:'#806078',roughness:.5,metalness:.4});
  const headMaterial=new THREE.MeshStandardMaterial({color:'#de7b4a',roughness:.4,metalness:.12});
  stops.forEach((point,index)=>{
    const group=new THREE.Group();group.position.copy(point);const h=markerHeights[index];
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.011,.016,h,10),poleMaterial);pole.position.y=h/2;pole.castShadow=true;group.add(pole);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.075,24,16),headMaterial);head.position.y=h;head.castShadow=true;group.add(head);heads.push(head);
    const ring=new THREE.Mesh(new THREE.RingGeometry(.17,.19,64),new THREE.MeshBasicMaterial({color:'#de7b4a',transparent:true,opacity:.75,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.035;group.add(ring);halos.push(ring);
    city.add(group);pins.push(group);
  });
  const routes                                                                                   =[];
  const routeMaterial=new THREE.MeshStandardMaterial({color:'#de7b4a',metalness:.18,roughness:.52});
  for(let i=0;i<2;i++){
    const a=stops[i].clone(),b=stops[i+1].clone();a.y=b.y=.10;const middle=a.clone().lerp(b,.5);middle.y=i?1.45:1.05;
    const curve=new THREE.QuadraticBezierCurve3(a,middle,b),geometry=new THREE.TubeGeometry(curve,140,.024,8,false);
    const mesh=new THREE.Mesh(geometry,routeMaterial);mesh.castShadow=true;city.add(mesh);
    const bead=new THREE.Mesh(new THREE.SphereGeometry(.045,16,12),new THREE.MeshBasicMaterial({color:'#f6d7cc'}));city.add(bead);
    routes.push({curve,mesh,bead,count:geometry.index .count});
  }

  function render(){
    if(dead||document.hidden)return;
    const p=progress;sampleAtlasCamera(p,position,target);
    const compact=isPortraitScene(width,height),narrowLandscape=width<=700&&!compact;
    const overviewFit=compact?Math.min(2.25,1.08/camera.aspect):narrowLandscape?1.5:1.10;
    const fit=options.reduced?Math.max(1.05,1.08/camera.aspect):THREE.MathUtils.lerp(1,overviewFit,smooth(.18,.28,p));
    position.sub(target).multiplyScalar(fit).add(target);
    const lateral=options.reduced?0:THREE.MathUtils.lerp(0,compact?.015:narrowLandscape?.20:.155,smooth(.18,.28,p));
    const vertical=options.reduced?.03:THREE.MathUtils.lerp(compact?.17:.21,compact?.12:.02,smooth(.18,.28,p))+(compact?Math.min(.20,120/height)*smooth(.82,.925,p):0);
    camera.setViewOffset(width,height,-width*lateral,-height*vertical,width,height);camera.position.copy(position);camera.lookAt(target);camera.updateMatrixWorld();
    const focus=p>.84?selected:p<.53?1:p<.615?0:p<.70?1:2;
    pins.forEach((group,i)=>{const rise=options.reduced?1:smooth(i===1?.43:.51,i===1?.51:.58,p);group.scale.y=Math.max(.001,rise);group.visible=p>.40;heads[i].scale.setScalar(i===focus?1.16:1);halos[i].scale.setScalar(i===focus?1.2:1);});
    routes.forEach(({mesh,bead,curve,count},i)=>{const reveal=options.reduced?1:smooth(i?.65:.555,i?.78:.665,p);mesh.geometry.setDrawRange(0,Math.floor(count*reveal/48)*48);mesh.visible=reveal>.001;bead.visible=reveal>.025&&reveal<.99;bead.position.copy(curve.getPoint(clamp(reveal-.012)));});
    if(visible)renderer.render(scene,camera);
    // Always advance DOM progression: the reveal layer may still be clipped shut.
    options.onFrame(stops.map((point,i)=>{scratch.copy(point);scratch.y+=markerHeights[i]*pins[i].scale.y;scratch.project(camera);return{x:(scratch.x*.5+.5)*width,y:(-.5*scratch.y+.5)*height,visible:scratch.z>-1&&scratch.z<1};}),p);
  }
  const requestRender=()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;render();});};
  const onResize=()=>{
    const r=parent.getBoundingClientRect();width=Math.max(1,r.width);height=Math.max(1,r.height);
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,width<740?1.6:2));renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
    sun.shadow.mapSize.set(width<740?768:1024,width<740?768:1024);requestRender();
  };
  const resize=new ResizeObserver(onResize);resize.observe(parent);onResize();
  const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)requestRender();});intersection.observe(parent.parentElement||parent);
  const onVisibility=()=>{if(!document.hidden)requestRender();};document.addEventListener('visibilitychange',onVisibility);
  const buildings=fetch('assets/data/delhi-buildings.geojson',{signal:abort.signal}).then(r=>r.ok?r.json()                      :null).catch(()=>null);
  fetch('assets/data/delhi-data.geojson',{signal:abort.signal}).then(r=>{if(!r.ok)throw new Error('Map unavailable');return r.json()                      ;}).then(data=>{
    if(dead)return;atlas=buildAtlas(data,renderer,width<740);city.add(atlas.group);requestRender();options.onReady();
    buildings.then(data=>{if(!dead&&data&&atlas){atlas.addBuildings(data).then(()=>{if(!dead)requestRender();}).catch(()=>{if(!dead)requestRender();});}});
  }).catch(error=>{if(!dead&&error?.name!=='AbortError')options.onError?.();});
  return{
    update(p,index){const next=options.reduced?1:clamp(p);if(next===progress&&index===selected)return;progress=next;selected=index;render();},
    dispose(){
      dead=true;abort.abort();atlas?.cancel();cancelAnimationFrame(raf);resize.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',onVisibility);
      const geometries=new Set                      (),materials=new Set                ();
      scene.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));if(o instanceof THREE.InstancedMesh)o.dispose();}});
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());atlas?.texture.dispose();renderer.dispose();
    },
  };
}
