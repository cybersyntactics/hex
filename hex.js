/*
 *
 * Many thanks to http://www.redblobgames.com/grids/hexagons/ for the information on how to make hex grids!
 *
 */

"Use strict"; //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions_and_function_scope/Strict_mode

function Hex(context) {  /* q, r, origin, entities, type, board */ 
	this.q = context.q;
	this.r = context.r;
	this.type = context.type || "flat-top";
	this.entities = context.entities || [];
	this.board = context.board;
	this.origin = context.origin || {"x": 0, "y" :0};
	// See comment in dragmap.
	//this.origin = context.origin || {"x": 0, "y" :0};
	this.center = this.getHexCenter();
	this.size = context.hexSize || HEX_SIZE;
	this.style = context.style || {
				  "stroke": context.hexBoarderColor || HEX_BORDER_COLOR, 
				  "stroke-width": context.hexBoarderWidth || HEX_BORDER_WIDTH, 
				  "fill": context.hexFillColor || HEX_FILL_COLOR
				  };
}

/*

Store entities in Game (or HexBoard? no?), Entities have .in(var) func, checks var for contrusctor name, if Hex, check if entity has position in hex. Game has .drawEntities(), .drawHexes(), etc. Board has .getNeighbors(hex), etc.

*/

Hex.prototype.label = function(text, style, offset) {

	offset = (offset === undefined) ? {} : offset;
	offset.x = (offset.x === undefined) ? 0 : offset.x;
	offset.y = (offset.y === undefined) ? 0 : offset.y;

	var g = d3.select("#g-q" + this.q + "r" + this.r);

	var t = g.append("text")
		.attr("x", this.center.x + offset.x)
		.attr("y", this.center.y + offset.y);

	for (key in style) {
		t.style(key, style[key]);
	}

	t.text( function () { return text; });

}

Hex.prototype.draw = function(hex) { // This is going to need to either be moved to HexGrid, or to a seperate renderer object.
	var hex = hex || this;
	var x = [], y = [];
	var typeMod = hex.type === "point-top" ? 0.5 : 0;

	hex.displayClasses = "";

	hex.center = hex.getHexCenter();
	for(i = 0; i < 6; i++) { // 0..5
		angle = 2 * Math.PI / 6 * (i + typeMod);
		x[i] = hex.center.x + hex.size * Math.cos(angle);
		y[i] = hex.center.y + hex.size * Math.sin(angle);
	}

	pathTo = "M"+x[0]+","+y[0];
	for(i = 1; i < 6; i++) {
		pathTo += "L"+x[i]+","+y[i];
	}
	pathTo += "L"+x[0]+","+y[0];

	hex.displayClasses.replace("checked ", "");
	for(var i = 0; i < hex.entities.length; i++) {
		if(typeof(hex.entities[i].displayClass) === "string") {
			hex.displayClasses += " " + hex.entities[i].displayClass;
		}
	}

    var svg   = document.querySelector(".playArea");
	var svgNS = svg.namespaceURI;
	var saNS = null; //setAtributeNS

	var g = document.querySelector(".board #g-q" + hex.q + "r" + hex.r);
	if(!g) {
		g = document.createElementNS(svgNS, "g");
		g.setAttributeNS(saNS, "id", "g-q" + hex.q + "r" + hex.r);
		g.setAttributeNS(saNS, "class", "hexGroup");
		document.querySelector(".board").appendChild(g);

		var path = document.createElementNS(svgNS, "path");
		path.setAttributeNS(saNS, "d",pathTo);

		var clipPath = document.createElementNS(svgNS, "clipPath");
		clipPath.setAttributeNS(saNS, "id", "c-q" + hex.q + "r" + hex.r);
		clipPath.appendChild(path);

		g.appendChild(clipPath);

		var path = document.createElementNS(svgNS, "path");
		path.setAttributeNS(saNS, "d",pathTo);
		path.setAttributeNS(saNS, "class", "hex q" + hex.q + " r" + hex.r + " " + hex.displayClasses);
		path.setAttributeNS(saNS, "id", "q" + hex.q + "r" + hex.r);
		path.setAttributeNS(saNS, "clip-path", "url(#" + "c-q" + hex.q + "r" + hex.r +")");
		path.setAttributeNS(saNS, "style", "stroke-width: "+hex.style["stroke-width"]+"px;");

		g.appendChild(path);
	} else {
		document.querySelector("#c-q" + hex.q + "r" + hex.r + " path").setAttributeNS(saNS, "d", pathTo);

		var path = document.querySelector("#q" + hex.q + "r" + hex.r);
		path.setAttributeNS(saNS, "d", pathTo)
		path.setAttributeNS(saNS, "class", "hex q" + hex.q + " r" + hex.r + " " + hex.displayClasses)
		path.setAttributeNS(saNS, "id", "q" + hex.q + "r" + hex.r)
		path.setAttributeNS(saNS, "clip-path", "url(#" + "c-q" + hex.q + "r" + hex.r +")")
		path.setAttributeNS(saNS, "style", "stroke-width: "+hex.style["stroke-width"]+"px;");	
	}
}
	
Hex.prototype.getHexCenter = function(q, r, x, y){
	if(arguments.length === 0) {
		var q = this.q;
		var r = this.r;
		var x = this.origin.x;
		var y = this.origin.y;
	}
	//Should use class/prototype! as parameter!
	if(this.type === "point-top") {
		var new_x = (this.size * Math.sqrt(3) * (q + r/2)) + x;
		var new_y = (this.size * 3/2 * r) + y;
	} else {
		var width = this.size * 2;
		var new_x = (this.size * 3/2 * q) + x;
		var new_y = (this.size * Math.sqrt(3) * (r + q/2)) + y;
	}
	return {"x" : new_x, "y" : new_y};
}

Hex.prototype.showData = function(){
	if(arguments.length === 0) {
		q = this.q;
		r = this.r;
		x = this.center.x;
		y = this.center.y;
	}

	d3.select("#g-q" + hex.q + "r" + hex.r).remove();

	var g = d3.select(".board")
		.append("g")
		.attr("id", "g-q" + hex.q + "r" + hex.r)
		.attr("class", "hexGroup");
}

//function HexGrid(/* array */ map) {
function HexGrid(context) {
	this.Hexes = {};
	this.entities = context.entities || [];
	this.hexType = context.hexType || "flat-top";
	this.origin = context.origin || {x: 0, y: 0};
	this.dimensions = context.dimensions;
	this.hexSize = context.hexSize || 30;
	this.hexStyle = context.style || {stroke: "black", "stroke-width": this.hexSize/10, fill: "white"};
	this.hexWidth = this.hexType === "point-top" ? Math.sqrt(3) * this.hexSize : 2 * this.hexSize;
	this.hexHeight = this.hexType === "point-top" ?  2 * this.hexSize : Math.sqrt(3) * this.hexSize;

	var board = document.querySelector(".board");
	if(board) board.parentNode.removeChild(board);

	if(!!context) {
		if(context.mapType === "rect") {
			this.width = context.width || 1;
			this.height = context.width || 1;
			if(context.mapOrient === "vertical") {
				for (q = 0; q < this.height; q++) {
					for (r = -Math.floor(q/2); r < this.width - Math.floor(q/2); r++) {
						this.Hexes["q"+q+"r"+r] = new Hex({q: q, r: r, hexSize: this.hexSize, style: this.hexStyle});
					}
				}
			} else {
				for (q = 0; q < this.height; q++) {
					for (r = -Math.floor(q/2); r < this.width - Math.floor(q/2); r++) {
						this.Hexes["q"+r+"r"+q] = new Hex({q: q, r: r, hexSize: this.hexSize, style: this.hexStyle});
					}
				}
			}
		} else if(context.mapType === "rhomb") {

			this.width = !!context.width ? context.width : 2;
			this.height = !!context.height ? context.height : 2;

			/* not necessarily equal width/height, I like, but needs work. */
			this.width = Math.min(11, Math.floor(this.dimensions.width / this.hexWidth));
			this.height = Math.min(11, Math.floor(this.dimensions.height / this.hexHeight));

			/* equal width and height */
			if(this.width > this.height) {
				this.width = this.height;
			} else {
				this.height = this.width;
			}

			if (context.origin.x === "center") {
				this.origin.x = Math.max((this.dimensions.width/2 - this.width/2 * this.hexWidth - Math.floor(this.height * Math.cos(2 * Math.PI / 6 * (1 + 0.5))) * this.hexWidth + this.hexWidth), this.dimensions.width/2 - this.width/2 * this.hexWidth * 1.18); // uhhg. I need to figure this (abitrary 1.18) out better. probably won't work for sizes other than 11.
			}		

			if (context.origin.y === "center") {
				this.origin.y = this.dimensions.height - this.dimensions.height/2 - (this.height * this.hexSize)/2;
			}

			// reset goal entities incase board size changed.
			this.entities.goalHexes["red"]["left"] = [];
			this.entities.goalHexes["red"]["right"] = [];
			this.entities.goalHexes["blue"]["top"] = [];
			this.entities.goalHexes["blue"]["bottom"] = [];						

			for (q = 0; q < this.width; q++) {
				for (r = 0; r < this.height; r++) {
					var hexEntityRed = undefined;
					var hexEntityBlue = undefined;
					var hexEntities = [];
					if (q === 0 ) {
						hexEntityRed = this.entities.redGoalLeft; 
						this.entities.push(hexEntityRed);
						hexEntities.push(hexEntityRed);
					} else if(q === this.width - 1) {
						hexEntityRed = this.entities.redGoalRight; 
						this.entities.push(hexEntityRed);
						hexEntities.push(hexEntityRed);	
					} 
					if (r === 0) {
						hexEntityBlue = this.entities.blueGoalTop; 
						this.entities.push(hexEntityBlue);
						hexEntities.push(hexEntityBlue);
					} else if(r === this.height - 1) {
						hexEntityBlue = this.entities.blueGoalBottom; 
						this.entities.push(hexEntityBlue);
						hexEntities.push(hexEntityBlue);
					}
					this.Hexes["q"+q+"r"+r] = new Hex({q: q, r: r, origin: this.origin, entities: hexEntities, type: this.hexType, hexSize: this.hexSize, style: this.hexStyle});

					if(hexEntityRed === this.entities.redGoalLeft) {
						this.entities.goalHexes["red"]["left"].push(this.Hexes["q"+q+"r"+r]);
					}

					if(hexEntityRed === this.entities.redGoalRight) {
						this.entities.goalHexes["red"]["right"].push(this.Hexes["q"+q+"r"+r]);
					}

					if(hexEntityBlue === this.entities.blueGoalTop) {
						this.entities.goalHexes["blue"]["top"].push(this.Hexes["q"+q+"r"+r]);
					}

					if(hexEntityBlue === this.entities.blueGoalBottom) {
						this.entities.goalHexes["blue"]["bottom"].push(this.Hexes["q"+q+"r"+r]);
					}
				}
			}		
		} else if(context.mapType === "load" && context.mapLoad === "jsonArray") {
			for (q = 0; q < arr.length; q++) {
				for (r = -Math.floor(q/2); r < arr[q].length - Math.floor(q/2); r++) {
					datum = arr[q][r + Math.floor(q/2)];
					this.Hexes["q"+q+"r"+r] = new Hex({q: q, r: r, board: this, origin: {"x": 40, "y": 40}, entities: datum.entities, hexSize: this.hexSize, style: this.hexStyle});
					for(var i = 0; i < datum.entities.length; i++) {
						this.entities["q"+q+"r"+r+"e"+i] = {"entity": datum.entities[i], "location": "q"+q+"r"+r};
					}
				}
			}
		} else if(context.mapType === "load" && context.mapLoad === "json") {
			for (d in data) {
				this.Hexes[d] = new Hex({q: data[d].q, r: data[d].r, board: this, origin: {"x": 40, "y": 40}, entities: data[d].entities, hexSize: this.hexSize, style: this.hexStyle});
			}
		}
	}
}

HexGrid.prototype.getOriginHexOffsetFromCenter = function(hexId, dimensions, origin) {
	// stub
}

HexGrid.prototype.getNeighbors = function(hex) {
	if(!hex) {
		hex = this;
	}
		
	var directions = [
	   [+1,  0], [+1, -1], [0, -1],
	   [-1,  0], [-1, +1], [0, +1]
	]

	var neighbors = [];

	for(var i = 0; i < 6; i++) {
		var d = directions[i];
		var hexId = "q" + (hex.q + d[0]) + "r" + (hex.r + d[1]);
		if(this.Hexes[hexId]) neighbors.push(this.Hexes[hexId]);
	}		

	return neighbors;
}

HexGrid.prototype.draw = /* null */ function(/* name of element to attach drawing area to */ parent, 
								  /* name of element to create and draw grid in */ board,
								  /* d3.js or Raphel.js or other svg framework or possibly canvas */ d) {
	if (!d) {
		var d = d3;
	}

	if (!board) {
		var board = "board";
	}
	
	if (!parent) {
		var parent = ".playArea";
	}
	
	d.select(".guard").remove();
	if(!d.select("."+board).node()) {
		var a = d.select(parent).append("g")
	  			.attr("class", board)
	 			.attr("width", this.width)
	 			.attr("height", this.height);
	} else {
		var a = d.select("."+board);
	}

	for (hex in this.Hexes) {
		this.Hexes[hex].draw();
	}
}

//board = new HexGrid(new Rect(new Point(0, 0), new Point(BOARD_WIDTH, BOARD_HEIGHT)));
//board = new HexGrid({mapType: "rect", mapOrient: "vertical", width: 6, height: 6});
//board = new HexGrid({mapType: "load", mapLoad: "jsonArray"});



function Game() {
	this.entities = [];
	this.entities.redPlayer = {"id": this.entities.length, "color": "red"};
	this.entities.bluePlayer = {"id": this.entities.length, "color": "blue"};
	this.entities.currentPlayer = this.entities.redPlayer;
	this.entities.lockedEntity = {"id": this.entities.length, "locked": true}; // will this.entities.length change when removing entities (in general, not for this entity)? I don't think so they way JS arrays work.
	this.entities.redGoalLeft = {"id": this.entities.length, "goal": "red", "displayClass": "goal-red"};
	this.entities.redGoalRight = {"id": this.entities.length, "goal": "red", "displayClass": "goal-red"};
	this.entities.blueGoalTop = {"id": this.entities.length, "goal": "blue", "displayClass": "goal-blue"};
	this.entities.blueGoalBottom = {"id": this.entities.length, "goal": "blue", "displayClass": "goal-blue"};
	this.entities.goalHexes = {"id": this.entities.length, "red": {"left": [], "right": []}, "blue": {"top": [], "bottom": []}};
	this.entities.goalHexes.red.start = this.entities.goalHexes.red.left;
	this.entities.goalHexes.blue.start = this.entities.goalHexes.blue.top;
	this.entities.goalHexes.red.end = this.entities.goalHexes.red.right;
	this.entities.goalHexes.blue.end = this.entities.goalHexes.blue.bottom;
	this.entities.checkedHexes = [];
	this.entities.checkedEntity = {"id": this.entities.length, "checked": true, "displayClass": "checked"};
	this.dimensions = this.getInnerDimensions(); //width, height
	this.resizeBoard(this.dimensions);
	this.mouse = {x: 0, y: 0};
	this.mode = "local multiplayer";
	this.turn = 0;
	var that = this;
	window.addEventListener("resize", function(e) { that.resizeBoard(that.getInnerDimensions(), that) }, false);
}

Game.prototype = {
	makeBoard: function(settings) {
		if(typeof(settings) === "undefined") settings = {mapType: "rhomb", 
														 width: 11, 
														 height: 11, 
														 origin: {x: "center", y: 80},
														 dimensions: this.dimensions, 
														 hexType: this.dimensions.width > this.dimensions.height ? "point-top" : "flat-top", 
														 entities: this.entities};
		// game.settings = settings; // entities contains multiple references which aren't properly being preserved in the conversion to json. I probably need to figure out a way to either send the actual js object (with references preserved) or convert the json back to a js obj.
		this.entities.currentPlayer = this.entities.redPlayer;
		settings.entities = this.entities;
		this.settings = settings;
		this.board = new HexGrid(settings);
		this.board.draw();
	},

	getState: function() {
		return {turn: this.turn, mode: this.mode, board: {Hexes: this.board.Hexes, width: this.width, height: this.height}, entites: this.entities};
	},

	getView: function() {
		return {viewport: {origin: this.origin || this.board.origin, 
						   dimensions: this.dimensions || this.board.dimensions, 
						   mouse: this.mouse}, 
				boardProperties: {hexType: this.board.hexType, 
								  mapType: this.board.mapType, 
								  dimensions: {width: this.board.width,
								  			   height: this.board.height}},
				style: this.board.style};
	},

	getInnerDimensions: function() {
		var new_board_width = "innerWidth" in window ? window.innerWidth : document.documentElement.offsetWidth;
		var new_board_height = "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;
		return {width: new_board_width, height: new_board_height};
	},

	resizeBoard: function(dimensions, that) {
		var that = that || this;
		that.dimensions = dimensions || that.getInnerDimensions(); // Doesn't work in event hanlder. Needs work.
		var playArea = document.getElementsByClassName("playArea")[0];
		playArea.setAttribute("width", that.dimensions.width);
		playArea.setAttribute("height", that.dimensions.height);
	},

	checkVictory: function(player, currentHex) {
		var victory = false;
		if (currentHex && currentHex.entities.indexOf(player) !== -1) {
			var neighbors = this.board.getNeighbors(currentHex); // move to down here
			if (game.entities.checkedHexes.indexOf(currentHex) === -1) {
				currentHex.entities.push(game.entities.checkedEntity);
				game.entities.checkedHexes.push(currentHex);
				currentHex.draw(); // optional? maybe move to end of checkVictory or updateTurn?
				if (this.entities.goalHexes[player.color].end.indexOf(currentHex) !== -1) {
					victory = true;
				} else {
					// down here
					for (var neighbor in neighbors) {
						victory = this.checkVictory(player, neighbors[neighbor]);
						if (victory === true) {
							break;
						}
					}
				}
			}
		}
		return victory;
	},

	resizeHexes: function(size, thisBoard) {
		var boardObj = !!thisBoard ? thisBoard : game.board;
		boardObj.hexSize = boardObj.hexSize > 0 ? boardObj.hexSize : 10;
		// This is because .size is a primative so doesn't pass by reference. If it did we could just update the board.hexSize object and redraw and be done with it. I might switch .size to an object at some point.
		for (hex in boardObj.Hexes) {
			boardObj.Hexes[hex].size = boardObj.hexSize;
			boardObj.Hexes[hex].style["stroke-width"] = boardObj.hexSize/10;
		}
		boardObj.draw();
	},

	moveMap: function(pointerStart, pointerEnd, board) {
		if(pointerStart === null || pointerStart === undefined) { pointerStart = new Point(game.mouse.x, game.mouse.y); }
		pointerEnd = new Point(game.mouse.x, game.mouse.y);
		board.origin.x += pointerEnd.getX() - pointerStart.getX();
		board.origin.y += pointerEnd.getY() - pointerStart.getY();
		// This method is better if hexes need individual origins (so if there are multiple layers of hexes within the same hexboard), but requires object(context.origin) in the Hex class which might be slower. Probably better to use seperate HexBoards anyway if there are multiple layers of hexes, but I wanted to document this incase it's needed later. 
		/*
		for (hex in game.board.Hexes) {
			game.board.Hexes[hex].origin.x +=  (pointerEnd.getX() - pointerStart.getX());
			game.board.Hexes[hex].origin.y +=  (pointerEnd.getY() - pointerStart.getY());
		}
		*/
		pointerStart = pointerEnd;
		board.draw();
		game.moveAnimID = requestAnimationFrame( function() { game.moveMap(pointerStart, pointerEnd, board); });
	},

	selectHex: function(hexId) {
		if(game.mode === "local multiplayer") game.entities.thisPlayer = game.entities.currentPlayer;
		if(game.board.Hexes[hexId].entities.indexOf(game.entities.lockedEntity) === -1 
			&& game.victory !== true /*&& game.entities.thisPlayer === game.entities.currentPlayer*/) {
			this.turn++;
			game.board.Hexes[hexId].entities.push({"id": game.board.entities.length, "player": game.entities.currentPlayer, "displayClass": game.entities.currentPlayer.color+" locked"});
			game.board.Hexes[hexId].entities.push(game.entities.currentPlayer);
			game.board.Hexes[hexId].entities.push(game.entities.lockedEntity);
			game.board.Hexes[hexId].draw();
			//game.entities.checkedHexes = [];
			for(goalHex in game.entities.goalHexes[game.entities.currentPlayer.color]["start"]) {
				game.entities.checkedHexes = [];
				for(hex in game.board.Hexes) {
					var index = game.board.Hexes[hex].entities.indexOf(game.entities.checkedEntity);
					if(index > -1) {
						game.board.Hexes[hex].entities.splice(index, 1);
					}
				}
				game.victory = game.checkVictory(game.entities.currentPlayer, game.entities.goalHexes[game.entities.currentPlayer.color]["start"][goalHex]);
				if(game.victory === true) break;
			}
			return true;
		}
	},

	gameStart: function(multiplayer) {
		if(multiplayer === "networked") {
			this.mode = "networked";
			socket.emit("find multiplayer", {settings: game.settings});
		} else if (multiplayer === "AI") {
			//socket.emit("start singleplayer");
		} else {
			socket.emit("cancel find multiplayer");
			removeChat(game.entities.thisPlayer);
			game.entities.thisPlayer = game.entities.currentPlayer;
			game.makeBoard();
			game.gameLoop(game.entities.currentPlayer);			
			//socket.emit("start local multiplayer");
		}

	},

	gameLoop: function(currentPlayer) {
		if(this.mode === "networked") {
			if(currentPlayer === this.entities.thisPlayer) {
				 // when(this.selectHex()).then(updateTurn())
 			} else {
 				console.log('waiting for move...');
 				socket.once('move', function(msg) {
 					console.log('moved once', msg);
 					updateTurn(msg.hexID, msg.player);
 				});
 			}
 		} else {
			game.entities.thisPlayer = game.entities.currentPlayer;
 		}
	}

}

socket = io.connect('/room');
socket.binaryType = 'blob'; // getting an error when emiting "move" (in ui.js right now). // https://github.com/Automattic/socket.io/issues/1645

socket.on("error", function(object){
	console.log("error", object);
});
socket.on("game joined", function(msg) {
	console.log("game joined", msg);
	//var msg = msg[1];
	game.roomId = msg.roomId;
	game.roomSize = msg.roomSize
	game.gameId = msg.gameId;
	if(msg.player === 'red') {
		game.entities.thisPlayer = game.entities.redPlayer;
	} else if(msg.player === 'blue') {
		game.entities.thisPlayer = game.entities.bluePlayer;
	} else if(msg === undefined) {
		alert('no space available');
	}
	lookForSecondPlayer();
});
socket.on("game start", function(msg) {
	console.log("game start", msg);
	closeMessage();
	addChat(game.entities.thisPlayer);	
	game.makeBoard(msg.settings);
	game.gameLoop(game.entities.currentPlayer);
});

game = new Game();
game.makeBoard();
game.gameStart("local");