const languages = require("./languages.js");

module.exports = function transformer(words, lang) {
  const parsedWords = [];

  for (const i in words) {
    const word = words[i];

    if (posToExclude.includes(word.pos) || !word.senses) continue;
    if (
      word.head_templates &&
      word.head_templates[0].args["2"]?.includes(" form")
    )
      continue;
    if (word.senses.every(({ glosses }) => !glosses)) continue;

    const [senses, tags, translations] = parseSenses(word, lang);

    if (senses.length === 0) continue;

    const ipas =
      "[" +
      JSON.stringify(
        word["sounds"]
          ?.filter(({ ipa }) => ipa)
          ?.map(
            (sound) =>
              sound.ipa +
              (sound.tags || sound.note ? ` (${sound.tags || sound.note})` : "")
          ) || []
      ).replace(/[\/\[\]]/g, "").replace("'", "\\\`") +
      "]";

    parsedWords.push({
      pos: word.pos,
      word: word.word,
      forms: orderForms(word),
      origin: word.etymology_text?.replace(/'/g, "´"),
      ipas,
      display: getDisplayVersion(word, lang),
      // searchList: getSearchList(word.word),
      senses,
      tags,
      translations,
    });
  }

  return parsedWords;
};

const posToExclude = [
  "character",
  "name",
  "abbrev",
  "affix",
  "circumfix",
  "infix",
  "intrj",
  "suffix",
  "prefix",
  "interfix",
  "punct",
];
const tagsToExclude = [
  "obsolete",
  "misspelling",
  "initialism",
  "pronunciation-spelling",
  "nonstandart",
  "abbreviation",
];

function addToTags(tag, tags, lang) {
  const transformedTag = languages[lang] ? languages[lang].tags[tag] : [];

  if (transformedTag && !tags.includes(transformedTag))
    tags.push(transformedTag);
}

function divideTranslations(translations) {
  return translations
    .map((tr) =>
      tr
        .replace(/\(.+?\)/g, "")
        .split(/\sor\s|,|;|\//)
        .map((t) =>
          t
            .trim()
            .replace(/^to\s/g, "")
            .replace(/\W+/g, " ")
            .replace(/^an?\s/g, "")
        )
    )
    .flat()
    .filter(
      (tr, i, arr) =>
        i === arr.indexOf(tr) && tr.length > 2 && tr.split(" ").length < 3
    );
}

function parseSenses(word, lang) {
  let senses = "",
    tags = [];

  for (const sense of word.senses) {
    if (sense.tags && sense.tags.some((tag) => tagsToExclude.includes(tag)))
      continue;

    sense.tags?.forEach((tag) => addToTags(tag, tags, lang));
    sense.categories?.forEach(({ name }) =>
      addToTags(name, tags, lang)
    );

    senses += (sense.raw_glosses || sense.glosses).join(", ");

    if (sense.examples) {
      senses += "\n" + sense.examples
        .map(({ text, english }) => "\n    * " + (english ? `${text}\n - ${english}` : text))
    }
  }

  return [
    JSON.stringify(senses)
      .replace(/'/g, "´")
      .replace(/\s?\./g, ""),
    JSON.stringify(tags.flat().filter((tag, i) => i === tags.indexOf(tag))),
    JSON.stringify(
      divideTranslations(word.senses.map((sense) => sense.glosses).flat())
    )
      .replace(/'/g, "´")
      .toLowerCase()
      .replace(/\s?\./g, ""),
  ];
}

function getDisplayVersion(word, lang) {
  if (!word.head_templates || !word.head_templates[0]) {
    return word.word;
  }

  return (
    languages[lang]?.orderData(word) ||
    word.head_templates[0].expansion
  );
}

function getSearchList(word) {
  
  
}

function orderForms({ forms, pos, word }, lang) {
  return null;
  const table = languages[lang].formTables[pos];
  if (!table || !forms?.length) return null;

  if (forms.every(({ tags }) => tags.length === 1))
    return [
      ["#", ...forms.map(({ tags }) => tags[0])],
      [word, ...forms.map(({ form }) => form)],
    ];

  if (table.customMethod) return table.customMethod(forms, word);

  const headRow = ["#", ...table.rows.map((row) => row.displayName)];
  return [
    headRow,
    ...table.columns.map((column) => [
      column.displayName,
      ...table.rows.map(
        (row) =>
          forms.find(
            (form) =>
              form.tags.includes(row.tag) && form.tags.includes(column.tag)
          )?.form
      ),
    ]),
  ];
  console.log(table);

  for (const tableName in tables) {
    console.log(tableName, tables[tableName]);
  }

  return forms;
}
