var tools = require('./tools.js');
var powers = require('./powers.js').powers;

module.exports = function(game, io){
	
	var Player = function(args){
		this.tag = "player";
		this.x = 0;
		this.y = 0;
		this.height = 36;
		this.width = 41;
		this.team = args.team;
		this.renderteam = args.team;
		this.name = args.name;
		this.direction = "D";
		
		this.image = args.image || null;
		
		this.render = true;
		this.draw = function(){
			if(this.dead) renderer.drawImage(game.server.teams[this.team].name + "corpse", this.x- 4, this.y);
			else if(this.powers.papaBear){
				var papaSpriteFinder= {
					"R":{x:0, y:0, width:63, height:63},
					"D":{x:0, y:66, width:63, height:63},
					"L":{x:66, y:0, width:63, height:63},
					"U":{x:66, y:66, width:63, height:63},
				}
				renderer.drawSprite("bear", this.x,this.y, papaSpriteFinder[this.direction]);
			}else if(!this.powers.invisibility){
				renderer.drawImage("playershadow", this.x-1 , this.y+ 21);
				var playerSpriteFinder = {
					"L":{x:2 + ((this.character-1) * 43), y:2, width:41, height:36},
					"R":{x:2 + ((this.character-1) * 43), y:40, width:41, height:33},
					"D":{x:2 + ((this.character-1) * 43), y:75, width:41, height:35},
					"U":{x:2 + ((this.character-1) * 43), y:113, width:41, height:36},
				}
				renderer.drawSprite(game.server.teams[this.renderteam].name + "team", this.x,this.y, playerSpriteFinder[this.direction]);
			}
			if(!this.dead && !this.powers.papaBear){
				if(this.log.has){
					var backpackSpriteFinder = {
						"R":{x:0, y:0, width:60, height:40, thisDelta:{x: -14, y:-3}},
						"D":{x:0, y:40, width:60, height:43, thisDelta:{x: -20, y:-10}},
						"U":{x:0, y:83, width:60, height:39, thisDelta:{x: -20, y:-5}},
						"L":{x:0, y:126, width:60, height:40, thisDelta:{x: 0, y:-3}},	
					}
					renderer.drawSprite("backpacks", this.x + backpackSpriteFinder[this.direction].thisDelta.x, this.y + backpackSpriteFinder[this.direction].thisDelta.y, backpackSpriteFinder[this.direction]);
				}
				if (this.attacking){
					var spearHelper = {
						"U":{x: 36, y: -22},
						"D":{x:0, y: 20},
						"R":{x:36, y:22},
						"L":{x:-26, y:22},
					}			
					renderer.drawRect(this.spear.color, this.x + spearHelper[this.direction].x, this.y + spearHelper[this.direction].y, getWidth(this), getHeight(this));	
				}	
			
			}	
		
		    var weapon = user.client.weapon;
			if(this.weapon.state == "attacking") weapon.renderData.drawBlur(this, weapon.renderData.blur[this.direction]);
		    if(weapon.renderData[this.weapon.state]) renderer.drawImageRelative(weapon.renderData[this.weapon.state][this.direction], this);
			//chat drawing
			if(this.chatting) renderer.playerText(this);
		}
	
		this.attacking = false;
		
		this.character = Math.floor((Math.random() * 3) + 1);
	
		this.powers = {};

		this.frozen = false;
	
		this.dead = false;
	
		this.chatting = false;
		this.chatText =  "";
		this.illegal = false;
	
		this.spear = {
			width : 30,
			height : 5,
			color: "grey"
		},
		
		this.weapon = {
		   state: "ready"
		}
	
		this.log = {
			has: false,
			stolen: false,
			stolenFrom: "",
			wood: 0,
		}

	};

	Player.prototype.collide = function(agent){
		//agent == thing moving
		//this == thing being hit

		//passive
		//for AGENT colliding with THIS
		if(agent.tag == "player" || agent.tag == "papaBear"){
			if(this.attacking){
				if(agent.tag == "papaBear" && !this.powers.powerWeapon) return;
				if(tools.colCheckRelative({item: this.spearColBoxes[this.direction], influencer: this}, agent)){
					agent.die();
					return;
				} 
			}
			if(this.powers.papaBear && tools.colCheck(agent, this)){
				agent.die();
				return;
			}	
		}


		//active
		//for the AGENT running into THIS -- return true if it collided plz
		if(tools.colCheck(agent, this)){
			if(this.powers.papaBear){
				if(agent.tag == "powerWeapon"){
					this.die();
					return;
				} 
				else return false;
			}
			if(agent.tag == "sword" || agent.tag == "spear" || agent.tag == "powerWeapon" || agent.tag == "papaBear"){
				this.die();
				return;
			}
			//returns true to prevent movement of the agent
			else return true;
		}
	}
	
	Player.prototype.spearColBoxes = {
		U:{x: 36,y: -22, width:5, height:30},
		D:{x:0,y:20, width: 5, height:30},
		R:{x:36,y:22, width: 30, height:5},
		L:{x:-26,y:+22, width: 30, height:5}
	};

	Player.prototype.spawn = function(func){

		var spawnCoords = {};
		var free = true;

		var getXY = function(){

			var spawnX = 0;

			var spawnY = 0;
		
			spawnX = game.teams[this.team].baseX + ((100 * Math.random() * 8) - 400);

			spawnY = game.teams[this.team].baseY + (100 * Math.random() * 3) + 100;

			return {x: spawnX, y: spawnY};
		
		}.bind(this);

		do{

			legal = false;

			var spawnPlayer = getXY();
			spawnPlayer.width = this.width;
			spawnPlayer.height = this.height;

			legal = this.legalMove(spawnPlayer);
		
		}while(!legal);

		if(!func){

			this.x = spawnPlayer.x;
			this.y = spawnPlayer.y;

		}else{

			func(spawnPlayer);
		}

	}

	Player.prototype.legalMove = function(dummy){

		var playerCollisions = [
			game,
			game.forAllTeams.bind(game),
			game.trees,
			game.objects,
			game.forAllOtherAlivePlayers.bind(game, this)
		];

		return tools.checkAll(dummy, playerCollisions);

	}

	Player.prototype.defense = function(){
		//collide with everyone elses spear/papabear
		//this is the passive death
		//you will recognize how this behaves by the top portion of the collisions statements
		var playerCollisions = [
			game.forAllOtherAlivePlayers.bind(game, this)
		];

		return tools.checkAll(this, playerCollisions);

	}

	Player.prototype.offense = function(){

		//if the spear is out, consistently attack with it
		if(!this.attacking || !this.powers.spear) return;

		var box = JSON.parse(JSON.stringify(this.spearColBoxes[this.direction]));

		box.x += this.x;
		box.y += this.y;
		if(this.powers.powerWeapon) box.tag = "powerWeapon";
		else box.tag = "spear";
		
		tools.checkAll(box, game.forAllOtherAlivePlayers.bind(game, this));
	}
	
	Player.prototype.die = function(){
		
		game.elephant[this.name].emit("death", {});
		
		this.dead = true;
		this.attacking = false;		
		this.renderteam = this.team;
		this.log.has = false;
		
		this.loseAllPowers();

		this.spawn(function(spawn){

			setTimeout(function() { 
				this.x = spawn.x;
				this.y = spawn.y;
				this.dead = false;
		
			 }.bind(this), 8000);

		}.bind(this));
	}
	
	Player.prototype.loseAllPowers = function(){
		for(var power in this.powers){
			if(this.powers[power] == true) powers.index[power].lose(this);
		}
	}
	
	Player.prototype.swipe = function(){

		var boxes = JSON.parse(JSON.stringify(this.weaponColBoxes[this.direction]));

		boxes = boxes.map(function(box){
			box.x += this.x;
			box.y += this.y;
			box.width = box.width;
			box.height = box.height;
			box.tag = "sword";
			return box;
		}.bind(this));
		
		tools.checkAll(boxes, game.forAllOtherAlivePlayers.bind(game, this));
	
	};
		
	Player.prototype.weaponColBoxes = {

	     "U": [{
	        x:  - 14.5, y: - 30,
	        width: 70, height: 50
	     }, {
	        x:  - 33.5, y:  -9,
	        width: 19,height: 29
	     }, {
	        x:  - 7, y:  -35,
	        width: 9, height: 5
	     }, {
	        x:   2, y:  - 35,
	        width: 35,height: 9
	     }, {
	        x:   53, y:  - 35,
	        width: 9,height: 5
	     }, {
	        x:   54, y:  - 9,
	        width: 19,height: 29
	    }], 
            
            
	    "D": [{
	        x: - 14.5, y: 20,
	        width: 70,height: 50
	     }, {
	        x: - 33.5, y:  20,
	        width: 19,height: 29
	     }, {
	        x: - 7, y:  70,
	        width: 9,height: 5
	     }, {
	        x:  2, y: 70,
	        width: 35,height: 9
	     }, {
	        x: 53, y: 70,
	        width: 9,height: 5
	     }, {
	        x: 54, y: 20,
	        width: 19,height: 29
	    }], 
        
        
	     "L": [{
	        x: - 30, y: - 18,
	        width: 50, height: 70
	     }, {
	        x: - 9, y: 53,
	        width: 29,height: 19
	     }, {
	        x: - 35, y: -35,
	        width: 5, height: 9
	     }, {
	        x: -35, y:  0 ,
	        width: 9,height: 35
	     }, {
	        x:  - 35, y: - 9,
	        width: 5,height: 9
	     }, {
	        x: - 9, y: - 37,
	        width: 29,height: 19
	    }], 
        
	     "R": [{
	        x: 20, y: - 18,
	        width: 50, height: 70
	     }, {
	        x: 20, y: 53,
	        width: 29,height: 19
	     }, {
	        x: 70, y: -35,
	        width: 5, height: 9
	     }, {
	        x: 70, y: 0,
	        width: 9,height: 35
	     }, {
	        x: 70, y: - 9,
	        width: 5,height: 9
	     }, {
	        x: 20, y: - 37,
	        width: 29,height: 19
	    }]
	};

	return Player;
	
}
