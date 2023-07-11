const fs = require("fs");
const path = require("path");
const languagesList = require("./languages.json");

module.exports.Languages = class Languages {
	static db(language, mustDeliver = false) {
		const p = path.resolve(
			__dirname,
			"../",
			"databases",
			"zip",
			`${language}.sql.zip`
		);

		return mustDeliver || fs.existsSync(p) ? p : null;
	}

	static dbUnzipped(language) {
		return path.resolve(__dirname, "../", "databases", `${language}.sql`);
	}

	static raw(language) {
		const p = path.resolve(__dirname, "../", "kaikki", `${language}.txt`);

		return fs.existsSync(p) ? p : null;
	}

	static grammar(language) {
		const p = path.resolve(
			__dirname,
			"../",
			"grammar",
			"compressed",
			`${language}.tar.gzip`
		);

		return fs.existsSync(p) ? p : null;
	}

	static uncompressedSize(language) {
		return JSON.parse(
			fs
				.readFileSync(path.resolve(__dirname, "compressionData.json"))
				.toString()
		)[language];
	}

	static setUncompressedSize(language, size) {
		console.log(language, size);
		const p = path.resolve(__dirname, "compressionData.json");
		const data = JSON.parse(fs.readFileSync(p).toString());
		data[language] = size;
		fs.writeFileSync(p, JSON.stringify(data));
	}

	static has(language) {
		return languagesList.includes(language);
	}
};
