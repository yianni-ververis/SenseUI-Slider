/**
 *
 * @title Sense UI - Slider
 * @description Integer Range Slider for multiple selections
 *
 * @author yianni.ververis@qlik.com
 *
 * @example https://github.com/yianni-ververis/SenseUI-Slider
 */

define([
	"qlik",
	"jquery",
	"qvangular",
	'underscore'
], function(qlik, $, qvangular, _) {
'use strict';

	var vhost = '/extensions',
		whitelist = [
			'localhost:4848',
			'demos.qlik.com'	
		];

	if ($.inArray(window.location.host, whitelist) == -1) {
		vhost = 'https://demos.qlik.com/extensions';
	}
	
	var css1 = vhost + '/senseui-slider/jquery-ui.css',
		css2 = vhost + '/senseui-slider/senseui-slider.css';

	ajax(css1);
	ajax(css2);

	function ajax (uri) {
		$.ajax({
			url: uri,
			async: true,
			crossDomain : true,
			success: function (file) {
				$("<style>").html(file).appendTo("head");
			},
			error: function (e) {
				console.log(e);
				console.log(uri);
			}
		});
	};

	// Define properties
	var me = {
		initialProperties: {
			version: 1.0,
			qListObjectDef: {
				qShowAlternatives: true,
				qFrequencyMode : "V",
				qSortCriterias : {
					qSortByState : 1
				},
				qInitialDataFetch: [{
					qWidth: 2,
					qHeight: 1000
				}]
			},
		},
		definition: {
			type: "items",
			component: "accordion",
			items: {
				dimension : {
					type : "items",
					label : "Dimensions",
					ref : "qListObjectDef",
					min : 1,
					max : 1,
					items : {
						libraryId : {
							type : "string",
							component : "library-item",
							libraryItemType : "dimension",
							ref : "qListObjectDef.qLibraryId",
							label : "Dimension",
							show : function(data) {
								return data.qListObjectDef && data.qListObjectDef.qLibraryId;
							}
						},
						field : {
							type : "string",
							expression : "always",
							expressionType : "dimension",
							ref : "qListObjectDef.qDef.qFieldDefs.0",
							label : "Field",
							show : function(data) {
								return data.qListObjectDef && !data.qListObjectDef.qLibraryId;
							}
						},
					}
				},
				settings: {
					uses : "settings",
					items: {
						DropDown: {
							type: "items",
							label: "Slider Settings",
							items: {	
								ButtonHexDefault: { // @todo
									type: "string",
									label: 'Custom Hex Color for Slider Button',
									ref: 'buttonHexDefault',
									defaultValue: ''
							    },
							}
						}
					}
				}
			}
		}
	};

	// Get Engine API app for Selections
	me.app = qlik.currApp(this);

	// Alter properties on edit		
	me.paint = function($element,layout) {
		var field = layout.qListObject.qDimensionInfo.qFallbackTitle;
		var object = layout.qListObject.qDataPages[0].qMatrix;
		// Get Selection Bar
		me.app.getList("SelectionObject", function(reply){
			var selectedFields = reply.qSelectionObject.qSelections;
			if (_.where(selectedFields, {'qField': field}) && _.where(selectedFields, {'qField': field}).length) {
				var selectedObject = _.filter(object, function(obj){
					return obj[0].qState === 'S'; 
				});
				if (selectedObject.length >= 1) {
					var min = _.min(selectedObject, function(o){return o[0].qNum;})[0].qNum,
						max = _.max(selectedObject, function(o){return o[0].qNum;})[0].qNum;
					qvangular.$rootScope.range.values = [min, max]
				}
			} else {
				var min = _.min(object, function(o){return o[0].qNum;})[0].qNum,
					max = _.max(object, function(o){return o[0].qNum;})[0].qNum;
				qvangular.$rootScope.range.values = [min, max]
			}
		});
	};

	// define HTML template
	me.template = '\
		<div qv-extension style="height: 100%; position: relative; overflow: auto;" class="ng-scope" id="SenseUI-Slider">\n\
			<div id="sliderBar"></div>\n\
			<div id="sliderMin">{{range.minDis}}</div>\n\
			<div id="sliderMax">{{range.maxDis}}</div>\n\
		</div>\n\
	';

	// Controller for binding
	me.controller =['$scope','$rootScope', function($scope,$rootScope){
		var field = $scope.$parent.layout.qListObject.qDimensionInfo.qFallbackTitle;
		var object = $scope.$parent.layout.qListObject.qDataPages[0].qMatrix;

		if (typeof $rootScope.range === 'undefined') {
			$rootScope.range = {};
		}

		$scope.range = {
			min: _.min(object, function(o){return o[0].qNum;})[0].qNum,
			max: _.max(object, function(o){return o[0].qNum;})[0].qNum
		}
		$scope.range.minDis = me.getGetOrdinal($scope.range.min);
		$scope.range.maxDis = me.getGetOrdinal($scope.range.max);
		$scope.range.values = [$scope.range.min, $scope.range.max];

		// Check if there are any selections from paint
		$rootScope.$watch('range.values', function(newValue, oldValue) {
			if (!$.isEmptyObject(newValue) && ($scope.range.values[0]!=newValue[0] || $scope.range.values[1]!=newValue[1])) { 
				$scope.range.minDis = me.getGetOrdinal(newValue[0]);
				$scope.range.maxDis = me.getGetOrdinal(newValue[1]);
				$scope.range.values = newValue;
				$("#sliderBar").slider( 'values', newValue );
			}
		});

		$( "#sliderBar" ).slider({
			range: true,
			min: $scope.range.min,
			max: $scope.range.max,
			values: $scope.range.values,
	      	// step: 5,
			slide: function( event, ui ) {
				$scope.range.min = ui.values[0];
				$scope.range.max = ui.values[1];
				$scope.range.minDis = me.getGetOrdinal(ui.values[0]);
				$scope.range.maxDis = me.getGetOrdinal(ui.values[1]);
			},
			stop: function( event, ui ) {
				// Make the selections
				var rangen = [];
				for (var i = ui.values[0]; i <= ui.values[1]; i++) {
					rangen.push(i);
				}
				me.app.field(field).selectValues(rangen, false, false);
			}
	    });
	}];

	// Return Ordinal Numbers 1st, 2nd etc.
	me.getGetOrdinal = function (n) {
		var s = ["th","st","nd","rd"],
			v = n%100;
		return n+(s[(v-20)%10]||s[v]||s[0]);
	}

	return me;
});
