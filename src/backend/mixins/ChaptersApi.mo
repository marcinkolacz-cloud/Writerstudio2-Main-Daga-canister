import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Types "../types";
import ChaptersLib "../lib/Chapters";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Set "mo:core/Set";

mixin (books : Map.Map<Nat, Types.Book>, chapters : Map.Map<Nat, Types.Chapter>) {

  func getBookOwner(bookId : Nat) : ?Principal {
    switch (books.get(bookId)) {
      case (?book) { ?book.ownerId };
      case null { null };
    }
  };

  func isChapterOwner(chapter : Types.Chapter, caller : Principal) : Bool {
    switch (getBookOwner(chapter.bookId)) {
      case (?ownerId) { Principal.equal(ownerId, caller) };
      case null { false };
    }
  };

  public shared ({ caller }) func createChapter(bookId : Nat, title : Text) : async Nat {
    switch (getBookOwner(bookId)) {
      case (?ownerId) {
        if (Principal.equal(ownerId, caller)) {
          var maxOrder = 0;
          var hasChapters = false;
          for ((_, chapter) in chapters.entries()) {
            if (chapter.bookId == bookId) {
              hasChapters := true;
              if (chapter.orderIndex + 1 > maxOrder) maxOrder := chapter.orderIndex + 1;
            };
          };
          let orderIndex = if (hasChapters) maxOrder else 0;

          let newId = ChaptersLib.getNextId(chapters);
          let chapter = ChaptersLib.createChapterRecord(newId, bookId, title, orderIndex);
          chapters.add(newId, chapter);
          newId
        } else {
          0
        }
      };
      case null { 0 }
    }
  };

  public shared ({ caller }) func getChapter(id : Nat) : async ?Types.Chapter {
    switch (chapters.get(id)) {
      case (?chapter) {
        if (isChapterOwner(chapter, caller)) {
          ?chapter
        } else {
          null
        }
      };
      case null { null }
    }
  };

  public shared ({ caller }) func listChaptersByBook(bookId : Nat) : async [Types.Chapter] {
    switch (getBookOwner(bookId)) {
      case (?ownerId) {
        if (Principal.equal(ownerId, caller)) {
          var result = List.empty<Types.Chapter>();
          for ((_, chapter) in chapters.entries()) {
            if (chapter.bookId == bookId) {
              result.add(chapter);
            };
          };
          let arr = result.toArray();
          arr.sort(func(a : Types.Chapter, b : Types.Chapter) : Order.Order {
            Nat.compare(a.orderIndex, b.orderIndex)
          })
        } else {
          []
        }
      };
      case null { [] }
    }
  };

  public shared ({ caller }) func updateChapter(id : Nat, title : Text, content : Text) : async Bool {
    switch (chapters.get(id)) {
      case (?chapter) {
        if (isChapterOwner(chapter, caller)) {
          let updated = ChaptersLib.updateChapterRecord(chapter, title, content);
          chapters.add(id, updated);
          true
        } else {
          false
        }
      };
      case null { false }
    }
  };

  public shared ({ caller }) func deleteChapter(id : Nat) : async Bool {
    switch (chapters.get(id)) {
      case (?chapter) {
        if (isChapterOwner(chapter, caller)) {
          chapters.remove(id);
          true
        } else {
          false
        }
      };
      case null { false }
    }
  };

  public shared ({ caller }) func updateChapterIndents(id : Nat, indentLeft : Nat, indentRight : Nat, indentFirstLine : Nat) : async Bool {
    switch (chapters.get(id)) {
      case (?chapter) {
        if (isChapterOwner(chapter, caller)) {
          let updated = {
            chapter with
            indentLeft;
            indentRight;
            indentFirstLine;
            updatedAt = Time.now();
          };
          chapters.add(id, updated);
          true
        } else {
          false
        }
      };
      case null { false }
    }
  };

  public shared ({ caller }) func reorderChapters(bookId : Nat, orderedIds : [Nat]) : async Bool {
    switch (getBookOwner(bookId)) {
      case (?ownerId) {
        if (Principal.equal(ownerId, caller)) {
          // Collect existing chapter IDs for this book
          var existingIds = List.empty<Nat>();
          for ((_, chapter) in chapters.entries()) {
            if (chapter.bookId == bookId) {
              existingIds.add(chapter.id);
            };
          };
          let existingArr = existingIds.toArray();

          // Validate: same count
          if (existingArr.size() != orderedIds.size()) {
            return false;
          };

          // Validate: same set of IDs
          let existingSet = Set.fromArray<Nat>(existingArr);
          let orderedSet = Set.fromArray<Nat>(orderedIds);
          if (not existingSet.equal(orderedSet)) {
            return false;
          };

          var index = 0;
          for (chapterId in orderedIds.vals()) {
            switch (chapters.get(chapterId)) {
              case (?chapter) {
                if (chapter.bookId == bookId) {
                  let updatedChapter = {
                    chapter with
                    orderIndex = index;
                    updatedAt = Time.now();
                  };
                  chapters.add(chapterId, updatedChapter);
                };
              };
              case null {};
            };
            index += 1;
          };
          true
        } else {
          false
        }
      };
      case null { false }
    }
  };
};
