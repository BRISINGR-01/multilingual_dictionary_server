const transformer = require("./transformer");
const commands = require("./dbCommands");
const compress = require("./compress");
const fs = require("fs");
const { Languages } = require("./utilities");
// const https = require("https");

const https = {
	get: (url, cb) => cb(fs.createReadStream(Languages.raw(url.split("/")[4]))),
}; // development

module.exports = download;

async function download(language) {
	const url = `- https://kaikki.org/dictionary/${language}/words/kaikki.org-dictionary-${language.replace(
		/\s/g,
		""
	)}.json`;

	const db = await commands.create(language);

	return new Promise((resolve) => {
		let residual = "";

		https.get(url, (stream) => {
			stream.on("data", (chunk) => {
				chunk = chunk.toString();
				let lines = (residual + chunk).split("\n");

				residual = lines.pop();

				const words = transformer(lines.map(JSON.parse), language);

				for (const i in words) {
					db.run(commands.add(words[i], language), (err) => {
						if (err) console.log(err, words[i]);
					});
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
