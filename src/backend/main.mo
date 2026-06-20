import MixinViews "mo:caffeineai-data-viewer/MixinViews";
import Types "types";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import BooksApi "mixins/BooksApi";
import ChaptersApi "mixins/ChaptersApi";

actor {
  let books : Map.Map<Nat, Types.Book>;
  let chapters : Map.Map<Nat, Types.Chapter>;

  var nextBookId : Nat;
  var nextChapterId : Nat;

  include MixinViews();
  include BooksApi(books, chapters);
  include ChaptersApi(books, chapters);
};
