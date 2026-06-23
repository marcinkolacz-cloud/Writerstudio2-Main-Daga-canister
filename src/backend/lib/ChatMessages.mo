import Map "mo:core/Map";
import List "mo:core/List";
import Types "../types";
import Time "mo:core/Time";
import Order "mo:core/Order";

module {
  public func getNextId(chatMessages : Map.Map<Nat, Types.ChatMessage>) : Nat {
    var maxId = 0;
    for ((id, _) in chatMessages.entries()) {
      if (id + 1 > maxId) maxId := id + 1;
    };
    maxId
  };

  public func createChatMessageRecord(
    id : Nat,
    bookId : Nat,
    sessionId : Text,
    role : Text,
    content : Text,
    provider : Text,
  ) : Types.ChatMessage {
    {
      id;
      bookId;
      sessionId;
      role;
      content;
      provider;
      createdAt = Time.now();
    }
  };

  public func filterByBook(
    chatMessages : Map.Map<Nat, Types.ChatMessage>,
    bookId : Nat,
  ) : [Types.ChatMessage] {
    var result = List.empty<Types.ChatMessage>();
    for ((_, message) in chatMessages.entries()) {
      if (message.bookId == bookId) {
        result.add(message);
      };
    };
    let arr = result.toArray();
    arr.sort(func(a : Types.ChatMessage, b : Types.ChatMessage) : Order.Order {
      Int.compare(a.createdAt, b.createdAt)
    })
  };
};
