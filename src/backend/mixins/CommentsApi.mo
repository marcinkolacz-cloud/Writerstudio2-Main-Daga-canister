import Map "mo:core/Map";
import Types "../types";
import CommentsLib "../lib/Comments";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

mixin (
  books : Map.Map<Nat, Types.Book>,
  chapters : Map.Map<Nat, Types.Chapter>,
  comments : Map.Map<Nat, Types.Comment>,
  commentsTrashed : Map.Map<Nat, Int>,
) {

  func commentGetBookOwner(chapterId : Nat) : ?Principal {
    switch (chapters.get(chapterId)) {
      case (?chapter) {
        switch (books.get(chapter.bookId)) {
          case (?book) { ?book.ownerId };
          case null { null };
        }
      };
      case null { null };
    }
  };

  func isCommentOwner(comment : Types.Comment, caller : Principal) : Bool {
    switch (commentGetBookOwner(comment.chapterId)) {
      case (?ownerId) { Principal.equal(ownerId, caller) };
      case null { false };
    }
  };

  public shared ({ caller }) func createComment(chapterId : Nat, anchorText : Text, content : Text) : async Nat {
    switch (commentGetBookOwner(chapterId)) {
      case (?ownerId) {
        if (Principal.equal(ownerId, caller)) {
          let newId = CommentsLib.getNextId(comments);
          let comment = CommentsLib.createCommentRecord(newId, chapterId, anchorText, content);
          comments.add(newId, comment);
          newId
        } else {
          0
        }
      };
      case null { 0 }
    }
  };

  public shared ({ caller }) func listCommentsByChapter(chapterId : Nat) : async [Types.Comment] {
    switch (commentGetBookOwner(chapterId)) {
      case (?ownerId) {
        if (Principal.equal(ownerId, caller)) {
          CommentsLib.filterByChapter(comments, chapterId).filter(func(c : Types.Comment) : Bool { commentsTrashed.get(c.id) == null })
        } else {
          []
        }
      };
      case null { [] }
    }
  };

  public shared ({ caller }) func deleteComment(id : Nat) : async Bool {
    switch (comments.get(id)) {
      case (?comment) {
        if (isCommentOwner(comment, caller)) {
          commentsTrashed.add(id, Time.now());
          true
        } else {
          false
        }
      };
      case null { false }
    }
  };

  public shared ({ caller }) func restoreComment(id : Nat) : async Bool {
    switch (comments.get(id)) {
      case (?comment) {
        if (isCommentOwner(comment, caller)) {
          switch (commentsTrashed.get(id)) {
            case (?_) { commentsTrashed.remove(id); true };
            case null { false };
          };
        } else {
          false
        }
      };
      case null { false }
    }
  };

  public shared ({ caller }) func listTrashedCommentsByChapter(chapterId : Nat) : async [Types.Comment] {
    switch (commentGetBookOwner(chapterId)) {
      case (?ownerId) {
        if (Principal.equal(ownerId, caller)) {
          CommentsLib.filterByChapter(comments, chapterId).filter(func(c : Types.Comment) : Bool { commentsTrashed.get(c.id) != null })
        } else {
          []
        }
      };
      case null { [] }
    }
  };

  public shared ({ caller }) func permanentlyDeleteComment(id : Nat) : async Bool {
    switch (comments.get(id)) {
      case (?comment) {
        if (isCommentOwner(comment, caller)) {
          comments.remove(id);
          commentsTrashed.remove(id);
          true
        } else {
          false
        }
      };
      case null { false }
    }
  };
}
