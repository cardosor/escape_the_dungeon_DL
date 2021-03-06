//Select html elements
const enableAudioBtn = document.querySelector('#enableAudio');
const canvas = document.querySelector('#gameCanvas');
const playerHP = document.querySelector('#playerhp');
const playerScore = document.querySelector('#score');
const playerDef = document.querySelector('#playerdef');
const playerAttack = document.querySelector('#playerattack');
//Variables to hold the map raw information
let mapDataRaw = null;
let mapDataRawLayer2 = null;
//Enemy number acumulator
let numberOfSlimes = 0;
//Array to hold the enemies
const slimeArray = [];
//Eneme stats
const slimeStartHP = 20;
const slimeStartAttack = 10;
//Size of the tile in the sprite sheet
const tileSize = 16;
//Width and Hieght of the canvas
const viewWidth = 30;
const viewHeight = 20
//Scale the game can be 2 or 4
const scale = 2;
//Canvas size in pixels
const viewWidthPixel = viewWidth*tileSize*scale;
const viewHeightPixel = viewHeight*tileSize*scale;
//Hero-Slime image size the the sprite sheet
const heroSize = 48*scale;
//Center positoin of the Hero-Slime image
const centerTilePos = ((tileSize*scale/2)-heroSize/2);
//Width and Height of the world map row col in the array
const worldWidth = viewWidth * 4;
const worldHeight = viewHeight * 4;
//Start posision of Hero
const startRowCol = {row:Math.floor(viewHeight/2),col:Math.floor(viewWidth/2)};
//Current row and col of the mapview to world map
const worldRowCol = {row: 0, col:0};
//Change the cavas size
canvas.setAttribute("height",(tileSize*scale)*viewHeight);
canvas.setAttribute("width",(tileSize*scale)*viewWidth);
//Speed of the player
const playerSpeed = (16*scale)/8;
//Set variables for frames per second
const fps = 30;
let now;
let then = Date.now();
const interval = 1000/fps;
let delta;

var isChromium = window.chrome;

let score = 0;

//Create inventory UI
const inventory = document.querySelector("#inventory")
for(let i = 0; i < 10; i++){
    const item = document.createElement("div");
    item.classList.add('item');
    inventory.appendChild(item);

}


//Canvas context
const ctx = canvas.getContext('2d');

//Create game states and set it
const gameStates = {
    start: 'start',
    end: 'end',
    gameOver: 'gameover',
    begin: 'begin'
}
let gameState = gameStates.begin;

//===============Audio===============
//===================================
//===================================
let ambienceSound = null;
let playerAttackDrySound = null;
let playerAttackHit = null;
let playerAttackParry = null;
let openChestSound = null;

const enableAudioClick = () => {
    enableAudioBtn.disabled = true; 
    ambienceSound = new Audio('./sound/Where_Art_Thou_Version_01_LOOP.mp3');
    playerAttackDrySound = new Audio('./sound/Sword_Attack_1.mp3');
    playerAttackHit = new Audio('./sound/Weapon_Swing_Blood_Hit_13.mp3');
    playerAttackParry = new Audio('./sound/Weapon_Parry_Block_Metal.mp3');
    openChestSound = new Audio('./sound/Open_Jewelry_Chest_or_Lock_2.mp3');
    openChestSound.load();
    playerAttackDrySound.load();
    playerAttackHit.load();
    playerAttackParry.load();
    ambienceSound.load();
    ambienceSound.volume = .5;
    playerAttackDrySound.volume = .1;
    playerAttackHit.volume = .1;
    playerAttackParry.volume = .1;
    openChestSound.volume = .1;
    
    ambienceSound.addEventListener('canplaythrough', () => {
        ambienceSound.loop = true;
        ambienceSound.play();
    });

};

//===============Images===============
//===================================
//===================================

const heroSpriteSheet = new Image(192, 528);
heroSpriteSheet.src = 'img/chara_hero.png';
const heroSpriteSheetFlip = new Image(192, 528);
heroSpriteSheetFlip.src = 'img/chara_hero_flip.png';

const slimeSpriteSheet = new Image(192,528);
slimeSpriteSheet.src = 'img/chara_slime.png'
const slimeSpriteSheetFlip = new Image(192,528);
slimeSpriteSheetFlip.src = 'img/chara_slime_flip.png'

const tileMap = new Image(320,384);
tileMap.src = 'img/tiles_dungeon.png';

const mapDataImg = new Image(120,80);
mapDataImg.src = 'img/map.png';
const mapDataImgLayer2 = new Image(120,80);
mapDataImgLayer2.src = 'img/map1.png';
const mapData = [[]];
const mapDataLayer2 = [[]];

//===============Raw MAP data===============
//===================================
//===================================
function createMapData(mapDataRawValue, mapDataValue){
    let row = 0;
    for (var i = 0, n = mapDataRawValue.data.length; i < n; i += 4) {
        if(i !== 0 && i%480 === 0){
            mapDataValue.push([]);
            row++;
        }
        let r = mapDataRawValue.data[i];
        let g = mapDataRawValue.data[i+1];
        let b = mapDataRawValue.data[i+2];
        mapDataValue[row].push({r:r, g:g, b:b});
    }
}

mapDataImg.onload = function() {
    console.log('Image one loaded');
    ctx.drawImage(mapDataImg,0,0);
    mapDataRaw = ctx.getImageData(0, 0, 120, 80);
    createMapData(mapDataRaw, mapData);
}
mapDataImgLayer2.onload = function() {
    console.log('Image 2 one loaded')
    ctx.drawImage(mapDataImgLayer2,0,0);
    mapDataRawLayer2 = ctx.getImageData(0, 0, 120, 80);
    createMapData(mapDataRawLayer2, mapDataLayer2);
}

//==Start the Game Function==========
//===================================
//===================================
let player = null; //Player Variable

//Called when the player clicks on start game
function startGame(){
    //Create the player
    score = 0;
    playerScore.textContent = "Score:   "+score;
    player = new Pawn("Hero",100, 0, 3, heroSpriteSheet, heroSpriteSheetFlip, startRowCol.row, startRowCol.col,playerSpeed);
    playerHP.textContent = "Helth:   "+player.hp;
    playerDef.textContent = "Defense:   "+player.def;
    playerAttack.textContent = "Attack:   "+player.attackPoints;
    //Empty the enemy array in case the player plays a new game
    if(slimeArray.length > 0){
        for(let i = 0, size = slimeArray.length; i < size; i++){
            slimeArray.pop();
        }
    }
    //Reset the world row and col
    worldRowCol.row = 0;
    worldRowCol.col = 0;
    //Create the map layer 2 array based on the raw data
    createWorldMapLayer2(mapDataLayer2);
    //Create the map layer 1 array based on the raw data
    createWorldMap(mapData);
    //Create - update the map view layer 1 array
    updateMapView();
    //Create - update the map view layer 2 array
    updateMapViewLayer2();
    gameState = gameStates.start; //Set the game state to start
    //Draw on canvas
    draw();
    canvas.setAttribute('tabindex', '0')
    canvas.focus();
}

//Return the image frames size and locations x y
function getFrames(row, frames, size){
    let framesArray = [];
    for(let i = 0; i < frames.length; i++){
        framesArray.push([frames[i]*size,row*size, size, size]);
    }
    return framesArray;
}

//Before the slime can walk it checks if the next array row col is not blocked
function walkSlime(obj, speed){
    obj.state = obj.states.walk;
    //Set the speed and increment the distance it walked
    if(obj.direction === obj.directions.up || obj.direction === obj.directions.down){
        obj.speedY = speed;
        obj.walkDistance += obj.speedY;
    }else if(obj.direction === obj.directions.left || obj.direction === obj.directions.right){
        obj.speedX = speed;
        obj.walkDistance += obj.speedX;
    }
    //Update the location of the obj in the world map
    mapWorldLayer2[obj.mapViewRowCol.row][obj.mapViewRowCol.col].x = obj.x-centerTilePos;
    mapWorldLayer2[obj.mapViewRowCol.row][obj.mapViewRowCol.col].y = obj.y-centerTilePos;
    
    //If the enemy has walked the distance it needed to walk
    //Update the last and next location in the world map
    //set the speed to 0 and end the walk cicle
    if(obj.walkDistance != 0 && obj.walkDistance%(tileSize*scale+Math.abs(speed)) === 0){
        obj.walkDistance = 0;
        let tile = tiles.nullTile;
        let type = tileType.floor;
        
        mapWorldLayer2[obj.mapViewRowCol.row][obj.mapViewRowCol.col].tile = tile
        mapWorldLayer2[obj.mapViewRowCol.row][obj.mapViewRowCol.col].type = type

        if(obj.direction === obj.directions.up || obj.direction === obj.directions.down){
            obj.speedY = 0;
            if(speed < 0){
                obj.mapWorldRowCol.row++;
                obj.mapViewRowCol.row++;
            }else{
                obj.mapWorldRowCol.row--;
                obj.mapViewRowCol.row--;
            }
        }
        else if(obj.direction === obj.directions.left || obj.direction === obj.directions.right)
        {
            obj.speedX = 0;
            if(speed < 0){
                obj.mapWorldRowCol.col++;
                obj.mapViewRowCol.col++;
            }else{
                obj.mapWorldRowCol.col--;
                obj.mapViewRowCol.col--; 
            }
        }
        tile = tiles.slime;
        type = tileType.slime;
        mapWorldLayer2[obj.mapViewRowCol.row][obj.mapViewRowCol.col].tile = tile
        mapWorldLayer2[obj.mapViewRowCol.row][obj.mapViewRowCol.col].type = type
        //update the map view to reflect the map world data
        updateMapViewLayer2(worldRowCol.col,worldRowCol.row);
        obj.completeWalk = false;
        obj.walk = false;
        obj.state = obj.states.idle;
    }
}

//Before the Hero can walk it checks if the next array row col is not blocked
function walk(obj, speed){
    obj.state = obj.states.walk;

    //Set the speed and increment the distance it walked
    if(obj.direction === obj.directions.up || obj.direction === obj.directions.down){
        obj.speedY = speed;
        obj.walkDistance += obj.speedY;
    }else if(obj.direction === obj.directions.left || obj.direction === obj.directions.right){
        obj.speedX = speed;
        obj.walkDistance += obj.speedX;
    }

    //If the Hero has walked the distance it needed to walk
    //Update the last and next location in the world map
    //set the speed to 0 and end the walk cicle
    if(obj.walkDistance != 0 && obj.walkDistance%(tileSize*scale+Math.abs(speed)) === 0){
        obj.walkDistance = 0;
        if(obj.direction === obj.directions.up || obj.direction === obj.directions.down){
            obj.speedY = 0;
            if(speed < 0){
                obj.mapWorldRowCol.row++;
                obj.posRowCol.row++;
                //update the world row so the map can move
                worldRowCol.row++;
            }else{
                obj.mapWorldRowCol.row--;
                obj.posRowCol.row--;
                //update the world row so the map can move
                worldRowCol.row--;  
            }
        }
        else if(obj.direction === obj.directions.left || obj.direction === obj.directions.right)
        {
            obj.speedX = 0;
            if(speed < 0){
                obj.mapWorldRowCol.col++;
                obj.posRowCol.col++;
                //update the world col so the map can move
                worldRowCol.col++;
            }else{
                obj.mapWorldRowCol.col--;
                obj.posRowCol.col--;
                //update the world col so the map can move
                worldRowCol.col--;  
            }
        }
        //update the map view layers to reflect the current world array
        updateMapView(worldRowCol.col,worldRowCol.row);
        updateMapViewLayer2(worldRowCol.col,worldRowCol.row);
        if(obj.completeWalk === true){
            obj.completeWalk = false;
            obj.walk = false;
            obj.state = obj.states.idle;
        }
    }
}

//Class for the slime and Hero
class Pawn {
    constructor(name, hp, exp, attackPoints, image, imageFlip, row, col,speed){
        this.name = name,
        this.states = {
            idle: 'idle',
            walk: 'walk',
            stop: 'stop',
            attack:'attack',
            damage: 'damage',
            action: 'action',
            dead: 'dead'
        }
        this.state = this.states.idle,
        this.directions = {
            left: 'left',
            right: 'right',
            up: 'up',
            down: 'down'
        }
        this.godMode = false,
        this.direction = this.directions.right,
        this.performingAction = false,
        this.walk = false,
        this.completeWalk = false,
        this.walkDistance = 0,
        this.walkedDistance = {x:0, y:0},
        this.posRowCol = {row: row, col: col},
        this.x =this.posRowCol.col*tileSize*scale+centerTilePos, //15*tileSize*scale,
        this.y =this.posRowCol.row*tileSize*scale+centerTilePos, //10*tileSize*scale,
        this.mapViewRowCol = {row:this.posRowCol.row, col:this.posRowCol.col},
        this.mapWorldRowCol = {row:this.posRowCol.row, col:this.posRowCol.col},
        this.speed = speed,
        this.speedX = 0,
        this.speedY = 0,
        this.image = image,
        this.imageFlip = imageFlip,
        this.flip = false,
        this.hp = hp,
        this.exp = exp,
        this.attackPoints = attackPoints,
        this.def = 2,
        this.idle = {timeCounter:0, animTime:100, frame:0, frames: getFrames(0,[0,1,2,1],48)},
        this.idleFlip = {timeCounter:0, animTime:100, frame:0, frames: getFrames(0,[3,2,1,2],48)},
        this.actionAnim = {timeCounter:0, animTime:100, frame:0, frames: getFrames(1,[0,1,2,1],48)},
        this.actionAnimFlip = {timeCounter:0, animTime:100, frame:0, frames: getFrames(1,[3,2,1,2],48)},
        this.walkDown = {timeCounter:0, animTime:100, frame:0, frames: getFrames(2,[0,1,2,3],48)},
        this.walkLeft = {timeCounter:0, animTime:100, frame:0, frames: getFrames(3,[3,2,1,0],48)},
        this.walkRight = {timeCounter:0, animTime:100, frame:0, frames: getFrames(3,[0,1,2,3],48)},
        this.walkUp = {timeCounter:0, animTime:100, frame:0, frames: getFrames(4,[0,1,2,3],48)},
        this.attackDown = {timeCounter:0, animTime:100, frame:0, frames: getFrames(5,[0,1,2,3],48)},
        this.attackRight = {timeCounter:0, animTime:100, frame:0, frames: getFrames(6,[0,1,2,3],48)},
        this.attackUp = {timeCounter:0, animTime:100, frame:0, frames: getFrames(7,[0,1,2,3],48)},
        this.attackLeft = {timeCounter:0, animTime:100, frame:0, frames: getFrames(6,[3,2,1,0],48)},
        this.takeDamage = {timeCounter:0, animTime:100, frame:0, frames: getFrames(9,[0,1,2,0],48)},
        this.takeDamageFlip = {timeCounter:0, animTime:100, frame:0, frames: getFrames(9,[3,2,1,3],48)},
        this.deadAnim = {timeCounter:0, animTime:100, frame:0, frames: getFrames(0,[0,3,0,3,0,3],48)}
    };
    getAttack(){
        return this.attackPoints;
    };
    getHP(){
        return this.hp;
    };
    damage(value){
        this.hp -= value;
        this.state = this.states.damage;
        if(this.hp < 0){
            this.hp = 0;
            this.state = this.states.dead;
        }
    };
    anim(ctx, data, interval){
        //timeCounter is used to delay the animation so it does not play
        //Every frame
        data.timeCounter += interval;
        //Once the timeCounter reacher the animation time then it goes to the next frame
        if(data.timeCounter > data.animTime){
            data.timeCounter = 0;
            data.frame++
            //If the frame reaches the frames length then the animation ended
            if(data.frame === data.frames.length){ 

                if(this.state === this.states.attack ||
                    this.state === this.states.action ||
                    this.state === this.states.damage){

                    this.state = this.states.idle;

                }else if(this.state === this.states.dead){
                    this.x = -100;
                    this.y = -100;  
                    if(this.name === 'Slime'){
                        //This case the Enemy is dead
                        mapWorldLayer2[this.mapWorldRowCol.row][this.mapWorldRowCol.col].tile = tiles.nullTile;
                        mapWorldLayer2[this.mapWorldRowCol.row][this.mapWorldRowCol.col].type = tileType.floor;
                        slimeArray.splice(0,1);
                    }else{
                        //This case the hero is dead
                        gameState = gameStates.gameOver;
                    }
                        
                }
                this.performingAction = false;
                data.frame = 0;
            }
        }    

        if (this.flip === true){
            //Drase the Flip image in the canvas
            ctx.drawImage(this.imageFlip,data.frames[data.frame][0],data.frames[data.frame][1],data.frames[data.frame][2],data.frames[data.frame][3],this.x,this.y,heroSize,heroSize);
        }else{
            //Drase the image in the canvas
            ctx.drawImage(this.image,data.frames[data.frame][0],data.frames[data.frame][1],data.frames[data.frame][2],data.frames[data.frame][3],this.x,this.y,heroSize,heroSize);
        }
    };
    moveDown(){
        if(canWalk(this)){
            if(this.name === "Slime"){
                walkSlime(this, this.speed*-1);
            }else{
                walk(this, this.speed*-1)
            } 
        }else{
            this.completeWalk = false;
            this.walk = false;
            this.state = this.states.idle;
         }
    };
    moveUp(){
        if(canWalk(this)){
            if(this.name === "Slime"){
                walkSlime(this, this.speed);
            }else{
                walk(this, this.speed)
            } 
          }else{
                this.completeWalk = false;
                this.walk = false;
                this.state = this.states.idle;
           }
    };
    moveLeft(){
        if(canWalk(this)){
            if(this.name === "Slime"){
                walkSlime(this, this.speed);
            }else{
                walk(this, this.speed)
            } 
        }else{
            this.completeWalk = false;
            this.walk = false;
            this.state = this.states.idle;
        }
    };
    moveRight(){
        if(canWalk(this)){
            if(this.name === "Slime"){
                walkSlime(this, this.speed*-1);
            }else{
                walk(this, this.speed*-1);
            }
            
        }else{
            this.completeWalk = false;
            this.walk = false;
            this.state = this.states.idle;
        }
        
    };
    attack(){
        if(this.performingAction === false){
            checkAction();
            this.performingAction = true;
        }
        
        if(this.direction === this.directions.up){
            this.anim(ctx, this.attackUp, interval);
        }else if(this.direction === this.directions.down){
            this.anim(ctx, this.attackDown, interval);
        }else if(this.direction === this.directions.left){
            this.anim(ctx, this.attackLeft, interval);
        }else if(this.direction === this.directions.right){
            this.anim(ctx, this.attackRight, interval);
        }
    };
    action(){
        if(this.performingAction === false){
            checkAction();
            this.performingAction = true;
        }
        if(this.flip === true){
            this.anim(ctx, this.actionAnimFlip, interval);
        }else{
            this.anim(ctx, this.actionAnim, interval);
        }
        
    }
}


//=================== MAP ======================
//=================== MAP ======================
//=================== MAP ======================
//=================== MAP ======================
//=================== MAP ======================
const mapView = [];
const mapViewLayer2 = [];
const mapWorld = [];
const mapWorldLayer2 = [];
const tiles = {
    nullTile:{row:null, col:null},
    black: {row: 21, col:17},
    floorOneOne : {row:0, col:0},
    void: {row:0, col:3},
    wallLTR: {row:9, col:1},
    wallLTR: {row:9, col:2}, //wall L top right
    wallLTL: {row:9, col:1}, //wall L top left
    wallLBR: {row:10, col:2}, //wall L Bottom right
    wallLBL: {row:10, col:1}, //wall L Bottom left
    wallSEB: {row:11, col:0}, //wall side end bottom
    doorV0 : {row:10, col:15}, //Door Vertical
    doorV1 : {row:11, col:15}, //Door Vertical
    wallCenterTop:{row:9, col:4},
    wallCenterSides:{row:10, col:0},
    chest1 : {row: 16, col: 14},
    chest2 : {row: 16, col: 15},
    vase1: {row:16, col:16},
    vase2: {row:16, col:17},
    slime: {row:null, col:null}
};

const tileTypeArray = ['wall', 'floor', 'door', 'chest1','chest2', 'vase1',
                        'vase2', 'slime'];

const tileType = {
    wall: "wall",
    floor: "floor",
    void: "void",
    door: "door",
    chest1: "chest1",
    chest2: "chest2",
    vase1: "vase1", // original vase
    vase2: "vase2", // broken vase
    slime: 'slime'
}
const blockWalkItems = [tileType.wall, 
                        tileType.chest1, 
                        tileType.chest2, 
                        tileType.vase1,
                        tileType.door, 
                        tileType.slime]

function createWorldMapLayer2(data){
    console.log('createWorldMapLayer2');
    if(mapWorldLayer2.length > 0){
        for(let i = 0, size = mapWorldLayer2.length; i < size; i++){
            mapWorldLayer2.pop();
        }
    }
    let addToColor = 0;
    if(isChromium ===  true){
        addToColor = 1;
    }
    for(let i = 0; i < worldHeight; i++){
        let tempArray = [];
        for(let j = 0; j < worldWidth; j++){
            let x = j*tileSize*scale;
            let y = i*tileSize*scale;
            let tile = tiles.nullTile;
            let type = null;
            let r = data[i][j].r;
            let g = data[i][j].g;
            let b = data[i][j].b;
            if(i === 12 && j === 15){
                 console.log(r);
                 console.log(g);
                 console.log(b);
            }
            // if(r === 0 && g === 0 && b === 0){
            //     tile = tiles.nullTile;
            //     type = tileType.wall;
            // }else if(r === 126+addToColor && g === 126+addToColor && b ===126+addToColor){
            //     tile = tiles.nullTile;
            //     type = tileType.floor;
            // }else if(r === 255 && g === 199 && b ===21){
            //     tile = tiles.chest1;
            //     type = tileType.chest1;
            // }else if(r === 183 && g === 121 && b ===87){
            //     tile = tiles.vase1;
            //     type = tileType.vase1;
            // }else 
            if(r === 126 && g === 126 && b ===126){
                tile = tiles.nullTile;
                type = tileType.floor;
            }else if(r === 0 && g === 255 && b ===0){
                tile = tiles.slime;
                type = tileType.slime;
                slimeArray.push(new Pawn("Slime",slimeStartAttack+(numberOfSlimes), 0, slimeStartHP+(numberOfSlimes*2), slimeSpriteSheet,slimeSpriteSheetFlip, i,j,1));
                numberOfSlimes++;
            }else if(r === 0 && g === 0 && b === 0 || r+b+g === 765){
                tile = tiles.nullTile;
                type = tileType.wall;
            }else{
                tile = {row:r/11, col:b/12};
                type = tileTypeArray[g];
            }
            tempArray.push({tile:tile,type:type,x:x,y:y});
        }
        mapWorldLayer2.push(tempArray);
    }
}


function createWorldMap(data){
    console.log('createWorldMapLayer1');
    if(mapWorld.length > 0){
        for(let i = 0, size = mapWorld.length; i < size; i++){
            mapWorld.pop();
        }
    }
    for(let i = 0; i < worldHeight; i++){
        let tempArray = [];
        for(let j = 0; j < worldWidth; j++){
            let x = j*tileSize*scale;
            let y = i*tileSize*scale;
            let tile = tiles.floorOneOne;
            let type = tileType.floor;
            let r = data[i][j].r;
            let g = data[i][j].g;
            let b = data[i][j].b;
            // if(r === 0 && g === 0 && b === 0){
            //     tile = tiles.black;
            //     type = tileType.wall;
            // }else if(r === 254 && g === 126 && b === 126) {
            //     tile = tiles.wallLTL;
            //     type = tileType.wall;
            // }else if(r === 126 && g === 66 && b === 66) {
            //     tile = tiles.wallLBL;
            //     type = tileType.wall;
            // }else if(r === 127 && g === 255 && b === 127) {
            //     tile = tiles.wallLTR;
            //     type = tileType.wall;
            // }else if(r === 6 && g === 255 && b === 4) {
            //     tile = tiles.wallLBR;
            //     type = tileType.wall;
            // }else if(r === 255 && g === 255 && b === 127) {
            //     tile = tiles.wallCenterTop;
            //     type = tileType.wall;
            // }else if(r === 254 && g === 0 && b === 0) {
            //     tile = tiles.wallCenterSides;
            //     type = tileType.wall;
            // }else if(r === 126 && g === 126 && b === 0) {
            //     tile = tiles.wallSEB;
            //     type = tileType.wall;
            // }else if(r === 0 && g === 0 && b === 255) {
            //     tile = tiles.doorV0;
            //     type = tileType.wall;
            // }else if(r === 0 && g === 0 && b === 126) {
            //     tile = tiles.doorV1;
            //     type = tileType.wall;
            // }
            // else{
            //     tile = tiles.floorOneOne;
            //     type = tileType.floor;
            // }
            if(r === 0 && g === 0 && b === 0){
                tile = tiles.black;
                type = tileType.wall;
            }
            else{
                tile = {row:r/11, col:b/12};
                type = tileTypeArray[g];
            }
            
            tempArray.push({tile:tile,type:type,x:x,y:y});
        }
        mapWorld.push(tempArray);
    }
}

//=================== MAP VIEW ======================
//=================== MAP VIEW ======================
//=================== MAP VIEW ======================
//=================== MAP VIEW ======================
//=================== MAP VIEW ======================

function updateMapViewLayer2(xOffSet, yOffSet){
    if(mapViewLayer2.length > 0){
        for(let i = 0, size = mapViewLayer2.length; i < size; i++){
            mapViewLayer2.pop();
        }
    }
    let posX = xOffSet > 0 ? xOffSet : 0;
    let posY = yOffSet > 0 ? yOffSet : 0;
    for(let i = 0; i < viewHeight; i++){
        mapViewLayer2.push([]);
        for(let j = 0; j < viewWidth; j++){
            let row = i + posY;
            let col = j + posX;
            let x = j*tileSize*scale;
            let y = i*tileSize*scale;
            mapViewLayer2[i].push(mapWorldLayer2[row][col]);
            if(mapWorldLayer2[row][col].type === "slime"){
                if(slimeArray[0].x > 0 && 
                    slimeArray[0].x < viewWidthPixel-heroSize/2 && 
                    slimeArray[0].y > 0 && 
                    slimeArray[0].y < viewHeightPixel-heroSize/2){
                    mapViewLayer2[i][j].x = mapWorldLayer2[row][col].x;
                    mapViewLayer2[i][j].y = mapWorldLayer2[row][col].y;
                }else{
                    mapViewLayer2[i][j].x = x;
                    mapViewLayer2[i][j].y = y;
                    slimeArray[0].mapViewRowCol.row = row
                    slimeArray[0].mapViewRowCol.col = col
                }
            }else{
                
                mapViewLayer2[i][j].x = x;
                mapViewLayer2[i][j].y = y;
            }
            
            
        }
    }
}

function updateMapView(xOffSet, yOffSet){
    if(mapView.length > 0){
        for(let i = 0, size = mapView.length; i < size; i++){
            mapView.pop();
        }
    }
    let posX = xOffSet > 0 ? xOffSet : 0;
    let posY = yOffSet > 0 ? yOffSet : 0;
    for(let i = 0; i < viewHeight; i++){
        mapView.push([]);
        for(let j = 0; j < viewWidth; j++){
            let row = i + posY;
            let col = j + posX;
            let x = j*tileSize*scale;
            let y = i*tileSize*scale;
            mapView[i].push(mapWorld[row][col]);
            mapView[i][j].x = x;
            mapView[i][j].y = y;
        }
    }
}
//Check the action the player is doing, depeding of the action
//It will play different sounds or interact with the objects
function checkAction(){
    let nextRow = 10;
    let nexCol = 15;
    if(player.direction === player.directions.right){
        nexCol+=1;
    }else if(player.direction === player.directions.left){
        nexCol-=1;
    }else if(player.direction === player.directions.up){
        nextRow-=1;
    }else if(player.direction === player.directions.down){
        nextRow+=1;
    }
    if(player.state === player.states.attack){
        let soundPlayed = false;
        for(i = 0; i < blockWalkItems.length; i++){
            if(mapViewLayer2[nextRow][nexCol].type === blockWalkItems[i]){
                if(blockWalkItems[i] === tileType.slime){
                    if(playerAttackHit !== null){
                        playerAttackHit.play();
                    }
                    score = score + 100;
                    playerScore.textContent = "Score:   "+score;
                    slimeArray[0].damage(player.getAttack())
                }else{
                    if(playerAttackParry !== null){
                        playerAttackParry.play();
                        soundPlayed = true;
                        break;
                    }
                }
            }
        }
        if(!soundPlayed && playerAttackDrySound !== null){
            playerAttackDrySound.play();
        }
        if(mapViewLayer2[nextRow][nexCol].type === tileType.vase1){
            mapViewLayer2[nextRow][nexCol].tile = tiles.vase2;
            mapViewLayer2[nextRow][nexCol].type = tileType.vase2;
        }

    }else if(player.state === player.states.action){
        if(mapViewLayer2[nextRow][nexCol].type === tileType.chest1){
            player.hp +=20;
            player.attackPoints +=2;
            player.def+=1;
            playerHP.textContent = "Helth:   "+player.hp;
            playerDef.textContent = "Defense:   "+player.def;
            playerAttack.textContent = "Attack:   "+player.attackPoints;
            mapViewLayer2[nextRow][nexCol].tile = tiles.chest2;
            mapViewLayer2[nextRow][nexCol].type = tileType.chest2;
            if(openChestSound !== null){
                openChestSound.play();
            }
        }
    }
    
    if(mapViewLayer2[nextRow][nexCol].type === tileType.floor){
        return true;
    }else{
        return false;
    }
}

//Check if the player or enemy can walk in a direction
function canWalk(obj){
    let nextRow = obj.mapViewRowCol.row;
    let nexCol = obj.mapViewRowCol.col;
    if(obj.direction === obj.directions.right){
        if(obj.flip == true){
            obj.flip = false;
            obj.anim(ctx, obj.idle, interval);
        }
        nexCol+=1;
    }else if(obj.direction === obj.directions.left){
        if(obj.flip == false){
            obj.flip = true;
            obj.anim(ctx, obj.idleFlip, interval);
        }
        
        nexCol-=1;
    }else if(obj.direction === obj.directions.up){
        nextRow-=1;
    }else if(obj.direction === obj.directions.down){
        nextRow+=1;
    }
    
    if(obj.name === "Slime"){
        if(nextRow === player.mapWorldRowCol.row && nexCol === player.mapWorldRowCol.col){
            if(player.godMode === false){
                player.godMode = true;
                setInterval(() => {
                    player.godMode = false;
                }, 2000)
                player.damage(obj.getAttack());
                playerHP.textContent = "Helth:   "+player.hp;
            }
            slimeArray[0].attack();
        }

        if(mapWorld[nextRow][nexCol].type === tileType.floor){
            //Check if the next tile have blocked items
            for(i = 0; i < blockWalkItems.length; i++){
                if(mapWorldLayer2[nextRow][nexCol].type === blockWalkItems[i]){
                    return false;
                }
            }
            return true;
        }else{
            return false;
        }
    }
    //Check if the next tile have blocked items for the player
    if(mapView[nextRow][nexCol].type === tileType.floor){
        for(i = 0; i < blockWalkItems.length; i++){
            if(mapViewLayer2[nextRow][nexCol].type === blockWalkItems[i]){
                return false;
            }
        }
        return true;
    }else{
        return false;
    }
}

function draw(){
    if(gameState === gameStates.start){
        window.requestAnimationFrame(draw);
        now = Date.now();
        delta = now - then;
        //30 times per second
        if(delta > interval){
            then = now - (delta % interval)
            //Clear the canvas
            ctx.clearRect(0,0,canvas.width, canvas.height);

            //Player walk
            if(player.walk === true && player.direction === player.directions.right){
                player.moveRight();
            }else if(player.walk === true && player.direction === player.directions.left){
                player.moveLeft();
            }else if(player.walk === true && player.direction === player.directions.up){
                player.moveUp();
            }else if(player.walk === true && player.direction === player.directions.down){
                player.moveDown();
            }   
            moveViewLayer1();
            moveViewLayer2();
            slimeUpdate();
            playerUpdate() 
        }
    }else if(gameState === gameStates.gameOver){
        gameState = gameStates.end
        alert("Game Over")
    }if(slimeArray.length === 0 && gameState !== gameStates.end){
        gameState = gameStates.end
        alert("You are the Best. You escaped the Dungeon.\n What is Next?")
    }
      
}

//Move the view layer depending of the player movement
function moveViewLayer1(){
    for(let i = 0; i < mapView.length; i++){
        for(let j = 0; j < mapView[0].length; j++){
            if(player.state === player.states.walk){
                mapView[i][j].x += player.speedX;
                mapView[i][j].y += player.speedY;  
           }
            if(mapView[i][j].tile.col !== null){
                ctx.drawImage(tileMap,mapView[i][j].tile.col*tileSize,mapView[i][j].tile.row*tileSize,tileSize,tileSize,mapView[i][j].x,mapView[i][j].y,tileSize*scale,tileSize*scale);
            }
        }
    }
}
//Move the view layer 2 depending of the player movement
//Also take the Enemy in consideration as the enemy also moves
function moveViewLayer2(){
    for(let i = 0; i < mapViewLayer2.length; i++){
        for(let j = 0; j < mapViewLayer2[0].length; j++){
            if(player.state === player.states.walk){

                mapViewLayer2[i][j].x += player.speedX;
                mapViewLayer2[i][j].y += player.speedY;
           }
            if(mapViewLayer2[i][j].tile.col !== null){
                if(mapViewLayer2[i][j].type === 'slime'){
                    
                }
                ctx.drawImage(tileMap,mapViewLayer2[i][j].tile.col*tileSize,mapViewLayer2[i][j].tile.row*tileSize,tileSize,tileSize,mapView[i][j].x,mapViewLayer2[i][j].y,tileSize*scale,tileSize*scale);
                
            }else{
                if(mapViewLayer2[i][j].type === 'slime')
                {
                    if(slimeArray[0]){
                        mapViewLayer2[i][j].x = mapViewLayer2[i][j].x - slimeArray[0].speedX;
                        mapViewLayer2[i][j].y = mapViewLayer2[i][j].y - slimeArray[0].speedY;
                        slimeArray[0].x = mapViewLayer2[i][j].x+(tileSize*scale/2-heroSize/2);
                        slimeArray[0].y = mapViewLayer2[i][j].y+(tileSize*scale/2-heroSize/2);
                    }
                    
                    
                } 
            }
        }
    }
}

function playerUpdate(){

    switch(player.state){
        case player.states.idle:
            if(player.flip === true){
                player.anim(ctx, player.idleFlip, interval);
            }else{
                player.anim(ctx, player.idle, interval);
            }
            break;
        case player.states.walk:
            switch(player.direction){
                case player.directions.left:
                    player.flip = true;
                    player.anim(ctx, player.walkLeft, interval);
                break;
                case player.directions.right:
                    player.flip = false;
                    player.anim(ctx, player.walkRight, interval);
                break;
                case player.directions.up:
                    player.anim(ctx, player.walkUp, interval);
                break;
                case player.directions.down:
                    player.anim(ctx, player.walkDown, interval);
                break;

            }
            break;
        case player.states.attack:
            player.attack();
            break;
        case player.states.action:
            player.action();
            break;
        case player.states.damage:
            if(slimeArray[0].direction === slimeArray[0].directions.right){
                player.flip = true
            }else{
                player.flip = false
            }
            if(player.flip === true){
                player.anim(ctx, player.takeDamageFlip, interval);
            }else{
                player.anim(ctx, player.takeDamage, interval);
            }
            break;
        case player.states.dead:
            player.anim(ctx, player.deadAnim, interval);
            break;
        default:
            break;
    }

}

function slimeUpdate(){
    if (slimeArray.length > 0 &&
        slimeArray[0].x > 0 && 
        slimeArray[0].x < viewWidthPixel-heroSize/2 && 
        slimeArray[0].y > 0 && 
        slimeArray[0].y < viewHeightPixel-heroSize/2){

        if(slimeArray[0].state !== slimeArray[0].states.dead){
            if(slimeArray[0].walk === true && slimeArray[0].direction === slimeArray[0].directions.right){
                slimeArray[0].moveRight();
            }else if(slimeArray[0].walk === true && slimeArray[0].direction === slimeArray[0].directions.left){
                slimeArray[0].moveLeft();
            }else if(slimeArray[0].walk === true && slimeArray[0].direction === slimeArray[0].directions.up){
                slimeArray[0].moveUp();
            }else if(slimeArray[0].walk === true && slimeArray[0].direction === slimeArray[0].directions.down){
                slimeArray[0].moveDown();
            } 
            //Basic Enemy AI to move it around at random times
            if(Math.floor(Math.random()*100) === 50){
                if(slimeArray[0].walk === false &&
                    slimeArray[0].state !== slimeArray[0].states.damage){
                    slimeArray[0].walk = true;
                    let directions = ['right', 'left','up','down'];
                    let dirNum = Math.floor(Math.random()*4);
                    slimeArray[0].direction = slimeArray[0].directions[directions[dirNum]];
                }else{
                    slimeArray[0].completeWalk = true;
                }   
            }
        }
        switch(slimeArray[0].state){
            case slimeArray[0].states.idle:
                if(slimeArray[0].flip === true){
                    slimeArray[0].anim(ctx, slimeArray[0].idleFlip, interval);
                }else{
                    slimeArray[0].anim(ctx, slimeArray[0].idle, interval);
                }
                break;
            case slimeArray[0].states.walk:
                switch(slimeArray[0].direction){
                    case slimeArray[0].directions.left:
                        slimeArray[0].flip = true;
                        slimeArray[0].anim(ctx, slimeArray[0].walkLeft, interval);
                    break;
                    case slimeArray[0].directions.right:
                        slimeArray[0].flip = false;
                        slimeArray[0].anim(ctx, slimeArray[0].walkRight, interval);
                    break;
                    case slimeArray[0].directions.up:
                        slimeArray[0].anim(ctx, slimeArray[0].walkUp, interval);
                    break;
                    case slimeArray[0].directions.down:
                        slimeArray[0].anim(ctx, slimeArray[0].walkDown, interval);
                    break;

                }
                break;
            case slimeArray[0].states.attack:
                slimeArray[0].attack();
                break;
            case slimeArray[0].states.action:
                slimeArray[0].action();
                break;
            case slimeArray[0].states.damage:
                if(player.direction === player.directions.right){
                    slimeArray[0].flip = true
                }else{
                    slimeArray[0].flip = false
                }
                if(slimeArray[0].flip === true){
                        slimeArray[0].anim(ctx, slimeArray[0].takeDamageFlip, interval);
                }else{
                    slimeArray[0].anim(ctx, slimeArray[0].takeDamage, interval);
                }
                break;
            case slimeArray[0].states.dead:
                slimeArray[0].anim(ctx, slimeArray[0].deadAnim, interval);
                break;
            default:
                break;
        }
    }
}

function isPerformingAction(){
    if(player.state === player.states.attack ||
        player.state === player.state.action){
        return true;
    }
    return false;
}

function keyPressed(e){
    console.log("key pressed" + e.code);
    if(slimeArray.length > 0){
        if((e.code).toLowerCase() === 'numpad8'){
            if(slimeArray[0].walk === false ){
                slimeArray[0].walk = true;
                slimeArray[0].direction = slimeArray[0].directions.up;
            }
        }else if((e.code).toLowerCase() === 'numpad5'){
            if(slimeArray[0].walk === false){
                slimeArray[0].walk = true;
                slimeArray[0].direction = slimeArray[0].directions.down;
            }
        }else if((e.code).toLowerCase() === 'numpad4'){
            if(player.walk === false){
                slimeArray[0].walk = true;
                slimeArray[0].direction = slimeArray[0].directions.left;
            }
        }else if((e.code).toLowerCase() === 'numpad6'){
            if(slimeArray[0].walk === false){
                slimeArray[0].walk = true;
                slimeArray[0].direction = slimeArray[0].directions.right;
            }
        }else if((e.code).toLowerCase() === 'numpad3'){
            if(slimeArray[0].walk === false){
                slimeArray[0].state = slimeArray[0].states.attack
            }
        }
    }
    if(player.state !== player.states.dead){
        if((e.code).toLowerCase() === 'keyw'){
            if(player.walk === false && !isPerformingAction()){
                player.walk = true;
                player.direction = player.directions.up;
            }
        }else if((e.code).toLowerCase() === 'keys'){
            if(player.walk === false && !isPerformingAction()){
                player.walk = true;
                player.direction = player.directions.down;
            }
        }else if((e.code).toLowerCase() === 'keya'){
            if(player.walk === false && !isPerformingAction()){
                player.walk = true;
                player.direction = player.directions.left;
            }
        }else if((e.code).toLowerCase() === 'keyd'){
            if(player.walk === false && !isPerformingAction()){
                player.walk = true;
                player.direction = player.directions.right;
            }
        }else if((e.code).toLowerCase() === 'space'){
            if(player.walk === false && !isPerformingAction()){
                player.state = player.states.attack;
            }
        }else if((e.code).toLowerCase() === 'keye'){
            if(player.walk === false && !isPerformingAction()){
                player.state = player.states.action;
            }
        }
    }
}

function keyReleased(e){
    // console.log("key relased" + e.code);
    switch((e.code).toLowerCase()){
        case 'keyw':
            player.completeWalk = true;
            break;
        case 'keys':
            player.completeWalk = true;
            break;
        case 'keya':
            player.completeWalk = true;
            break;
        case 'keyd':
            player.completeWalk = true;
            break;
        default:
            console.log('default');
            break;
    }
}

document.addEventListener('keypress', keyPressed);
document.addEventListener('keyup', keyReleased);