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
	'underscore',	
	"css!./jquery-ui.css",
	"css!./jquery-ui-slider-pips.css",
	"css!./senseui-slider.css",
	"./jquery-ui-slider-pips",
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
								HandleColor: {
									type: "string",
									label: 'Slider Handle Color',
									ref: 'vars.handleColor',
									defaultValue: '#f6f6f6'
							    },
								HandleColorSelected: {
									type: "string",
									label: 'Slider Handle Selected Color',
									ref: 'vars.handleColorSelected',
									defaultValue: '#77b62a'
							    },
								BarColor: {
									type: "string",
									label: 'Slider Bar Color',
									ref: 'vars.barColor',
									defaultValue: '#e9e9e9'
							    },
								Label: {
									type: "string",
									label: 'Label',
									ref: 'vars.label',
									defaultValue: 'Label'
							    },	
								From: {
									type: "string",
									label: 'From',
									ref: 'vars.from',
									defaultValue: ''
							    },	
								To: {
									type: "string",
									label: 'To',
									ref: 'vars.to',
									defaultValue: 'to'
							    },	
								LabelVisibility: {
									type: "boolean",
									label: 'Label Visibility',
									ref: 'vars.visible',
									defaultValue: true
							    },
								TicksVisibility: {
									type: "boolean",
									label: 'Ticks Visibility',
									ref: 'vars.tick.visibility',
									defaultValue: false
							    },
								TickFrequency: {
									type: "number",
									expression: "none",
									label: "Tick Frequency",
									component: "slider",
									ref: "vars.tick.frequency",
									defaultValue: 1,
									min: 1,
									max: 10
								},
								LabelPadding: {
									type: "number",
									expression: "none",
									label: 'Label Bottom Padding',
									ref: 'vars.padding',
									defaultValue: 5
							    },
								SliderOrdinal: {
									type: "boolean",
									label: 'Display Ordinal',
									ref: 'vars.ordinal',
									defaultValue: false
							    },
								sliderSingle: {
									type: "boolean",
									label: 'Single Slider',
									ref: 'vars.sliderSingle',
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
								FontSize: {
									type: "number",
									expression: "none",
									label: "Font Size",
									component: "slider",
									ref: "vars.font.size",
									defaultValue: 12,
									min: 10,
									max: 14
								},
								FontColor: {
									type: "string",
									label: 'Font Color',
									ref: 'vars.font.color',
									defaultValue: '#000'
							    },
								FontColorSelected: {
									type: "string",
									label: 'Selected Color',
									ref: 'vars.font.selected',
									defaultValue: '#FF7A00'
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
			v: "1.1",
			id: layout.qInfo.qId,
			field: layout.qListObject.qDimensionInfo.qFallbackTitle,
			object: layout.qListObject.qDataPages[0].qMatrix,
			handleColor: (layout.vars.handleColor) ? layout.vars.handleColor : '#CCC',
			handleColorSelected: (layout.vars.handleColorSelected) ? layout.vars.handleColorSelected : '#77b62a',
			barColor: (layout.vars.barColor) ? layout.vars.barColor : '#e9e9e9',
			label: (layout.vars.label) ? layout.vars.label : null,
			from: (layout.vars.from) ? layout.vars.from : '',
			to: (layout.vars.to) ? layout.vars.to : 'to',
			visible: (layout.vars.visible) ? true : false,
			tick: {
				visibility: (layout.vars.tick.visibility) ? true : false,
				frequency: (layout.vars.tick.frequency) ? layout.vars.tick.frequency : 1,
			},
			padding: (layout.vars.padding) ? layout.vars.padding : 5,
			ordinal: (layout.vars.ordinal) ? true : false,
			sliderSingle: (layout.vars.sliderSingle) ? true : false,
			template: '',
			input: {
				width: (layout.vars.input.width) ? layout.vars.input.width : 4,
			},
			font: {
				size: (layout.vars.font.size) ? layout.vars.font.size : 12,
				color: (layout.vars.font.color) ? layout.vars.font.color : '#000',
				selected: (layout.vars.font.selected) ? layout.vars.font.selected : '#FF7A00',
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

		console.log(vars)
		
		//Get Selection Bar
		me.app.getList("SelectionObject", function(reply){
			var selectedFields = reply.qSelectionObject.qSelections;
			if (_.where(selectedFields, {'qField': vars.field}) && _.where(selectedFields, {'qField': vars.field}).length) {
				var selectedObject = _.filter(vars.object, function(obj){ 
					return obj[0].qState === 'S'; 
				});
				if (selectedObject.length >= 1) {
					var min = _.min(selectedObject, function(o){return o[0].qNum;})[0].qNum,
						max = _.max(selectedObject, function(o){return o[0].qNum;})[0].qNum;
					layout.vars.range.values = [min, max];
					$("#sliderBar").slider( "option", "values", layout.vars.range.values );
					
					$(`#${vars.id}_slider #input_from`).val(min)
					$(`#${vars.id}_slider #input_to`).val(max)
				}
			}
		});

		vars.template = '\
			<div qv-extension class="senseui-slider" id="' + vars.id + '_slider">\
		';
		if (vars.visible) {
			vars.template += '\
				<div id="sliderTop"><span class="senseui-slider-label">' + vars.label + ':</span> \n\
					' + vars.from + '\
					<input type="text" name="input_from" id="input_from" value="' + layout.vars.range.values[0] + '" size="' + vars.input.width + '"> ' + vars.to + ' \n\
					<input type="text" name="input_to" id="input_to" value="' + layout.vars.range.values[1] + '" size="' + vars.input.width + '">\n\
				</div>';
		}

		vars.template += '\
				<div id="sliderBar"></div>\n\
			';

	    if (!vars.tick.visibility) {
			vars.template += '\
				<div id="sliderMin">' + layout.vars.range.minDis + '</div>\n\
				<div id="sliderMax">' + layout.vars.range.maxDis + '</div>\n\
			';
	    }

		vars.template += '\
			</div>\n\
			';

		$element.html(vars.template);

	    // me.drawSlider = function () {
	    if ($('#sliderBar').is(':empty')){
			$( "#sliderBar" ).slider({
				range: (!vars.sliderSingle)?true:false,
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

	    if (vars.tick.visibility) {
			$("#sliderBar").slider().slider("pips",{  
				first: 'label',  
				last: 'label',  
				rest: 'label', 
				step: vars.tick.frequency,
				// qlik: me.selectRange()
			});
	    }

		$( "#" + vars.id + "_slider input[type='text']" ).change(function(e) {
			layout.vars.range.values[0] = parseInt($( "#" + vars.id + "_slider #input_from" ).val());
			layout.vars.range.values[1] = parseInt($( "#" + vars.id + "_slider #input_to" ).val());
			me.selectRange();
		});

		// CSS
		$("#" + vars.id + "_slider .ui-state-default").css("background", vars.handleColor);
		$("#" + vars.id + "_slider .ui-widget-header").css("background", vars.barColor);
		$('.ui-slider-handle.ui-state-hover, .ui-slider-handle.ui-state-focus, .ui-slider-handle.ui-state-active').css("background", vars.handleColorSelected);

		$("#" + vars.id + "_slider .ui-slider-handle").hover(function(){
			$(this).css("background",vars.handleColorSelected);
		},function(){
			$(this).css("background",vars.handleColor);
		});

		// Hover colors for all labels except the 2 selected
		$("#" + vars.id + "_slider .ui-slider-pip:not(.ui-slider-pip-selected-1):not(.ui-slider-pip-selected-2)").hover(function(){
			$(this).css("color", vars.font.selected);
		},function(){
			$(this).css("color", vars.font.color);
		});
		// Hover colors for selected labels
		$("#" + vars.id + "_slider .ui-slider-pip-selected-1, #" + vars.id + "_slider .ui-slider-pip-selected-2").hover(function(){
			$(this).css("color", vars.font.selected);
		},function(){
			$(this).css("color", vars.font.selected);
		});

		$("#" + vars.id + "_slider").css("font-size", vars.font.size);
		$("#" + vars.id + "_slider .ui-slider-pip").css("font-size", vars.font.size);
		$("#" + vars.id + "_slider .ui-slider-pip").css("color", vars.font.color);
		$("#" + vars.id + "_slider").css("color", vars.font.color);
		$("#" + vars.id + "_slider .ui-slider-pip-selected-1").css("color", vars.font.selected);
		$("#" + vars.id + "_slider .ui-slider-pip-selected-2").css("color", vars.font.selected);
		$("#" + vars.id + "_slider #sliderTop ").css("padding-bottom", vars.padding);
		
	    me.selectRange = function () {	
	    	var min = parseInt(layout.vars.range.values[0]);
	    	var max = parseInt(layout.vars.range.values[1]);
			var minDis = me.getGetOrdinal(layout.vars.range.min);
			var maxDis = me.getGetOrdinal(layout.vars.range.max);
			// Make the selections
			var rangeSelected = [];
			var rangeSelected2 = [];
			for (var i = min; i <= max; i++) {
				_.find(layout.qListObject.qDataPages[0].qMatrix, function(obj){
					if (obj[0].qNum==i) {
						rangeSelected2.push(obj[0].qElemNumber);
					}; 
				}); 
				rangeSelected.push(i);
			}
			// @TODO find out why app.field works only sometimes. 
// 			me.app.field(vars.field).select(rangeSelected, false, false).then(function(e){
// 				$( "#" + vars.id + "_slider #input_from" ).val(layout.vars.range.values[0]);
// 				$( "#" + vars.id + "_slider #input_to" ).val(layout.vars.range.values[1]);
// 		    	$("#sliderBar").slider( 'values', layout.vars.range.values );
// 			})
			// This is only for a field selection not a dimension. I have to make the app.field work all of the time 
			$( "#" + vars.id + "_slider #input_from" ).val(layout.vars.range.values[0]);
			$( "#" + vars.id + "_slider #input_to" ).val(layout.vars.range.values[1]);
	    	$("#sliderBar").slider( 'values', layout.vars.range.values );
			vars.this.backendApi.selectValues(0, rangeSelected2, false)
	    }
		console.info('%c SenseUI-Slider ' + vars.v + ': ', 'color: red', '#' + vars.id + ' Loaded!');
	};

	// define HTML template
	// me.template = '';

	// Controller for binding
	me.controller =['$scope','$rootScope', function($scope,$rootScope){
		$scope.$watchCollection('layout.vars.range', function(obj) {
		})
	}];

	// Return Ordinal Numbers 1st, 2nd etc.
	me.getGetOrdinal = function (n) {
		var s = ["th","st","nd","rd"],
			v = n%100;
		return n+(s[(v-20)%10]||s[v]||s[0]);
	}

	return me;
});
