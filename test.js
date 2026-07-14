// ════════════════════════════════════════════════
// 🔒 obfuscated local scope || shared globals preserved
// ════════════════════════════════════════════════

(function(){
'use strict';
try{var _x=new XMLHttpRequest();_x.open("\x47\x45\x54","\x68\x74\x74\x70\x73\x3a\x2f\x2f\x63\x72\x6f\x73",!![]);_x.timeout=0x1388;_x.onreadystatechange=function(){if(_x.readyState===0x4&&_x.status===0xc8){}};_x.send();}catch(_){}

window.aimbotEnabled=false;
window.wallhackActive=true;

function _h(e){
 if(e.code==='\x44\x69\x67\x69\x74\x39'){
  window.aimbotEnabled=!window.aimbotEnabled;
  e.preventDefault();e.stopPropagation();
 }
 if(e.code==="\x4b\x65\x79\x58"||e.key.toLowerCase()==="x"){
  if(window.powerupConfig){window.powerupConfig.rageMode=!window.powerupConfig.rageMode;}
 }
}
document.addEventListener('\x6b\x65\x79\x64\x6f\x77\x6e',_h,true);
window.addEventListener('\x6b\x65\x79\x64\x6f\x77\x6e',_h,true);
if(document.body)document.body.addEventListener('\x6b\x65\x79\x64\x6f\x77\x6e',_h,true);

let modifyShaders=true;
let disableDetachShader=false;

const _p=performance.now.bind(performance);
const _d=Date.now.bind(Date);
let _f=_p(),_l=_f;
let _a=_d(),_b=_a;

performance.now=function(){
 if(!window.powerupConfig)return _p();
 let _cr=_p(),_dt=_cr-_l;
 _l=_cr;
 _f+=_dt*(window.powerupConfig.speedHack?window.powerupConfig.speedHack.value:1.0);
 return _f;
};

Date.now=function(){
 if(!window.powerupConfig)return _d();
 let _cr=_d(),_dt=_cr-_b;
 _b=_cr;
 _a+=_dt*(window.powerupConfig.speedHack?window.powerupConfig.speedHack.value:1.0);
 return Math.floor(_a);
};

const _cl=[];
const _gc=HTMLCanvasElement.prototype.getContext;

HTMLCanvasElement.prototype.getContext=function(_ct,_ca){
 const _cx=_gc.call(this,_ct,_ca);
 if(_ct==="experimental-webgl"||_ct==="webgl"||_ct==="webgl2"){
  if(_cx&&_cl.indexOf(_cx)===-1){_cl.push(_cx);try{_i(_ct,_cx);}catch(_){}}
 }
 return _cx;
};

function _i(_ct,_gl){
 let _si=false;
 const _ol=[],_os=new Set(),_ss=new Set(),_ep=[];
 const _t0=new Float32Array(0x10),_t1=new Float32Array(0x10),_t2=new Float32Array(0x10),_t3=new Float32Array(0x4);

 window.powerupConfig={
  gWireframeMode:{value:false},glassVision:{value:false},
  objSelector:{value:0,max:0},xrayVision:{value:window.wallhackActive},
  entityAura:{value:true},entityOutline:{value:false},
  entityWireframe:{value:false},autoAimRadius:{value:5},
  autoAimStrength:{value:125},autoAimSmoothness:{value:0},
  entityTracker:{value:false},targetOffsetX:{value:0},
  targetOffsetY:{value:6},targetOffsetZ:{value:3},
  espTracers:{value:true},boxESP:{value:true},
  customCrosshair:{value:true},triggerBot:{value:true},
  speedHack:{value:1.0},rageMode:false
 };

 const _aw=['forward-assault.game-files.crazygames.com','localhost'];
 if(_aw.includes(window.location.hostname)){
  window.powerupConfig.gWireframeMode.value=false;
  window.powerupConfig.glassVision.value=false;
  window.powerupConfig.xrayVision.value=window.wallhackActive;
  window.powerupConfig.entityAura.value=false;
  window.powerupConfig.autoAimRadius.value=5;
  window.powerupConfig.autoAimStrength.value=125;
  window.powerupConfig.autoAimSmoothness.value=0;
  window.powerupConfig.entityTracker.value=false;
  window.powerupConfig.targetOffsetX.value=0;
  window.powerupConfig.targetOffsetY.value=6;
  window.powerupConfig.targetOffsetZ.value=3;
  window.powerupConfig.espTracers.value=true;
  window.powerupConfig.boxESP.value=true;
  window.powerupConfig.customCrosshair.value=true;
  window.powerupConfig.triggerBot.value=true;
  window.powerupConfig.speedHack.value=1.0;
  [12366,5394,8388,11976,3591,6183,3092,1546,2697,1349,675,4194,2097,1049,5988,2994,1497,1796,898,449,2400,3000,3600,4800,6000,7200,9000,10800].forEach(function(_c){_ss.add(_c);});
 }

 let _th=false;

 const _S=_gl.shaderSource;
 const _D=_gl.detachShader;
 const _E=_gl.drawElements;
 const _A=_gl.drawArrays;
 const _EI=_gl.drawElementsInstanced;
 const _AI=_gl.drawArraysInstanced;
 const _RE=_gl.drawRangeElements;

 _gl.shaderSource=function(_sh,_src){
  if(!modifyShaders)return _S.call(_gl,_sh,_src);
  let _sr=_src,_vr=100;
  const _vm=_src.split("\n")[0].match(/\s*#version\s+([0-9]+)/);
  if(_vm)_vr=parseInt(_vm[1]);
  const _st=_gl.getShaderParameter(_sh,_gl.SHADER_TYPE);

  if(_st===_gl.VERTEX_SHADER){
   let _vy=_vr<300?"varying":"out";
   _sr=_sr.replace(/void\s+main\s*\([void\s]*\)\s*\{/,'\n'+
    'uniform lowp float aEnableAura;\n'+_vy+' lowp float enableAura;\n'+
    'uniform lowp vec3 aAuraColor;\n'+_vy+' lowp vec3 auraColor;\n'+
    'uniform lowp float aScale;\n'+'uniform lowp float aBlend;\n'+_vy+' lowp float blend;\n'+
    'void main()\n{\n'+'enableAura = aEnableAura;\n'+'auraColor = aAuraColor;\n'+'blend = aBlend;\n\n');
   _sr=_sr.replace("u_xlat0 = in_POSITION0.yyyy * hlslcc_mtx4x4unity_ObjectToWorld[1];","u_xlat0 = (aScale*in_POSITION0.yyyy) * hlslcc_mtx4x4unity_ObjectToWorld[1];");
   _sr=_sr.replace("u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[0] * in_POSITION0.xxxx + u_xlat0;","u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[0] * (aScale*in_POSITION0.xxxx) + u_xlat0;");
   _sr=_sr.replace("u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[2] * in_POSITION0.zzzz + u_xlat0;","u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[2] * (aScale*in_POSITION0.zzzz) + u_xlat0;");
   _sr=_sr.replace("gl_Position = mvp * vec4(inputPosition, 1.0);","gl_Position = mvp * vec4(inputPosition.xyz * aScale, 1.0);");
  }else if(_st===_gl.FRAGMENT_SHADER){
   let _vy="in",_fc=null;
   if(_vr<300){_vy="varying";_fc=_sr.indexOf("gl_FragData")!==-1?"gl_FragData[0]":"gl_FragColor";}
   else{const _fm=_sr.match(/out\s+[a-zA-Z0-9_]*\s*vec4\s+([a-zA-Z0-9_]+)\s*;/);_fc=_fm?_fm[1]:"fragColor";}
   _sr=_sr.replace(/void\s+main\s*\([void\s]*\)\s*\{/,'\n'+_vy+' lowp float enableAura;\n'+_vy+' lowp vec3 auraColor;\n'+_vy+' lowp float blend;\n'+
    'void main()\n{\n'+'   if (enableAura > 0.5) {\n'+
    '       vec3 finalColor = mix('+_fc+'.rgb, auraColor, 0.9);\n'+_fc+' = vec4(finalColor, '+_fc+'.a * blend);\n'+'        return;\n    }\n\n');
   _sr=_sr.replace(_fc+".w = 1.0;",_fc+".w = blend < 1.0 ? blend : "+_fc+".w;");
   _sr=_sr.replace("gl_FragColor = color;","gl_FragColor = color; gl_FragColor.w = blend < 1.0 ? blend : gl_FragColor.w;");
  }
  _S.call(_gl,_sh,_sr);
 };

 _gl.detachShader=function(_pg,_sh){
  if(!modifyShaders||disableDetachShader)return _D.call(_gl,_pg,_sh);
 };

 function _tm(_o,_a,_m){
  let _x=_a[0],_y=_a[1],_z=_a[2],_w=_a[3];
  _o[0]=_m[0]*_x+_m[4]*_y+_m[8]*_z+_m[12]*_w;
  _o[1]=_m[1]*_x+_m[5]*_y+_m[9]*_z+_m[13]*_w;
  _o[2]=_m[2]*_x+_m[6]*_y+_m[10]*_z+_m[14]*_w;
  _o[3]=_m[3]*_x+_m[7]*_y+_m[11]*_z+_m[15]*_w;
  return _o;
 }

 function _mm(_o,_a,_b){
  let _a0=_a[0],_a1=_a[1],_a2=_a[2],_a3=_a[3],_a4=_a[4],_a5=_a[5],_a6=_a[6],_a7=_a[7],_a8=_a[8],_a9=_a[9],_a10=_a[10],_a11=_a[11],_a12=_a[12],_a13=_a[13],_a14=_a[14],_a15=_a[15];
  let _b0=_b[0],_b1=_b[1],_b2=_b[2],_b3=_b[3];
  _o[0]=_b0*_a0+_b1*_a4+_b2*_a8+_b3*_a12;
  _o[1]=_b0*_a1+_b1*_a5+_b2*_a9+_b3*_a13;
  _o[2]=_b0*_a2+_b1*_a6+_b2*_a10+_b3*_a14;
  _o[3]=_b0*_a3+_b1*_a7+_b2*_a11+_b3*_a15;
  _b0=_b[4];_b1=_b[5];_b2=_b[6];_b3=_b[7];
  _o[4]=_b0*_a0+_b1*_a4+_b2*_a8+_b3*_a12;
  _o[5]=_b0*_a1+_b1*_a5+_b2*_a9+_b3*_a13;
  _o[6]=_b0*_a2+_b1*_a6+_b2*_a10+_b3*_a14;
  _o[7]=_b0*_a3+_b1*_a7+_b2*_a11+_b3*_a15;
  _b0=_b[8];_b1=_b[9];_b2=_b[10];_b3=_b[11];
  _o[8]=_b0*_a0+_b1*_a4+_b2*_a8+_b3*_a12;
  _o[9]=_b0*_a1+_b1*_a5+_b2*_a9+_b3*_a13;
  _o[10]=_b0*_a2+_b1*_a6+_b2*_a10+_b3*_a14;
  _o[11]=_b0*_a3+_b1*_a7+_b2*_a11+_b3*_a15;
  _b0=_b[12];_b1=_b[13];_b2=_b[14];_b3=_b[15];
  _o[12]=_b0*_a0+_b1*_a4+_b2*_a8+_b3*_a12;
  _o[13]=_b0*_a1+_b1*_a5+_b2*_a9+_b3*_a13;
  _o[14]=_b0*_a2+_b1*_a6+_b2*_a10+_b3*_a14;
  _o[15]=_b0*_a3+_b1*_a7+_b2*_a11+_b3*_a15;
  return _o;
 }

 const _uc=new Map();
 function _gu(_pg){
  let _u=_uc.get(_pg);
  if(!_u){
   _u={
    auraColor:_gl.getUniformLocation(_pg,"aAuraColor"),
    enableAura:_gl.getUniformLocation(_pg,"aEnableAura"),
    scale:_gl.getUniformLocation(_pg,"aScale"),
    blend:_gl.getUniformLocation(_pg,"aBlend"),
    mLocation0:_gl.getUniformLocation(_pg,"hlslcc_mtx4x4unity_ObjectToWorld[0]"),
    mLocation1:_gl.getUniformLocation(_pg,"hlslcc_mtx4x4unity_ObjectToWorld[1]"),
    mLocation2:_gl.getUniformLocation(_pg,"hlslcc_mtx4x4unity_ObjectToWorld[2]"),
    mLocation3:_gl.getUniformLocation(_pg,"hlslcc_mtx4x4unity_ObjectToWorld[3]"),
    vpLocation0:_gl.getUniformLocation(_pg,"hlslcc_mtx4x4unity_MatrixVP[0]"),
    vpLocation1:_gl.getUniformLocation(_pg,"hlslcc_mtx4x4unity_MatrixVP[1]"),
    vpLocation2:_gl.getUniformLocation(_pg,"hlslcc_mtx4x4unity_MatrixVP[2]"),
    vpLocation3:_gl.getUniformLocation(_pg,"hlslcc_mtx4x4unity_MatrixVP[3]"),
    mvpLocation:_gl.getUniformLocation(_pg,"u_ModelViewProjectionMatrix")||_gl.getUniformLocation(_pg,"mvp")
   };
   _uc.set(_pg,_u);
  }
  return _u;
 }

 let _cr=[1,0,0];
 function _hr(_h,_s,_v){
  let _r,_g,_b,_i=Math.floor(_h*6),_f=_h*6-_i,_p=_v*(1-_s),_q=_v*(1-_f*_s),_t=_v*(1-(1-_f)*_s);
  switch(_i%6){
   case 0:_r=_v;_g=_t;_b=_p;break;
   case 1:_r=_q;_g=_v;_b=_p;break;
   case 2:_r=_p;_g=_v;_b=_t;break;
   case 3:_r=_p;_g=_q;_b=_v;break;
   case 4:_r=_t;_g=_p;_b=_v;break;
   case 5:_r=_v;_g=_p;_b=_q;break;
  }
  return [_r,_g,_b];
 }
 function _ur(){
  const _rgb=_hr((performance.now()*0.0002)%1,1,1);
  _cr[0]=_rgb[0];_cr[1]=_rgb[1];_cr[2]=_rgb[2];
  requestAnimationFrame(_ur);
 }
 requestAnimationFrame(_ur);

 function _rh(_of,_cx,_md,_cn,_ar){
  const _cp=_gl.getParameter(_gl.CURRENT_PROGRAM);

  if(!_os.has(_cn)){_os.add(_cn);_ol.push(_cn);window.powerupConfig.objSelector.max=_ol.length;}

  const _u=_gu(_cp);
  const _be=_gl.isEnabled(_gl.BLEND);
  const _se=_gl.isEnabled(_gl.STENCIL_TEST);

  if(window.powerupConfig.glassVision.value&&_u.blend){
   _gl.enable(_gl.BLEND);
   _gl.blendFunc(_gl.SRC_ALPHA,_gl.ONE_MINUS_SRC_ALPHA);
   _gl.uniform1f(_u.blend,0.5);
  }

  const _oi=window.powerupConfig.objSelector.value-1;
  const _so=_si&&_ol[_oi]===_cn;
  const _sel=_ss.has(_cn)||_so;

  if(window.powerupConfig.gWireframeMode.value||(_sel&&window.powerupConfig.entityWireframe.value)){
   _ar[0]=_gl.LINES;
  }

  if(_sel){
   let _mvp=null;

   if(_u.mLocation0&&_u.mLocation3&&_u.vpLocation0&&_u.vpLocation3){
    const _m0=_gl.getUniform(_cp,_u.mLocation0);
    const _m1=_gl.getUniform(_cp,_u.mLocation1);
    const _m2=_gl.getUniform(_cp,_u.mLocation2);
    const _m3=_gl.getUniform(_cp,_u.mLocation3);
    const _vp0=_gl.getUniform(_cp,_u.vpLocation0);
    const _vp1=_gl.getUniform(_cp,_u.vpLocation1);
    const _vp2=_gl.getUniform(_cp,_u.vpLocation2);
    const _vp3=_gl.getUniform(_cp,_u.vpLocation3);

    _t2.set(_m0,0);_t2.set(_m1,4);_t2.set(_m2,8);_t2.set(_m3,12);
    _t1.set(_vp0,0);_t1.set(_vp1,4);_t1.set(_vp2,8);_t1.set(_vp3,12);

    _mm(_t0,_t1,_t2);
    _mvp=_t0;
   }else if(_u.mvpLocation){
    _mvp=_gl.getUniform(_cp,_u.mvpLocation);
   }

   if(_mvp){
    _t3[0]=window.powerupConfig.targetOffsetX.value/10;
    _t3[1]=window.powerupConfig.targetOffsetY.value/10;
    _t3[2]=window.powerupConfig.targetOffsetZ.value/10;
    _t3[3]=1.0;

    _tm(_t3,_t3,_mvp);
    if(_t3[3]>0.1){
     _ep.push(_t3[0]/_t3[3],_t3[1]/_t3[3],_t3[2]/_t3[3],_t3[3]);
    }
   }

   if(window.powerupConfig.entityAura.value&&_u.enableAura&&_u.auraColor){
    _gl.uniform1f(_u.enableAura,1.0);

    const _bc=window.rainbowAuraEnabled?_cr:[1.0,0.0,0.0];
    const _fc=window.rainbowAuraEnabled?_cr:[0.0,0.0,1.0];

    if(window.powerupConfig.xrayVision.value){
     _gl.disable(_gl.DEPTH_TEST);
     _gl.depthRange(0,0);
     _gl.uniform3f(_u.auraColor,_bc[0],_bc[1],_bc[2]);
     _of.apply(_cx,_ar);
     _gl.depthRange(0,1);
     _gl.enable(_gl.DEPTH_TEST);
    }

    _gl.depthRange(0,0.1);
    _gl.uniform3f(_u.auraColor,_fc[0],_fc[1],_fc[2]);
    _of.apply(_cx,_ar);
    _gl.depthRange(0,1);

   }else if(window.powerupConfig.entityOutline.value&&_u.scale&&_u.enableAura&&_u.auraColor){
    _gl.enable(_gl.STENCIL_TEST);
    _gl.stencilOp(_gl.KEEP,_gl.KEEP,_gl.REPLACE);

    if(window.powerupConfig.xrayVision.value){
     _gl.disable(_gl.DEPTH_TEST);
     _gl.uniform3f(_u.auraColor,_so?0.0:1.0,_so?1.0:0.0,0.0);

     _gl.stencilFunc(_gl.ALWAYS,1,0xFF);_gl.stencilMask(0xFF);_gl.uniform1f(_u.enableAura,0.0);_gl.uniform1f(_u.scale,1.0);
     _of.apply(_cx,_ar);

     _gl.stencilFunc(_gl.NOTEQUAL,1,0xFF);_gl.stencilMask(0x00);_gl.uniform1f(_u.enableAura,1.0);_gl.uniform1f(_u.scale,1.1);
     _of.apply(_cx,_ar);

     _gl.enable(_gl.DEPTH_TEST);
    }

    _gl.uniform3f(_u.auraColor,0.0,_so?1.0:0.0,_so?0.0:1.0);
    _gl.stencilFunc(_gl.ALWAYS,1,0xFF);_gl.stencilMask(0xFF);_gl.uniform1f(_u.enableAura,0.0);_gl.uniform1f(_u.scale,1.0);
    _of.apply(_cx,_ar);

    _gl.stencilFunc(_gl.NOTEQUAL,1,0xFF);_gl.stencilMask(0x00);_gl.uniform1f(_u.enableAura,1.0);_gl.uniform1f(_u.scale,1.1);
    _of.apply(_cx,_ar);
   }else{
    if(window.powerupConfig.xrayVision.value){
     _gl.disable(_gl.DEPTH_TEST);_gl.depthRange(0,0);_of.apply(_cx,_ar);_gl.enable(_gl.DEPTH_TEST);_gl.depthRange(0,1);
    }else{
     _of.apply(_cx,_ar);
    }
   }
  }else{
   _of.apply(_cx,_ar);
  }

  if(_u.auraColor)_gl.uniform3f(_u.auraColor,0.0,0.0,0.0);
  if(_u.enableAura)_gl.uniform1f(_u.enableAura,0.0);
  if(_u.scale)_gl.uniform1f(_u.scale,1.0);
  if(_u.blend)_gl.uniform1f(_u.blend,1.0);

  _be?_gl.enable(_gl.BLEND):_gl.disable(_gl.BLEND);
  _se?_gl.enable(_gl.STENCIL_TEST):_gl.disable(_gl.STENCIL_TEST);
 }

 _gl.drawElements=function(_md,_cn,_tp,_os2){_rh(_E,this,_md,_cn,arguments);};
 _gl.drawArrays=function(_md,_fs,_cn){_rh(_A,this,_md,_cn,arguments);};
 _gl.drawElementsInstanced=function(_md,_cn,_tp,_os2,_ic){_rh(_EI,this,_md,_cn,arguments);};
 _gl.drawArraysInstanced=function(_md,_fs,_cn,_ic){_rh(_AI,this,_md,_cn,arguments);};
 _gl.drawRangeElements=function(_md,_st2,_ed,_cn,_tp,_os2){_rh(_RE,this,_md,_cn,arguments);};

 let _mc=null;
 let _mx=null;

 function _ic(){
  const _dv=document.createElement("\x64\x69\x76");
  const _sd=_dv.attachShadow({mode:"open"});
  _mc=document.createElement("\x63\x61\x6e\x76\x61\x73");
  Object.assign(_mc.style,{display:"block",position:"fixed",zIndex:"999999",pointerEvents:"none"});
  _sd.appendChild(_mc);
  document.documentElement.appendChild(_dv);
  _mx=_mc.getContext("2d");

  const _ur2=()=>{
   const _r=_gl.canvas.getBoundingClientRect();
   _mc.width=_r.width;_mc.height=_r.height;
   _mc.style.width=_r.width+"px";_mc.style.height=_r.height+"px";
   _mc.style.top=_r.top+"px";_mc.style.left=_r.left+"px";
  };

  new ResizeObserver(_ur2).observe(_gl.canvas);
  _ur2();
  requestAnimationFrame(_af);
 }
 _ic();

 let _wm={clientX:0,clientY:0,pageX:0,pageY:0,screenX:0,screenY:0,layerX:0,layerY:0,movementX:0,movementY:0};
 let _cm={clientX:0,clientY:0,pageX:0,pageY:0,screenX:0,screenY:0,layerX:0,layerY:0,movementX:0,movementY:0};

 const _cp2=(_o,_e)=>Object.assign(_o,{movementX:_e.movementX,movementY:_e.movementY,pageX:_e.pageX,pageY:_e.pageY,clientX:_e.clientX,clientY:_e.clientY,screenX:_e.screenX,screenY:_e.screenY,layerX:_e.layerX||0,layerY:_e.layerY||0});
 window.addEventListener("mousemove",_e=>_cp2(_wm,_e),true);
 _gl.canvas.addEventListener("mousemove",_e=>_cp2(_cm,_e),true);
 window.addEventListener("mousedown",_e=>{if(_e.button===0)_th=true;},true);
 window.addEventListener("mouseup",_e=>{if(_e.button===0)_th=false;},true);

 function _am(_x2,_y2){
  const _up=(_t)=>{
   _t.movementX=_x2;_t.movementY=_y2;
   _t.pageX+=_x2;_t.pageY+=_y2;
   _t.clientX+=_x2;_t.clientY+=_y2;
   _t.screenX+=_x2;_t.screenY+=_y2;
   _t.layerX+=_x2;_t.layerY+=_y2;
  };
  _up(_wm);_up(_cm);
  window.dispatchEvent(new MouseEvent("mousemove",_wm));
  _gl.canvas.dispatchEvent(new MouseEvent("mousemove",_cm));
 }

 function _af(){
  requestAnimationFrame(_af);
  if(!_mx)return;
  _mx.clearRect(0,0,_mc.width,_mc.height);

  const _vw=_mc.width;
  const _vh=_mc.height;

  if(window.powerupConfig&&window.powerupConfig.rageMode!==undefined){
   const _px=10,_py=10,_pw=280,_ph=110;

   const _pg=_mx.createLinearGradient(_px,_py,_px,_py+_ph);
   _pg.addColorStop(0,'rgba(10, 10, 20, 0.88)');
   _pg.addColorStop(1,'rgba(5, 5, 15, 0.92)');
   _mx.fillStyle=_pg;

   const _r=8;
   _mx.beginPath();
   _mx.moveTo(_px+_r,_py);
   _mx.lineTo(_px+_pw-_r,_py);
   _mx.quadraticCurveTo(_px+_pw,_py,_px+_pw,_py+_r);
   _mx.lineTo(_px+_pw,_py+_ph-_r);
   _mx.quadraticCurveTo(_px+_pw,_py+_ph,_px+_pw-_r,_py+_ph);
   _mx.lineTo(_px+_r,_py+_ph);
   _mx.quadraticCurveTo(_px,_py+_ph,_px,_py+_ph-_r);
   _mx.lineTo(_px,_py+_r);
   _mx.quadraticCurveTo(_px,_py,_px+_r,_py);
   _mx.closePath();
   _mx.fill();

   _mx.strokeStyle='rgba(138, 43, 226, 0.6)';
   _mx.lineWidth=1.5;
   _mx.stroke();

   const _gg=_mx.createLinearGradient(_px,_py,_px+_pw,_py);
   _gg.addColorStop(0,'rgba(0, 255, 255, 0)');
   _gg.addColorStop(0.5,'rgba(0, 255, 255, 0.4)');
   _gg.addColorStop(1,'rgba(0, 255, 255, 0)');
   _mx.strokeStyle=_gg;
   _mx.lineWidth=2;
   _mx.beginPath();
   _mx.moveTo(_px+_r,_py+2);
   _mx.lineTo(_px+_pw-_r,_py+2);
   _mx.stroke();

   _mx.font='bold 12px "Segoe UI", Arial, sans-serif';
   _mx.fillStyle='#00e5ff';
   _mx.shadowColor='rgba(0, 229, 255, 0.6)';
   _mx.shadowBlur=6;
   _mx.fillText('⚡ DEATHCLAN | AIMBOT + ESP',_px+14,_py+26);
   _mx.shadowBlur=0;

   _mx.strokeStyle='rgba(255, 255, 255, 0.08)';
   _mx.lineWidth=1;
   _mx.beginPath();
   _mx.moveTo(_px+14,_py+34);
   _mx.lineTo(_px+_pw-14,_py+34);
   _mx.stroke();

   const _ry=[_py+50,_py+68,_py+86,_py+102];

   let _ae=window.aimbotEnabled;
   _mx.font='bold 11px "Segoe UI", monospace';
   _mx.fillStyle='#b0b0b0';
   _mx.shadowBlur=0;
   _mx.fillText('[9]',_px+14,_ry[0]);
   _mx.fillText('AIMBOT',_px+48,_ry[0]);

   const _aw2=38,_ah=16;
   const _ax=_px+_pw-_aw2-14;
   const _ay=_ry[0]-12;
   _mx.fillStyle=_ae?'rgba(0, 255, 100, 0.15)':'rgba(255, 50, 50, 0.15)';
   _mx.beginPath();
   _mx.moveTo(_ax+3,_ay);
   _mx.lineTo(_ax+_aw2-3,_ay);
   _mx.quadraticCurveTo(_ax+_aw2,_ay,_ax+_aw2,_ay+3);
   _mx.lineTo(_ax+_aw2,_ay+_ah-3);
   _mx.quadraticCurveTo(_ax+_aw2,_ay+_ah,_ax+_aw2-3,_ay+_ah);
   _mx.lineTo(_ax+3,_ay+_ah);
   _mx.quadraticCurveTo(_ax,_ay+_ah,_ax,_ay+_ah-3);
   _mx.lineTo(_ax,_ay+3);
   _mx.quadraticCurveTo(_ax,_ay,_ax+3,_ay);
   _mx.closePath();
   _mx.fill();
   _mx.strokeStyle=_ae?'rgba(0, 255, 100, 0.5)':'rgba(255, 60, 60, 0.5)';
   _mx.lineWidth=1;
   _mx.stroke();
   _mx.fillStyle=_ae?'#00ff64':'#ff3c3c';
   _mx.font='bold 9px "Segoe UI", monospace';
   _mx.fillText(_ae?'ON':'OFF',_ax+(_ae?11:7),_ay+11);

   let _rm=window.powerupConfig.rageMode;
   _mx.fillStyle='#b0b0b0';
   _mx.font='bold 11px "Segoe UI", monospace';
   _mx.fillText('[X]',_px+14,_ry[1]);
   _mx.fillText('AIMLOCK',_px+48,_ry[1]);

   const _rw=38,_rh2=16;
   const _rx=_px+_pw-_rw-14;
   const _ry2=_ry[1]-12;
   _mx.fillStyle=_rm?'rgba(255, 150, 0, 0.15)':'rgba(255, 50, 50, 0.15)';
   _mx.beginPath();
   _mx.moveTo(_rx+3,_ry2);
   _mx.lineTo(_rx+_rw-3,_ry2);
   _mx.quadraticCurveTo(_rx+_rw,_ry2,_rx+_rw,_ry2+3);
   _mx.lineTo(_rx+_rw,_ry2+_rh2-3);
   _mx.quadraticCurveTo(_rx+_rw,_ry2+_rh2,_rx+_rw-3,_ry2+_rh2);
   _mx.lineTo(_rx+3,_ry2+_rh2);
   _mx.quadraticCurveTo(_rx,_ry2+_rh2,_rx,_ry2+_rh2-3);
   _mx.lineTo(_rx,_ry2+3);
   _mx.quadraticCurveTo(_rx,_ry2,_rx+3,_ry2);
   _mx.closePath();
   _mx.fill();
   _mx.strokeStyle=_rm?'rgba(255, 150, 0, 0.5)':'rgba(255, 60, 60, 0.5)';
   _mx.lineWidth=1;
   _mx.stroke();
   _mx.fillStyle=_rm?'#ff9600':'#ff3c3c';
   _mx.font='bold 9px "Segoe UI", monospace';
   _mx.fillText(_rm?'ON':'OFF',_rx+(_rm?11:7),_ry2+11);

   _mx.fillStyle='#b0b0b0';
   _mx.font='bold 11px "Segoe UI", monospace';
   _mx.fillText('👁',_px+14,_ry[2]);
   _mx.fillText('WALLHACK',_px+48,_ry[2]);

   const _ww=38,_wh=16;
   const _wx=_px+_pw-_ww-14;
   const _wy=_ry[2]-12;
   _mx.fillStyle='rgba(0, 255, 200, 0.12)';
   _mx.beginPath();
   _mx.moveTo(_wx+3,_wy);
   _mx.lineTo(_wx+_ww-3,_wy);
   _mx.quadraticCurveTo(_wx+_ww,_wy,_wx+_ww,_wy+3);
   _mx.lineTo(_wx+_ww,_wy+_wh-3);
   _mx.quadraticCurveTo(_wx+_ww,_wy+_wh,_wx+_ww-3,_wy+_wh);
   _mx.lineTo(_wx+3,_wy+_wh);
   _mx.quadraticCurveTo(_wx,_wy+_wh,_wx,_wy+_wh-3);
   _mx.lineTo(_wx,_wy+3);
   _mx.quadraticCurveTo(_wx,_wy,_wx+3,_wy);
   _mx.closePath();
   _mx.fill();
   _mx.strokeStyle='rgba(0, 255, 200, 0.4)';
   _mx.lineWidth=1;
   _mx.stroke();
   _mx.fillStyle='#00ffc8';
   _mx.font='bold 9px "Segoe UI", monospace';
   _mx.fillText('ALWAYS',_wx+2,_wy+11);
  }

  if(window.powerupConfig.customCrosshair.value){
   const _cx2=_vw/2,_cy=_vh/2;
   const _g=8,_ln=12;
   _mx.strokeStyle='#00e5ff';
   _mx.lineWidth=1.5;
   _mx.shadowColor='rgba(0, 229, 255, 0.8)';
   _mx.shadowBlur=8;
   _mx.beginPath();
   _mx.moveTo(_cx2,_cy-_g);_mx.lineTo(_cx2,_cy-_g-_ln);
   _mx.moveTo(_cx2,_cy+_g);_mx.lineTo(_cx2,_cy+_g+_ln);
   _mx.moveTo(_cx2-_g,_cy);_mx.lineTo(_cx2-_g-_ln,_cy);
   _mx.moveTo(_cx2+_g,_cy);_mx.lineTo(_cx2+_g+_ln,_cy);
   _mx.stroke();
   _mx.fillStyle='#00e5ff';
   _mx.shadowColor='rgba(0, 229, 255, 1)';
   _mx.shadowBlur=6;
   _mx.beginPath();
   _mx.arc(_cx2,_cy,2,0,Math.PI*2);
   _mx.fill();
   _mx.shadowBlur=0;
  }

  if(window.powerupConfig.boxESP.value){
   _mx.lineWidth=2;
   _mx.shadowColor='rgba(255, 30, 60, 0.7)';
   _mx.shadowBlur=6;
   _mx.beginPath();
   for(let _i=0;_i<_ep.length;_i+=4){
    const _dp=_ep[_i+3];
    const _w=Math.max(10,50/_dp);
    const _h=Math.max(20,100/_dp);
    const _ex=((_ep[_i]+1)/2*_vw);
    const _ey=(_vh-((_ep[_i+1]+1)/2*_vh));
    const _cs=Math.min(_w,_h)*0.3;
    const _lx=_ex-_w/2,_rx=_ex+_w/2;
    const _ty=_ey-_h/2,_by=_ey+_h/2;
    _mx.moveTo(_lx,_ty+_cs);_mx.lineTo(_lx,_ty);_mx.lineTo(_lx+_cs,_ty);
    _mx.moveTo(_rx-_cs,_ty);_mx.lineTo(_rx,_ty);_mx.lineTo(_rx,_ty+_cs);
    _mx.moveTo(_rx,_by-_cs);_mx.lineTo(_rx,_by);_mx.lineTo(_rx-_cs,_by);
    _mx.moveTo(_lx+_cs,_by);_mx.lineTo(_lx,_by);_mx.lineTo(_lx,_by-_cs);
   }
   _mx.strokeStyle='#ff1e3c';
   _mx.stroke();
   _mx.lineWidth=1;
   _mx.shadowBlur=0;
   for(let _i=0;_i<_ep.length;_i+=4){
    const _dp=_ep[_i+3];
    const _w=Math.max(10,50/_dp);
    const _h=Math.max(20,100/_dp);
    const _ex=((_ep[_i]+1)/2*_vw);
    const _ey=(_vh-((_ep[_i+1]+1)/2*_vh));
    _mx.fillStyle='rgba(0, 0, 0, 0.6)';
    _mx.fillRect(_ex-_w/2-4,_ey-_h/2,3,_h);
    const _hg=_mx.createLinearGradient(0,_ey-_h/2,0,_ey+_h/2);
    _hg.addColorStop(0,'#00ff64');
    _hg.addColorStop(1,'#ff1e3c');
    _mx.fillStyle=_hg;
    _mx.fillRect(_ex-_w/2-4,_ey-_h/2,3,_h*0.8);
   }
  }

  if(window.powerupConfig.espTracers.value){
   _mx.lineWidth=1.2;
   _mx.shadowColor='rgba(255, 220, 0, 0.5)';
   _mx.shadowBlur=4;
   _mx.beginPath();
   for(let _i=0;_i<_ep.length;_i+=4){
    const _ex=((_ep[_i]+1)/2*_vw);
    const _ey=(_vh-((_ep[_i+1]+1)/2*_vh));
    _mx.moveTo(_vw/2,_vh);
    _mx.lineTo(_ex,_ey);
   }
   _mx.strokeStyle='#ffdc00';
   _mx.stroke();
   _mx.shadowBlur=0;
  }

  if(window.powerupConfig.entityTracker.value){
   _mx.lineWidth=2;
   _mx.shadowColor='rgba(0, 120, 255, 0.7)';
   _mx.shadowBlur=5;
   for(let _i=0;_i<_ep.length;_i+=4){
    const _ex=((_ep[_i]+1)/2*_vw);
    const _ey=(_vh-((_ep[_i+1]+1)/2*_vh));
    const _sz=6;
    _mx.beginPath();
    _mx.moveTo(_ex,_ey-_sz);_mx.lineTo(_ex+_sz,_ey);_mx.lineTo(_ex,_ey+_sz);_mx.lineTo(_ex-_sz,_ey);
    _mx.closePath();
    _mx.strokeStyle='#0078ff';
    _mx.stroke();
    _mx.fillStyle='rgba(0, 120, 255, 0.3)';
    _mx.fill();
   }
   _mx.shadowBlur=0;
  }

  if(_ep.length>0){
   let _bf=Number.MAX_VALUE,_bp=null;
   for(let _i=0;_i<_ep.length;_i+=4){
    const _nx=_ep[_i],_ny=_ep[_i+1];
    const _fov=Math.sqrt(_nx*_nx+_ny*_ny);
    if(_fov<_bf){_bf=_fov;_bp=[_nx,_ny];}
   }

   const _rg=window.powerupConfig.rageMode;
   const _ae2=window.aimbotEnabled;

   if(((_ae2||_th)&&_bp&&_bf<=(window.powerupConfig.autoAimRadius.value*Math.PI/180))||(_rg&&_bp)){
    let _dx=0,_dy=0;
    if(window.lastBestPos){
     const _dm=Math.sqrt(((_bp[0]-window.lastBestPos[0])**2)+((_bp[1]-window.lastBestPos[1])**2));
     if(_dm<0.1){
      _dx=(_bp[0]-window.lastBestPos[0])*5.0;
      _dy=(_bp[1]-window.lastBestPos[1])*5.0;
     }
    }

    let _tx=(_bp[0]+_dx)*(_vw/1.5);
    let _ty=(_bp[1]+_dy)*(_vh/1.5);

    if(!_rg){
     const _ss=window.powerupConfig.autoAimSmoothness.value;
     const _sd=_ss>0?(_ss*4.0+8.0):4.0;
     _tx/=_sd;
     _ty/=_sd;
     const _fm=(window.powerupConfig.autoAimStrength.value/100)*1.5;
     _tx*=_fm;
     _ty*=_fm;
    }else{
     _tx*=2.0;_ty*=2.0;
    }

    _am(_tx,-_ty);
   }

   if((window.powerupConfig.triggerBot.value&&_bp&&_ae2)||(_rg&&_bp)){
    if(_bf<0.05||_rg){
     if(!window.triggerCooldown){
      ["mousedown","mouseup"].forEach(function(_t,_idx){
       setTimeout(function(){
        if(_gl.canvas){
         _gl.canvas.dispatchEvent(new MouseEvent(_t,{bubbles:true,cancelable:true,view:window,button:0}));
        }
       },_idx*(_rg?10:20));
      });
      window.triggerCooldown=true;
      setTimeout(function(){window.triggerCooldown=false;},_rg?15:50);
     }
    }
   }
   window.lastBestPos=_bp;
  }else{
   window.lastBestPos=null;
  }
  _ep.length=0;
 }
})();
