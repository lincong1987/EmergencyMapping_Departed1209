var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (f) {
    if ((typeof exports === "undefined" ? "undefined" : _typeof(exports)) === "object" && typeof module !== "undefined") {
        module.exports = f();
    } else if (typeof define === "function" && define.amd) {
        define([], f);
    } else {
        var g;if (typeof window !== "undefined") {
            g = window;
        } else if (typeof global !== "undefined") {
            g = global;
        } else if (typeof self !== "undefined") {
            g = self;
        } else {
            g = this;
        }g.Custom = f();
    }
})(function () {
    var define, module, exports;return function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);var f = new Error("Cannot find module '" + o + "'");throw f.code = "MODULE_NOT_FOUND", f;
                }var l = n[o] = { exports: {} };t[o][0].call(l.exports, function (e) {
                    var n = t[o][1][e];return s(n ? n : e);
                }, l, l.exports, e, t, n, r);
            }return n[o].exports;
        }var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) {
            s(r[o]);
        }return s;
    }({ 1: [function (require, module, exports) {
            /*
             * @namespace CRS
             * @crs L.CRS.EPSG4326
             *
             * A common CRS among GIS enthusiasts. Uses simple Equirectangular projection.
             *
             * Leaflet 1.0.x complies with the [TMS coordinate scheme for EPSG:4326](https://wiki.osgeo.org/wiki/Tile_Map_Service_Specification#global-geodetic),
             * which is a breaking change from 0.7.x behaviour.  If you are using a `TileLayer`
             * with this CRS, ensure that there are two 256x256 pixel tiles covering the
             * whole earth at zoom level zero, and that the tile coordinate origin is (-180,+90),
             * or (-180,-90) for `TileLayer`s with [the `tms` option](#tilelayer-tms) set.
             */
            var CustomEPSG4326 = L.extend({}, L.CRS.Earth, {
                code: 'EPSG:4326',
                projection: L.Projection.LonLat,
                transformation: new L.Transformation(1 / 180, 1, -1 / 180, 0.5),
                scale: function scale(zoom) {
                    return 256 * Math.pow(2, zoom - 1);
                }
            });
            module.exports = CustomEPSG4326;
        }, {}], 2: [function (require, module, exports) {
            /**
             * ??????Attribution?????????options???????????????leaflet??????
             */
            L.Control.Attribution.prototype.options = {
                position: 'bottomright'
            };

            /**
             * ?????????????????????bug
             */
            L.Map.TouchZoom.prototype._onTouchMove = function (_super) {
                return function (e) {
                    if (!e.touches || e.touches.length !== 2 || !this._zooming) {
                        return;
                    }

                    var map = this._map,
                        p1 = map.mouseEventToContainerPoint(e.touches[0]),
                        p2 = map.mouseEventToContainerPoint(e.touches[1]),
                        scale = p1.distanceTo(p2) / this._startDist;

                    this._zoom = map.getScaleZoom(scale, this._startZoom) + 1;

                    if (!map.options.bounceAtZoomLimits && (this._zoom < map.getMinZoom() && scale < 1 || this._zoom > map.getMaxZoom() && scale > 1)) {
                        this._zoom = map._limitZoom(this._zoom);
                    }

                    if (map.options.touchZoom === 'center') {
                        this._center = this._startLatLng;
                        if (scale === 1) {
                            return;
                        }
                    } else {
                        // Get delta from pinch to center, so centerLatLng is delta applied to initial pinchLatLng
                        var delta = p1._add(p2)._divideBy(2)._subtract(this._centerPoint);
                        if (scale === 1 && delta.x === 0 && delta.y === 0) {
                            return;
                        }
                        this._center = map.unproject(map.project(this._pinchStartLatLng, this._zoom).subtract(delta), this._zoom);
                    }

                    if (!this._moved) {
                        map._moveStart(true);
                        this._moved = true;
                    }

                    L.Util.cancelAnimFrame(this._animRequest);

                    var moveFn = L.bind(map._move, map, this._center, this._zoom, { pinch: true, round: false });
                    this._animRequest = L.Util.requestAnimFrame(moveFn, this, true);

                    L.DomEvent.preventDefault(e);
                };
            }(L.Map.TouchZoom.prototype._onTouchMove);

            /**
             * ??????flyTo??????????????????????????????????????????????????????bug
             */
            L.Map.prototype.flyTo = function (_super) {
                return function (targetCenter, targetZoom, options) {
                    options = options || {};
                    if (options.animate === false || !L.Browser.any3d) {
                        return this.setView(targetCenter, targetZoom, options);
                    }

                    this._stop();

                    var from = this.project(this.getCenter()),
                        to = this.project(targetCenter),
                        size = this.getSize(),
                        startZoom = this._zoom;

                    targetCenter = L.latLng(targetCenter);
                    targetZoom = targetZoom === undefined ? startZoom : targetZoom;

                    var w0 = Math.max(size.x, size.y),
                        w1 = w0 * this.getZoomScale(startZoom, targetZoom),
                        u1 = to.distanceTo(from) || 1,
                        rho = 1.42,
                        rho2 = rho * rho;

                    function r(i) {
                        var s1 = i ? -1 : 1,
                            s2 = i ? w1 : w0,
                            t1 = w1 * w1 - w0 * w0 + s1 * rho2 * rho2 * u1 * u1,
                            b1 = 2 * s2 * rho2 * u1,
                            b = t1 / b1,
                            sq = Math.sqrt(b * b + 1) - b;

                        // workaround for floating point precision bug when sq = 0, log = -Infinite,
                        // thus triggering an infinite loop in flyTo
                        var log = sq < 0.000000001 ? -18 : Math.log(sq);

                        return log;
                    }

                    function sinh(n) {
                        return (Math.exp(n) - Math.exp(-n)) / 2;
                    }
                    function cosh(n) {
                        return (Math.exp(n) + Math.exp(-n)) / 2;
                    }
                    function tanh(n) {
                        return sinh(n) / cosh(n);
                    }

                    var r0 = r(0);

                    function w(s) {
                        return w0 * (cosh(r0) / cosh(r0 + rho * s));
                    }
                    function u(s) {
                        return w0 * (cosh(r0) * tanh(r0 + rho * s) - sinh(r0)) / rho2;
                    }

                    function easeOut(t) {
                        return 1 - Math.pow(1 - t, 1.5);
                    }

                    var start = Date.now(),
                        S = (r(1) - r0) / rho,
                        duration = options.duration ? 1000 * options.duration : 1000 * S * 0.8;

                    function frame() {
                        var t = (Date.now() - start) / duration,
                            s = easeOut(t) * S;

                        if (t <= 1) {
                            this._flyToFrame = L.Util.requestAnimFrame(frame, this);

                            this._move(this.unproject(from.add(to.subtract(from).multiplyBy(u(s) / u1)), startZoom), this.getScaleZoom(w0 / w(s), startZoom), { flyTo: true });
                        } else {
                            //?????????????????????flyto????????????????????????????????????
                            targetZoom = Math.round(targetZoom);
                            this._move(targetCenter, targetZoom)._moveEnd(true);
                        }
                    }

                    this._moveStart(true);

                    frame.call(this);
                    return this;
                };
            }(L.Map.prototype.flyTo);

            /**
             * ?????????ie?????????????????????startsWith???endsWith??????
             */
            if (!!window.ActiveXObject || "ActiveXObject" in window) {
                String.prototype.startsWith = function (str) {

                    if (str == null || str == "" || this.length == 0 || str.length > this.length) return false;
                    if (this.substr(0, str.length) == str) return true;else return false;
                    return true;
                };

                String.prototype.endsWith = function (str) {
                    if (!!window.ActiveXObject || "ActiveXObject" in window) {
                        return this.indexOf(str, this.length - str.length) !== -1;
                    } else {
                        return this.endsWith(str);
                    }
                };
            }
        }, {}], 3: [function (require, module, exports) {
            module.exports = 'jssdk_bate@ leaflet 2.1.1';
        }, {}], 4: [function (require, module, exports) {
            /**
             * Created by kongjian on 2017/6/30.
             */
            var Filter = function () {
                function Filter() {
                    _classCallCheck(this, Filter);

                    //?????????ture???????????????layers?????????????????????????????????false????????????layers???????????????,???????????????cmdAll
                    this.otherDisplay = true;
                    //????????????
                    this.layers = [];
                    //????????????layerName???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????. ????????????????????????????????????
                    this.order = [];
                }

                /**
                 * ??????????????????
                 * Parameters :
                 * filterLayer - ????????????
                 */


                Filter.prototype.addFilterLayer = function addFilterLayer(filterLayer) {
                    this.layers.push(filterLayer);
                };

                /**
                 * ??????????????????
                 * Parameters :
                 * filterLayerId - ????????????ID
                 */


                Filter.prototype.removeFilterLayerById = function removeFilterLayerById(filterLayerId) {
                    for (var i = 0; i < this.layers.length; i++) {
                        if (this.layers[i].id == filterLayerId) {
                            this.layers.splice(i, 1);
                        }
                    }
                };

                return Filter;
            }();

            module.exports = Filter;
        }, {}], 5: [function (require, module, exports) {
            /**
             * Created by kongjian on 2017/6/30.
             */
            var Filter = require('./Filter');

            var FilterLayer = function (_Filter) {
                _inherits(FilterLayer, _Filter);

                function FilterLayer() {
                    _classCallCheck(this, FilterLayer);

                    //???????????????????????????
                    var _this = _possibleConstructorReturn(this, _Filter.call(this));

                    _this.id = null;
                    //????????????
                    _this.filters = {};
                    //?????????????????????id??????
                    _this.idFilter = null;
                    //???????????????,???????????????????????????????????????????????????????????????filters????????????????????????filterStr
                    _this.filterStr = null;
                    //????????????
                    _this.display = true;
                    return _this;
                }

                /**
                 * ????????????????????????
                 * Parameters :
                 * key - ?????? Q_fcode_S_EQ?????????fcode??????value??????
                 * value - ??????2101010500
                 */


                FilterLayer.prototype.addFilterField = function addFilterField(key, value) {
                    this.filters[key] = value;
                };

                /**
                 * ????????????????????????
                 * Parameters :
                 * key
                 */


                FilterLayer.prototype.removeFilterField = function removeFilterField(key) {
                    delete this.filters[key];
                };

                return FilterLayer;
            }(Filter);

            module.exports = FilterLayer;
        }, { "./Filter": 4 }], 6: [function (require, module, exports) {
            // 'use strict';
            // require('babel-polyfill');
            var Custom = module.exports = {};
            require('./ext/LeafletExt');
            L.CRS.CustomEPSG4326 = require('./ext/CRS.CustomEPSG4326');
            Custom.DataSource = require('./layer/datasource/DataSource');
            Custom.URLDataSource = require('./layer/datasource/URLDataSource');
            Custom.LocalDataSource = require('./layer/datasource/LocalDataSource');
            L.GLabelGrid = require('./layer/label/GLabelGrid');
            L.GWVTAnno = require('./layer/label/GWVTAnno');
            Custom.Feature = require('./layer/label/feature/Feature');

            Custom.GGroup = require('./layer/vector/stylejs/GGroup');
            Custom.GLevels = require('./layer/vector/stylejs/GLevels');
            Custom.GStyleItem = require('./layer/vector/stylejs/GStyleItem');

            L.GDynamicMap = require('./layer/vector/GDynamicMap');
            L.GVMapGrid = require('./layer/vector/GVMapGrid');
            L.GXYZ = require('./layer/vector/GXYZ');
            Custom.GServiceGroup = require('./layer/GServiceGroup');

            Custom.GVMapGridUtil = require('./layer/vector/draw/GVMapGridUtil');
            Custom.Filter = require('./filter/Filter');
            Custom.FilterLayer = require('./filter/FilterLayer');
        }, { "./ext/CRS.CustomEPSG4326": 1, "./ext/LeafletExt": 2, "./filter/Filter": 4, "./filter/FilterLayer": 5, "./layer/GServiceGroup": 7, "./layer/datasource/DataSource": 8, "./layer/datasource/LocalDataSource": 9, "./layer/datasource/URLDataSource": 10, "./layer/label/GLabelGrid": 11, "./layer/label/GWVTAnno": 12, "./layer/label/feature/Feature": 22, "./layer/vector/GDynamicMap": 23, "./layer/vector/GVMapGrid": 24, "./layer/vector/GXYZ": 25, "./layer/vector/draw/GVMapGridUtil": 26, "./layer/vector/stylejs/GGroup": 28, "./layer/vector/stylejs/GLevels": 29, "./layer/vector/stylejs/GStyleItem": 30 }], 7: [function (require, module, exports) {
            /**
             * Created by kongjian on 2017/6/26.
             */
            var GServiceGroup = function () {
                function GServiceGroup(layerId, url, map, options) {
                    _classCallCheck(this, GServiceGroup);

                    this.map = null;
                    this.layer = null;
                    this.label = null;
                    this.layerType = 0;
                    this.labelType = 2;
                    this.map = map;
                    this.url = url;
                    this.layerId = layerId;
                    this.styleId = null;
                    this.tileSize = 256;
                }

                GServiceGroup.prototype.addServiceGroup = function addServiceGroup() {
                    if (options && options.styleId) {
                        this.styleId = options.styleId;
                    }
                    if (options && options.tileSize) {
                        this.tileSize = options.tileSize;
                    }
                    switch (this.layerType) {
                        case 0:
                            this.addBaseLayer();
                            break;
                        case 1:
                            this.addFrontBaseLayer();
                            break;
                    }
                    switch (this.labelType) {
                        case 2:
                            this.addFrontLabel();
                            break;
                        case 3:
                            this.AddImgLabel();
                            break;
                        case 4:
                            this.addAvoidLabel();
                            break;
                    }
                };

                /*????????????*/
                GServiceGroup.prototype.addBaseLayer = function addBaseLayer() {
                    this.layer = new L.GXYZ(this.url + "&x={x}&y={y}&l={z}&tileType=" + this.layerType, { sphericalMercator: false, isBaseLayer: false, tileSize: this.tileSize });
                    this.map.addLayer(this.layer);
                };

                /*????????????*/
                GServiceGroup.prototype.addFrontBaseLayer = function addFrontBaseLayer() {
                    this.layer = new L.GVMapGrid(this.url + "&x={x}&y={y}&l={z}&tileType=" + this.layerType, { maxZoom: 21, keepBuffer: 0, updateWhenZooming: false, tileSize: this.tileSize });
                    this.map.addLayer(this.layer);
                };
                //////////////////////////////////////////////////////////////////////////

                /*??????????????????*/


                GServiceGroup.prototype.AddImgLabel = function AddImgLabel() {
                    this.label = new L.GXYZ(this.url + "&x={x}&y={y}&l={z}&tileType=" + this.labelType, { sphericalMercator: false, isBaseLayer: false, tileSize: this.tileSize });
                    this.map.addLayer(this.label);
                };
                /*??????????????????*/


                GServiceGroup.prototype.addAvoidLabel = function addAvoidLabel(url) {
                    this.label = new L.GLabelGrid(this.url + '&x={x}&y={y}&l={z}&tileType=' + this.labelType, { hitDetection: true, keepBuffer: 0, updateWhenZooming: false, tileSize: this.tileSize });
                    this.map.addLayer(this.label);
                };

                /*??????*/
                GServiceGroup.prototype.addFrontLabel = function addFrontLabel(url) {
                    this.label = new L.GWVTAnno("GWVTanno", { tileSize: this.tileSize });

                    var dataSource = new Custom.URLDataSource();
                    dataSource.url = this.url + '&x=${x}&y=${y}&l=${z}&tileType=' + this.labelType;
                    this.label.addDataSource(dataSource);
                    this.map.addLayer(this.label);
                };

                GServiceGroup.prototype.setLayerType = function setLayerType(layerType) {
                    if (layerType == "Img") {
                        this.layerType = 0;
                    } else if (layerType == "Data") {
                        this.layerType = 1;
                    }
                };

                GServiceGroup.prototype.setLabelType = function setLabelType(labelType) {
                    if (labelType == "Data") {
                        this.labelType = 2;
                    } else if (labelType == "Img") {
                        this.labelType = 3;
                    } else if (labelType == "AvoidImg") {
                        this.labelType = 4;
                    }
                };

                GServiceGroup.prototype.setTileSize = function setTileSize(tileSize) {
                    this.tileSize = tileSize;
                };

                GServiceGroup.prototype.getLayer = function getLayer() {
                    return this.layer;
                };

                GServiceGroup.prototype.getLabel = function getLabel() {
                    return this.label;
                };

                GServiceGroup.prototype.removeGroupLayer = function removeGroupLayer() {
                    if (this.layer) {
                        this.map.removeLayer(this.layer);
                    }
                    if (this.label) {
                        this.map.removeLayer(this.label);
                    }
                };

                return GServiceGroup;
            }();

            module.exports = GServiceGroup;
        }, {}], 8: [function (require, module, exports) {
            /**
             * Created by kongjian on 2017/6/30.
             */
            var UUID = require('../../utils/UUID');

            var DataSource = function DataSource() {
                _classCallCheck(this, DataSource);

                //?????????id
                this.id = new UUID().valueOf();
                //???????????????
                this.type = "";
                //key???????????????value???image??????
                this.textures = {};
            };

            ;

            module.exports = DataSource;
        }, { "../../utils/UUID": 32 }], 9: [function (require, module, exports) {
            var DataSource = require('./DataSource');
            /**
             * Created by kongjian on 2017/6/30.
             */

            var LocalDataSource = function (_DataSource) {
                _inherits(LocalDataSource, _DataSource);

                function LocalDataSource() {
                    _classCallCheck(this, LocalDataSource);

                    //???????????????
                    var _this2 = _possibleConstructorReturn(this, _DataSource.call(this));

                    _this2.type = 'LocalDataSource';
                    //??????????????????
                    _this2.features = [];
                    //??????url Map???{name:1.png,value:'http://localhost:8080/mapserver/1.png'}
                    _this2.textureUrls = {};
                    return _this2;
                }

                /**
                 * ??????feature
                 * Parameters :
                 * feature
                 */


                LocalDataSource.prototype.addFeature = function addFeature(feature) {
                    this.features.push(feature);
                };

                /**
                 * ??????url??????
                 * Parameters :
                 * name ????????????,??????1.png
                 * url ?????????????????????
                 */
                LocalDataSource.prototype.addTextureUrl = function addTextureUrl(name, url) {
                    this.textureUrls[name] = url;
                };

                /**
                 * ??????url??????
                 * Parameters :
                 * name ????????????,??????1.png
                 */
                LocalDataSource.prototype.removeTextureUrl = function removeTextureUrl(name) {
                    delete this.textureUrls[name];
                };

                /**
                 * ????????????
                 */
                LocalDataSource.prototype.loadTexture = function loadTexture() {
                    var def = new Deferred();
                    var totalCount = 0;
                    for (var _i in this.textureUrls) {
                        totalCount++;
                    }

                    if (totalCount == 0) {
                        def.resolve();
                        return;
                    }

                    var count = 0;
                    for (var key in this.textureUrls) {
                        var img = new Image();
                        img.name = key;
                        img.onload = function (data) {
                            count++;
                            var name = data.target.name;
                            this.textures[name] = data.target;
                            if (count == totalCount) {
                                def.resolve();
                            }
                        }.bind(this);
                        img.src = this.textureUrls[key];
                    }
                    return def;
                };

                /**
                 * ??????featureId??????feature
                 * Parameters :
                 * featureId
                 */
                LocalDataSource.prototype.removeFeatureById = function removeFeatureById(featureId) {
                    for (var _i2 = 0; _i2 < this.features.length; _i2++) {
                        var feature = this.features[_i2];
                        if (feature.id == featureId) {
                            this.features.splice(_i2, 1);
                        }
                    }
                };

                return LocalDataSource;
            }(DataSource);

            ;

            module.exports = LocalDataSource;
        }, { "./DataSource": 8 }], 10: [function (require, module, exports) {
            /**
             * Created by kongjian on 2017/6/30.
             */
            var DataSource = require('./DataSource');

            var _require = require('./../../utils/es6-promise'),
                Deferred = _require.Deferred,
                getJSON = _require.getJSON;

            var Version = require('../../ext/Version');

            var URLDataSource = function (_DataSource2) {
                _inherits(URLDataSource, _DataSource2);

                function URLDataSource() {
                    _classCallCheck(this, URLDataSource);

                    //???????????????url??????????????????????????????????????????6????????????????????????
                    var _this3 = _possibleConstructorReturn(this, _DataSource2.call(this));

                    _this3.urlArray = [];
                    //???????????????
                    _this3.type = 'URLDataSource';
                    //?????????????????????url
                    _this3.url = null;
                    //???????????????????????????url
                    _this3.styleUrl = null;
                    //????????????Id
                    _this3.styleId = 'style';
                    //????????????
                    _this3.filter = null;
                    //??????
                    _this3.textures = {};
                    //??????????????????
                    _this3.control = null;
                    //?????????id
                    _this3.controlId = null;
                    // ?????????????????????url
                    _this3.sourceUrl = null;
                    //??????
                    _this3.host = '';
                    //?????????
                    _this3.servername = '';
                    return _this3;
                }

                /**
                 * ?????????????????????????????????
                 */


                URLDataSource.prototype.loadStyle = function loadStyle(styleType) {
                    var def0 = new Deferred();
                    var def1 = new Deferred();
                    var def2 = new Deferred();

                    //??????url?????????servername,styleId
                    this.parseUrl();

                    if (!this.sourceUrl) {
                        this.sourceUrl = this.url + '&clientVersion=' + Version;
                        this.url = this.url + '&clientVersion=' + Version;
                    }

                    if (this.control && this.isIE()) {
                        //??????????????????
                        getJSON({ type: 'post', url: this.host + '/mapserver/vmap/' + this.servername + '/setControl',
                            data: 'control=' + this.control,
                            dataType: 'json' }).then(function (result) {
                            this.controlId = result.id;
                            this.url = this.sourceUrl + '&controlId=' + result.id;
                            def0.resolve();
                        }.bind(this));
                    } else {
                        if (this.control) {
                            this.url = this.sourceUrl + '&control=' + this.control;
                        } else {
                            this.url = this.sourceUrl;
                        }
                        def0.resolve();
                    }

                    if (!styleType) {
                        styleType = 'label';
                    }

                    //??????????????????
                    getJSON({ url: this.host + '/mapserver/styleInfo/' + this.servername + '/' + this.styleId + '/' + styleType + '/style.js', dataType: 'text' }).then(function (result) {
                        this.styleFun = new Function("drawer", "level", result);
                        def1.resolve();
                    }.bind(this));

                    //??????????????????
                    getJSON({ url: this.host + '/mapserver/styleInfo/' + this.servername + '/' + this.styleId + '/label/texture.js', dataType: 'text' }).then(function (result) {
                        var textures = JSON.parse(result);
                        var totalCount = 0;
                        for (var _i3 in textures) {
                            totalCount++;
                        }

                        if (totalCount == 0) {
                            def2.resolve();
                            return;
                        }

                        var count = 0;
                        for (var key in textures) {
                            var img = new Image();
                            img.name = key;
                            img.onload = function (data) {
                                count++;
                                var name = data.target.name;
                                this.textures[name] = data.target;
                                if (count == totalCount) {
                                    def2.resolve();
                                }
                            }.bind(this);
                            img.src = textures[key];
                        }
                    }.bind(this));

                    return [def0, def1, def2];
                };

                /**
                 * ??????url
                 */


                URLDataSource.prototype.parseUrl = function parseUrl() {
                    var urlParts = this.url.split('?');
                    var urlPartOne = urlParts[0].split('/mapserver/');
                    this.host = urlPartOne[0];
                    this.servername = urlPartOne[1].split('/')[1];
                    var params = urlParts[1].split('&');
                    for (var _i4 = 0; _i4 < params.length; _i4++) {
                        var param = params[_i4];
                        var keyValue = param.split('=');
                        if (keyValue[0] == 'styleId') {
                            this.styleId = keyValue[1];
                            return;
                        }
                    }
                };

                /**
                 * ??????????????????
                 */
                URLDataSource.prototype.setFilter = function setFilter(filter) {
                    this.control = null;
                    if (!this.url || !filter || filter.layers.length == 0 && filter.order.length == 0) {
                        return;
                    }

                    for (var _i5 = 0; _i5 < filter.layers.length; _i5++) {
                        var filterLayer = filter.layers[_i5];
                        if (!filterLayer.id) {
                            filter.layers.splice(_i5, 1);
                        }
                    }

                    this.control = JSON.stringify(filter);
                };

                URLDataSource.prototype.getTexture = function getTexture(key) {
                    return this.textures[key];
                };

                URLDataSource.prototype.addTexture = function addTexture(key, texture) {
                    this.textures[key] = texture;
                };

                /**
                 * ?????????ie?????????
                 */


                URLDataSource.prototype.isIE = function isIE() {
                    if (!!window.ActiveXObject || "ActiveXObject" in window) return true;else return false;
                };

                return URLDataSource;
            }(DataSource);

            ;

            module.exports = URLDataSource;
        }, { "../../ext/Version": 3, "./../../utils/es6-promise": 33, "./DataSource": 8 }], 11: [function (require, module, exports) {
            /**
             * Created by kongjian on 2017/9/26.
             * ???????????????????????????????????????????????????
             */

            var GXYZUtil = require('../vector/draw/GXYZUtil');
            var Version = require('../../ext/Version');
            var GDrawGeomerty = require('./avoid/GDrawGeomerty');
            var GLabelGrid = L.TileLayer.extend({
                //???????????????url??????????????????????????????????????????6????????????????????????
                urlArray: [],
                // ?????????????????????url
                sourceUrl: null,
                // ??????????????????
                textures: {},
                //????????????
                tileQueue: [],
                //????????????
                ratio: 1,
                //????????????
                tilesize: 256,
                //??????json??????
                control: null,
                //?????????id
                controlId: null,
                //????????????????????????
                hitDetection: false,
                initialize: function initialize(url, options) {
                    if (window.devicePixelRatio > 1.5) {
                        this.ratio = 2;
                    }

                    if (!this.sourceUrl) {
                        this.sourceUrl = url;
                    }

                    if (options && options.tileSize) {
                        this.tilesize = options.tileSize;
                    }

                    this.gxyzUtil = new GXYZUtil();
                    this.gxyzUtil.tileSize = this.tilesize;
                    this.gxyzUtil.parseUrl(url);

                    this._url = url + '&tilesize=' + this.tilesize + '&clientVersion=' + Version;
                    L.setOptions(this, options);

                    this.hitDetection = options.hitDetection;
                    this.on('tileunload', this._onTileRemove);
                    this.on('tileload', this._onTileLoad);
                    this.on('tileerror', this._onTileError);
                },

                _initContainer: function _initContainer() {
                    if (this._container) {
                        return;
                    }

                    this._container = L.DomUtil.create('div', 'leaflet-pane leaflet-overlay-pane');
                    this.getPane().appendChild(this._container);
                },

                onAdd: function onAdd() {
                    if (this.control) {
                        this._url = this.sourceUrl + '&tilesize=' + this.tilesize + '&clientVersion=' + Version + '&control=' + this.control;
                    }
                    if (this.controlId) {
                        this._url = this.sourceUrl + '&tilesize=' + this.tilesize + '&clientVersion=' + Version + '&controlId=' + this.controlId;
                    }

                    this._initContainer();

                    this._levels = {};
                    this._tiles = {};

                    //??????????????????
                    Custom.getJSON({ url: this.gxyzUtil.host + '/mapserver/styleInfo/' + this.gxyzUtil.servername + '/' + this.gxyzUtil.styleId + '/label/texture.js', dataType: 'text' }).then(function (result) {
                        var textures = JSON.parse(result);
                        var totalCount = 0;
                        for (var i in textures) {
                            totalCount++;
                        }

                        if (totalCount == 0) {
                            this._resetView();
                            this._update();
                        }

                        var count = 0;
                        for (var key in textures) {
                            var img = new Image();
                            img.name = key;
                            img.onload = function (data) {
                                count++;
                                var name = data.target.name;
                                this.textures[name] = data.target;
                                if (count == totalCount) {
                                    this._resetView();
                                    this._update();
                                }
                            }.bind(this);
                            img.src = textures[key];
                        }
                    }.bind(this));
                },

                /**
                 * ???????????????????????????
                 */
                createTile: function createTile(coords, done) {
                    //???????????????canvas?????????????????????canvas
                    var tile = this.tileQueue.pop();
                    if (!tile) {
                        tile = this.initTile();
                    } else {
                        this._cleanTile(tile);
                    }

                    var url = this.getTileUrl(coords);

                    Custom.getJSON({ url: url, dataType: 'json' }).then(function (data) {
                        tile.data = data;
                        this._tileOnLoad.apply(this, [done, tile]);
                    }.bind(this), function (error) {
                        this._tileOnError.apply(this, [done, tile, error]);
                    }.bind(this));

                    return tile;
                },

                /**
                 * ??????url?????????
                 */
                getTileUrl: function getTileUrl(coords) {
                    var data = {
                        r: L.Browser.retina ? '@2x' : '',
                        s: this._getSubdomain(coords),
                        x: coords.x,
                        y: coords.y,
                        z: this._getZoomForUrl()
                    };
                    if (this._map && !this._map.options.crs.infinite) {
                        var invertedY = this._globalTileRange.max.y - coords.y;
                        if (this.options.tms) {
                            data['y'] = invertedY;
                        }
                        data['-y'] = invertedY;
                    }

                    if (this.urlArray.length == 0) {
                        return L.Util.template(this._url, L.extend(data, this.options));
                    } else {
                        //???urlArray?????????????????????url
                        var len = this.urlArray.length - 1;
                        var index = Math.round(Math.random() * len);
                        var url = this.urlArray[index];

                        var array = this._url.split('/mapserver');
                        var partUrl = array[1];
                        url = url + '/mapserver' + partUrl;
                        return L.Util.template(url, L.extend(data, this.options));
                    }
                },

                /**
                 *  ?????????canvas
                 */
                initTile: function initTile() {
                    // console.time('initTile');
                    var tile = document.createElement("canvas");
                    tile.style.width = this.tilesize + "px";
                    tile.style.height = this.tilesize + "px";
                    tile.width = this.tilesize;
                    tile.height = this.tilesize;

                    var ctx = tile.getContext("2d", { isQuality: true });
                    tile.ctx = ctx;

                    if (this.hitDetection) {
                        var canvas = document.createElement("canvas");
                        canvas.style.width = this.tilesize + "px";
                        canvas.style.height = this.tilesize + "px";
                        canvas.width = this.tilesize;
                        canvas.height = this.tilesize;
                        var hitCtx = canvas.getContext("2d", { isQuality: true });
                        tile.hitCtx = hitCtx;
                    }
                    // console.timeEnd('initTile');
                    return tile;
                },

                //????????????
                _onTileRemove: function _onTileRemove(e) {
                    //?????????????????????
                    this.tileQueue.push(e.tile);
                },

                /**
                 *  ??????????????????????????????
                 */
                _abortLoading: function _abortLoading() {
                    var i, tile;
                    for (i in this._tiles) {
                        if (this._tiles[i].coords.z !== this._tileZoom) {
                            tile = this._tiles[i].el;

                            // if (!tile.complete) { // ???????????????????????????????????????
                            L.DomUtil.remove(tile);
                            // }
                        }
                    }
                },

                _onTileLoad: function _onTileLoad(item) {
                    var tile = item.tile;
                    this._drawTile(tile, tile.data);
                    tile.complete = true;
                },

                _onTileError: function _onTileError(item) {
                    var tile = item.tile;
                    tile.complete = true;
                    this.tileQueue.push(tile);
                },

                _tileOnError: function _tileOnError(done, tile, e) {
                    done(e, tile);
                },

                _drawTile: function _drawTile(tile, features) {
                    // console.time('_drawTile');
                    var ctx = tile.ctx;
                    var hitCtx = tile.hitCtx;
                    var featureIdMap = {};
                    for (var i = 0; i < features.length; i++) {
                        var feature = features[i];
                        //????????????
                        if (feature.type == 1) {
                            feature.id = Math.round(Math.random() * 256 * 256 * 256);
                            featureIdMap[feature.id] = feature;
                            feature.iconImg = this.textures[feature.style.texture];
                            GDrawGeomerty.drawPointIcon(ctx, feature, this.ratio, false, tile.hitCtx, this.hitDetection);
                            GDrawGeomerty.drawPoint(ctx, feature, this.ratio, false, false, tile.hitCtx, this.hitDetection);
                            continue;
                        }
                        //????????????
                        if (feature.type == 2) {
                            GDrawGeomerty.drawLine(ctx, feature, this.ratio);
                        }
                    }

                    //??????????????????
                    tile.featureIdMap = featureIdMap;
                    // console.timeEnd('_drawTile');
                },

                _cleanTile: function _cleanTile(tile) {
                    tile.ctx.clearRect(0, 0, this.tilesize, this.tilesize);
                    if (tile.hitCtx) {
                        tile.hitCtx.clearRect(0, 0, this.tilesize, this.tilesize);
                    }
                },

                /**
                 * ????????????????????????feature
                 * Parameters :
                 * x
                 * y
                 */
                getFeatureByXY: function getFeatureByXY(x, y) {
                    var feature = null;
                    if (this.hitDetection) {
                        var featureId;

                        var latLng = this._map.containerPointToLatLng(new L.point(x, y));
                        var maxBounds = this._map.options.crs.projection.bounds;
                        //??????????????????
                        var bounds = this._map.getBounds();
                        var pBounds = this._map.getPixelBounds();
                        //?????????????????????
                        var res = (bounds._northEast.lat - bounds._southWest.lat) / (pBounds.max.y - pBounds.min.y);

                        var tileSize = this.tilesize;
                        var row = (maxBounds.max.y - latLng.lat) / (res * tileSize);
                        var col = (latLng.lng - maxBounds.min.x) / (res * tileSize);
                        var frow = Math.floor(row);
                        var fcol = Math.floor(col);
                        var level = this._map.getZoom();

                        var tile = this._tiles[fcol + ':' + frow + ':' + level].el;

                        var tx = (col - fcol) * tileSize;
                        var ty = (row - frow) * tileSize;
                        var data = tile.hitCtx.getImageData(tx, ty, 1, 1).data;
                        if (data[3] === 255) {
                            // antialiased
                            var id = data[2] + 256 * (data[1] + 256 * data[0]);
                            if (id) {
                                featureId = id - 1;
                                try {
                                    feature = tile.featureIdMap[featureId];
                                } catch (err) {}
                            }
                        }
                    }
                    return feature;
                },

                /**
                 * ??????????????????
                 */
                setFilter: function setFilter(filter) {
                    if (!this._url || !filter || filter.layers.length == 0 && filter.order.length == 0) {
                        return;
                    }

                    this.gxyzUtil.setFilter(filter, function (result) {
                        if (result.isIE) {
                            this.controlId = result.id;
                            this.setUrl(this.sourceUrl + '&tilesize=' + this.tilesize + '&clientVersion=' + Version + '&controlId=' + result.id);
                        } else {
                            this.control = result.id;
                            this.setUrl(this.sourceUrl + '&tilesize=' + this.tilesize + '&clientVersion=' + Version + '&control=' + result.id);
                        }
                    }.bind(this));
                }
            });

            module.exports = GLabelGrid;
        }, { "../../ext/Version": 3, "../vector/draw/GXYZUtil": 27, "./avoid/GDrawGeomerty": 16 }], 12: [function (require, module, exports) {
            /**
             * Created by kongjian on 2017/6/26.
             * ???????????????????????????layer
             */
            var CanvasLayer = require('./draw/CanvasLayer');
            var GWVTAnno = L.Layer.extend({
                canvasLayer: null,
                currLevel: 2,
                //????????????
                ratio: 1,
                //??????????????????
                hitDetection: true,
                options: {
                    tileSize: 256,
                    //???????????????
                    opacity: 1
                },
                /**
                 * ????????????
                 */
                initialize: function initialize(options) {
                    L.setOptions(this, options);
                    if (this.options.hasOwnProperty('hitDetection')) {
                        this.hitDetection = this.options.hitDetection;
                    }
                    if (window.devicePixelRatio > 1.5) {
                        this.ratio = 2;
                    }
                    this.canvasLayer = new CanvasLayer();
                    this.canvasLayer.tileSize = this.options.tileSize;
                    this.canvasLayer.hitDetection = this.hitDetection;
                    this.canvasLayer.ratio = this.ratio;
                    this.animating = false;
                },

                /**
                 * ?????????????????????????????????
                 */
                onAdd: function onAdd() {
                    //??????????????????
                    var maxExtent = this._map.options.crs.projection.bounds;
                    this.canvasLayer.init(this._map._size.x, this._map._size.y, this.options.tileSize, this);
                    this.canvasLayer.maxExtent = [maxExtent.min.x, maxExtent.min.y, maxExtent.max.x, maxExtent.max.y];
                    this._container = this.canvasLayer.root;

                    if (this._zoomAnimated) {
                        L.DomUtil.addClass(this._container, 'leaflet-zoom-animated');
                    }
                    this.canvasLayer.root.style.opacity = this.options.opacity;
                    this.getPane().appendChild(this.canvasLayer.root);
                    this._update();
                },

                setOpacity: function setOpacity(opacity) {
                    this.options.opacity = opacity;
                    if (this.canvasLayer.root) {
                        this.canvasLayer.root.style.opacity = this.options.opacity;
                    }
                },


                /**
                 * ????????????
                 */
                getEvents: function getEvents() {
                    var events = {
                        resize: this.onResize,
                        movestart: this.onMoveStart,
                        zoom: this._onZoom,
                        moveend: this._onMoveend
                    };

                    if (this._zoomAnimated) {
                        events.zoomanim = this._onAnimZoom;
                    }
                    return events;
                },

                /**
                 * ???????????????????????????
                 */
                onResize: function onResize(e) {
                    this.canvasLayer.tileSize = this.options.tileSize;
                    this.canvasLayer.gwvtAnno = this;
                    this.canvasLayer.initCanvas(this._map._size.x, this._map._size.y);
                    this._update();
                },

                _onAnimZoom: function _onAnimZoom(ev) {
                    this.updateTransform(ev.center, ev.zoom);
                },

                _onZoom: function _onZoom() {
                    this.updateTransform(this._map.getCenter(), this._map.getZoom());
                },

                _onMoveend: function _onMoveend() {
                    this.animating = false;
                    this._update();
                },

                /**
                 * ?????????????????????????????????
                 */
                updateTransform: function updateTransform(center, zoom) {
                    if (!this._zoom || !this._center) {
                        this._zoom = this._map.getZoom();
                        this._center = this._map.getCenter();
                    }

                    var scale = this._map.getZoomScale(zoom, this._zoom),
                        position = this.getCanvasXY(),
                        viewHalf = this._map.getSize().multiplyBy(0.5),
                        currentCenterPoint = this._map.project(this._center, zoom),
                        destCenterPoint = this._map.project(center, zoom),
                        centerOffset = destCenterPoint.subtract(currentCenterPoint),
                        topLeftOffset = viewHalf.multiplyBy(-scale).add(position).add(viewHalf).subtract(centerOffset);
                    if (L.Browser.any3d) {
                        L.DomUtil.setTransform(this.canvasLayer.root, topLeftOffset, scale);
                    } else {
                        L.DomUtil.setPosition(this.canvasLayer.root, topLeftOffset);
                    }
                },

                /**
                 * ??????????????????????????????
                 */
                onMoveStart: function onMoveStart() {
                    this.animating = true;
                },

                /**
                 * ??????????????????????????????
                 */
                _update: function _update() {
                    var map = this._map;
                    if (!map) {
                        return;
                    }

                    //??????????????????
                    var bounds = map.getBounds();
                    var pBounds = map.getPixelBounds();
                    //?????????????????????
                    var res = (bounds._northEast.lat - bounds._southWest.lat) / (pBounds.max.y - pBounds.min.y);
                    //??????????????????
                    var maxExtent = map.options.crs.projection.bounds;

                    //?????????????????????
                    var minRow = Math.floor((maxExtent.max.y - bounds._northEast.lat) / (res * this.options.tileSize));
                    var maxRow = Math.ceil((maxExtent.max.y - bounds._southWest.lat) / (res * this.options.tileSize));
                    var minCol = Math.floor((bounds._southWest.lng - maxExtent.min.x) / (res * this.options.tileSize));
                    var maxCol = Math.ceil((bounds._northEast.lng - maxExtent.min.x) / (res * this.options.tileSize));

                    var level = map.getZoom();
                    var zoomChanged = this.currLevel != level;
                    //????????????
                    var grid = this.getGrid(minRow, maxRow, minCol, maxCol, level);
                    this.canvasLayer.extent = [bounds._southWest.lng, bounds._southWest.lat, bounds._northEast.lng, bounds._northEast.lat];
                    this.canvasLayer.res = res;

                    this.canvasLayer.requestLabelTiles(grid, zoomChanged);
                    this.currLevel = level;
                },

                /**
                 * ??????????????????????????????????????????????????????
                 * Parameters (single argument):
                 * bounds - ??????????????????
                 * Returns:
                 * grid -  ???????????????????????????????????????
                 */
                getGrid: function getGrid(minRow, maxRow, minCol, maxCol, level) {
                    var grid = [];
                    for (var col = minCol; col < maxCol; col++) {
                        for (var row = minRow; row < maxRow; row++) {
                            grid.push({ "row": row, "col": col, "level": level });
                        }
                    }
                    return grid;
                },

                /**
                 * ????????????????????????????????????canvas?????????
                 * ????????????????????????????????????map???????????????map sdk?????????????????????
                 * ???????????????????????????????????????
                 */
                resetCanvasDiv: function resetCanvasDiv() {
                    var p = this.getCanvasXY();
                    L.DomUtil.setPosition(this._container, p);
                    this._center = this._map.getCenter();
                    this._zoom = this._map.getZoom();
                },

                /**
                 * ??????canvas?????????
                 */
                getCanvasXY: function getCanvasXY() {
                    if (!this._map) {
                        return;
                    }
                    var transform = this._map.dragging._draggable._element.style.transform;
                    var offset = transform.match(/(-?\d+\.?\d*)(px)/g);

                    var x = offset[0].replace('px', '');
                    var y = offset[1].replace('px', '');
                    return { x: -x, y: -y };
                },

                /**
                 * ??????????????????????????????????????????DataSouce???????????????????????????redraw??????
                 */
                redraw: function redraw() {
                    if (this.canvasLayer) {
                        this.canvasLayer.redraw();
                    }
                },

                /**
                 * ???????????????
                 * Parameters :
                 * dataSource
                 */
                addDataSource: function addDataSource(dataSource) {
                    this.canvasLayer.addDataSource(dataSource);
                },

                /**
                 * ??????dataSoucceId???????????????
                 * Parameters :
                 * dataSoucceId
                 */
                removeDataSourceById: function removeDataSourceById(dataSoucceId) {
                    this.canvasLayer.removeDataSourceById(dataSoucceId);
                },

                onRemove: function onRemove(map) {
                    L.DomUtil.remove(this.canvasLayer.root);
                },

                addToMap: function addToMap(map) {
                    map.addLayer(this);
                },

                /**
                 * ????????????????????????feature
                 * Parameters :
                 * x
                 * y
                 */
                getFeatureByXY: function getFeatureByXY(x, y) {
                    return this.canvasLayer.getFeatureByXY(x, y);
                },

                /**
                 * ????????????isImportant?????????????????????true
                 * Parameters :
                 * b
                 */
                setHasImportant: function setHasImportant(b) {
                    if (this.canvasLayer) {
                        this.canvasLayer.hasImportant = b;
                    }
                },

                /**
                 * ????????????isImportant???????????????true ??????false
                 */
                getHasImportant: function getHasImportant() {
                    if (this.canvasLayer) {
                        return this.canvasLayer.hasImportant;
                    } else {
                        return true;
                    }
                },

                CLASS_NAME: "OpenLayers.Layer.GWVTAnno"

            });

            module.exports = GWVTAnno;
        }, { "./draw/CanvasLayer": 20 }], 13: [function (require, module, exports) {
            /**
             * Class: GAnnoAvoid
             * ???????????????
             *
             * Inherits:
             *  - <Object>
             */
            var GGridIndex = require('./GGridIndex');
            var GLabelBox = require('./GLabelBox');

            var GAnnoAvoid = function () {
                function GAnnoAvoid(ctx, formatFont) {
                    _classCallCheck(this, GAnnoAvoid);

                    this.grid = null;
                    this.GLabelBox = new GLabelBox(ctx, formatFont);
                }

                //??????????????????????????????


                GAnnoAvoid.prototype.avoid = function avoid(labelFeatures, avoidLineFeatures) {
                    if (avoidLineFeatures.length == 0) {
                        return labelFeatures;
                    }

                    for (var _i6 = 0; _i6 < labelFeatures.length; _i6++) {
                        var labelFeature = labelFeatures[_i6];
                        if (labelFeature.type == 1) {
                            this.avoidPointLine(labelFeature, avoidLineFeatures);
                        }

                        if (labelFeature.type == 2) {
                            labelFeature.isCollision = this.avoidLineLine(labelFeature, avoidLineFeatures);
                        }
                    }

                    return labelFeatures;
                };

                //???????????????????????????


                GAnnoAvoid.prototype.avoidPointLine = function avoidPointLine(feature, avoidLineFeatures) {
                    var startDirection = feature.style.direction;
                    var weight = feature.weight;

                    //???????????????????????????????????????
                    avoidLineFeatures = this.getAvoidLineFeatures(weight, avoidLineFeatures);

                    //?????????????????????
                    var delDirectionCount = 0;
                    var boxCount = feature.boxs.length;
                    for (var _i7 = 0; _i7 < avoidLineFeatures.length; _i7++) {
                        var avoidLineFeature = avoidLineFeatures[_i7];
                        for (var _j = 0; _j < boxCount; _j++) {
                            var direction = startDirection + _j;
                            if (direction >= boxCount) {
                                direction = direction - boxCount;
                            }

                            var box = feature.boxs[direction];
                            var b = this.crashBoxLine(box, avoidLineFeature.sourceDatas, false);
                            if (b) {
                                if (feature.directions[direction]) {
                                    //?????????????????????????????????????????????
                                    delete feature.directions[direction];
                                    delDirectionCount++;

                                    //???????????????????????????????????????
                                    if (delDirectionCount == 4) {
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                    return false;
                };

                //???????????????????????????


                GAnnoAvoid.prototype.avoidLineLine = function avoidLineLine(feature, avoidLineFeatures) {
                    var weight = feature.weight;

                    //???????????????????????????????????????
                    avoidLineFeatures = this.getAvoidLineFeatures(weight, avoidLineFeatures);

                    for (var _j2 = 0; _j2 < avoidLineFeatures.length; _j2++) {
                        var avoidLineFeature = avoidLineFeatures[_j2];
                        var isCollision = false;
                        for (var _i8 = 0; _i8 < feature.boxs.length; _i8++) {
                            isCollision = this.crashPartLineLine(feature.boxs[_i8], avoidLineFeature.sourceDatas);
                            if (isCollision) {
                                return true;
                            }
                        }
                    }

                    return false;
                };

                //?????????????????????????????????????????????


                GAnnoAvoid.prototype.getAvoidLineFeatures = function getAvoidLineFeatures(weight, avoidLineFeatures) {
                    var alFeatures = [];
                    for (var _i9 = 0; _i9 < avoidLineFeatures.length; _i9++) {
                        var avoidLineFeature = avoidLineFeatures[_i9];
                        var lineWeight = avoidLineFeature.weight;
                        if (lineWeight > weight) {
                            alFeatures.push(avoidLineFeature);
                        }
                    }
                    return alFeatures;
                };

                // box???line????????????


                GAnnoAvoid.prototype.crashBoxLine = function crashBoxLine(box, line, isFour) {
                    var boxLines = [];
                    if (isFour) {
                        boxLines.push([box[0], box[1], box[2], box[1]]);
                        boxLines.push([box[2], box[1], box[2], box[3]]);
                        boxLines.push([box[2], box[3], box[0], box[3]]);
                        boxLines.push([box[0], box[3], box[0], box[1]]);
                    } else {
                        boxLines.push([box[0], box[1], box[2], box[3]]);
                        boxLines.push([box[2], box[1], box[0], box[3]]);
                    }

                    for (var _i10 = 0; _i10 < boxLines.length; _i10++) {
                        var boxLine = boxLines[_i10];
                        for (var _j3 = 0; _j3 < line.length / 2 - 1; _j3++) {
                            var partLine = [line[2 * _j3], line[2 * _j3 + 1], line[2 * (_j3 + 1)], line[2 * (_j3 + 1) + 1]];
                            if (this.crashPartLinePartLine(boxLine, partLine)) {
                                return true;
                            }
                        }
                    }
                    return false;
                };

                // ?????????????????????


                GAnnoAvoid.prototype.crashLineLine = function crashLineLine(line1, line2) {
                    for (var _i11 = 0; _i11 < line1.length / 2 - 1; _i11++) {
                        var partLine1 = [line1[2 * _i11], line1[2 * _i11 + 1], line1[2 * (_i11 + 1)], line1[2 * (_i11 + 1) + 1]];
                        for (var _j4 = 0; _j4 < line2.length / 2 - 1; _j4++) {
                            var partLine2 = [line2[2 * _j4], line2[2 * _j4 + 1], line2[2 * (_j4 + 1)], line2[2 * (_j4 + 1) + 1]];
                            if (this.crashPartLinePartLine(partLine1, partLine2)) {
                                return true;
                            }
                        }
                    }
                    return false;
                };

                // ?????????????????????


                GAnnoAvoid.prototype.crashPartLineLine = function crashPartLineLine(partLine, line2) {
                    for (var _j5 = 0; _j5 < line2.length / 2 - 1; _j5++) {
                        var partLine2 = [line2[2 * _j5], line2[2 * _j5 + 1], line2[2 * (_j5 + 1)], line2[2 * (_j5 + 1) + 1]];
                        if (this.crashPartLinePartLine(partLine, partLine2)) {
                            return true;
                        }
                    }
                    return false;
                };

                // ????????????????????????


                GAnnoAvoid.prototype.crashPartLinePartLine = function crashPartLinePartLine(line1, line2) {
                    var p0_x = line1[0];
                    var p0_y = line1[1];
                    var p1_x = line1[2];
                    var p1_y = line1[3];

                    var p2_x = line2[0];
                    var p2_y = line2[1];
                    var p3_x = line2[2];
                    var p3_y = line2[3];

                    var s02_x = void 0,
                        s02_y = void 0,
                        s10_x = void 0,
                        s10_y = void 0,
                        s32_x = void 0,
                        s32_y = void 0,
                        s_numer = void 0,
                        t_numer = void 0,
                        denom = void 0,
                        t = void 0;
                    s10_x = p1_x - p0_x;
                    s10_y = p1_y - p0_y;
                    s32_x = p3_x - p2_x;
                    s32_y = p3_y - p2_y;

                    denom = s10_x * s32_y - s32_x * s10_y;
                    if (denom == 0) //???????????????
                        return 0; // Collinear
                    var denomPositive = denom > 0;

                    s02_x = p0_x - p2_x;
                    s02_y = p0_y - p2_y;
                    s_numer = s10_x * s02_y - s10_y * s02_x;
                    if (s_numer < 0 == denomPositive) //?????????????????????0???????????????1?????????????????????????????????????????????????????????
                        return 0; // No collision

                    t_numer = s32_x * s02_y - s32_y * s02_x;
                    if (t_numer < 0 == denomPositive) return 0; // No collision

                    if (s_numer > denom == denomPositive || t_numer > denom == denomPositive) return 0; // No collision
                    return 1;
                };

                //??????


                GAnnoAvoid.prototype.defaultAvoid = function defaultAvoid(features, hasImportant) {
                    this.grid = new GGridIndex(8192, 16, 0);
                    if (features == null || features.length < 1) return [];
                    // console.time('??????box');
                    // //??????box,??????????????????????????????????????????????????????
                    features = this.GLabelBox.setBox(features, false);
                    // console.timeEnd('??????box');

                    // console.time('mergeFeatures');
                    features = this.mergeFeatures(features);
                    // console.timeEnd('mergeFeatures');
                    // console.time('??????');
                    //????????????
                    this.sort(features, hasImportant);
                    // console.timeEnd('??????');

                    // console.time('??????');
                    //?????????????????????????????????????????????
                    for (var _i12 = 0; _i12 < features.length; _i12++) {
                        this.avoidFeature(features[_i12]);
                    }
                    // console.timeEnd('??????');
                    features = this.GLabelBox.filterFeature(features);

                    // console.time('??????');
                    //????????????
                    this.removeRepeat(features);
                    // console.timeEnd('??????');
                    features = this.filterFeature(features);
                    this.prevFeatures = features;
                    return features;
                };

                /**
                 * ????????????????????????box????????????????????????
                 * @param f
                 */


                GAnnoAvoid.prototype.avoidFeature = function avoidFeature(f) {
                    if (f.style.show == false || f.hidden == true) {
                        f.hidden = true;
                        return;
                    }
                    if (f.boxs) {
                        if (f.type == 1) {
                            //??????????????????????????????
                            this.avoidPoint(f);
                        } else {
                            if (f.isCollision) {
                                f.hidden = true;
                            } else {
                                //????????????????????????????????????
                                this.avoidLine(f);
                            }
                        }
                    } else {
                        f.hidden = true;
                    }
                };

                /**
                 * ???????????????????????????????????????????????????
                 * @param feature
                 */


                GAnnoAvoid.prototype.avoidPoint = function avoidPoint(feature) {
                    //?????????????????????????????????
                    if (feature.style.isImportant == true) {
                        var box = feature.boxs[feature.style.direction];
                        this.addBoxToCells(feature.primaryId, box);
                        return;
                    }

                    //?????????????????????????????????????????????????????????
                    if (feature.style.isFourDirections && feature.style.texture) {
                        this.addFourCollisionFeatureToCells(feature, feature.style.direction);
                    } else {
                        //???????????????????????????
                        if (!feature.directions[feature.style.direction]) {
                            feature.hidden = true;
                            return;
                        }

                        var _box = feature.boxs[feature.style.direction];
                        var isCollision = this.isCollision(_box);
                        if (isCollision) {
                            feature.hidden = true;
                            return;
                        } else {
                            this.addBoxToCells(feature.primaryId, _box);
                        }
                    }
                };

                /**
                 * ???????????????????????????????????????????????????
                 * @param feature
                 */


                GAnnoAvoid.prototype.avoidLine = function avoidLine(feature) {
                    //?????????????????????????????????
                    if (feature.style.isImportant == true) {
                        for (var _i13 = 0; _i13 < feature.boxs.length; _i13++) {
                            var box = feature.boxs[_i13];
                            this.addBoxToCells(feature.primaryId + 'index_' + _i13, box);
                        }
                        return;
                    }

                    //????????????????????????????????????
                    var isCollision = false;
                    for (var _i14 = 0; _i14 < feature.boxs.length; _i14++) {
                        var _box2 = feature.boxs[_i14];
                        if (this.isCollision(_box2)) {
                            isCollision = true;
                            break;
                        }
                    }

                    if (isCollision) {
                        feature.hidden = true;
                    } else {
                        for (var _i15 = 0; _i15 < feature.boxs.length; _i15++) {
                            var _box3 = feature.boxs[_i15];
                            this.addBoxToCells(feature.primaryId + 'index_' + _i15, _box3);
                        }
                    }
                };

                /**
                 * ?????????????????????????????????
                 * @param feature ?????????
                 * @param index ?????????????????????index
                 */


                GAnnoAvoid.prototype.addFourCollisionFeatureToCells = function addFourCollisionFeatureToCells(feature, index) {
                    var isCollision = true;
                    var box = [];
                    //????????????????????????
                    if (feature.directions[index]) {
                        box = feature.boxs[index];
                        isCollision = this.isCollision(box);
                    }

                    // ????????????,?????????????????????
                    if (isCollision) {
                        index++;
                        if (index == 4) {
                            index = index - 4;
                        }

                        //?????????????????????????????????????????????
                        if (index == feature.style.direction) {
                            feature.hidden = true;
                            return;
                        } else {
                            //????????????????????????box??????????????????????????????
                            this.addFourCollisionFeatureToCells(feature, index);
                        }
                    } else {
                        feature.style.textPoint = feature.fourPoints[index];
                        this.addBoxToCells(feature.primaryId, box);
                    }
                };

                /**
                 *  ???????????????box???????????????????????????
                 * @param row
                 * @param col
                 * @param feature
                 */


                GAnnoAvoid.prototype.isCollision = function isCollision(box) {
                    var x1 = box[0];
                    var y1 = box[1];

                    var x2 = box[2];
                    var y2 = box[3];
                    var result = this.grid.query(x1, y1, x2, y2);
                    return result.length > 0;
                };

                /**
                 *  ??????box???????????????????????????true
                 */


                GAnnoAvoid.prototype.addBoxToCells = function addBoxToCells(key, box) {
                    var x1 = box[0];
                    var y1 = box[1];
                    var x2 = box[2];
                    var y2 = box[3];
                    this.grid.insert(key, x1, y1, x2, y2);
                };

                //attributeId????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????


                GAnnoAvoid.prototype.mergeFeatures = function mergeFeatures(features) {
                    var map = {};
                    for (var _i16 = 0; _i16 < features.length; _i16++) {
                        var feature = features[_i16];
                        if (!map[feature.attributeId]) {
                            map[feature.attributeId] = [];
                        }
                        map[feature.attributeId].push(feature);
                    }

                    for (var key in map) {
                        var array = map[key];
                        if (array.length > 1) {
                            var fristFeature = array[0];
                            //?????????????????????????????????
                            if (fristFeature.type == '1') {
                                var directions = array[0].directions;
                                for (var _j6 = 1; _j6 < array.length; _j6++) {
                                    directions = this.getBothDirection(directions, array[_j6].directions);
                                }

                                var isEmpty = false;
                                for (var dKey in directions) {
                                    isEmpty = true;
                                    break;
                                }

                                for (var k = 0; k < array.length; k++) {
                                    if (isEmpty) {
                                        array[0].hidden = true;
                                    } else {
                                        array[0].directions = directions;
                                    }
                                }
                            }

                            //????????????,????????????????????????????????????????????????
                            if (fristFeature.type == '2') {
                                var isCollision = false;
                                for (var n = 0; n < array.length; n++) {
                                    if (array[n].isCollision == true) {
                                        isCollision = true;
                                        break;
                                    }
                                }

                                if (isCollision) {
                                    for (var m = 0; m < array.length; m++) {
                                        array[m].hidden = true;
                                    }
                                }
                            }
                        }
                    }

                    //?????????????????????
                    return this.GLabelBox.filterFeature(features);
                };

                //????????????.


                GAnnoAvoid.prototype.sort = function sort(features, hasImportant) {
                    if (features.length > 0) {
                        //??????????????????
                        return features.sort(function (a, b) {
                            if (hasImportant) {
                                if (a.style.isImportant && !b.style.isImportant) {
                                    return -1;
                                }
                                if (b.style.isImportant && !a.style.isImportant) {
                                    return 1;
                                }
                            }

                            var aAttr = a.weight;
                            var bAttr = b.weight;

                            var aId = a.primaryId;
                            var bId = b.primaryId;

                            if (!aAttr) {
                                aAttr = -1;
                            }
                            if (!bAttr) {
                                bAttr = -1;
                            }
                            if (aAttr < bAttr) {
                                return 1;
                            } else if (aAttr == bAttr) {
                                if (aId < bId) {
                                    return 1;
                                } else {
                                    return -1;
                                }
                            } else {
                                return -1;
                            }
                        }.bind(this));
                    }
                };

                //??????????????????????????????


                GAnnoAvoid.prototype.getBothDirection = function getBothDirection(directions1, directions2) {
                    var directions = {};
                    for (var key in directions1) {
                        if (directions2[key]) {
                            directions[key] = 1;
                        }
                    }
                    return directions;
                };

                //?????????????????????


                GAnnoAvoid.prototype.removeRepeat = function removeRepeat(features) {
                    var pointsFs = [];
                    var lineTextFs = [];
                    var lineCodeFs = [];

                    var drawedPointFs = [];
                    var drawedLineTextFs = [];
                    var drawedLineCodeFs = [];
                    for (var _i17 = 0; _i17 < features.length; _i17++) {
                        var f = features[_i17];
                        if (f.type == 1) {
                            if (f.drawed == true) {
                                drawedPointFs.push(f);
                            } else {
                                pointsFs.push(f);
                            }
                        } else if (f.type == 2) {
                            if (f.lineType == 'text') {
                                if (f.drawed == true) {
                                    drawedLineTextFs.push(f);
                                } else {
                                    lineTextFs.push(f);
                                }
                            }
                            if (f.lineType == 'code') {
                                if (f.drawed == true) {
                                    drawedLineCodeFs.push(f);
                                } else {
                                    lineCodeFs.push(f);
                                }
                            }
                        }
                    }

                    for (var _j7 = 0; _j7 < pointsFs.length; _j7++) {
                        var pf = pointsFs[_j7];
                        this.getShowPointFeatrues(drawedPointFs, pf);
                    }

                    for (var k = 0; k < lineTextFs.length; k++) {
                        var ltf = lineTextFs[k];
                        this.getShowLineTextFeatrues(drawedLineTextFs, ltf);
                    }

                    for (var n = 0; n < lineCodeFs.length; n++) {
                        var lcf = lineCodeFs[n];
                        this.getShowLineCodeFeatrues(drawedLineCodeFs, lcf);
                    }

                    //???????????????????????????????????????
                    if (this.prevFeatures) {
                        for (var m = 0; m < this.prevFeatures.length; m++) {
                            var _pf = this.prevFeatures[m];
                            _pf.drawed = false;
                        }
                    }
                };

                GAnnoAvoid.prototype.getShowPointFeatrues = function getShowPointFeatrues(features, feature) {
                    var hidden = false;
                    for (var _i18 = 0; _i18 < features.length; _i18++) {
                        var f = features[_i18];
                        if (f.label == feature.label && f.style.distance && feature.style.distance) {
                            //?????????????????????????????????
                            var distance = this.getDistance(f.style.textPoint, feature.style.textPoint);
                            if (distance < f.style.distance) {
                                hidden = true;
                                feature.hidden = true;
                            }
                        }
                    }

                    if (!hidden) {
                        features.push(feature);
                    }
                };

                GAnnoAvoid.prototype.getShowLineTextFeatrues = function getShowLineTextFeatrues(features, feature) {
                    var hidden = false;
                    for (var _i19 = 0; _i19 < features.length; _i19++) {
                        var f = features[_i19];
                        if (f.label == feature.label && f.style.lineTextDistance && feature.style.lineTextDistance) {
                            //?????????????????????????????????
                            var distance = this.getDistance(f.centerPoint, feature.centerPoint);
                            if (distance < f.style.lineTextDistance) {
                                hidden = true;
                                feature.hidden = true;
                            }
                        }
                    }

                    if (!hidden) {
                        features.push(feature);
                    }
                };

                GAnnoAvoid.prototype.getShowLineCodeFeatrues = function getShowLineCodeFeatrues(features, feature) {
                    var hidden = false;
                    for (var _i20 = 0; _i20 < features.length; _i20++) {
                        var f = features[_i20];
                        if (f.label == feature.label && f.style.lineCodeDistance && feature.style.lineCodeDistance) {
                            //?????????????????????????????????
                            var distance = this.getDistance(f.centerPoint, feature.centerPoint);
                            if (distance < f.style.lineCodeDistance) {
                                hidden = true;
                                feature.hidden = true;
                            }
                        }
                    }

                    if (!hidden) {
                        features.push(feature);
                    }
                };

                /**
                 * ????????????????????????
                 */


                GAnnoAvoid.prototype.getDistance = function getDistance(p1, p2) {
                    var calX = p2[0] - p1[0];
                    var calY = p2[1] - p1[1];
                    return Math.pow(calX * calX + calY * calY, 0.5);
                };

                // ????????????????????????.


                GAnnoAvoid.prototype.filterFeature = function filterFeature(features) {
                    var returnFeatures = [];
                    //????????????????????????
                    for (var _i21 = 0; _i21 < features.length; _i21++) {
                        if (!features[_i21].hidden) {
                            features[_i21].drawed = true;
                            returnFeatures.push(features[_i21]);
                        }
                    }
                    return returnFeatures;
                };

                return GAnnoAvoid;
            }();

            module.exports = GAnnoAvoid;
        }, { "./GGridIndex": 17, "./GLabelBox": 18 }], 14: [function (require, module, exports) {
            var GDistance = require('./GDistance');
            var Util = require('./Util');

            var GCutLine = function () {
                function GCutLine() {
                    _classCallCheck(this, GCutLine);
                }

                GCutLine.cutLineFeature = function cutLineFeature(feature) {
                    var fs = [];
                    var index = 0;
                    if (feature.sourceData.length < 4) {
                        return fs;
                    }

                    var lineText = this.createLineTextFeatrue(feature, index);
                    index = lineText.index;
                    if (lineText.feature) {
                        fs.push(lineText.feature);
                    }

                    var lineCode = this.createLineCodeFeatrue(feature, index);
                    index = lineCode.index;
                    if (lineCode.feature) {
                        fs.push(lineCode.feature);
                    }

                    var lineArrow = this.createLineArrowFeatrue(feature, index);
                    if (lineArrow.feature) {
                        fs.push(lineArrow.feature);
                    }
                    return fs;
                };

                /**
                 * ?????????????????????
                 *  Parameters :
                 *  feature
                 *  index - ?????????line???index??????
                 */


                GCutLine.createLineTextFeatrue = function createLineTextFeatrue(feature, index) {
                    var style = feature.style;
                    var line = feature.sourceData;
                    var d = new GDistance();
                    var gaps = [];
                    var textFeature = null;

                    if (Util.isNotNull(feature.label)) {
                        //??????????????????
                        // let lineDis = this.getLineDistance(line);
                        //????????????????????????100?????????,????????????????????????
                        // if(lineDis < 100 && lineDis >0){
                        //     line = [line[0],line[1],line[line.length-2],line[line.length-1]];
                        // }

                        //????????????????????????
                        feature.label = feature.label + '';
                        //????????????????????????????????????????????????????????????????????????
                        for (var count = 0; count < feature.label.length + 1; count++) {
                            gaps.push(style.lineHeight * 1.2 + 2 + style.gap);
                        }

                        var cloneGaps = [].concat(gaps);
                        var points = d.getNodePath(line, gaps);
                        var textPoints = points.pointList;

                        if (textPoints.length > 1) {
                            index = points.index;
                            var showChanged = false;
                            var endLength = feature.label.length > textPoints.length ? textPoints.length - 1 : feature.label.length - 1;
                            var p1 = [textPoints[0][0][0], textPoints[0][0][1]];
                            var p2 = textPoints[endLength][0];

                            //?????????????????????x????????????
                            var angle = Util.getAngle(p1, p2);
                            textFeature = this.cloneFeature(feature);
                            textFeature.angle = angle;

                            if (style.changeDirection != false) {
                                //????????????
                                //???????????????????????????
                                showChanged = this.isChangeDirection(feature.label, p1, p2, angle);
                                if (showChanged) {
                                    textPoints = this.changeDirection(line, textPoints, cloneGaps, index, endLength);
                                }
                            }

                            textFeature.attributeId = textFeature.attributeId + '_text';
                            textFeature.sourceAngleData = textPoints;
                            textFeature.lineType = 'text';

                            if (textPoints.length < feature.label.length) {
                                index = feature.sourceData.length;
                                //??????????????????????????????????????????
                                if (textPoints.length > feature.label.length * 0.5) {
                                    this.delayTextPoint(line, textPoints, feature.label, style.chinaLabelWidth + style.gap, showChanged);
                                } else {
                                    textFeature = null;
                                }
                            }
                        } else {
                            if (!style.showRoadCode) {
                                textFeature = this.cloneFeature(feature);
                                textFeature.attributeId = textFeature.attributeId + '_text';
                                textFeature.sourceAngleData = [[[line[0], line[1]], 0]];
                                textFeature.lineType = 'text';
                                index = 2;
                            }
                        }
                    }
                    return { feature: textFeature, index: index };
                };

                /**
                 * ?????????????????????
                 *  Parameters :
                 *  feature
                 *  index - ?????????line???index??????
                 */


                GCutLine.createLineCodeFeatrue = function createLineCodeFeatrue(feature, index) {
                    var style = feature.style;
                    var line = feature.sourceData;
                    var d = new GDistance();
                    var gaps = [];
                    var codeFeature = null;

                    var roadLabel = feature.roadCodeLabel;
                    //?????????????????????
                    if (style.showRoadCode && Util.isNotNull(roadLabel) && index < line.length) {
                        var codeLine = line.slice(index, line.length - 1);
                        //?????????30?????????
                        gaps.push(30);
                        var cPoints = d.getNodePath(codeLine, gaps);
                        var codePoints = cPoints.pointList;
                        if (codePoints.length == 1) {
                            index = index + cPoints.index;
                            codeFeature = this.cloneFeature(feature);
                            codeFeature.attributeId = codeFeature.attributeId + '_code';
                            codeFeature.sourceAngleData = codePoints;
                            codeFeature.lineType = 'code';
                            codeFeature.label = roadLabel + '';
                        }

                        if (codePoints.length == 0) {
                            codeFeature = this.cloneFeature(feature);
                            codeFeature.attributeId = codeFeature.attributeId + '_code';
                            codeFeature.sourceAngleData = [[line, 0]];
                            codeFeature.lineType = 'code';
                            codeFeature.label = roadLabel + '';
                            index = 2;
                            return { feature: codeFeature, index: index };
                        }
                    }
                    return { feature: codeFeature, index: index };
                };

                /**
                 * ?????????????????????
                 *  Parameters :
                 *  feature
                 *  index - ?????????line???index??????
                 */


                GCutLine.createLineArrowFeatrue = function createLineArrowFeatrue(feature, index) {
                    var style = feature.style;
                    var line = feature.sourceData;
                    var d = new GDistance();
                    var gaps = [];
                    var arrowFeature = null;

                    //???????????????
                    if (style.showArrow && index < line.length) {
                        var arrowLine = line.slice(index, line.length - 1);
                        gaps.push(16);
                        gaps.push(16);
                        var aPoints = d.getNodePath(arrowLine, gaps);
                        var arrowPoints = aPoints.pointList;

                        if (arrowPoints.length == 2) {
                            arrowFeature = this.cloneFeature(feature);
                            arrowFeature.attributeId = arrowFeature.attributeId + '_arrow';
                            arrowFeature.sourceAngleData = arrowPoints;
                            arrowFeature.lineType = 'arrow';
                        }
                    }
                    return { feature: arrowFeature, index: index };
                };

                /**
                 * ???????????????????????????????????????????????????
                 *  Parameters :
                 *  line - ???????????????
                 *  textPoints - ????????????????????????
                 *  label - ?????????
                 *  gap - ????????????????????????
                 *  showChanged
                 *
                 */


                GCutLine.delayTextPoint = function delayTextPoint(line, textPoints, label, gap, showChanged) {
                    var fristPoint = null;
                    var secondPoint = null;
                    //???????????????????????????
                    if (textPoints.length == 1) {
                        if (showChanged) {
                            fristPoint = [line[line.length - 2], line[line.length - 1]];
                        } else {
                            fristPoint = [line[0], line[1]];
                        }
                    } else {
                        fristPoint = textPoints[textPoints.length - 2][0];
                    }
                    secondPoint = textPoints[textPoints.length - 1][0];
                    var angle = textPoints[textPoints.length - 1][1];

                    var len = textPoints.length;
                    for (var _i22 = 1; _i22 < label.length - len + 1; _i22++) {
                        var p = this.getPoint(fristPoint, secondPoint, gap * _i22);
                        var textPoint = [p, angle];
                        textPoints.push(textPoint);
                    }
                };

                /**
                 * ??????feature
                 *  Parameters :
                 *  feature - ?????????????????????
                 */


                GCutLine.cloneFeature = function cloneFeature(feature) {
                    return { type: feature.type, datas: feature.datas, sourceData: feature.sourceData, label: feature.label, roadCodeLabel: feature.roadCodeLabel,
                        attributeId: feature.attributeId, style: feature.style, textures: feature.textures, xyz: feature.xyz,
                        lineType: feature.lineType, weight: feature.weight, attributes: feature.attributes };
                };

                /**
                 *  ???????????????????????????
                 *  Parameters :
                 *  line - ???????????????
                 *  textPoints - ????????????????????????????????????
                 *  gaps - ?????????????????????????????????
                 *  index - ????????????????????????????????????line?????????index????????????
                 */


                GCutLine.changeDirection = function changeDirection(line, textPoints, gaps, index, endLength) {
                    //???????????????????????????
                    index = index >= line.length ? line.length : index;
                    var textLine = line.slice(0, index);
                    var linePoint = [];
                    for (var _i23 = 0; _i23 < textLine.length - 1; _i23++) {
                        linePoint.push([textLine[_i23], textLine[_i23 + 1]]);
                        _i23++;
                    }
                    linePoint = linePoint.reverse();

                    var lastPoint = textPoints[endLength][0];
                    textLine = [lastPoint[0], lastPoint[1]];
                    for (var _j8 = 0; _j8 < linePoint.length; _j8++) {
                        textLine.push(linePoint[_j8][0]);
                        textLine.push(linePoint[_j8][1]);
                    }
                    var d = new GDistance();
                    textPoints = d.getNodePath(textLine, gaps).pointList;
                    return textPoints;
                };

                /**
                 * ??????????????????????????????
                 *  Parameters :
                 *  p1 - ????????????
                 *  p2 -???????????????
                 *  angle - ???????????????x????????????
                 */


                GCutLine.isChangeDirection = function isChangeDirection(label, p1, p2, angle) {
                    var showChange = false;
                    //????????????????????????
                    if (/.*[\u4e00-\u9fa5]+.*$/.test(label)) {
                        //??????????????????
                        if (p1[0] == p2[0]) {
                            if (p1[1] > p2[1]) {
                                showChange = true;
                                return showChange;
                            }
                        }

                        //????????????????????????????????????x??????????????????45???
                        if (angle < -45 && angle > -90) {
                            if (p1[0] < p2[0]) {
                                showChange = true;
                            }
                        } else {
                            if (p1[0] > p2[0]) {
                                showChange = true;
                            }
                        }
                    } else {
                        if (p1[0] > p2[0]) {
                            showChange = true;
                        }
                    }
                    return showChange;
                };

                /**
                 * ????????????????????????
                 */


                GCutLine.getDistance = function getDistance(p1, p2) {
                    var calX = p2[0] - p1[0];
                    var calY = p2[1] - p1[1];
                    return Math.pow(calX * calX + calY * calY, 0.5);
                };

                /**
                 * ??????????????????
                 */


                GCutLine.getLineDistance = function getLineDistance(line) {
                    if (line.length < 4) {
                        return 0;
                    }

                    var dis = 0;
                    for (var _i24 = 0; _i24 < line.length / 2 - 1; _i24++) {
                        var p1 = [line[2 * _i24], line[2 * _i24 + 1]];
                        var p2 = [line[2 * (_i24 + 1)], line[2 * (_i24 + 1) + 1]];
                        dis = dis + this.getDistance(p1, p2);
                    }
                    return dis;
                };

                /**
                 * ????????????????????????????????????????????????????????????
                 */


                GCutLine.getPoint = function getPoint(p1, p2, d) {
                    var xab = p2[0] - p1[0];
                    var yab = p2[1] - p1[1];
                    var xd = p2[0];
                    var yd = p2[1];
                    if (xab == 0) {
                        if (yab > 0) {
                            yd = p2[1] + d;
                        } else {
                            yd = p2[1] - d;
                        }
                    } else {
                        var xbd = Math.sqrt(d * d / (yab / xab * (yab / xab) + 1));
                        if (xab < 0) {
                            xbd = -xbd;
                        }

                        xd = p2[0] + xbd;
                        yd = p2[1] + yab / xab * xbd;
                    }
                    return [xd, yd];
                };

                return GCutLine;
            }();

            module.exports = GCutLine;
        }, { "./GDistance": 15, "./Util": 19 }], 15: [function (require, module, exports) {
            /**
             * Created by matt on 2017/3/5.
             */
            var GDistance = function () {
                function GDistance() {
                    _classCallCheck(this, GDistance);
                }

                GDistance.prototype.getLengthPoint = function getLengthPoint(fromX, fromY, toX, toY, len, index) {
                    var dx = toX - fromX;
                    var dy = toY - fromY;
                    var x_new = void 0;
                    var y_new = void 0;
                    if (dx == 0) {
                        x_new = toX;
                        if (dy > 0) {
                            y_new = fromY + len;
                        } else {
                            y_new = fromY - len;
                        }
                        if (index == null) {
                            return [x_new, y_new];
                        } else {
                            return [x_new, y_new, index];
                        }
                    }

                    var tan = dy / dx;
                    var sec = Math.sqrt(tan * tan + 1);
                    var dx_new = Math.abs(len / sec);
                    var dy_new = Math.abs(dx_new * tan);
                    if (dx > 0) {
                        x_new = fromX + dx_new;
                    } else {
                        x_new = fromX - dx_new;
                    }
                    if (dy > 0) {
                        y_new = fromY + dy_new;
                    } else {
                        y_new = fromY - dy_new;
                    }
                    if (index == null) {
                        return [x_new, y_new];
                    } else {
                        return [x_new, y_new, index];
                    }
                };

                GDistance.prototype.getAngle = function getAngle(p1, p2) {
                    if (p2[0] - p1[0] == 0) {
                        if (p2[1] > p1[0]) {
                            return 90;
                        } else {
                            return -90;
                        }
                    }
                    var k = (p2[1] - p1[1]) / (p2[0] - p1[0]);
                    var angle = 360 * Math.atan(k) / (2 * Math.PI);
                    return angle;
                };

                GDistance.prototype.length = function length(x0, y0, x1, y1) {
                    var dx = x1 - x0;
                    var dy = y1 - y0;
                    var len = Math.sqrt(dx * dx + dy * dy);
                    return len;
                };

                GDistance.prototype.getNodePath = function getNodePath(coords, interval) {
                    var previous = [];
                    var points = {};
                    var pointList = [];
                    var intervalLength = interval.length;

                    //???????????????????????????????????????
                    var fun_getInterval = function fun_getInterval(interval) {
                        var value = interval[0];
                        interval.splice(0, 1);
                        return value;
                    };
                    var markLength = fun_getInterval(interval);
                    var index = 0;
                    while (true) {
                        if (pointList.length == intervalLength) {
                            points.index = index;
                            points.pointList = pointList;
                            return points;
                        }
                        if (index >= coords.length) {
                            points.index = index;
                            points.pointList = pointList;
                            return points;
                        }
                        var x = coords[index];
                        var y = coords[index + 1];
                        //?????????????????????????????????
                        if (previous.length == 0) {
                            //????????????????????????????????? ??????????????????
                            previous[0] = x;
                            previous[1] = y;
                            continue;
                        } else {

                            //??????????????????????????????????????????????????????????????????
                            var lengthPath = this.length(previous[0], previous[1], x, y);
                            //????????????????????????

                            if (lengthPath >= markLength) {
                                //????????????????????????????????????????????????????????????????????????
                                var savePoint = this.getLengthPoint(previous[0], previous[1], x, y, markLength, null);
                                var angle = this.getAngle(previous, [x, y]);

                                if (angle == 90) {
                                    angle = 0;
                                }
                                if (angle == -90) {
                                    angle = 0;
                                }
                                if (angle == 0) {
                                    angle = 0.5;
                                }

                                //??????????????????????????????
                                if (angle >= 45) {
                                    angle = angle - 90;
                                } else {
                                    if (angle <= -45) {
                                        angle = angle + 90;
                                    }
                                }

                                var pointAngle = [savePoint, angle];
                                pointList.push(pointAngle);
                                previous[0] = savePoint[0];
                                previous[1] = savePoint[1];
                                markLength = fun_getInterval(interval);
                            } else {
                                markLength = markLength - lengthPath;

                                previous[0] = x;
                                previous[1] = y;
                                index = index + 2;
                            }
                        }
                    }

                    points.index = index;
                    points.pointList = pointList;
                    return points;
                };

                return GDistance;
            }();

            module.exports = GDistance;
        }, {}], 16: [function (require, module, exports) {
            /**
             * Created by kongjian on 2017/6/26.
             * ??????????????????????????????
             */
            var BoxSet = require('../../../utils/gistools/BoxSet');
            var _boxSet512 = new BoxSet(0, 512, 0, 512, 512, 5);
            var _boxSet256 = new BoxSet(0, 256, 0, 256, 256, 5);

            var GisTools = require('../../../utils/gistools/GisTools');
            var Util = require('./Util');

            var GDrawGeomerty = function () {
                function GDrawGeomerty() {
                    _classCallCheck(this, GDrawGeomerty);
                }

                /**
                 * ?????????
                 * Parameters:
                 * features - ?????????????????????????????????????????????????????????????????????
                 */
                GDrawGeomerty.draw = function draw(ctx, features, ratio, checkDraw, isChangeFont, hitCtx, hitDetection) {
                    var drewMap = null;
                    if (checkDraw) {
                        drewMap = new Map();
                    }

                    for (var _i25 = 0; _i25 < features.length; _i25++) {
                        var feature = features[_i25];
                        //????????????
                        if (feature.type == 1) {
                            this.drawPointIcon(ctx, feature, ratio, drewMap, hitCtx, hitDetection);
                            this.drawPoint(ctx, feature, ratio, drewMap, isChangeFont, hitCtx, hitDetection);
                            continue;
                        }
                        //????????????
                        if (feature.type == 2) {
                            this.drawLine(ctx, feature, ratio, drewMap, isChangeFont, hitCtx, hitDetection);
                        }
                    }
                    drewMap = null;
                };

                /**
                 * ??????????????????
                 * Parameters:
                 *  ctx - ????????????
                 *  hitCtx - ?????????box???????????????
                 * hitDetection - ?????????????????????box
                 * feature - ?????????????????????????????????????????????????????????????????????
                 */
                GDrawGeomerty.drawPointIcon = function drawPointIcon(ctx, feature, ratio, drewMap, hitCtx, hitDetection) {
                    var style = feature.style;
                    if (!style.texture) {
                        return;
                    }

                    var width = style.graphicWidth;
                    var height = style.graphicHeight;

                    var img = feature.iconImg;
                    if (!img) {
                        return;
                    }

                    if (!width || !height) {
                        width = img.width;
                        height = img.height;
                        if (drewMap) {
                            width = width / ratio;
                            height = height / ratio;
                        }
                    }

                    var xOffset = style.graphicXOffset - 0.5 * width;
                    var yOffset = style.graphicYOffset - 0.5 * height;

                    var pointOffsetX = style.pointOffsetX;
                    var pointOffsetY = style.pointOffsetY;
                    if (!pointOffsetX) {
                        pointOffsetX = 0;
                    }
                    if (!pointOffsetY) {
                        pointOffsetY = 0;
                    }
                    //??????????????????box,????????????
                    var point = [feature.datas[0][0][0], feature.datas[0][0][1]];
                    point[0] = point[0] + pointOffsetX;
                    point[1] = point[1] + pointOffsetY;

                    var x = point[0] + xOffset;
                    var y = point[1] + yOffset;
                    var opacity = style.pointFillAlpha || 1;

                    // ???????????????
                    if (drewMap) {
                        var drewMark = style.texture + "_" + x + "_" + y;
                        if (drewMap.get(drewMark) == null) {
                            drewMap.set(drewMark, true);
                        } else {
                            return;
                        }
                    }

                    ctx.save();
                    ctx.globalAlpha = opacity;
                    ctx.drawImage(img, x * ratio, y * ratio, width * ratio, height * ratio);
                    ctx.restore();

                    //????????????????????????
                    if (hitDetection) {
                        hitCtx.save();
                        this.setHitContextStyle(hitCtx, feature.id);
                        hitCtx.fillRect(x, y, width, height);
                        hitCtx.restore();
                    }
                };

                /**
                 * ????????????
                 * Parameters:
                 *  ctx - ????????????
                 *  hitCtx - ?????????box???????????????
                 * hitDetection - ?????????????????????box
                 * feature - ?????????????????????????????????????????????????????????????????????
                 */


                GDrawGeomerty.drawPoint = function drawPoint(ctx, feature, ratio, drewMap, isChangeFont, hitCtx, hitDetection) {
                    if (!feature.label) {
                        return;
                    }

                    var style = feature.style;
                    //???????????????????????????
                    var pt = style.textPoint;
                    if (drewMap) {
                        //????????????????????????????????????????????????????????????
                        var polyIn = GisTools.boxToPolyArr(feature.box[0], feature.box[1], feature.box[2], feature.box[3]);
                        var polyOut = void 0;
                        if (ctx.canvas.width / ratio == 512) {
                            polyOut = GisTools.boxToPolyArr(-20, -20, 532, 532);
                        } else if (ctx.canvas.width / ratio == 256) {
                            polyOut = GisTools.boxToPolyArr(-15, -15, 271, 271);
                        }
                        if (GisTools.polyWith(polyOut, polyIn) == 3) {
                            return;
                        }

                        var drewKey = feature.label + "_" + pt[0] + "_" + pt[1];
                        if (drewMap.get(drewKey) == null) {
                            drewMap.set(drewKey, true);
                        } else {
                            return;
                        }
                    }

                    var labelRows = feature.label.split(' ');
                    var numRows = labelRows.length;
                    var lineHeight = style.pointHeight;
                    lineHeight = lineHeight + 2;

                    var pointFillFont = Util.formatFont(style.pointFillFont, ratio, isChangeFont);
                    var pointStrokeFont = Util.formatFont(style.pointStrokeFont, ratio, isChangeFont);

                    if (style.pointHashBackground == true) {
                        ctx.save();
                        ctx.globalAlpha = style.pointBackgroundAlpha;
                        ctx.strokeStyle = style.pointBackgroundLineColor;
                        ctx.lineWidth = style.pointBackgroundLineWidth;
                        ctx.fillStyle = style.pointBackgroundColor;
                        ctx.font = style.pointFillFont;
                        var rectX = pt[0] - style.pointBackgroundGap;
                        var rectY = pt[1] - style.pointBackgroundGap - style.pointHeight / 2;

                        var maxWidth = 0;
                        for (var _i26 = 0; _i26 < numRows; _i26++) {
                            var itemWdith = ctx.measureText(labelRows[_i26]).width;
                            if (itemWdith > maxWidth) {
                                maxWidth = itemWdith;
                            }
                        }
                        this.drawRoundRect(ctx, rectX, rectY, maxWidth + style.pointBackgroundGap * 2, style.pointHeight * numRows + style.pointBackgroundGap * 2 + (numRows - 1) * 2, style.pointBackgroundRadius, ratio);
                        ctx.fill();
                        ctx.restore();

                        for (var _j9 = 0; _j9 < numRows; _j9++) {
                            if (style.pointHashOutline == true) {
                                ctx.save();
                                ctx.textBaseline = "middle";
                                ctx.globalAlpha = style.pointStrokeAlpha;
                                ctx.strokeStyle = style.pointStrokeStyle;
                                ctx.lineWidth = style.pointLineWidth;
                                ctx.font = pointStrokeFont;
                                ctx.strokeText(labelRows[_j9], pt[0] * ratio, (pt[1] + lineHeight * _j9) * ratio);
                                ctx.restore();
                            }

                            ctx.save();
                            ctx.textBaseline = "middle";
                            ctx.globalAlpha = style.pointFillAlpha;
                            ctx.fillStyle = style.pointFillStyle;
                            ctx.font = pointFillFont;
                            ctx.fillText(labelRows[_j9], pt[0] * ratio, (pt[1] + lineHeight * _j9) * ratio);
                            ctx.restore();
                        }

                        //????????????????????????
                        if (hitDetection) {
                            hitCtx.save();
                            this.setHitContextStyle(hitCtx, feature.id);
                            this.drawHitRoundRect(hitCtx, rectX, rectY, maxWidth + style.pointBackgroundGap * 2, style.pointHeight + style.pointBackgroundGap * 2, style.pointBackgroundRadius);
                            hitCtx.fill();
                            hitCtx.restore();
                        }
                    } else {
                        var _maxWidth = 0;
                        for (var _i27 = 0; _i27 < numRows; _i27++) {
                            if (style.pointHashOutline == true) {
                                ctx.save();
                                ctx.textBaseline = "middle";
                                ctx.globalAlpha = style.pointStrokeAlpha;
                                ctx.strokeStyle = style.pointStrokeStyle;
                                ctx.lineWidth = style.pointLineWidth;
                                ctx.font = pointStrokeFont;
                                ctx.strokeText(labelRows[_i27], pt[0] * ratio, (pt[1] + lineHeight * _i27) * ratio);
                                ctx.restore();
                            }

                            ctx.save();
                            ctx.textBaseline = "middle";
                            ctx.globalAlpha = style.pointFillAlpha;
                            ctx.fillStyle = style.pointFillStyle;
                            ctx.font = pointFillFont;
                            ctx.fillText(labelRows[_i27], pt[0] * ratio, (pt[1] + lineHeight * _i27) * ratio);
                            _maxWidth = ctx.measureText(labelRows[_i27]).width > _maxWidth ? ctx.measureText(labelRows[_i27]).width : _maxWidth;
                            ctx.restore();
                        }

                        //????????????????????????
                        if (hitDetection) {
                            hitCtx.save();
                            this.setHitContextStyle(hitCtx, feature.id);
                            hitCtx.textBaseline = "middle";
                            hitCtx.fillRect(pt[0], pt[1] - style.pointHeight / 2, _maxWidth, lineHeight * numRows);
                            hitCtx.restore();
                        }
                    }
                };

                /**
                 * ????????????
                 * Parameters:
                 *  ctx - ????????????
                 * hitCtx - ?????????box???????????????
                 * hitDetection - ?????????????????????box
                 * feature - ?????????????????????????????????????????????????????????????????????
                 */


                GDrawGeomerty.drawLine = function drawLine(ctx, feature, ratio, drewMap, isChangeFont, hitCtx, hitDetection) {

                    if (feature.lineType == 'text') {
                        this.drawLineText(ctx, feature, ratio, drewMap, isChangeFont, hitCtx, hitDetection);
                    }

                    if (feature.lineType == 'code') {
                        this.drawLineCode(ctx, feature, ratio, drewMap, isChangeFont, hitCtx, hitDetection);
                    }

                    if (feature.lineType == 'arrow') {
                        this.drawLineArrow(ctx, feature, ratio, drewMap, hitCtx, hitDetection);
                    }
                };

                /**
                 * ??????????????????
                 * Parameters:
                 *  ctx - ????????????
                 * hitCtx - ?????????box???????????????
                 * hitDetection - ?????????????????????box
                 * feature - ?????????????????????????????????????????????????????????????????????
                 */


                GDrawGeomerty.drawLineText = function drawLineText(ctx, feature, ratio, drewMap, isChangeFont, hitCtx, hitDetection) {
                    var style = feature.style;
                    var label = feature.label;
                    var textPoints = feature.textPoints;

                    var lineBoxSet = void 0;
                    if (drewMap) {
                        // ?????????512 ?????????boxset 512
                        if (ctx.canvas.width / ratio == 512) {
                            lineBoxSet = _boxSet512;
                        } else if (ctx.canvas.width / ratio == 256) {
                            lineBoxSet = _boxSet256;
                        }
                    }

                    var lineFillFont = Util.formatFont(style.lineFillFont, ratio, isChangeFont);
                    var lineStrokeFont = Util.formatFont(style.lineStrokeFont, ratio, isChangeFont);

                    //?????????????????????
                    //????????????????????????????????????????????????
                    if (style.lineHashBackground == true || textPoints.length == 1) {
                        var index = Math.floor(textPoints.length / 2);
                        var localPoint = textPoints[index][0];
                        if (textPoints.length == 1) {
                            this.drawBgText(ctx, label, ratio, localPoint, style.backgroundAlpha, style.backgroundLineColor, style.backgroundLineWidth, style.backgroundColor, style.lineFillFont, style.lineBackgroundGap, style.lineHeight, style.lineBackgroundRadius, style.lineHashOutline, style.lineStrokeAlpha, style.lineStrokeStyle, style.lineLineWidth, style.lineStrokeFont, style.lineFillAlpha, style.lineFillStyle, hitCtx, hitDetection, feature.id, false, isChangeFont);
                        } else {
                            this.drawBgText(ctx, label, ratio, localPoint, style.backgroundAlpha, style.backgroundLineColor, style.backgroundLineWidth, style.backgroundColor, style.lineFillFont, style.lineBackgroundGap, style.lineHeight, style.lineBackgroundRadius, style.lineHashOutline, style.lineStrokeAlpha, style.lineStrokeStyle, style.lineLineWidth, style.lineStrokeFont, style.lineFillAlpha, style.lineFillStyle, hitCtx, hitDetection, feature.id, true, isChangeFont);
                        }
                    } else {
                        //?????????????????????
                        for (var _j10 = 0; _j10 < label.length; _j10++) {
                            var pa = textPoints[_j10];
                            var angle = pa[1];
                            var point = pa[0];
                            var labelChar = label.charAt(_j10);

                            if (drewMap) {
                                var drewKey = labelChar + "_" + point[0] + "_" + point[1] + "_" + angle;
                                if (drewMap.get(drewKey) != null) {
                                    continue;
                                }
                                drewMap.set(drewKey, true);
                                if (!lineBoxSet.in([point[0] / ratio, point[1] / ratio])) {
                                    continue;
                                }
                            }

                            if (style.lineHashOutline == true) {
                                ctx.save();
                                ctx.textAlign = "center";
                                ctx.textBaseline = "middle";
                                ctx.globalAlpha = style.lineStrokeAlpha;
                                ctx.strokeStyle = style.lineStrokeStyle;
                                ctx.lineWidth = style.lineLineWidth;
                                ctx.font = lineStrokeFont;
                                ctx.translate(point[0] * ratio, point[1] * ratio);
                                ctx.rotate(angle * Math.PI / 180);
                                ctx.strokeText(labelChar, 0, 0);
                                ctx.restore();
                            }

                            ctx.save();
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";
                            ctx.globalAlpha = style.lineFillAlpha;
                            ctx.fillStyle = style.lineFillStyle;
                            ctx.font = lineFillFont;
                            ctx.translate(point[0] * ratio, point[1] * ratio);
                            ctx.rotate(angle * Math.PI / 180);
                            ctx.fillText(labelChar, 0, 0);
                            ctx.restore();

                            //????????????????????????
                            if (hitDetection) {
                                hitCtx.save();
                                this.setHitContextStyle(hitCtx, feature.id);
                                hitCtx.translate(point[0], point[1]);
                                hitCtx.rotate(angle * Math.PI / 180);
                                hitCtx.fillRect(-style.lineHeight * 1.2 * 0.5, -style.lineHeight * 1.2 * 0.5, style.lineHeight * 1.2, style.lineHeight * 1.2);
                                hitCtx.restore();
                            }
                        }
                    }
                };

                /**
                 * ??????????????????
                 * Parameters:
                 *  ctx - ????????????
                 * hitCtx - ?????????box???????????????
                 * hitDetection - ?????????????????????box
                 * feature - ?????????????????????????????????????????????????????????????????????
                 */


                GDrawGeomerty.drawLineCode = function drawLineCode(ctx, feature, ratio, drewMap, isChangeFont, hitCtx, hitDetection) {
                    var style = feature.style;
                    var localPoint = feature.codePoint;
                    var codeLabel = feature.label;

                    if (style.showRoadCode == true && codeLabel && codeLabel.length > 0) {
                        this.drawBgText(ctx, codeLabel, ratio, localPoint, style.codeBackgroundAlpha, style.codeBackgroundLineColor, style.codeBackgroundLineWidth, style.codeBackgroundColor, style.codeLineFillFont, style.codeLineBackgroundGap, style.codeLineHeight, style.codeLineBackgroundRadius, style.codeLineHashOutline, style.codeLineStrokeAlpha, style.codeLineStrokeStyle, style.codeLineLineWidth, style.codeLineStrokeFont, style.codeLineFillAlpha, style.codeLineFillStyle, hitCtx, hitDetection, feature.id, true, isChangeFont);
                    }
                };

                /**
                 * ????????????
                 * Parameters:
                 *  ctx - ????????????
                 * hitCtx - ?????????box???????????????
                 * hitDetection - ?????????????????????box
                 * feature - ?????????????????????????????????????????????????????????????????????
                 */


                GDrawGeomerty.drawLineArrow = function drawLineArrow(ctx, feature, ratio, drewMap, hitCtx, hitDetection) {
                    var points = feature.arrowPoint;
                    var style = feature.style;
                    var p1 = points[0][0];
                    var p2 = points[1][0];
                    ctx.save();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "#666666";
                    ctx.fillStyle = "#666666";
                    //??????
                    ctx.beginPath();
                    ctx.moveTo(p1[0] * ratio, p1[1] * ratio);
                    ctx.lineTo(p2[0] * ratio, p2[1] * ratio);
                    ctx.stroke();
                    //?????????
                    if (style.arrowDirectionValue == 0) {
                        var startRadians = Math.atan((p2[1] - p1[1]) / (p2[0] - p1[0]));
                        startRadians += (p2[0] > p1[0] ? -90 : 90) * Math.PI / 180;
                        this.drawArrowhead(ctx, p1[0], p1[1], startRadians, ratio);
                    } else {
                        var _startRadians = Math.atan((p2[1] - p1[1]) / (p2[0] - p1[0]));
                        _startRadians += (p2[0] > p1[0] ? 90 : -90) * Math.PI / 180;
                        this.drawArrowhead(ctx, p2[0], p2[1], _startRadians, ratio);
                    }
                    ctx.restore();
                };

                /**
                 * ???????????????
                 * Parameters:
                 */


                GDrawGeomerty.drawArrowhead = function drawArrowhead(ctx, x, y, radians, ratio) {
                    ctx.beginPath();
                    ctx.translate(x * ratio, y * ratio);
                    ctx.rotate(radians);
                    ctx.moveTo(0, 0);
                    ctx.lineTo(3 * ratio, 6 * ratio);
                    ctx.lineTo(0, 5);
                    ctx.lineTo(-3 * ratio, 6 * ratio);
                    ctx.closePath();
                    ctx.fill();
                };

                /**
                 * ???????????????
                 */


                GDrawGeomerty.drawRoundRect = function drawRoundRect(ctx, x, y, width, height, radius, ratio) {
                    ctx.beginPath();
                    ctx.arc((x + radius) * ratio, (y + radius) * ratio, radius * ratio, Math.PI, Math.PI * 3 / 2);
                    ctx.lineTo((width - radius + x) * ratio, y * ratio);
                    ctx.arc((width - radius + x) * ratio, (radius + y) * ratio, radius * ratio, Math.PI * 3 / 2, Math.PI * 2);
                    ctx.lineTo((width + x) * ratio, (height + y - radius) * ratio);
                    ctx.arc((width - radius + x) * ratio, (height - radius + y) * ratio, radius * ratio, 0, Math.PI * 1 / 2);
                    ctx.lineTo((radius + x) * ratio, (height + y) * ratio);
                    ctx.arc((radius + x) * ratio, (height - radius + y) * ratio, radius * ratio, Math.PI * 1 / 2, Math.PI);
                    ctx.closePath();
                };

                /**
                 * ???????????????????????????
                 */


                GDrawGeomerty.drawBgText = function drawBgText(ctx, label, ratio, localPoint, backgroundAlpha, backgroundLineColor, backgroundLineWidth, backgroundColor, lineFillFont, lineBackgroundGap, lineHeight, lineBackgroundRadius, lineHashOutline, lineStrokeAlpha, lineStrokeStyle, lineLineWidth, lineStrokeFont, lineFillAlpha, lineFillStyle, hitCtx, hitDetection, featureId, isDrawbg, isChangeFont) {
                    ctx.save();
                    ctx.globalAlpha = backgroundAlpha;
                    ctx.strokeStyle = backgroundLineColor;
                    ctx.lineWidth = backgroundLineWidth;
                    ctx.fillStyle = backgroundColor;
                    ctx.font = Util.formatFont(lineFillFont, 1, isChangeFont);
                    var w = ctx.measureText(label).width;
                    var rectX = localPoint[0] - w / 2 - lineBackgroundGap;
                    var rectY = localPoint[1] - lineHeight / 2 - lineBackgroundGap;
                    if (isDrawbg) {
                        this.drawRoundRect(ctx, rectX, rectY, w + lineBackgroundGap * 2, lineHeight + lineBackgroundGap * 2, lineBackgroundRadius, ratio);
                        ctx.fill();
                    }
                    ctx.restore();

                    lineFillFont = Util.formatFont(lineFillFont, ratio, isChangeFont);
                    lineStrokeFont = Util.formatFont(lineStrokeFont, ratio, isChangeFont);
                    if (lineHashOutline == true) {
                        ctx.save();
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.globalAlpha = lineStrokeAlpha;
                        ctx.strokeStyle = lineStrokeStyle;
                        ctx.lineWidth = lineLineWidth;
                        ctx.font = lineStrokeFont;
                        ctx.translate(localPoint[0] * ratio, localPoint[1] * ratio);
                        ctx.strokeText(label, 0, 0);
                        ctx.restore();
                    }

                    ctx.save();
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.globalAlpha = lineFillAlpha;
                    ctx.fillStyle = lineFillStyle;
                    ctx.font = lineFillFont;
                    ctx.translate(localPoint[0] * ratio, localPoint[1] * ratio);
                    ctx.fillText(label, 0, 0);
                    ctx.restore();

                    //????????????????????????
                    if (hitDetection) {
                        hitCtx.save();
                        this.setHitContextStyle(hitCtx, featureId);
                        this.drawHitRoundRect(hitCtx, rectX, rectY, w + lineBackgroundGap * 2, lineHeight + lineBackgroundGap * 2, lineBackgroundRadius);
                        hitCtx.fill();
                        hitCtx.restore();
                    }
                };

                /**
                 * ??????featureId???????????????
                 */


                GDrawGeomerty.featureIdToHex = function featureIdToHex(featureId) {
                    var id = Number(featureId) + 1;
                    var hex = "000000" + id.toString(16);
                    var len = hex.length;
                    hex = "#" + hex.substring(len - 6, len);
                    return hex;
                };

                GDrawGeomerty.setHitContextStyle = function setHitContextStyle(hitCtx, featureId) {
                    var hex = this.featureIdToHex(featureId);
                    hitCtx.globalAlpha = 1;
                    hitCtx.fillStyle = hex;
                };

                /**
                 * ?????????????????????
                 */


                GDrawGeomerty.drawHitRoundRect = function drawHitRoundRect(hitCtx, x, y, width, height, radius) {
                    hitCtx.beginPath();
                    hitCtx.arc(x + radius, y + radius, radius, Math.PI, Math.PI * 3 / 2);
                    hitCtx.lineTo(width - radius + x, y);
                    hitCtx.arc(width - radius + x, radius + y, radius, Math.PI * 3 / 2, Math.PI * 2);
                    hitCtx.lineTo(width + x, height + y - radius);
                    hitCtx.arc(width - radius + x, height - radius + y, radius, 0, Math.PI * 1 / 2);
                    hitCtx.lineTo(radius + x, height + y);
                    hitCtx.arc(radius + x, height - radius + y, radius, Math.PI * 1 / 2, Math.PI);
                    hitCtx.closePath();
                };

                return GDrawGeomerty;
            }();

            module.exports = GDrawGeomerty;
        }, { "../../../utils/gistools/BoxSet": 34, "../../../utils/gistools/GisTools": 35, "./Util": 19 }], 17: [function (require, module, exports) {

            module.exports = GGridIndex;
            var NUM_PARAMS = 3;
            function GGridIndex(extent, n, padding) {
                var cells = this.cells = [];

                if (extent instanceof ArrayBuffer) {
                    this.arrayBuffer = extent;
                    var array = new Int32Array(this.arrayBuffer);
                    extent = array[0];
                    n = array[1];
                    padding = array[2];

                    this.d = n + 2 * padding;
                    for (var k = 0; k < this.d * this.d; k++) {
                        var start = array[NUM_PARAMS + k];
                        var end = array[NUM_PARAMS + k + 1];
                        cells.push(start === end ? null : array.subarray(start, end));
                    }
                    var keysOffset = array[NUM_PARAMS + cells.length];
                    var bboxesOffset = array[NUM_PARAMS + cells.length + 1];
                    this.keys = array.subarray(keysOffset, bboxesOffset);
                    this.bboxes = array.subarray(bboxesOffset);

                    this.insert = this._insertReadonly;
                } else {
                    this.d = n + 2 * padding;
                    for (var i = 0; i < this.d * this.d; i++) {
                        cells.push([]);
                    }
                    this.keys = [];
                    this.bboxes = [];
                }

                this.n = n;
                this.extent = extent;
                this.padding = padding;
                this.scale = n / extent;
                this.uid = 0;

                var p = padding / n * extent;
                this.min = -p;
                this.max = extent + p;
            }

            GGridIndex.prototype.insert = function (key, x1, y1, x2, y2) {
                this._forEachCell(x1, y1, x2, y2, this._insertCell, this.uid++);
                this.keys.push(key);
                this.bboxes.push(x1);
                this.bboxes.push(y1);
                this.bboxes.push(x2);
                this.bboxes.push(y2);
            };

            GGridIndex.prototype._insertReadonly = function () {
                throw 'Cannot insert into a GridIndex created from an ArrayBuffer.';
            };

            GGridIndex.prototype._insertCell = function (x1, y1, x2, y2, cellIndex, uid) {
                this.cells[cellIndex].push(uid);
            };

            GGridIndex.prototype.query = function (x1, y1, x2, y2) {
                var min = this.min;
                var max = this.max;
                if (x1 <= min && y1 <= min && max <= x2 && max <= y2) {
                    // We use `Array#slice` because `this.keys` may be a `Int32Array` and
                    // some browsers (Safari and IE) do not support `TypedArray#slice`
                    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/slice#Browser_compatibility
                    return Array.prototype.slice.call(this.keys);
                } else {
                    var result = [];
                    var seenUids = {};
                    this._forEachCell(x1, y1, x2, y2, this._queryCell, result, seenUids);
                    return result;
                }
            };

            GGridIndex.prototype._queryCell = function (x1, y1, x2, y2, cellIndex, result, seenUids) {
                var cell = this.cells[cellIndex];
                if (cell !== null) {
                    var keys = this.keys;
                    var bboxes = this.bboxes;
                    for (var u = 0; u < cell.length; u++) {
                        var uid = cell[u];
                        if (seenUids[uid] === undefined) {
                            var offset = uid * 4;
                            if (x1 <= bboxes[offset + 2] && y1 <= bboxes[offset + 3] && x2 >= bboxes[offset + 0] && y2 >= bboxes[offset + 1]) {
                                seenUids[uid] = true;
                                result.push(keys[uid]);
                            } else {
                                seenUids[uid] = false;
                            }
                        }
                    }
                }
            };

            GGridIndex.prototype._forEachCell = function (x1, y1, x2, y2, fn, arg1, arg2) {
                var cx1 = this._convertToCellCoord(x1);
                var cy1 = this._convertToCellCoord(y1);
                var cx2 = this._convertToCellCoord(x2);
                var cy2 = this._convertToCellCoord(y2);
                for (var x = cx1; x <= cx2; x++) {
                    for (var y = cy1; y <= cy2; y++) {
                        var cellIndex = this.d * y + x;
                        if (fn.call(this, x1, y1, x2, y2, cellIndex, arg1, arg2)) return;
                    }
                }
            };

            GGridIndex.prototype._convertToCellCoord = function (x) {
                return Math.max(0, Math.min(this.d - 1, Math.floor(x * this.scale) + this.padding));
            };

            GGridIndex.prototype.toArrayBuffer = function () {
                if (this.arrayBuffer) return this.arrayBuffer;

                var cells = this.cells;

                var metadataLength = NUM_PARAMS + this.cells.length + 1 + 1;
                var totalCellLength = 0;
                for (var i = 0; i < this.cells.length; i++) {
                    totalCellLength += this.cells[i].length;
                }

                var array = new Int32Array(metadataLength + totalCellLength + this.keys.length + this.bboxes.length);
                array[0] = this.extent;
                array[1] = this.n;
                array[2] = this.padding;

                var offset = metadataLength;
                for (var k = 0; k < cells.length; k++) {
                    var cell = cells[k];
                    array[NUM_PARAMS + k] = offset;
                    array.set(cell, offset);
                    offset += cell.length;
                }

                array[NUM_PARAMS + cells.length] = offset;
                array.set(this.keys, offset);
                offset += this.keys.length;

                array[NUM_PARAMS + cells.length + 1] = offset;
                array.set(this.bboxes, offset);
                offset += this.bboxes.length;

                return array.buffer;
            };
        }, {}], 18: [function (require, module, exports) {
            /**
             * Class: GLabelBox
             *  ??????????????????box???
             *
             * Inherits:
             *  - <Object>
             */
            var Util = require('./Util');

            var GLabelBox = function () {
                function GLabelBox(ctx, formatFont) {
                    _classCallCheck(this, GLabelBox);

                    this.boxDistance = 0;
                    this.ctx = ctx;
                    this.formatFont = formatFont;
                }

                GLabelBox.prototype.setBox = function setBox(features, isSource) {
                    features.forEach(function (f, index) {
                        f.hidden = false;
                        //?????????????????????
                        f.label = Util.formatLabel(f.label);

                        //?????????????????????,???????????????
                        if (f.style.show == false) {
                            f.hidden = true;
                            return;
                        }
                        if (f.type == 1) {
                            //???????????????
                            if (isSource) {
                                this.setPointBox(f, f.sourceAngleData, this.ctx);
                            } else {
                                this.setPointBox(f, f.datas, this.ctx);
                            }
                        }
                        if (f.type == 2) {
                            //????????????????????????
                            if (f.lineType == 'text') {
                                if (isSource) {
                                    this.setTextLineBox(f, f.sourceAngleData, this.ctx);
                                } else {
                                    this.setTextLineBox(f, f.datas, this.ctx);
                                }
                            }

                            //????????????????????????
                            if (f.lineType == 'code') {
                                if (isSource) {
                                    this.setCodeLineBox(f, f.sourceAngleData, this.ctx);
                                } else {
                                    this.setCodeLineBox(f, f.datas, this.ctx);
                                }
                            }

                            //????????????????????????
                            if (f.lineType == 'arrow') {
                                if (isSource) {
                                    this.setArrowLineBox(f, f.sourceAngleData);
                                } else {
                                    this.setArrowLineBox(f, f.datas);
                                }
                            }
                        }
                    }.bind(this));
                    return this.filterFeature(features);
                };

                //??????????????????boxs,????????????????????????


                GLabelBox.prototype.setPointBox = function setPointBox(feature, datas, ctx) {
                    var style = feature.style;
                    var currPara = {};

                    var graphicWidth = style.graphicWidth;
                    var graphicHeight = style.graphicHeight;

                    var img = feature.iconImg;
                    if (img) {
                        //????????????
                        if (!graphicWidth || !graphicHeight) {
                            graphicWidth = img.width;
                            graphicHeight = img.height;
                        }
                    } else {
                        graphicWidth = 0;
                        graphicHeight = 0;
                    }

                    currPara.fontwidth = graphicWidth;
                    currPara.fontheight = graphicHeight;

                    //?????????????????????????????????????????????????????????????????????
                    if (style.labelFunction) {
                        var labelFunction = new Function("label", style.labelFunction);
                        try {
                            feature.label = labelFunction.call({}, feature.attributes[style.labelfield]);
                        } catch (e) {
                            console.warn(feature.label + ': ??????labelFunction??????!');
                        }
                    }

                    var labelIsNotNull = Util.isNotNull(feature.label);
                    //????????????????????????????????????,????????????
                    if (!labelIsNotNull && (graphicWidth == 0 || graphicHeight == 0)) {
                        feature.hidden = true;
                        return;
                    }

                    var tmpLabels = 0;
                    //????????????????????????????????????
                    //????????????
                    if (labelIsNotNull) {
                        //??????????????????
                        feature.label = feature.label + '';
                        tmpLabels = feature.label.split(' ');
                        var tmpLabelWidth = 0;
                        ctx.save();
                        if (this.formatFont) {
                            ctx.font = Util.formatFont(style.pointFillFont, 1, true);
                        } else {
                            ctx.font = style.pointFillFont;
                        }

                        for (var _i28 = 0; _i28 < tmpLabels.length; _i28++) {
                            var oneRowLabelWidth = ctx.measureText(tmpLabels[_i28]).width;
                            tmpLabelWidth = oneRowLabelWidth > tmpLabelWidth ? oneRowLabelWidth : tmpLabelWidth;
                        }
                        ctx.restore();
                        //?????????????????????
                        currPara.fontwidth = tmpLabelWidth;
                        //??????????????? * ???????????????+  ?????????
                        currPara.fontheight = style.pointHeight * tmpLabels.length + 2 * (tmpLabels.length - 1);
                        // ????????????????????????????????????????????????????????????????????? ???????????????????????????????????????
                        currPara.fontheight = currPara.fontheight > graphicHeight ? currPara.fontheight : graphicHeight;
                    }

                    var pointOffsetX = style.pointOffsetX;
                    var pointOffsetY = style.pointOffsetY;
                    if (!pointOffsetX) {
                        pointOffsetX = 0;
                    }
                    if (!pointOffsetY) {
                        pointOffsetY = 0;
                    }
                    var pt = [datas[0][0][0], datas[0][0][1]];
                    pt[0] = pt[0] + pointOffsetX;
                    pt[1] = pt[1] + pointOffsetY;
                    if (style.pointHashBackground != true) {
                        style.pointBackgroundGap = 0;
                    }
                    if (graphicHeight == 0 || graphicWidth == 0) {
                        style.graphicDistance = 0;
                    }

                    if (!style.direction) {
                        style.direction = 0;
                    }
                    var boxs = [];
                    var fourPoints = [];

                    //??????????????????
                    var maxOneLineHeight = graphicHeight;
                    if (style.pointHeight > graphicHeight) {
                        maxOneLineHeight = style.pointHeight;
                    }

                    //???????????????
                    if (feature.style.texture) {
                        var rightBox = [pt[0] - graphicWidth * 0.5, pt[1] - style.pointBackgroundGap - currPara.fontheight * 0.5, pt[0] + graphicWidth * 0.5 + style.graphicDistance + currPara.fontwidth + style.pointBackgroundGap * 2, pt[1] + currPara.fontheight * 0.5 + style.pointBackgroundGap];
                        var leftBox = [pt[0] - graphicWidth * 0.5 - style.graphicDistance - currPara.fontwidth - style.pointBackgroundGap * 2, rightBox[1], pt[0] + graphicWidth * 0.5, rightBox[3]];

                        var bottomBox = [pt[0] - currPara.fontwidth * 0.5 - style.pointBackgroundGap, pt[1] - graphicHeight * 0.5, pt[0] + currPara.fontwidth * 0.5 + style.pointBackgroundGap, pt[1] + graphicHeight * 0.5 + style.graphicDistance + style.pointBackgroundGap * 2 + currPara.fontheight];

                        var topBox = [bottomBox[0], pt[1] - style.graphicDistance - style.pointBackgroundGap * 2 - currPara.fontheight - graphicHeight * 0.5, bottomBox[2], pt[1] + graphicHeight * 0.5];

                        rightBox = this.boxScale(rightBox, style.pointBoxDisance);
                        leftBox = this.boxScale(leftBox, style.pointBoxDisance);
                        bottomBox = this.boxScale(bottomBox, style.pointBoxDisance);
                        topBox = this.boxScale(topBox, style.pointBoxDisance);
                        boxs = [rightBox, leftBox, bottomBox, topBox];

                        //??????????????????,?????????????????????????????????
                        var rPoint = [pt[0] + graphicWidth * 0.5 + style.graphicDistance + style.pointBackgroundGap, pt[1] - currPara.fontheight * 0.5 + maxOneLineHeight * 0.5];
                        var lPoint = [pt[0] - graphicWidth * 0.5 - style.graphicDistance - style.pointBackgroundGap - currPara.fontwidth, pt[1] - currPara.fontheight * 0.5 + maxOneLineHeight * 0.5];
                        var bPoint = [pt[0] - currPara.fontwidth * 0.5, pt[1] + style.graphicDistance + style.pointBackgroundGap + maxOneLineHeight * 0.5 + graphicHeight * 0.5];
                        var tPoint = [bPoint[0], pt[1] - style.graphicDistance - style.pointBackgroundGap - currPara.fontheight + maxOneLineHeight * 0.5 - graphicHeight * 0.5];
                        fourPoints = [rPoint, lPoint, bPoint, tPoint];
                    } else {
                        //????????????????????????
                        style.direction = 0;

                        var middleBox = [pt[0] - currPara.fontwidth * 0.5 - style.pointBackgroundGap, pt[1] - style.pointBackgroundGap - currPara.fontheight * 0.5, pt[0] + currPara.fontwidth * 0.5 + style.pointBackgroundGap, pt[1] + style.pointBackgroundGap + currPara.fontheight * 0.5];
                        middleBox = this.boxScale(middleBox, style.pointBoxDisance);
                        boxs = [middleBox];

                        var mPoint = [pt[0] - currPara.fontwidth * 0.5, pt[1] - currPara.fontheight * 0.5 + maxOneLineHeight * 0.5];
                        fourPoints = [mPoint];
                    }

                    feature.boxs = boxs;
                    feature.box = boxs[style.direction];

                    feature.fourPoints = fourPoints;
                    feature.style.textPoint = fourPoints[style.direction];
                };

                /**
                 * ??????????????????box
                 *  Parameters :
                 *  feature - ?????????????????????
                 */


                GLabelBox.prototype.setTextLineBox = function setTextLineBox(feature, datas, ctx) {
                    var label = feature.label;
                    var textPoints = datas;
                    if (textPoints.length == 0) {
                        feature.hidden = true;
                        return;
                    }

                    var style = feature.style;
                    //???????????????????????????????????????????????????????????????
                    feature.textPoints = textPoints;
                    //??????boxs
                    var lineBoxs = [];
                    //????????????????????????
                    if (style.lineHashBackground == true || textPoints.length == 1) {
                        var p = textPoints[0][0];
                        if (textPoints.length > 1) {
                            //????????????????????????
                            var index = Math.floor(label.length / 2);
                            p = textPoints[index][0];
                        }

                        ctx.save();
                        if (this.formatFont) {
                            ctx.font = Util.formatFont(style.lineFillFont, 1, true);
                        } else {
                            ctx.font = style.lineFillFont;
                        }

                        var w = ctx.measureText(feature.label).width;
                        ctx.restore();

                        var minX = p[0] - w / 2 - style.lineBackgroundGap;
                        var maxX = p[0] + w / 2 + style.lineBackgroundGap;
                        var minY = p[1] - style.lineHeight * 0.5 - style.lineBackgroundGap;
                        var maxY = p[1] + style.lineHeight * 0.5 + style.lineBackgroundGap;
                        var box = [minX, minY, maxX, maxY];
                        this.boxScale(box, style.lineTextBoxDisance);
                        lineBoxs.push(box);
                    } else {
                        //????????????????????????
                        if (style.lineTextRotate || style.lineTextRotate == 0) {
                            for (var m = 0; m < textPoints.length; m++) {
                                textPoints[m][1] = style.lineTextRotate;
                            }
                        } else {
                            //?????????????????????????????????????????????(???????????????????????????????????????)?????????????????????
                            this.textToSameBearing(feature.angle, textPoints);

                            if (!style.isImportant) {
                                //???????????????????????????????????????????????????????????????
                                if (this.isMessy(textPoints, style, label)) {
                                    feature.hidden = true;
                                    return;
                                }
                            }
                        }

                        //??????????????????box,????????????????????????????????????
                        var boxs = this.getLineBoxs(label, textPoints, style);
                        if (boxs) {
                            lineBoxs = lineBoxs.concat(boxs);
                        } else {
                            feature.hidden = true;
                            return;
                        }
                    }
                    feature.boxs = lineBoxs;
                };

                /**
                 * ??????????????????box
                 *  Parameters :
                 *  feature - ?????????????????????
                 */


                GLabelBox.prototype.setCodeLineBox = function setCodeLineBox(feature, datas, ctx) {
                    var codePoints = datas;
                    if (codePoints.length == 0) {
                        feature.hidden = true;
                        return;
                    }

                    var style = feature.style;
                    //???????????????????????????
                    var p = codePoints[0][0];

                    ctx.save();
                    if (this.formatFont) {
                        ctx.font = Util.formatFont(style.codeLineFillFont, 1, true);
                    } else {
                        ctx.font = style.codeLineFillFont;
                    }

                    var w = ctx.measureText(feature.label).width;
                    ctx.restore();

                    var minX = p[0] - w / 2 - style.codeLineBackgroundGap;
                    var maxX = p[0] + w / 2 + style.codeLineBackgroundGap;
                    var minY = p[1] - style.codeLineHeight * 0.5 - style.codeLineBackgroundGap;
                    var maxY = p[1] + style.codeLineHeight * 0.5 + style.codeLineBackgroundGap;
                    var box = [minX, minY, maxX, maxY];
                    this.boxScale(box, style.lineCodeBoxDisance);
                    feature.boxs = [box];
                    feature.codePoint = p;
                };

                /**
                 * ??????????????????box
                 *  Parameters :
                 *  feature - ?????????????????????
                 */


                GLabelBox.prototype.setArrowLineBox = function setArrowLineBox(feature, datas) {
                    var arrowPoints = datas;
                    if (arrowPoints.length != 2) {
                        feature.hiden = true;
                        return;
                    }

                    var p = arrowPoints[0][0];
                    var p1 = arrowPoints[1][0];

                    var minX = p[0] < p1[0] ? p[0] : p1[0];
                    var maxX = p[0] > p1[0] ? p[0] : p1[0];
                    var minY = p[1] < p1[1] ? p[1] : p1[1];
                    var maxY = p[1] > p1[1] ? p[1] : p1[1];
                    var box = [minX, minY, maxX, maxY];
                    this.boxScale(box, feature.style.lineArrowBoxDisance);
                    feature.boxs = [box];
                    feature.arrowPoint = arrowPoints;
                };

                // ????????????????????????.


                GLabelBox.prototype.filterFeature = function filterFeature(features) {
                    var returnFeatures = [];
                    //????????????????????????
                    for (var _i29 = 0; _i29 < features.length; _i29++) {
                        if (!features[_i29].hidden) {
                            returnFeatures.push(features[_i29]);
                        }
                    }
                    return returnFeatures;
                };

                /**
                 * ???????????????????????????????????????????????????????????????
                 *  Parameters :
                 * textPoints - ???????????????????????????
                 *  style -???????????????
                 */


                GLabelBox.prototype.isMessy = function isMessy(textPoints, style, label) {
                    var firstPoint = textPoints[0][0];
                    var minX = firstPoint[0];
                    var minY = firstPoint[1];
                    var maxX = firstPoint[0];
                    var maxY = firstPoint[1];

                    var minAngle = textPoints[0][1];
                    var maxAngle = textPoints[0][1];
                    for (var _i30 = 0; _i30 < label.length; _i30++) {
                        var currPoint = textPoints[_i30][0];
                        var currAngle = textPoints[_i30][1];
                        if (currPoint[0] > maxX) // ???????????????
                            maxX = currPoint[0];
                        if (currPoint[0] < minX) // ???????????????
                            minX = currPoint[0];

                        if (currPoint[1] > maxY) // ???????????????
                            maxY = currPoint[1];
                        if (currPoint[1] < minY) // ???????????????
                            minY = currPoint[1];

                        if (currAngle > maxAngle) // ???????????????
                            maxAngle = currAngle;
                        if (currAngle < minAngle) // ???????????????
                            minAngle = currAngle;
                    }

                    //???????????????????????????????????????????????????????????????????????????
                    if (maxAngle - minAngle > style.angle) {
                        if (style.angleSwitch == false && style.angleColor) {
                            style.lineFillStyle = style.angleColor;
                        } else {
                            return true;
                        }
                    }
                    return false;
                };

                /**
                 * ???????????????????????????????????????
                 *  Parameters :
                 * boxs -
                 *  style -???????????????
                 */


                GLabelBox.prototype.getLineBoxs = function getLineBoxs(label, textPoints, style) {
                    //????????????????????????boxs
                    var boxs = [];
                    //??????????????????boxs
                    var owmCrashBoxs = [];
                    for (var _i31 = 0; _i31 < label.length; _i31++) {
                        var pt = textPoints[_i31][0];
                        //?????????????????????????????????????????????????????????????????????
                        if (textPoints[_i31][1] == 0) {
                            textPoints[_i31][1] = 0.5;
                        }
                        //??????????????????????????????????????????box????????????1.2???
                        var labelBox = [pt[0] - style.lineHeight * 1.2 * 0.5, pt[1] - style.lineHeight * 1.2 * 0.5, pt[0] + style.lineHeight * 1.2 * 0.5, pt[1] + style.lineHeight * 1.2 * 0.5];
                        this.boxScale(labelBox, style.lineTextBoxDisance);
                        var owmCrashBox = [pt[0] - style.lineHeight * 0.5, pt[1] - style.lineHeight * 1.2 * 0.5, pt[0] + style.lineHeight * 0.5, pt[1] + style.lineHeight * 0.5];
                        owmCrashBoxs.push(owmCrashBox);
                        boxs.push(labelBox);
                    }

                    if (!style.isImportant) {
                        for (var _j11 = 0; _j11 < owmCrashBoxs.length - 1; _j11++) {
                            var box1 = owmCrashBoxs[_j11];
                            for (var k = _j11 + 1; k < owmCrashBoxs.length; k++) {
                                var box2 = owmCrashBoxs[k];
                                if (this.crashBox(box1, box2)) {
                                    return null;
                                }
                            }
                        }
                    }
                    return boxs;
                };

                // ????????????????????????.


                GLabelBox.prototype.crashBox = function crashBox(ibox, jbox) {
                    return ibox[0] <= jbox[2] && ibox[2] >= jbox[0] && ibox[1] <= jbox[3] && ibox[3] >= jbox[1];
                };

                GLabelBox.prototype.boxScale = function boxScale(box, pointBoxDisance) {
                    if (!pointBoxDisance && pointBoxDisance != 0) {
                        pointBoxDisance = this.boxDistance;
                    }

                    box[0] = box[0] - pointBoxDisance * 0.5;
                    box[1] = box[1] - pointBoxDisance * 0.5;
                    box[2] = box[2] + pointBoxDisance * 0.5;
                    box[3] = box[3] + pointBoxDisance * 0.5;
                    return box;
                };

                /**
                 * ?????????????????????????????????????????????(???????????????????????????????????????)?????????????????????
                 * @param textPoints
                 */


                GLabelBox.prototype.textToSameBearing = function textToSameBearing(angle, textPoints) {
                    //??????????????????????????????
                    if (angle >= 45) {
                        angle = angle - 90;
                    } else {
                        if (angle <= -45) {
                            angle = angle + 90;
                        }
                    }

                    for (var _i32 = 0; _i32 < textPoints.length; _i32++) {
                        var p = textPoints[_i32][1];
                        var offsetAngle = angle - p;
                        if (offsetAngle > 45) {
                            textPoints[_i32][1] = p + 90;
                        }
                        if (offsetAngle < -45) {
                            textPoints[_i32][1] = p - 90;
                        }
                    }
                };

                // /**
                //  * ?????????????????????????????????????????????(???????????????????????????????????????)?????????????????????
                //  * @param textPoints
                //  */
                // textToSameBearing(textPoints){
                //     let indexs = [];
                //     for(let m = 0;m<textPoints.length-1;m++){
                //         let p1 = textPoints[m][1];
                //         let p2 = textPoints[m+1][1];
                //         if(Math.abs(p1 -p2) >= 45){
                //             indexs.push(m+1);
                //         }
                //     }
                //
                //     if(indexs.length == 0){
                //         return;
                //     }
                //
                //     let leftIndexDis = indexs[0];
                //     let rightIndexDis = textPoints.length  - indexs[indexs.length - 1];
                //
                //     //??????????????????????????????????????????
                //     if(leftIndexDis > rightIndexDis){
                //         for(let i = leftIndexDis-1;i<textPoints.length-2;i++){
                //             let p1 = textPoints[i][1];
                //             let p2 = textPoints[i+1][1];
                //             if(p1 -p2 >= 45){
                //                 textPoints[i+1][1] = p2 + 90;
                //             }
                //
                //             if(p1 -p2 <= -45){
                //                 textPoints[i+1][1] = p2 - 90;
                //             }
                //         }
                //     }else{
                //         //???????????????????????????????????????
                //         for(let j = indexs[indexs.length - 1];j>0;j--){
                //             let p1 = textPoints[j][1];
                //             let p2 = textPoints[j-1][1];
                //             if(p1 -p2 >= 45){
                //                 textPoints[j-1][1] = p2 + 90;
                //             }
                //
                //             if(p1 -p2 <= -45){
                //                 textPoints[j-1][1] = p2 - 90;
                //             }
                //         }
                //     }
                // }


                return GLabelBox;
            }();

            module.exports = GLabelBox;
        }, { "./Util": 19 }], 19: [function (require, module, exports) {
            var Util = function () {
                function Util() {
                    _classCallCheck(this, Util);
                }

                Util.getRealLength = function getRealLength(str) {
                    var length = str.length;
                    var realLength = 0;
                    for (var i = 0; i < length; i++) {
                        var charCode = str.charCodeAt(i);
                        if (charCode >= 0 && charCode <= 128) {
                            realLength += 0.5;
                        } else {
                            realLength += 1;
                        }
                    }
                    return realLength;
                };

                /**
                 * ???????????????????????????
                 *  Parameters :
                 *  label - ??????????????????
                 *
                 */


                Util.isNotNull = function isNotNull(label) {
                    if (!label && label != 0) {
                        return false;
                    }

                    //??????????????????
                    if (typeof label == 'string') {
                        label = label.toLowerCase();
                        if (label == '' || label == 'undefined' || label == 'null') {
                            return false;
                        }
                    }
                    return true;
                };

                /**
                 * ????????????????????????
                 */


                Util.formatFont = function formatFont(font, ratio, isChangeFont) {
                    var fontArr = font;
                    if (isChangeFont) {
                        var farr = font.split(' ');
                        farr[farr.length - 1] = 'SimHei';
                        fontArr = farr.join(' ');
                    }

                    return fontArr.replace(/(\d+\.?\d*)(px|em|rem|pt)/g, function (w, m, u) {
                        if (m < 12) {
                            m = 12 * ratio;
                        } else {
                            m = Math.round(m) * ratio;
                        }
                        return m + u;
                    });
                };

                /**
                 * ?????????????????????????????????
                 */
                Util.formatLabel = function formatLabel(label) {
                    if (label && label.length > 0) {
                        //?????????????????????
                        label = label.replace(/([\x00-\x1f\x7f])/g, '');
                        label = label.replace(/(\s*$)/g, "");
                        label = label.replace(/<br\/>/g, "");
                    }
                    return label;
                };

                //?????????????????????y????????????


                Util.getAngle = function getAngle(p1, p2) {
                    if (p2[0] - p1[0] == 0) {
                        if (p2[1] > p1[0]) {
                            return 90;
                        } else {
                            return -90;
                        }
                    }
                    var k = (p2[1] - p1[1]) / (p2[0] - p1[0]);
                    var angle = 360 * Math.atan(k) / (2 * Math.PI);
                    return angle;
                };

                return Util;
            }();

            module.exports = Util;
        }, {}], 20: [function (require, module, exports) {
            /**
             * Created by kongjian on 2017/6/26.
             */
            var Cache = require('../../../utils/Cache');
            var GDrawGeomerty = require('../avoid/GDrawGeomerty');

            var _require2 = require('./../../../utils/es6-promise'),
                Promise = _require2.Promise,
                getParamJSON = _require2.getParamJSON;

            var LabelDrawer = require('./LabelDrawer');
            var GAnnoAvoid = require('./../avoid/GAnnoAvoid');
            var GCutLine = require('./../avoid/GCutLine');

            var CanvasLayer = function () {
                function CanvasLayer() {
                    _classCallCheck(this, CanvasLayer);

                    this.width = 0;
                    this.height = 0;

                    //???????????????????????????????????????
                    this.grid = [];
                    this.cache = new Cache(256);
                    //??????????????????
                    this.gwvtAnno = null;
                    //???????????????
                    this.dataSource = [];
                    //??????dataSource???urldatasource,??????????????????????????????????????? ????????????localDataSource,??????true
                    this.isReady = false;

                    //?????????????????????
                    this.maxExtent = [];
                    //?????????????????????
                    this.extent = [];
                    //????????????????????????
                    this.res = 0;
                    //????????????
                    this.tileSize = 256;
                    //??????????????????
                    this.hitDetection = false;
                    //??????????????????features
                    this.features = [];
                    //????????????????????????????????????,?????????????????????
                    this.requestingTiles = {};
                    // ???????????????isImportant??????
                    this.hasImportant = true;
                    //????????????
                    this.ratio = 1;
                    var canvas = document.createElement('CANVAS');
                    var ctx = canvas.getContext('2d', { isQuality: true });
                    this.GAnnoAvoid = new GAnnoAvoid(ctx, false);
                }

                /**
                 * ?????????
                 */


                CanvasLayer.prototype.init = function init(w, h, tileSize, gwvtAnno) {
                    this.tileSize = tileSize;
                    this.gwvtAnno = gwvtAnno;
                    this.initCanvas(w, h);
                    this.loadResources();
                };

                /**
                 * ??????dataSource?????????????????????????????????dataSource???
                 * ???????????????????????????????????????isReady?????????ture
                 */
                CanvasLayer.prototype.loadResources = function loadResources() {
                    if (this.dataSource.length == 0) {
                        this.isReady = false;
                        return;
                    }

                    this.cache.clean();
                    var reqArr = [];
                    for (var _i33 = 0; _i33 < this.dataSource.length; _i33++) {
                        var ds = this.dataSource[_i33];
                        if (ds.type == 'URLDataSource') {
                            reqArr = reqArr.concat(ds.loadStyle());
                        }
                        if (ds.type == 'LocalDataSource') {
                            reqArr = reqArr.concat(ds.loadTexture());
                        }
                    }

                    if (reqArr.length > 0) {
                        Promise.all(reqArr).then(function () {
                            this.isReady = true;
                            //????????????????????????
                            if (this.grid.length > 0) {
                                this.requestLabelTiles(this.grid);
                            }
                        }.bind(this));
                    } else {
                        this.isReady = true;
                    }
                };

                /**
                 * ???????????????
                 * Parameters :
                 * w - ?????????
                 * h - ?????????
                 */
                CanvasLayer.prototype.initCanvas = function initCanvas(w, h) {
                    this.width = w;
                    this.height = h;
                    if (!this.root) {
                        this.root = document.createElement("canvas");
                    }
                    this.root.style.width = this.width + "px";
                    this.root.style.height = this.height + "px";
                    this.root.width = this.width * this.ratio;
                    this.root.height = this.height * this.ratio;
                    this.root.id = 'labelCanvas';
                    this.canvas = this.root.getContext("2d", { isQuality: true });

                    if (this.hitDetection) {
                        if (!this.hitCanvas) {
                            this.hitCanvas = document.createElement("canvas");
                        }
                        this.hitCanvas.style.width = this.width + "px";
                        this.hitCanvas.style.height = this.height + "px";
                        this.hitCanvas.width = this.width;
                        this.hitCanvas.height = this.height;
                        this.hitContext = this.hitCanvas.getContext("2d", { isQuality: true });
                    }
                };

                /**
                 * ???????????????
                 * Parameters :
                 * dataSource
                 */
                CanvasLayer.prototype.addDataSource = function addDataSource(dataSource) {
                    if (dataSource.type == 'URLDataSource') {
                        dataSource.url = dataSource.url + '&tilesize=' + this.tileSize;
                    }

                    if (dataSource.type == 'URLDataSource' || dataSource.type == 'LocalDataSource') {
                        this.dataSource.push(dataSource);
                    }
                };

                /**
                 * ??????dataSoucceId???????????????
                 * Parameters :
                 * dataSoucceId
                 */
                CanvasLayer.prototype.removeDataSourceById = function removeDataSourceById(dataSoucceId) {
                    for (var _i34 = 0; _i34 < this.dataSource.length; _i34++) {
                        if (this.dataSource[_i34].id == dataSoucceId) {
                            this.dataSource.splice(_i34, 1);
                            return;
                        }
                    }
                };

                /**
                 * ??????dataSoucceId???????????????
                 * Parameters :
                 * dataSoucceId
                 */
                CanvasLayer.prototype.getDataSourceById = function getDataSourceById(dataSoucceId) {
                    for (var _i35 = 0; _i35 < this.dataSource.length; _i35++) {
                        if (this.dataSource[_i35].id == dataSoucceId) {
                            return this.dataSource[_i35];
                        }
                    }
                };

                /**
                 * ????????????
                 */
                CanvasLayer.prototype.clean = function clean() {
                    this.canvas.clearRect(0, 0, this.width * this.ratio, this.height * this.ratio);
                    if (this.hitContext) {
                        this.hitContext.clearRect(0, 0, this.width, this.height);
                    }
                };

                /**
                 * ??????????????????????????????????????????DataSouce???????????????????????????redraw??????
                 */
                CanvasLayer.prototype.redraw = function redraw() {
                    if (this.grid.length == 0) {
                        return;
                    }
                    this.cache.clean();
                    //?????????????????????????????????
                    this.loadResources();
                };

                /**
                 * ??????????????????
                 * Parameters :
                 * grid - ?????????????????????????????????????????????
                 * zoomChanged - ???????????????????????????
                 */
                CanvasLayer.prototype.requestLabelTiles = function requestLabelTiles(grid, zoomChanged) {
                    this.grid = grid;
                    //??????????????????????????????
                    if (!this.isReady) {
                        return;
                    }

                    //?????????????????????url
                    var requestTileUrls = this.getRequestTileUrls(grid);
                    this.sendRequest(requestTileUrls);
                };

                /**
                 * ??????localDataSource??????????????????????????????????????????
                 */
                CanvasLayer.prototype.getLocalLabelDatas = function getLocalLabelDatas() {
                    var localFeatures = [];
                    for (var _i36 = 0; _i36 < this.dataSource.length; _i36++) {
                        var ds = this.dataSource[_i36];
                        if (ds.type == 'LocalDataSource') {
                            for (var _j12 = 0; _j12 < ds.features.length; _j12++) {
                                var feature = ds.features[_j12];
                                //?????????????????????????????????
                                if (feature.inBounds(this.extent)) {
                                    if (feature.type == 1) {
                                        //??????????????????????????????????????????
                                        feature.sourceAngleData = [[feature.sourceData, 0]];
                                        feature.transformData(this.extent, this.res);
                                        feature.label = feature.getFeatureLabel();
                                        feature.textures = ds.textures;
                                        localFeatures.push(feature);
                                    }

                                    if (feature.type == 2) {
                                        feature.label = feature.getFeatureLabel();
                                        feature.textures = ds.textures;
                                        localFeatures = localFeatures.concat(this.cutLineFeature(feature, true));
                                    }
                                }
                            }
                        }
                    }

                    return localFeatures;
                };

                /**
                 * ??????????????????????????????url
                 * Parameters :
                 * requestTiles - ???????????????????????????????????????
                 */
                CanvasLayer.prototype.getRequestTileUrls = function getRequestTileUrls(grid) {
                    this.hitCacheUrls = [];
                    this.currentTileDatas = [];
                    //?????????????????????url
                    var requestTileUrls = {};
                    //????????????????????????url??????
                    var findedRequestUrls = {};
                    for (var _i37 = 0; _i37 < this.dataSource.length; _i37++) {
                        var dataSource = this.dataSource[_i37];
                        //url?????????
                        if (dataSource.type == 'URLDataSource') {
                            var url = dataSource.url;
                            for (var _j13 = 0; _j13 < grid.length; _j13++) {
                                var item = grid[_j13];
                                var tileUrl = url.replace('${x}', item.col).replace('{x}', item.col);
                                tileUrl = tileUrl.replace('${y}', item.row).replace('{y}', item.row);
                                tileUrl = tileUrl.replace('${z}', item.level).replace('{z}', item.level);

                                //?????????url
                                if (dataSource.urlArray.length > 0) {
                                    var len = dataSource.urlArray.length - 1;
                                    var index = Math.round(Math.random() * len);
                                    var domainUrl = dataSource.urlArray[index];

                                    var array = tileUrl.split('/mapserver');
                                    var partUrl = array[1];
                                    tileUrl = domainUrl + '/mapserver' + partUrl;
                                }

                                //?????????????????????????????????
                                var cacheItem = this.cache.getItem(tileUrl);
                                if (cacheItem) {
                                    this.hitCacheUrls.push(tileUrl);
                                } else {
                                    //?????????????????????????????????,???????????????????????????????????????
                                    if (!this.requestingTiles[tileUrl]) {
                                        requestTileUrls[tileUrl] = { url: tileUrl, xyz: item, dataSourceId: dataSource.id, dataType: 'json' };
                                    } else {
                                        findedRequestUrls[tileUrl] = true;
                                    }
                                }
                            }
                        }
                    }

                    // console.log('total count  ================='+ grid.length);
                    //??????????????????????????????
                    this.cancelRequest(findedRequestUrls);
                    return requestTileUrls;
                };

                /**
                 * ??????????????????????????????
                 * Parameters :
                 * findedRequestUrls - ????????????????????????url??????
                 */
                CanvasLayer.prototype.cancelRequest = function cancelRequest(findedRequestUrls) {
                    for (var tileUrl in this.requestingTiles) {
                        if (!findedRequestUrls[tileUrl]) {
                            var requestTile = this.requestingTiles[tileUrl];
                            delete this.requestingTiles[tileUrl];
                            requestTile.xhr.abort();
                            requestTile.requestItem.cancel = true;
                        }
                    }
                };

                /**
                 * ????????????????????????????????????
                 * Parameters :
                 * requestTileUrls - ?????????????????????url??????
                 */
                CanvasLayer.prototype.sendRequest = function sendRequest(requestTileUrls) {
                    var count = 0;
                    for (var url in requestTileUrls) {
                        var item = requestTileUrls[url];
                        var promise = getParamJSON(item);
                        this.requestingTiles[item.url] = { xhr: promise.xhr, requestItem: item };
                        promise.then(this.tileSuccessFunction.bind(this), this.tileFailFunction.bind(this));
                        count++;
                    }
                    // console.log('sendRequest count ==============='+count);
                    if (count == 0) {
                        this.sendSuccess([]);
                    }
                };

                /**
                 * ???????????????????????????????????????
                 */
                CanvasLayer.prototype.tileSuccessFunction = function tileSuccessFunction(data) {
                    if (data.param.cancel == true) {
                        //????????????????????????????????????
                        return;
                    }

                    var url = data.param.url;
                    // console.log('onSuceess url ==='+ url);
                    //?????????????????????url
                    delete this.requestingTiles[url];
                    var features = this.parseFeature(data);
                    //??????boxs
                    var labelFeatures = this.GAnnoAvoid.GLabelBox.setBox(features.labelFeatures, true);
                    labelFeatures = this.GAnnoAvoid.avoid(labelFeatures, features.avoidLineFeatures);
                    this.currentTileDatas.push({ url: url, labelFeatures: labelFeatures, avoidLineFeatures: features.avoidLineFeatures });

                    //?????????????????????????????????
                    if (this.isEmptyObject(this.requestingTiles)) {
                        this.sendSuccess(this.currentTileDatas);
                    }
                };

                //??????map????????????
                CanvasLayer.prototype.isEmptyObject = function isEmptyObject(e) {
                    for (var t in e) {
                        return !1;
                    }return !0;
                };

                /**
                 * ???????????????????????????????????????
                 */
                CanvasLayer.prototype.tileFailFunction = function tileFailFunction(data) {
                    if (data.param.cancel == true) {
                        //????????????????????????????????????
                        return;
                    }

                    var url = data.param.url;
                    // console.log('onfail url ==='+ url);
                    delete this.requestingTiles[url];

                    //?????????????????????????????????
                    if (this.isEmptyObject(this.requestingTiles)) {
                        this.sendSuccess(this.currentTileDatas);
                    }
                };

                /**
                 * ??????????????????????????????????????????url????????????????????????
                 * Parameters :
                 * results - ?????????????????????
                 */
                CanvasLayer.prototype.sendSuccess = function sendSuccess(results) {
                    if (this.gwvtAnno.animating) {
                        return;
                    }

                    //???????????????????????????????????????????????????(?????????????????????)
                    var mergeFeatures = this.mergeLabelData(results, this.hitCacheUrls);
                    var labelFeatures = mergeFeatures.labelFeatures;

                    for (var _i38 = 0; _i38 < results.length; _i38++) {
                        var item = results[_i38];
                        this.cache.push(item.url, item);
                    }

                    //??????localDataSource??????????????????????????????????????????
                    var localFeatures = this.getLocalLabelDatas();
                    labelFeatures = labelFeatures.concat(localFeatures);
                    // console.time('avoid time:');
                    //????????????
                    this.avoidlabelDatas = this.GAnnoAvoid.defaultAvoid(labelFeatures, this.hasImportant);
                    // console.timeEnd('avoid time:');
                    //??????????????????
                    this.gwvtAnno.resetCanvasDiv();
                    this.clean();
                    // this.drawAvoidLine(mergeFeatures.avoidLineFeatures);

                    //??????????????????????????????????????????
                    if (this.hitDetection) {
                        this.features = [];
                        for (var _i39 = 0; _i39 < this.avoidlabelDatas.length; _i39++) {
                            var feature = this.avoidlabelDatas[_i39];
                            this.features[feature.id] = feature;
                        }
                    }
                    //??????????????????
                    GDrawGeomerty.draw(this.canvas, this.avoidlabelDatas, this.ratio, false, false, this.hitContext, this.hitDetection);
                };

                CanvasLayer.prototype.drawAvoidLine = function drawAvoidLine(avoidLineFeatures) {
                    this.canvas.save();
                    this.canvas.beginPath();
                    for (var _i40 = 0; _i40 < avoidLineFeatures.length; _i40++) {
                        var avoidLineFeature = avoidLineFeatures[_i40];
                        this.canvas.lineWidth = 1;
                        this.canvas.strokeStyle = "#fff000";
                        //??????
                        this.canvas.moveTo(avoidLineFeature.datas[0], avoidLineFeature.datas[1]);
                        for (j = 1; j < avoidLineFeature.datas.length / 2; j++) {
                            this.canvas.lineTo(avoidLineFeature.datas[j * 2], avoidLineFeature.datas[j * 2 + 1]);
                        }
                    }
                    this.canvas.stroke();
                    this.canvas.restore();
                };

                /**
                 * ???????????????????????????
                 * Parameters:
                 * tileData - ???????????????????????????
                 * Returns:
                 * labelDatas - ???????????????,?????????????????????????????????????????????????????????
                 */
                CanvasLayer.prototype.parseFeature = function parseFeature(tileData) {
                    var layers = tileData.data;
                    var xyz = tileData.param.xyz;
                    var count = 0;
                    for (var key in layers) {
                        var layerData = layers[key];
                        layerData.xyz = xyz;
                        count++;
                    }

                    var dataSourceId = tileData.param.dataSourceId;

                    var labelFeatures = [];
                    var dataSource = this.getDataSourceById(dataSourceId);
                    if (count > 0 && dataSource && dataSource.styleFun) {
                        //????????????
                        var itemDatas = [];
                        var level = tileData.param.xyz.level;
                        var drawer = new LabelDrawer(layers, level, itemDatas);
                        dataSource.styleFun.call({}, drawer, level);

                        //?????????????????????????????????,?????????label??????
                        for (var _j14 = 0; _j14 < itemDatas.length; _j14++) {
                            var itemData = itemDatas[_j14];
                            itemData.textures = dataSource.textures;
                            labelFeatures = labelFeatures.concat(this.parseItemData(itemData));
                        }
                    }

                    var avoidLineFeatures = this.parseAvoidLine(layers['_layerAvoids'], xyz);
                    return { labelFeatures: labelFeatures, avoidLineFeatures: avoidLineFeatures };
                };

                /**
                 * ?????????????????????
                 * Parameters:
                 * layerAvoids - ??????????????????????????????
                 * xyz - ??????????????????
                 * Returns:
                 * avoidLineFeatures - ????????????????????????
                 */
                CanvasLayer.prototype.parseAvoidLine = function parseAvoidLine(layerAvoids, xyz) {
                    var avoidLineFeatures = [];
                    for (var weight in layerAvoids) {
                        var lines = layerAvoids[weight];
                        weight = parseInt(weight);
                        for (var _i41 = 0; _i41 < lines.length; _i41++) {
                            var feature = {};
                            feature.weight = weight;
                            feature.sourceDatas = lines[_i41];
                            feature.datas = this.transformAvoidLine(lines[_i41], xyz);
                            feature.xyz = xyz;
                            avoidLineFeatures.push(feature);
                        }
                    }
                    return avoidLineFeatures;
                };

                /**
                 * ?????????????????????????????????????????????
                 * Parameters:
                 * line - ???????????????????????????
                 * xyz - ?????????????????????
                 * Returns:
                 * rdata - ???????????????????????????
                 */
                CanvasLayer.prototype.transformAvoidLine = function transformAvoidLine(line, xyz) {
                    //??????????????????????????????????????????
                    var left = this.extent[0];
                    var top = this.extent[3];

                    //?????????????????????
                    var mLeft = this.maxExtent[0];
                    var mTop = this.maxExtent[3];

                    //??????????????????????????????
                    var x = (left - mLeft) / this.res;
                    var y = (mTop - top) / this.res;

                    var newLine = [];

                    for (var _i42 = 0; _i42 < line.length / 2; _i42++) {
                        var px = line[2 * _i42];
                        var py = line[2 * _i42 + 1];
                        var gx = px + xyz.col * this.tileSize;
                        var gy = py + xyz.row * this.tileSize;
                        newLine.push(gx - x);
                        newLine.push(gy - y);
                    }
                    return newLine;
                };

                /**
                 * ?????????????????????????????????????????????????????????
                 * Parameters:
                 * itemData - ??????????????????????????????
                 * Returns:
                 * labelDatas - ???????????????,?????????????????????????????????????????????????????????
                 */
                CanvasLayer.prototype.parseItemData = function parseItemData(itemData) {
                    var labelDatas = [];
                    //???
                    if (itemData.type == 1) {
                        labelDatas = this.parsePoint(itemData);
                    }
                    //???
                    if (itemData.type == 2) {
                        if (itemData[0] == 'LINESTRING') {
                            labelDatas = labelDatas.concat(this.parseLine(itemData));
                        }
                        //??????
                        if (itemData[0] == 'MULTILINESTRING') {
                            labelDatas = labelDatas.concat(this.parseMultiLine(itemData, itemData[2][0][0]));
                        }
                    }
                    return labelDatas;
                };

                /**
                 * ????????????????????????????????????????????????????????????
                 * Parameters:
                 * itemData - ??????????????????????????????
                 * Returns:
                 * points - ???????????????,?????????????????????????????????????????????????????????
                 */
                CanvasLayer.prototype.parsePoint = function parsePoint(itemData) {
                    var points = [];
                    var point = itemData[2];
                    var sourceAngleData = [[point, 0]];
                    var p = this.transformData(sourceAngleData, itemData.xyz);
                    var style = itemData.style;
                    var label = itemData.fieldValueMap[style.labelfield];
                    var primaryId = itemData.fieldValueMap['attributeId'] + '_row_' + itemData.xyz.row + '_col_' + itemData.xyz.col + '_level_' + itemData.xyz.level + '_x_' + sourceAngleData[0][0][0] + '_y_' + sourceAngleData[0][0][1];
                    var weight = 0;
                    if (itemData.fieldValueMap[style.avoidField]) {
                        weight = parseInt(itemData.fieldValueMap[style.avoidField]);
                        if (isNaN(weight)) {
                            weight = 0;
                        }
                    }

                    var directions = { 0: 1 };
                    if (style.texture) {
                        directions = { 0: 1, 1: 1, 2: 1, 3: 1 };
                    }

                    points.push({ id: Math.round(Math.random() * 256 * 256 * 256), type: itemData.type, datas: p, sourceData: point, sourceAngleData: sourceAngleData, label: label,
                        attributeId: itemData.fieldValueMap['attributeId'], primaryId: primaryId, style: style, iconImg: itemData.textures[style.texture], xyz: itemData.xyz, weight: weight,
                        directions: directions, attributes: itemData.fieldValueMap });
                    return points;
                };

                /**
                 * ????????????????????????????????????????????????????????????
                 * Parameters:
                 * itemData - ??????????????????????????????
                 * Returns:
                 * lines - ???????????????,?????????????????????????????????????????????????????????
                 */
                CanvasLayer.prototype.parseLine = function parseLine(itemData) {
                    if (itemData[2].length == 0) {
                        return [];
                    }

                    var lines = [];
                    if (Array.isArray(itemData[2][0][0])) {
                        lines = this.parseMultiLine(itemData, itemData[2][0]);
                    } else {
                        lines = this.parseMultiLine(itemData, itemData[2]);
                    }
                    return lines;
                };

                /**
                 * ???????????????????????????????????????????????????????????????
                 * Parameters:
                 * itemData - ??????????????????????????????
                 * Returns:
                 * multiLines - ???????????????,?????????????????????????????????????????????????????????
                 */
                CanvasLayer.prototype.parseMultiLine = function parseMultiLine(itemData, datas) {
                    var multiLines = [];
                    var style = itemData.style;
                    for (var _i43 = 0; _i43 < datas.length; _i43++) {
                        var line = datas[_i43];
                        if (line.length == 0) {
                            continue;
                        }
                        var label = itemData.fieldValueMap[style.labelfield];
                        var roadCodeLabel = itemData.fieldValueMap[style.roadCodeLabel];
                        var weight = 0;
                        if (itemData.fieldValueMap[style.avoidField]) {
                            weight = parseInt(itemData.fieldValueMap[style.avoidField]);
                        }
                        var feature = { type: itemData.type, sourceData: line, label: label, weight: weight, roadCodeLabel: roadCodeLabel,
                            attributeId: itemData.fieldValueMap['attributeId'], style: this.cloneStyle(style), textures: itemData.textures, xyz: itemData.xyz,
                            attributes: itemData.fieldValueMap };
                        multiLines = multiLines.concat(this.cutLineFeature(feature, false));
                    }
                    return multiLines;
                };

                /**
                 * ????????????
                 * @param style
                 * @returns {{}}
                 */
                CanvasLayer.prototype.cloneStyle = function cloneStyle(style) {
                    var newStyle = {};
                    for (var name in style) {
                        newStyle[name] = style[name];
                    }
                    return newStyle;
                };

                /**
                 * ?????????????????????????????????????????????????????????,????????????????????????
                 * Parameters:
                 * feature - ??????????????????????????????
                 * isLocal - true?????????Feature,false??????????????????feature
                 * Returns:
                 * features - ??????????????????????????????????????????????????????
                 */


                CanvasLayer.prototype.cutLineFeature = function cutLineFeature(feature, isLocal) {
                    var features = GCutLine.cutLineFeature(feature);
                    for (var _i44 = 0; _i44 < features.length; _i44++) {
                        var f = features[_i44];
                        //?????????????????????
                        if (isLocal) {
                            f.datas = feature.transformData(this.extent, this.res);
                        } else {
                            f.datas = this.transformData(f.sourceAngleData, f.xyz);
                        }

                        f.primaryId = f.attributeId + '_row_' + feature.xyz.row + '_col_' + feature.xyz.col + '_level_' + feature.xyz.level + '_x_' + f.sourceAngleData[0][0][0] + '_y_' + f.sourceAngleData[0][0][1];
                        //???????????????id
                        f.id = Math.round(Math.random() * 256 * 256 * 256);

                        //????????????????????????
                        if (f.lineType == 'text') {
                            var centerIndex = Math.floor(f.datas.length / 2);
                            f.centerPoint = f.datas[centerIndex][0];
                        }

                        //????????????????????????
                        if (f.lineType == 'code') {
                            f.centerPoint = f.datas[0][0];
                        }
                    }
                    return features;
                };

                /**
                 * ?????????????????????????????????????????????
                 * Parameters:
                 * points - ?????????????????????,item?????????[[12,20],0] [12,20]???????????????0??????????????????
                 * xyz - ?????????????????????
                 * Returns:
                 * rdata - ???????????????????????????
                 */
                CanvasLayer.prototype.transformData = function transformData(points, xyz) {
                    //??????????????????????????????????????????
                    var left = this.extent[0];
                    var top = this.extent[3];

                    //?????????????????????
                    var mLeft = this.maxExtent[0];
                    var mTop = this.maxExtent[3];

                    //??????????????????????????????
                    var x = (left - mLeft) / this.res;
                    var y = (mTop - top) / this.res;

                    var rPoint = [];

                    for (var _i45 = 0; _i45 < points.length; _i45++) {
                        var point = points[_i45][0];
                        var gx = point[0] + xyz.col * this.tileSize;
                        var gy = point[1] + xyz.row * this.tileSize;
                        var p = [gx - x, gy - y];
                        rPoint.push([p, points[_i45][1]]);
                    }
                    return rPoint;
                };

                /**
                 * ???????????????????????????????????????????????????????????????????????????
                 * Parameters:
                 * labelDatas - ???????????????????????????
                 * noRequestTiles - ?????????????????????????????????????????????????????????
                 * Returns:
                 * labelDatas - ????????????????????????????????????????????????????????????
                 */
                CanvasLayer.prototype.mergeLabelData = function mergeLabelData(results, hitCacheUrls) {
                    var labelFeatures = [];
                    var avoidLineFeatures = [];
                    for (var _j15 = 0; _j15 < results.length; _j15++) {
                        var result = results[_j15];
                        labelFeatures = labelFeatures.concat(result.labelFeatures);
                        avoidLineFeatures = avoidLineFeatures.concat(result.avoidLineFeatures);
                    }

                    // let count = 0;
                    for (var _i46 = 0; _i46 < hitCacheUrls.length; _i46++) {
                        var cacheLabelFeatures = this.cache.getItem(hitCacheUrls[_i46]).labelFeatures;
                        // if(cacheItem){
                        //     count++;
                        // }
                        for (var _j16 = 0; _j16 < cacheLabelFeatures.length; _j16++) {
                            var labelFeature = cacheLabelFeatures[_j16];
                            //??????????????????????????????
                            labelFeature.datas = this.transformData(labelFeature.sourceAngleData, labelFeature.xyz);

                            //????????????????????????
                            if (labelFeature.lineType == 'text') {
                                var centerIndex = Math.floor(labelFeature.datas.length / 2);
                                labelFeature.centerPoint = labelFeature.datas[centerIndex][0];
                            }

                            //????????????????????????
                            if (labelFeature.lineType == 'code') {
                                labelFeature.centerPoint = labelFeature.datas[0][0];
                            }
                        }
                        labelFeatures = labelFeatures.concat(cacheLabelFeatures);

                        var cacheAvoidLineFeatures = this.cache.getItem(hitCacheUrls[_i46]).avoidLineFeatures;
                        for (var _j17 = 0; _j17 < cacheAvoidLineFeatures.length; _j17++) {
                            var avoidLineFeature = cacheAvoidLineFeatures[_j17];
                            //??????????????????????????????
                            avoidLineFeature.datas = this.transformAvoidLine(avoidLineFeature.sourceDatas, avoidLineFeature.xyz);
                        }
                        avoidLineFeatures = avoidLineFeatures.concat(cacheAvoidLineFeatures);
                    }

                    // console.log('merge cache count =============='+count );
                    return { labelFeatures: labelFeatures, avoidLineFeatures: avoidLineFeatures };
                };

                /**
                 * ????????????????????????feature
                 * Parameters :
                 * x
                 * y
                 */
                CanvasLayer.prototype.getFeatureByXY = function getFeatureByXY(x, y) {
                    var feature = null;
                    if (this.hitDetection) {
                        var featureId = void 0;
                        var data = this.hitContext.getImageData(x, y, 1, 1).data;
                        if (data[3] === 255) {
                            // antialiased
                            var id = data[2] + 256 * (data[1] + 256 * data[0]);
                            if (id) {
                                featureId = id - 1;
                                try {
                                    feature = this.features[featureId];
                                } catch (err) {}
                            }
                        }
                    }
                    return feature;
                };

                return CanvasLayer;
            }();

            module.exports = CanvasLayer;
        }, { "../../../utils/Cache": 31, "../avoid/GDrawGeomerty": 16, "./../../../utils/es6-promise": 33, "./../avoid/GAnnoAvoid": 13, "./../avoid/GCutLine": 14, "./LabelDrawer": 21 }], 21: [function (require, module, exports) {
            /**
             * Created by kongjian on 2017/5/1.
             */
            var LabelDrawer = function () {
                function LabelDrawer(layerDataMap, level, features) {
                    _classCallCheck(this, LabelDrawer);

                    this.layerDataMap = layerDataMap;
                    this.level = level;
                    this.features = features;
                }

                LabelDrawer.prototype.getLayer = function getLayer(layername) {
                    this.labelDatas = [];

                    var data = this.layerDataMap[layername];
                    if (data == null || data.features == null) {
                        return this;
                    }

                    for (var _j18 = 0; _j18 < data.features.length; _j18++) {
                        var labelData = data.features[_j18];
                        labelData.layerName = layername;
                        labelData.xyz = data.xyz;
                        labelData.type = data.type;
                        if (!labelData.fieldValueMap) {
                            labelData.fieldValueMap = this.getFieldValueMap(data, labelData);
                        }
                        this.labelDatas.push(labelData);
                    }
                    return this;
                };

                LabelDrawer.prototype.getGroupLayer = function getGroupLayer(layername, value) {
                    this.labelDatas = [];

                    var valueArr = value.split(',');
                    var length = valueArr.length;
                    if (length == 0) {
                        return this;
                    }

                    var data = this.layerDataMap[layername];
                    if (data == null || data.features == null) {
                        return this;
                    }

                    for (var _j19 = 0; _j19 < length; _j19++) {
                        var dataArr = data.features[valueArr[_j19]];
                        if (dataArr == null) {
                            continue;
                        }

                        var labelData = data.features[i];
                        labelData.layerName = layername;
                        labelData.xyz = data.xyz;
                        labelData.type = data.type;
                        if (!labelData.fieldValueMap) {
                            labelData.fieldValueMap = this.getFieldValueMap(data, labelData);
                        }
                        this.labelDatas.push(labelData);
                    }
                    return this;
                };

                LabelDrawer.prototype.setStyle = function setStyle(fn) {
                    var _this4 = this;

                    var _loop = function _loop(_i47) {
                        var labelData = _this4.labelDatas[_i47];
                        var get = function get(key) {
                            return labelData.fieldValueMap[key];
                        };
                        var style = fn.call({}, _this4.level, get);
                        if (style && style.show == true) {
                            labelData.style = style;
                            labelData.fieldValueMap['avoidWeight'] = style.avoidWeight;
                            _this4.features.push(labelData);
                        }
                    };

                    for (var _i47 = 0; _i47 < this.labelDatas.length; _i47++) {
                        _loop(_i47);
                    }
                };

                LabelDrawer.prototype.getFieldValueMap = function getFieldValueMap(data, labelData) {
                    var fieldValueMap = {};
                    for (var _i48 = 0; _i48 < data.fieldsConfig.length; _i48++) {
                        var fieldName = data.fieldsConfig[_i48]['name'];
                        var index = data.fieldsConfig[_i48]['index'];
                        var id = data.fieldsConfig[_i48]['id'];
                        if (id == true) {
                            //???????????????????????????????????????id
                            fieldValueMap['attributeId'] = labelData.layerName + labelData[1][index];
                        }
                        fieldValueMap[fieldName] = labelData[1][index];
                    }
                    return fieldValueMap;
                };

                LabelDrawer.prototype.draw = function draw() {};

                return LabelDrawer;
            }();

            module.exports = LabelDrawer;
        }, {}], 22: [function (require, module, exports) {
            /**
             * Created by kongjian on 2017/6/27.
             */
            var Feature = function () {
                function Feature() {
                    _classCallCheck(this, Feature);

                    this.id = Math.round(Math.random() * 256 * 256 * 256);
                    //???????????????1????????????2?????????
                    this.type = 1;
                    //???????????????????????????????????????x,y????????????
                    this.sourceData = [];
                    //??????sourceAngleData??????????????????????????????
                    this.datas = [];
                    //?????????sourceData??????????????????????????????
                    this.sourceAngleData = [];
                    this.attributes = {};
                    //?????????????????????
                    this.style = {};
                }

                /**
                 * ??????????????????
                 * Parameters :
                 * key
                 * value
                 */


                Feature.prototype.addAttribute = function addAttribute(key, value) {
                    this.attributes[key] = value;
                };

                /**
                 * ???????????????????????????
                 * Parameters :
                 * key
                 * value
                 */
                Feature.prototype.removeAttributeByKey = function removeAttributeByKey(key) {
                    delete this.attributes[key];
                };

                /**
                 * ??????feature?????????????????????
                 */
                Feature.prototype.getMaxExtent = function getMaxExtent() {
                    if (this.sourceData.length == 0) {
                        return null;
                    }
                    var minX = this.sourceData[0];
                    var maxX = this.sourceData[0];
                    var minY = this.sourceData[1];
                    var maxY = this.sourceData[1];
                    for (var _i49 = 2; _i49 < this.sourceData.length; _i49++) {
                        var tempX = this.sourceData[_i49];
                        var tempY = this.sourceData[_i49 + 1];
                        if (tempX > maxX) // ???????????????
                            maxX = tempX;
                        if (tempX < minX) // ???????????????
                            minX = tempX;

                        if (tempY > maxY) // ???????????????
                            maxY = tempY;
                        if (tempY < minY) // ???????????????
                            minY = tempY;
                        _i49++;
                    }
                    return [minX, minY, maxX, maxY];
                };

                /**
                 * ??????feature????????????????????????
                 * Parameters :
                 * srceenBounds - ???????????????????????????
                 */
                Feature.prototype.inBounds = function inBounds(srceenBounds) {
                    var featureBounds = this.getMaxExtent();
                    if (!featureBounds) {
                        return false;
                    }

                    return featureBounds[0] <= srceenBounds[2] && featureBounds[2] >= srceenBounds[0] && featureBounds[1] <= srceenBounds[3] && featureBounds[3] >= srceenBounds[1];
                };

                /**
                 * ??????????????????????????????????????????????????????
                 * Parameters:
                 * srceenBounds - ???????????????????????????
                 * res - ????????????????????????
                 */
                Feature.prototype.transformData = function transformData(srceenBounds, res) {
                    this.datas = [];
                    if (this.sourceData.length == 0) {
                        return;
                    }
                    //??????????????????????????????????????????
                    var left = srceenBounds[0];
                    var top = srceenBounds[3];

                    // for(let i = 0;i< this.sourceData.length;i++){
                    //     let sx = this.sourceData[i];
                    //     let sy = this.sourceData[i+1];
                    //     this.datas.push((sx - left)/res);
                    //     this.datas.push((top - sy)/res);
                    //     i++;
                    // }

                    var rPoints = [];
                    for (var _i50 = 0; _i50 < this.sourceAngleData.length; _i50++) {
                        var point = this.sourceAngleData[_i50][0];
                        var gx = (point[0] - left) / res;
                        var gy = (top - point[1]) / res;
                        var p = [gx, gy];
                        rPoints.push([p, this.sourceAngleData[_i50][1]]);
                    }
                    this.datas = rPoints;
                };

                /**
                 * ????????????????????????????????????
                 */
                Feature.prototype.getFeatureLabel = function getFeatureLabel() {
                    var labelField = this.style['labelfield'];
                    if (labelField) {
                        if (this.attributes[labelField]) {
                            return this.attributes[labelField] + '';
                        }
                    }
                    return null;
                };

                return Feature;
            }();

            module.exports = Feature;
        }, {}], 23: [function (require, module, exports) {
            /**
             * Created by kongjian on 2017/9/26.
             * ??????????????????layer
             */
            var GVMapGrid = require('./GVMapGrid');
            var GVMapGridUtil = require('./draw/GVMapGridUtil');
            var GDynamicMap = GVMapGrid.extend({
                // styleObj??????
                styleObj: {},
                //sytle???js?????????????????????
                styleJs: null,
                initialize: function initialize(url, options) {
                    options.isDynamicMap = true;
                    if (window.devicePixelRatio > 1.5) {
                        this.ratio = 2;
                    }

                    if (!this.sourceUrl) {
                        this.sourceUrl = url;
                    }

                    if (options && options.tileSize) {
                        this.tilesize = options.tileSize;
                    }

                    this.gVMapGridUtil = new Custom.GVMapGridUtil(options.isDynamicMap);
                    this.gVMapGridUtil.tileSize = this.tilesize;
                    this.gVMapGridUtil.parseUrl(url);

                    this._url = url + '&ratio=' + this.ratio + '&tilesize=' + this.tilesize + '&clientVersion=' + Custom.Version;
                    L.setOptions(this, options);
                    this.hitDetection = options.hitDetection;
                    this.on('tileunload', this._onTileRemove);
                    this.on('tileload', this._onTileLoad);
                    this.on('tileerror', this._onTileError);
                },

                onAdd: function onAdd() {
                    if (this.control) {
                        this._url = this.sourceUrl + '&ratio=' + this.ratio + '&tilesize=' + this.tilesize + '&clientVersion=' + Custom.Version + '&control=' + this.control;
                    }
                    if (this.controlId) {
                        this._url = this.sourceUrl + '&ratio=' + this.ratio + '&tilesize=' + this.tilesize + '&clientVersion=' + Custom.Version + '&controlId=' + this.controlId;
                    }

                    this._initContainer();

                    this._levels = {};
                    this._tiles = {};

                    this.gVMapGridUtil.setStyle(this.styleObj);

                    var reqArr = this.gVMapGridUtil.loadStyle('layer');
                    Promise.all(reqArr).then(function () {
                        this._resetView();
                        this._update();
                    }.bind(this));
                },

                addLevels: function addLevels(gLevels) {
                    this.styleObj[gLevels.levelsKey] = gLevels.levelsData;
                },

                redraw: function redraw() {
                    this.gVMapGridUtil.formatStyle(this.styleObj, function () {
                        if (this._map) {
                            this._removeAllTiles();
                            this._update();
                        }
                    });
                    return this;
                }
            });

            module.exports = GDynamicMap;
        }, { "./GVMapGrid": 24, "./draw/GVMapGridUtil": 26 }], 24: [function (require, module, exports) {
            /**
             * Created by kongjian on 2017/9/26.
             * ??????????????????layer
             */
            var GVMapGrid = L.TileLayer.extend({
                //???????????????url??????????????????????????????????????????6????????????????????????
                urlArray: [],
                // ?????????????????????url
                sourceUrl: null,
                // ??????????????????
                textures: {},
                //????????????
                tileQueue: [],
                //????????????
                ratio: 1,
                //??????json??????
                control: null,
                //?????????id
                controlId: null,
                //????????????
                tilesize: 256,
                initialize: function initialize(url, options) {
                    if (window.devicePixelRatio > 1.5) {
                        this.ratio = 2;
                    }

                    if (!this.sourceUrl) {
                        this.sourceUrl = url;
                    }

                    if (options && options.tileSize) {
                        this.tilesize = options.tileSize;
                    }

                    this.gVMapGridUtil = new Custom.GVMapGridUtil();
                    this.gVMapGridUtil.tileSize = this.tilesize;
                    this.gVMapGridUtil.parseUrl(url);

                    this._url = url + '&ratio=' + this.ratio + '&tilesize=' + this.tilesize + '&clientVersion=' + Custom.Version;
                    L.setOptions(this, options);
                    this.hitDetection = options.hitDetection;
                    this.on('tileunload', this._onTileRemove);
                    this.on('tileload', this._onTileLoad);
                    this.on('tileerror', this._onTileError);
                },

                onAdd: function onAdd() {
                    if (this.control) {
                        this._url = this.sourceUrl + '&ratio=' + this.ratio + '&tilesize=' + this.tilesize + '&clientVersion=' + Custom.Version + '&control=' + this.control;
                    }
                    if (this.controlId) {
                        this._url = this.sourceUrl + '&ratio=' + this.ratio + '&tilesize=' + this.tilesize + '&clientVersion=' + Custom.Version + '&controlId=' + this.controlId;
                    }

                    this._initContainer();

                    this._levels = {};
                    this._tiles = {};

                    var reqArr = this.gVMapGridUtil.loadStyle('layer');
                    Promise.all(reqArr).then(function () {
                        this._resetView();
                        this._update();
                    }.bind(this));
                },

                /**
                 * ???????????????????????????
                 */
                createTile: function createTile(coords, done) {
                    //???????????????canvas?????????????????????canvas
                    var tile = this.tileQueue.pop();
                    if (!tile) {
                        tile = this.initTile();
                    } else {
                        this._cleanTile(tile);
                    }

                    var url = this.getTileUrl(coords);

                    Custom.getJSON({ url: url, dataType: 'json' }).then(function (data) {
                        tile.data = data;
                        this._tileOnLoad.apply(this, [done, tile]);
                    }.bind(this), function (error) {
                        this._tileOnError.apply(this, [done, tile, error]);
                    }.bind(this));

                    return tile;
                },

                /**
                 * ??????url?????????
                 */
                getTileUrl: function getTileUrl(coords) {
                    var data = {
                        r: L.Browser.retina ? '@2x' : '',
                        s: this._getSubdomain(coords),
                        x: coords.x,
                        y: coords.y,
                        z: this._getZoomForUrl()
                    };
                    if (this._map && !this._map.options.crs.infinite) {
                        var invertedY = this._globalTileRange.max.y - coords.y;
                        if (this.options.tms) {
                            data['y'] = invertedY;
                        }
                        data['-y'] = invertedY;
                    }

                    if (this.urlArray.length == 0) {
                        return L.Util.template(this._url, L.extend(data, this.options));
                    } else {
                        //???urlArray?????????????????????url
                        var len = this.urlArray.length - 1;
                        var index = Math.round(Math.random() * len);
                        var url = this.urlArray[index];

                        var array = this._url.split('/mapserver');
                        var partUrl = array[1];
                        url = url + '/mapserver' + partUrl;
                        return L.Util.template(url, L.extend(data, this.options));
                    }
                },

                /**
                 *  ?????????canvas
                 */
                initTile: function initTile() {
                    // console.time('initTile');
                    var tile = document.createElement("canvas");
                    tile.style.width = this.tilesize + "px";
                    tile.style.height = this.tilesize + "px";
                    tile.width = this.tilesize;
                    tile.height = this.tilesize;

                    var ctx = tile.getContext("2d", { isQuality: true });
                    tile.ctx = ctx;
                    // console.timeEnd('initTile');
                    return tile;
                },

                //????????????
                _onTileRemove: function _onTileRemove(e) {
                    //?????????????????????
                    this.tileQueue.push(e.tile);
                },

                /**
                 *  ??????????????????????????????
                 */
                _abortLoading: function _abortLoading() {
                    var i, tile;
                    for (i in this._tiles) {
                        if (this._tiles[i].coords.z !== this._tileZoom) {
                            tile = this._tiles[i].el;

                            if (!tile.complete) {
                                L.DomUtil.remove(tile);
                            }
                        }
                    }
                },

                _onTileLoad: function _onTileLoad(item) {
                    var tile = item.tile;
                    this._drawTile(tile, tile.data);
                    tile.complete = true;
                },

                _onTileError: function _onTileError(item) {
                    var tile = item.tile;
                    tile.complete = true;
                    this.tileQueue.push(tile);
                },

                _tileOnError: function _tileOnError(done, tile, e) {
                    done(e, tile);
                },

                _drawTile: function _drawTile(tile, features) {
                    // console.time('_drawTile');
                    var ctx = tile.ctx;
                    var level = Math.floor(this._map.getZoom());
                    var holder = new DataHolder({
                        layerDataMap: features,
                        ctx: ctx,
                        ratio: 1,
                        control: null,
                        textures: this.gVMapGridUtil.textures,
                        extent: {
                            level: level
                        }
                    });
                    this.gVMapGridUtil.styleFun.call({}, holder, level);
                    // console.timeEnd('_drawTile');
                },

                _cleanTile: function _cleanTile(tile) {
                    tile.ctx.clearRect(0, 0, this.tilesize, this.tilesize);
                },

                /**
                 * ??????????????????
                 */
                setFilter: function setFilter(filter) {
                    if (!this._url || !filter || filter.layers.length == 0 && filter.order.length == 0) {
                        return;
                    }

                    this.gVMapGridUtil.setFilter(filter, function (result) {
                        if (result.isIE) {
                            this.controlId = result.id;
                            this.setUrl(this.sourceUrl + '&ratio=' + this.ratio + '&tilesize=' + this.tilesize + '&clientVersion=' + Custom.Version + '&controlId=' + result.id);
                        } else {
                            this.control = result.id;
                            this.setUrl(this.sourceUrl + '&ratio=' + this.ratio + '&tilesize=' + this.tilesize + '&clientVersion=' + Custom.Version + '&control=' + result.id);
                        }
                    }.bind(this));
                },

                /**
                 * ??????????????????????????????????????????
                 * Parameters :
                 * x -
                 * y -
                 * callback - ???????????????????????????
                 */
                getFeatureByXY: function getFeatureByXY(x, y, callback) {
                    var latLng = this._map.containerPointToLatLng(new L.point(x, y));
                    this.getFeatureByLonlat(latLng, callback);
                },

                /**
                 * ??????????????????????????????????????????
                 * Parameters :
                 * lonlat - ??????????????????
                 * callback - ???????????????????????????
                 */
                getFeatureByLonlat: function getFeatureByLonlat(latLng, callback) {
                    var maxBounds = this._map.options.crs.projection.bounds;
                    //??????????????????
                    var bounds = this._map.getBounds();
                    var pBounds = this._map.getPixelBounds();
                    //?????????????????????
                    var res = (bounds._northEast.lat - bounds._southWest.lat) / (pBounds.max.y - pBounds.min.y);

                    var tileSize = this.options.tileSize;
                    var row = (maxBounds.max.y - latLng.lat) / (res * tileSize);
                    var col = (latLng.lng - maxBounds.min.x) / (res * tileSize);

                    var level = this._map.getZoom();
                    var tx = (col - Math.floor(col)) * tileSize;
                    var ty = (row - Math.floor(row)) * tileSize;

                    this.gVMapGridUtil.pickupFeatures(row, col, level, tx, ty, this.control, this.controlId, function (features) {
                        callback(features);
                    });
                },

                /**
                 * ?????????????????????????????????
                 * Parameters :
                 * layerFeatures - ????????????
                 * style - ???????????? ??????{color:"red",opacity:0.8};
                 */
                highlightFeatures: function highlightFeatures(layerFeatures, style) {
                    //???????????????????????????
                    var filter = this.gVMapGridUtil.CreateHighlightFilter(layerFeatures, style);
                    //??????????????????????????????
                    if (filter.layers.length == 0) {
                        return;
                    }

                    style.color = style.color.replace('#', '%23');
                    if (!this.highlightLayer) {
                        //??????????????????
                        var url = this.gVMapGridUtil.host + '/mapserver/vmap/' + this.gVMapGridUtil.servername + '/getMAP?x={x}&y={y}&l={z}' + '&styleId=' + this.gVMapGridUtil.styleId;
                        if (this.control) {
                            url = url + '&control=' + this.control;
                        }
                        if (this.controlId) {
                            url = url + '&controlId=' + this.controlId;
                        }

                        this.highlightLayer = new L.GXYZ(url, this.options);
                        this._map.addLayer(this.highlightLayer);
                    }

                    this.highlightLayer.options.opacity = style.opacity;
                    this.highlightLayer._updateOpacity();
                    //????????????????????????
                    this.highlightLayer.setFilter(filter);
                    //?????????????????????index
                    var index = this.options.zIndex;
                    //?????????????????????????????????????????????
                    this.highlightLayer.setZIndex(index + 1);
                },

                /**
                 * ????????????
                 */
                cancelHighlight: function cancelHighlight() {
                    if (this.highlightLayer) {
                        this._map.removeLayer(this.highlightLayer);
                        this.highlightLayer = null;
                    }
                }
            });
            module.exports = GVMapGrid;
        }, {}], 25: [function (require, module, exports) {
            /**
             * Created by kongjian on 2017/7/3.
             * ??????????????????layer
             */
            var GXYZUtil = require('./draw/GXYZUtil');
            var Version = require('../../ext/Version');
            var GXYZ = L.TileLayer.extend({
                //???????????????url??????????????????????????????????????????6????????????????????????
                urlArray: [],
                // ?????????????????????url
                sourceUrl: null,
                //?????????????????????????????????????????????????????????????????????
                gxyzUtil: null,
                //????????????
                highlightLayer: null,
                //????????????
                ratio: 1,
                //??????json??????
                control: null,
                //?????????id
                controlId: null,
                //????????????
                tilesize: 256,
                initialize: function initialize(url, options) {
                    if (window.devicePixelRatio > 1.5) {
                        this.ratio = 2;
                    }

                    if (!this.sourceUrl) {
                        this.sourceUrl = url;
                    }

                    if (options && options.tileSize) {
                        this.tilesize = options.tileSize;
                    }

                    this.gxyzUtil = new GXYZUtil();
                    this.gxyzUtil.tileSize = this.tilesize;
                    this.gxyzUtil.parseUrl(url);

                    this._url = url + '&ratio=' + this.ratio + '&tilesize=' + this.tilesize + '&clientVersion=' + Version;
                    L.setOptions(this, options);
                },

                onAdd: function onAdd() {
                    if (this.control) {
                        this._url = this.sourceUrl + '&ratio=' + this.ratio + '&tilesize=' + this.tilesize + '&clientVersion=' + Version + '&control=' + this.control;
                    }
                    if (this.controlId) {
                        this._url = this.sourceUrl + '&ratio=' + this.ratio + '&tilesize=' + this.tilesize + '&clientVersion=' + Version + '&controlId=' + this.controlId;
                    }

                    this._initContainer();

                    this._levels = {};
                    this._tiles = {};

                    this._resetView();
                    this._update();
                },

                /**
                 * ??????url?????????
                 */
                getTileUrl: function getTileUrl(coords) {
                    var data = {
                        r: L.Browser.retina ? '@2x' : '',
                        s: this._getSubdomain(coords),
                        x: coords.x,
                        y: coords.y,
                        z: this._getZoomForUrl()
                    };
                    if (this._map && !this._map.options.crs.infinite) {
                        var invertedY = this._globalTileRange.max.y - coords.y;
                        if (this.options.tms) {
                            data['y'] = invertedY;
                        }
                        data['-y'] = invertedY;
                    }

                    if (this.urlArray.length == 0) {
                        return L.Util.template(this._url, L.extend(data, this.options));
                    } else {
                        //???urlArray?????????????????????url
                        var len = this.urlArray.length - 1;
                        var index = Math.round(Math.random() * len);
                        var url = this.urlArray[index];

                        var array = this._url.split('/mapserver');
                        var partUrl = array[1];
                        url = url + '/mapserver' + partUrl;
                        return L.Util.template(url, L.extend(data, this.options));
                    }
                },

                /**
                 * ??????????????????
                 */
                setFilter: function setFilter(filter) {
                    if (!this._url || !filter || filter.layers.length == 0 && filter.order.length == 0) {
                        return;
                    }

                    this.gxyzUtil.setFilter(filter, function (result) {
                        if (result.isIE) {
                            this.controlId = result.id;
                            this.setUrl(this.sourceUrl + '&ratio=' + this.ratio + '&tilesize=' + this.tilesize + '&clientVersion=' + Version + '&controlId=' + result.id);
                        } else {
                            this.control = result.id;
                            this.setUrl(this.sourceUrl + '&ratio=' + this.ratio + '&tilesize=' + this.tilesize + '&clientVersion=' + Version + '&control=' + result.id);
                        }
                    }.bind(this));
                },

                /**
                 * ??????????????????????????????????????????
                 * Parameters :
                 * x -
                 * y -
                 * callback - ???????????????????????????
                 */
                getFeatureByXY: function getFeatureByXY(x, y, callback) {
                    var latLng = this._map.containerPointToLatLng(new L.point(x, y));
                    this.getFeatureByLonlat(latLng, callback);
                },

                /**
                 * ??????????????????????????????????????????
                 * Parameters :
                 * lonlat - ??????????????????
                 * callback - ???????????????????????????
                 */
                getFeatureByLonlat: function getFeatureByLonlat(latLng, callback) {
                    var maxBounds = this._map.options.crs.projection.bounds;
                    //??????????????????
                    var bounds = this._map.getBounds();
                    var pBounds = this._map.getPixelBounds();
                    //?????????????????????
                    var res = (bounds._northEast.lat - bounds._southWest.lat) / (pBounds.max.y - pBounds.min.y);

                    var tileSize = this.options.tileSize;
                    var row = (maxBounds.max.y - latLng.lat) / (res * tileSize);
                    var col = (latLng.lng - maxBounds.min.x) / (res * tileSize);

                    var level = this._map.getZoom();
                    var tx = (col - Math.floor(col)) * tileSize;
                    var ty = (row - Math.floor(row)) * tileSize;

                    this.gxyzUtil.pickupFeatures(row, col, level, tx, ty, this.control, this.controlId, function (features) {
                        callback(features);
                    });
                },

                /**
                 * ?????????????????????????????????
                 * Parameters :
                 * layerFeatures - ??????map??????
                 * style - ???????????? ??????{color:"red",opacity:0.8};
                 */
                highlightFeatures: function highlightFeatures(layerFeatures, style) {
                    //???????????????????????????
                    var filter = this.gxyzUtil.CreateHighlightFilter(layerFeatures, style);
                    //??????????????????????????????
                    if (filter.layers.length == 0) {
                        return;
                    }

                    style.color = style.color.replace('#', '%23');
                    if (!this.highlightLayer) {
                        //??????????????????
                        this.highlightLayer = new L.GXYZ(this.sourceUrl, this.options);
                        this._map.addLayer(this.highlightLayer);
                    }

                    this.highlightLayer.options.opacity = style.opacity;
                    this.highlightLayer._updateOpacity();
                    //????????????????????????
                    this.highlightLayer.setFilter(filter);
                    //?????????????????????index
                    var index = this.options.zIndex;
                    //?????????????????????????????????????????????
                    this.highlightLayer.setZIndex(index + 1);
                },

                /**
                 * ???????????????????????????????????????????????????????????????????????????
                 * Parameters :
                 * layerFeatures - ??????map??????
                 * opacity - ?????????????????????????????????????????????????????????????????????;
                 */
                highlightEveryFeatures: function highlightEveryFeatures(layerFeatures, opacity) {
                    //???????????????????????????
                    var filter = this.gxyzUtil.CreateEveryHighlightFilter(layerFeatures);
                    //??????????????????????????????
                    if (filter.layers.length == 0) {
                        return;
                    }

                    if (!this.highlightLayer) {
                        //??????????????????
                        this.highlightLayer = new L.GXYZ(this.sourceUrl, this.options);
                        this._map.addLayer(this.highlightLayer);
                    }

                    this.highlightLayer.options.opacity = opacity;
                    this.highlightLayer._updateOpacity();
                    //????????????????????????
                    this.highlightLayer.setFilter(filter);
                    //?????????????????????index
                    var index = this.options.zIndex;
                    //?????????????????????????????????????????????
                    this.highlightLayer.setZIndex(index + 1);
                },

                /**
                 * ????????????
                 */
                cancelHighlight: function cancelHighlight() {
                    if (this.highlightLayer) {
                        this._map.removeLayer(this.highlightLayer);
                        this.highlightLayer = null;
                    }
                }
            });

            module.exports = GXYZ;
        }, { "../../ext/Version": 3, "./draw/GXYZUtil": 27 }], 26: [function (require, module, exports) {
            /**
             * Created by kongjian on 2017/6/26.
             */
            var GXYZUtil = require('./GXYZUtil');

            var _require3 = require('./../../../utils/es6-promise'),
                Deferred = _require3.Deferred,
                getJSON = _require3.getJSON;

            var GVMapGridUtil = function (_GXYZUtil) {
                _inherits(GVMapGridUtil, _GXYZUtil);

                function GVMapGridUtil(isDynamicMap) {
                    _classCallCheck(this, GVMapGridUtil);

                    //??????
                    var _this5 = _possibleConstructorReturn(this, _GXYZUtil.call(this));

                    _this5.textures = {};

                    _this5.isDynamicMap = isDynamicMap;

                    _this5.styleObj = {};
                    return _this5;
                }

                /**
                 * ??????????????????
                 */


                GVMapGridUtil.prototype.setStyle = function setStyle(styleObj) {
                    this.styleObj = styleObj;
                    // this.styleFun = new Function("drawer","level", styleStr);
                    // if(this.styleDef){
                    //     this.styleDef.resolve();
                    // }
                };

                GVMapGridUtil.prototype.formatStyle = function formatStyle(styleObj, successFun) {
                    this.styleObj = styleObj;
                    var styleJson = JSON.stringify(this.styleObj);
                    getJSON({ type: 'post', url: this.host + '/mapserver/styleInfo/format.do',
                        data: 'styleJson= ' + styleJson,
                        dataType: 'json' }).then(function (result) {
                        this.styleFun = new Function("drawer", "level", result.styleJs);
                        successFun();
                    }.bind(this));
                };

                /**
                 * ?????????????????????????????????
                 */


                GVMapGridUtil.prototype.loadStyle = function loadStyle(styleType) {
                    var def1 = new Deferred();
                    var def2 = new Deferred();

                    if (!styleType) {
                        styleType = 'label';
                    }

                    if (this.isDynamicMap) {
                        var styleJson = JSON.stringify(this.styleObj);
                        getJSON({ type: 'post', url: 'http://127.0.0.1/mapserver/styleInfo/format.do',
                            data: 'styleJson= ' + styleJson,
                            dataType: 'json' }).then(function (result) {
                            this.styleFun = new Function("drawer", "level", result.styleJs);
                            def1.resolve();
                        }.bind(this));
                    } else {
                        //??????????????????
                        getJSON({ url: this.host + '/mapserver/styleInfo/' + this.servername + '/' + this.styleId + '/' + styleType + '/style.js', dataType: 'text' }).then(function (result) {
                            this.styleFun = new Function("drawer", "level", result);
                            def1.resolve();
                        }.bind(this));
                    }

                    //??????????????????
                    getJSON({ url: this.host + '/mapserver/styleInfo/' + this.servername + '/' + this.styleId + '/label/texture.js', dataType: 'text' }).then(function (result) {
                        var textures = JSON.parse(result);
                        var totalCount = 0;
                        for (var i in textures) {
                            totalCount++;
                        }

                        if (totalCount == 0) {
                            def2.resolve();
                            return;
                        }

                        var count = 0;
                        for (var key in textures) {
                            var img = new Image();
                            img.name = key;
                            img.onload = function (data) {
                                count++;
                                var name = data.target.name;
                                this.textures[name] = data.target;
                                if (count == totalCount) {
                                    def2.resolve();
                                }
                            }.bind(this);
                            img.src = textures[key];
                        }
                    }.bind(this));

                    return [def1, def2];
                };

                return GVMapGridUtil;
            }(GXYZUtil);

            module.exports = GVMapGridUtil;
        }, { "./../../../utils/es6-promise": 33, "./GXYZUtil": 27 }], 27: [function (require, module, exports) {
            /**
             * Created by kongjian on 2017/6/26.
             */
            var _require4 = require('./../../../utils/es6-promise'),
                getJSON = _require4.getJSON;

            var Filter = require('./../../../filter/Filter');
            var FilterLayer = require('./../../../filter/FilterLayer');
            var Version = require('../../../ext/Version');

            var GXYZUtil = function () {
                function GXYZUtil() {
                    _classCallCheck(this, GXYZUtil);

                    this.tileSize = 256;
                }

                /**
                 * ??????????????????
                 */


                GXYZUtil.prototype.setFilter = function setFilter(filter, callback) {
                    for (var i = 0; i < filter.layers.length; i++) {
                        var filterLayer = filter.layers[i];
                        if (!filterLayer.id) {
                            filter.layers.splice(i, 1);
                        }
                    }

                    var control = JSON.stringify(filter);
                    if (this.isIE()) {
                        //??????????????????
                        getJSON({ type: 'post', url: this.host + '/mapserver/vmap/' + this.servername + '/setControl',
                            data: 'control= ' + control,
                            dataType: 'json' }).then(function (result) {
                            result.isIE = true;
                            callback(result);
                        }.bind(this));
                    } else {
                        var result = { isIE: false, id: control };
                        callback(result);
                    }
                };

                /**
                 * ??????url
                 */
                GXYZUtil.prototype.parseUrl = function parseUrl(url) {
                    var urlParts = url.split('?');
                    // var urlPartOne = urlParts[0].split('/mapserver/vmap/');
                    var urlPartOne = urlParts[0].split('/mapserver/');
                    this.host = urlPartOne[0];
                    this.servername = urlPartOne[1].split('/')[1];
                    var params = urlParts[1].split('&');
                    for (var i = 0; i < params.length; i++) {
                        var param = params[i];
                        var keyValue = param.split('=');
                        if (keyValue[0] == 'styleId') {
                            this.styleId = keyValue[1];
                            return;
                        }
                    }
                };

                /**
                 * ????????????
                 * Parameters :
                 * row - ??????????????????????????????
                 * col - ??????????????????????????????
                 * level - ?????????????????????????????????
                 * x - ????????????????????????????????????x??????
                 * y - ?????????????????????????????????y??????
                 * control - ?????????json??????
                 * controlId - ?????????????????????????????????key
                 * callback - ?????????????????????????????????
                 */
                GXYZUtil.prototype.pickupFeatures = function pickupFeatures(row, col, level, x, y, control, controlId, callback) {
                    var url = this.host + '/mapserver/pickup/' + this.servername + '/getData?x=' + col + '&y=' + row + '&l=' + level + '&pixelX=' + x + '&pixelY=' + y + '&styleId=' + this.styleId + '&tilesize=' + this.tileSize + '&clientVersion=' + Version;
                    if (control) {
                        url = url + '&control=' + control;
                    }
                    if (controlId) {
                        url = url + '&controlId=' + controlId;
                    }

                    getJSON({
                        url: url,
                        dataType: "json" }).then(function (features) {
                        callback(features);
                    }, function () {
                        callback([]);
                    });
                };

                /**
                 * ???????????????filter
                 * Parameters :
                 * features - ????????????
                 * style - ???????????? ??????{color:"red",opacity:0.8};
                 */
                GXYZUtil.prototype.CreateHighlightFilter = function CreateHighlightFilter(layerFeatures, style) {
                    var filter = new Filter();
                    filter.otherDisplay = false;

                    for (var layerId in layerFeatures) {
                        var fs = layerFeatures[layerId];
                        var hasFid = false;
                        for (var fid in fs) {
                            var filterLayer = new FilterLayer();
                            filterLayer.id = layerId;
                            filterLayer.idFilter = fid;
                            filterLayer.color = style;
                            filter.addFilterLayer(filterLayer);
                            hasFid = true;
                        }
                        if (!hasFid) {
                            var filterLayer = new FilterLayer();
                            filterLayer.id = layerId;
                            filterLayer.color = style;
                            filter.addFilterLayer(filterLayer);
                        }
                    }
                    return filter;
                };

                /**
                 * ???????????????filter,??????????????????????????????
                 * Parameters :
                 * layerFeatures - ????????????
                 */
                GXYZUtil.prototype.CreateEveryHighlightFilter = function CreateEveryHighlightFilter(layerFeatures) {
                    var filter = new Filter();
                    filter.otherDisplay = false;

                    for (var layerId in layerFeatures) {
                        var fs = layerFeatures[layerId];
                        var layerStyle = fs.style;
                        var hasFid = false;
                        for (var fid in fs) {
                            var style = fs[fid].style;
                            style.color = style.color.replace('#', '%23');
                            var filterLayer = new FilterLayer();
                            filterLayer.id = layerId;
                            filterLayer.idFilter = fid;
                            filterLayer.color = style;
                            filter.addFilterLayer(filterLayer);
                            hasFid = true;
                        }
                        if (!hasFid && layerStyle) {
                            layerStyle.color = layerStyle.color.replace('#', '%23');
                            var filterLayer = new FilterLayer();
                            filterLayer.id = layerId;
                            filterLayer.color = layerStyle;
                            filter.addFilterLayer(filterLayer);
                        }
                    }
                    return filter;
                };

                /**
                 * ?????????ie?????????
                 */
                GXYZUtil.prototype.isIE = function isIE() {
                    if (!!window.ActiveXObject || "ActiveXObject" in window) return true;else return false;
                };

                return GXYZUtil;
            }();

            module.exports = GXYZUtil;
        }, { "../../../ext/Version": 3, "./../../../filter/Filter": 4, "./../../../filter/FilterLayer": 5, "./../../../utils/es6-promise": 33 }], 28: [function (require, module, exports) {
            var GGroup = function () {
                function GGroup(groupName) {
                    _classCallCheck(this, GGroup);

                    this.group = {};
                    this.group.id = groupName;
                    this.group.type = 'group';
                    this.group.children = [];
                }

                /**
                 * ????????????
                 * Parameters : gStyleItem  GStyleItem????????????
                 */


                GGroup.prototype.addStyle = function addStyle(gStyleItem) {
                    this.group.children.push(gStyleItem.style);
                };

                return GGroup;
            }();

            module.exports = GGroup;
        }, {}], 29: [function (require, module, exports) {
            var GLevels = function () {
                function GLevels(startLevel, endLevel) {
                    _classCallCheck(this, GLevels);

                    this.levelsData = [];
                    this.levelsKey = startLevel + '-' + endLevel;
                }

                /**
                 * ?????????
                 * Parameters : gGroup  GGroup????????????
                 */


                GLevels.prototype.addGroup = function addGroup(gGroup) {
                    this.levelsData.push(gGroup.group);
                };

                /**
                 * ?????????
                 * Parameters : gGroup  GGroup????????????
                 */


                GLevels.prototype.addStyleItem = function addStyleItem(gStyleItem) {
                    this.levelsData.push(gStyleItem.style);
                };

                return GLevels;
            }();

            module.exports = GLevels;
        }, {}], 30: [function (require, module, exports) {
            var GStyleItem = function () {
                function GStyleItem(styleId, layerId) {
                    _classCallCheck(this, GStyleItem);

                    this.style = {};
                    this.style.id = styleId;
                    this.style.layer = layerId;
                    this.style.type = 'style';
                    this.style.children = [];
                }

                /**
                 * ??????sql????????????
                 * Parameters : sqlFilter  ????????? fcode  = "2602000500" or fcode  = "2507000500"
                 *  fileds ????????? {"gid":{"name":"gid","type":"String"}}
                 */


                GStyleItem.prototype.queryFilter = function queryFilter(sqlFilter, fileds) {
                    if (sqlFilter) {
                        this.style.query = sqlFilter;
                        this.style.fields = fileds;
                    } else {
                        this.style.query = '';
                    }
                };

                /**
                 * ????????????
                 * Parameters : styleArr  ?????????[{
                *			"text": "??????",
                *			"name": "??????",
                *			"filter": "fcode  = \"6302011314\"",
                *			"query": "Q_fcode_S_EQ=6302011314",
                *			"isleaf": true,
                *			"type": "style",
                *			"iconCls": "icon-line",
                *			"id": "11_?????????_??????",
                *			"style": [{
                *				"stroke": false,
                *				"strokeWidth": 0,
                *				"strokeColor": "#ED22AB",
                *				"strokeOpacity": 1,
                *				"dash": null,
                *				"lineCap": "butt",
                *				"lineJoin": "miter",
                * 				"sparsity": 1
                *			}]
                 */


                GStyleItem.prototype.setStyle = function setStyle(styleArr) {
                    this.style.style = styleArr;
                };

                /**
                 * ???????????????
                 * Parameters : gStyleItem  GStyleItem????????????
                 */


                GStyleItem.prototype.addSubStyle = function addSubStyle(gStyleItem) {
                    this.style.children.push(gStyleItem.style);
                };

                return GStyleItem;
            }();

            module.exports = GStyleItem;
        }, {}], 31: [function (require, module, exports) {
            /**
             * Created by kongjian on 2018/6/12.
             * ?????????????????????????????????
             */
            var Cache = function () {
                function Cache(size) {
                    _classCallCheck(this, Cache);

                    this.size = size;
                    this.map = {};
                    this.list = [];
                }

                //????????????????????????


                Cache.prototype.push = function push(key, item) {
                    if (this.list.length > this.size - 1) {
                        var removeKey = this.list.shift();
                        delete this.map[removeKey];
                    }
                    this.list.push(key);
                    this.map[key] = item;
                };

                //??????????????????


                Cache.prototype.getItem = function getItem(key) {
                    return this.map[key];
                };

                //????????????


                Cache.prototype.clean = function clean() {
                    this.map = {};
                    this.list = [];
                };

                //?????????????????????


                Cache.prototype.length = function length() {
                    return this.list.length;
                };

                return Cache;
            }();

            module.exports = Cache;
        }, {}], 32: [function (require, module, exports) {
            function UUID() {
                this.id = this.createUUID();
            }
            UUID.prototype.valueOf = function () {
                return this.id;
            };
            UUID.prototype.toString = function () {
                return this.id;
            };
            UUID.prototype.createUUID = function () {
                var c = new Date(1582, 10, 15, 0, 0, 0, 0);
                var f = new Date();
                var h = f.getTime() - c.getTime();
                var i = UUID.getIntegerBits(h, 0, 31);
                var g = UUID.getIntegerBits(h, 32, 47);
                var e = UUID.getIntegerBits(h, 48, 59) + "2";
                var b = UUID.getIntegerBits(UUID.rand(4095), 0, 7);
                var d = UUID.getIntegerBits(UUID.rand(4095), 0, 7);
                var a = UUID.getIntegerBits(UUID.rand(8191), 0, 7) + UUID.getIntegerBits(UUID.rand(8191), 8, 15) + UUID.getIntegerBits(UUID.rand(8191), 0, 7) + UUID.getIntegerBits(UUID.rand(8191), 8, 15) + UUID.getIntegerBits(UUID.rand(8191), 0, 15);
                return i + g + e + b + d + a;
            };
            UUID.getIntegerBits = function (f, g, b) {
                var a = UUID.returnBase(f, 16);
                var d = new Array();
                var e = "";
                var c = 0;
                for (c = 0; c < a.length; c++) {
                    d.push(a.substring(c, c + 1));
                }
                for (c = Math.floor(g / 4); c <= Math.floor(b / 4); c++) {
                    if (!d[c] || d[c] == "") {
                        e += "0";
                    } else {
                        e += d[c];
                    }
                }
                return e;
            };
            UUID.returnBase = function (c, d) {
                var e = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
                if (c < d) {
                    var b = e[c];
                } else {
                    var f = "" + Math.floor(c / d);
                    var a = c - f * d;
                    if (f >= d) {
                        var b = this.returnBase(f, d) + e[a];
                    } else {
                        var b = e[f] + e[a];
                    }
                }
                return b;
            };
            UUID.rand = function (a) {
                return Math.floor(Math.random() * a);
            };

            module.exports = UUID;
        }, {}], 33: [function (require, module, exports) {
            (function (process, global) {
                /*!
                 * @overview es6-promise - a tiny implementation of Promises/A+.
                 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
                 * @license   Licensed under MIT license
                 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
                 * @version   4.1.0+f046478d
                 */

                function promiseFun() {
                    function objectOrFunction(x) {
                        var type = typeof x === "undefined" ? "undefined" : _typeof(x);
                        return x !== null && (type === 'object' || type === 'function');
                    }

                    function isFunction(x) {
                        return typeof x === 'function';
                    }

                    var _isArray = undefined;
                    if (Array.isArray) {
                        _isArray = Array.isArray;
                    } else {
                        _isArray = function _isArray(x) {
                            return Object.prototype.toString.call(x) === '[object Array]';
                        };
                    }

                    var isArray = _isArray;

                    var len = 0;
                    var vertxNext = undefined;
                    var customSchedulerFn = undefined;

                    var asap = function asap(callback, arg) {
                        queue[len] = callback;
                        queue[len + 1] = arg;
                        len += 2;
                        if (len === 2) {
                            // If len is 2, that means that we need to schedule an async flush.
                            // If additional callbacks are queued before the queue is flushed, they
                            // will be processed by this flush that we are scheduling.
                            if (customSchedulerFn) {
                                customSchedulerFn(flush);
                            } else {
                                scheduleFlush();
                            }
                        }
                    };

                    function setScheduler(scheduleFn) {
                        customSchedulerFn = scheduleFn;
                    }

                    function setAsap(asapFn) {
                        asap = asapFn;
                    }

                    var browserWindow = typeof window !== 'undefined' ? window : undefined;
                    var browserGlobal = browserWindow || {};
                    var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
                    var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

                    // test for web worker but not in IE10
                    var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

                    // node
                    function useNextTick() {
                        // node version 0.10.x displays a deprecation warning when nextTick is used recursively
                        // see https://github.com/cujojs/when/issues/410 for details
                        return function () {
                            return process.nextTick(flush);
                        };
                    }

                    // vertx
                    function useVertxTimer() {
                        if (typeof vertxNext !== 'undefined') {
                            return function () {
                                vertxNext(flush);
                            };
                        }

                        return useSetTimeout();
                    }

                    function useMutationObserver() {
                        var iterations = 0;
                        var observer = new BrowserMutationObserver(flush);
                        var node = document.createTextNode('');
                        observer.observe(node, { characterData: true });

                        return function () {
                            node.data = iterations = ++iterations % 2;
                        };
                    }

                    // web worker
                    function useMessageChannel() {
                        var channel = new MessageChannel();
                        channel.port1.onmessage = flush;
                        return function () {
                            return channel.port2.postMessage(0);
                        };
                    }

                    function useSetTimeout() {
                        // Store setTimeout reference so es6-promise will be unaffected by
                        // other code modifying setTimeout (like sinon.useFakeTimers())
                        var globalSetTimeout = setTimeout;
                        return function () {
                            return globalSetTimeout(flush, 1);
                        };
                    }

                    var queue = new Array(1000);
                    function flush() {
                        for (var i = 0; i < len; i += 2) {
                            var callback = queue[i];
                            var arg = queue[i + 1];

                            callback(arg);

                            queue[i] = undefined;
                            queue[i + 1] = undefined;
                        }

                        len = 0;
                    }

                    function attemptVertx() {
                        try {
                            var r = require;
                            var vertx = r('vertx');
                            vertxNext = vertx.runOnLoop || vertx.runOnContext;
                            return useVertxTimer();
                        } catch (e) {
                            return useSetTimeout();
                        }
                    }

                    var scheduleFlush = undefined;
                    // Decide what async method to use to triggering processing of queued callbacks:
                    if (isNode) {
                        scheduleFlush = useNextTick();
                    } else if (BrowserMutationObserver) {
                        scheduleFlush = useMutationObserver();
                    } else if (isWorker) {
                        scheduleFlush = useMessageChannel();
                    } else if (browserWindow === undefined && typeof require === 'function') {
                        scheduleFlush = attemptVertx();
                    } else {
                        scheduleFlush = useSetTimeout();
                    }

                    function then(onFulfillment, onRejection) {
                        var _arguments = arguments;

                        var parent = this;

                        var child = new this.constructor(noop);

                        if (child[PROMISE_ID] === undefined) {
                            makePromise(child);
                        }

                        var _state = parent._state;

                        if (_state) {
                            (function () {
                                var callback = _arguments[_state - 1];
                                asap(function () {
                                    return invokeCallback(_state, child, callback, parent._result);
                                });
                            })();
                        } else {
                            subscribe(parent, child, onFulfillment, onRejection);
                        }

                        return child;
                    }

                    /**
                     @method resolve
                     @static
                     @param {Any} value value that the returned promise will be resolved with
                     Useful for tooling.
                     @return {Promise} a promise that will become fulfilled with the given
                     `value`
                     */
                    function resolve$1(object) {
                        /*jshint validthis:true */
                        var Constructor = this;

                        if (object && (typeof object === "undefined" ? "undefined" : _typeof(object)) === 'object' && object.constructor === Constructor) {
                            return object;
                        }

                        var promise = new Constructor(noop);
                        resolve(promise, object);
                        return promise;
                    }

                    var PROMISE_ID = Math.random().toString(36).substring(16);

                    function noop() {}

                    var PENDING = void 0;
                    var FULFILLED = 1;
                    var REJECTED = 2;

                    var GET_THEN_ERROR = new ErrorObject();

                    function selfFulfillment() {
                        return new TypeError("You cannot resolve a promise with itself");
                    }

                    function cannotReturnOwn() {
                        return new TypeError('A promises callback cannot return that same promise.');
                    }

                    function getThen(promise) {
                        try {
                            return promise.then;
                        } catch (error) {
                            GET_THEN_ERROR.error = error;
                            return GET_THEN_ERROR;
                        }
                    }

                    function tryThen(then$$1, value, fulfillmentHandler, rejectionHandler) {
                        try {
                            then$$1.call(value, fulfillmentHandler, rejectionHandler);
                        } catch (e) {
                            return e;
                        }
                    }

                    function handleForeignThenable(promise, thenable, then$$1) {
                        asap(function (promise) {
                            var sealed = false;
                            var error = tryThen(then$$1, thenable, function (value) {
                                if (sealed) {
                                    return;
                                }
                                sealed = true;
                                if (thenable !== value) {
                                    resolve(promise, value);
                                } else {
                                    fulfill(promise, value);
                                }
                            }, function (reason) {
                                if (sealed) {
                                    return;
                                }
                                sealed = true;

                                reject(promise, reason);
                            }, 'Settle: ' + (promise._label || ' unknown promise'));

                            if (!sealed && error) {
                                sealed = true;
                                reject(promise, error);
                            }
                        }, promise);
                    }

                    function handleOwnThenable(promise, thenable) {
                        if (thenable._state === FULFILLED) {
                            fulfill(promise, thenable._result);
                        } else if (thenable._state === REJECTED) {
                            reject(promise, thenable._result);
                        } else {
                            subscribe(thenable, undefined, function (value) {
                                return resolve(promise, value);
                            }, function (reason) {
                                return reject(promise, reason);
                            });
                        }
                    }

                    function handleMaybeThenable(promise, maybeThenable, then$$1) {
                        if (maybeThenable.constructor === promise.constructor && then$$1 === then && maybeThenable.constructor.resolve === resolve$1) {
                            handleOwnThenable(promise, maybeThenable);
                        } else {
                            if (then$$1 === GET_THEN_ERROR) {
                                reject(promise, GET_THEN_ERROR.error);
                                GET_THEN_ERROR.error = null;
                            } else if (then$$1 === undefined) {
                                fulfill(promise, maybeThenable);
                            } else if (isFunction(then$$1)) {
                                handleForeignThenable(promise, maybeThenable, then$$1);
                            } else {
                                fulfill(promise, maybeThenable);
                            }
                        }
                    }

                    function resolve(promise, value) {
                        if (promise === value) {
                            reject(promise, selfFulfillment());
                        } else if (objectOrFunction(value)) {
                            handleMaybeThenable(promise, value, getThen(value));
                        } else {
                            fulfill(promise, value);
                        }
                    }

                    function publishRejection(promise) {
                        if (promise._onerror) {
                            promise._onerror(promise._result);
                        }

                        publish(promise);
                    }

                    function fulfill(promise, value) {
                        if (promise._state !== PENDING) {
                            return;
                        }

                        promise._result = value;
                        promise._state = FULFILLED;

                        if (promise._subscribers.length !== 0) {
                            asap(publish, promise);
                        }
                    }

                    function reject(promise, reason) {
                        if (promise._state !== PENDING) {
                            return;
                        }
                        promise._state = REJECTED;
                        promise._result = reason;

                        asap(publishRejection, promise);
                    }

                    function subscribe(parent, child, onFulfillment, onRejection) {
                        var _subscribers = parent._subscribers;
                        var length = _subscribers.length;

                        parent._onerror = null;

                        _subscribers[length] = child;
                        _subscribers[length + FULFILLED] = onFulfillment;
                        _subscribers[length + REJECTED] = onRejection;

                        if (length === 0 && parent._state) {
                            asap(publish, parent);
                        }
                    }

                    function publish(promise) {
                        var subscribers = promise._subscribers;
                        var settled = promise._state;

                        if (subscribers.length === 0) {
                            return;
                        }

                        var child = undefined,
                            callback = undefined,
                            detail = promise._result;

                        for (var i = 0; i < subscribers.length; i += 3) {
                            child = subscribers[i];
                            callback = subscribers[i + settled];

                            if (child) {
                                invokeCallback(settled, child, callback, detail);
                            } else {
                                callback(detail);
                            }
                        }

                        promise._subscribers.length = 0;
                    }

                    function ErrorObject() {
                        this.error = null;
                    }

                    var TRY_CATCH_ERROR = new ErrorObject();

                    function tryCatch(callback, detail) {
                        // try {
                        return callback(detail);
                        // } catch (e) {
                        //     TRY_CATCH_ERROR.error = e;
                        //     return TRY_CATCH_ERROR;
                        // }
                    }

                    function invokeCallback(settled, promise, callback, detail) {
                        var hasCallback = isFunction(callback),
                            value = undefined,
                            error = undefined,
                            succeeded = undefined,
                            failed = undefined;

                        if (hasCallback) {
                            value = tryCatch(callback, detail);

                            if (value === TRY_CATCH_ERROR) {
                                failed = true;
                                error = value.error;
                                value.error = null;
                            } else {
                                succeeded = true;
                            }

                            if (promise === value) {
                                reject(promise, cannotReturnOwn());
                                return;
                            }
                        } else {
                            value = detail;
                            succeeded = true;
                        }

                        if (promise._state !== PENDING) {
                            // noop
                        } else if (hasCallback && succeeded) {
                            resolve(promise, value);
                        } else if (failed) {
                            reject(promise, error);
                        } else if (settled === FULFILLED) {
                            fulfill(promise, value);
                        } else if (settled === REJECTED) {
                            reject(promise, value);
                        }
                    }

                    function initializePromise(promise, resolver) {
                        try {
                            resolver(function resolvePromise(value) {
                                resolve(promise, value);
                            }, function rejectPromise(reason) {
                                reject(promise, reason);
                            });
                        } catch (e) {
                            reject(promise, e);
                        }
                    }

                    var id = 0;
                    function nextId() {
                        return id++;
                    }

                    function makePromise(promise) {
                        promise[PROMISE_ID] = id++;
                        promise._state = undefined;
                        promise._result = undefined;
                        promise._subscribers = [];
                    }

                    function Enumerator$1(Constructor, input) {
                        this._instanceConstructor = Constructor;
                        this.promise = new Constructor(noop);

                        if (!this.promise[PROMISE_ID]) {
                            makePromise(this.promise);
                        }

                        if (isArray(input)) {
                            this.length = input.length;
                            this._remaining = input.length;

                            this._result = new Array(this.length);

                            if (this.length === 0) {
                                fulfill(this.promise, this._result);
                            } else {
                                this.length = this.length || 0;
                                this._enumerate(input);
                                if (this._remaining === 0) {
                                    fulfill(this.promise, this._result);
                                }
                            }
                        } else {
                            reject(this.promise, validationError());
                        }
                    }

                    function validationError() {
                        return new Error('Array Methods must be provided an Array');
                    }

                    Enumerator$1.prototype._enumerate = function (input) {
                        for (var i = 0; this._state === PENDING && i < input.length; i++) {
                            this._eachEntry(input[i], i);
                        }
                    };

                    Enumerator$1.prototype._eachEntry = function (entry, i) {
                        var c = this._instanceConstructor;
                        var resolve$$1 = c.resolve;

                        if (resolve$$1 === resolve$1) {
                            var _then = getThen(entry);

                            if (_then === then && entry._state !== PENDING) {
                                this._settledAt(entry._state, i, entry._result);
                            } else if (typeof _then !== 'function') {
                                this._remaining--;
                                this._result[i] = entry;
                            } else if (c === Promise$2) {
                                var promise = new c(noop);
                                handleMaybeThenable(promise, entry, _then);
                                this._willSettleAt(promise, i);
                            } else {
                                this._willSettleAt(new c(function (resolve$$1) {
                                    return resolve$$1(entry);
                                }), i);
                            }
                        } else {
                            this._willSettleAt(resolve$$1(entry), i);
                        }
                    };

                    Enumerator$1.prototype._settledAt = function (state, i, value) {
                        var promise = this.promise;

                        if (promise._state === PENDING) {
                            this._remaining--;

                            if (state === REJECTED) {
                                reject(promise, value);
                            } else {
                                this._result[i] = value;
                            }
                        }

                        if (this._remaining === 0) {
                            fulfill(promise, this._result);
                        }
                    };

                    Enumerator$1.prototype._willSettleAt = function (promise, i) {
                        var enumerator = this;

                        subscribe(promise, undefined, function (value) {
                            return enumerator._settledAt(FULFILLED, i, value);
                        }, function (reason) {
                            return enumerator._settledAt(REJECTED, i, reason);
                        });
                    };

                    /**
                     @method all
                     @static
                     @param {Array} entries array of promises
                     @param {String} label optional string for labeling the promise.
                     Useful for tooling.
                     @return {Promise} promise that is fulfilled when all `promises` have been
                     fulfilled, or rejected if any of them become rejected.
                     @static
                     */
                    function all$1(entries) {
                        return new Enumerator$1(this, entries).promise;
                    }

                    /**
                     @method race
                     @static
                     @param {Array} promises array of promises to observe
                     Useful for tooling.
                     @return {Promise} a promise which settles in the same way as the first passed
                     promise to settle.
                     */
                    function race$1(entries) {
                        /*jshint validthis:true */
                        var Constructor = this;

                        if (!isArray(entries)) {
                            return new Constructor(function (_, reject) {
                                return reject(new TypeError('You must pass an array to race.'));
                            });
                        } else {
                            return new Constructor(function (resolve, reject) {
                                var length = entries.length;
                                for (var i = 0; i < length; i++) {
                                    Constructor.resolve(entries[i]).then(resolve, reject);
                                }
                            });
                        }
                    }

                    /**
                     @method reject
                     @static
                     @param {Any} reason value that the returned promise will be rejected with.
                     Useful for tooling.
                     @return {Promise} a promise rejected with the given `reason`.
                     */
                    function reject$1(reason) {
                        /*jshint validthis:true */
                        var Constructor = this;
                        var promise = new Constructor(noop);
                        reject(promise, reason);
                        return promise;
                    }

                    function needsResolver() {
                        throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
                    }

                    function needsNew() {
                        throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
                    }

                    /**
                     @class Promise
                     @param {function} resolver
                     Useful for tooling.
                     @constructor
                     */
                    function Promise$2(resolver) {
                        this[PROMISE_ID] = nextId();
                        this._result = this._state = undefined;
                        this._subscribers = [];

                        if (noop !== resolver) {
                            typeof resolver !== 'function' && needsResolver();
                            this instanceof Promise$2 ? initializePromise(this, resolver) : needsNew();
                        }
                    }

                    Promise$2.all = all$1;
                    Promise$2.race = race$1;
                    Promise$2.resolve = resolve$1;
                    Promise$2.reject = reject$1;
                    Promise$2._setScheduler = setScheduler;
                    Promise$2._setAsap = setAsap;
                    Promise$2._asap = asap;

                    Promise$2.prototype = {
                        constructor: Promise$2,
                        /*
                         @method then
                         @param {Function} onFulfilled
                         @param {Function} onRejected
                         Useful for tooling.
                         @return {Promise}
                         */
                        then: then,

                        /**
                         @method catch
                         @param {Function} onRejection
                         Useful for tooling.
                         @return {Promise}
                         */
                        'catch': function _catch(onRejection) {
                            return this.then(null, onRejection);
                        }
                    };

                    /*global self*/
                    function polyfill$1() {
                        var local = undefined;

                        if (typeof global !== 'undefined') {
                            local = global;
                        } else if (typeof self !== 'undefined') {
                            local = self;
                        } else {
                            try {
                                local = Function('return this')();
                            } catch (e) {
                                throw new Error('polyfill failed because global object is unavailable in this environment');
                            }
                        }

                        var P = local.Promise;

                        if (P) {
                            var promiseToString = null;
                            try {
                                promiseToString = Object.prototype.toString.call(P.resolve());
                            } catch (e) {
                                // silently ignored
                            }

                            if (promiseToString === '[object Promise]' && !P.cast) {
                                return;
                            }
                        }

                        local.Promise = Promise$2;
                    }

                    // Strange compat..
                    Promise$2.polyfill = polyfill$1;
                    Promise$2.Promise = Promise$2;

                    return Promise$2;
                };

                var ES6Promise = promiseFun();
                var Promise = ES6Promise.Promise;
                var Deferred = function Deferred() {
                    this.promise = new Promise(function (resolve, reject) {
                        this.resolve = resolve;
                        this.reject = reject;
                    }.bind(this));

                    this.then = this.promise.then.bind(this.promise);
                    this.catch = this.promise.catch.bind(this.promise);
                };

                var getJSON = function getJSON(param) {
                    if (!param.type) {
                        param.type = 'GET';
                    }
                    if (!param.dataType) {
                        param.dataType = 'json';
                    }
                    return new Promise(function (resolve, reject) {
                        var xhr = new XMLHttpRequest();
                        //??????????????????????????????mozilla????????????BUG????????????
                        if (xhr.overrideMimeType) {
                            xhr.overrideMimeType("text/html");
                        }
                        xhr.open(param.type, param.url);
                        xhr.onreadystatechange = handler;
                        xhr.responseType = 'text';

                        if (param.type.toUpperCase() == 'GET') {
                            xhr.setRequestHeader("Content-Type", "text/plain; charset=utf-8");
                        }
                        if (param.type.toUpperCase() == 'POST') {
                            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                        }

                        xhr.send(param.data);
                        function handler() {
                            if (this.readyState === this.DONE) {
                                if (this.status === 200) {
                                    var results = this.responseText;
                                    if (param.dataType == 'json' && typeof results == 'string') {
                                        results = JSON.parse(results);
                                    }
                                    resolve(results);
                                } else {
                                    reject(new Error('getJSON: ' + param.url + ' failed with status: [' + this.status + ']'));
                                }
                            }
                        };
                    });
                };

                var getParamJSON = function getParamJSON(param) {
                    if (!param.type) {
                        param.type = 'GET';
                    }
                    if (!param.dataType) {
                        param.dataType = 'json';
                    }

                    var xhr = new XMLHttpRequest();
                    var promise = new Promise(function (resolve, reject) {
                        //??????????????????????????????mozilla????????????BUG????????????
                        if (xhr.overrideMimeType) {
                            xhr.overrideMimeType("text/html");
                        }

                        var timeout = 30000;
                        var time = false; //????????????
                        var timer = setTimeout(function () {
                            if (xhr.status != '200') {
                                time = true;
                                xhr.abort(); //????????????
                            }
                        }, timeout);

                        xhr.open(param.type, param.url);
                        xhr.onreadystatechange = handler;
                        xhr.responseType = 'text';
                        if (param.type.toUpperCase() == 'GET') {
                            xhr.setRequestHeader("Content-Type", "text/plain; charset=utf-8");
                        }
                        if (param.type.toUpperCase() == 'POST') {
                            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                        }
                        xhr.send(param.data);
                        function handler() {
                            if (time) {
                                reject({ param: param, data: 'getParamJSON: ' + param.url + ' timeout' });
                                return; //??????????????????
                            }

                            if (this.readyState === this.DONE) {
                                if (this.status === 200) {
                                    var results = this.responseText;
                                    if (param.dataType == 'json' && typeof results == 'string') {
                                        results = JSON.parse(results);
                                    }
                                    resolve({ param: param, data: results });
                                } else {
                                    reject({ param: param, data: 'getParamJSON: ' + param.url + ' failed with status: [' + this.status + ']' });
                                }
                            }
                        };
                    });

                    promise.xhr = xhr;
                    return promise;
                };

                module.exports = {
                    Promise: Promise,
                    Deferred: Deferred,
                    getJSON: getJSON,
                    getParamJSON: getParamJSON
                };
            }).call(this, require('_process'), typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
        }, { "_process": 36 }], 34: [function (require, module, exports) {

            var _quadrant_left = 1;
            var _quadrant_left_bottom = 2;
            var _quadrant_bottom = 3;
            var _quadrant_right_bottom = 4;
            var _quadrant_right = 5;
            var _quadrant_right_top = 6;
            var _quadrant_top = 7;
            var _quadrant_left_top = 8;
            var _inner = 9;

            var _save = 1;
            var _question = 2;
            var _out = 3;

            var BoxSet = function () {
                function BoxSet(left, right, bottom, top, base, bufferPercent) {
                    _classCallCheck(this, BoxSet);

                    if (bufferPercent == null) {
                        bufferPercent = 5;
                    }
                    var buffer = base * 5 / 100;
                    this.left = left - buffer;
                    this.right = right + buffer;
                    this.bottom = bottom - buffer;
                    this.top = top + buffer;
                    this.previous = BoxSet.createEmptyDoubleArray();
                    this.now = BoxSet.createEmptyDoubleArray();
                    this.question = BoxSet.createEmptyDoubleArray();
                    this.point_previous_quadrant = -1;
                    this.point_now_quadrant = -1;
                    this.point_question_quadrant = -1;
                }

                BoxSet.createEmptyDoubleArray = function createEmptyDoubleArray() {
                    return [NaN, NaN];
                };

                BoxSet.prototype.copy = function copy(form, to) {
                    to[0] = form[0];
                    to[1] = form[1];
                };

                BoxSet.isEmpty = function isEmpty(array) {
                    if (array == null) {
                        return true;
                    }
                    if (isNaN(array[0]) || isNaN(array[1])) {
                        return true;
                    } else {
                        return false;
                    }
                };

                BoxSet.prototype.isQuadrant = function isQuadrant(point) {
                    var x = point[0];
                    var y = point[1];

                    if (x < this.left) {
                        if (y > this.top) {
                            return _quadrant_left_top;
                        }
                        if (y < this.bottom) {
                            return _quadrant_left_bottom;
                        } else {
                            return _quadrant_left;
                        }
                    }
                    if (x > this.right) {
                        if (y > this.top) {
                            return _quadrant_right_top;
                        }
                        if (y < this.bottom) {
                            return _quadrant_right_bottom;
                        } else {
                            return _quadrant_right;
                        }
                    } else {
                        if (y > this.top) {
                            return _quadrant_top;
                        }
                        if (y < this.bottom) {
                            return _quadrant_bottom;
                        } else {
                            return _inner;
                        }
                    }
                };

                BoxSet.prototype.passrule = function passrule(point_previous_quadrant, point_now_quadrant) {
                    if (point_previous_quadrant == 1) {
                        if (point_now_quadrant == 1 || point_now_quadrant == 2 || point_now_quadrant == 8) {
                            return _question;
                        } else {
                            return _save;
                        }
                    }
                    if (point_previous_quadrant == 2) {
                        if (point_now_quadrant == 1 || point_now_quadrant == 2 || point_now_quadrant == 8 || point_now_quadrant == 3 || point_now_quadrant == 4) {
                            return _question;
                        } else {
                            return _save;
                        }
                    }
                    if (this.point_previous_quadrant == 3) {
                        if (this.point_now_quadrant == 2 || this.point_now_quadrant == 3 || this.point_now_quadrant == 4) {
                            return _question;
                        } else {
                            return _save;
                        }
                    }
                    if (point_previous_quadrant == 4) {
                        if (point_now_quadrant == 2 || point_now_quadrant == 3 || point_now_quadrant == 4 || point_now_quadrant == 5 || point_now_quadrant == 6) {
                            return _question;
                        } else {
                            return _save;
                        }
                    }
                    if (point_previous_quadrant == 5) {
                        if (point_now_quadrant == 4 || point_now_quadrant == 5 || point_now_quadrant == 6) {
                            return _question;
                        } else {
                            return _save;
                        }
                    }
                    if (point_previous_quadrant == 6) {
                        if (point_now_quadrant == 4 || point_now_quadrant == 5 || point_now_quadrant == 6 || point_now_quadrant == 7 || point_now_quadrant == 8) {
                            return _question;
                        } else {
                            return _save;
                        }
                    }
                    if (point_previous_quadrant == 7) {
                        if (point_now_quadrant == 6 || point_now_quadrant == 7 || point_now_quadrant == 8) {
                            return _question;
                        } else {
                            return _save;
                        }
                    }
                    if (point_previous_quadrant == 8) {
                        if (point_now_quadrant == 6 || point_now_quadrant == 7 || point_now_quadrant == 8 || point_now_quadrant == 1 || point_now_quadrant == 2) {
                            return _question;
                        } else {
                            return _save;
                        }
                    }
                    if (point_previous_quadrant == 9) {
                        return _save;
                    } else {
                        return _save;
                    }
                };

                BoxSet.prototype.reset = function reset() {
                    this.previous[0] = NaN;
                    this.previous[1] = NaN;
                    this.question[0] = NaN;
                    this.question[1] = NaN;
                    this.now[0] = NaN;
                    this.now[1] = NaN;
                    this.point_previous_quadrant = -1;
                    this.point_now_quadrant = -1;
                    this.point_question_quadrant = -1;
                };

                BoxSet.prototype.in = function _in(now) {
                    if (now[0] < this.left || now[0] > this.right) {
                        return false;
                    }
                    if (now[1] < this.bottom || now[1] > this.top) {
                        return false;
                    }
                    return true;
                };

                BoxSet.length = function length(x0, y0, x1, y1) {
                    var dx = x1 - x0;
                    var dy = y1 - y0;
                    var len = Math.sqrt(dx * dx + dy * dy);
                    return len;
                };

                BoxSet.prototype.push = function push(x, y) {

                    this.now[0] = x;
                    this.now[1] = y;
                    if (BoxSet.isEmpty(this.previous)) {
                        this.copy(this.now, this.previous);
                        this.point_previous_quadrant = this.isQuadrant(this.now);
                        return [this.now];
                    } else {
                        this.point_now_quadrant = this.isQuadrant(this.now);
                        var passrule = this.passrule(this.point_previous_quadrant, this.point_now_quadrant);
                        if (passrule == _save) {

                            this.point_previous_quadrant = this.isQuadrant(this.now);
                            this.copy(this.now, this.previous);
                            if (!BoxSet.isEmpty(this.question)) {
                                var returnPoint = [];
                                this.copy(this.question, returnPoint);

                                this.question = BoxSet.createEmptyDoubleArray();

                                return [returnPoint, this.now];
                            } else {
                                return [this.now];
                            }
                        }
                        if (passrule == _question) {
                            //??????????????????????????????????????????
                            if (!BoxSet.isEmpty(this.question)) {
                                //point_question_quadrant = this.isQuadrant(question);
                                passrule = this.passrule(this.point_question_quadrant, this.point_now_quadrant);
                                if (passrule == _save) {
                                    var _returnPoint = [];
                                    this.copy(this.question, _returnPoint);
                                    this.question = BoxSet.createEmptyDoubleArray();
                                    return [_returnPoint, this.now];
                                }
                                if (passrule == _question) {}
                            }
                            this.copy(this.now, this.question);
                            this.point_question_quadrant = this.point_now_quadrant;
                            return null;
                        } else {
                            return null;
                        }
                    }
                };

                return BoxSet;
            }();

            module.exports = exports = BoxSet;
        }, {}], 35: [function (require, module, exports) {
            /**
             * Created by matt on 2017/7/16.
             */
            //??????????????????????????????
            var _dis = 3;

            var GisTools = function () {
                function GisTools() {
                    _classCallCheck(this, GisTools);
                }

                GisTools.pointDistToLine = function pointDistToLine(x, y, startx, starty, endx, endy) {
                    var se = (startx - endx) * (startx - endx) + (starty - endy) * (starty - endy);
                    var p = (x - startx) * (endx - startx) + (y - starty) * (endy - starty);
                    var r = p / se;
                    var outx = startx + r * (endx - startx);
                    var outy = starty + r * (endy - starty);
                    var des = Math.sqrt((x - outx) * (x - outx) + (y - outy) * (y - outy));

                    //console.log(des);
                    return des;
                };

                GisTools.isPointOnSegment = function isPointOnSegment(px, py, p1x, p1y, p2x, p2y) {

                    if (px - _dis > p1x && px + _dis > p2x || px + _dis < p1x && px - _dis < p2x) {
                        return 0;
                    }
                    if (py - _dis > p1y && py + _dis > p2y || py + _dis < p1y && py - _dis < p2y) {
                        return 0;
                    }
                    var d = GisTools.pointDistToLine(px, py, p1x, p1y, p2x, p2y);
                    if (d < _dis) {
                        return 1;
                    } else {
                        return 0;
                    }
                };

                GisTools.pointInLine = function pointInLine(px, py, polyline) {
                    var flag = 0;
                    var line = [];
                    if (Array.isArray(polyline[0])) {
                        line = polyline;
                    } else {
                        line.push(polyline);
                    }
                    for (var polyIndex = 0; polyIndex < line.length; polyIndex++) {
                        var subpoly = line[polyIndex];
                        var length = subpoly.length / 2;
                        // for (var i = 0, l = length, j = l - 1; i < l; j = i, i++) {

                        for (var i = 0; i < length - 1; i++) {
                            var _j20 = void 0;
                            _j20 = i + 1;
                            var sx = subpoly[2 * i],
                                sy = subpoly[2 * i + 1],
                                tx = subpoly[2 * _j20],
                                ty = subpoly[2 * _j20 + 1];
                            if (GisTools.isPointOnSegment(px, py, sx, sy, tx, ty) == 1) {
                                return 1;
                            } else {}
                        }
                    }
                    return 0;
                };

                GisTools.pointInPolygon = function pointInPolygon(px, py, polygen) {
                    var flag = 0;
                    var poly = [];
                    if (Array.isArray(polygen[0])) {
                        poly = polygen;
                    } else {
                        poly.push(polygen);
                    }

                    for (var polyIndex = 0; polyIndex < poly.length; polyIndex++) {
                        var subpoly = poly[polyIndex];
                        var length = subpoly.length / 2;

                        for (var i = 0, l = length, j = l - 1; i < l; j = i, i++) {
                            var sx = subpoly[2 * i],
                                sy = subpoly[2 * i + 1],
                                tx = subpoly[2 * j],
                                ty = subpoly[2 * j + 1];

                            // ???????????????????????????
                            if (sx === px && sy === py || tx === px && ty === py) {
                                return 1;
                            }

                            // ??????????????????????????????????????????
                            if (sy < py && ty >= py || sy >= py && ty < py) {
                                // ?????????????????? Y ????????????????????? X ??????
                                var x = sx + (py - sy) * (tx - sx) / (ty - sy);

                                // ????????????????????????
                                if (x === px) {
                                    return 1;
                                }
                                if (x > px) {
                                    flag = !flag;
                                }
                            }
                        }
                    }
                    return flag ? 1 : 0;
                };

                GisTools.lineIntersects = function lineIntersects(line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY) {
                    var denominator,
                        a,
                        b,
                        numerator1,
                        numerator2,
                        onLine1 = false,
                        onLine2 = false,
                        res = [null, null];

                    denominator = (line2EndY - line2StartY) * (line1EndX - line1StartX) - (line2EndX - line2StartX) * (line1EndY - line1StartY);
                    if (denominator === 0) {
                        if (res[0] !== null && res[1] !== null) {
                            return res;
                        } else {
                            return false;
                        }
                    }
                    a = line1StartY - line2StartY;
                    b = line1StartX - line2StartX;
                    numerator1 = (line2EndX - line2StartX) * a - (line2EndY - line2StartY) * b;
                    numerator2 = (line1EndX - line1StartX) * a - (line1EndY - line1StartY) * b;
                    a = numerator1 / denominator;
                    b = numerator2 / denominator;

                    // if we cast these lines infinitely in both directions, they intersect here:
                    res[0] = line1StartX + a * (line1EndX - line1StartX);
                    res[1] = line1StartY + a * (line1EndY - line1StartY);

                    // if line2 is a segment and line1 is infinite, they intersect if:
                    if (b > 0 && b < 1) {
                        return res;
                    } else {
                        return false;
                    }
                };

                /**
                 * ????????????poly?????????
                 * @param polyOut
                 * @param polyIn
                 * @returns {1,?????????2?????????3????????????}
                 */


                GisTools.polyWith = function polyWith(polyOut, polyIn) {
                    var lengthOut = polyOut.length / 2;
                    var lengthIn = polyIn.length / 2;
                    var flag = false;
                    var bY = void 0;
                    var aX = void 0;
                    var aY = void 0;
                    var bX = void 0;
                    var dY = void 0;
                    var cX = void 0;
                    var cY = void 0;
                    var dX = void 0;
                    for (var _i51 = 0; _i51 < lengthOut; _i51++) {

                        if (_i51 != lengthOut - 1) {
                            aX = polyOut[_i51 * 2];
                            aY = polyOut[_i51 * 2 + 1];
                            bX = polyOut[_i51 * 2 + 2];
                            bY = polyOut[_i51 * 2 + 3];
                        } else {
                            aX = polyOut[_i51 * 2];
                            aY = polyOut[_i51 * 2 + 1];
                            bX = polyOut[0];
                            bY = polyOut[1];
                        }
                        for (var _j21 = 0; _j21 < lengthIn; _j21++) {

                            if (_j21 != lengthIn - 1) {
                                cX = polyIn[_j21 * 2];
                                cY = polyIn[_j21 * 2 + 1];
                                dX = polyIn[_j21 * 2 + 2];
                                dY = polyIn[_j21 * 2 + 3];
                            } else {
                                cX = polyIn[_j21 * 2];
                                cY = polyIn[_j21 * 2 + 1];
                                dX = polyIn[0];
                                dY = polyIn[1];
                            }

                            if (GisTools.lineIntersects(aX, aY, bX, bY, cX, cY, dX, dY) != false) {
                                return 1;
                            }
                        }
                    }

                    var firstX = polyIn[0];
                    var firstY = polyIn[1];
                    if (GisTools.pointInPolygon(firstX, firstY, polyOut)) {
                        return 2;
                    }
                    return 3;
                };

                /**
                 * ???bbox??????double Array
                 * @param left
                 * @param bottom
                 * @param right
                 * @param top
                 * @returns {Array}
                 */


                GisTools.boxToPolyArr = function boxToPolyArr(left, bottom, right, top) {
                    var arr = [];
                    arr.push(left);
                    arr.push(bottom);

                    arr.push(left);
                    arr.push(top);

                    arr.push(right);
                    arr.push(top);

                    arr.push(right);
                    arr.push(bottom);

                    arr.push(left);
                    arr.push(bottom);

                    return arr;
                };

                GisTools.getExtensionPoint = function getExtensionPoint(p1, p2, d) {
                    var xab = p2[0] - p1[0];
                    var yab = p2[1] - p1[1];
                    var xd = p2[0];
                    var yd = p2[1];
                    if (xab == 0) {
                        if (yab > 0) {
                            yd = p2[1] + d;
                        } else {
                            yd = p2[1] - d;
                        }
                    } else {
                        var xbd = Math.sqrt(d * d / (yab / xab * (yab / xab) + 1));
                        if (xab < 0) {
                            xbd = -xbd;
                        }

                        xd = p2[0] + xbd;
                        yd = p2[1] + yab / xab * xbd;
                    }
                    return [xd, yd];
                };

                return GisTools;
            }();

            module.exports = exports = GisTools;
        }, {}], 36: [function (require, module, exports) {
            // shim for using process in browser
            var process = module.exports = {};

            // cached from whatever global is present so that test runners that stub it
            // don't break things.  But we need to wrap it in a try catch in case it is
            // wrapped in strict mode code which doesn't define any globals.  It's inside a
            // function because try/catches deoptimize in certain engines.

            var cachedSetTimeout;
            var cachedClearTimeout;

            function defaultSetTimout() {
                throw new Error('setTimeout has not been defined');
            }
            function defaultClearTimeout() {
                throw new Error('clearTimeout has not been defined');
            }
            (function () {
                try {
                    if (typeof setTimeout === 'function') {
                        cachedSetTimeout = setTimeout;
                    } else {
                        cachedSetTimeout = defaultSetTimout;
                    }
                } catch (e) {
                    cachedSetTimeout = defaultSetTimout;
                }
                try {
                    if (typeof clearTimeout === 'function') {
                        cachedClearTimeout = clearTimeout;
                    } else {
                        cachedClearTimeout = defaultClearTimeout;
                    }
                } catch (e) {
                    cachedClearTimeout = defaultClearTimeout;
                }
            })();
            function runTimeout(fun) {
                if (cachedSetTimeout === setTimeout) {
                    //normal enviroments in sane situations
                    return setTimeout(fun, 0);
                }
                // if setTimeout wasn't available but was latter defined
                if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
                    cachedSetTimeout = setTimeout;
                    return setTimeout(fun, 0);
                }
                try {
                    // when when somebody has screwed with setTimeout but no I.E. maddness
                    return cachedSetTimeout(fun, 0);
                } catch (e) {
                    try {
                        // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
                        return cachedSetTimeout.call(null, fun, 0);
                    } catch (e) {
                        // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
                        return cachedSetTimeout.call(this, fun, 0);
                    }
                }
            }
            function runClearTimeout(marker) {
                if (cachedClearTimeout === clearTimeout) {
                    //normal enviroments in sane situations
                    return clearTimeout(marker);
                }
                // if clearTimeout wasn't available but was latter defined
                if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
                    cachedClearTimeout = clearTimeout;
                    return clearTimeout(marker);
                }
                try {
                    // when when somebody has screwed with setTimeout but no I.E. maddness
                    return cachedClearTimeout(marker);
                } catch (e) {
                    try {
                        // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
                        return cachedClearTimeout.call(null, marker);
                    } catch (e) {
                        // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
                        // Some versions of I.E. have different rules for clearTimeout vs setTimeout
                        return cachedClearTimeout.call(this, marker);
                    }
                }
            }
            var queue = [];
            var draining = false;
            var currentQueue;
            var queueIndex = -1;

            function cleanUpNextTick() {
                if (!draining || !currentQueue) {
                    return;
                }
                draining = false;
                if (currentQueue.length) {
                    queue = currentQueue.concat(queue);
                } else {
                    queueIndex = -1;
                }
                if (queue.length) {
                    drainQueue();
                }
            }

            function drainQueue() {
                if (draining) {
                    return;
                }
                var timeout = runTimeout(cleanUpNextTick);
                draining = true;

                var len = queue.length;
                while (len) {
                    currentQueue = queue;
                    queue = [];
                    while (++queueIndex < len) {
                        if (currentQueue) {
                            currentQueue[queueIndex].run();
                        }
                    }
                    queueIndex = -1;
                    len = queue.length;
                }
                currentQueue = null;
                draining = false;
                runClearTimeout(timeout);
            }

            process.nextTick = function (fun) {
                var args = new Array(arguments.length - 1);
                if (arguments.length > 1) {
                    for (var i = 1; i < arguments.length; i++) {
                        args[i - 1] = arguments[i];
                    }
                }
                queue.push(new Item(fun, args));
                if (queue.length === 1 && !draining) {
                    runTimeout(drainQueue);
                }
            };

            // v8 likes predictible objects
            function Item(fun, array) {
                this.fun = fun;
                this.array = array;
            }
            Item.prototype.run = function () {
                this.fun.apply(null, this.array);
            };
            process.title = 'browser';
            process.browser = true;
            process.env = {};
            process.argv = [];
            process.version = ''; // empty string to avoid regexp issues
            process.versions = {};

            function noop() {}

            process.on = noop;
            process.addListener = noop;
            process.once = noop;
            process.off = noop;
            process.removeListener = noop;
            process.removeAllListeners = noop;
            process.emit = noop;
            process.prependListener = noop;
            process.prependOnceListener = noop;

            process.listeners = function (name) {
                return [];
            };

            process.binding = function (name) {
                throw new Error('process.binding is not supported');
            };

            process.cwd = function () {
                return '/';
            };
            process.chdir = function (dir) {
                throw new Error('process.chdir is not supported');
            };
            process.umask = function () {
                return 0;
            };
        }, {}] }, {}, [6])(6);
});
