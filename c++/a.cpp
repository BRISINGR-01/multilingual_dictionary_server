#include <fstream>
#include <regex>
#include <iostream>
#include <sqlite3.h>
#include <string>
#include <stdio.h>
#include "json.hpp"
using json = nlohmann::json;

using namespace std;

const char *databaseFileName = "database.sqlite";

static int createDB(string language)
{
  sqlite3 *DB;

  char *messageError;

  string sql = "CREATE TABLE IF NOT EXISTS " + language + " ("
                                                          "ID INTEGER PRIMARY KEY AUTOINCREMENT, "
                                                          "word           TEXT NOT NULL, "
                                                          "pos            TEXT NOT NULL, "
                                                          "senses         TEXT NOT NULL, "
                                                          "display        TEXT NOT NULL, "
                                                          "translations   TEXT NOT NULL, "
                                                          "tags           TEXT,          "
                                                          "origin         TEXT,          "
                                                          "ipa            TEXT,          "
                                                          "forms          TEXT           "
                                                          ");";

  try
  {
    int exit = 0;
    exit = sqlite3_open(databaseFileName, &DB);
    exit = sqlite3_exec(DB, sql.c_str(), NULL, 0, &messageError);
    if (exit != SQLITE_OK)
    {
      cerr << "Error in createTable function." << endl;
      sqlite3_free(messageError);
    }
    else
      sqlite3_close(DB);
  }
  catch (const exception &e)
  {
    cerr << e.what();
  }

  return 0;
}

std::vector<std::string> resplit(const std::string &s, const std::regex &sep_regex = std::regex{"\\s+"})
{
  std::sregex_token_iterator iter(s.begin(), s.end(), sep_regex, -1);
  std::sregex_token_iterator end;
  return {iter, end};
}

static int insertData(string data[9], string language)
{
  sqlite3 *DB;
  char *messageError;

  for (int i = 0; i < 9; i++)
  {
    regex rgx("'");
    data[i] = regex_replace(data[i], rgx, "`");
  }

  string sql("INSERT INTO " + language + " (word, pos, senses, display, translations, tags, origin, ipa, forms) VALUES('" + data[0] + "', '" + data[1] + "', '" + data[2] + "', '" + data[3] + "', '" + data[4] + "', '" + data[5] + "', '" + data[6] + "', '" + data[7] + "', '" + data[8] + "');");

  int exit = sqlite3_open(databaseFileName, &DB);
  exit = sqlite3_exec(DB, sql.c_str(), NULL, 0, &messageError);
  if (exit != SQLITE_OK)
  {
    cerr << "Error in insertData function." << endl;
    sqlite3_free(messageError);
  }

  return 0;
}

string *parse(string text)
{
  const char *wordObject = text.c_str();

  json data = json::parse(text);

  try
  {
    /* code */
  }
  catch (const std::exception &e)
  {
    std::cerr << e.what() << '\n';
  }

  string word = data["word"];
  string pos = data["pos"];
  string expansion = data["head_templates"].is_array() ? data["head_templates"][0]["expansion"].get<string>() : word;
  string origin = data["etymology_text"];

  string senses = "";
  string translations = "";

  // Value &raw_senses = d["senses"];

  // for (int i = 0; i < raw_senses.Size(); i++)
  // {
  //   Value &sense = raw_senses[i];
  //   if (!sense.HasMember("raw_glosses") && !sense.HasMember("glosses")) continue;
  //   string meaning = "";
  //   Value &glosses = sense.HasMember("raw_glosses") ? sense["raw_glosses"] : sense["glosses"];

  //   for (int i = 0; i < glosses.Size(); i++)
  //   {
  //     string gloss = glosses[i].GetString();
  //     meaning += gloss;

  //     regex rgx_remove_1("\\s?\\(.+?\\)\\s?|\\.|\\?|\\!");

  //     string tr = regex_replace(gloss, rgx_remove_1, "");

  //     regex rgx_split("\\sor\\s|,|;|\\/");
  //     vector<string> a = resplit(tr, rgx_split);

  //     regex rgx_remove_2("^to\\s|^[A,a]n?\\s");
  //     for (int i = 0; i < a.size(); i++)
  //     {
  //       a[i].erase(a[i].find_last_not_of(' ') + 1);
  //       a[i].erase(0, a[i].find_first_not_of(' '));
  //       a[i] = regex_replace(a[i], rgx_remove_2, "");

  //       translations += a[i] + ",";
  //     }
  //   }

  //   translations.resize(translations.size() - 1); // remove the last ','
  //   translations += "]";

  //   if (sense.HasMember("examples"))
  //   {
  //     Value &examples = sense["examples"];

  //     for (int i = 0; i < examples.Size(); i++)
  //     {
  //       meaning += "\n\tex: ";
  //       meaning += examples[i].GetObj()["text"].GetString();
  //       if (examples[i].GetObj().HasMember("english"))
  //       {
  //         meaning += "\n\t(en) ";
  //         meaning += examples[i].GetObj()["english"].GetString();
  //       }
  //     }
  //   }

  //   senses += meaning;
  //   if (i != raw_senses.Size() - 1)
  //     senses += "\n";
  // }
  
  string ipa = "";

  if (data["sounds"] != NULL)
  {
    string ipas[10];
    cout << 0 << endl;
    for (int i = 0; i < data["sounds"].size(); i++)
    {
      cout << 1 << endl;
      if (data["sounds"][i]["ipa"] != NULL)
      {
        cout << 2 << endl;
        cout << data["sounds"][i]["ipa"] << endl;
        ipa += data["sounds"][i]["ipa"].get<string>() + "|";
      }
    }
  }
  if (!ipa.empty())
  {
    ipa.resize(ipa.size() - 1); // remove the last '|'
  }

  string *parsedData = new string[9];

  parsedData[0] = word;
  parsedData[1] = pos;
  parsedData[2] = senses;
  parsedData[3] = expansion;
  parsedData[4] = translations;
  parsedData[6] = origin;
  parsedData[7] = ipa;
  parsedData[5] = "tags";
  parsedData[8] = "forms";

  return parsedData;
}

int main()
{
  string rawJSON;

  string language = "Dutch";
  remove("database.sqlite");
  // ifstream MyReadFile("databases/" + language + ".txt");
  ifstream JSONPerLine("a.txt");

  string data[] = {""};

  createDB(language);

  while (getline(JSONPerLine, rawJSON))
  {
    string *data = parse(rawJSON);
    insertData(data, language);
  }

  JSONPerLine.close();

  return 0;
}
