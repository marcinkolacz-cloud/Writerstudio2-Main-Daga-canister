import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  public type Book = {
    id : Nat;
    ownerId : Principal;
    title : Text;
    description : Text;
    category : Text;
    createdAt : Int;
    updatedAt : Int;
  };

  public type Chapter = {
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
    audioData : Blob;
    createdAt : Int;
  };

  public type ChatMessage = {
    id : Nat;
    bookId : Nat;
    role : Text;
    content : Text;
    provider : Text;
    createdAt : Int;
  };

  public type InviteCodeStatus = { #active; #exhausted; #revoked };

  public type InviteCode = {
    code : Text;
    status : InviteCodeStatus;
    createdAt : Int;
    expiresAt : ?Int;
    maxUses : Nat;
    usedCount : Nat;
    claimedBy : [Principal];
  };

  public type AccessCheckResult = {
    #Admin;
    #ExistingUser;
    #NewUserNeedsCode;
  };
};
