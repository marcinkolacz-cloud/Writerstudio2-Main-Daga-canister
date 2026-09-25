import Map "mo:core/Map";
import Types "../types";
import ExportLib "../lib/Export";

mixin (
  books : Map.Map<Nat, Types.Book>,
  chapters : Map.Map<Nat, Types.Chapter>,
  analyses : Map.Map<Nat, Types.Analysis>,
  annotations : Map.Map<Nat, Types.TextAnnotation>,
  chatMessages : Map.Map<Nat, Types.ChatMessage>,
  chatArchives : Map.Map<Nat, Types.ChatArchive>,
  chatSessions : Map.Map<Nat, Types.ChatSession>,
  chatSessionMessages : Map.Map<Nat, Types.ChatSessionMessage>,
  comments : Map.Map<Nat, Types.Comment>,
) {
  /// Export metadata (timestamp, owner, bookCount). Frontend uses bookCount
  /// to know how many exportBookSlice(0..bookCount-1) calls to make.
  public shared query ({ caller }) func exportMetadata() : async Types.ExportMetadataResponse {
    ExportLib.buildExportMetadata(books, caller);
  };

  /// One book (by owner-scoped index) with all nested chapters/analyses/
  /// annotations/comments/chatMessages/chatArchives/chatSessions/
  /// chatSessionMessages. Returns null if bookIndex is out of range.
  public shared query ({ caller }) func exportBookSlice(bookIndex : Nat) : async ?Types.BookExport {
    ExportLib.buildBookSlice(
      books,
      chapters,
      analyses,
      annotations,
      chatMessages,
      chatArchives,
      chatSessions,
      chatSessionMessages,
      comments,
      caller,
      bookIndex,
    );
  };
    public shared query ({ caller }) func exportBookSliceChunk(bookIndex : Nat, offsets : Types.BookExportOffsets) : async ?Types.BookExportChunk {
      ExportLib.buildBookSliceChunk(
        books, chapters, analyses, annotations, chatMessages, chatArchives, chatSessions, chatSessionMessages, comments,
        caller, bookIndex, offsets,
      );
    };

};
