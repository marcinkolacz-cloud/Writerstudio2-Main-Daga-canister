import Map "mo:core/Map";
import List "mo:core/List";
import Types "../types";
import Time "mo:core/Time";
import Order "mo:core/Order";

module {
  public func getNextSessionId(sessions : Map.Map<Nat, Types.ChatSession>) : Nat {
    var maxId = 0;
    for ((id, _) in sessions.entries()) {
      if (id + 1 > maxId) maxId := id + 1;
    };
    maxId;
  };

  public func getNextMessageId(messages : Map.Map<Nat, Types.ChatSessionMessage>) : Nat {
    var maxId = 0;
    for ((id, _) in messages.entries()) {
      if (id + 1 > maxId) maxId := id + 1;
    };
    maxId;
  };

  public func createSessionRecord(
    id : Nat,
    chapterId : Nat,
    title : Text,
  ) : Types.ChatSession {
    {
      id;
      chapterId;
      title;
      createdAt = Time.now();
    };
  };

  public func createMessageRecord(
    id : Nat,
    sessionId : Nat,
    role : Text,
    content : Text,
  ) : Types.ChatSessionMessage {
    {
      id;
      sessionId;
      role;
      content;
      createdAt = Time.now();
    };
  };

  public func filterSessionsByChapter(
    sessions : Map.Map<Nat, Types.ChatSession>,
    chapterId : Nat,
  ) : [Types.ChatSession] {
    var result = List.empty<Types.ChatSession>();
    for ((_, session) in sessions.entries()) {
      if (session.chapterId == chapterId) {
        result.add(session);
      };
    };
    let arr = result.toArray();
    arr.sort(func(a : Types.ChatSession, b : Types.ChatSession) : Order.Order {
      Int.compare(a.createdAt, b.createdAt);
    });
  };

  public func filterMessagesBySession(
    messages : Map.Map<Nat, Types.ChatSessionMessage>,
    sessionId : Nat,
  ) : [Types.ChatSessionMessage] {
    var result = List.empty<Types.ChatSessionMessage>();
    for ((_, message) in messages.entries()) {
      if (message.sessionId == sessionId) {
        result.add(message);
      };
    };
    let arr = result.toArray();
    arr.sort(func(a : Types.ChatSessionMessage, b : Types.ChatSessionMessage) : Order.Order {
      Int.compare(a.createdAt, b.createdAt);
    });
  };

  public func getMessageIdsBySession(
    messages : Map.Map<Nat, Types.ChatSessionMessage>,
    sessionId : Nat,
  ) : [Nat] {
    var result = List.empty<Nat>();
    for ((id, message) in messages.entries()) {
      if (message.sessionId == sessionId) {
        result.add(id);
      };
    };
    result.toArray();
  };
};
