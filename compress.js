const { createGzip } = require("node:zlib");
const { pipeline } = require("node:stream");
const fs = require("node:fs");
const path = require("path");

function getPath(fileName) {
  return path.resolve(__dirname, "databases", fileName);
}

module.exports = async function compress(language) {
  return new Promise((resolve) => {
    const gzip = createGzip();
    const source = fs.createReadStream(getPath(language + ".sql"));
    const destination = fs.createWriteStream(getPath(language + ".sql.zip"));

    pipeline(source, gzip, destination, (err) => {
      if (err) {
        console.error("An error occurred:", err);
        process.exitCode = 1;
      }

      resolve();

      fs.unlinkSync(getPath(language + ".sql"));
    });

    const sizesData = JSON.parse(
      fs
        .readFileSync(path.resolve(__dirname, "compressionData.json"))
        .toString()
    );

    const { size } = fs.statSync(getPath(language + ".sql"));

    sizesData[language] = size / 1024;

    fs.writeFileSync(
      path.resolve(__dirname, "compressionData.json"),
      JSON.stringify(sizesData)
    );
  });
};
