import Map "mo:core/Map";
import List "mo:core/List";
import Types "../types";
import Principal "mo:core/Principal";

mixin (hourlyStats : Map.Map<Text, Types.HourlyActivityStat>) {

  public shared ({ caller }) func recordHourlyActivity(hour : Nat, wordsAdded : Nat) : async () {
    let key = caller.toText() # "|" # Nat.toText(hour);
    switch (hourlyStats.get(key)) {
      case (?existing) {
        hourlyStats.add(key, {
          existing with
          wordsAdded = existing.wordsAdded + wordsAdded;
        });
      };
      case null {
        let newId = hourlyStats.size();
        hourlyStats.add(key, {
          id = newId;
          ownerId = caller;
          hour;
          wordsAdded;
        });
      };
    };
  };

  public shared ({ caller }) func getHourlyDistribution() : async [Types.HourlyActivityStat] {
    var result : List.List<Types.HourlyActivityStat> = List.empty();
    for ((_, stat) in hourlyStats.entries()) {
      if (Principal.equal(stat.ownerId, caller)) {
        result.add(stat);
      };
    };
    result.toArray()
  };

}
