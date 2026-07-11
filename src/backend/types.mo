import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  public type Book = {
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

  public type Chapter = {
    id : Nat;
    bookId : Nat;
    sessionId : Text;
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

  public type Analysis = {
    id : Nat;
    bookId : Nat;
    chapterId : ?Nat;
    analysisType : Text;
    provider : Text;
    resultContent : Text;
    createdAt : Int;
  };

  public type TextAnnotation = {
    id : Nat;
    analysisId : Nat;
    text : Text;
    color : Text;
    explanation : Text;
    proposal : Text;
    alternativeProposal : ?Text;
    approved : Bool;
  };

  public type Comment = {
    id : Nat;
    chapterId : Nat;
    anchorText : Text;
    content : Text;
    createdAt : Int;
  };

  public type Recording = {
    id : Nat;
    chapterId : Nat;
    bookId : Nat;
    voice : Text;
    audioData : [Nat8];
    createdAt : Int;
  };

  public type PendingUpload = {
    id : Nat;
    chapterId : Nat;
    bookId : Nat;
    voice : Text;
    totalChunks : Nat;
    receivedChunks : Nat;
    createdAt : Int;
  };

  public type ChatMessage = {
    id : Nat;
    bookId : Nat;
    sessionId : Text;
    role : Text;
    content : Text;
    provider : Text;
    createdAt : Int;
  };

  public type ChatArchive = {
    id : Nat;
    bookId : Nat;
    sessionId : Text;
    title : Text;
    summary : Text;
    createdAt : Int;
    updatedAt : Int;
  };

  public type ChatSession = {
    id : Nat;
    chapterId : Nat;
    title : Text;
    createdAt : Int;
  };

  public type ChatSessionMessage = {
    id : Nat;
    sessionId : Nat;
    role : Text;
    content : Text;
    createdAt : Int;
  };

  public type InviteCode = {
    code : Text;
    createdAt : Int;
    usedBy : ?Principal;
    usedAt : ?Int;
  };

  public type DailyWritingStat = {
    id : Nat;
    ownerId : Principal;
    bookId : Nat;
    date : Text;
    wordsAdded : Nat;
    wordsRemoved : Nat;
    netWords : Int;
    activeMinutes : Nat;
    sessionCount : Nat;
  };

  public type HourlyActivityStat = {
    id : Nat;
    ownerId : Principal;
    hour : Nat;
    wordsAdded : Nat;
  };

};
