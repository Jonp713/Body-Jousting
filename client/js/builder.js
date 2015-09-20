var walls = [{x:1000, y: 1000}];

var builder = {
	on:false,
	item:null,
};

builder.refs = {}

builder.refs["wall"] = {width: 35, height: 35};

builder.start = function(type){
		
	this.item = type;
	this.on = true;
	user.inPlace = true;
	user.log.has = false;
	user.log.stolen = false;
	socket.emit("drop_log", {name: user.name});		
};

builder.scrap = function(){
		
	this.item = null;
	this.on = false;
	user.inPlace = false;
	
};

builder.place = function(){
		
	var xy = user.getHoldingCoords(this.refs[this.item]);
	
	this.on = false;	
	user.inPlace = false;
		
	socket.emit("add_object", {type: this.item, removed:false, x: xy.x, y: xy.y, width: this.refs[this.item].width, height: this.refs[this.item].height });
};