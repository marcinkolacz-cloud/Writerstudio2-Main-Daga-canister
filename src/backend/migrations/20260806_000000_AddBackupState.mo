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
    characters : Text;
    updatedAt : Int;
  };

  public type OldChapter = {
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
    sessionId : Text;
    role : Text;
    content : Text;
    provider : Text;
    createdAt : Int;
  };

  public type OldChatArchive = {
    id : Nat;
    bookId : Nat;
    sessionId : Text;
    title : Text;
    summary : Text;
    createdAt : Int;
    updatedAt : Int;
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

  public type OldDailyWritingStat = {
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

  public type OldHourlyActivityStat = {
    id : Nat;
    ownerId : Principal;
    hour : Nat;
    wordsAdded : Nat;
  };

  public type OldPendingUpload = {
    id : Nat;
    chapterId : Nat;
    bookId : Nat;
    voice : Text;
    totalChunks : Nat;
    receivedChunks : Nat;
    createdAt : Int;
  };

  public type OldActor = {
    books : Map.Map<Nat, OldBook>;
    chapters : Map.Map<Nat, OldChapter>;
    analyses : Map.Map<Nat, OldAnalysis>;
    annotations : Map.Map<Nat, OldTextAnnotation>;
    chatMessages : Map.Map<Nat, OldChatMessage>;
    chatArchives : Map.Map<Nat, OldChatArchive>;
    comments : Map.Map<Nat, OldComment>;
    recordings : Map.Map<Nat, OldRecording>;
    pendingUploads : Map.Map<Nat, OldPendingUpload>;
    uploadChunks : Map.Map<Text, [Nat8]>;
    recordingNames : Map.Map<Nat, Text>;
    inviteCodes : Map.Map<Text, OldInviteCode>;
    chatSessions : Map.Map<Nat, OldChatSession>;
    chatSessionMessages : Map.Map<Nat, OldChatSessionMessage>;
    writingStats : Map.Map<Text, OldDailyWritingStat>;
    hourlyStats : Map.Map<Text, OldHourlyActivityStat>;
    booksTrashed : Map.Map<Nat, Int>;
    chaptersTrashed : Map.Map<Nat, Int>;
    analysesTrashed : Map.Map<Nat, Int>;
    commentsTrashed : Map.Map<Nat, Int>;
    recordingsTrashed : Map.Map<Nat, Int>;
    nextBookId : Nat;
    nextChapterId : Nat;
    nextAnalysisId : Nat;
    nextAnnotationId : Nat;
    nextChatMessageId : Nat;
    nextChatArchiveId : Nat;
    nextCommentId : Nat;
    nextRecordingId : Nat;
    nextChatSessionId : Nat;
    nextChatSessionMessageId : Nat;
    adminPrincipal : ?Principal;
  };

  public type NewBook = OldBook;
  public type NewChapter = OldChapter;
  public type NewAnalysis = OldAnalysis;
  public type NewTextAnnotation = OldTextAnnotation;
  public type NewChatMessage = OldChatMessage;
  public type NewChatArchive = OldChatArchive;
  public type NewComment = OldComment;
  public type NewRecording = OldRecording;
  public type NewChatSession = OldChatSession;
  public type NewChatSessionMessage = OldChatSessionMessage;
  public type NewInviteCode = OldInviteCode;
  public type NewDailyWritingStat = OldDailyWritingStat;
  public type NewHourlyActivityStat = OldHourlyActivityStat;
  public type NewPendingUpload = OldPendingUpload;

  public type NewBackupSnapshot = {
    timestamp : Int;
    books : [NewBook];
    chapters : [NewChapter];
    analyses : [NewAnalysis];
    annotations : [NewTextAnnotation];
    comments : [NewComment];
  };

  public type NewActor = {
    books : Map.Map<Nat, NewBook>;
    chapters : Map.Map<Nat, NewChapter>;
    analyses : Map.Map<Nat, NewAnalysis>;
    annotations : Map.Map<Nat, NewTextAnnotation>;
    chatMessages : Map.Map<Nat, NewChatMessage>;
    chatArchives : Map.Map<Nat, NewChatArchive>;
    comments : Map.Map<Nat, NewComment>;
    recordings : Map.Map<Nat, NewRecording>;
    pendingUploads : Map.Map<Nat, NewPendingUpload>;
    uploadChunks : Map.Map<Text, [Nat8]>;
    recordingNames : Map.Map<Nat, Text>;
    inviteCodes : Map.Map<Text, NewInviteCode>;
    chatSessions : Map.Map<Nat, NewChatSession>;
    chatSessionMessages : Map.Map<Nat, NewChatSessionMessage>;
    writingStats : Map.Map<Text, NewDailyWritingStat>;
    hourlyStats : Map.Map<Text, NewHourlyActivityStat>;
    booksTrashed : Map.Map<Nat, Int>;
    chaptersTrashed : Map.Map<Nat, Int>;
    analysesTrashed : Map.Map<Nat, Int>;
    commentsTrashed : Map.Map<Nat, Int>;
    recordingsTrashed : Map.Map<Nat, Int>;
    backupSnapshots : Map.Map<Int, NewBackupSnapshot>;
    nextBookId : Nat;
    nextChapterId : Nat;
    nextAnalysisId : Nat;
    nextAnnotationId : Nat;
    nextChatMessageId : Nat;
    nextChatArchiveId : Nat;
    nextCommentId : Nat;
    nextRecordingId : Nat;
    nextChatSessionId : Nat;
    nextChatSessionMessageId : Nat;
    adminPrincipal : ?Principal;
    backupEnabled : Bool;
    backupIntervalSeconds : Nat;
    backupMaxSnapshots : Nat;
    backupTimerId : Nat;
  };

  public func migration(old : OldActor) : NewActor {
    {
      old with
      backupSnapshots = Map.empty();
      backupEnabled = false;
      backupIntervalSeconds = 0;
      backupMaxSnapshots = 10;
      backupTimerId = 0;
    };
  };
};
