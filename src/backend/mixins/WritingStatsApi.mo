import Map "mo:core/Map";
import List "mo:core/List";
import Types "../types";
import Principal "mo:core/Principal";
import Int "mo:core/Int";

mixin (writingStats : Map.Map<Text, Types.DailyWritingStat>) {

  public shared ({ caller }) func recordWritingActivity(
    bookId : Nat,
    date : Text,
    wordsAdded : Nat,
    wordsRemoved : Nat,
    activeMinutes : Nat,
  ) : async () {
    let key = caller.toText() # "|" # Nat.toText(bookId) # "|" # date;
    switch (writingStats.get(key)) {
      case (?existing) {
        writingStats.add(key, {
          existing with
          wordsAdded = existing.wordsAdded + wordsAdded;
          wordsRemoved = existing.wordsRemoved + wordsRemoved;
          netWords = existing.netWords + (Int.fromNat(wordsAdded) - Int.fromNat(wordsRemoved));
          activeMinutes = existing.activeMinutes + activeMinutes;
          sessionCount = existing.sessionCount + 1;
        });
      };
      case null {
        let newId = writingStats.size();
        writingStats.add(key, {
          id = newId;
          ownerId = caller;
          bookId;
          date;
          wordsAdded;
          wordsRemoved;
          netWords = Int.fromNat(wordsAdded) - Int.fromNat(wordsRemoved);
          activeMinutes;
          sessionCount = 1;
        });
      };
    };
  };

  public shared ({ caller }) func resetMyWritingStats() : async () {
    var toRemove = List.empty<Text>();
    for ((key, stat) in writingStats.entries()) {
      if (Principal.equal(stat.ownerId, caller)) {
        toRemove.add(key);
      };
    };
    var i = 0;
    while (i < toRemove.size()) {
      switch (toRemove.get(i)) {
        case (?key) { writingStats.remove(key) };
        case null {};
      };
      i += 1;
    };
  };

  public shared ({ caller }) func getStatsByBook(
    bookId : Nat,
    fromDate : Text,
    toDate : Text,
  ) : async [Types.DailyWritingStat] {
    var result : List.List<Types.DailyWritingStat> = List.empty();
    for ((_, stat) in writingStats.entries()) {
      if (
        Principal.equal(stat.ownerId, caller) and
        stat.bookId == bookId and
        stat.date >= fromDate and
        stat.date <= toDate
      ) {
        result.add(stat);
      };
    };
    result.toArray()
  };

  public shared ({ caller }) func getGlobalStats(
    fromDate : Text,
    toDate : Text,
  ) : async [Types.DailyWritingStat] {
    var result : List.List<Types.DailyWritingStat> = List.empty();
    for ((_, stat) in writingStats.entries()) {
      if (
        Principal.equal(stat.ownerId, caller) and
        stat.date >= fromDate and
        stat.date <= toDate
      ) {
        result.add(stat);
      };
    };
    result.toArray()
  };

}
