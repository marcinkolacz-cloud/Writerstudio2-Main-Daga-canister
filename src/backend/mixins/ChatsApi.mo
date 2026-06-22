import Map "mo:core/Map";
import Types "../types";
import ChatsLib "../lib/Chats";
import Principal "mo:core/Principal";
import List "mo:core/List";

mixin (
  books : Map.Map<Nat, Types.Book>,
  chapters : Map.Map<Nat, Types.Chapter>,
  chatSessions : Map.Map<Nat, Types.ChatSession>,
  chatMessages : Map.Map<Nat, Types.ChatSessionMessage>,
) {
  func chatsGetBookOwner(chapterId : Nat) : ?Principal {
    switch (chapters.get(chapterId)) {
      case (?chapter) {
        switch (books.get(chapter.bookId)) {
          case (?book) { ?book.ownerId };
          case null { null };
        };
      };
      case null { null };
    };
  };

  func isChatSessionOwner(session : Types.ChatSession, caller : Principal) : Bool {
    switch (chatsGetBookOwner(session.chapterId)) {
      case (?ownerId) { Principal.equal(ownerId, caller) };
      case null { false };
    };
  };

  public shared ({ caller }) func createChatSession(chapterId : Nat, title : Text) : async Nat {
    switch (chatsGetBookOwner(chapterId)) {
      case (?ownerId) {
        if (Principal.equal(ownerId, caller)) {
          let newId = ChatsLib.getNextSessionId(chatSessions);
          let session = ChatsLib.createSessionRecord(newId, chapterId, title);
          chatSessions.add(newId, session);
          newId;
        } else {
          0;
        };
      };
      case null { 0 };
    };
  };

  public shared ({ caller }) func addChatMessage(sessionId : Nat, role : Text, content : Text) : async Nat {
    switch (chatSessions.get(sessionId)) {
      case (?session) {
        if (isChatSessionOwner(session, caller)) {
          let newId = ChatsLib.getNextMessageId(chatMessages);
          let message = ChatsLib.createMessageRecord(newId, sessionId, role, content);
          chatMessages.add(newId, message);
          newId;
        } else {
          0;
        };
      };
      case null { 0 };
    };
  };

  public shared ({ caller }) func getChatSessionsByChapter(chapterId : Nat) : async [Types.ChatSession] {
    switch (chatsGetBookOwner(chapterId)) {
      case (?ownerId) {
        if (Principal.equal(ownerId, caller)) {
          ChatsLib.filterSessionsByChapter(chatSessions, chapterId);
        } else {
          [];
        };
      };
      case null { [] };
    };
  };

  public shared ({ caller }) func getChatMessages(sessionId : Nat) : async [Types.ChatSessionMessage] {
    switch (chatSessions.get(sessionId)) {
      case (?session) {
        if (isChatSessionOwner(session, caller)) {
          ChatsLib.filterMessagesBySession(chatMessages, sessionId);
        } else {
          [];
        };
      };
      case null { [] };
    };
  };

  public shared ({ caller }) func deleteChatSession(sessionId : Nat) : async () {
    switch (chatSessions.get(sessionId)) {
      case (?session) {
        if (isChatSessionOwner(session, caller)) {
          let messageIds = ChatsLib.getMessageIdsBySession(chatMessages, sessionId);
          for (mid in messageIds.vals()) {
            chatMessages.remove(mid);
          };
          chatSessions.remove(sessionId);
        };
      };
      case null {};
    };
  };
};
