import Func "mo:base/Func";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Text "mo:base/Text";

import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Array "mo:base/Array";

actor {
  // Post data structure
  public type Post = {
    id: Nat;
    title: Text;
    body: Text;
    author: Principal;
    timestamp: Int;
  };

  // Stable variable to store posts
  stable var posts: [Post] = [];

  // Function to create a new post
  public shared({caller}) func createPost(title: Text, body: Text) : async Nat {
    let newPost = {
      id = posts.size();
      title = title;
      body = body;
      author = caller;
      timestamp = Time.now();
    };
    // Correctly concatenate arrays using Array.append
    posts := Array.append([newPost], posts);
    return newPost.id;
  };

  // Function to get all posts
  public query func getPosts() : async [Post] {
    return posts;
  };
}
