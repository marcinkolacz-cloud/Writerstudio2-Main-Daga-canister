import Map "mo:core/Map";

module {
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
    audioData : [Nat8];
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
    createdAt : Int;
    usedBy : ?Principal;
    usedAt : ?Int;
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
    nextChatSessionId : Nat;
    nextChatSessionMessageId : Nat;
    adminPrincipal : ?Principal;
  };

  public type NewBook = {
    id : Nat;
    ownerId : Principal;
    title : Text;
    description : Text;
    category : Text;
    ageCategory : Text;
    authorSummary : Text;
    keyContext : Text;
    themes : Text;
    characters : Text;
    updatedAt : Int;
  };

  public type NewChapter = OldChapter;
  public type NewAnalysis = OldAnalysis;
  public type NewTextAnnotation = OldTextAnnotation;
  public type NewChatMessage = OldChatMessage;
  public type NewComment = OldComment;
  public type NewRecording = OldRecording;
  public type NewChatSession = OldChatSession;
  public type NewChatSessionMessage = OldChatSessionMessage;
  public type NewInviteCode = OldInviteCode;

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
    adminPrincipal : ?Principal;
  };

  public func migration(old : OldActor) : NewActor {
    let newBooks = old.books.map<Nat, OldBook, NewBook>(
      func(_, oldBook) {
        {
          oldBook with
          characters = "";
        }
      }
    );
    {
      old with
      books = newBooks;
    }
  };
}
