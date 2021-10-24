

window.addEventListener('load', function() {
document.querySelector('input[type="file"]').addEventListener('change', function() {
    if (this.files && this.files[0]) {

        //to reset the width and height every time a new photo is uploaded
        document.getElementById("myImg").setAttribute("width", " ")
        document.getElementById("myImg").setAttribute("height", " ")

        var img = document.querySelector('img');
        

        img.onload = () => {

            console.log(img.width, img.height)
            let img_width = img.width
            let img_height = img.height
            img.width = 250
            var canvas = document.getElementById("image_canvas");
            var ctx = canvas.getContext("2d");
            canvas.width = img_width
            canvas.height = img_height
            ctx.drawImage(img, 0, 0);
            image_data = ctx.getImageData(0, 0, img_width, img_height);
            console.log(image_data)

        }

        img.src = URL.createObjectURL(this.files[0]); // set src to blob url

        
        

        
        
    }
});
});