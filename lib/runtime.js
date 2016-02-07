
function puts() {
    for (var n = 0; n < arguments.length; n++)
        console.log(arguments[n]);
}

module.exports = {
    puts: puts
};
