import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Types "../types";

module {
  func ownerBooks(
    books : Map.Map<Nat, Types.Book>,
    owner : Principal,
  ) : [Types.Book] {
    books
      .values()
      .filter(func(b : Types.Book) : Bool { Principal.equal(b.ownerId, owner) })
      .toArray()
      .sort(func(a : Types.Book, b : Types.Book) : { #less; #equal; #greater } {
        Nat.compare(a.id, b.id)
      });
  };

  func natArrayContains(xs : [Nat], x : Nat) : Bool {
    xs.find(func(n : Nat) : Bool { n == x }) != null;
  };

  func mapNatField<T>(xs : [T], f : T -> Nat) : [Nat] {
    xs.map(f);
  };

  func chaptersForBooks(chapters : Map.Map<Nat, Types.Chapter>, bookIds : [Nat]) : [Types.Chapter] {
    chapters.values().filter(func(c : Types.Chapter) : Bool { natArrayContains(bookIds, c.bookId) }).toArray();
  };

  func analysesForBooks(analyses : Map.Map<Nat, Types.Analysis>, bookIds : [Nat]) : [Types.Analysis] {
    analyses.values().filter(func(a : Types.Analysis) : Bool { natArrayContains(bookIds, a.bookId) }).toArray();
  };

  func annotationsForAnalyses(annotations : Map.Map<Nat, Types.TextAnnotation>, analysisIds : [Nat]) : [Types.TextAnnotation] {
    annotations.values().filter(func(a : Types.TextAnnotation) : Bool { natArrayContains(analysisIds, a.analysisId) }).toArray();
  };

  func commentsForChapters(comments : Map.Map<Nat, Types.Comment>, chapterIds : [Nat]) : [Types.Comment] {
    comments.values().filter(func(c : Types.Comment) : Bool { natArrayContains(chapterIds, c.chapterId) }).toArray();
  };

  func chatMessagesForBooks(chatMessages : Map.Map<Nat, Types.ChatMessage>, bookIds : [Nat]) : [Types.ChatMessage] {
    chatMessages.values().filter(func(m : Types.ChatMessage) : Bool { natArrayContains(bookIds, m.bookId) }).toArray();
  };

  func chatArchivesForBooks(chatArchives : Map.Map<Nat, Types.ChatArchive>, bookIds : [Nat]) : [Types.ChatArchive] {
    chatArchives.values().filter(func(a : Types.ChatArchive) : Bool { natArrayContains(bookIds, a.bookId) }).toArray();
  };

  func chatSessionsForChapters(chatSessions : Map.Map<Nat, Types.ChatSession>, chapterIds : [Nat]) : [Types.ChatSession] {
    chatSessions.values().filter(func(s : Types.ChatSession) : Bool { natArrayContains(chapterIds, s.chapterId) }).toArray();
  };

  func chatSessionMessagesForSessions(chatSessionMessages : Map.Map<Nat, Types.ChatSessionMessage>, sessionIds : [Nat]) : [Types.ChatSessionMessage] {
    chatSessionMessages.values().filter(func(m : Types.ChatSessionMessage) : Bool { natArrayContains(sessionIds, m.sessionId) }).toArray();
  };

  /// Metadata + book count for the caller. Frontend then calls
  /// buildBookSlice(0..bookCount-1) to fetch each book in its own reply,
  /// keeping every call well under the IC ~3MB limit.
  public func buildExportMetadata(
    books : Map.Map<Nat, Types.Book>,
    owner : Principal,
  ) : Types.ExportMetadataResponse {
    let owned = ownerBooks(books, owner);
    { exportedAt = Time.now(); owner = owner; bookCount = owned.size() };
  };

  /// One book (owner-scoped index 0..N-1) with everything nested under it.
  public func buildBookSlice(
    books : Map.Map<Nat, Types.Book>,
    chapters : Map.Map<Nat, Types.Chapter>,
    analyses : Map.Map<Nat, Types.Analysis>,
    annotations : Map.Map<Nat, Types.TextAnnotation>,
    chatMessages : Map.Map<Nat, Types.ChatMessage>,
    chatArchives : Map.Map<Nat, Types.ChatArchive>,
    chatSessions : Map.Map<Nat, Types.ChatSession>,
    chatSessionMessages : Map.Map<Nat, Types.ChatSessionMessage>,
    comments : Map.Map<Nat, Types.Comment>,
    owner : Principal,
    bookIndex : Nat,
  ) : ?Types.BookExport {
    let owned = ownerBooks(books, owner);
    if (bookIndex >= owned.size()) { return null };
    let b = owned[bookIndex];
    let singleBookId = [b.id];

    let bChapters = chaptersForBooks(chapters, singleBookId);
    let bChapterIds = mapNatField(bChapters, func(c) { c.id });

    let bAnalyses = analysesForBooks(analyses, singleBookId);
    let bAnalysisIds = mapNatField(bAnalyses, func(a) { a.id });

    let bAnnotations = annotationsForAnalyses(annotations, bAnalysisIds);
    let bComments = commentsForChapters(comments, bChapterIds);

    let bChatMessages = chatMessagesForBooks(chatMessages, singleBookId);
    let bChatArchives = chatArchivesForBooks(chatArchives, singleBookId);

    let bChatSessions = chatSessionsForChapters(chatSessions, bChapterIds);
    let bSessionIds = mapNatField(bChatSessions, func(s) { s.id });

    let bChatSessionMessages = chatSessionMessagesForSessions(chatSessionMessages, bSessionIds);

    ?{
      book = b;
      chapters = bChapters;
      analyses = bAnalyses;
      annotations = bAnnotations;
      comments = bComments;
      chatMessages = bChatMessages;
      chatArchives = bChatArchives;
      chatSessions = bChatSessions;
      chatSessionMessages = bChatSessionMessages;
    };
  };
};
