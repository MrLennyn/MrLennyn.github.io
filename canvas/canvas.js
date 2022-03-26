/* plan:
    tools:
        +-Line
        +-Rect
        +-RectFull
        +-Triangle
        +-TriangleFull
        -Circle
        -CircleFull
        -Text
        -TextBox
    options:
        +-Scale (change pixelSize)
        +-ScreenSize (1x1,1x2,2x2 ...)
        +-Grid toggle
        +-Undo
        +-Redo
        +-Gamma Correction
        +-compact drawing: sc = setColor()
        +-Reference Image
        +-funtion mode: make it do +x and +y
    

    Drawing and shapes:
    Shapes will be stored in a table, each shape contains a color, type (line, rect...) and values (x,y,w,h)
    Each shape is drawn to the screen by converting it to canvas grid.

    output string:
    colors need to be in order of apearance, not grouping. Because if I do group screen.draw by color, there'll be issues where shapes appear where
    they weren't intended by the user
*/

/* bugs: rectF when drawing up will be 1 short */

window.addEventListener("load", () =>{


    
    const canvas = document.querySelector("#canvas");
    const ctx = canvas.getContext("2d");

    const ref_img = document.getElementById("refimage")

    const scale = document.getElementById("scale")
    const grid_checkbox = document.getElementById("grid")
    const screen_select = document.getElementById("screen")
    const color_select = document.getElementById("color")

    const undo_button = document.getElementById("undo")
    const redo_button = document.getElementById("redo")
    const line_shape = document.getElementById("line")
    const rect_shape = document.getElementById("rect")
    const rectF_shape = document.getElementById("rectF")
    const triangle_shape = document.getElementById("triangle")
    const triangleF_shape = document.getElementById("triangleF")
    const circle_shape = document.getElementById("circle")
    const circleF_shape = document.getElementById("circleF")
    const text_shape = document.getElementById("text")
    const eraser = document.getElementById("eraser")

    const copy_button = document.getElementById("copy")
    const color_fix = document.getElementById("gamma")
    const compact = document.getElementById("compact")
    const function_mode = document.getElementById("function mode")
    const shapeF_fix = document.getElementById("shapeF fix")
    const output = document.getElementById("outputCode")
    const char_count = document.getElementById("char_count_number")

    const position_indicator = document.getElementById("position")

    const inputTextBox = document.getElementById("inputText")

    ctx.imageSmoothingEnabled = false;

    let pixelSize = 8

    let screenSizeW = 32
    let screenSizeH = 32
    
    let screenWidth = screenSizeW*pixelSize
    let screenHeight = screenSizeH*pixelSize
    
    canvas.width = screenSizeW*pixelSize;
    canvas.height = screenSizeH*pixelSize;

    function_mode.checked = false
    
    
    
   
    
    //variables
    let startPixel = [];
    let endPixel = [];

    let mouseDown = false
    let cursorColor = "FF0000"

    let redo_array = [];
    let eraser_array = [];

    let tool = "line"
    let color = "#FFFFFF"
    shapes = []; //[0]tool, [1]hex_color, [2,3,4,5]coordinates ...

    let last_line = [0,0,0,0];
    let last_rectF = [0,0,0,0];
    let last_rect = [0,0,0,0];
    let last_triangle = [null,null,null,null,null,null]

    let triangle_mouse = [null,null,null,null,null,null]

    inputTextActive = false


    //grid
    function drawGrid() {
        if (grid_checkbox.checked) {
            ctx.fillStyle = '#303030';
            
            for (var x = 0; x < screenWidth; x++) {
                ctx.fillRect(x * pixelSize, 0, 2 , canvas.height)
            }
            for (var y = 0; y < screenHeight; y++) {
                ctx.fillRect(0, y * pixelSize, canvas.width , 2)
            }

        } else {
            //clearCanvas()
        }
            
    }
    drawGrid()

    function startPosition(e){

        last_line = [0,0,0,0];
        last_rectF = [0,0,0,0];

        startPixel = [Math.floor(e.offsetX/pixelSize), Math.floor(e.offsetY/pixelSize)];

        mouseDown = true;

        clearRedo()

        if (tool != "eraser") {
            eraser_array = [];
        }

        if (tool == "triangle" || tool == "triangleF") { //handles both triangle and triangleF
            if (triangle_mouse[0] == null && triangle_mouse[1] == null) {
                triangle_mouse[0] = startPixel[0]
                triangle_mouse[1] = startPixel[1]
            } else if (triangle_mouse[2] == null && triangle_mouse[3] == null) {
                triangle_mouse[2] = startPixel[0]
                triangle_mouse[3] = startPixel[1]
            } else if (triangle_mouse[4] == null && triangle_mouse[5] == null) {
                triangle_mouse[4] = startPixel[0]
                triangle_mouse[5] = startPixel[1]

                pushTriangle(triangle_mouse[0],triangle_mouse[1],triangle_mouse[2],triangle_mouse[3],triangle_mouse[4],triangle_mouse[5],)

                triangle_mouse = [null,null,null,null,null,null]
            }
        } else if (tool == "text") {
            
            if (!inputTextActive) {
                inputTextPos = startPixel
                inputTextActive = true

                let ctxOffsets = canvas.getBoundingClientRect();
                inputTextBox.style.position = 'fixed'
                inputTextBox.style.display = 'block'
                inputTextBox.style.top = (e.offsetY + ctxOffsets.top) + 'px'
                inputTextBox.style.left = (e.offsetX + ctxOffsets.left) + 'px'
                //this gotta be here otherwise focus() won't do the thing
                window.setTimeout(function() {document.getElementById("inputText").focus()},0)
                
            } else {
                inputTextEntered()
            }
            
        } else {
            triangle_mouse = [null,null,null,null,null,null]
        }
        
    }
    
    function finishedPosition(e){
        mouseDown = false;

        endPixel = [Math.floor(e.offsetX/pixelSize), Math.floor(e.offsetY/pixelSize)];

        let x1 = startPixel[0];
        let y1 = startPixel[1];
        let x2 = endPixel[0];
        let y2 = endPixel[1];

        let pos = [];

        if (tool == "rect" || tool == "rectF") {
            pos = [smaller(x1,x2),smaller(y1,y2),bigger(x1,x2),bigger(y1,y2)]
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
            pushRectF(pos[0],pos[1],pos[2],pos[3]) //pushRectF works for both types of rect
        } else if (tool == "rectF") {
            pushRectF(pos[0],pos[1],pos[2],pos[3]) 
        } else if (tool == "circle") {
            pushCircle(pos[0],pos[1],pos[2],pos[3]) 
        } else if (tool == "circleF") {
            pushCircle(pos[0],pos[1],pos[2],pos[3]) //push circle should work for both circles
        } else if (tool == "eraser") {
            erase(pos[0],pos[1])
        }
        
        draw(e);
        outputCode()
    }

    function draw(e) { 

        
        //drawFilledTriangle(true,[1,1],[1,2],[1,3])

        clearCanvas()
        drawRefImage()
        drawGrid()

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
            } else if (s_tool == "triangle") { //triangles get their coords from tables instead of straight nums
                drawLine(s_color,shapes[i+2][0],shapes[i+2][1],shapes[i+3][0],shapes[i+3][1])
                drawLine(s_color,shapes[i+3][0],shapes[i+3][1],shapes[i+4][0],shapes[i+4][1])
                drawLine(s_color,shapes[i+4][0],shapes[i+4][1],shapes[i+2][0],shapes[i+2][1])
            } else if (s_tool == "triangleF") {
                drawFilledTriangle(s_color,shapes[i+2],shapes[i+3],shapes[i+4])
            } else if (s_tool == "circle") {
                drawCircle(s_color, x, y, w)
            } else if (s_tool == "circleF") {
                drawCircleF(s_color, x, y, w)
            } else if (s_tool == "text") {
                drawText(s_color, x-1, y-1, w) //w is text string
            }
        }
    }

    function pushLine(x1,y1,x2,y2) {
        ctx.fillStyle = color;

        let x = Math.floor(x1)
        let y = Math.floor(y1)
        let w = Math.floor(x2)
        let h = Math.floor(y2)

        /* console.log("line",color,x, y, w, h) */

        shapes.push(tool,color,x, y, w, h)

    }

    function pushRectF(x1,y1,x2,y2) { //startX,Y,endX,Y
        ctx.fillStyle = color;

        let x = Math.floor(x1)
        let y = Math.floor(y1)
        let w = Math.floor(x2-x1)+1
        let h = Math.floor(y2-y1)+1

        if (tool == "rect") {
            if (w == 1 && h == 1) {
                return
            }
        }
            

        //console.log(tool,color,x, y, w, h)

        shapes.push(tool,color,x, y, w, h)
    }

    function pushTriangle(x1,y1,x2,y2,x3,y3) {
        ctx.fillStyle = color;

        let cord1 = [Math.floor(x1),Math.floor(y1)]
        let cord2 = [Math.floor(x2),Math.floor(y2)]
        let cord3 = [Math.floor(x3),Math.floor(y3)]

        /* console.log("line",color,x, y, w, h) */

        shapes.push(tool, color, cord1, cord2, cord3, "")
    }

    function pushCircle(x1,y1,x2,y2) {
        ctx.fillStyle = color;

        let x = Math.floor(x1)
        let y = Math.floor(y1)
        let r;

        /* if (x2 - x1 >= y2 - y1) {
            r = Math.floor(Math.max(x1,x2) - Math.min(x1,x2))
        } else if (x2 - x1 < y2 - y1) {
            r = Math.floor(Math.max(y1,y2) - Math.min(y1,y2))
        } */
        if (Math.max(x1,x2) - Math.min(x1,x2) >= Math.max(y1,y2) - Math.min(y1,y2)) {
            r = Math.floor(Math.max(x1,x2) - Math.min(x1,x2))
        } else if (Math.max(x1,x2) - Math.min(x1,x2) < Math.max(y1,y2) - Math.min(y1,y2)) {
            r = Math.floor(Math.max(y1,y2) - Math.min(y1,y2))
        }
        //console.log("rad", r)

        r = Math.abs(r)
    
        shapes.push(tool, color, x, y, r, "")
    }

    function pushText(x,y,text) {
        shapes.push(tool, color, x, y, text, "")
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
    ref_img.addEventListener("change",imgLoad);


    color_select.addEventListener("change",changeColor);
    undo_button.addEventListener("click",undo);
    redo_button.addEventListener("click",redo);
    line_shape.addEventListener("click",changeTool);
    rect_shape.addEventListener("click",changeTool);
    rectF_shape.addEventListener("click",changeTool);
    triangle_shape.addEventListener("click",changeTool);
    triangleF_shape.addEventListener("click",changeTool);
    circle_shape.addEventListener("click",changeTool);
    circleF_shape.addEventListener("click",changeTool);
    text_shape.addEventListener("click",changeTool);
    eraser.addEventListener("click",changeTool);


    copy_button.addEventListener("click",copyText);
    color_fix.addEventListener("change",outputCode);
    compact.addEventListener("change",outputCode);
    function_mode.addEventListener("change",outputCode);
    shapeF_fix.addEventListener("change",outputCode);

    inputTextBox.addEventListener("change",inputTextEntered)


    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key === 'z') {
            undo();
        } else if (event.ctrlKey && event.key === 'y') {
            redo();
        }
    });

    function inputTextEntered(e) {
        
        inputTextBox.style.position = 'fixed'
        inputTextBox.style.display = 'none'
        inputTextBox.style.top = 0 + 'px'
        inputTextBox.style.left = 0 + 'px'
        let text = inputTextBox.value
        if (inputTextBox.value.length > 0) {
            pushText(inputTextPos[0],inputTextPos[1],text)
        }
        inputTextBox.value = ""
        inputTextActive = false
        draw()
    }

    function drawLine(color,x1,y1,x2,y2) {
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

    function drawLineForCursor(color,x1,y1,x2,y2) { //squares here are slightly smaller than in drawLine()
        ctx.fillStyle = color;

        let point1 = [x1,y1]
        let point2 = [x2,y2]
        let the_line = line(point1, point2)
        for (let step = 0; step < the_line.length; step++) {
            let x = the_line[step][0]
            let y = the_line[step][1]
            ctx.fillRect(x*pixelSize+1, y*pixelSize+1, pixelSize-2, pixelSize-2);
        }
    }

    function filledBottomFlatTriangle(color, p1, p2, p3) {
        //p1 must be the top point
        let invSlope1 = (p2[0] - p1[0]) / (p2[1] - p1[1])
        let invSlope2 = (p3[0] - p1[0]) / (p3[1] - p1[1])

        let curx1 = p1[0]
        let curx2 = p1[0]

        for (let y = p1[1]; y <= p2[1]; y++) {
            drawLine(color, Math.round(curx1), y, Math.round(curx2), y)
            curx1 += invSlope1
            curx2 += invSlope2
        }
    }

    function filledTopFlatTriangle(color, p1, p2, p3) {
        //p3 must be the bottom point

        let invSlope1 = (p3[0] - p1[0]) / (p3[1] - p1[1])
        let invSlope2 = (p3[0] - p2[0]) / (p3[1] - p2[1])

        let curx1 = p3[0]
        let curx2 = p3[0]

        for (let y = p3[1]; y > p1[1]; y--) {
            drawLine(color, Math.floor(curx1), y, Math.floor(curx2), y)
            curx1 -= invSlope1
            curx2 -= invSlope2
        }
    }

    function drawFilledTriangle(color, p1, p2, p3) {
        let temp;

        //sort so that y1 <= y2 <= y3
        if (p2[1] < p1[1]) {
            temp = swapCoords(p2,p1)
            p2 = temp[0]
            p1 = temp[1]
        }
        if (p3[1] < p1[1]) {
            temp = swapCoords(p3,p1)
            p3 = temp[0]
            p1 = temp[1]
        }
        if (p3[1] < p2[1]) {
            temp = swapCoords(p3,p2)
            p3 = temp[0]
            p2 = temp[1]
        }
        /* if (p1[0] > p2[0]) {
            temp = swapCoords(p1,p2)
            p1 = temp[0]
            p2 = temp[1]
        } */

        //console.log(p1,p2,p3)

        if (p2[1] == p3[1]) {
            filledBottomFlatTriangle(color,p1,p2,p3)
        } else if (p1[1] == p2[1]) {
            //console.log(p1,p2,p3)
            //if (p1[0 == p3[0] && )
            filledTopFlatTriangle(color,[p1[0],[p1[1]-1]],[p2[0],[p2[1]-1]],p3)
        } else {
            let p4 = [(p1[0] + ((p2[1] - p1[1]) / (p3[1] - p1[1])) * (p3[0] - p1[0])), p2[1]]
            filledBottomFlatTriangle(color,p1,p2,p4)
            filledTopFlatTriangle(color,p2,p4,p3)
        }
    }

    function drawCircle(color, centerX, centerY, radius) {
        //https://stackoverflow.com/questions/1022178/how-to-make-a-circle-on-a-grid
        ctx.fillStyle = color;
        
        d = 3 - (2 * radius);
        x = 0;
        y = radius;
    
        do {
            ctx.fillRect((centerX + x)*pixelSize, (centerY + y)*pixelSize, pixelSize, pixelSize);
            ctx.fillRect((centerX + x)*pixelSize, (centerY - y)*pixelSize, pixelSize, pixelSize);
            ctx.fillRect((centerX - x)*pixelSize, (centerY + y)*pixelSize, pixelSize, pixelSize);
            ctx.fillRect((centerX - x)*pixelSize, (centerY - y)*pixelSize, pixelSize, pixelSize);
            ctx.fillRect((centerX + y)*pixelSize, (centerY + x)*pixelSize, pixelSize, pixelSize);
            ctx.fillRect((centerX + y)*pixelSize, (centerY - x)*pixelSize, pixelSize, pixelSize);
            ctx.fillRect((centerX - y)*pixelSize, (centerY + x)*pixelSize, pixelSize, pixelSize);
            ctx.fillRect((centerX - y)*pixelSize, (centerY - x)*pixelSize, pixelSize, pixelSize);

            if (d < 0) {
                d = d + (4 * x) + 12;
            } else {
                d = d + 4 * (x - y) + 10;
                y--;
            }
            x++;
        } while (x <= y);
    }
    
    function drawCircleF(color, centerX, centerY, radius) {
        ctx.fillStyle = color;
        //radius += 0.5
        let top = Math.floor(centerY - radius)
        let bottom = Math.ceil(centerY + radius)
        let left = Math.floor(centerX - radius)
        let right = Math.ceil(centerX + radius)

        for (let y = top; y <= bottom; y++) {
            for (let x = left; x <= right; x++) {
                if (insideCircleF(x, y, centerX, centerY, radius)) {
                    ctx.fillRect(x*pixelSize, y*pixelSize, pixelSize, pixelSize);
                }
            }
        }
        drawCircle(color, centerX, centerY, radius)
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    
    let lastPixel = [0,0];
    function cursor(e) {
        draw(e)
        
        ctx.clearRect((lastPixel[0]*pixelSize)+1, (lastPixel[1]*pixelSize)+1, pixelSize-2, pixelSize-2);

        let pixel = [Math.floor((e.offsetX)/pixelSize), Math.floor((e.offsetY)/pixelSize)];

        ctx.fillStyle = "red";
        ctx.fillRect((pixel[0]*pixelSize)+1, (pixel[1]*pixelSize)+1, pixelSize-2, pixelSize-2);

        position_indicator.innerHTML = "(" + pixel[0] + "," + pixel[1] + ")"
        //console.log(pixel)

        if (mouseDown) {
            if (tool == "line") {
                cursorLine(pixel)
            } else if (tool == "rect") {
                cursorRect(pixel)
            } else if (tool == "rectF") {
                cursorRectF(pixel)
            } else if (tool == "circle") {
                cursorCircle(pixel)
            } else if (tool == "circleF") {
                cursorCircle(pixel)
            }
        } else if (tool == "eraser") {
            cursorErase(pixel)
        }
        if (tool == "triangle" || tool == "triangleF") {
            cursorTriangle(triangle_mouse,pixel)
        }
        

        lastPixel = pixel
        
    }

    
    function cursorLine(pixel) {
        //ctx.fillStyle = cursorColor;
        
        let x1 = startPixel[0]
        let y1 = startPixel[1]
        let x2 = pixel[0]
        let y2 = pixel[1]

        //clearing last line
        for (let step = 0; step < last_line.length; step++) {
            let x = last_line[step][0]
            let y = last_line[step][1]
            ctx.clearRect(x*pixelSize+1, y*pixelSize+1, pixelSize-2, pixelSize-2);
        }

        drawLineForCursor(cursorColor,x1,y1,x2,y2)

        let the_line = line([x1,y1], [x2,y2])
        last_line = the_line
    }

    
    function cursorRectF(pixel) {
        let x1 = smaller(startPixel[0],pixel[0])
        let y1 = smaller(startPixel[1],pixel[1])
        let x2 = bigger(startPixel[0],pixel[0])
        let y2 = bigger(startPixel[1],pixel[1])

        let w = Math.floor(x2-x1)+1
        let h = Math.floor(y2-y1)+1

        ctx.clearRect(last_rectF[0]*pixelSize, last_rectF[1]*pixelSize, last_rectF[2]*pixelSize, last_rectF[3]*pixelSize);

        ctx.fillStyle = cursorColor;
        ctx.fillRect(x1*pixelSize, y1*pixelSize, w*pixelSize, h*pixelSize);
        ctx.fill();

        last_rectF = [x1,y1,w,h];
    }

    function cursorRect(pixel) {

        let x1 = smaller(startPixel[0],pixel[0])
        let y1 = smaller(startPixel[1],pixel[1])
        let x2 = bigger(startPixel[0],pixel[0])
        let y2 = bigger(startPixel[1],pixel[1])

        let w = Math.floor(x2-x1)+1
        let h = Math.floor(y2-y1)+1

        ctx.fillStyle = cursorColor;

        ctx.clearRect(last_rect[0]*pixelSize, last_rect[1]*pixelSize, last_rect[2]*pixelSize, pixelSize); //top left right 
        ctx.clearRect(last_rect[0]*pixelSize, (last_rect[1]+last_rect[3]-1)*pixelSize, last_rect[2]*pixelSize, pixelSize); //bottom left right 
        ctx.clearRect(last_rect[0]*pixelSize, last_rect[1]*pixelSize, pixelSize, last_rect[3]*pixelSize); //top left down
        ctx.clearRect((last_rect[0]+last_rect[2]-1)*pixelSize, last_rect[1]*pixelSize, pixelSize, last_rect[3]*pixelSize); //top right down

        ctx.fillRect(x1*pixelSize, y1*pixelSize, w*pixelSize, pixelSize); //top left right 
        ctx.fillRect(x1*pixelSize, (y1+h-1)*pixelSize, w*pixelSize, pixelSize); //bottom left right 
        ctx.fillRect(x1*pixelSize, y1*pixelSize, pixelSize, h*pixelSize); //top left down
        ctx.fillRect((x1+w-1)*pixelSize, y1*pixelSize, pixelSize, h*pixelSize); //top right down

        last_rect = [x1,y1,w,h];
    }

    function cursorTriangle(coords,pixel) {
        
        ctx.fillStyle = cursorColor;

        if ((coords[2] >= 0 && coords[2] != null) && (coords[3] >= 0 && coords[3] != null)) {
            drawLineForCursor(cursorColor,pixel[0],pixel[1],coords[0],coords[1])
            drawLineForCursor(cursorColor,coords[2],coords[3],pixel[0],pixel[1])
            drawLineForCursor(cursorColor,coords[0],coords[1],coords[2],coords[3])
        } else if ((coords[0] >= 0 && coords[0] != null) && (coords[1] >= 0 && coords[1] != null)) {
            drawLineForCursor(cursorColor,coords[0],coords[1],pixel[0],pixel[1])
        }

        last_triangle = coords;
    }

    function cursorCircle(pixel) {
        ctx.fillStyle = cursorColor;

        let x1 = startPixel[0]
        let y1 = startPixel[1]
        let x2 = pixel[0]
        let y2 = pixel[1]

        let x = Math.floor(x1)
        let y = Math.floor(y1)
        let r;

        if (Math.max(x1,x2) - Math.min(x1,x2) >= Math.max(y1,y2) - Math.min(y1,y2)) {
            r = Math.floor(Math.max(x1,x2) - Math.min(x1,x2))
        } else if (Math.max(x1,x2) - Math.min(x1,x2) < Math.max(y1,y2) - Math.min(y1,y2)) {
            r = Math.floor(Math.max(y1,y2) - Math.min(y1,y2))
        }

        r = Math.abs(r)

        drawCircle(cursorColor, x, y, r)
    }

    function cursorErase(pixel) {

        x = pixel[0]
        y = pixel[1]

        for (let i = shapes.length; i >= 0; i -= 6) {

            let tool_type = shapes[i+0]
            let hex_color = shapes[i+1]
            let x1 = shapes[i+2]
            let y1 = shapes[i+3]
            let x2 = shapes[i+4]
            let y2 = shapes[i+5]

            if (insideRect(x,y,x1,y1,x2,y2)) {
                if (tool_type == "rectF") {
                    ctx.fillStyle = cursorColor;
                    ctx.fillRect(x1*pixelSize, y1*pixelSize, x2*pixelSize, y2*pixelSize);
                    ctx.fill()
                    break
                } else if (tool_type == "rect") {
                    if (!insideRect(x,y,x1+1,y1+1,x2-2,y2-2)) {
                    ctx.fillStyle = cursorColor;
    
                    ctx.fillRect(x1*pixelSize, y1*pixelSize, x2*pixelSize, pixelSize); //top left right 
                    ctx.fillRect(x1*pixelSize, (y1+y2-1)*pixelSize, x2*pixelSize, pixelSize); //bottom left right 
                    ctx.fillRect(x1*pixelSize, y1*pixelSize, pixelSize, y2*pixelSize); //top left down
                    ctx.fillRect((x1+x2-1)*pixelSize, y1*pixelSize, pixelSize, y2*pixelSize); //top right down
    
                    ctx.fill()
                    break
                    }
                }
            } 
            
            if (tool_type == "line") {
                if (insideLine(x,y,x1,y1,x2,y2)) {
                    drawLine(cursorColor,x1,y1,x2,y2)
                    break
                }
            } else if (tool_type == "triangle") {
                if (insideLine(x,y,shapes[i+2][0],shapes[i+2][1],shapes[i+3][0],shapes[i+3][1])
                || insideLine(x,y,shapes[i+3][0],shapes[i+3][1],shapes[i+4][0],shapes[i+4][1])
                || insideLine(x,y,shapes[i+4][0],shapes[i+4][1],shapes[i+2][0],shapes[i+2][1])
                ) {
                    ctx.fillStyle = cursorColor;

                    drawLine(cursorColor,shapes[i+2][0],shapes[i+2][1],shapes[i+3][0],shapes[i+3][1])
                    drawLine(cursorColor,shapes[i+3][0],shapes[i+3][1],shapes[i+4][0],shapes[i+4][1])
                    drawLine(cursorColor,shapes[i+4][0],shapes[i+4][1],shapes[i+2][0],shapes[i+2][1])

                    break
                }
            } else if (tool_type == "triangleF") {
                if (insideTriangle(pixel, shapes[i+2], shapes[i+3], shapes[i+4])) {
                    ctx.fillStyle = cursorColor;

                    drawFilledTriangle(cursorColor,shapes[i+2], shapes[i+3], shapes[i+4])

                    break
                }
            } else if (tool_type == "circle") {
                if (insideCircle(x,y,x1,y1,x2)) {
                    drawCircle(cursorColor,x1,y1,x2)

                    break
                }
            } else if (tool_type == "circleF") {
                if (insideCircleF(x,y,x1,y1,x2)) {
                    drawCircleF(cursorColor,x1,y1,x2)

                    break
                }
            } else if (tool_type == "text") {
                if (insideRect(x,y,x1,y1,x2.length*5-1,5)) {
                    drawText(cursorColor, x1-1, y1-1, x2)
                    break
                }
            }
            
        }
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    var img = new Image();
    function imgLoad() {
        img.src = URL.createObjectURL(this.files[0]);
        img.onload = drawRefImage;
    }

    function drawRefImage() {
        if (img) {
            ctx.drawImage(img, 0, 0, screenWidth, screenHeight, 0, 0, screenWidth * pixelSize, screenHeight * pixelSize);
        }
    }

    function changeScale() {
        pixelSize = scale.value

        canvas.width = screenSizeW*pixelSize;
        canvas.height = screenSizeH*pixelSize;

        draw()
    }

    function changeGrid() {
        draw()
    }

    function changeScreenSize(e) {
        let sizeSelect = e.target.value
        let w = sizeSelect.slice(0,1)
        let h = sizeSelect.slice(2,3)

        screenSizeW = 32*w
        screenSizeH = 32*h

        canvas.width = screenSizeW*pixelSize;
        canvas.height = screenSizeH*pixelSize;

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
        document.getElementById("triangle").style.backgroundColor = "#EFEFEF"
        document.getElementById("triangleF").style.backgroundColor = "#EFEFEF"
        document.getElementById("circle").style.backgroundColor = "#EFEFEF"
        document.getElementById("circleF").style.backgroundColor = "#EFEFEF"
        document.getElementById("text").style.backgroundColor = "#EFEFEF"
        document.getElementById("eraser").style.backgroundColor = "#EFEFEF"

        document.getElementById(tool).style.backgroundColor = "#ac3232"

    }

    function undo() {
        if (eraser_array.length) {
            console.log(eraser_array)
            let len = eraser_array.length;
            shapes.push(eraser_array[len-6],eraser_array[len-5],eraser_array[len-4],eraser_array[len-3],eraser_array[len-2],eraser_array[len-1])
            eraser_array.splice(len - 6, 6);
            clearCanvas();
            outputCode();
            draw();
        } else if (shapes.length) {
            let len = shapes.length;
            redo_array.push(shapes[len-6],shapes[len-5],shapes[len-4],shapes[len-3],shapes[len-2],shapes[len-1])
            shapes.splice(len - 6, 6);
            clearCanvas();
            outputCode();
            draw();
        }
    }

    function redo() {
        if (redo_array.length) {
            let len = redo_array.length;
            shapes.push(redo_array[len-6],redo_array[len-5],redo_array[len-4],redo_array[len-3],redo_array[len-2],redo_array[len-1])
            redo_array.splice(redo_array.length - 6, 6);
            clearCanvas();
            outputCode();
            draw();
        }
    }

    function erase(x,y) {

        for (let i = shapes.length; i >= 0; i -= 6) {
            
            let tool_type = shapes[i+0]
            let hex_color = shapes[i+1]
            let x1 = shapes[i+2]
            let y1 = shapes[i+3]
            let x2 = shapes[i+4]
            let y2 = shapes[i+5]

            if (tool_type == "line") {
                if (insideLine(x,y,x1,y1,x2,y2)) {
                    eraser_array.push(tool_type,hex_color,x1, y1, x2, y2)
                    shapes.splice(i, 6)
                    break
                }
            } else if (tool_type == "rect") {
                if (insideRect(x,y,x1,y1,x2,y2)) {
                    if (!insideRect(x,y,x1+1,y1+1,x2-2,y2-2)) {
                        eraser_array.push(tool_type,hex_color,x1, y1, x2, y2)
                        shapes.splice(i, 6)
                        break
                    }
                }
            } else if (tool_type == "rectF") {
                if (insideRect(x,y,x1,y1,x2,y2)) {
                    eraser_array.push(tool_type,hex_color,x1, y1, x2, y2)
                    shapes.splice(i, 6)
                    break
                }
            } else if (tool_type == "triangle") {
                if (insideLine(x,y,shapes[i+2][0],shapes[i+2][1],shapes[i+3][0],shapes[i+3][1])
                    || insideLine(x,y,shapes[i+3][0],shapes[i+3][1],shapes[i+4][0],shapes[i+4][1])
                    || insideLine(x,y,shapes[i+4][0],shapes[i+4][1],shapes[i+2][0],shapes[i+2][1])
                    ) {
                    eraser_array.push(tool_type,hex_color,x1, y1, x2, y2)
                    shapes.splice(i, 6)
                    break
                }
            } else if (tool_type == "triangleF") {
                if (insideTriangle([x,y], shapes[i+2], shapes[i+3], shapes[i+4])) {
                    eraser_array.push(tool_type,hex_color,x1, y1, x2, y2)
                    shapes.splice(i, 6)
                    break
                }
            } else if (tool_type == "circle") {
                if (insideCircle(x,y,x1,y1,x2)) {
                    eraser_array.push(tool_type,hex_color,x1, y1, x2, y2)
                    shapes.splice(i, 6)
                    break
                }
            } else if (tool_type == "circleF") {
                if (insideCircleF(x,y,x1,y1,x2)) {
                    eraser_array.push(tool_type,hex_color,x1, y1, x2, y2)
                    shapes.splice(i, 6)
                    break
                }
            } else if (tool_type == "text") {
                if (insideRect(x,y,x1,y1,x2.length*5-1,5)) {
                    eraser_array.push(tool_type,hex_color,x1, y1, x2, y2)
                    shapes.splice(i, 6)
                    break
                }
            }
        }
    }

    var letters = {
        //each one of this numbers is a square in the 4x5 grid that represents each letter. 0,0 being 1, 4,5 being 20.
        "0": [2,3,5,7,8,9,10,12,13,16,18,19],
        "1": [2,5,6,10,14,18],
        "2": [2,3,5,8,11,14,17,18,19,20],
        "3": [1,2,3,8,10,11,16,17,18,19],
        "4": [1,4,5,8,9,10,11,12,16,20],
        "5": [1,2,3,4,5,9,10,11,16,17,18,19],
        "6": [2,3,5,9,10,11,13,16,18,19],
        "7": [1,2,3,4,8,11,15,19],
        "8": [2,3,5,8,10,11,13,16,18,19],
        "9": [2,3,5,8,10,11,12,16,18,19],

        "a": [2,3,5,8,9,10,11,12,13,16,17,20],
        "b": [1,2,3,5,8,9,10,11,13,16,17,18,19],
        "c": [2,3,5,8,9,13,16,18,19],
        "d": [1,2,3,5,8,9,12,13,16,17,18,19],
        "e": [1,2,3,4,5,9,10,11,13,17,18,19,20],
        "f": [1,2,3,4,5,9,10,11,13,17],
        "g": [2,3,5,9,11,12,13,16,18,19],
        "h": [1,4,5,8,9,12,13,14,15,16,17,20],
        "i": [2,6,10,14,18],
        "j": [4,8,12,13,16,18,19],
        "k": [1,4,5,7,9,10,13,15,17,20],
        "l": [1,5,9,13,17,18,19,20],
        "m": [1,4,5,6,7,8,9,12,13,16,17,20],
        "n": [1,4,5,6,8,9,11,12,13,16,17,20],
        "o": [2,3,5,8,9,12,13,16,18,19],
        "p": [1,2,3,5,8,9,10,11,13,17],
        "q": [2,3,5,8,9,12,13,15,16,18,19,20],
        "r": [1,2,3,5,8,9,10,11,13,15,17,20],
        "s": [2,3,4,5,10,11,16,17,18,19],
        "t": [1,2,3,6,10,14,18],
        "u": [1,4,5,8,9,12,13,16,18,19],
        "v": [1,3,5,7,9,11,13,15,18],
        "w": [1,4,5,8,9,12,13,14,15,16,17,20],
        "x": [1,4,5,8,10,11,13,16,17,20],
        "y": [1,3,5,7,10,14,18],
        "z": [1,2,3,4,8,10,11,13,17,18,19,20],
        
        ".": [18],
        "!": [2,6,10,18],
        "#": [1,3,5,6,7,8,9,11,13,14,15,16,17,19],
        "$": [2,3,4,5,7,10,11,14,16,17,18,19],
        "%": [1,2,8,10,11,13,19,20],
        "&": [2,5,7,10,13,15,18,20],
        "`": [2,6],
        "(": [3,6,10,14,19],
        ")": [2,7,11,15,18],
        "*": [1,4,6,7,9,10,11,12,14,15,17,20],
        "+": [6,9,10,11,14],
        ",": [14,17],
        "-": [9,10,11],
        "/": [3,7,10,13,17],

        ":": [6,14],
        ";": [6,14,18],
        "<": [3,6,9,14,19],
        "=": [5,6,7,13,14,15],
        ">": [1,6,11,14,17],
        "?": [1,2,7,10,18],
        "@": [2,3,5,8,9,11,12,13,18,19,20],

        "[": [2,3,6,10,14,18,19],
        "]": [2,3,7,11,15,18,19],
        "^": [2,5,7],
        "_": [17,18,19,20],
        "|": [2,6,14,18],
        "{": [2,3,6,9,10,14,18,19],
        "}": [1,2,6,10,11,14,17,18],
    }
    
    function drawText(color, x, y, text) {
        //console.log(letters.h)
        ctx.fillStyle = color;

        text = text.toLowerCase()

        for (let i = 0; i < text.length; i++) {
    
            let char = text.charAt(i)
    
            for (let key in letters) {
                if (key == char) {
                    for (let l = 0; l < letters[key].length; l++) {
                        let pos = letterPos(letters[key][l])
                        
                        ctx.fillRect((pos[1]+x+(i*5))*pixelSize, (pos[2]+y)*pixelSize, pixelSize, pixelSize);
                        //ctx.fill()
                    }
                }
            }
        }
    }
    
    function letterPos(x) {
        let pos = [0,0]
        if (x <= 4) {
            pos[1] = x
            pos[2] = 1
        } else if (x > 4 && x <= 8) {
            pos[1] = x - 4
            pos[2] = 2
        } else if (x > 8 && x <= 12) {
            pos[1] = x - 8
            pos[2] = 3
        } else if (x > 12 && x <= 16) {
            pos[1] = x - 12
            pos[2] = 4
        } else if (x > 16 && x <= 20) {
            pos[1] = x - 16
            pos[2] = 5
        }
        return pos
    }

    function clearRedo() {
        redo_array = [];
    }

    function hexToRgb(h) {
        let r = 0, g = 0, b = 0;
      
        // 3 digits
        if (h.length == 4) {
            r = "0x" + h[1] + h[1];
            g = "0x" + h[2] + h[2];
            b = "0x" + h[3] + h[3];
        
        // 6 digits
        } else if (h.length == 7) {
            r = "0x" + h[1] + h[2];
            g = "0x" + h[3] + h[4];
            b = "0x" + h[5] + h[6];
        }
    
        if (color_fix.checked) {
            r = gFix(r)
            g = gFix(g)
            b = gFix(b)
        }
        
        return +r + "," + +g + "," + +b;
    }

    function outputCode() {
        //[0]tool, [1]hex_color, [2,3,4,5]coordinates

        //SW screen.draw funky inconsistencies:
        //Lines don't fill the end pixel. Kinda fixed by adding 0.25
        //rect goes one pixel long on h and w. Fixed by substracting 1
        //rectF and triangleF draw differently on AMD vs NVIDIA
        
        let final_string = "";
        let tool_string = "";
        let last_color = "";

        let set_color_string = "";
        let line_string = "";
        let rect_string = "";
        let rectF_string = "";
        let triangle_string = "";
        let triangleF_string = "";
        let circle_string = "";
        let circleF_string = "";

        if (compact.checked) {
            set_color_string = "sc(";
            line_string = "dl(";
            rect_string = "dr(";
            rectF_string = "drf(";
            triangle_string = "dt(";
            triangleF_string = "dtf(";
            circle_string = "dc(";
            circleF_string = "dcf(";
            text_string = "dtx(";
            
            final_string = final_string + "s=screen<br>sc=s.setColor<br>dl=s.drawLine<br>dr=s.drawRect<br>drf=s.drawRectF<br>dt=s.drawTriangle<br>dtf=s.drawTriangleF<br>dc=s.drawCircle<br>dcf=s.drawCircleF<br>dtx=s.drawText<br><br>"
            if (function_mode.checked) {
                final_string = final_string + "function onDraw()<br><br>shape(0,0)<br><br>end<br><br>function shape(x,y)<br><br>"
            } else {
                final_string = final_string + "function onDraw()<br><br>"
            }
            
        } else {
            if (function_mode.checked) {
                final_string = final_string + "function onDraw()<br><br>shape(0,0)<br><br>end<br><br>function shape(x,y)<br><br>"
            } else {
                final_string = final_string + "function onDraw()<br><br>"
            }
            
            set_color_string = "screen.setColor(";
            line_string = "screen.drawLine(";
            rect_string = "screen.drawRect(";
            rectF_string = "screen.drawRectF(";
            triangle_string = "screen.drawTriangle(";
            triangleF_string = "screen.drawTriangleF(";
            circle_string = "screen.drawCircle(";
            circleF_string = "screen.drawCircleF(";
            text_string = "screen.drawText(";
        }

        for (let i = 0; i < shapes.length; i += 6) {
            

            let tool_type = shapes[i+0]
            let hex_color = shapes[i+1]
            let x1 = shapes[i+2]
            let y1 = shapes[i+3]
            let x2 = shapes[i+4]
            let y2 = shapes[i+5]
            let ty1 = shapes[i+2][1] //y's for triangleF
            let ty2 = shapes[i+3][1]
            let ty3 = shapes[i+4][1]


            if (hex_color !== last_color) {
                /* let color_string = set_color_string + hexToRgb(hex_color) + ")" */
                let color_string = set_color_string + hexToRgb(hex_color) + ")"
                final_string = final_string + color_string + "<br>"
                last_color = hex_color;
            }

            if (tool_type == "line") {
                if (function_mode.checked) {
                    tool_string = line_string + x1 + "+x," + y1 + "+y," + (x2+0.25) + "+x," + (y2+0.25) + "+y)"
                } else {
                    tool_string = line_string + x1 + "," + y1 + "," + (x2+0.25) + "," + (y2+0.25) + ")"
                }
            } else if (tool_type == "rect") {
                if (function_mode.checked) {
                    tool_string = rect_string + x1 + "+x," + y1 + "+y," + (x2-1) + "," + (y2-1) + ")"
                } else {
                    tool_string = rect_string + x1 + "," + y1 + "," + (x2-1) + "," + (y2-1) + ")"
                }
            } else if (tool_type == "rectF") {
                if (shapeF_fix.checked) {
                    y1 = y1 + 0.5
                }
                if (function_mode.checked) {
                    tool_string = rectF_string + x1 + "+x," + y1 + "+y," + x2 + "," + y2 + ")"
                } else {
                    tool_string = rectF_string + x1 + "," + y1 + "," + x2 + "," + y2 + ")"
                }
            } else if (tool_type == "triangle") {
                if (function_mode.checked) {
                    tool_string = triangle_string + shapes[i+2][0] + "+x" + "," + shapes[i+2][1] + "+y" + "," + //continues down
                    shapes[i+3][0] + "+x" + "," + shapes[i+3][1] + "+y" + "," + shapes[i+4][0] + "+x" + "," + shapes[i+4][1] + "+y" + ")"
                } else {
                    tool_string = triangle_string + shapes[i+2][0] + "," + shapes[i+2][1] + "," + //continues down
                    shapes[i+3][0] + "," + shapes[i+3][1] + "," + shapes[i+4][0] + "," + shapes[i+4][1] + ")"
                }
            } else if (tool_type == "triangleF") {
                if (shapeF_fix.checked) {
                    ty1 += 0.5
                    ty2 += 0.5
                    ty3 += 0.5
                }
                if (function_mode.checked) {
                    tool_string = triangleF_string + shapes[i+2][0] + "+x" + "," + ty1 + "+y" + "," + //continues down
                    shapes[i+3][0] + "+x" + "," + ty2 + "+y" + "," + shapes[i+4][0] + "+x" + "," + ty3 + "+y" + ")"
                } else {
                    tool_string = triangleF_string + shapes[i+2][0] + "," + ty1 + "," + //continues down
                    shapes[i+3][0] + "," + ty2 + "," + shapes[i+4][0] + "," + ty3 + ")"
                }
            } else if (tool_type == "circle") {
                if (function_mode.checked) {
                    tool_string = circle_string + x1 + "+x," + y1 + "+y," + x2 + ")"
                } else {
                    tool_string = circle_string + x1 + "," + y1 + "," + x2 + ")"
                }
            } else if (tool_type == "circleF") {
                if (function_mode.checked) {
                    tool_string = circleF_string + x1 + "+x," + y1 + "+y," + x2 + ")"
                } else {
                    tool_string = circleF_string + x1 + "," + y1 + "," + x2 + ")"
                }
            } else if (tool_type == "text") { //x2 is text
                if (function_mode.checked) {
                    tool_string = text_string + x1 + "+x," + y1 + "+y," + "\"" + x2 + "\"" + ")"
                } else {
                    tool_string = text_string + x1 + "," + y1 + "," + "\"" + x2 + "\"" + ")"
                }
            }
            final_string = final_string + tool_string + "<br>"
        }
        
        final_string = final_string + "<br>end"
        output.innerHTML = final_string
        char_count.innerHTML = final_string.replaceAll('<br>',' ').length
        //console.log(output.innerHTML)
        console.log(final_string.length)
    }

    function copyText() {
        let copy_string = output.innerHTML.replaceAll('<br>','\n');
        navigator.clipboard.writeText(copy_string)
    }
    

});

window.onbeforeunload = e => {
    if (shapes.length > 0) {
        var dialogText = 'Do you really want to leave this site?';
        e.returnValue = dialogText;
        return dialogText;
    }
};

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

let gamaFix = 1.1
function gFix(color) { //by XLjedi

    color = Math.floor(color**gamaFix/255**gamaFix*color)
    return color
}

function swapCoords(coord1, coord2) {
    let temp1 = coord1
    let temp2 = coord2

    coord1 = temp2
    coord2 = temp1

    return [coord1, coord2]
}

function bigger(x,y) { //this is fucked up that I did this
    if (x >= y) {
        return x
    } else if (y > x) {
        return y
    }
}

function smaller(x,y) { //there's already a built-in function for this god damn
    if (x <= y) {
        return x
    } else if (y < x) {
        return y
    }
}

function sign(p1,p2,p3) {
    return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1])
}

function insideTriangle(pixel, p1, p2, p3) {
    let d1;
    let d2;
    let d3;
    let has_neg;
    let has_pos;

    d1 = sign(pixel, p1, p2)
    d2 = sign(pixel, p2, p3)
    d3 = sign(pixel, p3, p1)

    has_neg = (d1 < 0) || (d2 < 0) || (d3 < 0)
    has_pos = (d1 > 0) || (d2 > 0) || (d3 > 0)

    return !(has_neg && has_pos)
}

function insideRect(x,y,rx,ry,w,h) {
    if (x >= rx && x < rx+w && y >= ry && y < ry+h) {
        return true;
    }
    return false;
}

function insideLine(x,y,x1,y1,x2,y2) {
    let point1 = [x1,y1]
    let point2 = [x2,y2]
    let the_line = line(point1, point2)
    for (let step = 0; step < the_line.length; step++) {
        if (x == the_line[step][0] && y == the_line[step][1]) {
            return true
        }
    }
}

function insideCircle(px, py, centerX, centerY, radius) {
    let d = 3 - (2 * radius);
    let x = 0;
    let y = radius;

    do {
        if (
           insideRect(px, py, (centerX + x), (centerY + y), 1, 1)
        || insideRect(px, py, (centerX + x), (centerY - y), 1, 1)
        || insideRect(px, py, (centerX - x), (centerY + y), 1, 1)
        || insideRect(px, py, (centerX - x), (centerY - y), 1, 1)

        || insideRect(px, py, (centerX + y), (centerY + x), 1, 1)
        || insideRect(px, py, (centerX + y), (centerY - x), 1, 1)
        || insideRect(px, py, (centerX - y), (centerY + x), 1, 1)
        || insideRect(px, py, (centerX - y), (centerY - x), 1, 1)
        ) {
            return true
        }

        if (d < 0) {
            d = d + (4 * x) + 12;
        } else {
            d = d + 4 * (x - y) + 10;
            y--;
        }
        x++;
    } while (x <= y);
}

function insideCircleF(x, y, centerX, centerY, radius) {
    let dx = centerX - x
    let dy = centerY - y
    let distance_squared = dx*dx + dy*dy
    return distance_squared <= radius*radius
}