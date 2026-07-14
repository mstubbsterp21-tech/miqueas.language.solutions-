import FirstLoginSetupWizard, { needsFirstLoginSetup } from "./FirstLoginSetupWizard";

export { needsFirstLoginSetup };

export default function ClerkFirstLoginSetupWizard(props) {
  const { role, profile, user } = props;
  const clerkIdentity = {
    first_name: user?.firstName || profile?.first_name || "",
    last_name: user?.lastName || profile?.last_name || "",
    email: user?.email || profile?.email || "",
  };

  const resolvedProfile = role === "interpreter"
    ? { ...(profile || {}), ...clerkIdentity }
    : profile;

  return <FirstLoginSetupWizard {...props} profile={resolvedProfile} />;
}
