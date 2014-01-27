// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ( $, window, document, undefined ) {

		// undefined is used here as the undefined global variable in ECMAScript 3 is
		// mutable (ie. it can be changed by someone else). undefined isn't really being
		// passed in so we can ensure the value of it is truly undefined. In ES5, undefined
		// can no longer be modified.

		// window and document are passed through as local variable rather than global
		// as this (slightly) quickens the resolution process and can be more efficiently
		// minified (especially when both are regularly referenced in your plugin).

		// Create the defaults once
		var pluginName = "j_display",
			defaults = {	
				"stage_width" : "400px",
				"stage_height" : "400px",
				"animation_speed" : 500,
				"color_theme" : "#000000",
				"auto_rotate" : false,
				"rotate_speed" : 5000,
				"animation_type" : "fade"
			};

		// The actual plugin constructor
		function Plugin ( element, options ) {
				this.element = element;
				// jQuery has an extend method which merges the contents of two or
				// more objects, storing the result in the first object. The first object
				// is generally empty as we don't want to alter the default options for
				// future instances of the plugin
				this.settings = $.extend( {}, defaults, options );
				this._defaults = defaults;
				this._name = pluginName;
				//Array that holds img elements for later manipulation.
				this.img_array = Array();
				this.current_image = 0;

				this.title_array = Array();
				this.init();
		}

		//Essentially an array of functions.
		Plugin.prototype = {
				init: function () {
						// Place initialization logic here
						// You already have access to the DOM element and
						// the options via the instance, e.g. this.element
						// and this.settings
						// you can add more functions like the one below and
						// call them like so: this.yourOtherFunction(this.element, this.settings).

						this.build_stage();
						this.init_imgs();
						this.init_counter();
						this.init_title();
						this.init_fullscreen();

						//If the setting for auto rotate is set to true then begin a set interval to rotate through each image in the array.
						if(this.settings.auto_rotate == true){
							var program = this;

							var auto_rotate = setInterval(function(){
								program.next_image();
							},program.settings.rotate_speed);
						}else{
							this.init_controls();
						}

						this.init_styling();
						this.init_events();
				},
			
				//Handles styling for all the ui in the gallery.
				init_styling: function(){
					var program = this;

					$("#j_display_thumbnail_hold").css({
						float : "left",
						paddingRight : "10px"
					});

					$(".j_display_thumbnail").css({
						width : "50px",
						height : "50px",
						cursor : "pointer",
						marginTop : "7px",
						opacity : ".5"
					});

					$(".j_display_thumbnail:first-child").css({
						marginTop : "0px"
					});

					$("#j_display_stage").css({
						width : this.settings.stage_width,
						height : this.settings.stage_height,
						backgroundColor : "black",
						float : "left",
						position : "relative",
						overflow : "hidden",
						backgroundRepeat : "no-repeat"
					});

					$("#j_display_fader").css({
						position : "absolute",
						width : "100%",
						height : "100%",
						backgroundColor : "black",
						display : "none",
						backgroundRepeat : "no-repeat"
					});

					$("#j_display_counter").css({
						backgroundColor : "white",
						padding : "7px",
						position : "absolute",
						zIndex : "999",
						textAlign : "center",
						fontFamily : "sans-serif",
						fontSize : "12px",
						bottom : "7px",
						left : "7px"
					});

					$("#j_display_title").css({
						position : "absolute",
						backgroundColor : "white",
						right : "7px",
						zIndex : "999",
						bottom : "7px",
						padding : "7px",
						fontFamily : "sans-serif",
						fontSize : "12px"
					});

					$("#j_display_control_left").css({
						position : "absolute",
						width : "30px",
						height : "30px",
						backgroundImage : "url(../img/arrow_left.png)",
						opacity : ".5",
						zIndex : "999",
						top : "-35px",
						left : "7px",
						cursor : "pointer"
					});

					$("#j_display_control_right").css({
						position : "absolute",
						width : "30px",
						height : "30px",
						backgroundColor : "black",
						opacity : ".5",
						zIndex : "999",
						right : "7px",
						top : "-35px",
						cursor : "pointer"
					});

					$("#j_display_fullscreen").css({
						position : "absolute",
						backgroundColor : "black",
						color : "white",
						zIndex : "999",
						padding : "7px 7px 7px 32px",
						textAlign : "right",
						left : (parseInt(program.settings.stage_width) - 100) / 2 + "px",
						top : "-35px",
						opacity : ".5",
						fontFamily : "sans-serif",
						fontSize : "12px",
						backgroundImage : "url('../img/fullscreen.png')",
						backgroundRepeat : "no-repeat",
						cursor : "pointer",
						backgroundPosition : "8px 6px"
					});

					$(".selected_thumb").css({
						width : "50px",
						height : "50px",
						cursor : "pointer",
						marginTop : "7px",
						opacity : "1"
					});
				},

				//Builds the divs that make up the stage of the gallery.
				build_stage: function (){
					//Div that holds the actual thumbnails of the images.
            		$(this.element).append("<div id = 'j_display_thumbnail_hold'></div><div id = 'j_display_stage'></div>");
            		$("#j_display_stage").append("<div id = 'j_display_fader'></div>");
				},

				//Loop through the images and build the divs that will contain the thumbnails.
				init_imgs: function(){
					//Make sure to reference the outside object.
					var program = this;
					$(this.element).children("img").each(function(){
						program.img_array.push($(this));
						program.title_array.push($(this).attr("title"));

						//Hide the original images that the gallery will use.
						$(this).css({
							display : "none"
						});

						$("#j_display_thumbnail_hold").append("<div class = 'j_display_thumbnail' style = 'background-image:url("+$(this).attr("src")+");background-size:"+program.scale_img($(this),"thumbnail")+";'></div>");
					});

					$("#j_display_stage").css({backgroundImage : "url("+$(program.img_array[0]).attr("src")+")",backgroundSize : program.scale_img($(this),"stage",0)});
				},

				//Create all the event functions for different parts of the gallery ui.
				init_events: function(){
					var program = this;
					$("#j_display_thumbnail_hold").children(".j_display_thumbnail").each(function(index){
						$(this).click(function(){
							program.change_animate($(this).css('background-image'),program.settings.animation_type,index);
							$(this).fadeTo("slow",1);
						});
					});

					$(".j_display_thumbnail").hover(function(){
						$(this).animate({opacity : "1"},"fast");
					},function(){
						$(this).animate({opacity : ".5"},"fast");
					});

					$("#j_display_stage").hover(function(){
						$("#j_display_control_left").animate({top : "7px"},150);
						$("#j_display_control_right").animate({top : "7px"},150);
						$("#j_display_fullscreen").animate({top : "7px"},150);
					},function(){
						$("#j_display_control_left").animate({top : "-35px"},150);
						$("#j_display_control_right").animate({top : "-35px"},150);
						$("#j_display_fullscreen").animate({top : "-35px"},150);
					});

					$("#j_display_fullscreen").hover(function(){
						$(this).animate({opacity : ".8"},200);
					},function(){
						$(this).animate({opacity : ".5"});
					});
				},

				//Three funcitons below create ui divs for different controls on the gallery such as fullscreen, next/forward and counting.
				init_counter: function(){
					$("#j_display_stage").append("<div id = 'j_display_counter'> 1 / "+ this.img_array.length +"</div>");
				},

				init_title: function(){
					$("#j_display_stage").append("<div id = 'j_display_title'>working</div>");
				},

				init_fullscreen: function(){
					$("#j_display_stage").append("<div id = 'j_display_fullscreen'>Fullscreen</div>");
				},

				init_controls: function(){
					$("#j_display_stage").append("<div id = 'j_display_control_left'></div><div id = 'j_display_control_right'></div>")
				},

				focus_thumnail:function(thumbnail){

				},

				//Determines the width and height of a background img depending on the images resolution/ratio.
				scale_img: function(img,type,cur){
					switch(type){

						case "thumbnail":
							if($(img).width() > $(img).height()){
								var b_size = "auto 100%";
							}else if($(img).width() < $(img).height()){
								var b_size = "100% auto";
							}else{
								var b_size = "100% 100%";
							}

							return b_size;
						break;
						case "stage":
							var img = this.img_array[cur];
							if($(img).width() > $(img).height()){
								var b_size = "100% auto";
							}else if($(img).width() < $(img).height()){
								var b_size = "auto 100%";
							}else{
								var b_size = "100% 100%";
							}

							return b_size;
						break;
					}
				},

				change_animate: function(obj,type,cur){
					var program = this;
					switch(type){
						case "fade":
							$("#j_display_fader").css({backgroundImage : obj,backgroundSize : program.scale_img(obj,"stage",cur)});

							$("#j_display_fader").stop().fadeIn(program.settings.animation_speed,function(){
								$("#j_display_stage").css({backgroundImage : obj,backgroundSize : program.scale_img(obj,"stage",cur)});
								$("#j_display_fader").css({display : "none"});
							});	

							this.update_counter(cur);
							this.update_title(cur);					
						break;
						case "slide":
							$("#j_display_fader").css({left : "-"+this.settings.stage_width,display : "block", backgroundImage : obj,backgroundSize : program.scale_img(obj,"stage",cur)});

							$("#j_display_fader").stop().animate({
								left : "0px"
							},program.settings.animation_speed,function(){
								$("#j_display_stage").css({backgroundImage : obj,backgroundSize : program.scale_img(obj,"stage",cur)});
								$("#j_display_fader").css({left : "-"+program.settings.stage_width});
							});

							this.update_counter(cur);
							this.update_title(cur);
						break;
						case "floating":

						break;
					}
				},

				update_counter: function(cur){
					var program = this;
					$("#j_display_counter").html((cur + 1) + " / " + program.img_array.length);
				},

				update_title: function(cur){
					var program = this;
					$("#j_display_title").html(program.title_array[cur]);
				},

				next_image: function(){
					this.change_animate("url("+$(this.img_array[this.current_image]).attr("src")+")",this.settings.animation_type,this.current_image);

					if(this.current_image >= (this.img_array.length -1)){
						this.current_image = 0;
					}else{
						this.current_image++;
					}
				},

				previous_image: function(){

				}
		};

		// A really lightweight plugin wrapper around the constructor,
		// preventing against multiple instantiations
		$.fn[ pluginName ] = function ( options ) {
				return this.each(function() {
						if ( !$.data( this, "plugin_" + pluginName ) ) {
								$.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
						}
				});
		};

})( jQuery, window, document );
