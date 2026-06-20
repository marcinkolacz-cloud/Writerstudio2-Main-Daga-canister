import Map "mo:core/Map";
import List "mo:core/List";
import Types "../types";
import AnalysesLib "../lib/Analyses";
import Principal "mo:core/Principal";

mixin (
  books : Map.Map<Nat, Types.Book>,
  chapters : Map.Map<Nat, Types.Chapter>,
  analyses : Map.Map<Nat, Types.Analysis>,
) {

  func analysesGetBookOwner(bookId : Nat) : ?Principal {
    switch (books.get(bookId)) {
      case (?book) { ?book.ownerId };
      case null { null };
    }
  };

  func analysesGetChapterBookId(chapterId : Nat) : ?Nat {
    switch (chapters.get(chapterId)) {
      case (?chapter) { ?chapter.bookId };
      case null { null };
    }
  };

  func isAnalysisOwner(analysis : Types.Analysis, caller : Principal) : Bool {
    switch (analysesGetBookOwner(analysis.bookId)) {
      case (?ownerId) { Principal.equal(ownerId, caller) };
      case null { false };
    }
  };

  public shared ({ caller }) func saveAnalysis(
    bookId : Nat,
    chapterId : ?Nat,
    analysisType : Text,
    provider : Text,
    resultContent : Text,
  ) : async Nat {
    switch (analysesGetBookOwner(bookId)) {
      case (?ownerId) {
        if (Principal.equal(ownerId, caller)) {
          let newId = AnalysesLib.getNextId(analyses);
          let analysis = AnalysesLib.createAnalysisRecord(newId, bookId, chapterId, analysisType, provider, resultContent);
          analyses.add(newId, analysis);
          newId
        } else {
          0
        }
      };
      case null { 0 }
    }
  };

  public shared ({ caller }) func getAnalysis(id : Nat) : async ?Types.Analysis {
    switch (analyses.get(id)) {
      case (?analysis) {
        if (isAnalysisOwner(analysis, caller)) {
          ?analysis
        } else {
          null
        }
      };
      case null { null }
    }
  };

  public shared ({ caller }) func listAnalysesByChapter(chapterId : Nat) : async [Types.Analysis] {
    switch (analysesGetChapterBookId(chapterId)) {
      case (?bookId) {
        switch (analysesGetBookOwner(bookId)) {
          case (?ownerId) {
            if (Principal.equal(ownerId, caller)) {
              AnalysesLib.filterByChapter(analyses, chapterId)
            } else {
              []
            }
          };
          case null { [] }
        }
      };
      case null { [] }
    }
  };

  public shared ({ caller }) func listAnalysesByBook(bookId : Nat) : async [Types.Analysis] {
    switch (analysesGetBookOwner(bookId)) {
      case (?ownerId) {
        if (Principal.equal(ownerId, caller)) {
          AnalysesLib.filterByBook(analyses, bookId)
        } else {
          []
        }
      };
      case null { [] }
    }
  };

  public shared ({ caller }) func deleteAnalysis(id : Nat) : async Bool {
    switch (analyses.get(id)) {
      case (?analysis) {
        if (isAnalysisOwner(analysis, caller)) {
          analyses.remove(id);
          true
        } else {
          false
        }
      };
      case null { false }
    }
  };
};
