import Map "mo:core/Map";
import List "mo:core/List";
import Types "../types";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Random "mo:core/Random";
import Char "mo:core/Char";

mixin (
  books : Map.Map<Nat, Types.Book>,
  inviteCodes : Map.Map<Text, Types.InviteCode>,
) {

  func isAdmin(caller : Principal) : Bool {
    var firstOwner : ?Principal = null;
    for ((_, book) in books.entries()) {
      firstOwner := ?book.ownerId;
      break;
    };
    switch (firstOwner) {
      case (?owner) { Principal.equal(owner, caller) };
      case null { false };
    }
  };

  func hasAnyBook(caller : Principal) : Bool {
    for ((_, book) in books.entries()) {
      if (Principal.equal(book.ownerId, caller)) {
        return true;
      };
    };
    false
  };

  func generateRandomCode() : Text {
    let charArray = [
      'A','B','C','D','E','F','G','H','I','J','K','L','M',
      'N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
      'a','b','c','d','e','f','g','h','i','j','k','l','m',
      'n','o','p','q','r','s','t','u','v','w','x','y','z',
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

  public shared ({ caller }) func checkAccess() : async Types.AccessCheckResult {
    if (isAdmin(caller)) {
      #Admin
    } else if (hasAnyBook(caller)) {
      #ExistingUser
    } else {
      #NewUserNeedsCode
    }
  };

  public shared ({ caller }) func generateInviteCode(maxUses : Nat, expiresAt : ?Int) : async Text {
    if (not isAdmin(caller)) {
      Runtime.trap("Only admin can generate invite codes");
    };
    var code = generateRandomCode();
    while (inviteCodes.get(code) != null) {
      code := generateRandomCode();
    };
    let inviteCode : Types.InviteCode = {
      code;
      status = #active;
      createdAt = Time.now();
      expiresAt;
      maxUses;
      usedCount = 0;
      claimedBy = [];
    };
    inviteCodes.add(code, inviteCode);
    code
  };

  public shared ({ caller }) func claimInviteCode(code : Text) : async Bool {
    switch (inviteCodes.get(code)) {
      case (?inviteCode) {
        if (inviteCode.status != #active) {
          return false;
        };
        switch (inviteCode.expiresAt) {
          case (?exp) {
            if (Time.now() > exp) {
              return false;
            };
          };
          case null {};
        };
        if (inviteCode.usedCount >= inviteCode.maxUses) {
          return false;
        };
        let alreadyClaimed = inviteCode.claimedBy.find(func(p : Principal) : Bool {
          Principal.equal(p, caller)
        });
        if (alreadyClaimed != null) {
          return false;
        };
        let newUsedCount = inviteCode.usedCount + 1;
        let newStatus = if (newUsedCount >= inviteCode.maxUses) {
          #exhausted
        } else {
          inviteCode.status
        };
        let updatedClaimedBy = List.empty<Principal>();
        for (p in inviteCode.claimedBy.vals()) {
          updatedClaimedBy.add(p);
        };
        updatedClaimedBy.add(caller);
        let updatedInviteCode : Types.InviteCode = {
          inviteCode with
          usedCount = newUsedCount;
          status = newStatus;
          claimedBy = updatedClaimedBy.toArray();
        };
        inviteCodes.add(code, updatedInviteCode);
        true
      };
      case null { false }
    }
  };

  public shared ({ caller }) func listInviteCodes() : async [Types.InviteCode] {
    if (not isAdmin(caller)) {
      Runtime.trap("Only admin can list invite codes");
    };
    var result = List.empty<Types.InviteCode>();
    for ((_, inviteCode) in inviteCodes.entries()) {
      result.add(inviteCode);
    };
    result.toArray()
  };

  public shared ({ caller }) func revokeInviteCode(code : Text) : async Bool {
    if (not isAdmin(caller)) {
      Runtime.trap("Only admin can revoke invite codes");
    };
    switch (inviteCodes.get(code)) {
      case (?inviteCode) {
        let updatedInviteCode : Types.InviteCode = {
          inviteCode with
          status = #revoked;
        };
        inviteCodes.add(code, updatedInviteCode);
        true
      };
      case null { false }
    }
  };
};
