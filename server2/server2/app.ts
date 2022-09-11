import http, { IncomingMessage, Server, ServerResponse } from "http";
import metacache from "metadata-scraper";
import request from "request";
import cheerio from "cheerio";



const server: Server = http.createServer(
  (req: IncomingMessage, res: ServerResponse) => {
    const urlPromise: Promise<string> = new Promise((resolve, reject) => {
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
      const metaInfo = await metacache(url);
      const { title, description } = metaInfo;
      const resObj: {
        [key: string]: string | string[] | null;
      } = {};
      resObj.title = title || null;
      resObj.desc = description || null;
      const imgPromise: Promise<string[]> = new Promise((resolve, reject) => {
        request(url, (err, response, html) => {
          if (!err && response.statusCode == 200) {
            const info = cheerio.load(html);
            const image = info("img");
            const img = [];
            for (const i of image) {
              img.push(`http:${i.attribs.src}`);
            }
            resolve(img);
          } else {
            res.writeHead(404, { "Content-type": "app/json" });
            return res.end(
              JSON.stringify({ error: "There was an error of some kind" })
            );
          }
        });
      });
      resObj.imgLink = await imgPromise;
      res.writeHead(200, { "Content-type": "app/json" });
      return res.end(JSON.stringify(resObj));
    })();
  }
);

server.listen(3002, () => {
  console.log(`Running at port 3002`);
});