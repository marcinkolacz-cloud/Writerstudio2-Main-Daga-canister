import Map "mo:core/Map";
import Types "../types";
import RecordingsLib "../lib/Recordings";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import Time "mo:core/Time";

mixin (
  books : Map.Map<Nat, Types.Book>,
  chapters : Map.Map<Nat, Types.Chapter>,
  recordings : Map.Map<Nat, Types.Recording>,
  pendingUploads : Map.Map<Nat, Types.PendingUpload>,
  uploadChunks : Map.Map<Text, [Nat8]>,
  recordingNames : Map.Map<Nat, Text>,
  recordingsTrashed : Map.Map<Nat, Int>,
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

  public shared ({ caller }) func listRecordingsByChapter(chapterId : Nat) : async [{ id : Nat; voice : Text; createdAt : Int; name : ?Text }] {
    switch (recordingGetBookOwner(chapterId)) {
      case (?ownerId) {
        if (Principal.equal(ownerId, caller)) {
          RecordingsLib.filterByChapter(recordings, recordingNames, chapterId).filter(func(r : { id : Nat; voice : Text; createdAt : Int; name : ?Text }) : Bool { recordingsTrashed.get(r.id) == null })
        } else {
          []
        }
      };
      case null { [] }
    }
  };

  public shared ({ caller }) func setRecordingName(recordingId : Nat, name : Text) : async Bool {
    switch (recordings.get(recordingId)) {
      case (?recording) {
        if (isRecordingOwner(recording, caller)) {
          recordingNames.add(recordingId, name);
          true
        } else {
          false
        }
      };
      case null { false }
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

  // SAFETY: this used to permanently destroy the recording (audio data
  // included) with no recovery path. It now moves it to trash instead.
  public shared ({ caller }) func deleteRecording(id : Nat) : async Bool {
    switch (recordings.get(id)) {
      case (?recording) {
        if (isRecordingOwner(recording, caller)) {
          recordingsTrashed.add(id, Time.now());
          true
        } else {
          false
        }
      };
      case null { false }
    }
  };

  public shared ({ caller }) func restoreRecording(id : Nat) : async Bool {
    switch (recordings.get(id)) {
      case (?recording) {
        if (isRecordingOwner(recording, caller)) {
          switch (recordingsTrashed.get(id)) {
            case (?_) { recordingsTrashed.remove(id); true };
            case null { false };
          };
        } else {
          false
        }
      };
      case null { false }
    }
  };

  public shared ({ caller }) func listTrashedRecordingsByChapter(chapterId : Nat) : async [{ id : Nat; voice : Text; createdAt : Int; name : ?Text }] {
    switch (recordingGetBookOwner(chapterId)) {
      case (?ownerId) {
        if (Principal.equal(ownerId, caller)) {
          RecordingsLib.filterByChapter(recordings, recordingNames, chapterId).filter(func(r : { id : Nat; voice : Text; createdAt : Int; name : ?Text }) : Bool { recordingsTrashed.get(r.id) != null })
        } else {
          []
        }
      };
      case null { [] }
    }
  };

  public shared ({ caller }) func permanentlyDeleteRecording(id : Nat) : async Bool {
    switch (recordings.get(id)) {
      case (?recording) {
        if (isRecordingOwner(recording, caller)) {
          recordings.remove(id);
          recordingsTrashed.remove(id);
          true
        } else {
          false
        }
      };
      case null { false }
    }
  };

  public shared ({ caller }) func startRecordingUpload(chapterId : Nat, bookId : Nat, voice : Text, totalChunks : Nat) : async Nat {
    switch (books.get(bookId)) {
      case (?book) {
        if (Principal.equal(book.ownerId, caller)) {
          let newId = RecordingsLib.getNextUploadId(pendingUploads);
          let pending = RecordingsLib.createPendingUpload(newId, chapterId, bookId, voice, totalChunks);
          pendingUploads.add(newId, pending);
          newId
        } else {
          0
        }
      };
      case null { 0 }
    }
  };

  public shared ({ caller }) func uploadRecordingChunk(uploadId : Nat, chunkIndex : Nat, data : [Nat8]) : async Bool {
    switch (pendingUploads.get(uploadId)) {
      case (?pending) {
        switch (books.get(pending.bookId)) {
          case (?book) {
            if (Principal.equal(book.ownerId, caller)) {
              let key = RecordingsLib.chunkKey(uploadId, chunkIndex);
              let alreadyReceived = uploadChunks.get(key) != null;
              uploadChunks.add(key, data);
              if (not alreadyReceived) {
                let updated = { pending with receivedChunks = pending.receivedChunks + 1 };
                pendingUploads.add(uploadId, updated);
              };
              true
            } else {
              false
            }
          };
          case null { false }
        }
      };
      case null { false }
    }
  };

  public shared ({ caller }) func finishRecordingUpload(uploadId : Nat) : async Nat {
    switch (pendingUploads.get(uploadId)) {
      case (?pending) {
        switch (books.get(pending.bookId)) {
          case (?book) {
            if (Principal.equal(book.ownerId, caller) and pending.receivedChunks == pending.totalChunks) {
              let chunks : [[Nat8]] = Array.tabulate(pending.totalChunks, func(i : Nat) : [Nat8] {
                let key = RecordingsLib.chunkKey(uploadId, i);
                switch (uploadChunks.get(key)) {
                  case (?chunk) { chunk };
                  case null { [] };
                }
              });
              var i = 0;
              while (i < pending.totalChunks) {
                uploadChunks.remove(RecordingsLib.chunkKey(uploadId, i));
                i += 1;
              };
              let assembled = chunks.flatten();
              let newId = RecordingsLib.getNextId(recordings);
              let recording = RecordingsLib.createRecordingRecord(newId, pending.chapterId, pending.bookId, pending.voice, assembled);
              recordings.add(newId, recording);
              pendingUploads.remove(uploadId);
              newId
            } else {
              0
            }
          };
          case null { 0 }
        }
      };
      case null { 0 }
    }
  };
}
