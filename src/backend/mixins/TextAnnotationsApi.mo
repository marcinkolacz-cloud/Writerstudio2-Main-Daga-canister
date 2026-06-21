import Map "mo:core/Map";
import List "mo:core/List";
import Types "../types";
import TextAnnotationsLib "../lib/TextAnnotations";
import Principal "mo:core/Principal";

mixin (
  books : Map.Map<Nat, Types.Book>,
  analyses : Map.Map<Nat, Types.Analysis>,
  annotations : Map.Map<Nat, Types.TextAnnotation>,
) {

  func annotationsGetBookOwner(bookId : Nat) : ?Principal {
    switch (books.get(bookId)) {
      case (?book) { ?book.ownerId };
      case null { null };
    }
  };

  func annotationsGetAnalysisBookId(analysisId : Nat) : ?Nat {
    switch (analyses.get(analysisId)) {
      case (?analysis) { ?analysis.bookId };
      case null { null };
    }
  };

  func isAnnotationOwner(annotation : Types.TextAnnotation, caller : Principal) : Bool {
    switch (annotationsGetAnalysisBookId(annotation.analysisId)) {
      case (?bookId) {
        switch (annotationsGetBookOwner(bookId)) {
          case (?ownerId) { Principal.equal(ownerId, caller) };
          case null { false };
        }
      };
      case null { false };
    }
  };

  public shared ({ caller }) func saveAnnotations(
    analysisId : Nat,
    annotationData : [{ text : Text; color : Text; explanation : Text; proposal : Text; alternativeProposal : ?Text }],
  ) : async [Nat] {
    switch (annotationsGetAnalysisBookId(analysisId)) {
      case (?bookId) {
        switch (annotationsGetBookOwner(bookId)) {
          case (?ownerId) {
            if (Principal.equal(ownerId, caller)) {
              // Remove existing annotations for this analysis
              var idsToRemove = List.empty<Nat>();
              for ((id, annotation) in annotations.entries()) {
                if (annotation.analysisId == analysisId) {
                  idsToRemove.add(id);
                };
              };
              var i = 0;
              while (i < idsToRemove.size()) {
                switch (idsToRemove.get(i)) {
                  case (?aid) { annotations.remove(aid); };
                  case null {};
                };
                i += 1;
              };

              // Add new annotations and collect their IDs
              var newIds = List.empty<Nat>();
              for (data in annotationData.vals()) {
                let newId = TextAnnotationsLib.getNextId(annotations);
                let annotation = TextAnnotationsLib.createAnnotationRecord(
                  newId,
                  analysisId,
                  data.text,
                  data.color,
                  data.explanation,
                  data.proposal,
                  data.alternativeProposal,
                );
                annotations.add(newId, annotation);
                newIds.add(newId);
              };
              newIds.toArray()
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

  public shared ({ caller }) func getAnnotation(id : Nat) : async ?Types.TextAnnotation {
    switch (annotations.get(id)) {
      case (?annotation) {
        if (isAnnotationOwner(annotation, caller)) {
          ?annotation
        } else {
          null
        }
      };
      case null { null }
    }
  };

  public shared ({ caller }) func listAnnotationsByAnalysis(analysisId : Nat) : async [Types.TextAnnotation] {
    switch (annotationsGetAnalysisBookId(analysisId)) {
      case (?bookId) {
        switch (annotationsGetBookOwner(bookId)) {
          case (?ownerId) {
            if (Principal.equal(ownerId, caller)) {
              TextAnnotationsLib.filterByAnalysis(annotations, analysisId)
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

  public shared ({ caller }) func updateAnnotationApproved(id : Nat, approved : Bool) : async Bool {
    switch (annotations.get(id)) {
      case (?annotation) {
        if (isAnnotationOwner(annotation, caller)) {
          let updated = { annotation with approved = approved };
          annotations.add(id, updated);
          annotations.add(id, updated);
          true
        } else {
          false
        }
      };
      case null { false }
    }
  };

  public shared ({ caller }) func getAnnotations(analysisId : Nat) : async [Types.TextAnnotation] {
    switch (annotationsGetAnalysisBookId(analysisId)) {
      case (?bookId) {
        switch (annotationsGetBookOwner(bookId)) {
          case (?ownerId) {
            if (Principal.equal(ownerId, caller)) {
              TextAnnotationsLib.filterByAnalysis(annotations, analysisId)
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
};
