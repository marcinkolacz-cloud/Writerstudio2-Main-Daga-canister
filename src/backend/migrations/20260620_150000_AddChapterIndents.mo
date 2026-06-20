import Map "mo:core/Map";

module {
  public type OldBook = {
    id : Nat;
    ownerId : Principal;
    title : Text;
    description : Text;
    category : Text;
    createdAt : Int;
    updatedAt : Int;
  };

  public type OldChapter = {
    id : Nat;
    bookId : Nat;
    title : Text;
    content : Text;
    orderIndex : Nat;
    wordCount : Nat;
    charCount : Nat;
    createdAt : Int;
    updatedAt : Int;
  };

  public type OldActor = {
    books : Map.Map<Nat, OldBook>;
    chapters : Map.Map<Nat, OldChapter>;
    nextBookId : Nat;
    nextChapterId : Nat;
  };

  public type NewBook = {
    id : Nat;
    ownerId : Principal;
    title : Text;
    description : Text;
    category : Text;
    createdAt : Int;
    updatedAt : Int;
  };

  public type NewChapter = {
    id : Nat;
    bookId : Nat;
    title : Text;
    content : Text;
    orderIndex : Nat;
    wordCount : Nat;
    charCount : Nat;
    indentLeft : Nat;
    indentRight : Nat;
    indentFirstLine : Nat;
    createdAt : Int;
    updatedAt : Int;
  };

  public type NewActor = {
    books : Map.Map<Nat, NewBook>;
    chapters : Map.Map<Nat, NewChapter>;
    nextBookId : Nat;
    nextChapterId : Nat;
  };

  public func migration(old : OldActor) : NewActor {
    let newChapters = old.chapters.map<Nat, OldChapter, NewChapter>(
      func(_id, chapter) {
        {
          chapter with
          indentLeft = 0;
          indentRight = 0;
          indentFirstLine = 0;
        }
      }
    );
    {
      books = old.books;
      chapters = newChapters;
      nextBookId = old.nextBookId;
      nextChapterId = old.nextChapterId;
    }
  };
}
