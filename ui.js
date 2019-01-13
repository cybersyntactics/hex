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


// http://stackoverflow.com/questions/2601097/how-to-get-the-mouse-position-without-events-without-moving-the-mouse
// Should probably be changed to HTML5 drag events.
var pointerDistance, dragInterval;
var scaling = false;
var touchList;
var last_pinchDistance;

function updateMouse(e){
	e.clientX = e.touches ? e.touches[0].clientX : e.clientX;
	e.clientY = e.touches ? e.touches[0].clientY : e.clientY;
    game.mouse.x = e.clientX || e.pageX;
    game.mouse.y = e.clientY || e.pageY;
    return {"x": game.mouse.x, "y": game.mouse.y}; //clone
}

function touchStart(e) {
	e.preventDefault();
	if(e.touches.length === 2) {
		scaling = true;
		pinchStart = Math.sqrt((e.touches[0].clientX-e.touches[1].clientX) * (e.touches[0].clientX-e.touches[1].clientX) +
    							   (e.touches[0].clientY-e.touches[1].clientY) * (e.touches[0].clientY-e.touches[1].clientY));
		last_pinchDistance = pinchStart;
		touchList = e.touches;
		pinchMap(e);
	} else if (e.touches.length === 1) {
		startMouse = updateMouse(e);
		lastMouse = updateMouse(e); // clone 
		target = e.srcElement || e.target;
		game.moveMap(null, new Point(game.mouse.x, game.mouse.y), game.board);
	}
};

function touchMove(e) {
	e.preventDefault();
	touchList = e.touches;
	if(e.touches.length === 2 && scaling === true) {
		pinchMap(e);
		scaling = true;
	} else if (e.touches.length === 1) {
		lastMouse = updateMouse(e);
		target = e.srcElement || e.target;
	}
};

function touchEnd(e) {
	e.preventDefault();
	if(e.touches.length === 2 && scaling === true) {

	} else if (e.touches.length === 1) {
		cancelAnimationFrame(game.moveAnimID);
	} else if(e.touches.length === 0) {
		scaling = false; 
	}
	console.log(startMouse, lastMouse);
	if(scaling !== true && e.touches.length === 0 && startMouse.x - lastMouse.x < 1 && startMouse.y - lastMouse.y < 1) { // uggg. chrome, et al. stopped interpreting touch start and touch end and mouse down and mouse up, so I needed to explicitly tell them the difference between a 'tap' and a drag. Will clean up later.
		updateTurn(target.id);
	}
	cancelAnimationFrame(game.moveAnimID);
	pointerStart = null;
};

function pinchMap(e) {
	var pinchDistance = Math.sqrt((e.touches[0].clientX-e.touches[1].clientX) * (e.touches[0].clientX-e.touches[1].clientX) +
    							    (e.touches[0].clientY-e.touches[1].clientY) * (e.touches[0].clientY-e.touches[1].clientY));
	var sign = 0;
	if(pinchDistance > last_pinchDistance) { 
		sign = 1;
	}else if (pinchDistance < last_pinchDistance) {
		sign = -1;
	}
	game.board.hexSize += sign * pinchDistance / pinchStart;
	//game.board.hexSize *= Math.sqrt((touchList[0].clientX-touchList[1].clientX) * (touchList[0].clientX-touchList[1].clientX) +
    //							    (touchList[0].clientY-touchList[1].clientY) * (touchList[0].clientY-touchList[1].clientY)) / pinchStart;
	last_pinchDistance = pinchDistance;
	game.resizeHexes(game.board.hexSize, game.board);
}

function closeModal(e) {
	var tmpDiv;
	if(tmpDiv = document.querySelector("#message .close")) tmpDiv.dispatchEvent(new Event("click"));
	else closeMessage(e);
}

function closeMessage(e) {
	var tmpDiv;
	if(tmpDiv = document.querySelector("#message")) document.querySelector("body").removeChild(tmpDiv);
}

function showModal(msg, noClose, closeCallback) {
	if(!(tmpDiv = document.querySelector("#message"))) {
		var tmpDiv = document.createElement("div");
		tmpDiv.setAttribute("id", "message");
		tmpDiv.innerHTML = (!noClose ? "<a href=\"#\" class=\"close\">X</a>" : "") +"<div>"+msg+"</div>";
		document.querySelector("body").appendChild(tmpDiv);
		if(!noClose) document.querySelector("#message .close").addEventListener('click', closeCallback, false);		
		if(!noClose) document.querySelector("#message .close").addEventListener('click', closeMessage, false);
	} else if(!noClose) {
		closeModal();
	}
};

function updateTurn(hexID, player) {
	if(player === undefined) player = game.entities.currentPlayer;
	var hexSelected = game.selectHex(hexID);
	if(game.board.Hexes[hexID] !== undefined && player.color === game.entities.currentPlayer.color && hexSelected ) {
		if(game.victory) {
			if(game.mode === "networked") {
				showModal("" + game.entities.currentPlayer.color + " won!");
				socket.emit('victory', {player: game.entities.currentPlayer.color});

			} else {
				alert("" + game.entities.currentPlayer.color + " won!");
			}
		}
		var playerTurn = document.querySelector(".turn .player");
		playerTurn.classList.remove(game.entities.currentPlayer.color);
		if(game.mode === "networked" && game.entities.thisPlayer === game.entities.currentPlayer) { // Maybe take out "networked" and just emit events handled by backbone
			socket.emit("move", {hexID: hexID, player: player, roomId: game.roomId, gameState: game.getState(), viewState: game.getView()});
		}

		game.entities.currentPlayer = (game.entities.currentPlayer === game.entities.bluePlayer ? game.entities.redPlayer : game.entities.bluePlayer);

		playerTurn.innerHTML = game.entities.currentPlayer.color; // this needs to update whenever currentPlayer changes, not just in this function.
		playerTurn.classList.add(game.entities.currentPlayer.color);
		game.gameLoop(game.entities.currentPlayer);
	}
}

function lookForSecondPlayer() {
	showModal("waiting for second player...", false, cancelLookForSecondPlayer);
}

function cancelLookForSecondPlayer() {
	socket.emit("cancel find multiplayer", game.roomId);
	game.mode = "local multiplayer";
	//closeModal();
}

document.getElementsByClassName("playArea")[0].addEventListener('click', function(e) {
	if(equal(whichButton(e), {'left': 0, 'right': 1, 'middle': 0}) /*|| e.touches.length === 1*/) {
		e.preventDefault(e);
		console.log(e.preventDefault, e.preventDefault(e));
		return false;
	}
});
document.getElementsByClassName("playArea")[0].addEventListener('mousedown', function (e) {
	var target = e.srcElement || e.target;
	if(equal(whichButton(e), {'left': 1, 'right': 0, 'middle': 0}) && target.className.baseVal.indexOf("hex") > -1 && game.entities.thisPlayer === game.entities.currentPlayer) {
		updateTurn(target.id, game.entities.thisPlayer);
	}
});
document.addEventListener('mousemove', updateMouse, false);
document.getElementsByClassName("playArea")[0].addEventListener('mousedown', function(e) {
	if(equal(whichButton(e), {'left': 0, 'right': 1, 'middle': 0}) /*|| e.touches.length === 1*/) {
		e.preventDefault(e);
		//console.log(e.preventDefault, e.preventDefault(e));
		game.moveMap(null, new Point(game.mouse.x, game.mouse.y), game.board);
		return false;
	}
});
document.getElementsByClassName("playArea")[0].addEventListener('mouseup', function(e) {
	cancelAnimationFrame(game.moveAnimID);
	pointerStart = null;
});
document.getElementsByClassName("playArea")[0].addEventListener('touchstart', touchStart, false);
document.getElementsByClassName("playArea")[0].addEventListener('touchmove', touchMove, false);
document.getElementsByClassName("playArea")[0].addEventListener('touchend', touchEnd, false);
document.getElementsByClassName("playArea")[0].addEventListener('touchcancel', function(e) {
	console.log('touchcancel');
	//e.preventDefault();;
}, false);
window.addEventListener('wheel', function (e){
	//console.log(game.board.hexSize);
	// game.board.hexSize += e.wheelDeltaY/12;
	game.board.hexSize += e.deltaY/12;
	//console.log(game.board.hexSize, e);
	game.resizeHexes(game.board.hexSize, game.board);
}, false);
document.getElementsByClassName("playArea")[0].addEventListener('mousedown', function(e) {
	target = e.srcElement || e.target;
	if(equal(whichButton(e), {'left': 1, 'right': 0, 'middle': 0}) && target.className.baseVal.indexOf("hex") > -1) {
		var hexId = target.id;
		var hexNode = game.board.Hexes[hexId];
		// transform here?
		// This is labeling which isn't necessary right now.
		// d3.select("#g-" + hexId + " .info").remove();
		// var infoBox = d3.select("#g-" + hexId)
		// 	.append("foreignObject")
		// 		.attr("class", "info")
		// 		.attr("x", hexNode.center.x)
		// 		.attr("y", hexNode.center.y)
		// 		.attr("width", 100)
		// 		.attr("height", 100)
		// 		.attr("requiredExtensions", "http://www.w3.org/1999/xhtml")
		// 	.append("xhtml:body")
		// 	.append("div");
		// for(var i = 0; i < hexNode.entities.length; i++) {
		// 	infoBox.append("pre")
		// 		.text(JSON.stringify(hexNode.entities[i]) + "\n");
		// }
	}
});
document.getElementById("svg_button").addEventListener("load",function(){
	document.getElementById("svg_button").contentDocument.getElementById("svg_4").addEventListener('click',function() {
		showModal("<h3>How to play:</h3><p>Click on hexes on your turn to fill them in. Red wins by creating an unbroken chain of red hexes from the left edge to the right edge (including light red hexes). Blue wins by creating an ubroken chain of blue hexes from the top edge to the bottom edge (including light blue hexes). The purple corner hexes count for either red or blue. Right click + drag to move the map around. Use the scroll wheel to zoom in and out.</p><h3>About:</h3><p>This was written mainly as a learning exercise. It should currently work in desktop sized webkit browsers.</p><h4>Versions:</h4><ul><li>0.4 - (current version) - local 2 player feature complete desktop version.</li><li>0.5 - Mobile friendly</li><li>0.6 - Single player (AI)</li><li>0.7 - Networked multiplayer</li><li>0.8 - General code refactoring (may also take place in earlier versions)</li><li> 0.9 - Beta (bugfixes only)</li><li>1.0 - Final release</li>");
	}, false);

	document.getElementById("svg_button").contentDocument.getElementById("svg_4").addEventListener('mouseover', function (e) {
		document.getElementById("svg_button").contentDocument.getElementById("svg_4").style.cursor = "pointer";
	}, false);	

	document.getElementById("svg_button").contentDocument.getElementById("svg_4").addEventListener('mouseout', function (e) {
		document.getElementById("svg_button").contentDocument.getElementById("svg_4").style.cursor = "default";
	}, false);
});

document.getElementById("findMultiplayerButton").addEventListener("click", function(e) {
	selectMenu(e.currentTarget, document.querySelectorAll(".gameControls a"))
	game.gameStart("networked"); 
});

document.getElementById("localMultiplayerButton").addEventListener("click", function(e) {
	selectMenu(e.currentTarget, document.querySelectorAll(".gameControls a"));
	cancelLookForSecondPlayer();
	closeModal();
	game.gameStart("local"); 
});

function selectMenu(target, nodeList) {
	for(var i = 0; i < nodeList.length; i++) {
		nodeList[i].classList.remove("selected");
	}	
	target.classList.add("selected");
}

function removeChat(player) {
	var chatContainer = document.querySelector("#chatContainer");
	if(chatContainer) chatContainer.parentNode.removeChild(chatContainer);
}

function addChat(player) {
	if(document.querySelector("#chatContainer")) removeChat(player);

	var chatContainer = document.createElement("div");
	chatContainer.setAttribute("id", "chatContainer");
	document.querySelector("body").insertBefore(chatContainer, document.querySelector("script")[0]);

	var chatWindow = document.createElement("div");
	chatWindow.setAttribute("id", "chatWindow");
	chatWindow.updateChat = function(msg) {
		var name = document.createElement("span");
		name.setAttribute("class", "player " + msg.player);
		name.appendChild(document.createTextNode(msg.player));

		var text = document.createElement("span");
		text.setAttribute("class", "row");
		text.appendChild(name);
		text.appendChild(document.createTextNode(": " + msg.msg));

		this.appendChild(text);
	}
	chatContainer.appendChild(chatWindow);

	var chatInput = document.createElement("input");
	chatInput.setAttribute("id", "chatInput");
	chatInput.setAttribute("type", "text");
	chatInput.setAttribute("maxLength", "255");
	chatInput.setAttribute("size", "50");
	chatInput.onkeydown = function(e){
		if(e.keyCode==13){
			var msg = {player: player.color, msg: this.value, roomId: game.roomId};
			socket.emit("chat", msg);
			chatWindow.updateChat(msg);

			this.value = "";
		};
	};
	chatContainer.appendChild(chatInput);

	socket.on("chat", function(msg) {
		chatWindow.updateChat(msg);
	});

	var chatCursor = document.createElement("span");
	chatCursor.setAttribute("id", "chatCursor");
	chatCursor.setAttribute("class", "player " + player.color);
	chatCursor.appendChild(document.createTextNode(">"));
	chatContainer.insertBefore(chatCursor, chatInput);
}

