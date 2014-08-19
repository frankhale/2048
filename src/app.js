//
// A 2048 clone
//
// Frank Hale <frankhale@gmail.com>
//
// Date: 19 August 2014
//

var Atom2048 = (function($, my){
	"use strict";

	var remote = require('remote');
	var browser = remote.getCurrentWindow();
	var Menu = remote.require('menu');

	var sprintf = require('./libs/sprintf.min.js').sprintf;
	
	var $content = $("#content");
	var $splash = $("#splash");
	
	var menuTemplate = [
	  {
		label: 'Game',
		submenu: [
		  {
			label: 'Restart',
			 accelerator: 'Ctrl+S',
			click: function() { my.init(true); }
		  },
		  {
			label: 'Toggle Dev Tools',
			 accelerator: 'Ctrl+D',
			click: function() { my.toggleDevTools(); }
		  },
		  {
			label: 'Reload',
			accelerator: 'Ctrl+R',
			click: function() { my.reload(); }
		  }
		]
	  }
	];
	
	var RotateDirection = {
		Left: 0,
		Right: 1
	};
	
	var keyCodes = {
		left: 37,
        up: 38,
        right: 39,
        down: 40
	};
	
	// Colors borrowed from: http://www.tinygorilla.com/Easter_eggs/PallateHex.html
	var tileColors = {		
		blank: "#FFFFFF",
		_2: "#C7B299",
		_4: "#998675",
		_8: "#F26C4F",
		_16: "#F68E55",
		_32: "#FBAF5C",
		_64: "#FFF467",
		_128: "#ACD372",
		_256: "#1ABBB4",
		_512: "#5574B9",
		_1024: "#855FA8",
		_2048: "#F06EA9",
		_4096: "#F26D7D"
	}
	
	var createTile = function(num, bgcolor) {
		var _class = 'tile';
		
		if(num===0){
			_class = 'blankTile';
		}
		
		return sprintf("<div class='%s' style='background-color:%s;'>%d</div>", _class, bgcolor, num);
	};
	
	var tiles = {
		blank: createTile(0, tileColors.blank),
		_2: createTile(2, tileColors._2),
		_4: createTile(4, tileColors._4),
		_8: createTile(8, tileColors._8),
		_16: createTile(16, tileColors._16),
		_32: createTile(32, tileColors._32),
		_64: createTile(64, tileColors._64),
		_128: createTile(128, tileColors._128),
		_256: createTile(256, tileColors._256),
		_512: createTile(512, tileColors._512),
		_1024: createTile(1024, tileColors._1024),
		_2048: createTile(2048, tileColors._2048),
		_4096: createTile(4096, tileColors._4096)
	};
	
	var player = {
		score: 0
	};
	
	// When a new tile is added we update this as a helper for the game board drawing routine
	// so that it can visual announce the new tile for player feedback purposes
	var newTile = {
		x: -1,
		y: -1
	};
	
	var gameBoardData = [ 
		[ 0,0,0,0 ],
		[ 0,0,0,0 ],
		[ 0,0,0,0 ],
		[ 0,0,0,0 ]
	];
	
	// This code was adapted from from http://stackoverflow.com/questions/42519/how-do-you-rotate-a-two-dimensional-array
	var rotateMatrix = function(m, n, direction) {
		var result = [];
		
		for(var x = 0; x < n; x++) {
			result.push([]);
		}
		
		for(var i = 0; i < n; ++i) {
			for(var j = 0; j < n; ++j) {
				if(direction == RotateDirection.Right) {
					result[i][j] = m[n - j - 1][i];
				} else if (direction == RotateDirection.Left) {
					result[i][j] = m[j][n - i - 1];
				}
			}
		}
		
		return result;
	};
	
	var sumTiles = function(m, performChange, dir, onSumCallback) {
		for(var row=0; row < m.length; row++) {
			for(var tile=0; tile < m[row].length; tile++) {
				var currTile = m[row][tile];
				if(currTile !== 0) {
					var currIndex = tile;
					var lookAhead = m[row].length - tile;
					var matches = [];
					for(var j = 1; j <= lookAhead; j++) {
						if(currTile === m[row][tile+j]){
							matches.push(currTile);
						} else {
							break;
						}
					}			
					if(matches.length>0) {
						if(performChange) {
							if(dir === RotateDirection.Right) {
								m[row][tile] = 0;
								m[row][tile+matches.length] = currTile * 2;								
								onSumCallback(m[row][tile+matches.length]);
							} else if (dir === RotateDirection.Left) {
								m[row][tile] = currTile * 2;
								m[row][tile+matches.length] = 0;
								onSumCallback(m[row][tile]);							
							}
						} else {
							onSumCallback();
						}	
						break;
					}					
				}
			}		
		}
		return m;
	};
	
	var areMovesAvailable = function(m) {	
		var result = false;
		
		if(_.contains(_.flatten(m), 0)) {
			result = true;
		} else {		
			sumTiles(m, false, function(num) {
				result = true;
			});
			
			if(!result) {
				var _m = rotateMatrix(m, 4, RotateDirection.Right);
				
				sumTiles(_m, false, function() {
					result = true;
				});
			}
		}
		return result;
	};
	
	var drawGameBoard = function(board) {
		gameBoardData = addNewTile(gameBoardData);
		
		$('#msg').html(sprintf("<b>Score: %d</b>", player.score));
		
		var _counter=0;
		for(var row = 0; row < board.length; row++) {
			for(var tile = 0; tile < board[row].length; tile++) {
				var _tile = tiles.blank;
				if(board[row][tile] !== 0) {
					switch(board[row][tile]){
						case 0:
							_tile = tiles.blank;
						break;
						case 2:
						_tile = tiles._2;
						break;
						case 4:
						_tile = tiles._4;
						break;
						case 8:
						_tile = tiles._8;
						break;
						case 16:
						 _tile = tiles._16;
						break;
						case 32:
						 _tile = tiles._32;
						break;
						case 64:
						 _tile = tiles._64;
						break;
						case 128:
						 _tile = tiles._128;
						break;
						case 256:
						 _tile = tiles._256;
						break;
						case 512:
						 _tile = tiles._512;
						break;
						case 1024:
						 _tile = tiles._1024;
						break;
						case 2048:
						 _tile = tiles._2048;
						break;
					}
				}
				
				var _id = sprintf("#%d", _counter);				
				$(_id).html(_tile);
				
				if(newTile.x === tile && newTile.y === row) {				
					var newTileIndex = -1;
					
					if(newTile.y === 0) {
						newTileIndex = newTile.x;
					} else {
						newTileIndex = (board[row].length * row) + newTile.x;						
					}

					newTile = { x: -1, y: -1 };
					$(sprintf("#%d", newTileIndex)).children().addClass("newTile");

					setTimeout(function() {					
						$(".newTile").removeClass("newTile");
					}, 1000);
				}
				
				_counter++;
			}
		}
	};
	
	var addNewTile = function(data) {
		if(areMovesAvailable(gameBoardData)) {
			var row = Math.floor(Math.random() * 4);
			var tile = Math.floor(Math.random() * 4);		
			var seed = Math.floor((Math.random() * 16) + 1);
					
			if(data[row][tile] === 0) {
				if (seed < 8) {
					data[row][tile] = 2;
				} else {
					data[row][tile] = 4;
				}

				newTile.x = tile;
				newTile.y = row;
			}
			else {
				addNewTile(data);
			}
		}
		return data;
	};
	
	var leftTransform = function(data) {
		function mvLeft(data) {
			for(var row = 0; row < data.length; row++) {
				var _t = _.without(data[row], 0);
				var tlength = _t.length;
				for(var i = 0; i < data[row].length - tlength; i++) {
					_t.push(0);
				}
				data[row] = _t;
			}
			return data;
		}

		data = mvLeft(data);
		data = sumTiles(data, true, RotateDirection.Left, function(num) {
			player.score+=num;
		});
		data = mvLeft(data);
		
		return data;
	};
	var rightTransform = function(data) {
		function mvRight(data) {
			for(var row = 0; row < data.length; row++) {
				var _t = _.without(data[row], 0);
				var tlength = _t.length;
				for(var i = 0; i < data[row].length - tlength; i++) {
					_t.unshift(0);
				}
				data[row] = _t;
			}
			return data;
		}
		
		data = mvRight(data);
		data = sumTiles(data, true, RotateDirection.Right, function(num) {
			player.score+=num;
		});
		data = mvRight(data);
		
		return data;
	};
	var upTransform = function(data) {
		function mvUp(data) {
			for(var row = 0; row < data.length; row++) {
				var _t = _.without(data[row], 0);
				var tlength = _t.length;
				for(var i = 0; i < data[row].length - tlength; i++) {
					_t.unshift(0);
				}
				data[row] = _t;
			}
			return data;
		}

		data = rotateMatrix(data, 4, RotateDirection.Right);
		data = mvUp(data);
		data = sumTiles(data, true, RotateDirection.Right, function(num) {
			player.score+=num;
		});
		data = mvUp(data);
		data = rotateMatrix(data, 4, RotateDirection.Left);
		
		return data;
	};
	var downTransform = function(data) {
		function mvDown(data) {
			for(var row = 0; row < data.length; row++) {
				var _t = _.without(data[row], 0);
				var tlength = _t.length;
				for(var i = 0; i < data[row].length - tlength; i++) {
					_t.push(0);
				}
				data[row] = _t;
			}
			return data;
		}

		data = rotateMatrix(data, 4, RotateDirection.Right);
		data = mvDown(data);
		data = sumTiles(data, true, RotateDirection.Left, function(num) {
			player.score+=num;
		});
		data = mvDown(data);
		data = rotateMatrix(data, 4, RotateDirection.Left);
		
		return data;
	};
	
	var keyBind = function(e, k, fun) {
		if(k === e.keyCode) {			
			fun();
			return true;
		}
	};
	
	var documentOnkeydown = function(e) {		
		keyBind(e, keyCodes.left, function() {
			gameBoardData = leftTransform(gameBoardData);
			drawGameBoard(gameBoardData);
		});
		keyBind(e, keyCodes.right, function() {
			gameBoardData = rightTransform(gameBoardData);
			drawGameBoard(gameBoardData);
		});
		keyBind(e, keyCodes.up, function() {
			gameBoardData = upTransform(gameBoardData);
			drawGameBoard(gameBoardData);
		});
		keyBind(e, keyCodes.down, function() {
			gameBoardData = downTransform(gameBoardData);
			drawGameBoard(gameBoardData);
		});
	};
	
	my.init = function (restart) {
		if(restart == undefined || restart !== true) {
			var menu = Menu.buildFromTemplate(menuTemplate);
			Menu.setApplicationMenu(menu);
			document.onkeydown = function(e) { documentOnkeydown(e); };

			$splash.fadeOut(3500, function() {
				$content.toggle();
				drawGameBoard(gameBoardData);
			});
		} else {
			for(var i=0;i<gameBoardData.length; i++) {
				for(var j=0;j<gameBoardData[i].length; j++) {
					gameBoardData[i][j] = 0;
				}
			}
			player.score=0;
			drawGameBoard(gameBoardData);
		}
	};
	
	my.toggleDevTools = function() {
		browser.toggleDevTools();
	};
	
	my.reload = function() {
		browser.reload();
	};
	
	return my;
}(jQuery, Atom2048 || {}));