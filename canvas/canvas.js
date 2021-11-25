/* plan:
    tools:
        +-Line
        +-Rect
        +-RectFull
        -Circle
        -CircleFull
        -Triangle
        -Triangle Full
        -Text
        -TextBox
    options:
        +-Scale (change pixelSize)
        +-ScreenSize (1x1,1x2,2x2 ...)
        +-Grid toggle
        +-Undo
        +-Redo
        -Gamma Correction
        -Reference Image
    

    Drawing and shapes:
    Shapes will be stored in a table, each shape contains a color, type (line, rect...) and values (x,y,w,h)
    Each shape is drawn to the screen by converting it to canvas grid.

    output string:
    colors need to be in order of apearance, not grouping. Because if I do group screen.draw by color, there'll be issues where shapes appear where
    they weren't intended by the user
*/


window.addEventListener("load", () =>{


    
    const canvas = document.querySelector("#canvas");
    const ctx = canvas.getContext("2d");

    

    const scale = document.getElementById("scale")
    const grid_checkbox = document.getElementById("grid")
    const screen_select = document.getElementById("screen")
    const color_select = document.getElementById("color")

    const undo_button = document.getElementById("undo")
    const redo_button = document.getElementById("redo")
    const line_shape = document.getElementById("line")
    const rect_shape = document.getElementById("rect")
    const rectF_shape = document.getElementById("rectF")

    ctx.imageSmoothingEnabled = false;

    let pixelSize = 8

    let screenSizeW = 32
    let screenSizeH = 32
    
    let screenWidth = screenSizeW*pixelSize
    let screenHeight = screenSizeH*pixelSize
    
    canvas.width = screenSizeW*pixelSize;
    canvas.height = screenSizeH*pixelSize;


    
    
    
   
    
    //variables
    let startPixel = [];
    let endPixel = [];

    let redo_array = [];

    let mouseDown = false

    let tool = "line"
    let color = "#FFFFFF"
    let shapes = []; //[0]tool, [1]hex_color, [2,3,4,5]coordinates

    //grid
    function drawGrid() {
        if (grid_checkbox.checked) {
            ctx.lineWidth = 1;
            ctx.fillStyle = 'transparent;'
            ctx.strokeStyle = '#303030';
            for (var x = 0; x < screenWidth; x++) {
                for (var y = 0; y < screenHeight; y++) {
                    ctx.strokeRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
                }
            }
        } else {
            clearCanvas()
        }
            
    }
    drawGrid()

    function startPosition(e){
        mouseDown = true;

        startPixel = [Math.floor(e.offsetX/pixelSize), Math.floor(e.offsetY/pixelSize)];

        clearRedo()
        //console.log(startPixel);
        
    }
    
    function finishedPosition(e){
        mouseDown = false;

        endPixel = [Math.floor(e.offsetX/pixelSize), Math.floor(e.offsetY/pixelSize)];
        /* console.log(endPixel); */

        let x1 = startPixel[0];
        let y1 = startPixel[1];
        let x2 = endPixel[0];
        let y2 = endPixel[1];

        let pos = [];

        if (tool == "rect" || tool == "rectF") {
            if (x1 > x2 && y1 > y2) { //this is for making the top left pixel be the first one
                pos = [x2,y2,x1,y1]
            } else if (x1 < x2 && y1 < y2) {
                pos = [x1,y1,x2,y2]
            } else if (x1 < x2 && y1 > y2) {
                pos = [x1,y2,x2,y1]
            } else if (x1 > x2 && y1 < y2) {
                pos = [x2,y1,x1,y2]
            } else {
                pos = [x1,y1,x2,y2]
            }
        } else if (tool == "line") {
            if (x1 > x2 || y1 > y2) {
                pos = [x2,y2,x1,y1]
            } else {
                pos = [x1,y1,x2,y2]
            }
        } else {
            pos = [x1,y1,x2,y2]
        }
            

        if (tool == "line") {
            pushLine(pos[0],pos[1],pos[2],pos[3])
        } else if (tool == "rect") {
            pushRectF(pos[0],pos[1],pos[2],pos[3]) //drawRectF works for both types of rect
        } else if (tool == "rectF") {
            pushRectF(pos[0],pos[1],pos[2],pos[3])
        }
        
        draw(e);
        outputCode()
    }

    function pushLine(x1,y1,x2,y2) {
        ctx.fillStyle = color;

        let x = Math.floor(x1)
        let y = Math.floor(y1)
        let w = Math.floor(x2)
        let h = Math.floor(y2)

        console.log("line",color,x, y, w, h)

        shapes.push(tool,color,x, y, w, h)
    }

    function pushRectF(x1,y1,x2,y2) { //startX,Y,endX,Y
        ctx.fillStyle = color;

        let x = Math.floor(x1)
        let y = Math.floor(y1)
        let w = Math.floor(x2-x1)+1
        let h = Math.floor(y2-y1)+1

        console.log(tool,color,x, y, w, h)

        shapes.push(tool,color,x, y, w, h)
    }

    function draw(e) { 
        for (var i = 0; i < shapes.length; i += 6) { //[0]tool, [1]hex_color, [2,3,4,5]coordinates
            let s_tool = shapes[i+0];
            let s_color = shapes[i+1];
            let x = shapes[i+2];
            let y = shapes[i+3];
            let w = shapes[i+4];
            let h = shapes[i+5];

            if (s_tool == "line") {
                drawLine(s_color,x,y,w,h) //w,h are x2,y2
            } else if (s_tool == "rectF") {
                ctx.fillStyle = s_color;
                ctx.fillRect(x*pixelSize, y*pixelSize, w*pixelSize, h*pixelSize);
                ctx.fill()
            } else if (s_tool == "rect") {
                ctx.fillStyle = s_color;

                ctx.fillRect(x*pixelSize, y*pixelSize, w*pixelSize, pixelSize); //top left right 
                ctx.fillRect(x*pixelSize, (y+h-1)*pixelSize, w*pixelSize, pixelSize); //bottom left right 
                ctx.fillRect(x*pixelSize, y*pixelSize, pixelSize, h*pixelSize); //top left down
                ctx.fillRect((x+w-1)*pixelSize, y*pixelSize, pixelSize, h*pixelSize); //top right down

                ctx.fill()
            }
        }
        
        //ctx.fillRect(cursorPixel[0]*pixelSize, cursorPixel[1]*pixelSize, pixelSize, pixelSize);
    }

    

    

    //Event Listeners
    window.addEventListener("resize", resized)
    canvas.addEventListener("mousedown", startPosition);
    canvas.addEventListener("mouseup", finishedPosition);
    canvas.addEventListener("mousemove",cursor);

    //tools
    scale.addEventListener("change",changeScale);
    grid_checkbox.addEventListener("change",changeGrid);
    screen_select.addEventListener("change",changeScreenSize);
    color_select.addEventListener("change",changeColor);

    
    undo_button.addEventListener("click",undo);
    redo_button.addEventListener("click",redo);
    line_shape.addEventListener("click",changeTool);
    rect_shape.addEventListener("click",changeTool);
    rectF_shape.addEventListener("click",changeTool);

    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key === 'z') {
            undo();
        } else if (event.ctrlKey && event.key === 'y') {
            redo();
        }
    });

    function drawLine(color, x1,y1,x2,y2) {
        ctx.fillStyle = color;

        let point1 = [x1,y1]
        let point2 = [x2,y2]
        let the_line = line(point1, point2)
        for (let step = 0; step < the_line.length; step++) {
            let x = the_line[step][0]
            let y = the_line[step][1]
            ctx.fillRect(x*pixelSize, y*pixelSize, pixelSize, pixelSize);
        }
    }
    
    let lastPixel = [0,0];
    function cursor(e) {
        draw(e)


        
        ctx.clearRect((lastPixel[0]*pixelSize)+1, (lastPixel[1]*pixelSize)+1, pixelSize-2, pixelSize-2);

        let pixel = [Math.floor((e.offsetX)/pixelSize), Math.floor((e.offsetY)/pixelSize)];

        ctx.fillStyle = "red";
        ctx.fillRect((pixel[0]*pixelSize)+1, (pixel[1]*pixelSize)+1, pixelSize-2, pixelSize-2);

        /* let s_tool = shapes[i+0];
        let s_color = shapes[i+1];
        let x = shapes[i+2];
        let y = shapes[i+3];
        let w = shapes[i+4];
        let h = shapes[i+5];

        if (mouseDown == true) {
            if (tool == "line") {
                drawLine(s_color,x,y,w,h) //w,h are x2,y2
            } else if (tool == "rectF") {
                ctx.fillStyle = s_color;
                ctx.fillRect(x*pixelSize, y*pixelSize, w*pixelSize, h*pixelSize);
                ctx.fill()
            } else if (tool == "rect") {
                ctx.fillStyle = s_color;
    
                ctx.fillRect(x*pixelSize, y*pixelSize, w*pixelSize, pixelSize); //top left right 
                ctx.fillRect(x*pixelSize, (y+h-1)*pixelSize, w*pixelSize, pixelSize); //bottom left right 
                ctx.fillRect(x*pixelSize, y*pixelSize, pixelSize, h*pixelSize); //top left down
                ctx.fillRect((x+w-1)*pixelSize, y*pixelSize, pixelSize, h*pixelSize); //top right down
    
                ctx.fill()
            }
        } */
        

        //console.log(pixel)

        lastPixel = pixel
        
    }


    function changeScale() {
        pixelSize = scale.value

        canvas.width = screenSizeW*pixelSize;
        canvas.height = screenSizeH*pixelSize;

        drawGrid()
        draw()
    }

    function changeGrid() {
        drawGrid()
        draw()
    }

    function changeScreenSize(e) {
        //console.log(e.target.value)
        let sizeSelect = e.target.value
        let w = sizeSelect.slice(0,1)
        let h = sizeSelect.slice(2,3)

        screenSizeW = 32*w
        screenSizeH = 32*h

        canvas.width = screenSizeW*pixelSize;
        canvas.height = screenSizeH*pixelSize;

        drawGrid()
        draw()
    }

    function changeColor(e) {
        color = e.target.value
    }

    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function changeTool(e) {

        tool = e.target.id

        document.getElementById("line").style.backgroundColor = "#EFEFEF"
        document.getElementById("rect").style.backgroundColor = "#EFEFEF"
        document.getElementById("rectF").style.backgroundColor = "#EFEFEF"

        if (tool == "line") {
            document.getElementById("line").style.backgroundColor = "#ac3232"
        } else if (tool == "rect") {
            document.getElementById("rect").style.backgroundColor = "#ac3232"
        } else if (tool == "rectF") {
            document.getElementById("rectF").style.backgroundColor = "#ac3232"
        }

        

    }

    function undo() {
        if (shapes.length) {
            let len = shapes.length;
            redo_array.push(shapes[len-6],shapes[len-5],shapes[len-4],shapes[len-3],shapes[len-2],shapes[len-1])
            shapes.splice(len - 6, 6);
            console.log(shapes, redo_array)
            clearCanvas();
            outputCode()
            drawGrid()
            draw();
        }
    }

    function redo() {
        if (redo_array.length) {
            let len = redo_array.length;
            shapes.push(redo_array[len-6],redo_array[len-5],redo_array[len-4],redo_array[len-3],redo_array[len-2],redo_array[len-1])
            redo_array.splice(redo_array.length - 6, 6);
            clearCanvas();
            outputCode()
            drawGrid()
            draw();
        }
    }

    function clearRedo() {
        redo_array = [];
    }

    function outputCode() {
        //[0]tool, [1]hex_color, [2,3,4,5]coordinates

        //SW screen.draw funky inconsistencies:
        //Lines don't fill the end pixel. Kinda fixed by adding 0.25
        //rect goes one pixel long on h and w. Fixed by substracting 1
        let output = document.getElementById("outputCode")
        
        let final_string = "";
        for (let i = 0; i < shapes.length; i += 6) {
            let tool_string = "";
            let x1 = shapes[i+2]
            let y1 = shapes[i+3]
            let x2 = shapes[i+4]
            let y2 = shapes[i+5]

            if (shapes[i+0] == "line") {
                tool_string = " screen.drawLine(" + x1 + "," + y1 + "," + (x2+0.25) + "," + (y2+0.25) + ")"
            } else if (shapes[i+0] == "rect") {
                tool_string = " screen.drawRect(" + x1 + "," + y1 + "," + (x2-1) + "," + (y2-1) + ")"
            } else if (shapes[i+0] == "rectF") {
                tool_string = " screen.drawRectF(" + x1 + "," + y1 + "," + x2 + "," + y2 + ")"
            }
            final_string = final_string + tool_string + "<br />"
        }
        console.log(final_string)
        output.innerHTML = final_string
    }

});

function resized() {
    let zoom = (( window.outerWidth - 10 ) / window.innerWidth) * 100;
    console.log("zoom", zoom)
    var offsets = canvas.getBoundingClientRect();
    console.log("top", offsets.top)
    console.log("left", offsets.left)
}

//helper functions for line drawing
//https://www.redblobgames.com/grids/line-drawing.html

function line(p0, p1) {
    let points = [];
    let N = diagonal_distance(p0, p1);
    for (let step = 0; step <= N; step++) {
        let t = N === 0? 0.0 : step / N;
        points.push(round_point(lerp_point(p0, p1, t)));
    }
    return points;
}

function diagonal_distance(p0, p1) {
    let dx = p1[0] - p0[0];
    let dy = p1[1] - p0[1];
    return Math.max(Math.abs(dx), Math.abs(dy));
}

function round_point(p) {
    return [Math.round(p[0]), Math.round(p[1])];
}

function lerp_point(p0, p1, t) {
    return [lerp(p0[0], p1[0], t),lerp(p0[1], p1[1], t)];
}

function lerp(start, end, t) {
    return start + t * (end-start);
}


