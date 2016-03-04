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
								HandleColor: { // @todo
									type: "string",
									label: 'Slider Handle Color',
									ref: 'vars.handleColor',
									defaultValue: '#CCC'
							    },
								HandleColorSelected: { // @todo
									type: "string",
									label: 'Slider Handle Selected Color',
									ref: 'vars.handleColorSelected',
									defaultValue: '#77b62a'
							    },
								BarColor: { // @todo
									type: "string",
									label: 'Slider Bar Color',
									ref: 'vars.barColor',
									defaultValue: '#e9e9e9'
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
		var vars = {
			id: layout.qInfo.qId,
			field: layout.qListObject.qDimensionInfo.qFallbackTitle,
			object: layout.qListObject.qDataPages[0].qMatrix,
			handleColor: (layout.vars.handleColor) ? layout.vars.handleColor : '#CCC',
			handleColorSelected: (layout.vars.handleColor) ? layout.vars.handleColor : '#77b62a',
			barColor: (layout.vars.barColor) ? layout.vars.barColor : '#e9e9e9',
			label: (layout.vars.label) ? layout.vars.label : null,
			visible: (layout.vars.visible) ? true : false,
			ordinal: (layout.vars.ordinal) ? true : false,
			template: '',
			input: {
				width: (layout.vars.input.width) ? layout.vars.input.width : 4,
			},
			height: $element.height(),
			width: $element.width(),
			this: this,		
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
				// if (selectedObject.length >= 1) {
				// 	var min = _.min(selectedObject, function(o){return o[0].qNum;})[0].qNum,
				// 		max = _.max(selectedObject, function(o){return o[0].qNum;})[0].qNum;
				// 	layout.vars.range.values = [min, max];
				// 	$("#sliderBar").slider( "option", "values", layout.vars.range.values );
				// } else {	
					$( "#" + vars.id + "_slider #input_from" ).val(layout.vars.range.values[0]);
					$( "#" + vars.id + "_slider #input_to" ).val(layout.vars.range.values[1]);
					$("#sliderBar").slider( "option", "values", layout.vars.range.values);
				// }
			} else {	
				layout.vars.range.values[0] = layout.vars.range.min;
				layout.vars.range.values[1] = layout.vars.range.max;
				$( "#" + vars.id + "_slider #input_from" ).val(layout.vars.range.values[0]);
				$( "#" + vars.id + "_slider #input_to" ).val(layout.vars.range.values[1]);
				$("#sliderBar").slider( "option", "values", layout.vars.range.values);
			}
		});

		vars.template = '\
			<div qv-extension class="senseui-slider" id="' + vars.id + '_slider">\
		';
		if (vars.visible) {
			vars.template += '\
				<div id="sliderTop"><span class="label">' + vars.label + ':</span> \n\
					<input type="text" name="input_from" id="input_from" value="' + layout.vars.range.values[0] + '" size="' + vars.input.width + '"> to \n\
					<input type="text" name="input_to" id="input_to" value="' + layout.vars.range.values[1] + '" size="' + vars.input.width + '">\n\
				</div>';
		}

		vars.template += '\
				<div id="sliderBar"></div>\n\
				<div id="sliderMin">' + layout.vars.range.minDis + '</div>\n\
				<div id="sliderMax">' + layout.vars.range.maxDis + '</div>\n\
			</div>';

		$element.html(vars.template);

	    // me.drawSlider = function () {
	    if ($('#sliderBar').is(':empty')){
			$( "#sliderBar" ).slider({
				range: true,
				min: layout.vars.range.min,
				max: layout.vars.range.max,
				values: layout.vars.range.values,
				slide: function( event, ui ) {
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

		$( "#" + vars.id + "_slider input[type='text']" ).change(function(e) {
			layout.vars.range.values[0] = parseInt($( "#" + vars.id + "_slider #input_from" ).val());
			layout.vars.range.values[1] = parseInt($( "#" + vars.id + "_slider #input_to" ).val());
			me.selectRange();
		});

		// $("#" + vars.id + "_slider .ui-state-default").css("background", vars.handleColor);
		$("#" + vars.id + "_slider .ui-widget-header").css("background", vars.barColor);
		$("#" + vars.id + "_slider .ui-state-default.ui-state-hover, #" + vars.id + "_slider .ui-state-default.ui-state-focus, #" + vars.id + "_slider .ui-state-default.ui-state-active").css("background", vars.handleColorSelected);

	    me.selectRange = function () {	
	    	var min = parseInt(layout.vars.range.values[0]);
	    	var max = parseInt(layout.vars.range.values[1]);
			var minDis = me.getGetOrdinal(layout.vars.range.min);
			var maxDis = me.getGetOrdinal(layout.vars.range.max);
			// Make the selections
			var rangeSelected = [];
			for (var i = min; i <= max; i++) {
				rangeSelected.push(i);
			}
			me.app.field(vars.field).selectValues(rangeSelected, false, false).then(function(){
				$( "#" + vars.id + "_slider #input_from" ).val(layout.vars.range.values[0]);
				$( "#" + vars.id + "_slider #input_to" ).val(layout.vars.range.values[1]);
		    	$("#sliderBar").slider( 'values', layout.vars.range.values );
			})
	    }
	};

	// define HTML template
	// me.template = '';

	// Controller for binding
	me.controller =['$scope','$rootScope', function($scope,$rootScope){
	}];

	// Return Ordinal Numbers 1st, 2nd etc.
	me.getGetOrdinal = function (n) {
		var s = ["th","st","nd","rd"],
			v = n%100;
		return n+(s[(v-20)%10]||s[v]||s[0]);
	}

	return me;
});
