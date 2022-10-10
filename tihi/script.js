


const ti_input = document.getElementById("ti")
const hi_input = document.getElementById("hi")
const expected_input = document.getElementById("expected")

const partial_result = document.getElementById("partial")
const pallets_result = document.getElementById("pallets")
const loose_result = document.getElementById("loose")

ti_input.addEventListener("input", calculate)
hi_input.addEventListener("input", calculate)
expected_input.addEventListener("input", calculate)

ti_input.addEventListener("focus", sele)
hi_input.addEventListener("focus", sele)
expected_input.addEventListener("focus", sele)

function sele(e) {
    e.target.select()
}
function calculate(e) {
    

    var ti = ti_input.value
    var hi = hi_input.value
    var expected = expected_input.value

    partial_result.innerHTML = "Partial: None"
    pallets_result.innerHTML = "Pallets: None"
    loose_result.innerHTML = "Loose Crates: None"

    if (ti > 0 && hi > 0 && expected > 0) {
        let partial;

        if ( Number.isInteger(expected / (ti * hi)) ) {
            pallets_result.innerHTML = "Pallets: " + expected / (ti * hi)
        } else {
            pallets_result.innerHTML = "Pallets: " + (Math.floor(expected / (ti * hi)) + 1)

            let pal = Math.floor(expected / (ti * hi))
            let crates = expected - ((ti * hi) * pal)
            /* console.log("crates", crates)
            console.log("pal", pal) */
            if ( (expected % (ti)) != 0 ) {

                /* console.log("mod", (expected % (ti * hi)))  */
                /* console.log("Loose", expected % ti) */
                let part = (Math.floor(crates / ti) + 1)

                partial_result.innerHTML = "Partial: " + part + " HI"

                loose_result.innerHTML = "Loose Crates: " + (expected % ti)//((expected % (ti * hi)) - (ti * part))

                /* console.log("Loose", expected % (ti * (Math.floor(crates / ti) + 1))) */

                if (expected % (ti * hi) > ti) {
                    /* loose_result.innerHTML = "Loose Crates: " + expected % (ti * hi) */
                }
            } else {
                console.log("Partial", pal)
                partial_result.innerHTML = "Partial: " + (Math.floor(crates / ti)) + " HI"
                /* partial_result.innerHTML = "Partial: " + 1 + " HI" */
            }

            
        }

        //partial_result.innerHTML = 
    }

    //if (!(ti && hi && expected)) {return}
}