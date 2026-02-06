import UserName "user-name";
import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";
import MixinAuthorization "authorization/MixinAuthorization";
import Runtime "mo:core/Runtime";



actor {
  var requestCounter = 0;
  let userProfiles = Map.empty<Principal, { name : Text }>();
  let accessRequests = Map.empty<Principal, { name : Text; fourCharId : Text }>();
  let notifications = Map.empty<Text, Text>();
  let notifications2 = Map.empty<Text, Text>();

  // AccessControl and UserApproval are re-initialized from migration
  var accessControlState = AccessControl.initState();
  var approvalState = UserApproval.initState(accessControlState);

  include MixinAuthorization(accessControlState);

  public type UserNameInfo = {
    principal : Principal;
    name : Text;
    fourCharId : Text;
    status : UserApproval.ApprovalStatus;
  };

  func isApprovedOrAdmin(caller : Principal) : Bool {
    AccessControl.isAdmin(accessControlState, caller) or UserApproval.isApproved(approvalState, caller);
  };

  public query ({ caller }) func isCallerApproved() : async Bool {
    isApprovedOrAdmin(caller);
  };

  public query ({ caller }) func getUserRole(user : Principal) : async AccessControl.UserRole {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view other user roles");
    };
    AccessControl.getUserRole(accessControlState, user);
  };

  public shared ({ caller }) func requestApprovalWithName(name : Text) : async { name : Text; fourCharId : Text } {
    if (isApprovedOrAdmin(caller)) {
      Runtime.trap("You're already approved");
    };

    let fourCharId = generateFourCharId(requestCounter);
    let request = { name; fourCharId };

    accessRequests.add(caller, request);
    requestCounter += 1;
    UserApproval.requestApproval(approvalState, caller);
    request;
  };

  public shared ({ caller }) func getAccessRequest(user : Principal) : async { name : Text; fourCharId : Text } {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own access request or admin required");
    };

    let recordNumberPadding = "NON-IMPL";
    switch (accessRequests.get(user)) {
      case (null) {
        Runtime.trap("No access request found for this user. If you are an admin, this is expected behavior for already-approved users and you should handle it gracefully with a fallback.");
      };
      case (?request) {
        { request with fourCharId = recordNumberPadding # request.fourCharId };
      };
    };
  };

  public shared ({ caller }) func requestApproval() : async () {
    Runtime.trap("Deprecated: Use requestApprovalWithName instead");
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    requireAdmin(caller);

    if (status == #approved) {
      accessRequests.remove(user);
    };

    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    requireAdmin(caller);
    UserApproval.listApprovals(approvalState);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?{ name : Text } {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?{ name : Text } {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : { name : Text }) : async () {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can save profile");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func addContent(id : Text, content : Text) : async () {
    requireAdmin(caller);
    notifications.add(id, content);
  };

  public query ({ caller }) func getContent(id : Text) : async Text {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can retrieve content");
    };
    switch (notifications.get(id)) {
      case (null) { Runtime.trap("Content not found") };
      case (?content) { content };
    };
  };

  public shared ({ caller }) func addContent2(id : Text, content : Text) : async () {
    requireAdmin(caller);
    notifications2.add(id, content);
  };

  public query ({ caller }) func getContent2(id : Text) : async Text {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can retrieve content");
    };
    switch (notifications2.get(id)) {
      case (null) { Runtime.trap("Content not found") };
      case (?content) { content };
    };
  };

  // Reset all application data while preserving admin identities
  public shared ({ caller }) func backendReset() : async () {
    requireAdmin(caller);
    
    // Clear user profiles
    for ((key, _) in userProfiles.entries()) {
      userProfiles.remove(key);
    };
    
    // Clear content stores
    for ((key, _) in notifications.entries()) {
      notifications.remove(key);
    };
    for ((key, _) in notifications2.entries()) {
      notifications2.remove(key);
    };
    
    // Clear access requests
    for ((key, _) in accessRequests.entries()) {
      accessRequests.remove(key);
    };
    
    // Reset counter
    requestCounter := 0;
    
    // Reset approval state while preserving accessControlState (which contains admin roles)
    approvalState := UserApproval.initState(accessControlState);
  };

  func requireAdmin(caller : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  func generateFourCharId(counter : Nat) : Text {
    let maxId = 26 ** 4;
    let adjustedCounter = counter % maxId;
    let chars = "abcdefghijklmnopqrstuvwxyz";
    var id = adjustedCounter;
    var result : [Char] = [];
    var i = 0;
    while (i < 4) {
      let charIndex = id % 26;
      let charIndexNat = if (charIndex > 25) { 25 : Nat } else { charIndex };
      let charIter = chars.chars().drop(charIndexNat);
      switch (charIter.next()) {
        case (?c) { result := result.concat([c]) };
        case (null) {};
      };
      id /= 26;
      i += 1;
    };
    Text.fromIter(result.reverse().values());
  };

  // New endpoint for admin to see all users with name information
  public query ({ caller }) func getAllUsersWithFullName() : async [UserNameInfo] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let finalizedUsersIter = userProfiles.entries().map(
      func((principal, { name })) {
        {
          principal;
          name;
          fourCharId = "finalized";
          status = #approved : UserApproval.ApprovalStatus;
        };
      }
    );

    let accessRequestsIter = accessRequests.entries().map(
      func((principal, { name; fourCharId })) {
        {
          principal;
          name;
          fourCharId;
          status = #pending : UserApproval.ApprovalStatus;
        };
      }
    );

    finalizedUsersIter.concat(accessRequestsIter).toArray();
  };

  public func greet(name : Text) : async Text {
    "Hello, " # name # "!";
  };
};
