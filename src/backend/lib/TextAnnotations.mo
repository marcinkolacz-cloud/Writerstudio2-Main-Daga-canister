import Map "mo:core/Map";
import List "mo:core/List";
import Types "../types";

module {
  public func getNextId(annotations : Map.Map<Nat, Types.TextAnnotation>) : Nat {
    var maxId = 0;
    for ((id, _) in annotations.entries()) {
      if (id + 1 > maxId) maxId := id + 1;
    };
    maxId
  };

  public func createAnnotationRecord(
    id : Nat,
    analysisId : Nat,
    text : Text,
    color : Text,
    explanation : Text,
    proposal : Text,
  ) : Types.TextAnnotation {
    {
      id;
      analysisId;
      text;
      color;
      explanation;
      proposal;
    }
  };

  public func filterByAnalysis(annotations : Map.Map<Nat, Types.TextAnnotation>, analysisId : Nat) : [Types.TextAnnotation] {
    var result = List.empty<Types.TextAnnotation>();
    for ((_, annotation) in annotations.entries()) {
      if (annotation.analysisId == analysisId) {
        result.add(annotation);
      };
    };
    result.toArray()
  };
};
