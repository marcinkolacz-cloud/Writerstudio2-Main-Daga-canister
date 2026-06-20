import Principal "mo:core/Principal";

module {
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
    indentLeft : Nat;
    indentRight : Nat;
    indentFirstLine : Nat;
    createdAt : Int;
    updatedAt : Int;
  };
};
