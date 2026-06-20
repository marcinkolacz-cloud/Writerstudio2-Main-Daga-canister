import Map "mo:core/Map";

module {
  public type OldBook = {
    id : Nat;
    ownerId : Principal;
    title : Text;
    description : Text;
    category : Text;
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
  };

  public type OldChatMessage = {
    id : Nat;
    bookId : Nat;
    role : Text;
    content : Text;
    provider : Text;
    createdAt : Int;
  };

  public type OldActor = {
    books : Map.Map<Nat, OldBook>;
    chapters : Map.Map<Nat, OldChapter>;
    analyses : Map.Map<Nat, OldAnalysis>;
    annotations : Map.Map<Nat, OldTextAnnotation>;
    chatMessages : Map.Map<Nat, OldChatMessage>;
    nextBookId : Nat;
    nextChapterId : Nat;
    nextAnalysisId : Nat;
    nextAnnotationId : Nat;
    nextChatMessageId : Nat;
  };

  public type NewBook = {
    id : Nat;
    ownerId : Principal;
    title : Text;
    description : Text;
    category : Text;
    createdAt : Int;
    updatedAt : Int;
  };

  public type NewChapter = {
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

  public type NewAnalysis = {
    id : Nat;
    bookId : Nat;
    chapterId : ?Nat;
    analysisType : Text;
    provider : Text;
    resultContent : Text;
    createdAt : Int;
  };

  public type NewTextAnnotation = {
    id : Nat;
    analysisId : Nat;
    text : Text;
    color : Text;
    explanation : Text;
    proposal : Text;
  };

  public type NewChatMessage = {
    id : Nat;
    bookId : Nat;
    role : Text;
    content : Text;
    provider : Text;
    createdAt : Int;
  };

  public type Comment = {
    id : Nat;
    chapterId : Nat;
    anchorText : Text;
    content : Text;
    createdAt : Int;
  };

  public type NewActor = {
    books : Map.Map<Nat, NewBook>;
    chapters : Map.Map<Nat, NewChapter>;
    analyses : Map.Map<Nat, NewAnalysis>;
    annotations : Map.Map<Nat, NewTextAnnotation>;
    chatMessages : Map.Map<Nat, NewChatMessage>;
    comments : Map.Map<Nat, Comment>;
    nextBookId : Nat;
    nextChapterId : Nat;
    nextAnalysisId : Nat;
    nextAnnotationId : Nat;
    nextChatMessageId : Nat;
    nextCommentId : Nat;
  };

  public func migration(old : OldActor) : NewActor {
    {
      books = old.books;
      chapters = old.chapters;
      analyses = old.analyses;
      annotations = old.annotations;
      chatMessages = old.chatMessages;
      comments = Map.empty<Nat, Comment>();
      nextBookId = old.nextBookId;
      nextChapterId = old.nextChapterId;
      nextAnalysisId = old.nextAnalysisId;
      nextAnnotationId = old.nextAnnotationId;
      nextChatMessageId = old.nextChatMessageId;
      nextCommentId = 0;
    }
  };
}
