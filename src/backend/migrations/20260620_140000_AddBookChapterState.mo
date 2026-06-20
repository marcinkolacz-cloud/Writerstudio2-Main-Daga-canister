import Map "mo:core/Map";

module {
  public type OldActor = {};

  public type Book = {
    id : Nat;
    ownerId : Principal;
    title : Text;
    description : Text;
    category : Text;
    createdAt : Int;
    updatedAt : Int;
  };

  public type Chapter = {
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

  public type NewActor = {
    books : Map.Map<Nat, Book>;
    chapters : Map.Map<Nat, Chapter>;
    nextBookId : Nat;
    nextChapterId : Nat;
  };

  public func migration(_old : OldActor) : NewActor {
    let newBooks = Map.empty<Nat, Book>();
    let newChapters = Map.empty<Nat, Chapter>();
    {
      books = newBooks;
      chapters = newChapters;
      nextBookId = 0;
      nextChapterId = 0;
    }
  };
};
