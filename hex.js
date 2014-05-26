/*
*
* Many thanks to http://www.redblobgames.com/grids/hexagons/ for the information on how to make hex grids!
*
*/

function Hex(context) {  /* q, r, origin, entities, type, board */ 
	this.q = context.q;
	this.r = context.r;
	this.type = context.type || "flat-top";
	this.entities = context.entities || [];
	this.board = context.board;
	this.origin = object(context.origin) || {"x": 0, "y" :0};
	this.center = this.getHexCenter();
	this.size = context.hexSize || HEX_SIZE;
	this.style = context.style || {
				  "stroke": context.hexBoarderColor || HEX_BORDER_COLOR, 
				  "stroke-width": context.hexBoarderWidth || HEX_BORDER_WIDTH, 
				  "fill": context.hexFillColor || HEX_FILL_COLOR
				  };
}

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

Hex.prototype.draw = function(hex) {
		var hex = hex || this;
		var x = [], y = [];
		var typeMod = this.type === "point-top" ? 0.5 : 0;

		this.displayClasses = "";

		hex.center = hex.getHexCenter();
		for(i = 0; i < 6; i++) { // 0..5
			angle = 2 * Math.PI / 6 * (i + typeMod);
			x[i] = Math.round(hex.center.x + hex.size * Math.cos(angle));
			y[i] = Math.round(hex.center.y + hex.size * Math.sin(angle));
		}

		pathTo = "M"+x[0]+","+y[0];
		//for each(i in x){ // for each depreciated, for of experimental // removed, need 1..5 not 0..5
		for(i = 1; i < 6; i++) {
			pathTo += "L"+x[i]+","+y[i];
		}
		pathTo += "L"+x[0]+","+y[0];

		d3.select("#g-q" + hex.q + "r" + hex.r).remove();
	
		var g = d3.select(".board")
			.append("g")
			.attr("id", "g-q" + hex.q + "r" + hex.r)
			.attr("class", "hexGroup");

		hex.displayClasses.replace("checked ", "");
		// Needs to be made more generic (foreach(entity) { displayClass += " " + entity.class }) // pointers or copy entities?
		for(var i = 0; i < hex.entities.length; i++) {
			if(hex.entities[i].goal === "red") {
				hex.displayClasses += "goal-red ";
			}
			if(hex.entities[i].goal === "blue") {
				hex.displayClasses += "goal-blue ";
			}			
			if(hex.entities[i].player === this.board.game.entities.redPlayer) {
				hex.displayClasses += "red locked ";
			}
			if(hex.entities[i].player === this.board.game.entities.bluePlayer) {
				hex.displayClasses += "blue locked ";
			}

			if(hex.entities[i].checked === true) {
				hex.displayClasses += "checked ";
			}
		}

		g.append("clipPath")
			.attr("id", "c-q" + hex.q + "r" + hex.r)
		 .append("path")
			.attr("d", pathTo);
		g.append("path")
			.attr("d", pathTo)
			.attr("class", "hex q" + hex.q + " r" + hex.r + " " + hex.displayClasses)
			.attr("id", "q" + hex.q + "r" + hex.r)
			.attr("clip-path", "url(#" + "c-q" + hex.q + "r" + hex.r +")")
			.style("stroke-width", this.style["stroke-width"]);

		//this.label("" + Math.round(hex.q) + ", " + Math.round(hex.r) + "");
		//this.label("" + Math.round(hex.center.x) + ", " + Math.round(hex.center.y) + "", {"font-size": "10px"}, {"x": 0, "y": 12.5});

		// g.append("path")
		// 	.attr("d", pathTo)
		// 	.attr("class", "guard")
		// 	.attr("clip-path", "url(#" + "c-q" + hex.q + "r" + hex.r +")");

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

Hex.prototype.getNeighbors = function(hex) {
	//if (!(hex instanceof Hex)) {
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
		if(this.board.Hexes[hexId]) neighbors.push(this.board.Hexes[hexId]);
	}		

	return neighbors;
}

//function HexGrid(/* array */ map) {
function HexGrid(context) {
	this.Hexes = {};
	this.entities = context.entities || [];
	this.hexType = context.hexType || "flat-top";
	this.origin = context.origin || {x: 0, y: 0};
	this.game = context.game || game;
	this.hexSize = context.hexSize || 30;
	this.hexStyle = context.style || {stroke: "black", "stroke-width": this.hexSize/10, fill: "white"};

	if(!!context) {
		if(context.mapType === "rect") {
			this.width = context.width || 1;
			this.height = context.width || 1;
			if(context.mapOrient === "vertical") {
				for (q = 0; q < this.height; q++) {
					for (r = -Math.floor(q/2); r < this.width - Math.floor(q/2); r++) {
						this.Hexes["q"+q+"r"+r] = new Hex({q: q, r: r, board: this, hexSize: this.hexSize, style: this.hexStyle});
					}
				}
			} else {
				for (q = 0; q < this.height; q++) {
					for (r = -Math.floor(q/2); r < this.width - Math.floor(q/2); r++) {
						this.Hexes["q"+r+"r"+q] = new Hex({q: q, r: r, board: this, hexSize: this.hexSize, style: this.hexStyle});
					}
				}				
			}
		} else if(context.mapType === "rhomb") {

			this.width = !!context.width ? context.width : 2;
			this.height = !!context.height ? context.height : 2;

			if (context.origin.x === "center") {
				this.origin.x = this.game.dimensions.width/2 - (this.width/2 * this.hexSize * 2 * 1.18); // uhhg. I need to figure this out better. probably won't work for sizes other than 11.
			}		

			if (context.origin.y === "center") {
				this.origin.y = this.game.dimensions.height - this.game.dimensions.height/2 - (this.height * this.hexSize)/2;
			}

			for (q = 0; q < this.width; q++) {
				for (r = 0; r < this.height; r++) {
					var hexEntityRed = undefined;
					var hexEntityBlue = undefined;
					var hexEntities = [];
					if (q === 0 ) {
						hexEntityRed = this.game.entities.redGoalLeft; 
						this.entities.push(hexEntityRed);
						hexEntities.push(hexEntityRed);
					} else if(q === this.width - 1) {
						hexEntityRed = this.game.entities.redGoalRight; 
						this.entities.push(hexEntityRed);
						hexEntities.push(hexEntityRed);						
					} 
					if (r === 0) {
						hexEntityBlue = this.game.entities.blueGoalTop; 
						this.entities.push(hexEntityBlue);
						hexEntities.push(hexEntityBlue);
					} else if(r === this.height - 1) {
						hexEntityBlue = this.game.entities.blueGoalBottom; 
						this.entities.push(hexEntityBlue);
						hexEntities.push(hexEntityBlue);
					}
					this.Hexes["q"+q+"r"+r] = new Hex({q: q, r: r, board: this, origin: this.origin, entities: hexEntities, type: this.hexType, hexSize: this.hexSize, style: this.hexStyle});

					if(hexEntityRed === this.game.entities.redGoalLeft) {
						this.game.entities.goalHexes["red"]["left"].push(this.Hexes["q"+q+"r"+r]);
					}

					if(hexEntityRed === this.game.entities.redGoalRight) {
						this.game.entities.goalHexes["red"]["right"].push(this.Hexes["q"+q+"r"+r]);
					}

					if(hexEntityBlue === this.game.entities.blueGoalTop) {
						this.game.entities.goalHexes["blue"]["top"].push(this.Hexes["q"+q+"r"+r]);
					}

					if(hexEntityBlue === this.game.entities.blueGoalBottom) {
						this.game.entities.goalHexes["blue"]["bottom"].push(this.Hexes["q"+q+"r"+r]);
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

	// a.append("rect")
	//  .attr("width", this.rect.width)
	//  .attr("height", this.rect.height)
	//  .attr("class", "guard");
	
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
	this.entities.redGoalLeft = {"id": this.entities.length, "goal": "red"};
	this.entities.redGoalRight = {"id": this.entities.length, "goal": "red"};
	this.entities.blueGoalTop = {"id": this.entities.length, "goal": "blue"};
	this.entities.blueGoalBottom = {"id": this.entities.length, "goal": "blue"};
	this.entities.goalHexes = {"id": this.entities.length, "red": {"left": [], "right": []}, "blue": {"top": [], "bottom": []}};
	this.entities.goalHexes.red.start = this.entities.goalHexes.red.left;
	this.entities.goalHexes.blue.start = this.entities.goalHexes.blue.top;
	this.entities.goalHexes.red.end = this.entities.goalHexes.red.right;
	this.entities.goalHexes.blue.end = this.entities.goalHexes.blue.bottom;
	this.entities.checkedHexes = [];
	this.entities.checkedEntity = {"id": this.entities.length, "checked": true};
	this.dimensions = this.getInnerDimensions();
	this.resizeBoard(this.dimensions);
	window.addEventListener("resize", this.resizeBoard, false);

	this.board = new HexGrid({mapType: "rhomb", width: 11, height: 11, origin: {x: "center", y: 80}, hexType: "point-top", game: this});
	this.board.draw();
}

Game.prototype.getInnerDimensions = function() {
	var new_board_width = "innerWidth" in window ? window.innerWidth : document.documentElement.offsetWidth;
	var new_board_height = "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;	
	return {width: new_board_width, height: new_board_height};	
}

Game.prototype.resizeBoard = function(dimensions) {
	this.dimensions = dimensions || this.getInnerDimensions();
	var playArea = document.getElementsByClassName("playArea")[0];
	playArea.setAttribute("width", this.dimensions.width);
	playArea.setAttribute("height", this.dimensions.height);
}	


Game.prototype.checkVictory = function(player, currentHex) {
	var victory = false;
	if (currentHex && currentHex.entities.indexOf(player) !== -1) {
		var neighbors = currentHex.getNeighbors();
		if (game.entities.checkedHexes.indexOf(currentHex) === -1) {
			currentHex.entities.push(game.entities.checkedEntity);
			game.entities.checkedHexes.push(currentHex);
			currentHex.draw();
			if (this.entities.goalHexes[player.color].end.indexOf(currentHex) !== -1) {
				victory = true;
			} else {
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
}


game = new Game();

var pointerStart, pointerEnd, pointerDistance, dragInterval;

// http://stackoverflow.com/questions/2601097/how-to-get-the-mouse-position-without-events-without-moving-the-mouse
var mouse = {x: 0, y: 0};
document.addEventListener('mousemove', function(e){ 
    mouse.x = e.clientX || e.pageX; 
    mouse.y = e.clientY || e.pageY;
}, false);

document.getElementsByClassName("playArea")[0].addEventListener('mousedown', function(e) {
	if(equal(whichButton(e), {'left': 0, 'right': 1, 'middle': 0})) {
		pointerStart = new Point(e.clientX || e.pageX, e.clientY || e.pageY);
		mouse = {x: e.clientX || e.pageX, y: e.clientY || e.pageY};
		dragInterval = setInterval(dragmap, 10); // http://stackoverflow.com/questions/15978305/while-mousedown
	}
});

document.getElementsByClassName("playArea")[0].addEventListener('mouseup', function(e) {
	clearInterval(dragInterval); // http://stackoverflow.com/questions/15978305/while-mousedown
});

document.getElementsByClassName("playArea")[0].addEventListener('mousedown', function(e) {
	target = e.srcElement || e.target;
	if(equal(whichButton(e), {'left': 1, 'right': 0, 'middle': 0}) && target.className.baseVal.indexOf("hex") > -1) {
		var hexId = target.id;
		var hexNode = game.board.Hexes[hexId];
		d3.select("#g-" + hexId + " .info").remove();
		var infoBox = d3.select("#g-" + hexId)
			.append("foreignObject")
				.attr("class", "info")
				.attr("x", hexNode.center.x)
				.attr("y", hexNode.center.y)
				.attr("width", 100)
				.attr("height", 100)
				.attr("requiredExtensions", "http://www.w3.org/1999/xhtml")
			.append("xhtml:body")
			.append("div");
		for(var i = 0; i < hexNode.entities.length; i++) {
			infoBox.append("pre")
				.text(JSON.stringify(hexNode.entities[i]) + "\n");
		}
	}
});


window.addEventListener('wheel', function (e){
	game.board.hexSize += e.wheelDeltaY/12;
	game.board.hexSize = game.board.hexSize > 0 ? game.board.hexSize : 10;
	for (hex in game.board.Hexes) {
		game.board.Hexes[hex].size = game.board.hexSize;
		game.board.Hexes[hex].style["stroke-width"] = game.board.hexSize/10;
	}
	game.board.draw();

}, false);

closeMessage = function (e) {
		if(tmpDiv = document.querySelector("#message")) document.querySelector("body").removeChild(tmpDiv);
}

var svg_button = document.createElement("object");
svg_button.setAttribute("data", "help.svg");
svg_button.setAttribute("type", "image/svg+xml");
svg_button.setAttribute("id", "svg_button");
svg_button.setAttribute("width", "30px");
svg_button.setAttribute("style", "top: -10px;");
document.getElementsByClassName("instructions")[0].getElementsByTagName("a")[0].appendChild(svg_button);
var img_button = document.createElement("img");
img_button.setAttribute("width", "60px");
img_button.setAttribute("height", "60px");

document.getElementsByClassName("instructions")[0].getElementsByTagName("object")[0].appendChild(img_button);

document.getElementById("svg_button").addEventListener("load",function(){
	document.getElementById("svg_button").contentDocument.getElementById("svg_4").addEventListener('click', function (e) {
		if(!(tmpDiv = document.querySelector("#message"))) {
			var tmpDiv = document.createElement("div");
			tmpDiv.setAttribute("id", "message");
			tmpDiv.innerHTML = "<a href=\"#\" class=\"close\">X</a><div><h3>How to play:</h3><p>Click on hexes on your turn to fill them in. Red wins by creating an unbroken chain of red hexes from the left edge to the right edge (including light red hexes). Blue wins by creating an ubroken chain of blue hexes from the top edge to the bottom edge (including light blue hexes). The purple corner hexes count for either red or blue. Right click + drag to move the map around. Use the scroll wheel to zoom in and out.</p><h3>About:</h3><p>This was written mainly as a learning exercise. It should currently work in desktop sized webkit browsers.</p><h4>Versions:</h4><ul><li>0.4 - (current version) - local 2 player feature complete desktop version.</li><li>0.5 - Mobile friendly</li><li>0.6 - Single player (AI)</li><li>0.7 - Networked multiplayer</li><li>0.8 - General code refactoring (may also take place in earlier versions)</li><li> 0.9 - Beta (bugfixes only)</li><li>1.0 - Final release</li></div>";
			document.querySelector("body").appendChild(tmpDiv);
			document.querySelector("#message .close").addEventListener('click', closeMessage, false);	
		} else {
			document.querySelector("#message .close").removeEventListener('click', closeMessage, false);
			closeMessage();
		}
	}, false);

	document.getElementById("svg_button").contentDocument.getElementById("svg_4").addEventListener('mouseover', function (e) {
		document.getElementById("svg_button").contentDocument.getElementById("svg_4").style.cursor = "pointer";
	}, false);	

	document.getElementById("svg_button").contentDocument.getElementById("svg_4").addEventListener('mouseout', function (e) {
		document.getElementById("svg_button").contentDocument.getElementById("svg_4").style.cursor = "default";
	}, false);
});

document.getElementsByClassName("playArea")[0].addEventListener('mousedown', function (e) {
	target = e.srcElement || e.target;
	game.board.draw();
	if(equal(whichButton(e), {'left': 1, 'right': 0, 'middle': 0}) && target.className.baseVal.indexOf("hex") > -1) {
		var newEntity = {"id": game.board.entities.length, "player": game.entities.currentPlayer};
		if(game.board.Hexes[target.id].entities.indexOf(game.entities.lockedEntity) === -1) {
			game.board.Hexes[target.id].entities.push(newEntity);
			game.board.Hexes[target.id].entities.push(game.entities.currentPlayer);
			game.board.Hexes[target.id].entities.push(game.entities.lockedEntity);
			game.board.Hexes[target.id].draw();
			//game.checkedHexes = [];
			for(goalHex in game.entities.goalHexes[game.entities.currentPlayer.color]["start"]) {
				game.entities.checkedHexes = [];
				for(hex in game.board.Hexes) {
					var index = game.board.Hexes[hex].entities.indexOf(game.entities.checkedEntity);
					if(index > -1) {
						game.board.Hexes[hex].entities.splice(index, 1);
					}
				}
				var victory = game.checkVictory(game.entities.currentPlayer, game.entities.goalHexes[game.entities.currentPlayer.color]["start"][goalHex]);
				if(victory === true) break;
			}
			if(victory) alert("" + game.entities.currentPlayer.color + " won!");
			var playerTurn = document.querySelector(".turn .player");
			playerTurn.classList.remove(game.entities.currentPlayer.color);
			game.entities.currentPlayer = game.entities.currentPlayer === game.entities.bluePlayer ? game.entities.redPlayer : game.entities.bluePlayer;
			playerTurn.innerHTML = game.entities.currentPlayer.color;
			playerTurn.classList.add(game.entities.currentPlayer.color);
		}
	}
});


var dragmap = function(e) {
	pointerEnd = new Point(mouse.x, mouse.y);
	for (hex in game.board.Hexes) {
		game.board.Hexes[hex].origin.x +=  (pointerEnd.getX() - pointerStart.getX());
		game.board.Hexes[hex].origin.y +=  (pointerEnd.getY() - pointerStart.getY());
	}
	pointerStart = new Point(mouse.x, mouse.y);

	game.board.draw();
}
