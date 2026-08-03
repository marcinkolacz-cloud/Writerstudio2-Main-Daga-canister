import Map "mo:core/Map";
import List "mo:core/List";
import Types "../types";
import BooksLib "../lib/Books";
import InvitesLib "../lib/invites";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

mixin (
  books : Map.Map<Nat, Types.Book>,
  chapters : Map.Map<Nat, Types.Chapter>,
  inviteCodes : Map.Map<Text, Types.InviteCode>,
  booksTrashed : Map.Map<Nat, Int>,
  chaptersTrashed : Map.Map<Nat, Int>,
) {

  public shared ({ caller }) func createBook(title : Text, description : Text, category : Text) : async Nat {
    let known = BooksLib.hasBook(books, caller) or InvitesLib.hasRedeemed(inviteCodes, caller);
    if (not known) {
      return 0;
    };
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
    for ((id, book) in books.entries()) {
      if (BooksLib.isOwner(book, caller) and booksTrashed.get(id) == null) {
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

  public shared ({ caller }) func updateBookMetadata(id : Nat, ageCategory : Text, authorSummary : Text, keyContext : Text, themes : Text, writingStyle : Text) : async Bool {
    switch (books.get(id)) {
      case (?book) {
        if (BooksLib.isOwner(book, caller)) {
          let updated = {
            book with
            ageCategory;
            authorSummary;
            keyContext;
            themes;
            writingStyle;
            updatedAt = Time.now();
          };
          books.add(id, updated);
          true
        } else {
          false
        }
      };
      case null { false }
    }
  };

  public shared ({ caller }) func updateBookCharacters(id : Nat, characters : Text) : async Bool {
    switch (books.get(id)) {
      case (?book) {
        if (BooksLib.isOwner(book, caller)) {
          let updated = {
            book with
            characters;
            updatedAt = Time.now();
          };
          books.add(id, updated);
          true
        } else {
          false
        }
      };
      case null { false }
    }
  };

  // SAFETY: this used to permanently destroy the book AND every one of its
  // chapters in one call (books.remove/chapters.remove), with no recovery
  // path — a single misclick could erase an entire novel forever. It now
  // moves everything to trash instead; use permanentlyDeleteBook to
  // actually erase it for good once you're sure.
  public shared ({ caller }) func deleteBook(id : Nat) : async Bool {
    switch (books.get(id)) {
      case (?book) {
        if (BooksLib.isOwner(book, caller)) {
          let now = Time.now();
          for ((cid, chapter) in chapters.entries()) {
            if (chapter.bookId == id and chaptersTrashed.get(cid) == null) {
              chaptersTrashed.add(cid, now);
            };
          };
          booksTrashed.add(id, now);
          true
        } else {
          false
        }
      };
      case null { false }
    }
  };

  public shared ({ caller }) func restoreBook(id : Nat) : async Bool {
    switch (books.get(id)) {
      case (?book) {
        if (BooksLib.isOwner(book, caller)) {
          switch (booksTrashed.get(id)) {
            case (?_) {
              booksTrashed.remove(id);
              // Restores every trashed chapter belonging to this book. If
              // you trashed individual chapters before trashing the whole
              // book, this brings them back too — simpler and more
              // predictable than trying to guess which ones you meant.
              for ((cid, chapter) in chapters.entries()) {
                if (chapter.bookId == id) {
                  switch (chaptersTrashed.get(cid)) {
                    case (?_) { chaptersTrashed.remove(cid) };
                    case null {};
                  };
                };
              };
              true
            };
            case null { false };
          };
        } else {
          false
        }
      };
      case null { false }
    }
  };

  public shared ({ caller }) func listTrashedBooks() : async [Types.Book] {
    var result = List.empty<Types.Book>();
    for ((id, book) in books.entries()) {
      if (BooksLib.isOwner(book, caller) and booksTrashed.get(id) != null) {
        result.add(book);
      };
    };
    result.toArray()
  };

  public shared ({ caller }) func permanentlyDeleteBook(id : Nat) : async Bool {
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
              case (?cid) { chapters.remove(cid); chaptersTrashed.remove(cid); };
              case null {};
            };
            i += 1;
          };
          books.remove(id);
          booksTrashed.remove(id);
          true
        } else {
          false
        }
      };
      case null { false }
    }
  };
};
