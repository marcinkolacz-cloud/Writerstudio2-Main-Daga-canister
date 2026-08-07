import MixinViews "mo:caffeineai-data-viewer/MixinViews";
import Types "types";
import Map "mo:core/Map";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import BooksApi "mixins/BooksApi";
import ChaptersApi "mixins/ChaptersApi";
import AnalysesApi "mixins/AnalysesApi";
import TextAnnotationsApi "mixins/TextAnnotationsApi";
import ChatApi "mixins/ChatApi";
import ChatArchivesApi "mixins/ChatArchivesApi";
import ChatsApi "mixins/ChatsApi";
import CommentsApi "mixins/CommentsApi";
import StatsApi "mixins/StatsApi";
import WritingStatsApi "mixins/WritingStatsApi";
import HourlyStatsApi "mixins/HourlyStatsApi";
import RecordingsApi "mixins/RecordingsApi";
import InvitesApi "mixins/InvitesApi";
import TtsApi "mixins/TtsApi";
import ExportApi "mixins/ExportApi";
import Runtime "mo:core/Runtime";
import Timer "mo:base/Timer";
import Time "mo:core/Time";

actor {
  let books : Map.Map<Nat, Types.Book>;
  let chapters : Map.Map<Nat, Types.Chapter>;
  let analyses : Map.Map<Nat, Types.Analysis>;
  let annotations : Map.Map<Nat, Types.TextAnnotation>;
  let chatMessages : Map.Map<Nat, Types.ChatMessage>;
  let chatArchives : Map.Map<Nat, Types.ChatArchive>;
  let chatSessions : Map.Map<Nat, Types.ChatSession>;
  let chatSessionMessages : Map.Map<Nat, Types.ChatSessionMessage>;
  let comments : Map.Map<Nat, Types.Comment>;
  let recordings : Map.Map<Nat, Types.Recording>;
  let pendingUploads : Map.Map<Nat, Types.PendingUpload>;
  let uploadChunks : Map.Map<Text, [Nat8]>;
  let recordingNames : Map.Map<Nat, Text>;
  let inviteCodes : Map.Map<Text, Types.InviteCode>;
  let writingStats : Map.Map<Text, Types.DailyWritingStat>;
  let hourlyStats : Map.Map<Text, Types.HourlyActivityStat>;
  let booksTrashed : Map.Map<Nat, Int>;
  let chaptersTrashed : Map.Map<Nat, Int>;
  let analysesTrashed : Map.Map<Nat, Int>;
  let commentsTrashed : Map.Map<Nat, Int>;
  let recordingsTrashed : Map.Map<Nat, Int>;
  let backupSnapshots : Map.Map<Int, Types.BackupSnapshot>;

  var nextBookId : Nat;
  var nextChapterId : Nat;
  var nextAnalysisId : Nat;
  var nextAnnotationId : Nat;
  var nextChatMessageId : Nat;
  var nextChatArchiveId : Nat;
  var nextChatSessionId : Nat;
  var nextChatSessionMessageId : Nat;
  var nextCommentId : Nat;
  var nextRecordingId : Nat;
  var backupEnabled : Bool;
  var backupIntervalSeconds : Nat;
  var backupMaxSnapshots : Nat;
  var backupTimerId : Nat;

  include MixinViews();
  include BooksApi(books, chapters, inviteCodes, booksTrashed, chaptersTrashed);
  include ChaptersApi(books, chapters, chaptersTrashed);
  include AnalysesApi(books, chapters, analyses, analysesTrashed);
  include TextAnnotationsApi(books, analyses, annotations);
  include ChatApi(books, chatMessages);
  include ChatArchivesApi(books, chatArchives);
  include ChatsApi(books, chapters, chatSessions, chatSessionMessages);
  include CommentsApi(books, chapters, comments, commentsTrashed);
  include StatsApi(books, chapters, booksTrashed, chaptersTrashed);
  include WritingStatsApi(writingStats);
  include HourlyStatsApi(hourlyStats);
  include RecordingsApi(books, chapters, recordings, pendingUploads, uploadChunks, recordingNames, recordingsTrashed);
  include TtsApi(books, inviteCodes);
  include InvitesApi(books, inviteCodes);
  include ExportApi(books, chapters, analyses, annotations, chatMessages, chatArchives, chatSessions, chatSessionMessages, comments);

  var adminPrincipal : ?Principal;

  func _callerIsAdmin(caller : Principal) : Bool {
    switch (adminPrincipal) {
      case null { false };
      case (?admin) { caller == admin };
    }
  };

  public shared ({ caller }) func setAdminPrincipal(p : Principal) : async () {
    switch (adminPrincipal) {
      case null {
        adminPrincipal := ?p;
      };
      case (?admin) {
        if (admin != caller) {
          Runtime.trap("Only current admin can change admin principal");
        };
        adminPrincipal := ?p;
      };
    }
  };

  public shared ({ caller }) func generateInviteCode() : async Text {
    if (not _callerIsAdmin(caller)) {
      Runtime.trap("Only admin can generate invite codes");
    };
    await _generateInviteCode(caller)
  };

  public shared ({ caller }) func checkAccess(code : Text) : async Bool {
    _checkAccess(code, caller)
  };

  public shared ({ caller }) func listInviteCodes() : async [Types.InviteCode] {
    if (not _callerIsAdmin(caller)) {
      Runtime.trap("Only admin can list invite codes");
    };
    _listInviteCodes()
  };

  // ===== TEMPORARY: admin data import from Caffeine backup =====
  public query ({ caller }) func adminGetAllIds() : async {
    books : [Nat];
    chapters : [Nat];
    analyses : [Nat];
    annotations : [Nat];
    comments : [Nat];
    chatMessages : [Nat];
    chatArchives : [Nat];
    chatSessions : [Nat];
    chatSessionMessages : [Nat];
    writingStatsKeys : [Text];
    hourlyStatsKeys : [Text];
  } {
    if (not _callerIsAdmin(caller)) { Runtime.trap("Only admin can list ids"); };
    {
      books = Iter.toArray(books.keys());
      chapters = Iter.toArray(chapters.keys());
      analyses = Iter.toArray(analyses.keys());
      annotations = Iter.toArray(annotations.keys());
      comments = Iter.toArray(comments.keys());
      chatMessages = Iter.toArray(chatMessages.keys());
      chatArchives = Iter.toArray(chatArchives.keys());
      chatSessions = Iter.toArray(chatSessions.keys());
      chatSessionMessages = Iter.toArray(chatSessionMessages.keys());
      writingStatsKeys = Iter.toArray(writingStats.keys());
      hourlyStatsKeys = Iter.toArray(hourlyStats.keys());
    };
  };

  // SAFETY: this used to reassign ownership of EVERY book on the canister
  // in one call with no way to limit the blast radius — a typo'd
  // `newOwner` principal could instantly orphan every user's work. It now
  // takes an explicit list of book ids, so a mistake affects at most the
  // books you named, not the entire canister.
  public shared ({ caller }) func adminReassignBooksOwner(bookIds : [Nat], newOwner : Principal) : async Nat {
    if (not _callerIsAdmin(caller)) { Runtime.trap("Only admin can reassign ownership"); };
    var count = 0;
    for (id in bookIds.vals()) {
      switch (books.get(id)) {
        case (?book) {
          let updated = { book with ownerId = newOwner };
          books.add(id, updated);
          count += 1;
        };
        case null {};
      };
    };
    count;
  };

  public shared ({ caller }) func adminImportDailyWritingStat(stat : Types.DailyWritingStat) : async () {
    if (not _callerIsAdmin(caller)) { Runtime.trap("Only admin can import"); };
    let key = stat.ownerId.toText() # "|" # Nat.toText(stat.bookId) # "|" # stat.date;
    writingStats.add(key, stat);
  };

  public shared ({ caller }) func adminImportHourlyActivityStat(stat : Types.HourlyActivityStat) : async () {
    if (not _callerIsAdmin(caller)) { Runtime.trap("Only admin can import"); };
    let key = stat.ownerId.toText() # "|" # Nat.toText(stat.hour);
    hourlyStats.add(key, stat);
  };

  public shared ({ caller }) func adminImportBook(book : Types.Book) : async () {
    if (not _callerIsAdmin(caller)) { Runtime.trap("Only admin can import"); };
    let fixed = { book with ownerId = caller };
    books.add(fixed.id, fixed);
    if (fixed.id >= nextBookId) { nextBookId := fixed.id + 1; };
  };

  public shared ({ caller }) func adminImportChapter(chapter : Types.Chapter) : async () {
    if (not _callerIsAdmin(caller)) { Runtime.trap("Only admin can import"); };
    chapters.add(chapter.id, chapter);
    if (chapter.id >= nextChapterId) { nextChapterId := chapter.id + 1; };
  };

  public shared ({ caller }) func adminImportAnalysis(analysis : Types.Analysis) : async () {
    if (not _callerIsAdmin(caller)) { Runtime.trap("Only admin can import"); };
    analyses.add(analysis.id, analysis);
    if (analysis.id >= nextAnalysisId) { nextAnalysisId := analysis.id + 1; };
  };

  public shared ({ caller }) func adminImportAnnotation(annotation : Types.TextAnnotation) : async () {
    if (not _callerIsAdmin(caller)) { Runtime.trap("Only admin can import"); };
    annotations.add(annotation.id, annotation);
    if (annotation.id >= nextAnnotationId) { nextAnnotationId := annotation.id + 1; };
  };

  public shared ({ caller }) func adminImportComment(comment : Types.Comment) : async () {
    if (not _callerIsAdmin(caller)) { Runtime.trap("Only admin can import"); };
    comments.add(comment.id, comment);
    if (comment.id >= nextCommentId) { nextCommentId := comment.id + 1; };
  };

  public shared ({ caller }) func adminImportChatMessage(msg : Types.ChatMessage) : async () {
    if (not _callerIsAdmin(caller)) { Runtime.trap("Only admin can import"); };
    chatMessages.add(msg.id, msg);
    if (msg.id >= nextChatMessageId) { nextChatMessageId := msg.id + 1; };
  };

  public shared ({ caller }) func adminImportChatArchive(archive : Types.ChatArchive) : async () {
    if (not _callerIsAdmin(caller)) { Runtime.trap("Only admin can import"); };
    chatArchives.add(archive.id, archive);
    if (archive.id >= nextChatArchiveId) { nextChatArchiveId := archive.id + 1; };
  };

  public shared ({ caller }) func adminImportChatSession(session : Types.ChatSession) : async () {
    if (not _callerIsAdmin(caller)) { Runtime.trap("Only admin can import"); };
    chatSessions.add(session.id, session);
    if (session.id >= nextChatSessionId) { nextChatSessionId := session.id + 1; };
  };

  public shared ({ caller }) func adminImportChatSessionMessage(msg : Types.ChatSessionMessage) : async () {
    if (not _callerIsAdmin(caller)) { Runtime.trap("Only admin can import"); };
    chatSessionMessages.add(msg.id, msg);
    if (msg.id >= nextChatSessionMessageId) { nextChatSessionMessageId := msg.id + 1; };
  };

  public shared ({ caller }) func revokeInviteCode(code : Text) : async Bool {
    if (not _callerIsAdmin(caller)) {
      Runtime.trap("Only admin can revoke invite codes");
    };
    _revokeInviteCode(code)
  };
  // ===== Scheduled on-chain backup =====
  // Deliberately excludes Recording (audioData blobs would multiply
  // stable-memory usage on every scheduled run) — books, chapters,
  // analyses, annotations and comments only.

  func _performBackup() : async () {
    let snapshot : Types.BackupSnapshot = {
      timestamp = Time.now();
      books = Iter.toArray(books.values());
      chapters = Iter.toArray(chapters.values());
      analyses = Iter.toArray(analyses.values());
      annotations = Iter.toArray(annotations.values());
      comments = Iter.toArray(comments.values());
    };
    backupSnapshots.add(snapshot.timestamp, snapshot);

    // Prune down to backupMaxSnapshots by repeatedly removing the oldest.
    while (backupSnapshots.size() > backupMaxSnapshots) {
      var oldest : ?Int = null;
      for (ts in backupSnapshots.keys()) {
        switch (oldest) {
          case null { oldest := ?ts };
          case (?o) { if (ts < o) { oldest := ?ts } };
        };
      };
      switch (oldest) {
        case (?ts) { backupSnapshots.remove(ts) };
        case null {};
      };
    };
  };

  func _rescheduleBackupTimer<system>() : () {
    if (backupTimerId != 0) {
      Timer.cancelTimer(backupTimerId);
      backupTimerId := 0;
    };
    if (backupEnabled and backupIntervalSeconds > 0) {
      backupTimerId := Timer.recurringTimer<system>(
        #seconds backupIntervalSeconds,
        func() : async () { await _performBackup() },
      );
    };
  };

  // intervalSeconds: e.g. 86400 = codziennie, 604800 = co tydzień.
  // maxSnapshots: ile ostatnich kopii trzymać (starsze auto-usuwane).
  public shared ({ caller }) func configureBackupSchedule(
    intervalSeconds : Nat,
    enabled : Bool,
    maxSnapshots : Nat,
  ) : async () {
    if (not _callerIsAdmin(caller)) {
      Runtime.trap("Only admin can configure backups");
    };
    backupIntervalSeconds := intervalSeconds;
    backupEnabled := enabled;
    backupMaxSnapshots := (if (maxSnapshots > 0) maxSnapshots else 10);
    _rescheduleBackupTimer<system>();
  };

  public shared ({ caller }) func triggerBackupNow() : async () {
    if (not _callerIsAdmin(caller)) {
      Runtime.trap("Only admin can trigger a backup");
    };
    await _performBackup();
  };

  public query ({ caller }) func listBackups() : async [Types.BackupSummary] {
    if (not _callerIsAdmin(caller)) {
      Runtime.trap("Only admin can list backups");
    };
    var result : List.List<Types.BackupSummary> = List.empty();
    for ((_, s) in backupSnapshots.entries()) {
      result.add({
        timestamp = s.timestamp;
        bookCount = s.books.size();
        chapterCount = s.chapters.size();
        analysisCount = s.analyses.size();
        annotationCount = s.annotations.size();
        commentCount = s.comments.size();
      });
    };
    result.toArray();
  };

  public query ({ caller }) func getBackupSnapshot(timestamp : Int) : async ?Types.BackupSnapshot {
    if (not _callerIsAdmin(caller)) {
      Runtime.trap("Only admin can read backups");
    };
    backupSnapshots.get(timestamp);
  };

  public shared ({ caller }) func deleteBackup(timestamp : Int) : async () {
    if (not _callerIsAdmin(caller)) {
      Runtime.trap("Only admin can delete backups");
    };
    backupSnapshots.remove(timestamp);
  };

  public query ({ caller }) func getBackupConfig() : async {
    enabled : Bool;
    intervalSeconds : Nat;
    maxSnapshots : Nat;
  } {
    if (not _callerIsAdmin(caller)) {
      Runtime.trap("Only admin can read backup config");
    };
    {
      enabled = backupEnabled;
      intervalSeconds = backupIntervalSeconds;
      maxSnapshots = backupMaxSnapshots;
    };
  };
};
