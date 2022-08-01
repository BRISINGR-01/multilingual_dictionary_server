const sqlite3 = require("sqlite3");
const path = require("path");

const initCommands = {
  checkIfExists: (lang) =>
    `SELECT name FROM sqlite_master WHERE type='table' AND name='${lang}';`,
  create: (lang) =>
    `CREATE TABLE "${lang}" (
      [id] INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      [word] TEXT NOT NULL,
      [pos] TEXT NOT NULL,
      [display] TEXT NOT NULL,
      [origin] TEXT,
      [ipas] TEXT,
      [senses] TEXT,
      [forms] TEXT,
      [tags] TEXT,
      [translations] TEXT
    );`,
  delete: () => `DROP TABLE "data"`,
};

module.exports = {
  init: async (lang) => {
    const db = new sqlite3.Database(
      path.resolve(__dirname, "databases", `${lang}.sql`)
    );

    await new Promise((resolve) => {
      db.get(initCommands.checkIfExists(lang), (err, res) => {
        if (res) {
          db.exec(initCommands.delete(lang), resolve);
        } else {
          resolve();
        }
      });
    });

    await new Promise((resolve) => db.exec(initCommands.create(lang), resolve));

    return db;
  },
  add: (word, lang, i) =>
    `INSERT INTO '${lang}' (id, word, pos, display, origin, senses, tags, forms, ipas, translations)
      VALUES(${i}, "${word.word}", "${word.pos}", "${
      word.display
    }", ${nullable(word.origin)}, ${nullable(word.senses)}, ${nullable(
      word.tags
    )}, ${nullable(word.forms)}, ${nullable(word.ipas)}, ${nullable(
      word.translations
    )});`,
};

const nullable = (val) => (val ? `'${val}'` : "NULL");
