import MixinViews "mo:caffeineai-data-viewer/MixinViews";
import Types "types";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import BooksApi "mixins/BooksApi";
import ChaptersApi "mixins/ChaptersApi";
import AnalysesApi "mixins/AnalysesApi";
import TextAnnotationsApi "mixins/TextAnnotationsApi";
import ChatApi "mixins/ChatApi";
import ChatsApi "mixins/ChatsApi";
import CommentsApi "mixins/CommentsApi";
import StatsApi "mixins/StatsApi";
import RecordingsApi "mixins/RecordingsApi";
import InvitesApi "mixins/InvitesApi";

actor {
  let books : Map.Map<Nat, Types.Book>;
  let chapters : Map.Map<Nat, Types.Chapter>;
  let analyses : Map.Map<Nat, Types.Analysis>;
  let annotations : Map.Map<Nat, Types.TextAnnotation>;
  let chatMessages : Map.Map<Nat, Types.ChatMessage>;
  let chatSessions : Map.Map<Nat, Types.ChatSession>;
  let chatSessionMessages : Map.Map<Nat, Types.ChatSessionMessage>;
  let comments : Map.Map<Nat, Types.Comment>;
  let recordings : Map.Map<Nat, Types.Recording>;
  let inviteCodes : Map.Map<Text, Types.InviteCode>;

  var nextBookId : Nat;
  var nextChapterId : Nat;
  var nextAnalysisId : Nat;
  var nextAnnotationId : Nat;
  var nextChatMessageId : Nat;
  var nextChatSessionId : Nat;
  var nextChatSessionMessageId : Nat;
  var nextCommentId : Nat;
  var nextRecordingId : Nat;

  include MixinViews();
  include BooksApi(books, chapters);
  include ChaptersApi(books, chapters);
  include AnalysesApi(books, chapters, analyses);
  include TextAnnotationsApi(books, analyses, annotations);
  include ChatApi(books, chatMessages);
  include ChatsApi(books, chapters, chatSessions, chatSessionMessages);
  include CommentsApi(books, chapters, comments);
  include StatsApi(books, chapters);
  include RecordingsApi(books, chapters, recordings);
  include InvitesApi(books, inviteCodes);
};
