// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.24/esri/copyright.txt for details.
//>>built
define("esri/layers/vectorTiles/renderers/UniqueValueRenderer","require exports ../core/tsSupport/declareExtendsHelper ../core/tsSupport/decorateHelper ../core/tsSupport/paramHelper ../core/arrayUtils ../core/Error ../core/lang ../core/Logger ../core/urlUtils ../core/accessorSupport/decorators ../core/accessorSupport/ensureType ../portal/Portal ./Renderer ./support/diffUtils ./support/LegendOptions ./support/UniqueValueInfo ../support/arcadeUtils ../symbols/PolygonSymbol3D ../symbols/Symbol ../symbols/WebStyleSymbol ../symbols/support/jsonUtils ../symbols/support/styleUtils ../symbols/support/typeUtils".split(" "),
function(I,J,w,c,x,t,y,h,z,p,d,u,r,A,B,C,q,m,D,E,F,f,G,k){var l=z.getLogger("esri.renderers.UniqueValueRenderer"),H=u.ensureType(q.default);return function(v){function a(b){b=v.call(this)||this;b._valueInfoMap={};b._isDefaultSymbolDerived=!1;b.type="unique-value";b.backgroundFillSymbol=null;b.field=null;b.field2=null;b.field3=null;b.valueExpression=null;b.valueExpressionTitle=null;b.legendOptions=null;b.defaultLabel=null;b.fieldDelimiter=null;b.portal=null;b.styleOrigin=null;b.diff={uniqueValueInfos:function(b,
g){if(b||g){if(!b||!g)return{type:"complete",oldValue:b,newValue:g};for(var e=!1,a={type:"collection",added:[],removed:[],changed:[],unchanged:[]},d=function(c){var d=t.find(b,function(b){return b.value===g[c].value});d?B.diff(d,g[c])?a.changed.push({type:"complete",oldValue:d,newValue:g[c]}):a.unchanged.push({oldValue:d,newValue:g[c]}):a.added.push(g[c]);e=!0},c=0;c<g.length;c++)d(c);d=function(c){t.find(g,function(e){return e.value===b[c].value})||(a.removed.push(b[c]),e=!0)};for(c=0;c<b.length;c++)d(c);
return e?a:void 0}}};b._set("uniqueValueInfos",[]);return b}w(a,v);n=a;a.prototype.writeType=function(b,e,a,c){e.type="uniqueValue"};a.prototype.writeBackgroundFillSymbolWebScene=function(b,e,a,c){f.writeTarget(b,e,a,c)};a.prototype.castField=function(b){return null==b?b:"function"===typeof b?b:u.ensureString(b)};a.prototype.writeField=function(b,e,a,c){"string"===typeof b?e[a]=b:c&&c.messages?c.messages.push(new y("property:unsupported","UniqueValueRenderer.field set to a function cannot be written to JSON")):
l.error(".field: cannot write field to JSON since it's not a string value")};Object.defineProperty(a.prototype,"compiledFunc",{get:function(){return m.createFunction(this.valueExpression)},enumerable:!0,configurable:!0});Object.defineProperty(a.prototype,"defaultSymbol",{set:function(b){this._isDefaultSymbolDerived=!1;this._set("defaultSymbol",b)},enumerable:!0,configurable:!0});a.prototype.readDefaultSymbol=function(b,e,a){return f.read(b,e,a)};a.prototype.writeDefaultSymbolWebScene=function(b,e,
a,c){this._isDefaultSymbolDerived||f.writeTarget(b,e,a,c)};a.prototype.writeDefaultSymbol=function(b,e,a,c){this._isDefaultSymbolDerived||f.writeTarget(b,e,a,c)};a.prototype.readPortal=function(b,a,c){return c.portal||r.getDefault()};a.prototype.readStyleOrigin=function(b,a,c){if(a.styleName)return Object.freeze({styleName:a.styleName});if(a.styleUrl)return b=p.read(a.styleUrl,c),Object.freeze({styleUrl:b})};a.prototype.writeStyleOrigin=function(b,a,c,d){b.styleName?a.styleName=b.styleName:b.styleUrl&&
(a.styleUrl=p.write(b.styleUrl,d),p.isAbsolute(a.styleUrl)&&(a.styleUrl=p.normalize(a.styleUrl)))};Object.defineProperty(a.prototype,"uniqueValueInfos",{set:function(b){this.styleOrigin?l.error("#uniqueValueInfos\x3d","Cannot modify unique value infos of a UniqueValueRenderer created from a web style"):(this._set("uniqueValueInfos",b),this._updateValueInfoMap())},enumerable:!0,configurable:!0});a.prototype.addUniqueValueInfo=function(b,a){if(this.styleOrigin)l.error("#addUniqueValueInfo()","Cannot modify unique value infos of a UniqueValueRenderer created from a web style");
else{var c;c="object"===typeof b?H(b):new q.default({value:b,symbol:a});this.uniqueValueInfos.push(c);this._valueInfoMap[c.value]=c}};a.prototype.removeUniqueValueInfo=function(b){if(this.styleOrigin)l.error("#removeUniqueValueInfo()","Cannot modify unique value infos of a UniqueValueRenderer created from a web style");else for(var a=0;a<this.uniqueValueInfos.length;a++)if(this.uniqueValueInfos[a].value===b+""){delete this._valueInfoMap[b];this.uniqueValueInfos.splice(a,1);break}};a.prototype.getUniqueValueInfo=
function(b,a){var c=this.field,e=b.attributes,d;if(this.valueExpression)d=m.executeFunction(this.compiledFunc,m.createExecContext(b,m.getViewInfo(a)));else if("function"!==typeof c&&this.field2){d=this.field2;var h=this.field3,f=[];c&&f.push(e[c]);d&&f.push(e[d]);h&&f.push(e[h]);d=f.join(this.fieldDelimiter||"")}else"function"===typeof c?d=c(b):c&&(d=e[c]);return this._valueInfoMap[d+""]};a.prototype.getSymbol=function(b,a){var c=this.getUniqueValueInfo(b,a);return c&&c.symbol||this.defaultSymbol};
a.prototype.getSymbols=function(){for(var b=[],a=0,c=this.uniqueValueInfos;a<c.length;a++){var d=c[a];d.symbol&&b.push(d.symbol)}this.defaultSymbol&&b.push(this.defaultSymbol);return b};a.prototype.clone=function(){var b=new n({field:this.field,field2:this.field2,field3:this.field3,defaultLabel:this.defaultLabel,defaultSymbol:h.clone(this.defaultSymbol),valueExpression:this.valueExpression,valueExpressionTitle:this.valueExpressionTitle,fieldDelimiter:this.fieldDelimiter,visualVariables:h.clone(this.visualVariables),
legendOptions:h.clone(this.legendOptions),authoringInfo:this.authoringInfo&&this.authoringInfo.clone(),backgroundFillSymbol:h.clone(this.backgroundFillSymbol)});this._isDefaultSymbolDerived&&(b._isDefaultSymbolDerived=!0);b._set("portal",this.portal);var a=h.clone(this.uniqueValueInfos);this.styleOrigin&&(b._set("styleOrigin",Object.freeze(h.clone(this.styleOrigin))),Object.freeze(a));b._set("uniqueValueInfos",a);b._updateValueInfoMap();return b};a.prototype.collectRequiredFields=function(b){this.inherited(arguments);
[this.field,this.field2,this.field3].forEach(function(a){a&&"string"===typeof a&&(b[a]=!0)});this.valueExpression&&m.extractFieldNames(this.valueExpression).forEach(function(a){b[a]=!0})};a.prototype.populateFromStyle=function(){var a=this;return G.fetchStyle(this.styleOrigin,{portal:this.portal}).then(function(b){var c=[];a._valueInfoMap={};b&&b.data&&Array.isArray(b.data.items)&&b.data.items.forEach(function(d){var e=new F({styleUrl:b.styleUrl,styleName:b.styleName,portal:a.portal,name:d.name});
a.defaultSymbol||d.name!==b.data.defaultItem||(a.defaultSymbol=e,a._isDefaultSymbolDerived=!0);e=new q.default({value:d.name,symbol:e});c.push(e);a._valueInfoMap[d.name]=e});a._set("uniqueValueInfos",Object.freeze(c));!a.defaultSymbol&&a.uniqueValueInfos.length&&(a.defaultSymbol=a.uniqueValueInfos[0].symbol,a._isDefaultSymbolDerived=!0);return a})};a.prototype._updateValueInfoMap=function(){var a=this;this._valueInfoMap={};this.uniqueValueInfos.forEach(function(b){return a._valueInfoMap[b.value+""]=
b})};a.fromPortalStyle=function(a,c){var b=new n(c&&c.properties);b._set("styleOrigin",Object.freeze({styleName:a}));b._set("portal",c&&c.portal||r.getDefault());b=b.populateFromStyle();b.catch(function(b){l.error("#fromPortalStyle('"+a+"'[, ...])","Failed to create unique value renderer from style name",b)});return b};a.fromStyleUrl=function(a,c){var b=new n(c&&c.properties);b._set("styleOrigin",Object.freeze({styleUrl:a}));b=b.populateFromStyle();b.catch(function(b){l.error("#fromStyleUrl('"+a+
"'[, ...])","Failed to create unique value renderer from style URL",b)});return b};c([d.property()],a.prototype,"type",void 0);c([d.writer("type")],a.prototype,"writeType",null);c([d.property({types:{base:E,key:"type",typeMap:{"simple-fill":k.rendererTypes.typeMap["simple-fill"],"picture-fill":k.rendererTypes.typeMap["picture-fill"],"polygon-3d":k.rendererTypes.typeMap["polygon-3d"]}},json:{read:f.read,write:f.writeTarget}})],a.prototype,"backgroundFillSymbol",void 0);c([d.writer("web-scene","backgroundFillSymbol",
{backgroundFillSymbol:{type:D}})],a.prototype,"writeBackgroundFillSymbolWebScene",null);c([d.property({json:{type:String,read:{source:"field1"},write:{target:"field1"}}})],a.prototype,"field",void 0);c([d.cast("field")],a.prototype,"castField",null);c([d.writer("field")],a.prototype,"writeField",null);c([d.property({type:String,json:{write:!0}})],a.prototype,"field2",void 0);c([d.property({type:String,json:{write:!0}})],a.prototype,"field3",void 0);c([d.property({type:String,json:{write:!0}})],a.prototype,
"valueExpression",void 0);c([d.property({type:String,json:{write:!0}})],a.prototype,"valueExpressionTitle",void 0);c([d.property({dependsOn:["valueExpression"]})],a.prototype,"compiledFunc",null);c([d.property({type:C.default,json:{write:!0}})],a.prototype,"legendOptions",void 0);c([d.property({type:String,json:{write:!0}})],a.prototype,"defaultLabel",void 0);c([d.property({types:k.rendererTypes})],a.prototype,"defaultSymbol",null);c([d.reader("defaultSymbol")],a.prototype,"readDefaultSymbol",null);
c([d.writer("web-scene","defaultSymbol",{defaultSymbol:{types:k.rendererTypes3D}})],a.prototype,"writeDefaultSymbolWebScene",null);c([d.writer("defaultSymbol")],a.prototype,"writeDefaultSymbol",null);c([d.property({type:String,json:{write:!0}})],a.prototype,"fieldDelimiter",void 0);c([d.property({type:r,readOnly:!0})],a.prototype,"portal",void 0);c([d.reader("portal",["styleName"])],a.prototype,"readPortal",null);c([d.property({readOnly:!0})],a.prototype,"styleOrigin",void 0);c([d.reader("styleOrigin",
["styleName","styleUrl"])],a.prototype,"readStyleOrigin",null);c([d.writer("styleOrigin",{styleName:{type:String},styleUrl:{type:String}})],a.prototype,"writeStyleOrigin",null);c([d.property({type:[q.default],json:{write:{overridePolicy:function(){return this.styleOrigin?{enabled:!1}:{enabled:!0}}}}})],a.prototype,"uniqueValueInfos",null);c([d.property({dependsOn:["field","field2","field3","valueExpression"],readOnly:!0})],a.prototype,"requiredFields",void 0);c([x(1,d.cast(k.ensureType))],a.prototype,
"addUniqueValueInfo",null);return a=n=c([d.subclass("esri.renderers.UniqueValueRenderer")],a);var n}(d.declared(A))});