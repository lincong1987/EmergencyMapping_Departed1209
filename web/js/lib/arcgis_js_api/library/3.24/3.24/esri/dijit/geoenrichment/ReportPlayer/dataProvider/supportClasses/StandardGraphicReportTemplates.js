// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.24/esri/copyright.txt for details.
//>>built
define("esri/dijit/geoenrichment/ReportPlayer/dataProvider/supportClasses/StandardGraphicReportTemplates",[],function(){var b={portalUrl:"http://www.arcgis.com",user:"esri_reports",query:"http://www.arcgis.com/home/search.html?q\x3downer%3Aesri_reports",templates:{ed093d10e12544fa9d45bc24b477c453:"at-risk-population-US","15f136dd2b2a4fb2b3f51d2944ed82bc":"executive-summary-call-outs-US","0627ed051bf84d9ca9e93518e1e0c13e":"demographic-summary-US","1165ab4dbae5446bbc5e9558d3e2f0af":"transportation-to-work-US",
"7931861c32254fb3a642b3a17dce3246":"health-care-US","6cfba5c9a6c44e729e7983ebb78b4892":"marketing-profile-US","9668d7dce8ff4bd99908508c792ba5a1":"portrait-property-flyer-US","0b68c6309b0d44bfa7a1d5198c2c4904":"skyscraper-US",ff11fa48b9184f4ba66a3271dec6252d:"key-facts-US"},aliasToID:function(a){for(var c in b.templates)if(b.templates[c]===a)return c;return null},hasAlias:function(a){return!!b.aliasToID(a)},idToAlias:function(a){return b.templates[id]},hasID:function(a){return!!b.templates[a]}};return b});