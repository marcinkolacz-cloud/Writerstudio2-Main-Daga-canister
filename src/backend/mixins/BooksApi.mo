import Map "mo:core/Map";
import List "mo:core/List";
import Types "../types";
import BooksLib "../lib/Books";
import Principal "mo:core/Principal";

mixin (books : Map.Map<Nat, Types.Book>, chapters : Map.Map<Nat, Types.Chapter>) {

  public shared ({ caller }) func createBook(title : Text, description : Text, category : Text) : async Nat {
    let newId = BooksLib.getNextId(books);
    let book = BooksLib.createBookRecord(newId, caller, title, description, category);
    books.add(newId, book);
    newId
  };

  public shared ({ caller }) func getBook(id : Nat) : async ?Types.Book {
    switch (books.get(id)) {
      case (?book) {
        if (BooksLib.isOwner(book, caller)) {
          ?book
        } else {
          null
        }
      };
      case null { null }
    }
  };

  public shared ({ caller }) func listBooksByOwner() : async [Types.Book] {
    var result = List.empty<Types.Book>();
    for ((_, book) in books.entries()) {
      if (BooksLib.isOwner(book, caller)) {
        result.add(book);
      };
    };
    result.toArray()
  };

  public shared ({ caller }) func updateBook(id : Nat, title : Text, description : Text, category : Text) : async Bool {
    switch (books.get(id)) {
      case (?book) {
        if (BooksLib.isOwner(book, caller)) {
          let updated = BooksLib.updateBookRecord(book, title, description, category);
          books.add(id, updated);
          true
        } else {
          false
        }
      };
      case null { false }
    }
  };

  public shared ({ caller }) func deleteBook(id : Nat) : async Bool {
    switch (books.get(id)) {
      case (?book) {
        if (BooksLib.isOwner(book, caller)) {
          var idsToDelete = List.empty<Nat>();
          for ((cid, chapter) in chapters.entries()) {
            if (chapter.bookId == id) {
              idsToDelete.add(cid);
            };
          };
          var i = 0;
          while (i < idsToDelete.size()) {
            switch (idsToDelete.get(i)) {
              case (?cid) { chapters.remove(cid); };
              case null {};
            };
            i += 1;
          };
          books.remove(id);
          true
        } else {
          false
        }
      };
      case null { false }
    }
  };
};
