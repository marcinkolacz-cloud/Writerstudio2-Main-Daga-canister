import Map "mo:core/Map";
import Types "../types";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  public func getNextId(books : Map.Map<Nat, Types.Book>) : Nat {
    var maxId = 0;
    for ((id, _) in books.entries()) {
      if (id + 1 > maxId) maxId := id + 1;
    };
    maxId
  };

  public func isOwner(book : Types.Book, caller : Principal) : Bool {
    Principal.equal(book.ownerId, caller)
  };

  public func createBookRecord(id : Nat, caller : Principal, title : Text, description : Text, category : Text) : Types.Book {
    let now = Time.now();
    {
      id;
      ownerId = caller;
      title;
      description;
      category;
      ageCategory = "";
      authorSummary = "";
      keyContext = "";
      themes = "";
      characters = "";
      updatedAt = now;
    }
  };

  public func updateBookRecord(book : Types.Book, title : Text, description : Text, category : Text) : Types.Book {
    {
      book with
      title;
      description;
      category;
      updatedAt = Time.now();
    }
  };
};
