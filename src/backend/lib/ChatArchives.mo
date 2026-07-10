import Map "mo:core/Map";
import List "mo:core/List";
import Types "../types";
import Time "mo:core/Time";
import Order "mo:core/Order";

module {
  public func getNextId(archives : Map.Map<Nat, Types.ChatArchive>) : Nat {
    var maxId = 0;
    for ((id, _) in archives.entries()) {
      if (id + 1 > maxId) maxId := id + 1;
    };
    maxId
  };

  public func createRecord(
    id : Nat,
    bookId : Nat,
    sessionId : Text,
    title : Text,
  ) : Types.ChatArchive {
    {
      id;
      bookId;
      sessionId;
      title;
      summary = "";
      createdAt = Time.now();
      updatedAt = Time.now();
    }
  };

  public func filterByBook(
    archives : Map.Map<Nat, Types.ChatArchive>,
    bookId : Nat,
  ) : [Types.ChatArchive] {
    var result = List.empty<Types.ChatArchive>();
    for ((_, archive) in archives.entries()) {
      if (archive.bookId == bookId) {
        result.add(archive);
      };
    };
    let arr = result.toArray();
    arr.sort(func(a : Types.ChatArchive, b : Types.ChatArchive) : Order.Order {
      Int.compare(b.updatedAt, a.updatedAt)
    })
  };
};
