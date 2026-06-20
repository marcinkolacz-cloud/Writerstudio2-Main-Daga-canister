import Map "mo:core/Map";
import List "mo:core/List";
import Types "../types";
import Time "mo:core/Time";

module {
  public func getNextId(analyses : Map.Map<Nat, Types.Analysis>) : Nat {
    var maxId = 0;
    for ((id, _) in analyses.entries()) {
      if (id + 1 > maxId) maxId := id + 1;
    };
    maxId
  };

  public func createAnalysisRecord(
    id : Nat,
    bookId : Nat,
    chapterId : ?Nat,
    analysisType : Text,
    provider : Text,
    resultContent : Text,
  ) : Types.Analysis {
    {
      id;
      bookId;
      chapterId;
      analysisType;
      provider;
      resultContent;
      createdAt = Time.now();
    }
  };

  public func filterByChapter(analyses : Map.Map<Nat, Types.Analysis>, chapterId : Nat) : [Types.Analysis] {
    var result = List.empty<Types.Analysis>();
    for ((_, analysis) in analyses.entries()) {
      switch (analysis.chapterId) {
        case (?cid) {
          if (cid == chapterId) {
            result.add(analysis);
          };
        };
        case null {};
      };
    };
    result.toArray()
  };

  public func filterByBook(analyses : Map.Map<Nat, Types.Analysis>, bookId : Nat) : [Types.Analysis] {
    var result = List.empty<Types.Analysis>();
    for ((_, analysis) in analyses.entries()) {
      if (analysis.bookId == bookId) {
        result.add(analysis);
      };
    };
    result.toArray()
  };
};
