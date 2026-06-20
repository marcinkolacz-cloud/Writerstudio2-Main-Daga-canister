import Map "mo:core/Map";
import List "mo:core/List";
import Types "../types";
import Time "mo:core/Time";
import Order "mo:core/Order";

module {
  public func getNextId(comments : Map.Map<Nat, Types.Comment>) : Nat {
    var maxId = 0;
    for ((id, _) in comments.entries()) {
      if (id + 1 > maxId) maxId := id + 1;
    };
    maxId
  };

  public func createCommentRecord(
    id : Nat,
    chapterId : Nat,
    anchorText : Text,
    content : Text,
  ) : Types.Comment {
    {
      id;
      chapterId;
      anchorText;
      content;
      createdAt = Time.now();
    }
  };

  public func filterByChapter(
    comments : Map.Map<Nat, Types.Comment>,
    chapterId : Nat,
  ) : [Types.Comment] {
    var result = List.empty<Types.Comment>();
    for ((_, comment) in comments.entries()) {
      if (comment.chapterId == chapterId) {
        result.add(comment);
      };
    };
    let arr = result.toArray();
    arr.sort(func(a : Types.Comment, b : Types.Comment) : Order.Order {
      Int.compare(a.createdAt, b.createdAt)
    })
  };
}
