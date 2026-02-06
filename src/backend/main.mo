import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";
import MixinAuthorization "authorization/MixinAuthorization";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Migration "migration";

// Specify the data migration function in with-clause
(with migration = Migration.run)
actor {
  // Persistent user data.
  let userProfiles = Map.empty<Principal, { name : Text }>();

  // Persistent notification/content data.
  let notifications = Map.empty<Text, Text>();

  // Persistent access request data.
  let accessRequests = Map.empty<Principal, { name : Text; fourCharId : Text }>();

  // Persistent counter for generating identifiers (survives upgrades)
  var requestCounter = 0;

  // Persistent access control state and MixinAuthorization integration.
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Initialize user approval component with persistent access control state.
  let approvalState = UserApproval.initState(accessControlState);

  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  // Completes reset and generates new pending request for previously deleted users
  public shared ({ caller }) func requestApprovalWithName(name : Text) : async { name : Text; fourCharId : Text } {
    // Admins cannot request approval for themselves
    if (AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Admins do not need approval");
    };

    // Generate new identifier
    let fourCharId = generateFourCharId(requestCounter);

    let request = {
      name;
      fourCharId;
    };

    // Store new access request
    accessRequests.add(caller, request);
    requestCounter += 1;

    // Create new pending approval request
    UserApproval.requestApproval(approvalState, caller);

    request;
  };

  // Legacy endpoint maintained for compatibility.
  public shared ({ caller }) func requestApproval() : async () {
    Runtime.trap("Please use 'requestApprovalWithName' to provide your name and receive your identifier.");
  };

  // Deprecated but necessary for backward compatibility
  // AUTHORIZATION: Prevent modification of name after approval
  public shared ({ caller }) func saveCallerUserProfile(profile : { name : Text }) : async () {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Only approved users can save profile");
    };

    // Prevent changing the name - it must remain immutable
    switch (userProfiles.get(caller)) {
      case (?_) {
        // Profile already exists - name cannot be changed
        Runtime.trap("Unauthorized: Profile name cannot be changed after approval");
      };
      case (null) {
        // This should not happen in normal flow, but allow profile creation
        // only if there's no existing profile
        userProfiles.add(caller, profile);
      };
    };
  };

  // Returns the complete approval list (deprecated/compat).
  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Only admins can access the approval list");
    };
    UserApproval.listApprovals(approvalState);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    // Only admins can approve/reject.
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Only admins can set approval status");
    };

    // When approving, create the user profile with the name from access request
    if (status == #approved) {
      switch (accessRequests.get(user)) {
        case (?request) {
          // Create the permanent user profile with the name from the access request
          userProfiles.add(user, { name = request.name });
          // Remove access request after creating profile
          accessRequests.remove(user);
        };
        case (null) {
          // No access request found - cannot approve without a name
          Runtime.trap("Cannot approve: No access request found for user");
        };
      };
    } else if (status == #rejected) {
      // When rejecting, clean up the access request
      accessRequests.remove(user);
    };

    // Persist approval status
    UserApproval.setApproval(approvalState, user, status);
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

  public shared ({ caller }) func addContent(id : Text, content : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Only admins can add content");
    };
    notifications.add(id, content);
  };

  public query ({ caller }) func getContent(id : Text) : async Text {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Only approved users can retrieve content");
    };
    switch (notifications.get(id)) {
      case (null) { Runtime.trap("Content not found") };
      case (?content) { content };
    };
  };

  // Helper function to generate 4-character identifier from counter.
  func generateFourCharId(counter : Nat) : Text {
    let maxId = 26 ** 4; // 26^4 possible combinations
    let adjustedCounter = counter % maxId;
    let chars = "abcdefghijklmnopqrstuvwxyz";
    var id = adjustedCounter;
    var result = "";

    var i = 0;
    while (i < 4) {
      let charIndex = id % 26;
      let charIndexNat = if (charIndex > 25) { 25 : Nat } else { charIndex };
      let charIter = chars.chars().drop(charIndexNat);
      switch (charIter.next()) {
        case (?c) { result := Text.fromChar(c) # result };
        case (null) {};
      };
      id /= 26;
      i += 1;
    };

    result;
  };
};
