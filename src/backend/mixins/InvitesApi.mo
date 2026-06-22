import Map "mo:core/Map";
import Types "../types";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import InvitesLib "../lib/invites";

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

  public shared ({ caller }) func generateInviteCode() : async Text {
    if (not isAdmin(caller)) {
      Runtime.trap("Only admin can generate invite codes");
    };
    var code = InvitesLib.generateRandomCode();
    while (inviteCodes.get(code) != null) {
      code := InvitesLib.generateRandomCode();
    };
    let inviteCode : Types.InviteCode = {
      code;
      createdAt = Time.now();
      usedBy = null;
      usedAt = null;
    };
    inviteCodes.add(code, inviteCode);
    code
  };

  public shared ({ caller }) func checkAccess(code : Text) : async Bool {
    InvitesLib.checkAndUseCode(inviteCodes, code, caller)
  };

  public shared ({ caller }) func listInviteCodes() : async [Types.InviteCode] {
    if (not isAdmin(caller)) {
      Runtime.trap("Only admin can list invite codes");
    };
    InvitesLib.listCodes(inviteCodes)
  };

  public shared ({ caller }) func revokeInviteCode(code : Text) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Only admin can revoke invite codes");
    };
    InvitesLib.revokeCode(inviteCodes, code);
  };
};
