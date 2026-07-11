import MixinViews "mo:caffeineai-data-viewer/MixinViews";
import Types "types";
import Map "mo:core/Map";
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
import Runtime "mo:core/Runtime";

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

  include MixinViews();
  include BooksApi(books, chapters, inviteCodes);
  include ChaptersApi(books, chapters);
  include AnalysesApi(books, chapters, analyses);
  include TextAnnotationsApi(books, analyses, annotations);
  include ChatApi(books, chatMessages);
  include ChatArchivesApi(books, chatArchives);
  include ChatsApi(books, chapters, chatSessions, chatSessionMessages);
  include CommentsApi(books, chapters, comments);
  include StatsApi(books, chapters);
  include WritingStatsApi(writingStats);
  include HourlyStatsApi(hourlyStats);
  include RecordingsApi(books, chapters, recordings, pendingUploads, uploadChunks, recordingNames);
  include TtsApi();
  include InvitesApi(books, inviteCodes);

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

  public shared ({ caller }) func revokeInviteCode(code : Text) : async Bool {
    if (not _callerIsAdmin(caller)) {
      Runtime.trap("Only admin can revoke invite codes");
    };
    _revokeInviteCode(code)
  };
};
