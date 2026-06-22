import TtsLib "../lib/tts";
import Blob "mo:core/Blob";

mixin () {
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

  // Public method — no owner auth required since apiKey is user-provided.
  public func synthesizeSpeech(text : Text, voice : Text, apiKey : Text) : async Blob {
    await TtsLib.synthesizeSpeech(text, voice, apiKey, ttsTransform)
  };
}
