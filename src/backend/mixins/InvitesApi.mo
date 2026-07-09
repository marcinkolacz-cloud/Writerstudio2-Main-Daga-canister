import Map "mo:core/Map";
import Types "../types";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import InvitesLib "../lib/invites";

mixin (
  books : Map.Map<Nat, Types.Book>,
  inviteCodes : Map.Map<Text, Types.InviteCode>,
) {
  func _generateInviteCode(caller : Principal) : async Text {
    var code = await InvitesLib.generateRandomCode();
    while (inviteCodes.get(code) != null) {
      code := await InvitesLib.generateRandomCode();
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

  func _checkAccess(code : Text, caller : Principal) : Bool {
    InvitesLib.checkAndUseCode(inviteCodes, code, caller)
  };

  func _listInviteCodes() : [Types.InviteCode] {
    InvitesLib.listCodes(inviteCodes)
  };

  func _revokeInviteCode(code : Text) : Bool {
    InvitesLib.revokeCode(inviteCodes, code)
  };
};
