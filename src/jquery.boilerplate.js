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
				"animation_type" : "fade",
				"pause_period" : 3000,
				"thumbnail_speed" : 57,
				"thumbnail_type" : "image"
			};

		// The actual plugin constructor
		function Plugin ( element, options ) {
				this.element = element;

				//This code will grab the current directory and split off the end so that only the plugin directory is there.
				var location = document.location.origin + "/j_display/";
				this.directory = location;
				// jQuery has an extend method which merges the contents of two or
				// more objects, storing the result in the first object. The first object
				// is generally empty as we don't want to alter the default options for
				// future instances of the plugin
				this.settings = $.extend( {}, defaults, options );
				this._defaults = defaults;
				this._name = pluginName;
				//Array that holds img elements for later manipulation.
				this.img_array = Array();
				this.current_image = 1;

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
						this.init_imgs(this.settings.thumbnail_type);
						this.init_counter();
						this.init_title();
						this.init_fullscreen();

						//If the setting for auto rotate is set to true then begin a set interval to rotate through each image in the array.
						if(this.settings.auto_rotate == true){
							var program = this;
							//Build controls for pausing auto rotate.
							this.init_auto_controls();
							var auto_rotate = setInterval(function(){
								if(program.settings.auto_rotate == true){
									program.next_image();
								}
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

					//Calculate how wide the thumbnail holder needs to be roughly, can be done more precisely later on.
					var thumbnail_hold = this.img_array.length * 60 + "px";

					$("#j_display_thumbnail_hold").css({
						position : "absolute",
						width : program.determine_thumb_hold(),
						zIndex : "1000",
						paddingRight : "10px",
						backgroundColor : "black",
						bottom : "0px",
						height : "50px",
						borderTop : "solid 3px " + program.settings.color_theme,
						padding : "7px"
					});

					$(".j_display_thumbnail").css({
						width : "50px",
						height : "50px",
						cursor : "pointer",
						marginTop : "7px",
						opacity : ".3",
						float : "left",
						marginLeft : "7px",
						marginTop : "0px",
						backgroundColor : "white"
					});

					$(".j_display_thumbnail:first-child").css({
						marginLeft : "0px"
					});

					$("#j_display_thumbnail_slider").css({
						position : "absolute",
						width : "100%",
						height : "100%"
					})

					$("#j_display_stage").css({
						width : this.settings.stage_width,
						height : this.settings.stage_height,
						backgroundColor : "black",
						float : "left",
						position : "relative",
						overflow : "hidden",
						backgroundRepeat : "no-repeat",
						paddingBottom : "50px"
					});

					$("#j_display_fader").css({
						position : "absolute",
						width : "100%",
						height : "100%",
						top : "0px",
						left : "0px",
						backgroundColor : "black",
						display : "none",
						backgroundRepeat : "no-repeat"
					});

					$("#j_display_counter").css({
						backgroundColor : program.settings.color_theme,
						padding : "7px",
						position : "absolute",
						zIndex : "999",
						textAlign : "center",
						fontFamily : "sans-serif",
						fontSize : "12px",
						bottom : "67px",
						left : "7px"
					});

					$("#j_display_title").css({
						position : "absolute",
						backgroundColor : program.settings.color_theme,
						right : "7px",
						zIndex : "999",
						bottom : "67px",
						padding : "7px",
						fontFamily : "sans-serif",
						fontSize : "12px"
					});

					$("#j_display_control_left").css({
						position : "absolute",
						width : "30px",
						height : "30px",
						backgroundImage : "url("+program.directory+"img/arrow_left.png)",
						backgroundSize : "100% 100%",
						backgroundColor : "black",
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
						backgroundImage : "url("+program.directory+"img/arrow_right.png)",
						backgroundColor : "black",
						backgroundSize : "100% 100%",
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
						backgroundImage : "url('"+program.directory+"img/fullscreen.png')",
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

					$("#j_display_auto").css({
						position : "absolute",
						backgroundColor : "black",
						backgroundImage : "url("+program.directory+"img/pause.png)",
						zIndex : "999",
						width : "30px",
						height : "30px",
						backgroundRepeat : "no-repeat",
						opacity : ".5",
						top : "7px",
						left : "7px",
						backgroundPosition : "7px 7px",
						cursor : "pointer"
					});

					var window_height = $(window).height();

					$("#j_display_big_screen").css({
						backgroundColor : "black",
						position : "fixed",
						width : "100%",
						height : window_height + "px",
						top : "0px",
						left : "0px",
						zIndex : "1100",
						display : "none",
						backgroundRepeat : "no-repeat"
					});

					$("#j_display_exit_full").css({
						backgroundImage : "url("+program.directory+"img/close_fullscreen.png)",
						width : "42px",
						height : "42px",
						position : "absolute",
						zIndex : "1600",
						opacity : ".3",
						backgroundColor : "black",
						cursor : "pointer",
						display : "none",
						backgroundRepeat : "no-repeat",
						backgroundPosition : "5px 5px",
						left : "7px",
						top : "7px"
					});

					$("#j_display_thumb_left").css({
						position : "absolute",
						left : "0px",
						bottom : "0px",
						backgroundColor : program.settings.color_theme,
						backgroundImage : "url("+program.directory+"img/thumb_left.png)",
						backgroundRepeat : "no-repeat",
						backgroundPosition : "2px 16px",
						height : "64px",
						width : "30px",
						opacity : ".5",
						cursor : "pointer",
						zIndex : "1099"
					});

					$("#j_display_thumb_right").css({
						position : "absolute",
						right : "0px",
						bottom : "0px",
						backgroundColor : program.settings.color_theme,
						backgroundImage : "url("+program.directory+"img/thumb_right.png)",
						backgroundRepeat : "no-repeat",
						backgroundPosition : "-2px 16px",
						height : "64px",
						width : "30px",
						opacity : ".5",
						cursor : "pointer",
						zIndex : "1099"
					});

					$("#j_display_full_url").css({
						color : "white",
						fontFamily : "sans-serif",
						fontSize : "12px",
						cursor : "pointer",
						opacity : ".5",
						margin : "0 auto",
						width : "140px",
						backgroundColor : "black",
						textAlign : "center",
						padding : "7px",
						backgroundImage : "url("+program.directory+"img/link.png)",
						backgroundRepeat : "no-repeat",
						backgroundPosition : "0px -2px"
					});

					$("#j_display_full_url a").css({
						textDecoration : "none",
						color : "white"
					});
				},

				//Builds the divs that make up the stage of the gallery.
				//type String (required) determines different UI elements depending on what kind of thumbnails the user wants to see, if there are actual thumbnails of the images than there will be UI controls for scrolling through the images.
				build_stage: function (type){
					switch(type){
						case "image":

						//Div that holds the actual thumbnails of the images.
	            		$(this.element).append("<div id = 'j_display_stage'></div>");
	            		$("#j_display_stage").append("<div id = 'j_display_fader'></div><div id = 'j_display_thumbnail_hold'><div id = 'j_display_thumbnail_slider'></div></div>");
	            		
						break;

						case "square":
						case "circle":

						break;
					}
				},

				//Check how many images need to be in the thumbnail holder and check if there are that many, if there are not enough set the thumbnail hold width just to 100%.
				determine_thumb_hold: function(){
					if(((this.img_array.length * 57) + 7) > parseInt(this.settings.stage_width)){
						var hold_width = ((this.img_array.length * 57) + 7) + "px";

						return hold_width;
					}else{
						return "100%";
					}
				},

				//Loop through the images and build the divs that will contain the thumbnails.
					//type String (required) used to determine if the user wants to load actual image thumbnails or for less network/system intensive load only square or round dots.
				init_imgs: function(type){

					//Make sure to reference the outside object.
					var program = this;

					$(this.element).children("img").each(function(){
						program.img_array.push($(this));
						program.title_array.push($(this).attr("title"));

						//Hide the original images that the gallery will use.
						$(this).css({
							display : "none"
						});

							switch(type){
								case "image":
									$("#j_display_thumbnail_slider").append("<div class = 'j_display_thumbnail' style = 'background-image:url("+$(this).attr("src")+");background-size:"+program.scale_img($(this),"thumbnail")+";'></div>");
								break;
								
								case "square":
									$("#j_display_stage").append("<div class = 'j_display_square'>square</div>");
								break;
								
								case "circle":
								break;
							}
					});

					$("#j_display_stage").css({backgroundImage : "url("+$(program.img_array[0]).attr("src")+")",backgroundSize : program.scale_img($(this),"stage",0)});
				},

				//Create all the event functions for different parts of the gallery ui.
				init_events: function(){
					var program = this;

					//Changing the background image, as of now, can only be done while auto rotate is set to false.
					if(program.settings.auto_rotate == false){
						$("#j_display_thumbnail_slider").children(".j_display_thumbnail").each(function(index){
							$(this).click(function(){
								program.current_image = index;
								program.change_animate($(this).css('background-image'),program.settings.animation_type,index);
							});
						});
					}

					$(".j_display_thumbnail").hover(function(){
						$(this).css({opacity : "1"});
					},function(){
						$(this).css({opacity : ".5"});
					});

					$("#j_display_full_url").hover(function(){
						$(this).animate({
							opacity : "1"
						},300);
					},function(){
						$(this).animate({
							opacity : ".5"
						},300);
					});

					//controls that will slide down if the user hovers over the stage.
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

					//This should initialize a fullscreen image.
					$("#j_display_fullscreen").click(function(){
						program.set_fullscreen_image();
					});

					$("#j_display_control_right").click(function(){
						program.next_image();
					});

					$("#j_display_exit_full").click(function(){
						$(this).fadeOut("fast",function(){
							$("#j_display_big_screen").fadeOut(program.settings.animation_speed);
						});
					});

					$("#j_display_exit_full").hover(function(){
						$(this).animate({opacity : "1"},300);
					},function(){
						$(this).animate({opacity : ".5"},300);
					});

					$("#j_display_auto").hover(function(){
						$(this).animate({
							opacity : "1"
						},300);
					},function(){
						$(this).animate({
							opacity : ".5"
						},300);
					});

					$("#j_display_auto").click(function(){

						if(program.settings.auto_rotate == true){
							program.settings.auto_rotate = false;
							$(this).css({
								backgroundImage : "url(../img/play.png)"
							});
						}else{
							program.settings.auto_rotate = true;
							$(this).css({
								backgroundImage : "url(../img/pause.png)"
							});
						}
					});

					$(".thumb_control").hover(function(){
						$(this).css({
							opacity : ".8"
						});
					},function(){
						$(this).css({
							opacity : ".5"
						});
					});

					$("#j_display_thumb_left").hover(function(){
						moving = setInterval(function(){
							program.large_thumb_scroll("left");
						},100);
					},function(){
						clearInterval(moving);
					});

					$("#j_display_thumb_right").hover(function(){
							moving = setInterval(function(){
							program.large_thumb_scroll("right");
						},100);
					},function(){
						clearInterval(moving);
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
					$(this.element).append("<div id = 'j_display_big_screen'></div>");
					$("#j_display_big_screen").append("<div id = 'j_display_exit_full'></div>");
					$("#j_display_big_screen").append("<div id = 'j_display_full_url'><a href = '' id = 'j_display_org_img'>Original Image</a></div>");
				},

				init_controls: function(){
					$("#j_display_stage").append("<div id = 'j_display_control_left'></div><div id = 'j_display_control_right'></div>")

					//create the left and right ui controls for going through the thumbnails below.
					$("#j_display_stage").append("<div id = 'j_display_thumb_left' class = 'thumb_control'></div><div id = 'j_display_thumb_right' class = 'thumb_control'></div>");
				},

				init_auto_controls: function(){
					$("#j_display_stage").append("<div id = 'j_display_auto'></div>");
				},
				//End of UI control initialization functions.

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
						case "fullscreen":
							var img = this.img_array[this.current_image];

							if($(img).width() > $(img).height()){
								var b_size = "auto 100%";
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
							$("#j_display_fader").css({backgroundImage : obj,backgroundSize : program.scale_img(obj,"stage",cur),backgroundPosition : program.center_img("stage")});
							$("#j_display_fader").stop().fadeIn(program.settings.animation_speed,function(){
								$("#j_display_stage").css({backgroundImage : obj,backgroundSize : program.scale_img(obj,"stage",cur),backgroundPosition : program.center_img("stage")});
								$("#j_display_fader").css("display","none");
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
					var program = this;

					setTimeout(function(){
						if(program.current_image >= (program.img_array.length -1)){
							program.slide_thumbs("reset");
							program.current_image = 0;
						}else{
							program.slide_thumbs("left");
							program.current_image++;
						}
					},1000);

					this.change_animate("url("+$(this.img_array[this.current_image]).attr("src")+")",this.settings.animation_type,this.current_image);

					//When a image switches, indicate the switch in the thumbnails by changing the opacity of the current image the loop is on.
					$(".j_display_thumbnail").eq(program.current_image -1).animate({
						opacity : ".3"
					},500);

					$(".j_display_thumbnail").eq(program.current_image).animate({
						opacity : "1"
					},500);
					//End of switching animation.
				},

				previous_image: function(){

				},

				stage_pause: function(){

				},

				//Takes the currently focused img, creates a temporary img element to determine the size of each dimension of the background image and then centers the background image by returning the css string needed to center it.
					//context String (required) differentiates between the normal stage and the fullscreen.
				center_img: function(context){
					var program = this;

					//Temporary image is always going to be needed to determine where a background img should be placed.
					var temp_img = document.createElement("img");
					temp_img.src = $(program.img_array[program.current_image]).attr("src");

					//Determine where to put the temporary image based on the context.
					switch(context){
						case "stage":
							document.getElementById("j_display_stage").appendChild(temp_img);
							//The rest of the function runs as usual we only need to 
							if(temp_img.width > temp_img.height){
								temp_img.style.width = "100%";

								var background_position = "0px "+(parseInt(program.settings.stage_height) - temp_img.height) / 2 + "px";
							}else if(temp_img.width < temp_img.height){
								temp_img.style.height = "100%";

								var background_position = (parseInt(program.settings.stage_width) - temp_img.width) / 2 + "px 0px";
							}
						break

						case "fullscreen":
							document.getElementById("j_display_big_screen").appendChild(temp_img);
							
							var background_position = "50%";
						break;
					}
					temp_img.remove();
					return background_position;
				},

				//When auto is on then we need to keep track of which photo is actually focused on, if auto is not on than there will be sliding arrows for the user to find photos.
				slide_thumbs: function(direction){
					var program = this;

					switch(direction){
						case "left":
							$("#j_display_thumbnail_slider").animate({
								left : "-=57px"
							},200);
						break;

						case "right":
						break;

						case "reset":
							$("#j_display_thumbnail_slider").animate({
								left : "7px"
							},200);						
						break;
					}
				},

				//When a thumbnail is click on, the thumbnail slider will scroll to the calculated position.
				scroll_to_thumb: function(){
					var program = this;

					var current_thumb = $(".j_display_thumbnail").eq(program.current_image);

					var pos_left = (program.current_image * 57) - 7 + "px";

					$("#j_display_thumbnail_slider").animate({
						left : "-" + pos_left
					},300);
				},

				large_thumb_scroll: function(direction){
					var program = this;

					switch(direction){
						case "left":
							var position = parseInt($("#j_display_thumbnail_slider").css("left"));

							if(position >= 7){
								$("#j_display_thumbnail_slider").stop().animate({left : "7px"},100);
							}else{
								$("#j_display_thumbnail_slider").stop().animate({left : "+="+program.settings.thumbnail_speed+"px"},100);
							}
						break;

						case "right":
							var position = parseInt($("#j_display_thumbnail_slider").css("left"));
							var right_most = (((($(".j_display_thumbnail").size() - 1) * 57) - 400)* -1);

							if(position <= right_most){
								$("#j_display_thumbnail_slider").stop().animate({left : (right_most + 7) + "px"},100);	
							}else{
								$("#j_display_thumbnail_slider").stop().animate({left : "-="+program.settings.thumbnail_speed+"px"},100);	
							}			
						break;
					}
				},

				//When fullscreen is click, this function grabs the current image variable and sets the big screen background image to that of the current image.
				set_fullscreen_image: function(){
					var program = this;
					var background_url = $(this.img_array[this.current_image]).attr("src");

					$("#j_display_org_img").attr("href",background_url);

					$("#j_display_big_screen").css({
						backgroundImage : "url("+background_url+")",
						backgroundSize : program.scale_img($(program.img_array[program.current_image]),"fullscreen",program.current_image),
						backgroundPosition : program.center_img("fullscreen")
					});

					$("#j_display_big_screen").fadeIn(program.settings.animation_speed,function(){
						$("#j_display_exit_full").fadeIn("fast");
					});
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
