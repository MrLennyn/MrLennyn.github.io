


const ti_input = document.getElementById("ti")
const hi_input = document.getElementById("hi")
const expected_input = document.getElementById("expected")

const partial_result = document.getElementById("partial")
const pallets_result = document.getElementById("pallets")

ti_input.addEventListener("change", calculate())
hi_input.addEventListener("change", calculate())
expected_input.addEventListener("change", calculate())


function calculate() {
    var ti = ti_input.value
    var hi = hi_input.value
    var expected = expected_input.value

    if (!(ti && hi && expected)) {return}
}