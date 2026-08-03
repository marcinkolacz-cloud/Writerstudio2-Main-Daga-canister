import Map "mo:core/Map";
import List "mo:core/List";
import Types "../types";
import BooksLib "../lib/Books";
import Principal "mo:core/Principal";

mixin (
  books : Map.Map<Nat, Types.Book>,
  chapters : Map.Map<Nat, Types.Chapter>,
  booksTrashed : Map.Map<Nat, Int>,
  chaptersTrashed : Map.Map<Nat, Int>,
) {

  public shared ({ caller }) func getBookStats(bookId : Nat) : async { totalWords : Nat; totalChars : Nat; chapterCount : Nat; avgWordsPerChapter : Nat } {
    switch (books.get(bookId)) {
      case (?book) {
        if (Principal.equal(book.ownerId, caller) and booksTrashed.get(bookId) == null) {
          var totalWords = 0;
          var totalChars = 0;
          var chapterCount = 0;
          for ((cid, chapter) in chapters.entries()) {
            if (chapter.bookId == bookId and chaptersTrashed.get(cid) == null) {
              totalWords += chapter.wordCount;
              totalChars += chapter.charCount;
              chapterCount += 1;
            };
          };
          let avgWordsPerChapter = if (chapterCount == 0) 0 else totalWords / chapterCount;
          { totalWords; totalChars; chapterCount; avgWordsPerChapter }
        } else {
          { totalWords = 0; totalChars = 0; chapterCount = 0; avgWordsPerChapter = 0 }
        }
      };
      case null { { totalWords = 0; totalChars = 0; chapterCount = 0; avgWordsPerChapter = 0 } }
    }
  };

  public shared ({ caller }) func getOverallStats() : async { totalBooks : Nat; totalWords : Nat; totalChapters : Nat } {
    var totalBooks = 0;
    var totalWords = 0;
    var totalChapters = 0;
    for ((bid, book) in books.entries()) {
      if (Principal.equal(book.ownerId, caller) and booksTrashed.get(bid) == null) {
        totalBooks += 1;
        for ((cid, chapter) in chapters.entries()) {
          if (chapter.bookId == book.id and chaptersTrashed.get(cid) == null) {
            totalWords += chapter.wordCount;
            totalChapters += 1;
          };
        };
      };
    };
    { totalBooks; totalWords; totalChapters }
  };
}
