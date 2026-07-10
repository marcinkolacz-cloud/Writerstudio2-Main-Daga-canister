import Map "mo:core/Map";
import Types "../types";
import ChatArchivesLib "../lib/ChatArchives";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

mixin (
  books : Map.Map<Nat, Types.Book>,
  chatArchives : Map.Map<Nat, Types.ChatArchive>,
) {

  func chatArchiveGetBookOwner(bookId : Nat) : ?Principal {
    switch (books.get(bookId)) {
      case (?book) { ?book.ownerId };
      case null { null };
    }
  };

  func isChatArchiveOwner(archive : Types.ChatArchive, caller : Principal) : Bool {
    switch (chatArchiveGetBookOwner(archive.bookId)) {
      case (?ownerId) { Principal.equal(ownerId, caller) };
      case null { false };
    }
  };

  public shared ({ caller }) func createArchive(
    bookId : Nat,
    sessionId : Text,
    title : Text,
  ) : async Nat {
    switch (chatArchiveGetBookOwner(bookId)) {
      case (?ownerId) {
        if (Principal.equal(ownerId, caller)) {
          let newId = ChatArchivesLib.getNextId(chatArchives);
          let archive = ChatArchivesLib.createRecord(newId, bookId, sessionId, title);
          chatArchives.add(newId, archive);
          newId
        } else {
          0
        }
      };
      case null { 0 }
    }
  };

  public shared ({ caller }) func listArchivesByBook(bookId : Nat) : async [Types.ChatArchive] {
    switch (chatArchiveGetBookOwner(bookId)) {
      case (?ownerId) {
        if (Principal.equal(ownerId, caller)) {
          ChatArchivesLib.filterByBook(chatArchives, bookId)
        } else {
          []
        }
      };
      case null { [] }
    }
  };

  public shared ({ caller }) func renameArchive(id : Nat, newTitle : Text) : async Bool {
    switch (chatArchives.get(id)) {
      case (?archive) {
        if (isChatArchiveOwner(archive, caller)) {
          chatArchives.add(id, { archive with title = newTitle; updatedAt = Time.now() });
          true
        } else {
          false
        }
      };
      case null { false }
    }
  };

  public shared ({ caller }) func setArchiveSummary(id : Nat, summary : Text) : async Bool {
    switch (chatArchives.get(id)) {
      case (?archive) {
        if (isChatArchiveOwner(archive, caller)) {
          chatArchives.add(id, { archive with summary; updatedAt = Time.now() });
          true
        } else {
          false
        }
      };
      case null { false }
    }
  };

  public shared ({ caller }) func deleteArchive(id : Nat) : async Bool {
    switch (chatArchives.get(id)) {
      case (?archive) {
        if (isChatArchiveOwner(archive, caller)) {
          chatArchives.remove(id);
          true
        } else {
          false
        }
      };
      case null { false }
    }
  };
};
