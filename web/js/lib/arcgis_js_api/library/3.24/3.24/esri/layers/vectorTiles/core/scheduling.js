// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.24/esri/copyright.txt for details.
//>>built
define("esri/layers/vectorTiles/core/scheduling",["require","exports","./nextTick","./now","./requestAnimationFrame"],function(B,b,w,x,y){function q(a){void 0===a&&(a=b.now());b.debug.rafId=null;0<e.length&&(b.debug.rafId=n());a=b.now();0>k&&(k=a);var f=a-k;k=a;for(var d=0;d<e.length;d++){var c=e[d];-1!==c.epoch&&(c.dt=f)}for(d=0;d<l.length;d++)for(var f=l[d],g=p[f],h=0;h<g.length;h++)c=g[h],c.paused||c.removed||(0===d&&c.ticks++,-1===c.epoch&&(c.epoch=a),m.time=a,m.deltaTime=c.dt,m.elapsedFrameTime=
b.now()-a,m.spendInTask=a-c.epoch,c.phases[f].call(c,m));r()}function n(){return b.debug.requestNextFrame?b.debug.requestNextFrame(t):t()}function r(){for(var a=0;a<e.length;){var b=e[a];a++;if(b.removed){e.splice(a-1,1);for(var d=0;d<l.length;d++){var c=l[d];if(b.phases[c]){var c=p[c],g=c.indexOf(b);-1!==g&&c.splice(g,1)}}}}}function u(){for(;h.length;){var a=h.shift();a.isActive&&(a.isActive=!1,a.callback())}b.debug.willDispatch=!1}function t(){return y(q)}Object.defineProperty(b,"__esModule",{value:!0});
b.now=x;var z=function(){return function(a){this.phases=a;this.paused=!1;this.pausedAt=0;this.epoch=-1;this.dt=0;this.ticks=-1;this.removed=!1}}(),A=function(){function a(a){this.callback=a;this.isActive=!0}a.prototype.remove=function(){this.isActive=!1};return a}(),k=-1,m={time:0,deltaTime:0,elapsedFrameTime:0,spendInTask:0},l=["prepare","preRender","render","postRender","update"],h=[],e=[],p={prepare:[],preRender:[],render:[],postRender:[],update:[]},v=function(){function a(a){this._task=a}a.prototype.remove=
function(){this._task.removed=!0};a.prototype.pause=function(){this._task.paused||(this._task.paused=!0,this._task.pausedAt=b.now())};a.prototype.resume=function(){this._task.paused&&(this._task.paused=!1,-1!==this._task.epoch&&(this._task.epoch+=b.now()-this._task.pausedAt))};return a}();b.FrameTaskHandle=v;b.debug={frameTasks:e,rafId:null,requestNextFrame:null,willDispatch:!1,clearFrameTasks:function(a){void 0===a&&(a=!1);for(var b=0;b<e.length;b++)e[b].removed=!0;a&&r()},dispatch:u,frame:q};b.schedule=
function(a){a=new A(a);h.push(a);b.debug.willDispatch||(b.debug.willDispatch=!0,w(u));return a};b.addFrameTask=function(a){var f=new z(a);e.push(f);for(var d=0,c=l;d<c.length;d++){var g=c[d];a[g]&&p[g].push(f)}b.debug.rafId||(k=-1,b.debug.rafId=n());return new v(f)};b.requestNextFrame=n});