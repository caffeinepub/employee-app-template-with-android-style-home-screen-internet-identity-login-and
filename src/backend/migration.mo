module {
  type OldActor = { requestCounter : Nat };
  type NewActor = { requestCounter : Nat };

  public func run(old : OldActor) : NewActor {
    old;
  };
};
