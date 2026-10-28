import { canEditPresentationPlan, canPresentPlan } from './presentation-plan.policies';

describe('canEditPresentationPlan', () => {
  it('should let a notice be edited until it is presented', () => {
    expect(canEditPresentationPlan({ isPresented: false })).toBe(true);
    expect(canEditPresentationPlan({ isPresented: true })).toBe(false);
  });
});

describe('canPresentPlan', () => {
  it('should let a validated notice be presented once', () => {
    expect(canPresentPlan({ isPresented: false, isValidated: true })).toBe(true);
    expect(canPresentPlan({ isPresented: true, isValidated: true })).toBe(false);
  });

  it('should keep a draft notice from being presented', () => {
    expect(canPresentPlan({ isPresented: false, isValidated: false })).toBe(false);
  });
});
