import Map "mo:core/Map";
import Types "../types";
import ChatMessagesLib "../lib/ChatMessages";
import Principal "mo:core/Principal";
import List "mo:core/List";

mixin (
  books : Map.Map<Nat, Types.Book>,
  chatMessages : Map.Map<Nat, Types.ChatMessage>,
) {

  func chatGetBookOwner(bookId : Nat) : ?Principal {
    switch (books.get(bookId)) {
      case (?book) { ?book.ownerId };
      case null { null };
    }
  };

  func isChatMessageOwner(message : Types.ChatMessage, caller : Principal) : Bool {
    switch (chatGetBookOwner(message.bookId)) {
      case (?ownerId) { Principal.equal(ownerId, caller) };
      case null { false };
    }
  };

  public shared ({ caller }) func sendMessage(
    bookId : Nat,
    sessionId : Text,
    role : Text,
    content : Text,
    provider : Text,
  ) : async Nat {
    switch (chatGetBookOwner(bookId)) {
      case (?ownerId) {
        if (Principal.equal(ownerId, caller)) {
          let newId = ChatMessagesLib.getNextId(chatMessages);
          let message = ChatMessagesLib.createChatMessageRecord(newId, bookId, sessionId, role, content, provider);
          chatMessages.add(newId, message);
          newId
        } else {
          0
        }
      };
      case null { 0 }
    }
  };

  public shared ({ caller }) func listMessagesByBook(bookId : Nat) : async [Types.ChatMessage] {
    switch (chatGetBookOwner(bookId)) {
      case (?ownerId) {
        if (Principal.equal(ownerId, caller)) {
          ChatMessagesLib.filterByBook(chatMessages, bookId)
        } else {
          []
        }
      };
      case null { [] }
    }
  };

  public shared ({ caller }) func deleteMessage(id : Nat) : async Bool {
    switch (chatMessages.get(id)) {
      case (?message) {
        if (isChatMessageOwner(message, caller)) {
          chatMessages.remove(id);
          true
        } else {
          false
        }
      };
      case null { false }
    }
  };

  public shared ({ caller }) func clearChat(bookId : Nat) : async Bool {
    switch (chatGetBookOwner(bookId)) {
      case (?ownerId) {
        if (Principal.equal(ownerId, caller)) {
          var idsToRemove = List.empty<Nat>();
          for ((id, message) in chatMessages.entries()) {
            if (message.bookId == bookId) {
              idsToRemove.add(id);
            };
          };
          var i = 0;
          while (i < idsToRemove.size()) {
            switch (idsToRemove.get(i)) {
              case (?mid) { chatMessages.remove(mid); };
              case null {};
            };
            i += 1;
          };
          true
        } else {
          false
        }
      };
      case null { false }
    }
  };
};
