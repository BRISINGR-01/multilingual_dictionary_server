const { createGzip } = require("node:zlib");
const { pipeline } = require("node:stream");
const fs = require("node:fs");
const path = require("path");
const { Languages } = require("./utilities");

module.exports = async function compress(language) {
	return new Promise((resolve) => {
		const gzip = createGzip();
		const unzipped = Languages.db(language, true);
		const source = fs.createReadStream(Languages.dbUnzipped(language));
		const destination = fs.createWriteStream(unzipped);

		pipeline(source, gzip, destination, (err) => {
			if (err) {
				console.error("An error occurred:", err);
				process.exitCode = 1;
			} else {
				const { size } = fs.statSync(unzipped);

				Languages.setUncompressedSize(language, size / 1024);

				// fs.unlinkSync(unzipped);
			}

			resolve();
		});
	});
};
