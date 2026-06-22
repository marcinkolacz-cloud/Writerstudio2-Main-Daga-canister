import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  // Old types (from previous migration)
  public type OldBook = {
    id : Nat;
    ownerId : Principal;
    title : Text;
    description : Text;
    category : Text;
    ageCategory : Text;
    authorSummary : Text;
    keyContext : Text;
    themes : Text;
    writingStyle : Text;
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
    indentLeft : Nat;
    indentRight : Nat;
    indentFirstLine : Nat;
    createdAt : Int;
    updatedAt : Int;
  };

  public type OldAnalysis = {
    id : Nat;
    bookId : Nat;
    chapterId : ?Nat;
    analysisType : Text;
    provider : Text;
    resultContent : Text;
    createdAt : Int;
  };

  public type OldTextAnnotation = {
    id : Nat;
    analysisId : Nat;
    text : Text;
    color : Text;
    explanation : Text;
    proposal : Text;
    alternativeProposal : ?Text;
    approved : Bool;
  };

  public type OldChatMessage = {
    id : Nat;
    bookId : Nat;
    role : Text;
    content : Text;
    provider : Text;
    createdAt : Int;
  };

  public type OldComment = {
    id : Nat;
    chapterId : Nat;
    anchorText : Text;
    content : Text;
    createdAt : Int;
  };

  public type OldRecording = {
    id : Nat;
    chapterId : Nat;
    bookId : Nat;
    voice : Text;
    audioData : Blob;
    createdAt : Int;
  };

  public type OldChatSession = {
    id : Nat;
    chapterId : Nat;
    title : Text;
    createdAt : Int;
  };

  public type OldChatSessionMessage = {
    id : Nat;
    sessionId : Nat;
    role : Text;
    content : Text;
    createdAt : Int;
  };

  public type OldInviteCode = {
    code : Text;
    status : { #active; #exhausted; #revoked };
    createdAt : Int;
    expiresAt : ?Int;
    maxUses : Nat;
    usedCount : Nat;
    claimedBy : [Principal];
  };

  public type OldActor = {
    books : Map.Map<Nat, OldBook>;
    chapters : Map.Map<Nat, OldChapter>;
    analyses : Map.Map<Nat, OldAnalysis>;
    annotations : Map.Map<Nat, OldTextAnnotation>;
    chatMessages : Map.Map<Nat, OldChatMessage>;
    comments : Map.Map<Nat, OldComment>;
    recordings : Map.Map<Nat, OldRecording>;
    inviteCodes : Map.Map<Text, OldInviteCode>;
    chatSessions : Map.Map<Nat, OldChatSession>;
    chatSessionMessages : Map.Map<Nat, OldChatSessionMessage>;
    nextBookId : Nat;
    nextChapterId : Nat;
    nextAnalysisId : Nat;
    nextAnnotationId : Nat;
    nextChatMessageId : Nat;
    nextCommentId : Nat;
    nextRecordingId : Nat;
    nextInviteCodeId : Nat;
    nextChatSessionId : Nat;
    nextChatSessionMessageId : Nat;
  };

  // New types
  public type NewBook = OldBook;
  public type NewChapter = OldChapter;
  public type NewAnalysis = OldAnalysis;
  public type NewTextAnnotation = OldTextAnnotation;
  public type NewChatMessage = OldChatMessage;
  public type NewComment = OldComment;
  public type NewRecording = OldRecording;
  public type NewChatSession = OldChatSession;
  public type NewChatSessionMessage = OldChatSessionMessage;

  public type NewInviteCode = {
    code : Text;
    createdAt : Int;
    usedBy : ?Principal;
    usedAt : ?Int;
  };

  public type NewActor = {
    books : Map.Map<Nat, NewBook>;
    chapters : Map.Map<Nat, NewChapter>;
    analyses : Map.Map<Nat, NewAnalysis>;
    annotations : Map.Map<Nat, NewTextAnnotation>;
    chatMessages : Map.Map<Nat, NewChatMessage>;
    comments : Map.Map<Nat, NewComment>;
    recordings : Map.Map<Nat, NewRecording>;
    inviteCodes : Map.Map<Text, NewInviteCode>;
    chatSessions : Map.Map<Nat, NewChatSession>;
    chatSessionMessages : Map.Map<Nat, NewChatSessionMessage>;
    nextBookId : Nat;
    nextChapterId : Nat;
    nextAnalysisId : Nat;
    nextAnnotationId : Nat;
    nextChatMessageId : Nat;
    nextCommentId : Nat;
    nextRecordingId : Nat;
    nextChatSessionId : Nat;
    nextChatSessionMessageId : Nat;
  };

  public func migration(old : OldActor) : NewActor {
    let newInviteCodes = Map.empty<Text, NewInviteCode>();
    for ((code, oldCode) in old.inviteCodes.entries()) {
      let usedBy = if (oldCode.claimedBy.size() > 0) {
        ?oldCode.claimedBy[0]
      } else {
        null
      };
      let usedAt = if (oldCode.claimedBy.size() > 0) {
        ?oldCode.createdAt
      } else {
        null
      };
      let newCode : NewInviteCode = {
        code = oldCode.code;
        createdAt = oldCode.createdAt;
        usedBy;
        usedAt;
      };
      newInviteCodes.add(code, newCode);
    };

    {
      books = old.books;
      chapters = old.chapters;
      analyses = old.analyses;
      annotations = old.annotations;
      chatMessages = old.chatMessages;
      comments = old.comments;
      recordings = old.recordings;
      inviteCodes = newInviteCodes;
      chatSessions = old.chatSessions;
      chatSessionMessages = old.chatSessionMessages;
      nextBookId = old.nextBookId;
      nextChapterId = old.nextChapterId;
      nextAnalysisId = old.nextAnalysisId;
      nextAnnotationId = old.nextAnnotationId;
      nextChatMessageId = old.nextChatMessageId;
      nextCommentId = old.nextCommentId;
      nextRecordingId = old.nextRecordingId;
      nextChatSessionId = old.nextChatSessionId;
      nextChatSessionMessageId = old.nextChatSessionMessageId;
    }
  };
}
