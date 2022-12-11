#include <string>
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

  Word() {
  };
};

class OriginalWord
{
  public:
  OriginalWord(string jsonData)
  {
    
  };
};