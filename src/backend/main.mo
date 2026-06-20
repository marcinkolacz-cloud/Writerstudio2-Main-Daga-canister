import MixinViews "mo:caffeineai-data-viewer/MixinViews";
import Types "types";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import BooksApi "mixins/BooksApi";
import ChaptersApi "mixins/ChaptersApi";
import AnalysesApi "mixins/AnalysesApi";
import TextAnnotationsApi "mixins/TextAnnotationsApi";
import ChatApi "mixins/ChatApi";
import CommentsApi "mixins/CommentsApi";

actor {
  let books : Map.Map<Nat, Types.Book>;
  let chapters : Map.Map<Nat, Types.Chapter>;
  let analyses : Map.Map<Nat, Types.Analysis>;
  let annotations : Map.Map<Nat, Types.TextAnnotation>;
  let chatMessages : Map.Map<Nat, Types.ChatMessage>;
  let comments : Map.Map<Nat, Types.Comment>;

  var nextBookId : Nat;
  var nextChapterId : Nat;
  var nextAnalysisId : Nat;
  var nextAnnotationId : Nat;
  var nextChatMessageId : Nat;
  var nextCommentId : Nat;

  include MixinViews();
  include BooksApi(books, chapters);
  include ChaptersApi(books, chapters);
  include AnalysesApi(books, chapters, analyses);
  include TextAnnotationsApi(books, analyses, annotations);
  include ChatApi(books, chatMessages);
  include CommentsApi(books, chapters, comments);
};
