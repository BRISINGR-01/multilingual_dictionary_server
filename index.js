const fs = require("fs");
const http = require("http");
const languagesList = require("./languages.json");
const download = require("./download");
const { Languages } = require("./utilities");

const server = http.createServer(async (req, res) => {
	const request = req.url.split("/").filter(Boolean);
	const language = request[0];
	const type = request[1];
	console.log(language, type);

	if (!Languages.has(language)) throw new Error("Unsupported language");

	if (type === "db") {
		let languageFile = Languages.db(language);
		if (!languageFile) {
			// await download(language);
			languageFile = Languages.db(language);
		}

		res.writeHead(200, {
			"Content-Encoding": "gzip",
			"Content-Length": fs.statSync(languageFile).size,
			Conection: "keep-alive",
			"Uncompressed-Length": Languages.uncompressedSize(language),
		});

		return fs.createReadStream(languageFile).pipe(res).on("finish", res.end);
	} else if (type === "grammar") {
		const languageFile = Languages.grammar(language);

		if (!languageFile) {
			res.statusCode(404);

			return res.end();
		} else {
			res.writeHead(200, {
				"Content-Encoding": "gzip",
				"Content-Length": fs.statSync(languageFile).size,
				Conection: "keep-alive",
			});

			return fs.createReadStream(languageFile).pipe(res).on("finish", res.end);
		}
	}

	res.end();
});

server.listen(3000, console.log);
