window.flowEchartsIndex = 0;
(function (factory, window) {

  // define an AMD module that relies on 'leaflet'
  if (typeof define === 'function' && define.amd) {
    define(['leaflet'], factory);

    // define a Common JS module that relies on 'leaflet'
  } else if (typeof exports === 'object') {
    module.exports = factory(require('leaflet'));
    module.exports = factory(require('jquery'));
  }

  // attach your plugin to the global 'L' variable
  if (typeof window !== 'undefined' && window.L) {
    window.L.flowEcharts = factory(L);
  }
}(function (L) {

  // implement your plugin
  L.FlowEcharts = (L.version < "1.0" ? L.Class : L.Layer).extend({
    includes: (L.version < "1.0" ? L.Mixin.Events : []),
    _echartsContainer: null,
    _map: null,
    _ec: null,
    _option: null,//TODO: css for echarts container
    _echartsOption: null,


    initialize: function (echartsOption, option) {
      this._option = option;
      this._echartsOption = echartsOption;

    },



    onAdd: function (map) {
      this._map = map;
      this._initEchartsContainer();
      map.on("moveend", this._redraw, this);
      this._redraw();
    },

    onRemove: function (map) {
      if (this._echartsContainer) {
        map.getPanes().overlayPane.removeChild(this._echartsContainer);
      }
      map.off("moveend", this._redraw, this);
    },
    addTo: function (map) {
      map.addLayer(this);
      return this;
    },
    _initEchartsContainer: function () {
      var size = this._map.getSize();

      var _div = document.createElement('div');
      _div.style.position = 'absolute';
      _div.style.height = size.y + 'px';
      _div.style.width = size.x + 'px';
      _div.style.zIndex = flowEchartsIndex--;

      this._echartsContainer = _div;
      this._map.getPanes().overlayPane.appendChild(this._echartsContainer);
    },

    _resetCanvasPosition: function () {
      var bounds = this._map.getBounds();
      var topLeft = this._map.latLngToLayerPoint(bounds.getNorthWest());
      L.DomUtil.setPosition(this._echartsContainer, topLeft);
    },

    _redraw: function () {
      this._resetCanvasPosition();
      this._echartsContainer.innerHTML = '';
      this.initECharts();
      this.setOption(this._echartsOption);
      return this;
    },

    clear: function () {
      this._echartsContainer.innerHTML = '';
      this.echartsOption = {};
    },

    redraw: function () {
      this._redraw();
    },

    /**
     * ??????????????????????????????
     *
     * @param {Array.<number>} geoCoord  ?????????
     * @return {Array.<number>}
     * @private
     */
    geoCoord2Pixel: function (geoCoord) {
      var point = new L.latLng(geoCoord[1], geoCoord[0]);
      var pos = this._map.latLngToContainerPoint(point);
      return [pos.x, pos.y];
    },
    /**
       * ??????????????????????????????
       *
       * @param {Array.<number>} pixel  ????????????
       * @return {Array.<number>}
       * @public
       */
    pixel2GeoCoord: function (pixel) {
      var point = this._map.containerPointToLatLng(L.point(pixel[0], pixel[1]));
      return [point.lng, point.lat];
    },

    /**
     * ?????????echarts??????
     *
     * @return {ECharts}
     * @public
     */
    initECharts: function () {
      this._ec = echarts.init(this._echartsContainer);
      if(echarts.version>='3.0'){
        var n = this;
        n._ec.Geo.prototype.dataToPoint = function (geoCoord) {
          var point = new L.latLng(geoCoord[1], geoCoord[0]);
          var pos = n._map.latLngToContainerPoint(point);
          return [pos.x, pos.y];
        };
      }
      this._unbindEvent();

    },

    /**
     * ???echarts???setOption???????????????
     * ?????????markPoint???markLine?????????x???y???????????????name???geoCoord??????
     *
     * @public
     * @param option
     * @param notMerge
     */
    setOption: function (option, notMerge) {
      if (option.series) {
       
        var series = option.series || {};
        var _geoCoord = {}, geoflag = false;
        if (echarts.version < '3.0') {

          // ???????????????geoCoord
          for (var i = 0, item; item = series[i++];) {
            var geoCoord = item.geoCoord;
            if (geoCoord) {
              geoflag = true;
              _geoCoord = geoCoord;
            }
          }
          // ??????x???y
          for (var i = 0, item; item = series[i++];) {
            var markPoint = item.markPoint || {};
            var markLine = item.markLine || {};

            var data = markPoint.data;
            if (data && data.length) {
              for (var k = 0, len = data.length; k < len; k++) {
                if (geoflag) {
                  data[k].geoCoord = _geoCoord[data[k].name];
                }
                this._AddPos(data[k]);
              }
            }

            data = markLine.data;
            if (data && data.length) {
              for (var k = 0, len = data.length; k < len; k++) {
                if (geoflag) {
                  data[k][0].geoCoord = _geoCoord[data[k][0].name];
                  data[k][1].geoCoord = _geoCoord[data[k][1].name];
                }
                this._AddPos(data[k][0]);
                this._AddPos(data[k][1]);
              }
            }
          }
        } 

        this._ec.setOption(option, notMerge);

      }
    },

    /**
     * ??????x???y??????
     *
     * @param {Object} obj  markPoint???markLine data?????????????????????name
     * @param {Object} geoCoord
     */
    _AddPos: function (obj) {
      if (echarts.version < '3.0') {
        var coord = (echarts.version < '3.0') ? obj.geoCoord : obj.coord;
        var pos = this.geoCoord2Pixel(coord);
        obj.x = pos[0]; //- this._mapOffset[0];
        obj.y = pos[1]; //- this._mapOffset[1];
      } else {
        var coord = obj.coord;
        var pos = this.geoCoord2Pixel(coord);
        obj.coord = pos;
      }
    },


    /**
     * ???????????????????????????????????????
     *
     * @private
     */
    _unbindEvent: function () {
      if (echarts.version < '3.0') {
        this._ec.getZrender().un('dragstart', function () { });
        this._ec.getZrender().un('dragend', function () { });
        this._ec.getZrender().un('mouseup', function () { });
        this._ec.getZrender().un('mousedown', function () { });
        this._ec.getZrender().un('mousewheel', function () { });
      } else {
        this._ec.getZr().off('dragstart', function () { });
        this._ec.getZr().off('dragend', function () { });
        this._ec.getZr().off('mouseup', function () { });
        this._ec.getZr().off('mousedown', function () { });
        this._ec.getZr().off('mousewheel', function () { });
      }
    }
  });


  L.flowEcharts = function (options, echartsOptions) {
    return new L.FlowEcharts(options, echartsOptions);
  };
  return L.flowEcharts;
  // return your plugin when you are done

}, window));
