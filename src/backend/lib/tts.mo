import Blob "mo:core/Blob";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Char "mo:core/Char";

module {
  // Management canister principal for IC HTTPS outcalls
  let icManagementCanister = actor "aaaaa-aa" : actor {
    http_request : {
      url : Text;
      max_response_bytes : ?Nat64;
      method : { #get; #head; #post };
      headers : [{ name : Text; value : Text }];
      body : ?Blob;
      transform : ?{
        function : shared query ({ response : { status : Nat; headers : [{ name : Text; value : Text }]; body : Blob }; context : Blob }) -> async ({ status : Nat; headers : [{ name : Text; value : Text }]; body : Blob });
        context : Blob;
      };
    } -> async { status : Nat; headers : [{ name : Text; value : Text }]; body : Blob };
  };

  // Transform function to normalize response headers for IC consensus.
  // IC requires all replicas to see the same response; stripping headers
  // eliminates variance caused by things like Date, X-Request-ID, etc.
  // Transform function moved to mixin as public shared query func for IC consensus.
  // Kept here as a helper for reference but the actual callable is in TtsApi.mo.

  public func synthesizeSpeech(
    text : Text,
    voice : Text,
    apiKey : Text,
    transform : shared query ({
      response : { status : Nat; headers : [{ name : Text; value : Text }]; body : Blob };
      context : Blob;
    }) -> async { status : Nat; headers : [{ name : Text; value : Text }]; body : Blob }
  ) : async Blob {
    let jsonBody = "{ \"model\": \"tts-1\", \"input\": \"" # escapeJson(text) # "\", \"voice\": \"" # voice # "\" }";

    let request = {
      url = "https://writerstudio-tts.marcinkolacz.workers.dev";
      // Was null (unbounded) — an attacker could force the canister to
      // pay for an arbitrarily large response. 10 MB comfortably covers
      // a few minutes of MP3 audio.
      max_response_bytes = ?(10_000_000 : Nat64);
      method = #post;
      headers = [
        { name = "Content-Type"; value = "application/json" },
        { name = "Authorization"; value = "Bearer " # apiKey },
      ];
      body = ?jsonBody.encodeUtf8();
      transform = ?{
        function = transform;
        context = Blob.fromArray([]);
      };
    };

    let response = await icManagementCanister.http_request(request);

    if (response.status < 200 or response.status >= 300) {
      Runtime.trap("TTS request failed with status " # Nat.toText(response.status));
    };

    response.body
  };

  // Minimal JSON string escaping for the request body
  // Minimal JSON string escaping for the request body
  func escapeJson(s : Text) : Text {
    var result = s;
    result := result.replace(#text "\\", "\\\\");
    result := result.replace(#text "\"", "\\\"");
    result := result.replace(#text "\n", "\\n");
    result := result.replace(#text "\r", "\\r");
    result := result.replace(#text "\t", "\\t");
    result
  };
}
