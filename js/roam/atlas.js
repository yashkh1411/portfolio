// Ported from the earlier ChatGPT portfolio (types stripped, logic unchanged).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

                            
                                                          
                                                                                                 
  
                                                     
                              
export const projectMap = (lon        , lat        )        => [(lon - 77.21930925) * 14043.38 + 295.2, (lat - 28.61162065) * -15997.75 + 178.1];
const world = ([x, y]       )        => [(x - 340) * .02, (y - 300) * .02];
const cross = (a       , b       , c       ) => (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function hull(points         ) {
  const sorted = points.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const lower         =[],upper         =[];
  for(const p of sorted){while(lower.length>1&&cross(lower.at(-2) ,lower.at(-1) ,p)<=0)lower.pop();lower.push(p);}
  for(const p of sorted.reverse()){while(upper.length>1&&cross(upper.at(-2) ,upper.at(-1) ,p)<=0)upper.pop();upper.push(p);}
  return lower.slice(0,-1).concat(upper.slice(0,-1));
}
function shape(points         ) { return new THREE.Shape(points.map(([x,z])=>new THREE.Vector2(x,-z))); }
function inside(x       ,y       ,poly        ){let result=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])result=!result;}return result;}
function random(seed=37){let s=seed;return()=>{s=Math.imul(s,1664525)+1013904223|0;return(s>>>0)/4294967296;};}

/** Geographic geometry stays separate from the scroll/camera controller. */
export function buildAtlas(data          , renderer                    , compact        ) {
  const group=new THREE.Group();
  // The original miniature's sunlit, creamy cartography: paper first, blush details second.
  const stone=new THREE.MeshStandardMaterial({color:'#ddc2c5',roughness:.82,metalness:.04});
  const lightStone=new THREE.MeshStandardMaterial({color:'#f1dfbc',roughness:.8,metalness:.03});
  const darkStone=new THREE.MeshStandardMaterial({color:'#c3a8b3',roughness:.87});
  const grove=new THREE.MeshStandardMaterial({color:'#d4bdd5',roughness:.95});
  const paper=new THREE.MeshStandardMaterial({color:'#f2ead7',roughness:.94});
  const paths=data.features.filter(f=>f.geometry.type==='LineString').map(f=>({name:String(f.properties.name||''),kind:f.properties.kind,points:(f.geometry.coordinates              ).map(([lon,lat])=>projectMap(lon,lat))}));
  const all=paths.flatMap(f=>f.points).filter(([x,y])=>x>65&&x<625&&y>-20&&y<615);
  const outline=hull(all).map(world);
  const groundGeo=new THREE.ExtrudeGeometry(shape(outline),{depth:.045,bevelEnabled:true,bevelSize:.013,bevelThickness:.008,bevelSegments:1,steps:1});
  groundGeo.rotateX(-Math.PI/2);
  const ground=new THREE.Mesh(groundGeo,paper);ground.position.y=-.055;ground.receiveShadow=true;group.add(ground);

  const surface=document.createElement('canvas');surface.width=2720;surface.height=2400;
  const ink=surface.getContext('2d') ;ink.scale(4,4);ink.lineCap='round';ink.lineJoin='round';
  const trace=(points        )=>{ink.beginPath();points.forEach(([x,y],i)=>i?ink.lineTo(x,y):ink.moveTo(x,y));};
  const parks=paths.filter(f=>f.kind==='park'&&f.points.length>3);
  const parkPolygons          =[];
  parks.forEach(({points,name})=>{
    const polygon=points.map(world);parkPolygons.push(polygon);
    const geometry=new THREE.ExtrudeGeometry(shape(polygon),{depth:.028,bevelEnabled:false,steps:1});geometry.rotateX(-Math.PI/2);
    const park=new THREE.Mesh(geometry,grove);park.position.y=.002;park.receiveShadow=true;group.add(park);
    trace(points);ink.closePath();ink.fillStyle=name==='Lodhi Gardens'?'#e4ccdb':'#eee2d8';ink.fill();ink.strokeStyle='#d5bcc8';ink.lineWidth=.55;ink.stroke();
  });
  const roads=paths.filter(f=>f.kind==='road');
  roads.forEach(f=>{
    trace(f.points);ink.strokeStyle=f.name?'#ccb69c':'#e2d0ba';ink.lineWidth=f.name?3.5:1.55;ink.stroke();
    ink.strokeStyle=f.name?'#fff8e9':'#fff8eb';ink.lineWidth=f.name?2.15:.8;ink.stroke();
  });
  roads.filter(f=>['Janpath','Akbar Road','Man Singh Road','Lodhi Road'].includes(f.name)).forEach(f=>{trace(f.points);ink.strokeStyle='#c4a994';ink.lineWidth=.4;ink.stroke();});
  const len=(p        )=>p.slice(1).reduce((n,q,i)=>n+Math.hypot(q[0]-p[i][0],q[1]-p[i][1]),0);
  const names=[...new Set(roads.map(f=>f.name))].filter(Boolean);
  names.forEach(name=>{
    const road=roads.filter(f=>f.name===name).sort((a,b)=>len(b.points)-len(a.points))[0];
    if(!road||len(road.points)<55)return;
    const mid=Math.floor((road.points.length-1)/2),a=road.points[Math.max(0,mid-1)],b=road.points[Math.min(road.points.length-1,mid+1)];
    let angle=Math.atan2(b[1]-a[1],b[0]-a[0]);if(Math.abs(angle)>Math.PI/2)angle+=Math.PI;
    const p=road.points[mid];ink.save();ink.translate(p[0],p[1]-3.5);ink.rotate(angle);
    ink.font='500 5.2px system-ui';ink.textAlign='center';ink.lineWidth=2;ink.strokeStyle='#fff2d5';ink.strokeText(name.toUpperCase(),0,0);ink.fillStyle='#876780';ink.fillText(name.toUpperCase(),0,0);ink.restore();
  });
  // A cartographic scale mark, kept away from the landmark and route area.
  ink.strokeStyle='#c5a1a9';ink.lineWidth=.8;ink.beginPath();ink.moveTo(535,540);ink.lineTo(591,540);ink.moveTo(535,536);ink.lineTo(535,544);ink.moveTo(591,536);ink.lineTo(591,544);ink.stroke();
  ink.font='5px monospace';ink.fillStyle='#906e7e';ink.textAlign='left';ink.fillText('0',535,552);ink.textAlign='right';ink.fillText('~400 m',591,552);
  const texture=new THREE.CanvasTexture(surface);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const roadSurface=new THREE.Mesh(new THREE.PlaneGeometry(13.6,12),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));roadSurface.rotation.x=-Math.PI/2;roadSurface.position.y=.034;group.add(roadSurface);

  const seeded=random();const positions                                        =[];
  const occupied=new Map                (),cellSize=.12;
  const key=(x       ,z       )=>`${x},${z}`;
  const nearby=(x       ,z       )=>{
    const cx=Math.floor(x/cellSize),cz=Math.floor(z/cellSize);
    for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(const p of occupied.get(key(cx+a,cz+b))||[])if(Math.hypot(p[0]-x,p[1]-z)<.105)return true;
    return false;
  };
  const limit=compact?300:520;
  for(const polygon of parkPolygons){
    const xs=polygon.map(p=>p[0]),ys=polygon.map(p=>p[1]);const minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...ys),maxZ=Math.max(...ys);
    const attempts=Math.min(240,Math.ceil((maxX-minX)*(maxZ-minZ)*23));
    for(let i=0;i<attempts&&positions.length<limit;i++){
      const x=minX+seeded()*(maxX-minX),z=minZ+seeded()*(maxZ-minZ);
      if(!inside(x,z,polygon)||nearby(x,z))continue;
      // Give the illustrated landmarks and their markers breathing room.
      if(Math.hypot(x-1.964,z+2.858)<.53||Math.hypot(x+.826,z-3.366)<.38)continue;
      positions.push({x,z,r:.055+seeded()*.045,h:.10+seeded()*.11});
      const cell=key(Math.floor(x/cellSize),Math.floor(z/cellSize));occupied.set(cell,[...(occupied.get(cell)||[]),[x,z]]);
    }
  }
  const crownGeo=new THREE.IcosahedronGeometry(1,2);const crownPositions=crownGeo.attributes.position;
  for(let i=0;i<crownPositions.count;i++){const x=crownPositions.getX(i),y=crownPositions.getY(i),z=crownPositions.getZ(i),rough=1+.08*Math.sin(x*17+y*9)+.065*Math.cos(z*13-x*5);crownPositions.setXYZ(i,x*rough,y*rough,z*rough);}crownGeo.computeVertexNormals();
  const crowns=new THREE.InstancedMesh(crownGeo,new THREE.MeshStandardMaterial({color:'#fff9f1',roughness:.96}),positions.length);
  const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.012,.017,1,5),darkStone,positions.length);
  const transform=new THREE.Object3D(),shade=new THREE.Color();
  positions.forEach((p,i)=>{
    transform.position.set(p.x,.05+p.h*.5,p.z);transform.rotation.set(0,seeded()*Math.PI,0);transform.scale.set(1,p.h,1);transform.updateMatrix();trunks.setMatrixAt(i,transform.matrix);
    transform.position.y=.05+p.h;transform.scale.set(p.r,p.r*.82,p.r);transform.updateMatrix();crowns.setMatrixAt(i,transform.matrix);
    shade.set(['#e9c8d7','#d9bad9','#f2d5a5','#c9afd1'][Math.floor(seeded()*4)]);crowns.setColorAt(i,shade);
  });
  crowns.castShadow=true;crowns.receiveShadow=true;trunks.castShadow=true;group.add(crowns,trunks);

  const box=(owner            ,w       ,h       ,d       ,x       ,y       ,z       ,mat               =stone)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y+h/2,z);mesh.castShadow=true;mesh.receiveShadow=true;owner.add(mesh);return mesh;};
  // Architectural illustrations at the three real map anchors, rather than toy blocks.
  const gate=new THREE.Group();gate.position.set(1.964,.04,-2.858);group.add(gate);
  box(gate,.91,.045,.55,0,0,0,darkStone);box(gate,.83,.04,.47,0,.045,0,lightStone);
  const arch=new THREE.Shape();arch.moveTo(-.34,0);arch.lineTo(-.34,.83);arch.lineTo(.34,.83);arch.lineTo(.34,0);arch.lineTo(.145,0);arch.lineTo(.145,.44);arch.bezierCurveTo(.145,.63,-.145,.63,-.145,.44);arch.lineTo(-.145,0);arch.closePath();
  const archGeo=new THREE.ExtrudeGeometry(arch,{depth:.235,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.012,bevelThickness:.008,curveSegments:18});
  const body=new THREE.Mesh(archGeo,stone);body.position.set(0,.085,-.1175);body.castShadow=true;body.receiveShadow=true;gate.add(body);
  box(gate,.76,.055,.32,0,.82,0,lightStone);box(gate,.66,.16,.265,0,.875,0,stone);box(gate,.71,.035,.30,0,1.035,0,lightStone);box(gate,.58,.035,.265,0,1.07,0,stone);
  [-.265,.265].forEach(x=>{box(gate,.13,.045,.28,x,.23,0,lightStone);box(gate,.13,.04,.28,x,.71,0,lightStone);});
  const medallionGeo=new THREE.CylinderGeometry(.047,.047,.009,24);medallionGeo.rotateX(Math.PI/2);
  [-.225,.225].forEach(x=>{const medallion=new THREE.Mesh(medallionGeo,darkStone);medallion.position.set(x,.76,.13);gate.add(medallion);});
  const museum=new THREE.Group();museum.position.set(-.896,.04,-2.438);museum.rotation.y=-.1;group.add(museum);
  box(museum,.96,.04,.73,0,0,0,darkStone);box(museum,.92,.045,.68,0,.04,0,lightStone);
  // Four articulated wings leave a visible, open courtyard.
  box(museum,.86,.20,.15,0,.085,-.245,stone);box(museum,.86,.20,.15,0,.085,.245,stone);box(museum,.15,.20,.36,-.355,.085,0,stone);box(museum,.15,.20,.36,.355,.085,0,stone);
  for(let i=0;i<9;i++){box(museum,.026,.18,.028,-.35+i*.0875,.085,.335,lightStone);box(museum,.026,.18,.028,-.35+i*.0875,.085,-.335,lightStone);}
  box(museum,.94,.04,.19,0,.285,-.245,lightStone);box(museum,.94,.04,.19,0,.285,.245,lightStone);box(museum,.19,.04,.36,-.355,.285,0,lightStone);box(museum,.19,.04,.36,.355,.285,0,lightStone);
  const garden=new THREE.Group();garden.position.set(-.826,.04,3.366);group.add(garden);
  const podium=new THREE.Mesh(new THREE.CylinderGeometry(.29,.31,.045,8),darkStone);podium.position.y=.023;garden.add(podium);
  const pavilion=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.29,8),stone);pavilion.position.y=.19;pavilion.castShadow=true;garden.add(pavilion);
  const drum=new THREE.Mesh(new THREE.CylinderGeometry(.215,.215,.045,32),lightStone);drum.position.y=.36;garden.add(drum);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(.20,32,16,0,Math.PI*2,0,Math.PI/2),lightStone);dome.position.y=.38;dome.castShadow=true;garden.add(dome);
  const finial=new THREE.Mesh(new THREE.CylinderGeometry(.009,.015,.065,8),darkStone);finial.position.y=.61;garden.add(finial);

  const buildingGroup=new THREE.Group();group.add(buildingGroup);
  let cancelled=false;
  const addBuildings=async(buildings          )=>{
    const batches                         =[[],[],[]];
    let visited=0;
    for(const feature of buildings.features){
      if(++visited%(compact?80:140)===0)await new Promise      (resolve=>requestAnimationFrame(()=>resolve()));
      if(cancelled){batches.flat().forEach(g=>g.dispose());return;}
      const rings=feature.geometry.type==='Polygon'?[feature.geometry.coordinates                ]:feature.geometry.type==='MultiPolygon'?feature.geometry.coordinates                  :[];
      for(const polygon of rings){
        const points=polygon[0]?.map(([lon,lat])=>world(projectMap(lon,lat)));if(!points||points.length<4)continue;
        const cx=points.reduce((s,p)=>s+p[0],0)/points.length,cz=points.reduce((s,p)=>s+p[1],0)/points.length;
        if(cx<-4.85||cx>5.1||cz<-6.5||cz>6.3)continue;
        if(Math.hypot(cx-1.964,cz+2.858)<.52||Math.hypot(cx+.896,cz+2.438)<.60||Math.hypot(cx+.826,cz-3.366)<.48)continue;
        const meters=Number.parseFloat(String(feature.properties.height||'')),levels=Number.parseFloat(String(feature.properties['building:levels']||feature.properties.levels||''));
        const altitude=Number.isFinite(meters)?meters:Number.isFinite(levels)?levels*3.2:8;
        const h=Math.min(.39,Math.max(.055,altitude*.0055));const band=h<.09?0:h<.18?1:2;
        const geometry=new THREE.ExtrudeGeometry(shape(points),{depth:h,bevelEnabled:false,steps:1});geometry.rotateX(-Math.PI/2);geometry.translate(0,.004,0);batches[band].push(geometry);
      }
    }
    const materials=[new THREE.MeshStandardMaterial({color:'#f2e3dd',roughness:.91}),new THREE.MeshStandardMaterial({color:'#e8d3d7',roughness:.9}),new THREE.MeshStandardMaterial({color:'#dcc3d0',roughness:.88})];
    batches.forEach((batch,i)=>{if(!batch.length){materials[i].dispose();return;}const merged=mergeGeometries(batch,false);batch.forEach(g=>g.dispose());if(!merged)return;const mesh=new THREE.Mesh(merged,materials[i]);mesh.castShadow=true;mesh.receiveShadow=true;buildingGroup.add(mesh);});
  };
  return {group,addBuildings,texture,cancel:()=>{cancelled=true;}};
}
