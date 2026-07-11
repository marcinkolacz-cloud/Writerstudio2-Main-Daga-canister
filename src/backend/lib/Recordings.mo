import Map "mo:core/Map";
import List "mo:core/List";
import Types "../types";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Nat "mo:core/Nat";

module {
  public func getNextId(recordings : Map.Map<Nat, Types.Recording>) : Nat {
    var maxId = 0;
    for ((id, _) in recordings.entries()) {
      if (id + 1 > maxId) maxId := id + 1;
    };
    maxId
  };

  public func createRecordingRecord(
    id : Nat,
    chapterId : Nat,
    bookId : Nat,
    voice : Text,
    audioData : [Nat8],
  ) : Types.Recording {
    {
      id;
      chapterId;
      bookId;
      voice;
      audioData;
      createdAt = Time.now();
    }
  };

  public func filterByChapter(
    recordings : Map.Map<Nat, Types.Recording>,
    recordingNames : Map.Map<Nat, Text>,
    chapterId : Nat,
  ) : [{ id : Nat; voice : Text; createdAt : Int; name : ?Text }] {
    var result = List.empty<{ id : Nat; voice : Text; createdAt : Int; name : ?Text }>();
    for ((_, recording) in recordings.entries()) {
      if (recording.chapterId == chapterId) {
        result.add({
          id = recording.id;
          voice = recording.voice;
          createdAt = recording.createdAt;
          name = recordingNames.get(recording.id);
        });
      };
    };
    let arr = result.toArray();
    arr.sort(func(a, b) : Order.Order {
      Int.compare(a.createdAt, b.createdAt)
    })
  };

  public func getNextUploadId(uploads : Map.Map<Nat, Types.PendingUpload>) : Nat {
    var maxId = 0;
    for ((id, _) in uploads.entries()) {
      if (id + 1 > maxId) maxId := id + 1;
    };
    maxId
  };

  public func createPendingUpload(id : Nat, chapterId : Nat, bookId : Nat, voice : Text, totalChunks : Nat) : Types.PendingUpload {
    {
      id;
      chapterId;
      bookId;
      voice;
      totalChunks;
      receivedChunks = 0;
      createdAt = Time.now();
    }
  };

  public func chunkKey(uploadId : Nat, chunkIndex : Nat) : Text {
    uploadId.toText() # ":" # chunkIndex.toText()
  };
}
