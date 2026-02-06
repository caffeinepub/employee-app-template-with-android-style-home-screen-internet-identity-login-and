import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  // Old actor state type.
  type OldActor = {
    userProfiles : Map.Map<Principal, { name : Text }>;
    notifications : Map.Map<Text, Text>;
    accessRequests : Map.Map<Principal, { name : Text; fourCharId : Text }>;
    requestCounter : Nat;
  };

  // New actor state type.
  type NewActor = {
    userProfiles : Map.Map<Principal, { name : Text }>;
    notifications : Map.Map<Text, Text>;
    accessRequests : Map.Map<Principal, { name : Text; fourCharId : Text }>;
    requestCounter : Nat;
  };

  // Migration function.
  public func run(old : OldActor) : NewActor {
    {
      userProfiles = old.userProfiles;
      notifications = old.notifications;
      accessRequests = old.accessRequests;
      requestCounter = old.requestCounter;
    };
  };
};
