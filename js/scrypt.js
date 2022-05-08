const enableAudioBtn = document.querySelector('#enableAudio');
const canvas = document.querySelector('#gameCanvas');
let numberOfSlimes = 0;
let mapDataRaw = null;
let mapDataRawLayer2 = null;
const slimeArray = [];
const slimeStartHP = 20;
const slimeStartAttack = 10;
const tileSize = 16;
const viewWidth = 30;
const viewHeight = 20
const scale = 2;
const viewWidthPixel = viewWidth*tileSize*scale;
const viewHeightPixel = viewHeight*tileSize*scale;
const heroSize = 48*scale;
const centerTilePos = ((tileSize*scale/2)-heroSize/2);
const worldWidth = viewWidth * 4;
const worldHeight = viewHeight * 4;
const startRowCol = {row:Math.floor(viewHeight/2),col:Math.floor(viewWidth/2)};
const mapSize = {width: worldWidth*tileSize*scale, height: worldHeight*tileSize*scale};
const worldRowCol = {row: 0, col:0};
canvas.setAttribute("height",(tileSize*scale)*viewHeight);
canvas.setAttribute("width",(tileSize*scale)*viewWidth);
const playerSpeed = (16*scale)/8;
const fps = 30;
let now;
let then = Date.now();
const interval = 1000/fps;
let delta;

const ctx = canvas.getContext('2d');
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
    mapDataImgLayer2.onload = function() {
        console.log('Image 2 one loaded')
        ctx.drawImage(mapDataImgLayer2,0,0);
        mapDataRawLayer2 = ctx.getImageData(0, 0, 120, 80);
        createMapData(mapDataRaw, mapData);
        createMapData(mapDataRawLayer2, mapDataLayer2);
    }
}
let player = null;
function startGame(){
    player = new Pawn("Hero",100, 0, 3, heroSpriteSheet, heroSpriteSheetFlip, startRowCol.row, startRowCol.col,playerSpeed);
    if(slimeArray.length > 0){
        for(let i = 0, size = slimeArray.length; i < size; i++){
            slimeArray.pop();
        }
    }
    worldRowCol.row = 0;
    worldRowCol.col = 0;
    createWorldMapLayer2(mapDataLayer2);
    createWorldMap(mapData);
    updateMapView();
    updateMapViewLayer2();
    draw();
    gameState = gameStates.start;
}


function getFrames(row, frames, size){
    let framesArray = [];
    for(let i = 0; i < frames.length; i++){
        framesArray.push([frames[i]*size,row*size, size, size]);
    }
    return framesArray;
}

function walkSlime(obj, speed){
    obj.state = obj.states.walk;
    if(obj.direction === obj.directions.up || obj.direction === obj.directions.down){
        obj.speedY = speed;
        obj.walkDistance += obj.speedY;
    }else if(obj.direction === obj.directions.left || obj.direction === obj.directions.right){
        obj.speedX = speed;
        obj.walkDistance += obj.speedX;
    }
    mapWorldLayer2[obj.mapViewRowCol.row][obj.mapViewRowCol.col].x = obj.x-centerTilePos;
    mapWorldLayer2[obj.mapViewRowCol.row][obj.mapViewRowCol.col].y = obj.y-centerTilePos;
    
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
        updateMapViewLayer2(worldRowCol.col,worldRowCol.row);
        obj.completeWalk = false;
        obj.walk = false;
        obj.state = obj.states.idle;
    }
}

function walk(obj, speed){
    obj.state = obj.states.walk;
    if(obj.direction === obj.directions.up || obj.direction === obj.directions.down){
        obj.speedY = speed;
        obj.walkDistance += obj.speedY;
    }else if(obj.direction === obj.directions.left || obj.direction === obj.directions.right){
        obj.speedX = speed;
        obj.walkDistance += obj.speedX;
    }

    if(obj.walkDistance != 0 && obj.walkDistance%(tileSize*scale+Math.abs(speed)) === 0){
        obj.walkDistance = 0;
        if(obj.direction === obj.directions.up || obj.direction === obj.directions.down){
            obj.speedY = 0;
            if(speed < 0){
                obj.mapWorldRowCol.row++;
                obj.posRowCol.row++;
                worldRowCol.row++;
            }else{
                obj.mapWorldRowCol.row--;
                obj.posRowCol.row--;
                worldRowCol.row--;  
            }
        }
        else if(obj.direction === obj.directions.left || obj.direction === obj.directions.right)
        {
            obj.speedX = 0;
            if(speed < 0){
                obj.mapWorldRowCol.col++;
                obj.posRowCol.col++;
                worldRowCol.col++;
            }else{
                obj.mapWorldRowCol.col--;
                obj.posRowCol.col--;
                worldRowCol.col--;  
            }
        }
        updateMapView(worldRowCol.col,worldRowCol.row);
        updateMapViewLayer2(worldRowCol.col,worldRowCol.row);
        if(obj.completeWalk === true){
            obj.completeWalk = false;
            obj.walk = false;
            obj.state = obj.states.idle;
        }
    }
}


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
        console.log(this.hp);
        if(this.hp < 0){
            this.hp = 0;
            this.state = this.states.dead;
        }
    };
    anim(ctx, data, interval){
        data.timeCounter += interval;
        if(data.timeCounter > data.animTime){
            data.timeCounter = 0;
            data.frame++
            if(data.frame === data.frames.length){ 
                if(this.state === this.states.attack ||
                    this.state === this.states.action ||
                    this.state === this.states.damage){
                    this.state = this.states.idle;
                }else if(this.state === this.states.dead){
                    this.x = -100;
                    this.y = -100;  
                    if(this.name === 'Slime'){
                        mapWorldLayer2[this.mapWorldRowCol.row][this.mapWorldRowCol.col].tile = tiles.nullTile;
                        mapWorldLayer2[this.mapWorldRowCol.row][this.mapWorldRowCol.col].type = tileType.floor;
                        slimeArray.splice(0,1);
                    }else{
                        gameState = gameStates.gameOver;
                    }
                        
                }
                this.performingAction = false;
                data.frame = 0;
            }
        }    

        if (this.flip === true){
            ctx.drawImage(this.imageFlip,data.frames[data.frame][0],data.frames[data.frame][1],data.frames[data.frame][2],data.frames[data.frame][3],this.x,this.y,heroSize,heroSize);
        }else{
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
    black: {row: 0, col:20},
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
const blockWalkItems = [tileType.wall, tileType.chest1, tileType.chest2, tileType.vase1,
                        tileType.door, tileType.slime]

function createWorldMapLayer2(data){
    if(mapWorldLayer2.length > 0){
        for(let i = 0, size = mapWorldLayer2.length; i < size; i++){
            mapWorldLayer2.pop();
        }
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
            if(i === 0 && j === 0){
                console.log(r);
                console.log(g);
                console.log(b);
            }
            if(r === 0 && g === 0 && b === 0){
                tile = tiles.nullTile;
                type = tileType.wall;
            }else if(r === 126 && g === 126 && b ===126){
                tile = tiles.nullTile;
                type = tileType.floor;
            }else if(r === 255 && g === 199 && b ===21){
                tile = tiles.chest1;
                type = tileType.chest1;
            }else if(r === 183 && g === 121 && b ===87){
                tile = tiles.vase1;
                type = tileType.vase1;
            }else if(r === 65 && g === 65 && b ===115){
                tile = tiles.slime;
                type = tileType.slime;
                slimeArray.push(new Pawn("Slime",slimeStartAttack+(numberOfSlimes), 0, slimeStartHP+(numberOfSlimes*2), slimeSpriteSheet,slimeSpriteSheetFlip, i,j,1));
                numberOfSlimes++;
            }else{
                tile = tiles.nullTile;
                type = tileType.wall;
            }
            tempArray.push({tile:tile,type:type,x:x,y:y});
        }
        mapWorldLayer2.push(tempArray);
    }
}


function createWorldMap(data){
    if(mapWorld.length > 0){
        for(let i = 0, size = mapWorld.length; i < size; i++){
            mapWorld.pop();
        }
    }
    console.log("map");
    let testColorCol = 0;
    let testColorRow = 0;
    
    console.log(data[testColorRow][testColorCol].r)
    console.log(data[testColorRow][testColorCol].g)
    console.log(data[testColorRow][testColorCol].b)
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
            if(r === 0 && g === 0 && b === 0){
                tile = tiles.black;
                type = tileType.wall;
            }else if(r === 254 && g === 126 && b === 126) {
                tile = tiles.wallLTL;
                type = tileType.wall;
            }else if(r === 126 && g === 66 && b === 66) {
                tile = tiles.wallLBL;
                type = tileType.wall;
            }else if(r === 127 && g === 255 && b === 127) {
                tile = tiles.wallLTR;
                type = tileType.wall;
            }else if(r === 6 && g === 255 && b === 4) {
                tile = tiles.wallLBR;
                type = tileType.wall;
            }else if(r === 255 && g === 255 && b === 127) {
                tile = tiles.wallCenterTop;
                type = tileType.wall;
            }else if(r === 254 && g === 0 && b === 0) {
                tile = tiles.wallCenterSides;
                type = tileType.wall;
            }else if(r === 126 && g === 126 && b === 0) {
                tile = tiles.wallSEB;
                type = tileType.wall;
            }else if(r === 0 && g === 0 && b === 255) {
                tile = tiles.doorV0;
                type = tileType.wall;
            }else if(r === 0 && g === 0 && b === 126) {
                tile = tiles.doorV1;
                type = tileType.wall;
            }
            else{
                tile = tiles.floorOneOne;
                type = tileType.floor;
            }
            tempArray.push({tile:tile,type:type,x:x,y:y});
        }
        mapWorld.push(tempArray);
    }
}

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
            }
        }
        if(mapWorld[nextRow][nexCol].type === tileType.floor){
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
        if(delta > interval){
            then = now - (delta % interval)
            ctx.clearRect(0,0,canvas.width, canvas.height);

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
    }else{

    }
      
}

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

            if(Math.floor(Math.random()*100) === 50){
                if(slimeArray[0].walk === false){
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