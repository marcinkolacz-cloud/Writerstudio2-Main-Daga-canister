import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Int "mo:core/Int";

module {
  public type InviteCode = {
    code : Text;
    createdAt : Int;
    usedBy : ?Principal;
    usedAt : ?Int;
  };

  public func generateRandomCode() : Text {
    let charArray = [
      'A','B','C','D','E','F','G','H','I','J','K','L','M',
      'N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
      '0','1','2','3','4','5','6','7','8','9'
    ];
    let charCount = charArray.size();
    var code = "";
    var i = 0;
    var seed = Int.abs(Time.now());
    while (i < 8) {
      seed := (seed * 1103515245 + 12345) % 2147483648;
      let idx = seed % charCount;
      code := code # charArray[idx].toText();
      i += 1;
    };
    code
  };

  public func checkAndUseCode(
    codes : Map.Map<Text, InviteCode>,
    code : Text,
    caller : Principal,
  ) : Bool {
    switch (codes.get(code)) {
      case (?inviteCode) {
        switch (inviteCode.usedBy) {
          case (?_) { false };
          case null {
            let updated : InviteCode = {
              inviteCode with
              usedBy = ?caller;
              usedAt = ?Time.now();
            };
            codes.add(code, updated);
            true
          };
        };
      };
      case null { false }
    }
  };

  public func listCodes(codes : Map.Map<Text, InviteCode>) : [InviteCode] {
    var result = List.empty<InviteCode>();
    for ((_, inviteCode) in codes.entries()) {
      result.add(inviteCode);
    };
    result.toArray()
  };

  public func revokeCode(codes : Map.Map<Text, InviteCode>, code : Text) : () {
    let _ = codes.delete(code);
  };
}
