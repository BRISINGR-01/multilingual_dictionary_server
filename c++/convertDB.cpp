#include <fstream>
#include <regex>
#include <iostream>
#include <sqlite3.h>
#include <string>
#include <stdio.h>
#include "include/json.hpp"
#include "wordClasses.hpp"

using json = nlohmann::json;
using namespace std;

const char *databaseFileName = "database.sqlite";
string language = "Dutch";





static int createDB(string language)
{
  sqlite3 *DB;

  char *messageError;

  string sql = "CREATE TABLE " + language + " ("
               "ID INTEGER PRIMARY KEY AUTOINCREMENT,"
               "word           TEXT NOT NULL,"
               "pos            TEXT NOT NULL,"
               "senses         TEXT NOT NULL,"
               "display        TEXT NOT NULL,"
               "translations   TEXT NOT NULL,"
               "tags           TEXT,         "
               "origin         TEXT,         "
               "ipa            TEXT,         "
               "forms          TEXT          "
               ");";

  try
  {
    int exit = 0;
    exit = sqlite3_open(databaseFileName, &DB);
    exit = sqlite3_exec(DB, sql.c_str(), NULL, 0, &messageError);
    if (exit != SQLITE_OK)
    {
      cerr << "Error in createTable function." << endl;
      cerr << messageError << endl;
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



int insertData(string data[9], string language)
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

bool shouldOmit(OriginalWord word) {
  return false;
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
  string origin = data["etymology_text"].is_string() ? data["etymology_text"] : "";
  string senses = "";
  string tags = "";
  string forms = "";
  string translations = "";

  if (data["senses"].is_array())
  {
    for (int i = 0; i < data["senses"].size(); i++)
    {
      if (data["senses"]["raw_glosses"].is_null() && data["senses"]["glosses"].is_null())
        continue;

      string meaning = "";
      string *glosses = {};
      if (data["senses"]["raw_glosses"].is_array())
      {
        glosses = data["senses"]["raw_glosses"].get<string *>();
      }
      else if (data["senses"]["glosses"].is_array())
      {
        glosses = data["senses"]["glosses"].get<string *>();
      }

      for (int i = 0; i < glosses->length(); i++)
      {
        string gloss = glosses[i];
        meaning += gloss;

        regex rgx_remove_1("\\s?\\(.+?\\)\\s?|\\.|\\?|\\!");

        string tr = regex_replace(gloss, rgx_remove_1, "");

        regex rgx_split("\\sor\\s|,|;|\\/");
        vector<string> a = resplit(tr, rgx_split);

        regex rgx_remove_2("^to\\s|^[A,a]n?\\s");
        for (int i = 0; i < a.size(); i++)
        {
          a[i].erase(a[i].find_last_not_of(' ') + 1);
          a[i].erase(0, a[i].find_first_not_of(' '));
          a[i] = regex_replace(a[i], rgx_remove_2, "");

          translations += a[i] + ",";
        }
      }

      translations.resize(translations.size() - 1); // remove the last ','
      translations += "]";

      if (data["senses"]["examples"].is_array())
      {
        for (int i = 0; i < data["senses"]["examples"].size(); i++)
        {
          meaning += "\n\tex: ";
          meaning += data["senses"]["examples"][i]["text"];
          if (data["senses"]["examples"][i]["english"].is_array())
          {
            meaning += "\n\t(en) ";
            meaning += data["senses"]["examples"][i]["english"];
          }
        }
      }

      senses += meaning;
      if (i != data["senses"].size() - 1)
        senses += "\n";
    }
  }

  string ipa = "";

  if (data["sounds"].is_array())
  {
    string ipas[3];
    for (int i = 0; i < data["sounds"].size(); i++)
    {
      if (data["sounds"][i]["ipa"].is_string())
      {
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
  parsedData[5] = tags;
  parsedData[8] = forms;

  return parsedData;
}

int main()
{
  remove("database.sqlite");
  createDB(language);

  // ifstream databaseFile("../databases/kaikki" + language + ".txt");
  ifstream databaseFile("sample.txt");

  string JSONObject;

  while (getline(databaseFile, JSONObject))
  {
    OriginalWord originalWord = OriginalWord(JSONObject);

    cout << originalWord.pos << endl;

    if (shouldOmit(originalWord)) continue;
    
    ParsedWord parsedWord = ParsedWord(originalWord);
  }

  databaseFile.close();

  return 0;
}
