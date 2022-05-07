var canvas = document.querySelector('#gameCanvas');
const tileSize = 16;
const viewWidth = 30;
const viewHeight = 20;
const scale = 2;
const heroSize = 48*scale;
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

const heroSpriteSheet = new Image(192, 528);
heroSpriteSheet.src = 'img/chara_hero.png';
const heroSpriteSheetFlip = new Image(192, 528);
heroSpriteSheetFlip.src = 'img/chara_hero_flip.png';

const tileMap = new Image(320,384);
tileMap.src = 'img/tiles_dungeon.png';

const mapDataImg = new Image(120,80);
mapDataImg.src = 'img/map.png';
const mapDataImgLayer2 = new Image(120,80);
mapDataImgLayer2.src = 'img/map1.png';
const mapData = [[]];
const mapDataLayer2 = [[]];

mapDataImg.onload = function() {
    let mapDataRaw = null;
    ctx.drawImage(mapDataImg,0,0);
    mapDataRaw = ctx.getImageData(0, 0, 120, 80);
    let row = 0;
    for (var i = 0, n = mapDataRaw.data.length; i < n; i += 4) {
        if(i !== 0 && i%480 === 0){
            mapData.push([]);
            row++;
        }
        let r = mapDataRaw.data[i];
        let g = mapDataRaw.data[i+1];
        let b = mapDataRaw.data[i+2];
        mapData[row].push({r:r, g:g, b:b});
    }
    mapDataImgLayer2.onload = function() {
        let mapDataRawLayer2 = null;
        ctx.drawImage(mapDataImgLayer2,0,0);
        mapDataRawLayer2 = ctx.getImageData(0, 0, 120, 80);
        let row = 0;
        for (var i = 0, n = mapDataRawLayer2.data.length; i < n; i += 4) {
            if(i !== 0 && i%480 === 0){
                mapDataLayer2.push([]);
                row++;
            }
            let r = mapDataRawLayer2.data[i];
            let g = mapDataRawLayer2.data[i+1];
            let b = mapDataRawLayer2.data[i+2];
            mapDataLayer2[row].push({r:r, g:g, b:b});
        }
        createWorldMapLayer2(mapDataLayer2);
        createWorldMap(mapData);
        updateMapView();
        updateMapViewLayer2();
        draw();
    }
    
}


function getFrames(row, frames, size){
    let framesArray = [];
    for(let i = 0; i < frames.length; i++){
        framesArray.push([frames[i]*size,row*size, size, size]);
    }
    return framesArray;
}

class Hero {
    constructor(hp, exp, attackPoints, image, imageFlip){
        this.states = {
            idle: 'idle',
            walk: 'walk',
            stop: 'stop',
            attack:'attack',
            hit: 'hit',
            action: 'action'
        }
        this.state = this.states.idle,
        this.directions = {
            left: 'left',
            right: 'right',
            up: 'up',
            down: 'down'
        }
        this.direction = this.directions.right,
        this.walk = false,
        this.completeWalk = false,
        this.walkedDistance = {x:0, y:0},
        this.posRowCol = {row: startRowCol.row, col: startRowCol.col},
        this.x =this.posRowCol.col*tileSize*scale+(tileSize*scale/2-heroSize/2), //15*tileSize*scale,
        this.y =this.posRowCol.row*tileSize*scale+(tileSize*scale/4 -heroSize/2), //10*tileSize*scale,
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
        this.attackLeft = {timeCounter:0, animTime:100, frame:0, frames: getFrames(6,[3,2,1,0],48)}
    };
    anim(ctx, data, interval){
        data.timeCounter += interval;
        if(data.timeCounter > data.animTime){
            data.timeCounter = 0;
            data.frame++
            if(data.frame === data.frames.length){ 
                if(player.state === player.states.attack ||
                    player.state === player.states.action){
                    player.state = player.states.idle;
                }
                data.frame = 0;
            }
        }
        console.log(this.flip);
        if (this.flip === true){
            ctx.drawImage(this.imageFlip,data.frames[data.frame][0],data.frames[data.frame][1],data.frames[data.frame][2],data.frames[data.frame][3],this.x,this.y,heroSize,heroSize);
        }else{
            ctx.drawImage(this.image,data.frames[data.frame][0],data.frames[data.frame][1],data.frames[data.frame][2],data.frames[data.frame][3],this.x,this.y,heroSize,heroSize);
        }
    };
    moveDown(){
        if(canWalk()){
            player.state = player.states.walk;
            player.speedY = playerSpeed*-1;
            player.walkedDistance.y += player.speedY;
            if(player.walkedDistance.y != 0 && player.walkedDistance.y%(tileSize*scale-player.speedY) ===0){
                player.walkedDistance.y = 0;
                player.speedY = 0;
                player.posRowCol.row++;
                worldRowCol.row++;
                if(player.posRowCol.row > 9){
                    updateMapView(worldRowCol.col,worldRowCol.row);
                    updateMapViewLayer2(worldRowCol.col,worldRowCol.row);
                }
                if(player.completeWalk === true){
                    player.completeWalk = false;
                    player.walk = false;
                    player.state = player.states.idle;
                }
            }
        }else{
                player.completeWalk = false;
                player.walk = false;
                player.state = player.states.idle;
        }

    };
    moveUp(){
        if(canWalk()){
            player.state = player.states.walk;
            player.speedY = playerSpeed;
            player.walkedDistance.y += player.speedY;
            if(player.walkedDistance.y != 0 && player.walkedDistance.y%(tileSize*scale+player.speedY) ===0){
                player.walkedDistance.y = 0;
                player.speedY = 0;
                player.posRowCol.row--;
                worldRowCol.row--;
                if(player.posRowCol.row > 9){
                    updateMapView(worldRowCol.col,worldRowCol.row);
                    updateMapViewLayer2(worldRowCol.col,worldRowCol.row);
                } 
                if(player.completeWalk === true){
                    player.completeWalk = false;
                    player.walk = false;
                    player.state = player.states.idle;
                }
            }
        }else{
            player.completeWalk = false;
            player.walk = false;
            player.state = player.states.idle;
        }
    };
    moveLeft(){
        if(canWalk()){
            player.state = player.states.walk;
            player.speedX = playerSpeed;
            player.walkedDistance.x += player.speedX;
            if(player.walkedDistance.x != 0 && player.walkedDistance.x%(tileSize*scale+player.speedX) ===0){
                player.walkedDistance.x = 0;
                player.speedX = 0;
                player.posRowCol.col--;
                worldRowCol.col--;
                if(player.posRowCol.col > 14){
                    updateMapView(worldRowCol.col,worldRowCol.row);
                    updateMapViewLayer2(worldRowCol.col,worldRowCol.row);
                }      
                if(player.completeWalk === true){
                    player.completeWalk = false;
                    player.walk = false;
                    player.state = player.states.idle;
                }
            }
        }else{
            player.walk = false;
            player.state = player.states.idle;
        }
    };
    moveRight(){
        if(canWalk()){
            player.state = player.states.walk;
            player.speedX = playerSpeed*-1;
            player.walkedDistance.x += player.speedX;
            if(player.walkedDistance.x != 0 && player.walkedDistance.x%(tileSize*scale-player.speedX) ===0){
                player.walkedDistance.x = 0;
                player.speedX = 0;
                player.posRowCol.col++;
                worldRowCol.col++;
                if(player.posRowCol.col > 14){
                    updateMapView(worldRowCol.col,worldRowCol.row);
                    updateMapViewLayer2(worldRowCol.col,worldRowCol.row);
                } 
                if(player.completeWalk === true){
                    player.completeWalk = false;
                    player.walk = false;
                    player.state = player.states.idle;
                }
                
            }
        }else{
            player.walk = false;
            player.state = player.states.idle;
        }
        
    };
    attack(){
        checkAction();
        if(player.direction === player.directions.up){
            this.anim(ctx, this.attackUp, interval);
        }else if(player.direction === player.directions.down){
            this.anim(ctx, this.attackDown, interval);
        }else if(player.direction === player.directions.left){
            this.anim(ctx, this.attackLeft, interval);
        }else if(player.direction === player.directions.right){
            this.anim(ctx, this.attackRight, interval);
        }
    };
    action(){
        checkAction();
        if(player.flip === true){
            this.anim(ctx, this.actionAnimFlip, interval);
        }else{
            this.anim(ctx, this.actionAnim, interval);
        }
        
    }
}

const player = new Hero(100, 0, 3, heroSpriteSheet, heroSpriteSheetFlip);

//=================== MAP ======================
//==============================================
//==============================================
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
};

const tileType = {
    wall: "wall",
    floor: "floor",
    void: "void",
    door: "door",
    chest1: "chest1",
    chest2: "chest2",
    vase1: "vase1", // original vase
    vase2: "vase2" // broken vase
}
const blockWalkItems = [tileType.wall, tileType.chest1, tileType.chest2, tileType.vase1,
                        tileType.door]

function createWorldMapLayer2(data){
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
                type = null;
            }else if(r === 255 && g === 199 && b ===21){
                tile = tiles.chest1;
                type = tileType.chest1;
            }else if(r === 183 && g === 121 && b ===87){
                tile = tiles.vase1;
                type = tileType.vase1;
            }
            tempArray.push({tile:tile,type:type,x:x,y:y});
        }
        mapWorldLayer2.push(tempArray);
    }
}


function createWorldMap(data){
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
            mapViewLayer2[i][j].x = x;
            mapViewLayer2[i][j].y = y;
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
    console.log(player.direction);
    console.log(mapViewLayer2[nextRow][nexCol])
    console.log(mapViewLayer2[nextRow][nexCol].tile)
    if(player.state === player.states.attack){
        if(mapViewLayer2[nextRow][nexCol].type === tileType.vase1){
            mapViewLayer2[nextRow][nexCol].tile = tiles.vase2;
            mapViewLayer2[nextRow][nexCol].type = tileType.vase2;
        }
    }else if(player.state === player.states.action){
        if(mapViewLayer2[nextRow][nexCol].type === tileType.chest1){
            mapViewLayer2[nextRow][nexCol].tile = tiles.chest2;
            mapViewLayer2[nextRow][nexCol].type = tileType.chest2;
        }
    }
    

    if(mapViewLayer2[nextRow][nexCol].type === tileType.floor){
        return true;
    }else{
        return false;
    }
}

function canWalk(){
    let nextRow = 10;
    let nexCol = 15;
    if(player.direction === player.directions.right){
        if(player.flip == true){
            player.flip = false;
            player.anim(ctx, player.idle, interval);
        }
        nexCol+=1;
    }else if(player.direction === player.directions.left){
        if(player.flip == false){
            player.flip = true;
            player.anim(ctx, player.idleFlip, interval);
        }
        
        nexCol-=1;
    }else if(player.direction === player.directions.up){
        nextRow-=1;
    }else if(player.direction === player.directions.down){
        nextRow+=1;
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
        for(let i = 0; i < mapViewLayer2.length; i++){
            for(let j = 0; j < mapViewLayer2[0].length; j++){
                if(player.state === player.states.walk){
                    mapViewLayer2[i][j].x += player.speedX;
                    mapViewLayer2[i][j].y += player.speedY;  
               }
                if(mapViewLayer2[i][j].tile.col !== null){
                    ctx.drawImage(tileMap,mapViewLayer2[i][j].tile.col*tileSize,mapViewLayer2[i][j].tile.row*tileSize,tileSize,tileSize,mapView[i][j].x,mapViewLayer2[i][j].y,tileSize*scale,tileSize*scale);
                    
                }
            }
        }     
        

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
    //console.log("key pressed" + e.code);
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

function keyReleased(e){
    console.log("key relased" + e.code);
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