
var outputStringArray = []
var outputString = ""

var gamaFix = 1.1

window.addEventListener('load', function() {
document.querySelector('input[type="file"]').addEventListener('change', function() {
    if (this.files && this.files[0]) {

        //to reset the width and height every time a new photo is uploaded
        //we're getting dimensions from the img element, then resizing it smaller, then setting up a canvas with original dimensions to get imageData from
        document.getElementById("myImg").setAttribute("width", " ")
        document.getElementById("myImg").setAttribute("height", " ")

        var img = document.querySelector('img');


        img.onload = () => {
            
            //removing copy buttons
            document.getElementById("buttondiv").innerHTML = ""

            
            var colorArray = [] //holds the colors as a string
            var arrayFinal = [] //holds the final values: [r,g,b,a,x,y,h,w,x1,y1,h1,w1,x2,y2,h2,w,2]
            

            let img_width = img.width;
            let img_height = img.height;
            img.width = 250;
            var canvas = document.getElementById("image_canvas");
            var ctx = canvas.getContext("2d");
            canvas.width = img_width;
            canvas.height = img_height;
            ctx.drawImage(img, 0, 0);
            imgdata = ctx.getImageData(0, 0, img_width, img_height);

            
            let x = -1; //gotta be -1 so position starts at 0
            let y = 0;

            for (let i = 0; i < imgdata.data.length; i += 4) {
                let r = gFix(imgdata.data[i + 0]);
                let g = gFix(imgdata.data[i + 1]);
                let b = gFix(imgdata.data[i + 2]);
                let a = imgdata.data[i + 3];

                //Working on colors, finding every color and pushing it to array (except for alpha 0)
                let current_color = "" + r + g + b + a; //colors will be converted and stored in strings

                if (i>0) { //so it doesn't check below 0
                    let previous_color = "" + gFix(imgdata.data[i-4 + 0]) + gFix(imgdata.data[i-4 + 1]) + gFix(imgdata.data[i-4 + 2]) + imgdata.data[i-4 + 3];

                    if (current_color != previous_color && a != 0) { //if colors don't match and alpha not 0
                        let color_found = false;

                        for (let col = 0; col < colorArray.length; col++) {
                            if (current_color == colorArray[col]) {
                                color_found = true;
                                break;
                            }
                        }

                        if (color_found == false) { //if it is a new color, we push it to the color array
                            colorArray.push(current_color)
                            arrayFinal.push([r,g,b,a])
                        }

                    }
                }
            }

            console.log("Working on rectangles...")
            
            //Working on Lines
            let line_length = 1
            for (let col = 0; col < colorArray.length; col++) { //for every color go through every pixel

                let temp_array = []

                x = -1; //gotta be -1 so position starts at 0
                y = 0;
                for (let i = 0; i < imgdata.data.length; i += 4) {
                    let r = gFix(imgdata.data[i + 0]);
                    let g = gFix(imgdata.data[i + 1]);
                    let b = gFix(imgdata.data[i + 2]);
                    let a = imgdata.data[i + 3];

                    //pixel pos
                    x++;
                    if (x >= img_width) {
                        x = 0;
                        y++;
                    }
                

                    var current_color = "" + r + g + b + a;

                    if (i < imgdata.data.length - 4) {
                        var next_color = "" + gFix(imgdata.data[i+4 + 0]) + gFix(imgdata.data[i+4 + 1]) + gFix(imgdata.data[i+4 + 2]) + imgdata.data[i+4 + 3]
                    } else {
                        next_color = ""
                    }

                    if (current_color == colorArray[col]) { //if color is found in colorarray
                        if (current_color == next_color && x < img_width - 1) {//-1 may no be needed, idk
                            line_length++ //if color and next are equal, line_length increases
                        } else if (line_length > 1) {
                            temp_array.push(x + 1 - line_length); //what does this do?
                            temp_array.push(y);
                            temp_array.push(line_length);
                            line_length = 1;
                        } else { //if it is a single pixel
                            temp_array.push(x);
                            temp_array.push(y);
                            temp_array.push(line_length);
                            line_length = 1;
                        }
                    }

                    

                
                }
                /* console.log(colorArray[col] + " line")
                console.log(temp_array) */

                //Making Rectangles:
                //for every pixel_line in temp_array, check until you find one with the same X value, and a y value that is y1+rectheight = y2
                //when found, we add the height + 1
                //we push it then to the rect_array

                let temp_rect_array = []
                
                for (let i = 0; i < temp_array.length; i += 3) {
                    let lx = temp_array[i + 0];
                    let ly = temp_array[i + 1];
                    let len = temp_array[i + 2];

                    let rectH = 1;
                    
                    for (b = 0; b < temp_array.length; b += 3) {
                        let lx2 = temp_array[b + 0];
                        let ly2 = temp_array[b + 1];
                        let len2 = temp_array[b + 2]; 

                        if (lx == lx2) { //if both lines start at the same X
                            if (ly2 == ly+rectH) {
                                if (len == len2) { //if both lenghts are the same
                                    rectH++;
                                }
                            }
                        }
                    }

                    let inRect = false;
                    for (c = 0; c < temp_rect_array.length; c += 4) {
                        let rx = temp_rect_array[c+0];
                        let ry = temp_rect_array[c+1];
                        let rw = temp_rect_array[c+2];
                        let rh = temp_rect_array[c+3];
                        
                        if (insideRect(lx,ly,rx,ry,rw,rh)){ //if our pixel is inside any rectangle from our temp_rect_array it won't be pushed into the array
                             inRect = true;
                        }
                        
                    }

                    if (!inRect) {
                        
                        temp_rect_array.push(lx); //x
                        temp_rect_array.push(ly); //y
                        temp_rect_array.push(len); //width
                        temp_rect_array.push(rectH); //height
                    }
                }
               /*  console.log(colorArray[col] + " rect");
                console.log(temp_rect_array); */

                //final-array pushing
                for (c = 0; c < arrayFinal.length; c++) {
                    let arrayFinalString = "" + arrayFinal[c][0] + arrayFinal[c][1] + arrayFinal[c][2] + arrayFinal[c][3]
                    if (colorArray[col] == arrayFinalString) {
                        for (v = 0; v < temp_rect_array.length; v++) {
                            let values = temp_rect_array[v]
                            arrayFinal[c].push(values)
                        }
                    }
                }

                
            }
            /* console.log("arrayFinal")
            console.log(arrayFinal) */

             //A Hack: when img is only one color, array comes out empty. Here we make a single square for the whole img to fix that. 
            if (arrayFinal.length == 0) {
                let r = gFix(imgdata.data[0]);
                let g = gFix(imgdata.data[1]);
                let b = gFix(imgdata.data[2]);
                let a = imgdata.data[3];

                console.log(img_width,img_height)
                lulalala = [r,g,b,a,0,0,img_width,img_height]
                //arrayFinal = [r,g,b,a,0,0,img_width,img_height]
                arrayFinal.push([r,g,b,a,0,0,img_width,img_height])
                console.log(arrayFinal)
                
            }

            //outputing to html
            outputString = ""

            for (k = 0; k < arrayFinal.length; k++) {
                outputString = outputString + "{" + arrayFinal[k].join() + "}" + ","
            }

            
            console.log(arrayFinal)
            let renderString = " function onDraw() for i=1,#p do s.setColor(p[i][1],p[i][2],p[i][3],p[i][4]) for w=5,#p[i],4 do s.drawRectF(p[i][w],p[i][w+1],p[i][w+2],p[i][w+3]) end end end"
            outputStringArray = []
            //script division: 4096
            if (outputString.length + renderString.length > 4096) {
                let tableSize = outputString.length;
                let fits = Math.floor((outputString.length + renderString.length) / (4096-renderString.length));

                //dividing array string
                outputString = ""
                let carryOver = false
                let carryOverArray = []

                for (k = 0; k < arrayFinal.length; k++) {
                    let arrayColorLength = arrayFinal[k].join().length

                    console.log(arrayFinal[k].join().length)
                    console.log(arrayFinal[k][0],arrayFinal[k][1],arrayFinal[k][2],arrayFinal[k][3])

                    if (arrayColorLength > 4096-renderString.length-12) {
                        console.log("Color String Error - color array bigger than 4096")

                        var element = document.createElement("h1");
                        element.appendChild(document.createTextNode("Color String Error - Your image is too complex"));
                        document.getElementById('buttondiv').appendChild(element);

                        break
                    }

                    if ((outputString.length + arrayColorLength) < (4096-renderString.length-12)) {
                        
                        outputString = outputString + "{" + arrayFinal[k].join() + "}" + ",";

                        if (carryOver) {
                            for (z = 0; z < carryOverArray.length; z++) {
                                if ((outputString.length + carryOverArray[z].length) < (4096-renderString.length-12)) {
                                    outputString = outputString + "{" + carryOverArray[z].join() + "}" + ",";
                                
                                    console.log("CARRY OVER :")
                                    console.log(carryOverArray[z])
                                    carryOver = false
                                    carryOverArray.splice(z)
                                }
                            } 
                        }
                        if (arrayFinal.length == k+1) {
                            outputString = "s=screen p={" + outputString + "}";
                            outputStringArray.push(outputString+renderString)
                            console.log("added last");
                            outputString = ""
                        }
                    } else {
                        carryOver = true
                        carryOverArray.push(arrayFinal[k])
                        outputString = "s=screen p={" + outputString + "}";
                        outputStringArray.push(outputString+renderString)
                        console.log("added");
                        outputString = ""
                    }
                }
                /* console.log(outputStringArray)
                console.log("fits: " + fits + "+ scripts") */
                /* console.log("carry over final")
                console.log(carryOverArray) */

                //output multiple scripts to html
                for (n = 0; n < outputStringArray.length; n++) {
                    var element = document.createElement("button");
                    element.appendChild(document.createTextNode('copy script ' + (n + 1) ));
                    document.getElementById('buttondiv').appendChild(element);
                }

                //output single script to html
            } else {
                outputString = "s=screen p={" + outputString + "}";
                outputString = outputString + renderString

                var element = document.createElement("button");
                element.appendChild(document.createTextNode('copy script'));
                document.getElementById('buttondiv').appendChild(element);
            }

            document.getElementById("color_count").innerHTML = "Color Count: " + colorArray.length
            document.getElementById("width").innerHTML = "Width: " + canvas.width
            document.getElementById("height").innerHTML = "Height: " + canvas.height

            

            console.log("outputString")
            console.log(outputString)

            
        } //end of onload
        

        //navigator.clipboard.writeText("hello there")
        img.src = URL.createObjectURL(this.files[0]); 
       
    }
    
    document.addEventListener('click', function(evt) {
        /* console.log(evt.target.innerHTML) */
        if (evt.target.tagName == "BUTTON") {
            if (outputStringArray.length > 0) {
                for (n = 0; n < outputStringArray.length; n++) {
                    if (evt.target.innerHTML == "copy script " + (n + 1)) {
                        /* console.log("pressed: " + "copy script " + (n + 1))
                        console.log(outputStringArray[n]) */
                        navigator.clipboard.writeText(outputStringArray[n])
                        evt.target.style.backgroundColor = "rgb(200, 250, 200)"
                        /* console.log("pressed") */
                    }
            
                }
            } else {
                navigator.clipboard.writeText(outputString)
                /* console.log("pressed") */
                evt.target.style.backgroundColor = "rgb(200, 250, 200)"
            }
        }
        
    }, false);



    
});

});

function insideRect(x,y,rx,ry,w,h) {
    if (x >= rx && x < rx+w && y >= ry && y < ry+h) {
        return true;
    }
    return false;

}

function gFix(color) {
    color = Math.floor(color**gamaFix/255**gamaFix*color)
    return color
}
