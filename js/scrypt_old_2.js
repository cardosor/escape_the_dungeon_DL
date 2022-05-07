var canvas = document.querySelector('#gameCanvas');
const tileSize = 16;
const viewWidth = 30;
const viewHeight = 15;
const scale = 2;
const worldWidth = viewWidth * 4;
const worldHeight = viewHeight * 4;
const startRowCol = {row:Math.floor(viewHeight/2),col:Math.floor(viewWidth/2)};
const mapSize = {width: worldWidth*tileSize*scale, height: worldHeight*tileSize*scale};
const worldRowCol = {row: 0, col:0};
const walkedDistance = {x:0, y:0};
const walkedDistance2 = {x:0, y:0};
canvas.setAttribute("height",(tileSize*scale)*viewHeight);
canvas.setAttribute("width",(tileSize*scale)*viewWidth);

const canvasMiddle = {x:canvas.width/2, y:canvas.height/2}

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

const heroSize = 48*scale;


function getFrames(row, frames, size){
    let framesArray = [];
    for(let i = 0; i < frames.length; i++){
        framesArray.push([frames[i]*size,row*size, size, size]);
    }
    return framesArray;
}

class Hero {
    constructor(hp, exp, attack, image, imageFlip){
        this.states = {
            idle: 'idle',
            walk: 'walk',
            stop: 'stop',
            attack:'attack',
            hit: 'hit'
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
        this.worldPos = {x:startRowCol.row*tileSize*scale, y:startRowCol.col*tileSize*scale},
        this.posRowCol = {row: startRowCol.row, col: startRowCol.col},
        this.x =this.posRowCol.col*tileSize*scale+(tileSize*scale/2-heroSize/scale), //15*tileSize*scale,
        this.y =this.posRowCol.row*tileSize*scale+(tileSize*scale/4 -heroSize/scale), //10*tileSize*scale,
        this.speedX = 0,
        this.speedY = 0,
        this.image = image,
        this.imageFlip = imageFlip,
        this.flip = false,
        this.hp = hp,
        this.exp = exp,
        this.attack = attack,
        this.sizePixel = 48,
        this.idle = {timeCounter:0, animTime:100, frame:0, frames: getFrames(0,[0,1,2,1],48)},
        this.idleFlip = {timeCounter:0, animTime:100, frame:0, frames: getFrames(0,[3,2,1,2],48)},
        this.action = {timeCounter:0, animTime:100, frame:0, frames: getFrames(1,[0,1,2,1],48)},
        this.walkDown = {timeCounter:0, animTime:100, frame:0, frames: getFrames(2,[0,1,2,3],48)},
        this.walkLeft = {timeCounter:0, animTime:100, frame:0, frames: getFrames(3,[3,2,1,0],48)},
        this.walkRight = {timeCounter:0, animTime:100, frame:0, frames: getFrames(3,[0,1,2,3],48)},
        this.walkUp = {timeCounter:0, animTime:100, frame:0, frames: getFrames(4,[0,1,2,3],48)}
    };
    anim(ctx, data, interval){
        data.timeCounter += interval;
        if(data.timeCounter > data.animTime){
            data.timeCounter = 0;
            data.frame++
            if(data.frame === data.frames.length){
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
        
    }
}

const player = new Hero(100, 0, 3, heroSpriteSheet, heroSpriteSheetFlip);

//=================== MAP ======================
//==============================================
//==============================================
const mapView = [];
const mapWorld = [];
const tiles = {
    black: {row: 0, col:20},
    floorOneOne : {row:0, col:0},
    void: {row:0, col:3}
};

const tileType = {
    wall: "wall",
    floor: "floor",
    void: "void"
}

for(let i = 0; i < worldHeight; i++){
    let tempArray = [];
    for(let j = 0; j < worldWidth; j++){
        let x = j*tileSize*scale;
        let y = i*tileSize*scale;
        if(i === 10 && j === 15){
            tempArray.push({tile:tiles.floorOneOne,type:tileType.floor,x:x,y:y});
        }else if(i < 10 || i > worldHeight - 10){
            tempArray.push({tile:tiles.void,type:tileType.wall,x:x,y:y});
        }else if(j < 15 || j > worldWidth -15){
            tempArray.push({tile:tiles.void, type:tileType.wall,x:x,y:y});
        }else if(i === 11 && j === 17){
            tempArray.push({tile:tiles.void,type:tileType.wall, x:x,y:y});
        }else if(i === 15 && j === 19){
            tempArray.push({tile:tiles.void,type:tileType.wall, x:x,y:y});
        }else{
            tempArray.push({tile:tiles.floorOneOne,type:tileType.floor,x:x,y:y});
        }
    }
    mapWorld.push(tempArray);
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
updateMapView();


// for(let i = 0; i < viewHeight; i++){
//     let tempArray = [];
//     for(let j = 0; j < viewWidth; j++){
//         let x = j*tileSize*scale;
//         let y = i*tileSize*scale;
//         if(i === 3 && j === 3){
//             tempArray.push({row:3, col:0, x:x,y:y});
//         }else{
//             tempArray.push({row:0, col:0,x:x,y:y});
//         }
//     } 
//     mapView.push(tempArray);
// }

function checkNextTile(){
    let nextRow = player.posRowCol.row;
    let nexCol = player.posRowCol.col;

    if(player.direction === player.directions.right){
        nexCol+=1;
    }else if(player.direction === player.directions.left){
        nexCol-=1;
    }else if(player.direction === player.directions.up){
        nextRow-=1;
    }else if(player.direction === player.directions.down){
        nextRow+=1;
    }

    if(mapWorld[nextRow][nexCol].type === tileType.wall){
        if(player.direction === player.directions.left){
            player.speedX-=playerSpeed;
        }else if(player.direction === player.directions.right){
            player.speedX+=playerSpeed;
        }else if(player.direction === player.directions.up){
            player.speedY-=playerSpeed;
        }else if(player.direction === player.directions.down){
            player.speedY+=playerSpeed;
        }
    }
}

function canWalk(){
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
    console.log(mapView[nextRow][nexCol].type)

    if(mapView[nextRow][nexCol].type === tileType.floor){
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

        if(player.state === player.states.walk){
           //checkNextTile();
        }

        if(player.walk === true && player.direction === player.directions.right){
            player.moveRight();
        }else if(player.walk === true && player.direction === player.directions.left){
            player.moveLeft();
        }else if(player.walk === true && player.direction === player.directions.up){
            player.moveUp();
        }else if(player.walk === true && player.direction === player.directions.down){
            player.moveDown();
        }
        // if(player.state === player.states.walk){
        //     mapView[0][0].x += player.speedX;
        //     mapView[0][1].x += player.speedX;
        //     mapView[0][2].x += player.speedX;
        //     mapView[0][3].x += player.speedX;
        // }
        for(let i = 0; i < mapView[0].length; i++){
            for(let j = 0; j < mapView.length; j++){
                if(player.state === player.states.walk){
                    mapView[j][i].x += player.speedX;
                    mapView[j][i].y += player.speedY;  
               }
                if(mapView[j][i].col !== null){
                    ctx.drawImage(tileMap,mapView[j][i].tile.col*tileSize,mapView[j][i].tile.row*tileSize,tileSize,tileSize,mapView[j][i].x,mapView[j][i].y,tileSize*scale,tileSize*scale);
                }
                
            }
        }

        
        

        switch(player.state){
            case player.states.idle:
                if(player.flip === true){
                    player.anim(ctx, player.idleFlip, interval, false);
                }else{
                    player.anim(ctx, player.idle, interval, false);
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
                        player.anim(ctx, player.walkRight, interval, false);
                    break;
                    case player.directions.up:
                        player.anim(ctx, player.walkUp, interval, false);
                    break;
                    case player.directions.down:
                        player.anim(ctx, player.walkDown, interval, false);
                    break;

                }
                break;
            default:
                break;
        }
        
    }  
}

draw();

function keyPressed(e){
    //console.log("key pressed" + e.code);
    if((e.code).toLowerCase() === 'keyw'){
        if(player.walk === false){
            player.walk = true;
            player.direction = player.directions.up;
        }
    }else if((e.code).toLowerCase() === 'keys'){
        if(player.walk === false){
            player.walk = true;
            player.direction = player.directions.down;
        }
    }else if((e.code).toLowerCase() === 'keya'){
        if(player.walk === false){
            player.walk = true;
            player.direction = player.directions.left;
        }
    }else if((e.code).toLowerCase() === 'keyd'){
        if(player.walk === false){
            player.walk = true;
            player.direction = player.directions.right;
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
