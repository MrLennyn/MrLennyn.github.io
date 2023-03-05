//  This script handles the colapsible option menus, and other stuff


//  Options Menu:

const display_mode = "flex"

var canvas_menu_button = document.getElementById("canvas_menu_button");
var canvas_menu_box = document.getElementById("canvas_options_menu")
const canvas_menu_offset = 25



var code_menu_button = document.getElementById("code_menu_button")
var code_menu_box = document.getElementById("code_options_menu")
const code_menu_offset = -350

window.addEventListener("mouseup", function(e) {
    if (!inRect(e, canvas_menu_button)) {
        if (canvas_menu_box.style.display === "none"){
            if (inRect(e, canvas_menu_box)) {
                canvas_menu_box.style.display = display_mode;
            }
        } else if (canvas_menu_box.style.display === display_mode) {
            if (!inRect(e, canvas_menu_box)) {
                canvas_menu_box.style.display = "none";
            }
        }
    }

    if (!inRect(e, code_menu_button)) {
        if (code_menu_box.style.display === "none"){
            if (inRect(e, code_menu_box)) {
                code_menu_box.style.display = display_mode;
            }
        } else if (code_menu_box.style.display === display_mode) {
            if (!inRect(e, code_menu_box)) {
                code_menu_box.style.display = "none";
            }
        }
    }
});

canvas_menu_button.addEventListener("click", function() {
    button_pos = getOffset(canvas_menu_button, canvas_menu_offset)
    
    canvas_menu_box.style.top = button_pos.top
    canvas_menu_box.style.left = button_pos.left
 
    if (canvas_menu_box.style.display === display_mode) {
        canvas_menu_box.style.display = "none";
    } else {
        canvas_menu_box.style.display = display_mode;
    }
})

code_menu_button.addEventListener("click", function() {
    button_pos = getOffset(code_menu_button, code_menu_offset)
    
    code_menu_box.style.top = button_pos.top
    code_menu_box.style.left = button_pos.left
 
    if (code_menu_box.style.display === display_mode) {
        code_menu_box.style.display = "none";
    } else {
        code_menu_box.style.display = display_mode;
    }
})



// Code Space
const cs_height_offset = 50 //code_space botton offset

var outputCodeWrapper = document.getElementById("outputCode")

window.addEventListener("resize", resized)

function resized() {
    outputCodeRect = outputCodeWrapper.getBoundingClientRect()
    outputCodeWrapper.style.height = window.innerHeight - outputCodeRect.y - cs_height_offset + 'px'
}

resized()

// Input number Ctrl + Z prevention (it also prevents ctrl+z on the whole DOM)

let ctrlDown = false
let ctrlKey = 17
let zKey = 90

document.body.onkeydown = function(e) {
    if (e.keyCode == 17 || e.keyCode == 91) {
        ctrlDown = true;
    }
    if (ctrlDown && e.keyCode == zKey) {
        e.preventDefault()
        return false
    }
}

document.body.onkeyup = function(e) {
    if (e.keyCode == 17 || e.keyCode == 91) {
        ctrlDown = false
    }
}

// Helpers
function getOffset(el, offset) {
    var rect = el.getBoundingClientRect();
    return {
        left: rect.left + window.scrollX + rect.width + offset + 'px',
        top: rect.top + window.scrollY + 'px'
    };
};

function inRect(e, el) {
    var rect = el.getBoundingClientRect();

    var x = e.clientX
    var y = e.clientY
    var rx = rect.left
    var ry = rect.top
    var w = rect.width
    var h = rect.height

    if (x >= rx && x < rx+w && y >= ry && y < ry+h) {
        return true;
    }
};