const fs = require("fs");
const path = require("path");
const http = require("http");
const languagesList = require("./languages.json");
const download = require("./download");


const server = http.createServer(async (req, res) => {
  const request = decodeURI(req.url.replace("/", ""));

  console.log(request);

  if (languagesList.includes(request)) {
    let language = request;

    if (
      !fs.existsSync(
        path.resolve(__dirname, "../", "databases", `${language}.sql.zip`)
      )
    ) {
      // await download(language);
    }


    const file_path = path.resolve(
      __dirname,
      "../",
      "databases",
      `${language}.sql.zip`
    );

      const { size } = fs.statSync(file_path);
    const compressionData = JSON.parse(
      fs
        .readFileSync(path.resolve(__dirname, "compressionData.json"))
        .toString()
    );

    res.writeHead(200, {
      "Content-Encoding": "gzip",
      "Content-Length": size,
      "Conection": "keep-alive",
      "Original-Length": compressionData[language],
    });

    return fs.createReadStream(file_path).pipe(res).on('finish', res.end);
  }

  res.end();
});

server.listen(5500, console.log);
