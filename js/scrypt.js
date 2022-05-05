var canvas = document.querySelector('#gameCanvas');
const tileSize = 16;
const viewWidth = 30;
const viewHeight = 20;
const scale = 2;
const worldWidth = viewWidth * 4;
const worldHeight = viewHeight * 4;
const mapSize = {width: worldWidth*tileSize*scale, height: worldHeight*tileSize*scale};
const worldRow = 0;
const worldCol = 0;
canvas.setAttribute("height",(tileSize*scale)*viewHeight);
canvas.setAttribute("width",(tileSize*scale)*viewWidth);

const canvasMiddle = {x:canvas.width/2, y:canvas.height/2}

const playerSpeed = 5;
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

const heroSize = 48;
let heroIdleCounter = 0;

const heroIdleTime = 100;
let heroIdleTimeCounter = 0;
heroIdle = [[0,0,heroSize, heroSize], 
            [heroSize,0,heroSize, heroSize],
            [heroSize*2,0,heroSize, heroSize],
            [heroSize,0,heroSize, heroSize]];
function getFrames(row, frames, size){
    let framesArray = [];
    for(let i = 0; i < frames.length; i++){
        framesArray.push([frames[i]*size,row*size, size, size]);
    }
    return framesArray;
}
console.log(getFrames(0,[0,1,2,1],48));

class Hero {
    constructor(hp, exp, attack, image, imageFlip){
        this.states = {
            idle: 'idle',
            walk: 'walk',
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
        this.direction = this.directions.left,
        this.x = canvasMiddle.x-(heroSize/2),
        this.y = canvasMiddle.y-(heroSize/2),
        this.worldPos = {x:mapSize.width/2, y:mapSize.height/2},
        this.speedX = 0,
        this.speedY = 0,
        this.image = image,
        this.imageFlip = imageFlip,
        this.flip = false;
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
            ctx.drawImage(this.imageFlip,data.frames[data.frame][0],data.frames[data.frame][1],data.frames[data.frame][2],data.frames[data.frame][3],this.x,this.y,heroSize*scale,heroSize*scale);
        }else{
            ctx.drawImage(this.image,data.frames[data.frame][0],data.frames[data.frame][1],data.frames[data.frame][2],data.frames[data.frame][3],this.x,this.y,heroSize*scale,heroSize*scale);
        }
        
    }
}

//=================== MAP ======================
//==============================================
//==============================================
const mapView = [];
const mapWorld = [];

for(let i = 0; i < worldHeight; i++){
    let tempArray = [];
    for(let j = 0; j < worldWidth; j++){
        let x = j*tileSize*scale;
        let y = i*tileSize*scale;
        if(i === 1){
            tempArray.push({row:2, col:0, x:x,y:y});
        }else if(j===1){
            tempArray.push({row:2, col:0, x:x,y:y});
        }else if(i === 10 && j === 10){
            tempArray.push({row:3, col:0, x:x,y:y});
        }else{
            tempArray.push({row:0, col:0,x:x,y:y});
        }
    }
    mapWorld.push(tempArray);
}

for(let i = 0; i < viewHeight; i++){
    mapView.push([]);
    for(let j = 0; j < viewWidth; j++){
        let row = i+1;
        let col = j+1;
        console.log("col " + col);
        let x = j*tileSize*scale;
        let y = i*tileSize*scale;
        console.log(mapWorld[row]);
        mapView[i].push(mapWorld[row][col]);
        mapView[i][j].x = x;
        mapView[i][j].y = y;
    } 
}

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
console.log(mapView);

const player = new Hero(100, 0, 3, heroSpriteSheet, heroSpriteSheetFlip);

function draw(){
    window.requestAnimationFrame(draw);
    now = Date.now();
    delta = now - then;
    if(delta > interval){
        then = now - (delta % interval)
        ctx.clearRect(0,0,canvas.width, canvas.height);
        for(let i = 0; i < mapView[0].length; i++){
            for(let j = 0; j < mapView.length; j++){
                if(player.state === player.states.walk){
                    mapView[j][i].x += player.speedX;
                    mapView[j][i].y += player.speedY; 
                }
                if(mapView[j][i].col !== null){
                    ctx.drawImage(tileMap,mapView[j][i].col*tileSize,mapView[j][i].row*tileSize,tileSize,tileSize,mapView[j][i].x,mapView[j][i].y,tileSize*scale,tileSize*scale);
                }
                
            }
        };

        if(player.speedX !== 0){
            player.worldPos.x += player.speedX;
            if(player.worldPos.x % 30 === 0){
                console.log("Move Map");
            }
            
        }
        if(player.speedY !== 0){
            player.worldPos.y += player.speedY;
            if(player.worldPos.y % 30 === 0){
                console.log("Move Map");
            }
        }
        if(player.speedX === 0 && player.speedY === 0){
            player.state = player.states.idle;
        }else if(player.speedX > 0){
            player.direction = player.directions.left;
        }else if(player.speedX < 0){
            player.direction = player.directions.right;
        }else if(player.speedY < 0){
            player.direction = player.directions.down;
        }else if(player.speedY > 0){
            player.direction = player.directions.up;
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
                console.log(player.direction);
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
    console.log("key pressed" + e.code);
    switch((e.code).toLowerCase()){
        case 'keyw':
            player.speedY = playerSpeed;
            player.state = player.states.walk;
            console.log("walkUp");
            break;
        case 'keys':
            player.speedY = playerSpeed*-1;
            player.state = player.states.walk;
            console.log("walkDown");
            break;
        case 'keya':
            player.speedX = playerSpeed;
            player.state = player.states.walk;
            console.log("walkLeft");
            break;
        case 'keyd':
            player.speedX = playerSpeed*-1;
            player.state = player.states.walk;
            console.log('walkRight');
            break;
        default:
            console.log('default');
            break;
    }
}

function keyReleased(e){
    console.log("key relased" + e.code);
    switch((e.code).toLowerCase()){
        case 'keyw':
            player.speedY = 0;
            break;
        case 'keys':
            player.speedY = 0;
            break;
        case 'keya':
            player.speedX = 0;
            break;
        case 'keyd':
            player.speedX = 0;
            break;
        default:
            console.log('default');
            break;
    }
}

document.addEventListener('keydown', keyPressed);
document.addEventListener('keyup', keyReleased);
