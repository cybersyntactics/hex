function Point() {
	this.setX(0);
	this.setY(0);	
}

function Point(x, y) {
	this.setX(x);
	this.setY(y);	
}

Point.prototype.getX = function() {
	return this.x;	
}

Point.prototype.getY = function() {
	return this.y;	
}

Point.prototype.setX = function(x) {
	this.x = x;
	return null;	
}

Point.prototype.setY = function(y) {
	this.y = y;
	return null;
}

function Rect(x, y, width, height) {
	this.setX(x);
	this.setY(y);
	this.setW(width);
	this.setH(height);
}

function Rect(point1, point2) {
	this.setX(point1.getX());
	this.setY(point1.getY());
	this.setW(point2.getX());
	this.setH(point2.getY());
}

Rect.prototype = new Point();

Rect.prototype.getW = function() {
	return this.width;
}

Rect.prototype.getH = function() {
	return this.height;
}

Rect.prototype.setW = function(width) {
	this.width = width;
	return null;	
}

Rect.prototype.setH = function(height) {
	this.height = height;
	return null;
}