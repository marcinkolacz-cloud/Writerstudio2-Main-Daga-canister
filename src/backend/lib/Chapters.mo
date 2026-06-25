import Map "mo:core/Map";
import Types "../types";
import Time "mo:core/Time";

module {
  public func getNextId(chapters : Map.Map<Nat, Types.Chapter>) : Nat {
    var maxId = 0;
    for ((id, _) in chapters.entries()) {
      if (id + 1 > maxId) maxId := id + 1;
    };
    maxId
  };

  public func stripHtml(html : Text) : Text {
    var result = "";
    var inTag = false;
    for (c in html.chars()) {
      if (c == '<') { inTag := true; }
      else if (c == '>') { inTag := false; }
      else if (not inTag) { result := result # Text.fromChar(c); };
    };
    result
  };

  public func countWords(text : Text) : Nat {
    var count = 0;
    var inWord = false;
    for (char in text.toIter()) {
      if (char == ' ' or char == '\t' or char == '\n' or char == '\r') {
        inWord := false;
      } else {
        if (not inWord) {
          count += 1;
          inWord := true;
        };
      };
    };
    count
  };

  public func createChapterRecord(id : Nat, bookId : Nat, title : Text, orderIndex : Nat) : Types.Chapter {
    let now = Time.now();
    {
      id;
      bookId;
      sessionId = "";
      title;
      content = "";
      orderIndex;
      wordCount = 0;
      charCount = 0;
      indentLeft = 0;
      indentRight = 0;
      indentFirstLine = 0;
      createdAt = now;
      updatedAt = now;
    }
  };

  public func updateChapterRecord(chapter : Types.Chapter, title : Text, content : Text) : Types.Chapter {
    let plainContent = stripHtml(content);
    let words = countWords(plainContent);
    {
      chapter with
      title;
      content;
      wordCount = words;
      charCount = plainContent.size();
      updatedAt = Time.now();
    }
  };
};
