const fs = require("fs");
const data = require("./raw.json");

let res = [];
for (let image of Object.keys(data)) {
    res.push(data[image]);
}

fs.writeFileSync("./images.js", `module.exports = ${JSON.stringify(res, null, 4)};`);
