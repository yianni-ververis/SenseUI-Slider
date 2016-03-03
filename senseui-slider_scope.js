/**
 *
 * @title Sense UI - Slider
 * @description Integer Range Slider for multiple selections
 *
 * @author yianni.ververis@qlik.com
 *
 * @example https://github.com/yianni-ververis/SenseUI-Slider
 */

// text.js has cross-domain restrictions
define([
	"qlik",
	"jquery",
	"qvangular",
	'underscore',	
	"css!./jquery-ui.css",
	"css!./senseui-slider.css",
], function(qlik, $, qvangular, _) {
'use strict';
	
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
									ref: 'vars.buttonHexDefault',
									defaultValue: '#CCC'
							    },	
								SliderLabel: { // @todo
									type: "string",
									label: 'Label',
									ref: 'vars.label',
									defaultValue: 'Label'
							    },	
								SliderLabelVisible: {
									type: "boolean",
									label: 'Label Visibility',
									ref: 'vars.visible',
									defaultValue: true
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
		var vars = {
			id: layout.qInfo.qId,
			field: layout.qListObject.qDimensionInfo.qFallbackTitle,
			object: layout.qListObject.qDataPages[0].qMatrix,
			buttonHexDefault: (layout.vars.buttonHexDefault) ? layout.vars.buttonHexDefault : '#CCC',
			label: (layout.vars.label) ? layout.vars.label : null,
			visible: (layout.vars.visible) ? true : false,
			template: '',
			height: $element.height(),
			width: $element.width(),
			rangeSelected: [],
		}
		console.log(layout);
		console.log(vars);
		// Get Selection Bar
		me.app.getList("SelectionObject", function(reply){
			var selectedFields = reply.qSelectionObject.qSelections;
			if (_.where(selectedFields, {'qField': vars.field}) && _.where(selectedFields, {'qField': vars.field}).length) {
				var selectedObject = _.filter(vars.object, function(obj){ return obj[0].qState === 'S'; });
				if (selectedObject.length >= 1) {
					var min = _.min(selectedObject, function(o){return o[0].qNum;})[0].qNum,
						max = _.max(selectedObject, function(o){return o[0].qNum;})[0].qNum;
					qvangular.$rootScope.range.values = [min, max]
				}
			} else {
				var min = _.min(vars.object, function(o){return o[0].qNum;})[0].qNum,
					max = _.max(vars.object, function(o){return o[0].qNum;})[0].qNum;
				qvangular.$rootScope.range.values = [min, max]
			}
		});
	};

	// define HTML template
	me.template = '\
		<div qv-extension style="height: 100%; position: relative; overflow: auto;" class="ng-scope" id="SenseUI-Slider">\n\
			<div id="sliderTop">{{sliderLabel}}: \n\
				<input type="text" name="input" ng-model="range.min" ng-trim="false" size="4" ng-change="selectRange()"> to \n\
				<input type="text" name="input" ng-model="range.max" ng-trim="false" size="4" ng-change="selectRange()"></div>\n\
			<div id="sliderBar"></div>\n\
			<div id="sliderMin">{{range.minDis}}</div>\n\
			<div id="sliderMax">{{range.maxDis}}</div>\n\
		</div>\n\
	';

	// Controller for binding
	me.controller =['$scope','$rootScope', function($scope,$rootScope){
		var field = $scope.$parent.layout.qListObject.qDimensionInfo.qFallbackTitle;
		var object = $scope.$parent.layout.qListObject.qDataPages[0].qMatrix;
		$scope.sliderLabel = $scope.$parent.layout.sliderLabel;
// console.log($scope.$parent.layout);
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
console.log(1);
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
				 $scope.selectRange();
				// var rangen = [];
				// for (var i = ui.values[0]; i <= ui.values[1]; i++) {
				// 	rangen.push(i);
				// }
				// me.app.field(field).selectValues(rangen, false, false);
			}
	    });

	    $scope.selectRange = function () {
	    	$scope.range.min = parseInt($scope.range.min);
	    	$scope.range.max = parseInt($scope.range.max);
			$scope.range.minDis = me.getGetOrdinal($scope.range.min);
			$scope.range.maxDis = me.getGetOrdinal($scope.range.max);
	    	$scope.range.values = [$scope.range.min,$scope.range.max];
			// Make the selections
			var rangen = [];
			for (var i = $scope.range.min; i <= $scope.range.max; i++) {
				rangen.push(i);
			}
			me.app.field(field).selectValues(rangen, false, false);
	    	$("#sliderBar").slider( 'values', $scope.range.values );
	    	console.log($scope.range);
	    }
	}];

	// Return Ordinal Numbers 1st, 2nd etc.
	me.getGetOrdinal = function (n) {
		var s = ["th","st","nd","rd"],
			v = n%100;
		return n+(s[(v-20)%10]||s[v]||s[0]);
	}

	return me;
});
