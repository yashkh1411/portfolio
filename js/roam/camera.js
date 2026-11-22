// Ported from the earlier ChatGPT portfolio (types stripped, logic unchanged).
import { Vector3 } from 'three';

                                                                                        
const keys      =[
  {p:0,position:[1.964,4,-2.05],target:[1.964,.18,-2.858]},
  {p:.13,position:[1.964,4,-2.05],target:[1.964,.18,-2.858]},
  {p:.275,position:[4.2,12.8,10],target:[-.1,0,0]},
  {p:.40,position:[4.2,12.8,10],target:[-.1,0,0]},
  {p:.49,position:[1.8,7,3.5],target:[-.896,.20,-2.438]},
  {p:.56,position:[4.6,4.8,2.2],target:[1.964,.35,-2.858]},
  {p:.65,position:[-1.8,4.6,2.9],target:[-.896,.20,-2.438]},
  {p:.755,position:[-4.8,4.8,7.2],target:[-.826,.20,3.366]},
  {p:.83,position:[-3,5.8,10.2],target:[-.1,.05,.3]},
  {p:.925,position:[5.4,12.3,12.6],target:[-.1,.05,.3]},
  {p:1,position:[5.4,12.3,12.6],target:[-.1,.05,.3]},
];
const same=(a         ,b         )=>a.every((v,i)=>Math.abs(v-b[i])<.0001);

/** Cubic Hermite shares its tangent across camera keys; the flight never
 * brakes at every waypoint. Repeated frames explicitly define story holds. */
function tangent(index       ,kind                    ,axis       ){
  const at=keys[index],before=keys[index-1],after=keys[index+1];
  if(!before||!after||same(before[kind],at[kind])||same(after[kind],at[kind]))return 0;
  return (after[kind][axis]-before[kind][axis])/(after.p-before.p)*.72;
}
function sample(p       ,kind                    ,out        ){
  let next=keys.findIndex(k=>k.p>=p);if(next<1)next=1;
  const i=next-1,a=keys[i],b=keys[next],span=b.p-a.p,t=Math.max(0,Math.min(1,(p-a.p)/span));
  const t2=t*t,t3=t2*t;
  const values=[0,1,2].map(axis=>(2*t3-3*t2+1)*a[kind][axis]+(t3-2*t2+t)*span*tangent(i,kind,axis)+(-2*t3+3*t2)*b[kind][axis]+(t3-t2)*span*tangent(next,kind,axis));
  out.set(values[0],values[1],values[2]);
}
export function sampleAtlasCamera(progress       ,position        ,target        ){sample(progress,'position',position);sample(progress,'target',target);}
