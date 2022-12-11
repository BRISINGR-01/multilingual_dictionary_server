#include <iostream>
#include <string>
#include "wordClasses.hpp"
using namespace std;

class Word
{
public:
  string name;
  string pos;
  string senses;
  string expansion;
  string translations;
  string origin;
  string ipa;
  string tags;
  string forms;

  Word(){};
};

OriginalWord::OriginalWord(string jsonObject)
{
  pos = jsonObject;
};

ParsedWord::ParsedWord(OriginalWord origin)
{};
