// Drawing Canvas for Stormworks Lua "Screen" API

// Feel free to use or modify any part of this script, but contact me before, if posible.

// Made by Mr Lennyn

window.addEventListener("load", () =>{


    // References
    const canvas = document.querySelector("#canvas");
    const ctx = canvas.getContext("2d");

    

    const ref_img = document.getElementById("refimage")

    const save_button = document.getElementById("save_button")
    const load_button = document.getElementById("load_button")
    const grid_checkbox = document.getElementById("grid")
    const screen_select = document.getElementById("screen")
    const color_select = document.getElementById("color")
    const hide_image_checkbox = document.getElementById("img_hide")

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
    const shape_color = document.getElementById("shape_color")
    const bucket_color = document.getElementById("bucket_color")
    const eraser = document.getElementById("eraser")
    const eyedrop = document.getElementById("eyedrop")
    const push_back = document.getElementById("push_back")
    const push_forward = document.getElementById("push_forward")
    const move_shape = document.getElementById("move_shape")

    const copy_button = document.getElementById("copy")
    const color_factor = document.getElementById("gamma_factor")
    const color_fix = document.getElementById("gamma")
    const color_grouping = document.getElementById("color_grouping")
    const compact = document.getElementById("compact")
    const function_mode = document.getElementById("function mode")
    const shapeF_fix = document.getElementById("shapeF fix")
    const output = document.getElementById("outputCode")
    const char_count = document.getElementById("char_count_number")

    const position_indicator = document.getElementById("position")

    const inputTextBox = document.getElementById("inputText")

    

    ctx.imageSmoothingEnabled = false;


    // Variables
    let pixelSize = 24

    let screenSizeW = 32
    let screenSizeH = 32
    
    let screenWidth = screenSizeW * pixelSize
    let screenHeight = screenSizeH * pixelSize

    let startPixel = [];
    let endPixel = [];

    let mouseDown = false

    let cursorColor = "#821111"
    let innerCursorColor = "#d14343"
    let innerBand = pixelSize/3


    var bgColor = "#1e1e1e"

    let redo_array = [];
    let eraser_array = [];

    let tool = "line"
    let color = "#FFFFFF"
    shapes = []; //[0]tool, [1]hex_color, [2,3,4,5]coordinates ...

    let triangle_mouse = [null,null,null,null,null,null]

    inputTextActive = false

    g_offset = {"x": canvas.width/2 - screenWidth/2, "y": canvas.height/2 - screenHeight/2}
    g_offset.x = Math.floor(g_offset.x)
    g_offset.y = Math.floor(g_offset.y)
    

    function drawGrid() {
        if (grid_checkbox.checked) {
            // Draw Grid
            ctx.fillStyle = '#303030';
            for (let x = 0; x < screenSizeW+1; x++) {
                ctx.fillRect(Math.floor(x * pixelSize + g_offset.x), g_offset.y, 1, screenSizeH * pixelSize)
            }
            for (let y = 0; y < screenSizeH+1; y++) {
                ctx.fillRect(g_offset.x, Math.floor(y * pixelSize + g_offset.y), screenSizeW * pixelSize, 1)
            }
        }

        // Draw Outline
        ctx.strokeStyle = '#505050'
        ctx.strokeRect(g_offset.x, g_offset.y, screenSizeW * pixelSize, screenSizeH * pixelSize)
    }

    /* resized() */
    outputCode()
    drawGrid()

    var drag_start = []
    var drag_end = []
    var moving_canvas = false

    var moving_shape_index = null
    var moving_shape_vector = null

    function startPosition(e){

        if (e.button == 2) { // right mouse, for moving the canvas
            drag_start = [e.offsetX, e.offsetY]
            moving_canvas = true
        }

        if (e.button != 0) { //if button isn't left mouse click, then don't do the things
            return
        }


        startPixel = [Math.floor((e.offsetX-g_offset.x)/pixelSize), Math.floor((e.offsetY-g_offset.y)/pixelSize)];

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

                pushTriangle(triangle_mouse[0], triangle_mouse[1], triangle_mouse[2], triangle_mouse[3], triangle_mouse[4], triangle_mouse[5],)

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
                inputTextActive = false
                inputTextEntered()
            }
        } else if (tool == "move_shape") {

            // find the index of the shape under mouse, for later moving on move_shape_function()
            moving_shape_index = find_shape(startPixel[0], startPixel[1])

            // We calculate a vector from the mouse position to the (x,y) position of the shape, so we can offset the moving
            // this way we 'grab' the shape from whereever we clicked, instead of making (x,y) jump to the mouse

            let x = startPixel[0]
            let y = startPixel[1]
            let i = moving_shape_index

            let s_tool = shapes[i+0]
            let x1 = shapes[i+2]
            let y1 = shapes[i+3]

            if (s_tool == "triangle" || s_tool == "triangleF") {
                x = x - x1[0]
                y = y - x1[1]
            } else {
                x = x - x1
                y = y - y1
            }

            moving_shape_vector = [x, y]

        } else {
            triangle_mouse = [null,null,null,null,null,null]
        }
        
    }
    
    function finishedPosition(e) {

        
        if (e.button == 2) { // right mouse, for moving the canvas
            moving_canvas = false
            drag_end = []
            drag_start = []
        }

        if (e.button != 0) { //if button isn't left mouse click, then don't do the things
            return
        }

        mouseDown = false;

        endPixel = [Math.floor((e.offsetX - g_offset.x)/pixelSize), Math.floor((e.offsetY - g_offset.y)/pixelSize)];

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
        } else if (tool == "shape_color") {
            shape_color_function(pos[0],pos[1])
        } else if (tool == "bucket_color") {
            bucket_color_function(pos[0],pos[1])
        } else if (tool == "eyedrop") {
            eyedrop_function(pos[0],pos[1])
        } else if (tool == "push_back") {
            push_back_function(pos[0],pos[1])
        } else if (tool == "push_forward") {
            push_forward_function(pos[0],pos[1])
        } else if (tool == "move_shape") {
            moving_shape_index = null
        }

        draw(e);
        outputCode()
    }

    function draw(e) { 

        
        //drawFilledTriangle(true,[1,1],[1,2],[1,3])

        clearCanvas()
        drawBackground()
        drawRefImage()
        drawGrid()

        innerBand = pixelSize/3

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
                ctx.fillRect(x * pixelSize + g_offset.x, y * pixelSize + g_offset.y, w * pixelSize, h * pixelSize);
                ctx.fill()
            } else if (s_tool == "rect") {
                ctx.fillStyle = s_color;

                ctx.fillRect(x * pixelSize + g_offset.x, y * pixelSize + g_offset.y, w * pixelSize, pixelSize); //top left right 
                ctx.fillRect(x * pixelSize + g_offset.x, (y + h - 1) * pixelSize + g_offset.y, w * pixelSize, pixelSize); //bottom left right 
                ctx.fillRect(x * pixelSize + g_offset.x, y * pixelSize + g_offset.y, pixelSize, h * pixelSize); //top left down
                ctx.fillRect((x + w - 1)*pixelSize+g_offset.x, y * pixelSize + g_offset.y, pixelSize, h * pixelSize); //top right down

                ctx.fill()
            } else if (s_tool == "triangle") { //triangles get their coords from tables instead of straight nums
                drawLine(s_color, shapes[i+2][0], shapes[i+2][1], shapes[i+3][0], shapes[i+3][1])
                drawLine(s_color, shapes[i+3][0], shapes[i+3][1], shapes[i+4][0], shapes[i+4][1])
                drawLine(s_color, shapes[i+4][0], shapes[i+4][1], shapes[i+2][0], shapes[i+2][1])
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

        if (x1 == null || y1 == null) { //checking its not NaN
            return
        }

        let x = Math.floor(x1)
        let y = Math.floor(y1)
        let w = Math.floor(x2)
        let h = Math.floor(y2)


        shapes.push(tool,color,x, y, w, h)

    }

    function pushRectF(x1,y1,x2,y2) { //startX,Y,endX,Y

        if (x1 == null || y1 == null) { //checking its not NaN
            return
        }

        let x = Math.floor(x1)
        let y = Math.floor(y1)
        let w = Math.floor(x2-x1)+1
        let h = Math.floor(y2-y1)+1

        if (tool == "rect") {
            if (w == 1 && h == 1) {
                return
            }
        }

        shapes.push(tool,color,x, y, w, h)
    }

    function pushTriangle(x1,y1,x2,y2,x3,y3) {

        if (x1 == null || y1 == null) { //checking its not NaN
            return
        }

        let cord1 = [Math.floor(x1),Math.floor(y1)]
        let cord2 = [Math.floor(x2),Math.floor(y2)]
        let cord3 = [Math.floor(x3),Math.floor(y3)]

        shapes.push(tool, color, cord1, cord2, cord3, "_")
    }

    function pushCircle(x1,y1,x2,y2) {

        if (x1 == null || y1 == null) { //checking its not NaN
            return
        }

        let x = Math.floor(x1)
        let y = Math.floor(y1)
        let r;

        if (x1 == x2 && y1 == y2) {
            return
        }

        if (Math.max(x1,x2) - Math.min(x1,x2) >= Math.max(y1,y2) - Math.min(y1,y2)) {
            r = Math.floor(Math.max(x1,x2) - Math.min(x1,x2))
        } else if (Math.max(x1,x2) - Math.min(x1,x2) < Math.max(y1,y2) - Math.min(y1,y2)) {
            r = Math.floor(Math.max(y1,y2) - Math.min(y1,y2))
        }

        r = Math.abs(r)
    
        shapes.push(tool, color, x, y, r, "_")
    }

    function pushText(x,y,text) {
        if (x == null || y == null) { //checking its not NaN
            return
        }

        shapes.push(tool, color, x, y, text, "_")
    }

    //Event Listeners
    window.addEventListener("resize", resized)
    canvas.addEventListener("mousedown", startPosition);
    canvas.addEventListener("mouseup", finishedPosition);
    canvas.addEventListener("mousemove",cursor);

    //tools
    save_button.addEventListener("click",saveDataToFile);
    load_button.addEventListener("change",loadDataFromFile)
    grid_checkbox.addEventListener("change",changeGrid);
    screen_select.addEventListener("change",changeScreenSize);
    ref_img.addEventListener("change",imgLoad);
    hide_image_checkbox.addEventListener("change",changeRefImg);


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
    shape_color.addEventListener("click",changeTool);
    bucket_color.addEventListener("click",changeTool);
    eraser.addEventListener("click",changeTool);
    eyedrop.addEventListener("click",changeTool);
    push_back.addEventListener("click",changeTool);
    push_forward.addEventListener("click",changeTool);
    move_shape.addEventListener("click",changeTool);


    copy_button.addEventListener("click",copyText);
    color_factor.addEventListener("input",color_factor_change)
    color_fix.addEventListener("change",outputCode);
    color_grouping.addEventListener("change",outputCode)
    compact.addEventListener("change",outputCode);
    function_mode.addEventListener("change",outputCode);
    shapeF_fix.addEventListener("change",outputCode);

    inputTextBox.addEventListener("change",inputTextEntered)

    canvas.addEventListener('wheel', function(e) {  

        e.preventDefault();

        if (e.deltaY < 0 && pixelSize < 80) {
            pixelSize += 1
            g_offset.x -= (e.offsetX - g_offset.x) / pixelSize
            g_offset.y -= (e.offsetY - g_offset.y) / pixelSize
        } else if (e.deltaY > 0 && pixelSize > 1) {
            pixelSize -= 1
            g_offset.x += (e.offsetX - g_offset.x) / pixelSize
            g_offset.y += (e.offsetY - g_offset.y) / pixelSize
        }
        pixelSize = Math.floor(pixelSize)
        g_offset.x = Math.floor(g_offset.x)
        g_offset.y = Math.floor(g_offset.y)

        draw()
    })

    document.addEventListener('keydown', function(event) {
        if (inputTextActive) {
            return
        }

        if (event.ctrlKey && event.key === 'z') {
            undo();
        } else if (event.ctrlKey && event.key === 'y') {
            redo();
        } else if (event.key === 'q') {
            changeTool("", "line")
        } else if (event.key === 'w') {
            if (tool == "rectF") {
                changeTool("", "rect")
            } else if (tool == "rect") {
                changeTool("", "rectF")
            } else {
                changeTool("", "rect")
            }
        } else if (event.key === 'e') {
            if (tool == "triangleF") {
                changeTool("", "triangle")
            } else if (tool == "triangle") {
                changeTool("", "triangleF")
            } else {
                changeTool("", "triangle")
            }
        } else if (event.key === 'r') {
            if (tool == "circleF") {
                changeTool("", "circle")
            } else if (tool == "circle") {
                changeTool("", "circleF")
            } else {
                changeTool("", "circle")
            }
        } else if (event.key === 't') {
            changeTool("", "text")
        } else if (event.key === 's') {
            changeTool("", "shape_color")
        } else if (event.key === 'd') {
            changeTool("", "bucket_color")
        } else if (event.key === 'f') {
            changeTool("", "eraser")
        } else if (event.key === 'a') {
            changeTool("", "move_shape")
        } else if (event.key === 'c') {
            changeTool("", "eyedrop")
        } else if (event.key === 'n') {
            changeTool("", "push_back")
        } else if (event.key === 'm') {
            changeTool("", "push_forward")
        } else if (event.key === ' ') { //space bar
            // if we press space, cancel action
            mouseDown = false
            startPixel = []
            triangle_mouse = [null,null,null,null,null,null]
            draw()
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
        outputCode()
    }

    function drawLine(color,x1,y1,x2,y2) {
        ctx.fillStyle = color;

        let point1 = [x1,y1]
        let point2 = [x2,y2]
        let the_line = line(point1, point2)
        for (let step = 0; step < the_line.length; step++) {
            let x = the_line[step][0]
            let y = the_line[step][1]
            /* ctx.fillRect(x * pixelSize + g_offset.x, y * pixelSize + g_offset.y, pixelSize + 1, pixelSize + 1); */
            ctx.fillRect(x * pixelSize + g_offset.x, y * pixelSize + g_offset.y, pixelSize, pixelSize);
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

        if (p2[1] == p3[1]) {
            filledBottomFlatTriangle(color,p1,p2,p3)
        } else if (p1[1] == p2[1]) {
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
            ctx.fillRect((centerX + x) * pixelSize + g_offset.x, (centerY + y) * pixelSize + g_offset.y, pixelSize, pixelSize);
            ctx.fillRect((centerX + x) * pixelSize + g_offset.x, (centerY - y) * pixelSize + g_offset.y, pixelSize, pixelSize);
            ctx.fillRect((centerX - x) * pixelSize + g_offset.x, (centerY + y) * pixelSize + g_offset.y, pixelSize, pixelSize);
            ctx.fillRect((centerX - x) * pixelSize + g_offset.x, (centerY - y) * pixelSize + g_offset.y, pixelSize, pixelSize);
            ctx.fillRect((centerX + y) * pixelSize + g_offset.x, (centerY + x) * pixelSize + g_offset.y, pixelSize, pixelSize);
            ctx.fillRect((centerX + y) * pixelSize + g_offset.x, (centerY - x) * pixelSize + g_offset.y, pixelSize, pixelSize);
            ctx.fillRect((centerX - y) * pixelSize + g_offset.x, (centerY + x) * pixelSize + g_offset.y, pixelSize, pixelSize);
            ctx.fillRect((centerX - y) * pixelSize + g_offset.x, (centerY - x) * pixelSize + g_offset.y, pixelSize, pixelSize);

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
        let top = Math.floor(centerY - radius)
        let bottom = Math.ceil(centerY + radius)
        let left = Math.floor(centerX - radius)
        let right = Math.ceil(centerX + radius)

        for (let y = top; y <= bottom; y++) {
            for (let x = left; x <= right; x++) {
                if (insideCircleF(x, y, centerX, centerY, radius)) {
                    ctx.fillRect(x * pixelSize + g_offset.x, y * pixelSize + g_offset.y, pixelSize, pixelSize);
                }
            }
        }
        drawCircle(color, centerX, centerY, radius)
    }

    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    
    function cursor(e) {

        
        if (moving_canvas) {
            drag_end = [e.offsetX, e.offsetY]
            g_offset.x += drag_end[0] - drag_start[0]
            g_offset.y += drag_end[1] - drag_start[1]
            drag_start = [e.offsetX, e.offsetY]
            g_offset.x = Math.floor(g_offset.x)
            g_offset.y = Math.floor(g_offset.y)
        }

        draw(e)

        let pixel = [Math.floor(e.offsetX / pixelSize - g_offset.x / pixelSize), Math.floor(e.offsetY / pixelSize - g_offset.y / pixelSize)];
        
        

        if (!mouseDown) {
            // Pixel Cursor
            ctx.fillStyle = cursorColor;
            ctx.fillRect(pixel[0] * pixelSize + g_offset.x, pixel[1] * pixelSize + g_offset.y, pixelSize, pixelSize);
            ctx.fillStyle = innerCursorColor;
            ctx.fillRect(pixel[0] * pixelSize + g_offset.x + innerBand, pixel[1] * pixelSize + g_offset.y + innerBand, innerBand, innerBand);
        }
        

        position_indicator.innerHTML = "[" + pixel[0] + "," + pixel[1] + "]"

        if (mouseDown) {

            position_indicator.innerHTML = position_indicator.innerHTML + "<br>(" + Math.abs(pixel[0] - startPixel[0]) + "," + Math.abs(pixel[1] - startPixel[1]) + ")"

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
            cursorShape(pixel)
        } else if (tool == "shape_color") {
            cursorShapeColor(pixel)
        } else if (tool == "bucket_color") {
            cursorBucketColor(pixel)
        } else if (tool == "push_back") {
            cursorShape(pixel)
        } else if (tool == "push_forward") {
            cursorShape(pixel)
        } 

        if (tool == "triangle" || tool == "triangleF") {
            cursorTriangle(triangle_mouse, pixel)
        } else if (tool == "move_shape") {
            move_shape_function(pixel)
        } 
        
    }

    
    function cursorLine(pixel) {
        
        let x1 = startPixel[0]
        let y1 = startPixel[1]
        let x2 = pixel[0]
        let y2 = pixel[1]

        drawLineForCursor(cursorColor,x1,y1,x2,y2)
    }

    

    function drawLineForCursor(color,x1,y1,x2,y2) { //squares here are slightly smaller than in drawLine()
        

        let point1 = [x1,y1]
        let point2 = [x2,y2]
        let the_line = line(point1, point2)

        for (let step = 0; step < the_line.length; step++) {
            let x = the_line[step][0]
            let y = the_line[step][1] 
            ctx.fillStyle = color;
            ctx.fillRect(x * pixelSize + g_offset.x, y * pixelSize + g_offset.y, pixelSize, pixelSize);

            ctx.fillStyle = innerCursorColor;
            ctx.fillRect(x * pixelSize + g_offset.x + innerBand, y * pixelSize + g_offset.y + innerBand, innerBand, innerBand);
        }
    }
    
    function cursorRectF(pixel) {
        let x1 = smaller(startPixel[0],pixel[0])
        let y1 = smaller(startPixel[1],pixel[1])
        let x2 = bigger(startPixel[0],pixel[0])
        let y2 = bigger(startPixel[1],pixel[1])

        x1 = x1 * pixelSize + g_offset.x
        y1 = y1 * pixelSize + g_offset.y
        x2 = x2 * pixelSize + g_offset.x
        y2 = y2 * pixelSize + g_offset.y

        let w = Math.floor(x2-x1) + pixelSize
        let h = Math.floor(y2-y1) + pixelSize

        ctx.fillStyle = cursorColor;
        ctx.fillRect(x1, y1, w, h);
        ctx.fill();

        ctx.fillStyle = innerCursorColor;

        ctx.fillRect(x1 + innerBand, y1 + innerBand, w  - pixelSize, innerBand); //top left to right 
        ctx.fillRect(x1 + innerBand, (y1+h) - pixelSize + innerBand, w - pixelSize, innerBand); //bottom left to right 
        ctx.fillRect(x1 + innerBand, y1 + innerBand, innerBand, h - pixelSize); //top left to down
        ctx.fillRect((x1+w) + innerBand - pixelSize, y1 + innerBand, innerBand, h + innerBand - pixelSize); //top right to down
    }

    function cursorRect(pixel) {

        let x1 = smaller(startPixel[0], pixel[0])
        let y1 = smaller(startPixel[1], pixel[1])
        let x2 = bigger(pixel[0], startPixel[0])
        let y2 = bigger(pixel[1], startPixel[1])

        x1 = x1 * pixelSize + g_offset.x
        y1 = y1 * pixelSize + g_offset.y
        x2 = x2 * pixelSize + g_offset.x
        y2 = y2 * pixelSize + g_offset.y

        let w = Math.floor(x2-x1)
        let h = Math.floor(y2-y1)

        ctx.fillStyle = cursorColor;

        ctx.fillRect(x1, y1, w, pixelSize); //top left to right 
        ctx.fillRect(x1, (y1+h), w, pixelSize); //bottom left to right 
        ctx.fillRect(x1, y1, pixelSize, h); //top left to down
        ctx.fillRect((x1+w), y1, pixelSize, h+pixelSize); //top right to down

        ctx.fillStyle = innerCursorColor;

        ctx.fillRect(x1 + innerBand, y1 + innerBand, w, innerBand); //top left to right 
        ctx.fillRect(x1 + innerBand, (y1+h) + innerBand, w, innerBand); //bottom left to right 
        ctx.fillRect(x1 + innerBand, y1 + innerBand, innerBand, h); //top left to down
        ctx.fillRect((x1+w) + innerBand, y1 + innerBand, innerBand, h + innerBand); //top right to down
    }

    function cursorTriangle(coords,pixel) {
        
        ctx.fillStyle = cursorColor;

        if ((coords[2] >= 0 && coords[2] != null) && (coords[3] >= 0 && coords[3] != null)) {
            drawLineForCursor(cursorColor, pixel[0], pixel[1], coords[0], coords[1])
            drawLineForCursor(cursorColor, coords[2], coords[3], pixel[0], pixel[1])
            drawLineForCursor(cursorColor, coords[0], coords[1], coords[2], coords[3])
        } else if ((coords[0] >= 0 && coords[0] != null) && (coords[1] >= 0 && coords[1] != null)) {
            drawLineForCursor(cursorColor, coords[0], coords[1], pixel[0], pixel[1])
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

        drawCursorCircle(cursorColor, x, y, r)
    }

    function drawCursorCircle(color, centerX, centerY, radius) {
        //https://stackoverflow.com/questions/1022178/how-to-make-a-circle-on-a-grid
        
        
        d = 3 - (2 * radius);
        x = 0;
        y = radius;
    
        do {
            ctx.fillStyle = color;
            ctx.fillRect((centerX + x) * pixelSize + g_offset.x, (centerY + y) * pixelSize + g_offset.y, pixelSize, pixelSize);
            ctx.fillRect((centerX + x) * pixelSize + g_offset.x, (centerY - y) * pixelSize + g_offset.y, pixelSize, pixelSize);
            ctx.fillRect((centerX - x) * pixelSize + g_offset.x, (centerY + y) * pixelSize + g_offset.y, pixelSize, pixelSize);
            ctx.fillRect((centerX - x) * pixelSize + g_offset.x, (centerY - y) * pixelSize + g_offset.y, pixelSize, pixelSize);
            ctx.fillRect((centerX + y) * pixelSize + g_offset.x, (centerY + x) * pixelSize + g_offset.y, pixelSize, pixelSize);
            ctx.fillRect((centerX + y) * pixelSize + g_offset.x, (centerY - x) * pixelSize + g_offset.y, pixelSize, pixelSize);
            ctx.fillRect((centerX - y) * pixelSize + g_offset.x, (centerY + x) * pixelSize + g_offset.y, pixelSize, pixelSize);
            ctx.fillRect((centerX - y) * pixelSize + g_offset.x, (centerY - x) * pixelSize + g_offset.y, pixelSize, pixelSize);

            ctx.fillStyle = innerCursorColor;
            ctx.fillRect((centerX + x) * pixelSize + g_offset.x + innerBand, (centerY + y) * pixelSize + g_offset.y + innerBand, innerBand, innerBand);
            ctx.fillRect((centerX + x) * pixelSize + g_offset.x + innerBand, (centerY - y) * pixelSize + g_offset.y + innerBand, innerBand, innerBand);
            ctx.fillRect((centerX - x) * pixelSize + g_offset.x + innerBand, (centerY + y) * pixelSize + g_offset.y + innerBand, innerBand, innerBand);
            ctx.fillRect((centerX - x) * pixelSize + g_offset.x + innerBand, (centerY - y) * pixelSize + g_offset.y + innerBand, innerBand, innerBand);
            ctx.fillRect((centerX + y) * pixelSize + g_offset.x + innerBand, (centerY + x) * pixelSize + g_offset.y + innerBand, innerBand, innerBand);
            ctx.fillRect((centerX + y) * pixelSize + g_offset.x + innerBand, (centerY - x) * pixelSize + g_offset.y + innerBand, innerBand, innerBand);
            ctx.fillRect((centerX - y) * pixelSize + g_offset.x + innerBand, (centerY + x) * pixelSize + g_offset.y + innerBand, innerBand, innerBand);
            ctx.fillRect((centerX - y) * pixelSize + g_offset.x + innerBand, (centerY - x) * pixelSize + g_offset.y + innerBand, innerBand, innerBand);
            /* ctx.fillRect(x * pixelSize + g_offset.x + innerBand, y * pixelSize + g_offset.y + innerBand, innerBand, innerBand); */
            if (d < 0) {
                d = d + (4 * x) + 12;
            } else {
                d = d + 4 * (x - y) + 10;
                y--;
            }
            x++;
        } while (x <= y);
    }

    function cursorShapeColor(pixel) {

        let x = pixel[0]
        let y = pixel[1]

        for (let i = shapes.length; i >= 0; i -= 6) {

            let tool_type = shapes[i+0]
            let hex_color = shapes[i+1]
            let x1 = shapes[i+2]
            let y1 = shapes[i+3]
            let x2 = shapes[i+4]
            let y2 = shapes[i+5]

            if (insideRect(x,y,x1,y1,x2,y2)) {
                if (tool_type == "rectF") {
                    ctx.fillStyle = color;
                    ctx.fillRect(x1 * pixelSize + g_offset.x, y1 * pixelSize + g_offset.y, x2 * pixelSize, y2 * pixelSize);
                    ctx.fill()
                    break
                } else if (tool_type == "rect") {
                    if (!insideRect(x,y,x1+1,y1+1,x2-2,y2-2)) {
                    ctx.fillStyle = color;
    
                    ctx.fillRect(x1 * pixelSize + g_offset.x, y1 * pixelSize + g_offset.y, x2 * pixelSize, pixelSize); //top left right 
                    ctx.fillRect(x1 * pixelSize + g_offset.x, (y1+y2-1) * pixelSize + g_offset.y, x2 * pixelSize, pixelSize); //bottom left right 
                    ctx.fillRect(x1 * pixelSize + g_offset.x, y1 * pixelSize + g_offset.y, pixelSize, y2 * pixelSize); //top left down
                    ctx.fillRect((x1+x2-1) * pixelSize + g_offset.x, y1 * pixelSize + g_offset.y, pixelSize, y2 * pixelSize); //top right down
    
                    ctx.fill()
                    break
                    }
                }
            } 
            
            if (tool_type == "line") {
                if (insideLine(x,y,x1,y1,x2,y2)) {
                    drawLine(color,x1,y1,x2,y2)
                    break
                }
            } else if (tool_type == "triangle") {
                if (insideLine(x,y,shapes[i+2][0],shapes[i+2][1],shapes[i+3][0],shapes[i+3][1])
                || insideLine(x,y,shapes[i+3][0],shapes[i+3][1],shapes[i+4][0],shapes[i+4][1])
                || insideLine(x,y,shapes[i+4][0],shapes[i+4][1],shapes[i+2][0],shapes[i+2][1])
                ) {
                    ctx.fillStyle = color;

                    drawLine(color,shapes[i+2][0],shapes[i+2][1],shapes[i+3][0],shapes[i+3][1])
                    drawLine(color,shapes[i+3][0],shapes[i+3][1],shapes[i+4][0],shapes[i+4][1])
                    drawLine(color,shapes[i+4][0],shapes[i+4][1],shapes[i+2][0],shapes[i+2][1])

                    break
                }
            } else if (tool_type == "triangleF") {
                if (insideTriangle(pixel, shapes[i+2], shapes[i+3], shapes[i+4])) {
                    ctx.fillStyle = color;

                    drawFilledTriangle(color, shapes[i+2], shapes[i+3], shapes[i+4])

                    break
                }
            } else if (tool_type == "circle") {
                if (insideCircle(x,y,x1,y1,x2)) {
                    drawCircle(color,x1,y1,x2)

                    break
                }
            } else if (tool_type == "circleF") {
                if (insideCircleF(x,y,x1,y1,x2)) {
                    drawCircleF(color,x1,y1,x2)

                    break
                }
            } else if (tool_type == "text") {
                if (insideRect(x,y,x1,y1,x2.length*5-1,5)) {
                    drawText(color, x1-1, y1-1, x2)
                    break
                }
            }
            
        }
    }

    function cursorBucketColor(pixel) {
        let lets_change;

        let x = pixel[0]
        let y = pixel[1]

        for (let i = shapes.length; i >= 0; i -= 6) {
            
            let tool_type = shapes[i+0]
            let hex_color = shapes[i+1]
            let x1 = shapes[i+2]
            let y1 = shapes[i+3]
            let x2 = shapes[i+4]
            let y2 = shapes[i+5]

            if (tool_type == "line") {
                if (insideLine(x,y,x1,y1,x2,y2)) {
                    lets_change = hex_color
                    break
                }
            } else if (tool_type == "rect") {
                if (insideRect(x,y,x1,y1,x2,y2)) {
                    if (!insideRect(x,y,x1+1,y1+1,x2-2,y2-2)) {
                        lets_change = hex_color
                        break
                    }
                }
            } else if (tool_type == "rectF") {
                if (insideRect(x,y,x1,y1,x2,y2)) {
                    lets_change = hex_color
                    break
                }
            } else if (tool_type == "triangle") {
                if (insideLine(x,y,shapes[i+2][0],shapes[i+2][1],shapes[i+3][0],shapes[i+3][1])
                    || insideLine(x,y,shapes[i+3][0],shapes[i+3][1],shapes[i+4][0],shapes[i+4][1])
                    || insideLine(x,y,shapes[i+4][0],shapes[i+4][1],shapes[i+2][0],shapes[i+2][1])
                    ) {
                    lets_change = hex_color
                    break
                }
            } else if (tool_type == "triangleF") {
                if (insideTriangle([x,y], shapes[i+2], shapes[i+3], shapes[i+4])) {
                    lets_change = hex_color
                    break
                }
            } else if (tool_type == "circle") {
                if (insideCircle(x,y,x1,y1,x2)) {
                    lets_change = hex_color
                    break
                }
            } else if (tool_type == "circleF") {
                if (insideCircleF(x,y,x1,y1,x2)) {
                    lets_change = hex_color
                    break
                }
            } else if (tool_type == "text") {
                if (insideRect(x,y,x1,y1,x2.length*5-1,5)) {
                    lets_change = hex_color
                    break
                }
            }
        }
        if (lets_change) {
            for (let i = shapes.length; i >= 0; i -= 6) {
                
                let tool_type = shapes[i+0]
                let hex_color = shapes[i+1]
                let x1 = shapes[i+2]
                let y1 = shapes[i+3]
                let x2 = shapes[i+4]
                let y2 = shapes[i+5]

                if (hex_color == lets_change) {
        
                    if (tool_type == "rectF") {
                        ctx.fillStyle = color;
                        ctx.fillRect(x1 * pixelSize + g_offset.x, y1 * pixelSize + g_offset.y, x2 * pixelSize, y2 * pixelSize);
                        ctx.fill()

                    } else if (tool_type == "rect") {
                        ctx.fillStyle = color;
        
                        ctx.fillRect(x1 * pixelSize + g_offset.x, y1 * pixelSize + g_offset.y, x2 * pixelSize, pixelSize); //top left right 
                        ctx.fillRect(x1 * pixelSize + g_offset.x, (y1+y2-1) * pixelSize + g_offset.y, x2 * pixelSize, pixelSize); //bottom left right 
                        ctx.fillRect(x1 * pixelSize + g_offset.x, y1 * pixelSize + g_offset.y, pixelSize, y2 * pixelSize); //top left down
                        ctx.fillRect((x1+x2-1) * pixelSize + g_offset.x, y1 * pixelSize + g_offset.y, pixelSize, y2 * pixelSize); //top right down
        
                        ctx.fill()

                    } else if (tool_type == "line") {
                        drawLine(color,x1,y1,x2,y2)

                    } else if (tool_type == "triangle") {
                        ctx.fillStyle = color;
    
                        drawLine(color,shapes[i+2][0],shapes[i+2][1],shapes[i+3][0],shapes[i+3][1])
                        drawLine(color,shapes[i+3][0],shapes[i+3][1],shapes[i+4][0],shapes[i+4][1])
                        drawLine(color,shapes[i+4][0],shapes[i+4][1],shapes[i+2][0],shapes[i+2][1])

                    } else if (tool_type == "triangleF") {
                        ctx.fillStyle = color;
    
                        drawFilledTriangle(color,shapes[i+2], shapes[i+3], shapes[i+4])

                    } else if (tool_type == "circle") {
                        drawCircle(color,x1,y1,x2)

                    } else if (tool_type == "circleF") {
                        drawCircleF(color,x1,y1,x2)

                    } else if (tool_type == "text") {
                        drawText(color, x1-1, y1-1, x2)
                    }
                    
                }
            }
        }
    }

    function cursorShape(pixel) { //This cursor finds a shape and hightlights it

        let x = pixel[0]
        let y = pixel[1]

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
                    ctx.fillRect(x1 * pixelSize + g_offset.x, y1 * pixelSize + g_offset.y, x2 * pixelSize, y2 * pixelSize);
                    ctx.fill()
                    break
                } else if (tool_type == "rect") {
                    if (!insideRect(x,y,x1+1,y1+1,x2-2,y2-2)) {
                    ctx.fillStyle = cursorColor;
    
                    ctx.fillRect(x1 * pixelSize + g_offset.x, y1 * pixelSize + g_offset.y, x2*pixelSize, pixelSize); //top left right 
                    ctx.fillRect(x1 * pixelSize + g_offset.x, (y1+y2-1) * pixelSize + g_offset.y, x2*pixelSize, pixelSize); //bottom left right 
                    ctx.fillRect(x1 * pixelSize + g_offset.x, y1 * pixelSize + g_offset.y, pixelSize, y2*pixelSize); //top left down
                    ctx.fillRect((x1+x2-1) * pixelSize + g_offset.x, y1 * pixelSize + g_offset.y, pixelSize, y2*pixelSize); //top right down
    
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
        ctx.imageSmoothingEnabled = false;
        if (!hide_image_checkbox.checked) {
            if (img) {
                ctx.drawImage(img, 0, 0, screenWidth, screenHeight, g_offset.x, g_offset.y, screenWidth * pixelSize, screenHeight * pixelSize);
            }
        }
    }

    function changeGrid() {
        draw()
    }

    function changeRefImg() {
        draw()
    }

    function changeScreenSize(e) {
        let sizeSelect = e.target.value
        let w = sizeSelect.slice(0,1)
        let h = sizeSelect.slice(2,3)

        screenSizeW = 32*w
        screenSizeH = 32*h

        draw()
    }

    function changeColor(e) {
        color = e.target.value
    }

    function clearCanvas() { //draws the big background plane
        //ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawBackground() { //draws the rectangle where the real drawing happens
        ctx.fillStyle = "#000000";
        ctx.fillRect(g_offset.x, g_offset.y, screenSizeW * pixelSize, screenSizeH * pixelSize);
    }

    let button_color = "#D3D2BA"
    function changeTool(e, tool_string) {

        
        if (tool_string) {
            tool = tool_string
        } else if (e.target.id) {
            tool = e.target.id
        }

        inputTextEntered() //this line fixes a bug where input text would stay on screen when changing tools

        document.getElementById("line").style.backgroundColor = button_color
        document.getElementById("rect").style.backgroundColor = button_color
        document.getElementById("rectF").style.backgroundColor = button_color
        document.getElementById("triangle").style.backgroundColor = button_color
        document.getElementById("triangleF").style.backgroundColor = button_color
        document.getElementById("circle").style.backgroundColor = button_color
        document.getElementById("circleF").style.backgroundColor = button_color
        document.getElementById("text").style.backgroundColor = button_color
        document.getElementById("shape_color").style.backgroundColor = button_color
        document.getElementById("bucket_color").style.backgroundColor = button_color
        document.getElementById("eraser").style.backgroundColor = button_color
        document.getElementById("eyedrop").style.backgroundColor = button_color
        document.getElementById("push_back").style.backgroundColor = button_color
        document.getElementById("push_forward").style.backgroundColor = button_color
        document.getElementById("move_shape").style.backgroundColor = button_color

        document.getElementById(tool).style.backgroundColor = "#ac3232"

    }

    function undo() {
        if (eraser_array.length) {
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

    function shape_color_function(x, y) {
        for (let i = shapes.length; i >= 0; i -= 6) {
            
            let tool_type = shapes[i+0]
            let hex_color = shapes[i+1]
            let x1 = shapes[i+2]
            let y1 = shapes[i+3]
            let x2 = shapes[i+4]
            let y2 = shapes[i+5]

            if (tool_type == "line") {
                if (insideLine(x,y,x1,y1,x2,y2)) {
                    shapes[i+1] = color
                    break
                }
            } else if (tool_type == "rect") {
                if (insideRect(x,y,x1,y1,x2,y2)) {
                    if (!insideRect(x,y,x1+1,y1+1,x2-2,y2-2)) {
                        shapes[i+1] = color
                        break
                    }
                }
            } else if (tool_type == "rectF") {
                if (insideRect(x,y,x1,y1,x2,y2)) {
                    shapes[i+1] = color
                    break
                }
            } else if (tool_type == "triangle") {
                if (insideLine(x,y,shapes[i+2][0],shapes[i+2][1],shapes[i+3][0],shapes[i+3][1])
                    || insideLine(x,y,shapes[i+3][0],shapes[i+3][1],shapes[i+4][0],shapes[i+4][1])
                    || insideLine(x,y,shapes[i+4][0],shapes[i+4][1],shapes[i+2][0],shapes[i+2][1])
                    ) {
                    shapes[i+1] = color
                    break
                }
            } else if (tool_type == "triangleF") {
                if (insideTriangle([x,y], shapes[i+2], shapes[i+3], shapes[i+4])) {
                    shapes[i+1] = color
                    break
                }
            } else if (tool_type == "circle") {
                if (insideCircle(x,y,x1,y1,x2)) {
                    shapes[i+1] = color
                    break
                }
            } else if (tool_type == "circleF") {
                if (insideCircleF(x,y,x1,y1,x2)) {
                    shapes[i+1] = color
                    break
                }
            } else if (tool_type == "text") {
                if (insideRect(x,y,x1,y1,x2.length*5-1,5)) {
                    shapes[i+1] = color
                    break
                }
            }
        }
    }

    function bucket_color_function(x, y) {
        let lets_change;

        for (let i = shapes.length; i >= 0; i -= 6) {
            
            let tool_type = shapes[i+0]
            let hex_color = shapes[i+1]
            let x1 = shapes[i+2]
            let y1 = shapes[i+3]
            let x2 = shapes[i+4]
            let y2 = shapes[i+5]

            

            if (tool_type == "line") {
                if (insideLine(x,y,x1,y1,x2,y2)) {
                    lets_change = hex_color
                    break
                }
            } else if (tool_type == "rect") {
                if (insideRect(x,y,x1,y1,x2,y2)) {
                    if (!insideRect(x,y,x1+1,y1+1,x2-2,y2-2)) {
                        lets_change = hex_color
                        break
                    }
                }
            } else if (tool_type == "rectF") {
                if (insideRect(x,y,x1,y1,x2,y2)) {
                    lets_change = hex_color
                    break
                }
            } else if (tool_type == "triangle") {
                if (insideLine(x,y,shapes[i+2][0],shapes[i+2][1],shapes[i+3][0],shapes[i+3][1])
                    || insideLine(x,y,shapes[i+3][0],shapes[i+3][1],shapes[i+4][0],shapes[i+4][1])
                    || insideLine(x,y,shapes[i+4][0],shapes[i+4][1],shapes[i+2][0],shapes[i+2][1])
                    ) {
                    lets_change = hex_color
                    break
                }
            } else if (tool_type == "triangleF") {
                if (insideTriangle([x,y], shapes[i+2], shapes[i+3], shapes[i+4])) {
                    lets_change = hex_color
                    break
                }
            } else if (tool_type == "circle") {
                if (insideCircle(x,y,x1,y1,x2)) {
                    lets_change = hex_color
                    break
                }
            } else if (tool_type == "circleF") {
                if (insideCircleF(x,y,x1,y1,x2)) {
                    lets_change = hex_color
                    break
                }
            } else if (tool_type == "text") {
                if (insideRect(x,y,x1,y1,x2.length*5-1,5)) {
                    lets_change = hex_color
                    break
                }
            }
        }
        if (lets_change) {
            for (let i = shapes.length; i >= 0; i -= 6) {
                let hex_color = shapes[i+1]
                if (hex_color == lets_change) {
                    shapes[i+1] = color
                }
            }
            return
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

    function eyedrop_function(x,y) {

        for (let i = shapes.length; i >= 0; i -= 6) {
            
            let tool_type = shapes[i+0]
            let hex_color = shapes[i+1]
            let x1 = shapes[i+2]
            let y1 = shapes[i+3]
            let x2 = shapes[i+4]
            let y2 = shapes[i+5]

            if (tool_type == "line") {
                if (insideLine(x,y,x1,y1,x2,y2)) {
                    color = hex_color
                    break
                }
            } else if (tool_type == "rect") {
                if (insideRect(x,y,x1,y1,x2,y2)) {
                    if (!insideRect(x,y,x1+1,y1+1,x2-2,y2-2)) {
                        color = hex_color
                        break
                    }
                }
            } else if (tool_type == "rectF") {
                if (insideRect(x,y,x1,y1,x2,y2)) {
                    color = hex_color
                    break
                }
            } else if (tool_type == "triangle") {
                if (insideLine(x,y,shapes[i+2][0],shapes[i+2][1],shapes[i+3][0],shapes[i+3][1])
                    || insideLine(x,y,shapes[i+3][0],shapes[i+3][1],shapes[i+4][0],shapes[i+4][1])
                    || insideLine(x,y,shapes[i+4][0],shapes[i+4][1],shapes[i+2][0],shapes[i+2][1])
                    ) {
                    color = hex_color
                    break
                }
            } else if (tool_type == "triangleF") {
                if (insideTriangle([x,y], shapes[i+2], shapes[i+3], shapes[i+4])) {
                    color = hex_color
                    break
                }
            } else if (tool_type == "circle") {
                if (insideCircle(x,y,x1,y1,x2)) {
                    color = hex_color
                    break
                }
            } else if (tool_type == "circleF") {
                if (insideCircleF(x,y,x1,y1,x2)) {
                    color = hex_color
                    break
                }
            } else if (tool_type == "text") {
                if (insideRect(x,y,x1,y1,x2.length*5-1,5)) {
                    color = hex_color
                    break
                }
            }
        }

        color_select.value = color
    }

    function push_back_function(x,y) {

        for (let i = shapes.length; i >= 0; i -= 6) {
            
            let tool_type = shapes[i+0]
            let hex_color = shapes[i+1]
            let x1 = shapes[i+2]
            let y1 = shapes[i+3]
            let x2 = shapes[i+4]
            let y2 = shapes[i+5]

            if (i <= 5) { //if there is no shape to push back to, do nothing.
                return
            }

            if (tool_type == "line") {
                if (insideLine(x,y,x1,y1,x2,y2)) {
                    swap_push_back(i)
                    break
                }
            } else if (tool_type == "rect") {
                if (insideRect(x,y,x1,y1,x2,y2)) {
                    if (!insideRect(x,y,x1+1,y1+1,x2-2,y2-2)) {
                        swap_push_back(i)
                        break
                    }
                }
            } else if (tool_type == "rectF") {
                if (insideRect(x,y,x1,y1,x2,y2)) {
                    swap_push_back(i)
                    break
                }
            } else if (tool_type == "triangle") {
                if (insideLine(x,y,shapes[i+2][0],shapes[i+2][1],shapes[i+3][0],shapes[i+3][1])
                    || insideLine(x,y,shapes[i+3][0],shapes[i+3][1],shapes[i+4][0],shapes[i+4][1])
                    || insideLine(x,y,shapes[i+4][0],shapes[i+4][1],shapes[i+2][0],shapes[i+2][1])
                    ) {
                    swap_push_back(i)
                    break
                }
            } else if (tool_type == "triangleF") {
                if (insideTriangle([x,y], shapes[i+2], shapes[i+3], shapes[i+4])) {
                    swap_push_back(i)
                    break
                }
            } else if (tool_type == "circle") {
                if (insideCircle(x,y,x1,y1,x2)) {
                    swap_push_back(i)
                    break
                }
            } else if (tool_type == "circleF") {
                if (insideCircleF(x,y,x1,y1,x2)) {
                    swap_push_back(i)
                    break
                }
            } else if (tool_type == "text") {
                if (insideRect(x,y,x1,y1,x2.length*5-1,5)) {
                    swap_push_back(i)
                    break
                }
            }
        }
    }

    function push_forward_function(x,y) {

        for (let i = shapes.length; i >= 0; i -= 6) {
            
            let tool_type = shapes[i+0]
            let hex_color = shapes[i+1]
            let x1 = shapes[i+2]
            let y1 = shapes[i+3]
            let x2 = shapes[i+4]
            let y2 = shapes[i+5]

            if (i == shapes.length - 6) {
                continue
            }

            if (tool_type == "line") {
                if (insideLine(x,y,x1,y1,x2,y2)) {
                    swap_push_forward(i)
                    break
                }
            } else if (tool_type == "rect") {
                if (insideRect(x,y,x1,y1,x2,y2)) {
                    if (!insideRect(x,y,x1+1,y1+1,x2-2,y2-2)) {
                        swap_push_forward(i)
                        break
                    }
                }
            } else if (tool_type == "rectF") {
                if (insideRect(x,y,x1,y1,x2,y2)) {
                    swap_push_forward(i)
                    break
                }
            } else if (tool_type == "triangle") {
                if (insideLine(x,y,shapes[i+2][0],shapes[i+2][1],shapes[i+3][0],shapes[i+3][1])
                    || insideLine(x,y,shapes[i+3][0],shapes[i+3][1],shapes[i+4][0],shapes[i+4][1])
                    || insideLine(x,y,shapes[i+4][0],shapes[i+4][1],shapes[i+2][0],shapes[i+2][1])
                    ) {
                    swap_push_forward(i)
                    break
                }
            } else if (tool_type == "triangleF") {
                if (insideTriangle([x,y], shapes[i+2], shapes[i+3], shapes[i+4])) {
                    swap_push_forward(i)
                    break
                }
            } else if (tool_type == "circle") {
                if (insideCircle(x,y,x1,y1,x2)) {
                    swap_push_forward(i)
                    break
                }
            } else if (tool_type == "circleF") {
                if (insideCircleF(x,y,x1,y1,x2)) {
                    swap_push_forward(i)
                    break
                }
            } else if (tool_type == "text") {
                if (insideRect(x,y,x1,y1,x2.length*5-1,5)) {
                    swap_push_forward(i)
                    break
                }
            }
        }
    }

    function move_shape_function(pixel) {
        
        
        if (moving_shape_index !== null) {  

            let x = pixel[0]
            let y = pixel[1]
            let i = moving_shape_index

            
            
            let s_tool = shapes[i+0]
            let x1 = shapes[i+2]
            let y1 = shapes[i+3]
            let x2 = shapes[i+4]
            let y2 = shapes[i+5]

            x -= moving_shape_vector[0]
            y -= moving_shape_vector[1]
            

            if (s_tool == "line") {
                shapes[i+2] = x
                shapes[i+3] = y
                shapes[i+4] = x + (x2 - x1)
                shapes[i+5] = y + (y2 - y1)
            } else if (s_tool == "rectF") {
                shapes[i+2] = x
                shapes[i+3] = y
            } else if (s_tool == "rect") {
                shapes[i+2] = x
                shapes[i+3] = y
            } else if (s_tool == "triangle") { //triangles get their coords from tables instead of straight nums
                let x1 = shapes[i+2][0]
                let y1 = shapes[i+2][1]
                let x2 = shapes[i+3][0]
                let y2 = shapes[i+3][1]
                let x3 = shapes[i+4][0]
                let y3 = shapes[i+4][1]

                shapes[i+2][0] = x
                shapes[i+2][1] = y
                shapes[i+3][0] = x + (x2 - x1)
                shapes[i+3][1] = y + (y2 - y1)
                shapes[i+4][0] = x + (x3 - x1)
                shapes[i+4][1] = y + (y3 - y1)
            } else if (s_tool == "triangleF") {
                let x1 = shapes[i+2][0]
                let y1 = shapes[i+2][1]
                let x2 = shapes[i+3][0]
                let y2 = shapes[i+3][1]
                let x3 = shapes[i+4][0]
                let y3 = shapes[i+4][1]

                shapes[i+2][0] = x
                shapes[i+2][1] = y
                shapes[i+3][0] = x + (x2 - x1)
                shapes[i+3][1] = y + (y2 - y1)
                shapes[i+4][0] = x + (x3 - x1)
                shapes[i+4][1] = y + (y3 - y1)
            } else if (s_tool == "circle") {
                shapes[i+2] = x
                shapes[i+3] = y
            } else if (s_tool == "circleF") {
                shapes[i+2] = x
                shapes[i+3] = y
            } else if (s_tool == "text") {
                shapes[i+2] = x
                shapes[i+3] = y
            }
        } else {
            cursorShape(pixel)
        }
    }

    var letters = {
        //each one of this numbers is a square in the 4x5 grid that represents each letter. (0,0) being 1, (4,5) being 20.
        "0": [2,3,5,7,8,9,10,12,13,16,18,19],
        "1": [3,6,7,11,15,19],
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
        "h": [1,4,5,8,9,10,11,12,13,16,17,20],
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
        ctx.fillStyle = color;

        text = text.toLowerCase()

        for (let i = 0; i < text.length; i++) {
    
            let char = text.charAt(i)
    
            for (let key in letters) {
                if (key == char) {
                    for (let l = 0; l < letters[key].length; l++) {
                        let pos = letterPos(letters[key][l])
                        
                        ctx.fillRect((pos[1]+x+(i*5)) * pixelSize + g_offset.x, (pos[2]+y) * pixelSize + g_offset.y, pixelSize, pixelSize);
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
        output.innerHTML = generateOutput(false)

        char_count.innerHTML = generateOutput(true).replaceAll('<br>','\n').length
    }

    function generateOutput(making_copy) {
        //[0]tool, [1]hex_color, [2,3,4,5]coordinates

        //SW screen.draw funky inconsistencies:
        //Lines don't fill the end pixel. Kinda fixed by adding 0.25
        //rect goes one pixel long on h and w. Fixed by substracting 1
        //rectF and triangleF draw differently on AMD vs NVIDIA
        
        output_shapes = [];
        

        if (color_grouping.checked) {

            let colors_org = []; // colors organizer

            // organizing and grouping colors into tables
            for (let i = 0; i < shapes.length; i += 6) {

                let tool_type = shapes[i+0]

                let hex_color = shapes[i+1].toUpperCase()
                let x1 = shapes[i+2]
                let y1 = shapes[i+3]
                let x2 = shapes[i+4]
                let y2 = shapes[i+5]

                let found_color = false
                //scane the whole colors_org table, and if not found, then we create it
                for (let a = 0; a < colors_org.length; a++) {
                    if (colors_org[a][0] == hex_color) {
                        found_color = true
                        break
                    }
                    found_color = false
                }
                if (!found_color) {
                    found_color = true
                    colors_org.push([hex_color])
                }

                //push color into colors_org when not found inside the table
                for (let a = 0; a < colors_org.length; a++) {
                    if (colors_org[a][0] == hex_color) {
                        colors_org[a].push(tool_type, hex_color, x1, y1, x2, y2)
                        break
                    }
                }
            }

            // pushing grouped colors into output_shapes
            for (let i = 0; i < colors_org.length; i++) {
                for (let a = 1; a < colors_org[i].length; a += 6) {
                    let tool_type = colors_org[i][a+0]

                    let hex_color = colors_org[i][a+1]

                    let x1 = colors_org[i][a+2]
                    let y1 = colors_org[i][a+3]
                    let x2 = colors_org[i][a+4]
                    let y2 = colors_org[i][a+5]

                    output_shapes.push(tool_type, hex_color, x1, y1, x2, y2)
                }
            }

        } else {
            output_shapes = shapes
        }


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
            set_color_string = "SC(";
            line_string = "DL(";
            rect_string = "DR(";
            rectF_string = "DRF(";
            triangle_string = "DT(";
            triangleF_string = "DTF(";
            circle_string = "DC(";
            circleF_string = "DCF(";
            text_string = "DTX(";
            
            let to_add = []
            for (let i = 0; i < output_shapes.length; i += 6) {
                let tool_type = output_shapes[i+0]
                if (tool_type == "line" && !inString("DL=S.drawLine", to_add)) {
                    to_add.push("DL=S.drawLine")
                } else if (tool_type == "rect" && !inString("DR=S.drawRect", to_add)) {
                    to_add.push("DR=S.drawRect")
                } else if (tool_type == "rectF" && !inString("DRF=S.drawRectF", to_add)) {
                    to_add.push("DRF=S.drawRectF")
                } else if (tool_type == "triangle" && !inString("DT=S.drawTriangle", to_add)) {
                    to_add.push("DT=S.drawTriangle")
                } else if (tool_type == "triangleF" && !inString("DTF=S.drawTriangleF", to_add)) {
                    to_add.push("DTF=S.drawTriangleF")
                } else if (tool_type == "circle" && !inString("DC=S.drawCircle", to_add)) {
                    to_add.push("DC=S.drawCircle")
                } else if (tool_type == "circleF" && !inString("DCF=S.drawCircleF", to_add)) {
                    to_add.push("DCF=S.drawCircleF")
                } else if (tool_type == "text" && !inString("DTX=S.drawText", to_add)) {
                    to_add.push("DTX=S.drawText")
                }
            }

            final_string = final_string + "S=screen<br>SC=S.setColor<br>"
            for (let i = 0; i < to_add.length; i++) {
                final_string = final_string + to_add[i] + "<br>"
            }
            final_string = final_string + "<br>"

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

        for (let i = 0; i < output_shapes.length; i += 6) {
            

            let tool_type = output_shapes[i+0]
            let hex_color = output_shapes[i+1]
            let x1 = output_shapes[i+2]
            let y1 = output_shapes[i+3]
            let x2 = output_shapes[i+4]
            let y2 = output_shapes[i+5]
            let ty1 = output_shapes[i+2][1] //y's for triangleF
            let ty2 = output_shapes[i+3][1]
            let ty3 = output_shapes[i+4][1]


            if (hex_color !== last_color) {
                let color_string = ""
                if (making_copy) {
                    color_string = set_color_string + hexToRgb(hex_color) + ")"
                } else {
                    let color_flag = "<po style='user-select: none; background-color: " + hex_color + "; color: " + hex_color + "'>_____ </po>"
                    color_string = set_color_string + hexToRgb(hex_color) + ")" + color_flag
                }
                
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
                    tool_string = triangle_string + output_shapes[i+2][0] + "+x" + "," + output_shapes[i+2][1] + "+y" + "," + //continues down
                    output_shapes[i+3][0] + "+x" + "," + output_shapes[i+3][1] + "+y" + "," + output_shapes[i+4][0] + "+x" + "," + output_shapes[i+4][1] + "+y" + ")"
                } else {
                    tool_string = triangle_string + output_shapes[i+2][0] + "," + output_shapes[i+2][1] + "," + //continues down
                    output_shapes[i+3][0] + "," + output_shapes[i+3][1] + "," + output_shapes[i+4][0] + "," + output_shapes[i+4][1] + ")"
                }
            } else if (tool_type == "triangleF") {
                if (shapeF_fix.checked) {
                    ty1 += 0.5
                    ty2 += 0.5
                    ty3 += 0.5
                }
                if (function_mode.checked) {
                    tool_string = triangleF_string + output_shapes[i+2][0] + "+x" + "," + ty1 + "+y" + "," + //continues down
                    output_shapes[i+3][0] + "+x" + "," + ty2 + "+y" + "," + output_shapes[i+4][0] + "+x" + "," + ty3 + "+y" + ")"
                } else {
                    tool_string = triangleF_string + output_shapes[i+2][0] + "," + ty1 + "," + //continues down
                    output_shapes[i+3][0] + "," + ty2 + "," + output_shapes[i+4][0] + "," + ty3 + ")"
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
        return final_string
    }

    function copyText() {
        let generated = generateOutput(true)
        let copy_string = generated.replaceAll('<br>','\n');
        
        navigator.clipboard.writeText(copy_string)
        outputCode()
    }
    
    function downloadToFile(content, filename, contentType) {
        //https://robkendal.co.uk/blog/2020-04-17-saving-text-to-client-side-file-using-vanilla-js
        const a = document.createElement('a');
        const file = new Blob([content], {type: contentType});
        
        a.href= URL.createObjectURL(file);
        a.download = filename;
        a.click();
      
        URL.revokeObjectURL(a.href);
      };

    function saveDataToFile() {
        if (shapes.length > 0) {
            let name = window.prompt("Name your save file","drawing_canvas_save");

            let jsonData = JSON.stringify(shapes);

            if (name) {
                downloadToFile(jsonData, name + '.txt', 'text/plain');
            }
        }
    }

    function loadDataFromFile() {
        var fr=new FileReader();
        fr.onload=function(){
            shapes = []
            shapes = JSON.parse(fr.result)
            clearRedo()
            draw()
            outputCode()
        }
        fr.readAsText(this.files[0]);
    }

    var code_space = document.getElementById("code_space")
    var tools_space = document.getElementById("shapes")
    function resized() {
        let canvas_rect = canvas.getBoundingClientRect()
        let code_rect = code_space.getBoundingClientRect()
        let tools_rect = tools_space.getBoundingClientRect()

        

        canvas.width =  window.innerWidth - code_rect.width - tools_rect.width
        canvas.height = window.innerHeight - canvas_rect.y - 5

        g_offset = {"x": canvas.width/2 - screenWidth/2, "y": canvas.height/2 - screenHeight/2}

        draw()
    }

    resized()

    function find_shape(x,y) {

        for (let i = shapes.length; i >= 0; i -= 6) {
            
            let tool_type = shapes[i+0]
            let hex_color = shapes[i+1]
            let x1 = shapes[i+2]
            let y1 = shapes[i+3]
            let x2 = shapes[i+4]
            let y2 = shapes[i+5]

            if (tool_type == "line") {
                if (insideLine(x,y,x1,y1,x2,y2)) {
                    return i
                }
            } else if (tool_type == "rect") {
                if (insideRect(x,y,x1,y1,x2,y2)) {
                    if (!insideRect(x,y,x1+1,y1+1,x2-2,y2-2)) {
                        return i
                    }
                }
            } else if (tool_type == "rectF") {
                if (insideRect(x,y,x1,y1,x2,y2)) {
                    return i
                }
            } else if (tool_type == "triangle") {
                if (insideLine(x,y,shapes[i+2][0],shapes[i+2][1],shapes[i+3][0],shapes[i+3][1])
                    || insideLine(x,y,shapes[i+3][0],shapes[i+3][1],shapes[i+4][0],shapes[i+4][1])
                    || insideLine(x,y,shapes[i+4][0],shapes[i+4][1],shapes[i+2][0],shapes[i+2][1])
                    ) {
                        return i
                }
            } else if (tool_type == "triangleF") {
                if (insideTriangle([x,y], shapes[i+2], shapes[i+3], shapes[i+4])) {
                    return i
                }
            } else if (tool_type == "circle") {
                if (insideCircle(x,y,x1,y1,x2)) {
                    return i
                }
            } else if (tool_type == "circleF") {
                if (insideCircleF(x,y,x1,y1,x2)) {
                    return i
                }
            } else if (tool_type == "text") {
                if (insideRect(x,y,x1,y1,x2.length*5-1,5)) {
                    return i
                }
            }
        }
    }

    function color_factor_change() {
        let gamaHTML = document.getElementById("gamma_html")
        let gamaFix = document.getElementById("gamma_factor").value
        gamaHTML.innerHTML = "Color Factor: " + gamaFix + " "
        outputCode()
    }
    
});

window.onbeforeunload = e => {
    if (shapes.length > 0) {
        var dialogText = 'Do you really want to leave this site?';
        e.returnValue = dialogText;
        return dialogText;
    }
};

function inString(string, table) {
    for (let i = 0; i < table.length; i++) {
        if (table[i] == string) {
            return true
        }
    }
    return false
}


//For line drawing on a grid
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




function gFix(color) { //by XLjedi
    let gamaFix = document.getElementById("gamma_factor").value
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

function swap_push_back(i) {
    let tool_type = shapes[i+0]
    let hex_color = shapes[i+1]
    let x1 = shapes[i+2]
    let y1 = shapes[i+3]
    let x2 = shapes[i+4]
    let y2 = shapes[i+5]

    let b_tool_type = shapes[i+0-6] //these represent the values of the shape before (that we're going to push forward)
    let b_hex_color = shapes[i+1-6]
    let b_x1 = shapes[i+2-6]
    let b_y1 = shapes[i+3-6]
    let b_x2 = shapes[i+4-6]
    let b_y2 = shapes[i+5-6]

    shapes[i+0-6] = tool_type
    shapes[i+1-6] = hex_color
    shapes[i+2-6] = x1
    shapes[i+3-6] = y1
    shapes[i+4-6] = x2
    shapes[i+5-6] = y2

    shapes[i+0] = b_tool_type
    shapes[i+1] = b_hex_color
    shapes[i+2] = b_x1
    shapes[i+3] = b_y1
    shapes[i+4] = b_x2
    shapes[i+5] = b_y2
}

function swap_push_forward(i) {
    let tool_type = shapes[i+0]
    let hex_color = shapes[i+1]
    let x1 = shapes[i+2]
    let y1 = shapes[i+3]
    let x2 = shapes[i+4]
    let y2 = shapes[i+5]

    let b_tool_type = shapes[i+0+6] //these represent the values of the shape before (that we're going to push back)
    let b_hex_color = shapes[i+1+6]
    let b_x1 = shapes[i+2+6]
    let b_y1 = shapes[i+3+6]
    let b_x2 = shapes[i+4+6]
    let b_y2 = shapes[i+5+6]

    shapes[i+0+6] = tool_type
    shapes[i+1+6] = hex_color
    shapes[i+2+6] = x1
    shapes[i+3+6] = y1
    shapes[i+4+6] = x2
    shapes[i+5+6] = y2

    shapes[i+0] = b_tool_type
    shapes[i+1] = b_hex_color
    shapes[i+2] = b_x1
    shapes[i+3] = b_y1
    shapes[i+4] = b_x2
    shapes[i+5] = b_y2
}