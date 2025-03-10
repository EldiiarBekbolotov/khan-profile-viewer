/******************************************************************************

MIT License

Copyright (c) 2023 Mushy Avocado

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

******************************************************************************/
(function() {

	var loadID = Date.now();
	window.currentLoad = loadID;

	(function() {
		let warnedFirefox = !navigator.userAgent.toLowerCase().includes('firefox') || localStorage.getItem('warnedFirefox');
		if (!warnedFirefox) {
			alert("This program game uses Processing.js, which has poor performance in Firefox. It is recommended you open this in Chrome.");
			localStorage.setItem('warnedFirefox', true);
		}
	})();

	function getFunctionBody(func) {
		if (typeof func === "function") {
			func = func.toString();
		}
		return func.substring(func.indexOf("{") + 1, func.lastIndexOf("}"));
	}
	// Whether a url has a file extension or not.
	function hasFileExtension(source) {
		var a = source.split('/');
		return a[a.length - 1].includes('.');
	}
	// Caches assets to load before the program starts for preloading
	const assets = (function() {
		let cache = {};
		let imageURLs = [],
			soundURLs = [];
		let currentProgress = 0;

		function loadCache() {
			return Promise.all([
				// Load cached image URLs
				new Promise((resolve, reject) => {
					let index = 0,
						next = () => {
							currentProgress++;
							if (++index >= imageURLs.length) resolve();
						};
					if (imageURLs.length === 0) return void resolve();
					imageURLs.forEach(url => {
						cache[url] = new Image();
						cache[url].crossOrigin = "anonymous";
						cache[url].onload = next;
						cache[url].onerror = next
						cache[url].src = url;
					});
				}).catch(console.error),
				// Load cached sound URLs
				new Promise((resolve, reject) => {
					let index = 0,
						next = () => {
							currentProgress++;
							if (++index >= soundURLs.length) resolve();
						};
					if (soundURLs.length === 0) return void resolve();
					soundURLs.forEach(url => {
						cache[url] = new Audio(url);
						cache[url].crossOrigin = "anonymous";
						cache[url].oncanplaythrough = next;
						cache[url].onerror = next;
					});
				}).catch(console.error),
			]);
		}
		const assetRoot = '/';
		return {
			// Loading progress (between 0-1)
			get progress() {
				return currentProgress / (soundURLs.length + imageURLs.length);
			},
			load: loadCache,
			cache: cache,
			cacheImageURL: url => {
				if (imageURLs.indexOf(url) !== -1) return;
				imageURLs.push(url);
			},
			cacheSoundURL: url => {
				if (soundURLs.indexOf(url) !== -1) return;
				soundURLs.push(url);
			},
			getImageURL: source => {
				if (window.location.href.includes("kasandbox.org"))
					source = "https://cdn.kastatic.org/third_party/javascript-khansrc/live-editor/build/images/" + source + ".png";
				else if (!source.startsWith(assetRoot + 'images'))
					source = assetRoot + 'images/' + source;
				if (!hasFileExtension(source))
					source += '.png';
				return source;
			},
			getSoundURL: source => {
				if (window.location.href.includes("kasandbox.org"))
					source = "https://cdn.kastatic.org/third_party/javascript-khansrc/live-editor/sounds/" + source;
				else if (!source.startsWith(assetRoot + 'sounds'))
					source = assetRoot + 'sounds/' + source;
				if (!hasFileExtension(source))
					source += '.mp3';
				return source;
			},
		};
	})();
	const fullscreen = (function() {
		function enableFullscreen() {
			if (document.documentElement.reqestFullscreen) {
				document.documentElement.requestFullscreen();
			} else if (document.documentElement.mozRequestFullScreen) {
				document.documentElement.mozRequestFullScreen();
			} else if (document.documentElement.webkitRequestFullscreen) {
				document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
			}
		}

		function disableFullscreen() {
			if (document.exitFullScreen) {
				document.exitFullScreen();
			} else if (document.mozExitFullScreen) {
				document.mozExitFullScreen();
			} else if (document.webkitExitFullScreen) {
				document.webkitExitFullScreen();
			}
			if (document.cancelFullScreen) {
				document.cancelFullScreen();
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if (document.webkitCancelFullScreen) {
				document.webkitCancelFullScreen();
			}
		}

		function isFullscreen() {
			return document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
		}
		// Fullscreen toggle
		function toggleFullscreen() {
			if (!isFullscreen())
				enableFullscreen();
			else
				disableFullscreen();
		}
		return {
			enable: enableFullscreen,
			disable: disableFullscreen,
			toggle: toggleFullscreen,
		};
	})();
	// Loaded assets that are ready for PJS to use
	const pjsImages = {},
		pjsSounds = {};
	// Initializes the program to make it load
	window.importerKA = function(processing, canvas) {
		const layout = (function(canvas) {
			// Updates the scale of the canvas to fit its parent element
			function updateScaling() {
				var parent = canvas.parentElement;
				let parentRect = parent.getBoundingClientRect();
				var parentWidth = parentRect.right - parentRect.left;
				var parentHeight = parentRect.bottom - parentRect.top;
				var scaleX = parentWidth / canvas.width;
				var scaleY = parentHeight / canvas.height;
				if (Math.min(scaleX, scaleY) > 1) {
					canvas.style.scale = 1;
					return;
				}
				canvas.style.scale = Math.min(scaleX, scaleY);
			};
			return {
				update: function() {
					updateScaling();
				},
			}
		})(canvas);
		// Subsribe to various events to update the layout.
		screen.orientation.addEventListener("change", layout.update);
		window.addEventListener("resize", layout.update);
		window.addEventListener("load", layout.update);
		// To fix an issue where Processing.js throws an error on mobile and breaks the layout
		window.addEventListener("touchstart", () => layout.update(), {
			once: true,
		});
		// Apply defaults
		processing.size(400, 400);
		processing.angleMode = "degrees";
		processing.draw = function() {}; // draw() needs a value for PJS to run it
		var doResize = true;
		var canvasScaleX = 1;
		var canvasScaleY = 1;
		// Tells processing.js what the width and height actually is for certain rendering functions
		function pushSize() {
			processing.width *= canvasScaleX;
			processing.height *= canvasScaleY;
		}

		function popSize() {
			processing.width /= canvasScaleX;
			processing.height /= canvasScaleY;
		}
		// Save old copies of PJS functions
		const old = {
			get: processing.get.bind(processing),
			image: processing.image.bind(processing),
			loadImage: processing.loadImage.bind(processing),
			background: processing.background.bind(processing),
			resetMatrix: processing.resetMatrix.bind(processing),
			filter: processing.filter.bind(processing),
			loadImage: processing.loadImage.bind(processing),
		};

		function snapToIncrement(val, increment) {
			return Math.ceil(val / increment) * increment;
		}
		// Resizes the canvas to render at a higher resolution.
		const resize = function(width, height) {
			let scaleIncrement = Math.min(processing.width, processing.height);
			if (!doResize) return;
			width = snapToIncrement(width, scaleIncrement);
			height = snapToIncrement(height, scaleIncrement);
			// Match to the aspect ratio of the canvas
			width = height * (processing.width / processing.height);
			height = height;
			canvas.width = width;
			canvas.height = height;
			canvasScaleX = width / processing.width;
			canvasScaleY = height / processing.height;
			old.resetMatrix();
			processing.scale(canvasScaleX, canvasScaleY);
			layout.update();
		};
		// Size only sets the actual variable "width" and "height". resize() takes care of the rest.
		processing.size = function(w, h) {
			processing.width = w;
			processing.height = h;
			var w = window.parent !== window.top ? document.body.clientWidth : screen.width;
			var h = window.parent !== window.top ? document.body.clientHeight : screen.height;
			var targetW = w;
			var targetH = h;
			resize(targetW, targetH);
			layout.update();
			processing.background(255);
		};
		// Sets the title for the project
		processing.title = function(value) {
			document.title = value;
		};
		// Override loadImage and getImage.
		// Image files should be stored in /images/filePath
		processing.loadImage = processing.getImage = function(source) {
			source = assets.getImageURL(source);
			if (!pjsImages[source]) {
				if (assets.cache[source]) {
					let pimg = new processing.PImage(),
						img = assets.cache[source];
					pimg.fromHTMLImageData(img);
					pimg.loaded = true;
					pjsImages[source] = pimg;
				} else {
					pjsImages[source] = old.loadImage(source);
					pjsImages[source].sourceImg.crossOrigin = "anonymous";
					assets.cacheImageURL(source);
				}
			}
			return pjsImages[source];
		}
		// Override getSound and playSound.
		// Sound files should be stored in /sounds/filePath
		processing.getSound = function(source) {
			source = assets.getSoundURL(source);
			if (!pjsSounds[source]) {
				pjsSounds[source] = assets.cache[source] || new Audio(source);
				pjsSounds[source].audio = pjsSounds[source];
			}
			return pjsSounds[source];
		}
		processing.playSound = function(sound, volume = 1) {
			sound.volume = volume;
			sound.currentTime = 0;
			sound.play().catch(e => {
				console.warn(e);
			});
		}
		// Draws at the correct scale when no width and height are given
		processing.image = function(img, x, y, w, h) {
			if (!w && !h)
				old.image(img, x, y, img.width / (img.originScaleX || 1), img.height / (img.originScaleY || 1));
			else old.image(img, x, y, w, h);
		};
		// Captures the correct part of the screen
		processing.get = function() {
			var ret;
			if (arguments.length == 0)
				ret = old.get(0, 0, canvas.width, canvas.height);
			else if (arguments.length == 2)
				ret = old.get(arguments[0] * canvasScaleX, arguments[1] * canvasScaleY);
			else
				ret = old.get(arguments[0] * canvasScaleX, arguments[1] * canvasScaleY, arguments[2] * canvasScaleX, arguments[3] * canvasScaleY);
			// Makes sure the images are rendered correctly at a different scale
			ret.originScaleX = canvasScaleX;
			ret.originScaleY = canvasScaleY;
			return ret;
		};
		// Makes sure these render on the whole canvas
		processing.background = function(...args) {
			pushSize();
			old.background.apply(processing, args);
			popSize();
		};
		processing.filter = function(...args) {
			pushSize();
			old.filter.apply(processing, args);
			popSize();
		};
		// Makes sure the canvas is still scaled correctly
		processing.resetMatrix = function() {
			old.resetMatrix();
			processing.scale(canvasScaleX, canvasScaleY);
		};
		processing.debug = console.log.bind(console);
		processing.Program = {
			restart: window.location.reload.bind(window),
			assertEqual: console.warn.bind(console),
		};
		// Update mouse coordinates
		window.addEventListener("mousemove", function(e) {
			processing.mouseX = processing.round(processing.canvasX(e.clientX));
			processing.mouseY = processing.round(processing.canvasY(e.clientY));
		});
		// Scales an axis based on the size of the canvas
		// Takes a screen position as input
		processing.canvasX = function(x) {
			var clientRect = canvas.getBoundingClientRect();
			var scaleX = clientRect.width / (processing.width * canvasScaleX);
			return (x - clientRect.left) / (scaleX * canvasScaleX);
		};
		processing.canvasY = function(y) {
			var clientRect = canvas.getBoundingClientRect();
			var scaleY = clientRect.height / (processing.height * canvasScaleY);
			return (y - clientRect.top) / (scaleY * canvasScaleY);
		};
		// Sets/toggles the fullscreen state
		processing.fullscreen = function(bool) {
			if (bool == true) fullscreen.enable();
			else if (bool == false) fullscreen.disable();
			else fullscreen.toggle();
		};
		// Disabled scaling the canvas to be fullscreen
		processing.noResize = function() {
			resize(processing.width, processing.height);
			doResize = false;
		};
		processing.noCursor = function() {
			processing.cursor("none");
		};
		processing.updateLayout = () => layout.update();
		window.LoopProtector = function() {};
		processing.KAInfiniteLoopSetTimeout = () => {};
		processing.externals = {
			canvas: canvas,
			context: canvas.getContext("2d"),
		};
		layout.update();
	}

	let pjsInstanceCount = 0;
	window.runPJS = async function(program) {

		const programString = program.toString();
		// Find all getImage() or loadImage() calls to preload before the program starts
		(function() {
			const imageURLs = [
				"animals/boxer-laying-down",
				"animals/butterfly",
				"animals/cat",
				"animals/collies",
				"animals/dog_sleeping-puppy",
				"animals/fox",
				"animals/kangaroos",
				"animals/rabbit",
				"animals/shark",
				"animals/sleeping-puppy",
				"creatures/Hopper-Jumping",
				"avatars/aqualine-sapling",
				"avatars/aqualine-seed",
				"avatars/aqualine-seedling",
				"avatars/aqualine-tree",
				"avatars/aqualine-ultimate",
				"avatars/avatar-team",
				"avatars/cs-hopper-cool",
				"avatars/cs-hopper-happy",
				"avatars/cs-hopper-jumping",
				"avatars/cs-ohnoes",
				"avatars/cs-winston-baby",
				"avatars/cs-winston",
				"avatars/duskpin-sapling",
				"avatars/duskpin-seed",
				"avatars/duskpin-seedling",
				"avatars/duskpin-tree",
				"avatars/duskpin-ultimate",
				"avatars/leaf-blue",
				"avatars/leaf-green",
				"avatars/leaf-grey",
				"avatars/leaf-orange",
				"avatars/leaf-red",
				"avatars/leaf-yellow",
				"avatars/leafers-sapling",
				"avatars/leafers-seed",
				"avatars/leafers-seedling",
				"avatars/leafers-tree",
				"avatars/leafers-ultimate",
				"avatars/marcimus-orange",
				"avatars/marcimus-purple",
				"avatars/marcimus-red",
				"avatars/marcimus",
				"avatars/mr-pants-green",
				"avatars/mr-pants-orange",
				"avatars/mr-pants-pink",
				"avatars/mr-pants-purple",
				"avatars/mr-pants-with-hat",
				"avatars/mr-pants",
				"avatars/mr-pink-green",
				"avatars/mr-pink-orange",
				"avatars/mr-pink",
				"avatars/mystery-2",
				"avatars/old-spice-man-blue",
				"avatars/old-spice-man",
				"avatars/orange-juice-squid",
				"avatars/piceratops-sapling",
				"avatars/piceratops-seed",
				"avatars/piceratops-seedling",
				"avatars/piceratops-tree",
				"avatars/piceratops-ultimate",
				"avatars/primosaur-sapling",
				"avatars/primosaur-seed",
				"avatars/primosaur-seedling",
				"avatars/primosaur-tree",
				"avatars/primosaur-ultimate",
				"avatars/purple-pi-pink",
				"avatars/purple-pi-teal",
				"avatars/purple-pi",
				"avatars/questionmark",
				"avatars/robot_female_1",
				"avatars/robot_female_2",
				"avatars/robot_female_3",
				"avatars/robot_male_1",
				"avatars/robot_male_2",
				"avatars/robot_male_3",
				"avatars/spunky-sam-green",
				"avatars/spunky-sam-orange",
				"avatars/spunky-sam-red",
				"avatars/spunky-sam",
				"avatars/starky-sapling",
				"avatars/starky-seed",
				"avatars/starky-seedling",
				"avatars/starky-tree",
				"avatars/starky-ultimate",
				"creatures/BabyWinston",
				"creatures/Hopper-Cool",
				"creatures/Hopper-Happy",
				"creatures/OhNoes-Happy",
				"creatures/OhNoes-Hmm",
				"creatures/OhNoes",
				"creatures/Winston",
				"cute/Blank",
				"cute/BrownBlock",
				"cute/CharacterBoy",
				"cute/CharacterCatGirl",
				"cute/CharacterHornGirl",
				"cute/CharacterPinkGirl",
				"cute/CharacterPrincessGirl",
				"cute/ChestClosed",
				"cute/ChestLid",
				"cute/ChestOpen",
				"cute/DirtBlock",
				"cute/DoorTallClosed",
				"cute/DoorTallOpen",
				"cute/EnemyBug",
				"cute/GemBlue",
				"cute/GemGreen",
				"cute/GemOrange",
				"cute/GrassBlock",
				"cute/Heart",
				"cute/Key",
				"cute/None",
				"cute/PlainBlock",
				"cute/RampEast",
				"cute/RampNorth",
				"cute/RampSouth",
				"cute/RampWest",
				"cute/Rock",
				"cute/RoofEast",
				"cute/RoofNorth",
				"cute/RoofNorthEast",
				"cute/RoofNorthWest",
				"cute/RoofSouth",
				"cute/RoofSouthEast",
				"cute/RoofSouthWest",
				"cute/RoofWest",
				"cute/Selector",
				"cute/ShadowEast",
				"cute/ShadowNorth",
				"cute/ShadowNorthEast",
				"cute/ShadowNorthWest",
				"cute/ShadowSideWest",
				"cute/ShadowSouth",
				"cute/ShadowSouthEast",
				"cute/ShadowSouthWest",
				"cute/ShadowWest",
				"cute/Star",
				"cute/StoneBlock",
				"cute/StoneBlockTall",
				"cute/TreeShort",
				"cute/TreeTall",
				"cute/TreeUgly",
				"cute/WallBlock",
				"cute/WallBlockTall",
				"cute/WaterBlock",
				"cute/WindowTall",
				"cute/WoodBlock",
				"food/berries",
				"food/brussels-sprouts",
				"food/coffee-beans",
				"food/fish_grilled-snapper",
				"food/grapes",
				"food/ice-cream",
				"food/oysters",
				"food/potato-chips",
				"food/shish-kebab",
				"food/tomatoes",
				"insideout/layer0blur0",
				"insideout/layer0blur10",
				"insideout/layer0blur20",
				"insideout/layer0blur40",
				"insideout/layer0blur80",
				"insideout/layer1blur0",
				"insideout/layer1blur10",
				"insideout/layer1blur20",
				"insideout/layer1blur40",
				"insideout/layer1blur80",
				"insideout/layer2blur0",
				"insideout/layer2blur10",
				"insideout/layer2blur20",
				"insideout/layer2blur40",
				"insideout/layer2blur80",
				"insideout/layer3blur0",
				"insideout/layer3blur10",
				"insideout/layer3blur100",
				"insideout/layer3blur20",
				"insideout/layer3blur40",
				"insideout/layer3blur80",
				"insideout/shot1_layer0blur0",
				"insideout/shot1_layer0blur10",
				"insideout/shot1_layer0blur20",
				"insideout/shot1_layer0blur40",
				"insideout/shot1_layer0blur80",
				"insideout/shot1_layer1blur0",
				"insideout/shot1_layer1blur10",
				"insideout/shot1_layer1blur20",
				"insideout/shot1_layer1blur40",
				"insideout/shot1_layer1blur80",
				"insideout/shot1_layer2blur0",
				"insideout/shot1_layer2blur10",
				"insideout/shot1_layer2blur20",
				"insideout/shot1_layer2blur40",
				"insideout/shot1_layer2blur80",
				"insideout/shot1_layer3blur0",
				"insideout/shot1_layer3blur10",
				"insideout/shot1_layer3blur20",
				"insideout/shot1_layer3blur40",
				"insideout/shot1_layer3blur80",
				"insideout/shot1_layer4blur0",
				"insideout/shot1_layer4blur10",
				"insideout/shot1_layer4blur20",
				"insideout/shot1_layer4blur40",
				"insideout/shot1_layer4blur80",
				"insideout/shot1_layer5blur0",
				"insideout/shot1_layer5blur10",
				"insideout/shot1_layer5blur20",
				"insideout/shot1_layer5blur40",
				"insideout/shot1_layer5blur80",
				"insideout/shot2_layer0blur10",
				"insideout/shot2_layer0blur20",
				"insideout/shot2_layer0blur40",
				"insideout/shot2_layer0blur80",
				"insideout/shot2_layer1blur10",
				"insideout/shot2_layer1blur20",
				"insideout/shot2_layer1blur40",
				"insideout/shot2_layer1blur80",
				"insideout/shot2_layer2blur10",
				"insideout/shot2_layer2blur20",
				"insideout/shot2_layer2blur40",
				"insideout/shot2_layer2blur80",
				"insideout/shot2_layer3blur10",
				"insideout/shot2_layer3blur20",
				"insideout/shot2_layer3blur40",
				"insideout/shot2_layer3blur80",
				"insideout/shot2_layer4blur10",
				"insideout/shot2_layer4blur20",
				"insideout/shot2_layer4blur40",
				"insideout/shot2_layer4blur80",
				"landscapes/beach-in-hawaii",
				"landscapes/beach-waves-at-sunset",
				"landscapes/beach-waves-at-sunset2",
				"landscapes/beach-waves-daytime",
				"landscapes/clouds-from-plane",
				"landscapes/fields-of-grain",
				"landscapes/lake-steam-rising",
				"landscapes/lava",
				"landscapes/mountain_matterhorn",
				"landscapes/mountains-and-lake",
				"landscapes/sand-dunes",
				"misc/tim-berners-lee",
				"pixar/Incredibles_a_fill",
				"pixar/Incredibles_a_fill_wFog",
				"pixar/Incredibles_a_key",
				"pixar/Incredibles_a_key_wFog",
				"pixar/Incredibles_bnc",
				"pixar/Incredibles_fillExt",
				"pixar/Incredibles_fillInt",
				"pixar/Incredibles_fill_wFog",
				"pixar/Incredibles_kck",
				"pixar/Incredibles_key",
				"pixar/Incredibles_key_wFog",
				"pixar/Incredibles_target",
				"pixar/army2",
				"pixar/bing1",
				"pixar/bing2",
				"pixar/cars1",
				"pixar/food1",
				"pixar/lamp",
				"pixar/rat_1",
				"pixar/rat_2",
				"pixar/rat_3",
				"scratchpads/colorpicker_hsb_b",
				"scratchpads/colorpicker_hsb_s",
				"scratchpads/colorpicker_overlay",
				"scratchpads/colorpicker_rgb_g",
				"scratchpads/colorpicker_select",
				"scratchpads/cool-critter",
				"scratchpads/error-buddy",
				"scratchpads/happy-critter",
				"scratchpads/jumping-critter",
				"scratchpads/leaf-green",
				"scratchpads/leaf-orange",
				"scratchpads/leaf-red",
				"scratchpads/leaf-yellow",
				"scratchpads/speech-arrow",
				"scratchpads/topic-drawing",
				"scratchpads/topic-user-interaction",
				"seasonal/father-winston",
				"seasonal/fireworks-in-sky",
				"seasonal/fireworks-scattered",
				"seasonal/gingerbread-house",
				"seasonal/gingerbread-man",
				"seasonal/hannukah-menorah",
				"seasonal/hopper-partying",
				"seasonal/house-with-lights",
				"seasonal/reindeer-with-hat",
				"seasonal/snow-crystal1",
				"seasonal/snow-crystal3",
				"seasonal/snownoes",
				"seasonal/stocking-empty",
				"seasonal/xmas-ornament-boat",
				"seasonal/xmas-ornaments",
				"seasonal/xmas-scene-holly-border",
				"seasonal/xmas-tree",
				"space/0",
				"space/1",
				"space/2",
				"space/3",
				"space/4",
				"space/5",
				"space/6",
				"space/7",
				"space/8",
				"space/9",
				"space/background",
				"space/beetleship",
				"space/collisioncircle",
				"space/girl1",
				"space/girl2",
				"space/girl3",
				"space/girl4",
				"space/girl5",
				"space/healthheart",
				"space/minus",
				"space/octopus",
				"space/planet",
				"space/plus",
				"space/rocketship",
				"space/star",
				"animals/birds_rainbow-lorakeets",
				"animals/komodo-dragon",
				"animals/snake_green-tree-boa",
				"landscapes/beach-sunset",
				"landscapes/beach-with-palm-trees",
				"landscapes/fields-of-wine",
				"landscapes/mountains-in-hawaii",
				"food/bananas",
				"food/cake",
				"food/croissant",
				"food/fruits",
				"food/strawberries",
				"animals/cheetah",
				"animals/butterfly_monarch",
				"animals/crocodiles",
				"animals/dogs_collies",
				"animals/horse",
				"animals/penguins",
				"animals/retriever",
				"animals/spider",
				"landscapes/beach-at-dusk",
				"landscapes/beach",
				"landscapes/crop-circle",
				"landscapes/lake",
				"landscapes/lotus-garden",
				"landscapes/mountains-sunset",
				"landscapes/waterfall_niagara-falls",
				"food/broccoli",
				"food/chocolates",
				"food/dumplings",
				"food/hamburger",
				"food/mushroom",
				"food/pasta",
				"food/potatoes",
				"food/sushi",
				"seasonal/fireworks-2015",
				"seasonal/fireworks-over-harbor",
				"seasonal/gingerbread-family",
				"seasonal/gingerbread-houses",
				"seasonal/hannukah-dreidel",
				"seasonal/hopper-elfer",
				"seasonal/hopper-reindeer",
				"seasonal/reindeer",
				"seasonal/snow-crystal2",
				"seasonal/snowy-slope-with-trees",
				"seasonal/xmas-cookies",
				"seasonal/xmas-ornament-on-tree",
				"seasonal/xmas-presents",
				"seasonal/xmas-tree-with-presents",
				"seasonal/xmas-wreath",
				"pixar/army1",
				"pixar/bedspread",
				"pixar/bopeep",
				"pixar/floorplanes",
				"scratchpads/colorpicker_background",
				"scratchpads/colorpicker_submit",
				"scratchpads/colorpicker_rgb_r",
				"scratchpads/colorpicker_rgb_b",
				"scratchpads/colorpicker_hsb_h",
				"scratchpads/colorpicker_hex",
				"scratchpads/colorpicker_indic",
				"scratchpads/ui-icons_808080_256x240",
				"scratchpads/topic-programming-basics",
				"scratchpads/topic-animation",
				"scratchpads/select",
				"seasonal/disco-ball",
				"misc/boxmodel",
				"seasonal/snowman",
				"seasonal/santa-with-bag",
				"seasonal/penguin-with-presents",
				"animals/boxer-getting-tan",
				"animals/boxer-wagging-tongue",
				"misc/tim-berners-lee-webpage",
				"seasonal/red-nosed-winston",
				"avatars/mystery-1",
				"insideout/shot2_layer0blur0",
				"insideout/shot2_layer1blur0",
				"insideout/shot2_layer2blur0",
				"insideout/shot2_layer4blur0",
				"insideout/shot2_layer3blur0",
				"pixar/rat_2",
				"pixar/luxoball",
				"pixar/buzz",
				"pixar/ham",
			];
			const imageRegex = /\b((load|get)Image)\s*\(\s*(['"])(.*?)\3\s*\)/g;
			let match;
			while ((match = imageRegex.exec(programString)) !== null) {
				if (match[4] && !imageURLs.includes(match[4])) {
					console.log("Preloading image: " + match[4]);
					assets.cacheImageURL(assets.getImageURL(match[4]));
				}
			}
			imageURLs.forEach(url => {
				if (programString.includes(url)) {
					console.log("Preloading image: " + url);
					assets.cacheImageURL(assets.getImageURL(url));
				}
			});
		})();
		// Find all getSound() calls to preload
		(function() {
			const rpg = [
				"battle-magic",
				"battle-spell",
				"battle-swing",
				"coin-jingle",
				"door-open",
				"giant-hyah",
				"giant-no",
				"giant-yah",
				"hit-clop",
				"hit-splat",
				"hit-thud",
				"hit-whack",
				"metal-chime",
				"metal-clink",
				"step-heavy",
				"water-bubble",
				"water-slosh",
			];
			const retro = [
				"boom1",
				"boom2",
				"coin",
				"hit1",
				"hit2",
				"jump1",
				"jump2",
				"laser1",
				"laser2",
				"laser3",
				"laser4",
				"rumble",
				"thruster-short",
				"thruster-long",
				"whistle1",
				"whistle2",
			];
			const sounds = [];
			const soundRegex = /\b(getSound)\s*\(\s*(['"])(.*?)\2\s*\)/g;
			let match;
			rpg.forEach(url => sounds.push("rpg/" + url));
			retro.forEach(url => sounds.push("retro/" + url));
			while ((match = soundRegex.exec(programString)) !== null) {
				if (match[3] && !sounds.includes(match[3])) {
					console.log("Preloading sound: " + match[3]);
					assets.cacheSoundURL(assets.getSoundURL(match[3]));
				}
			}
			sounds.forEach(url => {
				if (programString.includes(url)) {
					console.log("Preloading sound: " + url);
					assets.cacheSoundURL(assets.getSoundURL(url));
				}
			});
		})();
		const index = pjsInstanceCount++;
		// Make sure the correct Processing.js library is loaded
		const pjsLoaded = new Promise((resolve, reject) => {
			const pjsURL = 'https://cdn.jsdelivr.net/gh/Khan/processing-js@master/processing.js';
			if (!document.querySelector(`script[src='${pjsURL}']`)) {
				let script = document.createElement("script");
				script.src = pjsURL;
				script.type = "text/javascript";
				script.onload = () => {
					console.log("Processing.js library loaded from URL " + pjsURL);
					resolve();
				};
				document.head.appendChild(script);
			} else return void resolve();
		});

		await Promise.all([
			pjsLoaded,
			assets.load(),
		]);

		if (window.currentLoad !== loadID) {
			return;
		}

		const script = document.createElement("script");
		script.innerHTML = `
		var __pjsIndex = ${index};
		var canvas = window.__globalCanvas = document.getElementsByClassName("sketch")[__pjsIndex];
		if (!canvas) {
			throw "KA Exporter: Failed to load sketch: Missing a canvas element in the HTML with an class name of 'sketch'. If you load multiple PJS scripts make sure you have a matching number of canvas tags.";
		}
		var __processing = processing = new Processing(canvas, proc => {
			window.importerKA(proc, canvas);
		});
		processing.strokeCap(processing.ROUND);
		processing.background(255, 255, 255);
		Object.keys(processing).forEach(key => {
			if (!window[key]) {
				try {
					window[key] = processing[key];
				} catch(e) {

				}
			}
		});
		(function() {
			with (__processing) {
				canvas.addEventListener("keydown", event => {
					if (event.key === "F11") {
						fullscreen();
					}
				});
				${getFunctionBody(program)}
				if (typeof draw !== "undefined") {
				    var old = draw;
    					__processing.draw = function() {
						window.__frameRate = processing.__frameRate;
      						__processing.updateLayout();
      						old.call(__processing);
      					};
				}
				console.log("---Processing sketch sucessfully loaded---");
			}
		}).call(__processing);
				`;
		script.type = "text/javascript";
		document.body.appendChild(script);
	};
})();