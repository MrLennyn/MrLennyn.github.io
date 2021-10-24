window.addEventListener("load", () =>{
    const canvas = document.querySelector("#canvas");
    const ctx = canvas.getContext("2d");

    ctx.imageSmoothingEnabled = false;

    let pixelSize = 6

    screenSizeW = 64
    screenSizeH = 64
    
    let screenWidth = screenSizeW*pixelSize
    let screenHeight = screenSizeH*pixelSize
    
    canvas.width = screenSizeW*pixelSize;
    canvas.height = screenSizeH*pixelSize;

    var offsets = canvas.getBoundingClientRect();

    ctx.lineWidth = 1;
    ctx.fillStyle = 'transparent;'
    ctx.strokeStyle = '#ccc';
    for (var x = 0; x < screenWidth; x++) {
        for (var y = 0; y < screenHeight; y++) {
            ctx.strokeRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }
  }
    //variables
    let painting = false;

    function startPosition(e){
        painting = true;
        draw(e);
    }
    function finishedPosition(){
        painting = false;
        //beginPath() is good for handdrawing, may not be needed in pixel art
        ctx.beginPath();
    }
    function draw(e){
        //offsetX is what I should have been suing instead of clientX
        if (!painting) return;
        console.log(Math.floor(e.offsetX/pixelSize), Math.floor(e.offsetY/pixelSize))
        ctx.strokeStyle = "#FF0000"
        ctx.lineWidth = pixelSize;
        ctx.lineCap = "square";

        /* ctx.lineTo(e.clientX-offsets.left, e.clientY-offsets.top);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(e.clientX-offsets.left, e.clientY-offsets.top) */

        ctx.fillRect(Math.floor(e.offsetX),Math.floor(e.offsetY),pixelSize,pixelSize)
        console.log(Math.floor(e.offsetX),Math.floor(e.offsetY))

        /* ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY) */

        /* ctx.beginPath();
        ctx.arc(95, 50, 40, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.end */
    }

    //Event Listeners
    window.addEventListener("resize", resized)
    canvas.addEventListener("mousedown", startPosition);
    canvas.addEventListener("mouseup", finishedPosition);
    canvas.addEventListener("mousemove",draw);

});

function resized() {
    let zoom = (( window.outerWidth - 10 ) / window.innerWidth) * 100;
    console.log("zoom", zoom)
    var offsets = canvas.getBoundingClientRect();
    console.log("top", offsets.top)
    console.log("left", offsets.left)
}