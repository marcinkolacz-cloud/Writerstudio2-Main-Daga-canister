import TtsLib "../lib/tts";
import Blob "mo:core/Blob";
import Map "mo:core/Map";
import Types "../types";
import BooksLib "../lib/Books";
import InvitesLib "../lib/invites";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

mixin (
  books : Map.Map<Nat, Types.Book>,
  inviteCodes : Map.Map<Text, Types.InviteCode>,
) {
  // Transform function required by IC for HTTPS outcall consensus.
  // Must be public shared query so the IC can call it across replicas.
  public shared query func ttsTransform(
    raw : {
      response : { status : Nat; headers : [{ name : Text; value : Text }]; body : Blob };
      context : Blob;
    }
  ) : async { status : Nat; headers : [{ name : Text; value : Text }]; body : Blob } {
    {
      status = raw.response.status;
      headers = []; // strip all headers for consensus
      body = raw.response.body;
    }
  };

  // SAFETY: this used to be `public func` with NO caller check at all —
  // anyone on the internet, without even an invite code, could trigger a
  // real IC HTTPS outcall (real cycle cost) with a garbage/empty apiKey.
  // The outcall's cycle cost is paid whether or not the key is valid, so
  // this was an open cycle-drain vector. Now requires being a known,
  // invited user, same as createBook. Text length is also capped —
  // OpenAI's TTS API itself rejects inputs over 4096 characters, so this
  // just fails fast instead of paying for an outcall that OpenAI would
  // reject anyway.
  public shared ({ caller }) func synthesizeSpeech(text : Text, voice : Text, apiKey : Text) : async Blob {
    let known = BooksLib.hasBook(books, caller) or InvitesLib.hasRedeemed(inviteCodes, caller);
    if (not known) {
      Runtime.trap("Access required");
    };
    if (text.size() > 4096) {
      Runtime.trap("Text too long (max 4096 characters)");
    };
    await TtsLib.synthesizeSpeech(text, voice, apiKey, ttsTransform)
  };
}
