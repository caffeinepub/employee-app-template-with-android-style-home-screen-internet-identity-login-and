import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";
import MixinAuthorization "authorization/MixinAuthorization";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Iter "mo:core/Iter";



actor {
  // Persistent user data.
  let userProfiles = Map.empty<Principal, { name : Text }>();

  // Persistent notification/content data.
  let notifications = Map.empty<Text, Text>();

  // Persistent access request data.
  let accessRequests = Map.empty<Principal, { name : Text; fourCharId : Text }>();

  // Persistent counter for generating identifiers (survives upgrades)
  var requestCounter = 0;

  // Initialize the authorization system state.
  let accessControlState = AccessControl.initState();

  // Persistent MixinAuthorization integration.
  include MixinAuthorization(accessControlState);

  // Reinitialize user approval component to avoid actor state dependency.
  let approvalState = UserApproval.initState(accessControlState);

  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  // New function to handle approval requests with name and generate persistent identifier.
  public shared ({ caller }) func requestApprovalWithName(name : Text) : async { name : Text; fourCharId : Text } {
    if (UserApproval.isApproved(approvalState, caller) or AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("You are already approved");
    };

    let fourCharId = generateFourCharId(requestCounter);

    let request = {
      name;
      fourCharId;
    };

    accessRequests.add(caller, request);
    requestCounter += 1;

    UserApproval.requestApproval(approvalState, caller);
    request;
  };

  // Deprecated legacy endpoint now expected by frontend code.
  public shared ({ caller }) func requestApproval() : async () {
    Runtime.trap("Deprecated: Please use requestApprovalWithName instead");
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    // Only admins can approve/reject.
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Only admins can set approval status");
    };

    // Remove access request if approved.
    if (status == #approved) {
      accessRequests.remove(user);
    };

    // Persist pending approval.
    UserApproval.setApproval(approvalState, user, status);
  };

  // Returns the complete approval list (deprecated/compat).
  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Only admins can access the approval list");
    };
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
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Only approved users can save profile");
    };
    userProfiles.add(caller, profile);
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
