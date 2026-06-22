import Map "mo:core/Map";
import List "mo:core/List";
import Types "../types";
import Time "mo:core/Time";
import Order "mo:core/Order";

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
    chapterId : Nat,
  ) : [{ id : Nat; voice : Text; createdAt : Int }] {
    var result = List.empty<{ id : Nat; voice : Text; createdAt : Int }>();
    for ((_, recording) in recordings.entries()) {
      if (recording.chapterId == chapterId) {
        result.add({
          id = recording.id;
          voice = recording.voice;
          createdAt = recording.createdAt;
        });
      };
    };
    let arr = result.toArray();
    arr.sort(func(a, b) : Order.Order {
      Int.compare(a.createdAt, b.createdAt)
    })
  };
}
