const fs = require("fs");
const path = require("path");
const http = require("http");
const languagesList = require("./languages.json");
const download = require("./download");


const server = http.createServer(async (req, res) => {
  const request = decodeURI(req.url.replace("/", ""));

  console.log(request);

  if (languagesList.includes(request)) {
    const language = request;

    if (
      !fs.existsSync(
        path.resolve(__dirname, "databases", `${language}.sql.zip`)
      )
    ) {
      await download(language);
    }


    const file_path = path.resolve(
      __dirname,
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
      "Original-Length": compressionData[language],
    });

    fs.createReadStream(file_path).pipe(res);

    return res.end();
  }

  res.end();
});

server.listen(3000, console.log);