"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const metadata_scraper_1 = __importDefault(require("metadata-scraper"));
const request_1 = __importDefault(require("request"));
const cheerio_1 = __importDefault(require("cheerio"));
/*
implement your server code here
*/
const server = http_1.default.createServer((req, res) => {
    const urlPromise = new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });
        req.on("end", () => {
            resolve(body);
        });
    });
    (async function metadata() {
        const url = await urlPromise;
        const metaInfo = await metadata_scraper_1.default(url);
        const { title, description } = metaInfo;
        const resObj = {};
        resObj.title = title || null;
        resObj.desc = description || null;
        const imgPromise = new Promise((resolve, reject) => {
            request_1.default(url, (err, response, html) => {
                if (!err && response.statusCode == 200) {
                    const info = cheerio_1.default.load(html);
                    const image = info("img");
                    const img = [];
                    for (const i of image) {
                        img.push(`http:${i.attribs.src}`);
                    }
                    resolve(img);
                }
                else {
                    res.writeHead(404, { "Content-type": "app/json" });
                    return res.end(JSON.stringify({ error: "There was an error of some kind" }));
                }
            });
        });
        resObj.imgLink = await imgPromise;
        res.writeHead(200, { "Content-type": "app/json" });
        return res.end(JSON.stringify(resObj));
    })();
});
server.listen(3002, () => {
    console.log(`Running at port 3002`);
});
