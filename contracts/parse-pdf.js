const fs = require('fs');
const pdf = require('pdf-parse');
let dataBuffer = fs.readFileSync('/Users/apple/.gemini/antigravity/brain/0a2a1a97-5e60-4f9e-9e83-41fe6046ef5c/.tempmediaStorage/media_1785989046946.pdf');
pdf(dataBuffer).then(function(data) {
    console.log(data.text);
}).catch(console.error);
