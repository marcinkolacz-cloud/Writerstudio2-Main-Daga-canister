import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Random "mo:core/Random";

module {
  public type InviteCode = {
    code : Text;
    createdAt : Int;
    usedBy : ?Principal;
    usedAt : ?Int;
  };

  let charArray = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  ];
  let charCount = 36;

  // Explicitly uses the documented-secure Random.crypto() generator
  // (backed by the IC's raw_rand entropy) rather than calling
  // Random.natRange directly — that bare form isn't the pattern the
  // Motoko docs actually document as cryptographically secure, so this
  // removes any ambiguity for a value (invite codes) that grants real
  // write/admin access.
  public func generateRandomCode() : async Text {
    let rng = Random.crypto();
    var code = "";
    var i = 0;
    while (i < 8) {
      let idx = await* rng.natRange(0, charCount);
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
    let result = List.empty<InviteCode>();
    for ((_, inviteCode) in codes.entries()) {
      result.add(inviteCode);
    };
    result.toArray()
  };

  public func revokeCode(codes : Map.Map<Text, InviteCode>, code : Text) : Bool {
    switch (codes.get(code)) {
      case (?_) {
        codes.remove(code);
        true
      };
      case null { false };
    }
  };

  public func hasRedeemed(codes : Map.Map<Text, InviteCode>, caller : Principal) : Bool {
    for ((_, inviteCode) in codes.entries()) {
      switch (inviteCode.usedBy) {
        case (?usedBy) {
          if (Principal.equal(usedBy, caller)) {
            return true;
          };
        };
        case null {};
      };
    };
    false
  };
}
