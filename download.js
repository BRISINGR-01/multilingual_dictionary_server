const transformer = require("./transformer");
const commands = require("./dbCommands");
const compress = require("./compress");
const fs = require('fs');
// const https = require("https");

const https = {
  get: (_, cb) =>
    cb(
      fs.createReadStream(
        // "databases/kaikki.org-dictionary-French.txt"
        "databases/Tocharian A.txt"
      )
    ),
}; // testing

module.exports = download;

async function download(language) {
  const url = `- https://kaikki.org/dictionary/${language}/words/kaikki.org-dictionary-${language.replace(
    /\s/g,
    ""
  )}.json`;

  let lastLine = "",
    index = 0;

  const db = await commands.init(language);

  return new Promise((resolve) => {
    https.get(url, (stream) => {
      stream.on("data", (chunk) => {
        chunk = chunk.toString();
        let lines = (lastLine + chunk).split("\n");

        lastLine = lines.pop();

        const words = transformer(lines.map(JSON.parse), language);

        for (const i in words) {
          db.run(
            commands.add(words[i], language, index),
            (err) => err && console.log(err, words[i])
          );

          index++;
        }
      });

      stream.on("end", async () => {
        db.close();

        await compress(language);

        resolve();
      });
    });
  });
}
