const fs = require('fs');

const portalPagePath = 'src/pages/InterpreterPortal.jsx';
if (!fs.existsSync(portalPagePath)) process.exit(0);

let source = fs.readFileSync(portalPagePath, 'utf8');

if (!source.includes('ProfileSetupWizard')) {
  source = source.replace(
    'import PortalSetupNotice from "../components/PortalSetupNotice";',
    'import PortalSetupNotice from "../components/PortalSetupNotice";\nimport ProfileSetupWizard, { profileNeedsSetup } from "../components/ProfileSetupWizard";'
  );
}

if (!source.includes('setupWizardActive')) {
  source = source.replace(
    '  const [saving, setSaving] = useState(false);\n  const [documentFiles, setDocumentFiles] = useState({});',
    '  const [saving, setSaving] = useState(false);\n  const [setupWizardActive, setSetupWizardActive] = useState(false);\n  const [documentFiles, setDocumentFiles] = useState({});'
  );
}

if (!source.includes('setSetupWizardActive(profileNeedsSetup(nextProfile))')) {
  source = source.replace(
    '        setProfile({ ...defaultProfile, ...(data.profile || {}) });\n        setDocuments(data.documents || []);',
    '        const nextProfile = { ...defaultProfile, ...(data.profile || {}) };\n        setProfile(nextProfile);\n        setDocuments(data.documents || []);\n        setSetupWizardActive(profileNeedsSetup(nextProfile));'
  );
}

if (!source.includes('<ProfileSetupWizard')) {
  source = source.replace(
    '  return (\n    <div className="bg-[#f7f3ef] px-5 py-12 md:px-8 md:py-16">',
    `  if (setupWizardActive) {
    return (
      <ProfileSetupWizard
        profile={profile}
        primaryEmail={primaryEmail}
        user={user}
        palette={palette}
        portalRequest={portalRequest}
        onComplete={(nextProfile) => {
          setProfile({ ...defaultProfile, ...(nextProfile || {}) });
          setSetupWizardActive(false);
          setMessage("Profile setup completed. You can update your details anytime from the portal.");
        }}
      />
    );
  }

  return (
    <div className="bg-[#f7f3ef] px-5 py-12 md:px-8 md:py-16">`
  );
}

fs.writeFileSync(portalPagePath, source);
