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
								SliderOrdinal: {
									type: "boolean",
									label: 'Display Ordinal',
									ref: 'vars.ordinal',
									defaultValue: false
							    },
								SliderInputWidth: {
									type: "number",
									expression: "none",
									label: "Input Width",
									component: "slider",
									ref: "vars.input.width",
									defaultValue: 4,
									min: 3,
									max: 8
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
console.log(layout);
		var vars = {
			id: layout.qInfo.qId,
			field: layout.qListObject.qDimensionInfo.qFallbackTitle,
			object: layout.qListObject.qDataPages[0].qMatrix,
			buttonHexDefault: (layout.vars.buttonHexDefault) ? layout.vars.buttonHexDefault : '#CCC',
			label: (layout.vars.label) ? layout.vars.label : null,
			visible: (layout.vars.visible) ? true : false,
			ordinal: (layout.vars.ordinal) ? true : false,
			template: '',
			input: {
				width: (layout.vars.input.width) ? layout.vars.input.width : 4,
			},
			height: $element.height(),
			width: $element.width(),			
		}

		if (typeof layout.vars.range === 'undefined') {
			layout.vars.range = {
				min: _.min(vars.object, function(o){return o[0].qNum;})[0].qNum,
				max: _.max(vars.object, function(o){return o[0].qNum;})[0].qNum
			}
		}
		if (typeof layout.vars.range.values === 'undefined') {
			layout.vars.range.values = [];
		}
		layout.vars.range.values[0] = (layout.vars.range.values[0]) ? layout.vars.range.values[0] : layout.vars.range.min;
		layout.vars.range.values[1] = (layout.vars.range.values[1]) ? layout.vars.range.values[1] : layout.vars.range.max;
		layout.vars.range.minDis = (vars.ordinal) ? me.getGetOrdinal(layout.vars.range.min) : layout.vars.range.min;
		layout.vars.range.maxDis = (vars.ordinal) ? me.getGetOrdinal(layout.vars.range.max) : layout.vars.range.max;
		
		//Get Selection Bar
		me.app.getList("SelectionObject", function(reply){
			var selectedFields = reply.qSelectionObject.qSelections;
			if (_.where(selectedFields, {'qField': vars.field}) && _.where(selectedFields, {'qField': vars.field}).length) {
				var selectedObject = _.filter(vars.object, function(obj){ return obj[0].qState === 'S'; });
				if (selectedObject.length >= 1) {
					var min = _.min(selectedObject, function(o){return o[0].qNum;})[0].qNum,
						max = _.max(selectedObject, function(o){return o[0].qNum;})[0].qNum;
					layout.vars.range.values = [min, max];
					$("#sliderBar").slider( "option", "values", layout.vars.range.values );
				}
			}
		});

		// vars.template = 'YIANNIS';
		vars.template = '\
			<div qv-extension class="senseui-slider" id="' + vars.id + '">\
		';
		if (vars.visible) {
			vars.template += '\
				<div id="sliderTop"><span class="label">' + vars.label + ':</span> \n\
					<input type="text" name="input" value="' + layout.vars.range.values[0] + '" size="' + vars.input.width + '" ng-change="selectRange2()"> to \n\
					<input type="text" name="input" value="' + layout.vars.range.values[1] + '" size="' + vars.input.width + '" onchange="selectRange()">\n\
				</div>';
		}

		vars.template += '\
				<div id="sliderBar"></div>\n\
				<div id="sliderMin">' + layout.vars.range.minDis + '</div>\n\
				<div id="sliderMax">' + layout.vars.range.maxDis + '</div>\n\
			</div>';

		// $element.html($(vars.template).width(vars.width).height(vars.height));
		$element.html(vars.template);

	    // me.drawSlider = function () {
	    if ($('#sliderBar').is(':empty')){
			$( "#sliderBar" ).slider({
				range: true,
				min: layout.vars.range.min,
				max: layout.vars.range.max,
				values: layout.vars.range.values,
				slide: function( event, ui ) {
					// layout.vars.range.min = ui.values[0];
					// layout.vars.range.max = ui.values[1];
					layout.vars.range.minDis = (vars.ordinal) ? me.getGetOrdinal(ui.values[0]) : ui.values[0];
					layout.vars.range.maxDis = (vars.ordinal) ? me.getGetOrdinal(ui.values[1]) : ui.values[1];
					layout.vars.range.values = [ui.values[0],ui.values[1]];
				},
				stop: function( event, ui ) {
					 me.selectRange();
				}
		    });
	    } else {
	    	$("#sliderBar").slider( "option", "values", layout.vars.range.values );
	    }

	    me.selectRange = function () {
	    	var min = parseInt(layout.vars.range.values[0]);
	    	var max = parseInt(layout.vars.range.values[1]);
			var minDis = me.getGetOrdinal(layout.vars.range.min);
			var maxDis = me.getGetOrdinal(layout.vars.range.max);
	    	// layout.vars.range.values = [min,layout.vars.range.max];
			// Make the selections
			var rangeSelected = [];
			for (var i = min; i <= max; i++) {
				rangeSelected.push(i);
			}
			me.app.field(vars.field).selectValues(rangeSelected, false, false);
	    	$("#sliderBar").slider( 'values', layout.vars.range.values );
	    }
	};

	// define HTML template
	// me.template = '';

	// Controller for binding
	me.controller =['$scope','$rootScope', function($scope,$rootScope){
		$scope.selectRange2 = function() {
			console.log(1);
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
