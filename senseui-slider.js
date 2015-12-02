define([
	"qlik",
	"jquery",
	"qvangular",
	"text!./jquery-ui.css",
	"text!./senseui-slider.css",
	"text!./template.html",
	'underscore'
], function(qlik, $, qvangular, cssjQueryUI, cssContent, template, _) {
'use strict';

	// Inject the custom CSS
	$("<style>").html(cssjQueryUI).appendTo("head");
	$("<style>").html(cssContent).appendTo("head");

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
						label : {
							type : "string",
							ref : "qListObjectDef.qDef.qFieldLabels.0",
							label : "Label",
							show : true
						},
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
							label: "DropDown Settings",
							items: {						
								ListType:{
									ref: "ListType",
									expression:"optional",
									translation: "List Type",
									type: "string",
									defaultValue: "vertical",
									component: "dropdown",
									options: [ {
											value: "horizontal",
											label: "horizontal"
										}, {
											value: "vertical",
											label: "vertical"
										}
									]
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
	me.template = template;

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
