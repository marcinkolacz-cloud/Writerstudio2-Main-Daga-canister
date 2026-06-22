import Map "mo:core/Map";
import Types "../types";
import RecordingsLib "../lib/Recordings";
import Principal "mo:core/Principal";

mixin (
  books : Map.Map<Nat, Types.Book>,
  chapters : Map.Map<Nat, Types.Chapter>,
  recordings : Map.Map<Nat, Types.Recording>,
) {

  func recordingGetBookOwner(chapterId : Nat) : ?Principal {
    switch (chapters.get(chapterId)) {
      case (?chapter) {
        switch (books.get(chapter.bookId)) {
          case (?book) { ?book.ownerId };
          case null { null };
        }
      };
      case null { null };
    }
  };

  func isRecordingOwner(recording : Types.Recording, caller : Principal) : Bool {
    switch (books.get(recording.bookId)) {
      case (?book) { Principal.equal(book.ownerId, caller) };
      case null { false };
    }
  };

  public shared ({ caller }) func saveRecording(chapterId : Nat, bookId : Nat, voice : Text, audioData : [Nat8]) : async Nat {
    switch (books.get(bookId)) {
      case (?book) {
        if (Principal.equal(book.ownerId, caller)) {
          let newId = RecordingsLib.getNextId(recordings);
          let recording = RecordingsLib.createRecordingRecord(newId, chapterId, bookId, voice, audioData);
          recordings.add(newId, recording);
          newId
        } else {
          0
        }
      };
      case null { 0 }
    }
  };

  public shared ({ caller }) func listRecordingsByChapter(chapterId : Nat) : async [{ id : Nat; voice : Text; createdAt : Int }] {
    switch (recordingGetBookOwner(chapterId)) {
      case (?ownerId) {
        if (Principal.equal(ownerId, caller)) {
          RecordingsLib.filterByChapter(recordings, chapterId)
        } else {
          []
        }
      };
      case null { [] }
    }
  };

  public shared ({ caller }) func getRecordingAudio(id : Nat) : async ?[Nat8] {
    switch (recordings.get(id)) {
      case (?recording) {
        if (isRecordingOwner(recording, caller)) {
          ?recording.audioData
        } else {
          null
        }
      };
      case null { null }
    }
  };

  public shared ({ caller }) func deleteRecording(id : Nat) : async Bool {
    switch (recordings.get(id)) {
      case (?recording) {
        if (isRecordingOwner(recording, caller)) {
          recordings.remove(id);
          true
        } else {
          false
        }
      };
      case null { false }
    }
  };
}
