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

source = source.replace(
  '<PortalSection title="Weekly availability" eyebrow="Scheduling" palette={palette}>\n              <div className="space-y-4">',
  '<PortalSection title="Weekly availability" eyebrow="Scheduling" palette={palette}>\n              <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">'
);
source = source.replaceAll(
  '<div key={key} className="rounded-2xl border bg-black/[0.02] p-4" style={{ borderColor: palette.border }}>',
  '<div key={key} className="rounded-2xl border bg-black/[0.02] p-3" style={{ borderColor: palette.border }}>'
);
source = source.replaceAll(
  '<div className="mb-3 text-sm font-black" style={{ color: palette.charcoal }}>{day}</div>\n                    <div className="flex flex-wrap gap-2">',
  '<div className="mb-2 text-sm font-black" style={{ color: palette.charcoal }}>{day}</div>\n                    <div className="grid gap-2 sm:grid-cols-2">'
);

source = source.replace(
  '<Save size={17} /> {saving ? "Saving..." : "Save matching profile"}',
  '<Save size={17} /> {saving ? "Saving..." : "Save Profile"}'
);
source = source.replace(
  'Upload, replace, download, or delete onboarding files. Do not upload assignment-specific, consumer-specific, medical, legal, or educational records.',
  'Important: Selecting a file does not upload it. Click the Upload button for each document before saving your profile or leaving the page. Do not upload assignment-specific, consumer-specific, medical, legal, or educational records.'
);
source = source.replace(
  'Upload, replace, download, or manage onboarding files. Selected files are submitted when you click Upload or Save profile & selected files. Do not upload assignment-specific, consumer-specific, medical, legal, or educational records.',
  'Important: Selecting a file does not upload it. Click the Upload button for each document before saving your profile or leaving the page. Do not upload assignment-specific, consumer-specific, medical, legal, or educational records.'
);
source = source.replace(
  'Upload, replace, download, or delete onboarding files.',
  'Important: Selecting a file does not upload it. Click the Upload button for each document before saving your profile or leaving the page.'
);

fs.writeFileSync(portalPagePath, source);

const wizardPath = 'src/components/ProfileSetupWizard.jsx';
if (fs.existsSync(wizardPath)) {
  let wizard = fs.readFileSync(wizardPath, 'utf8');
  wizard = wizard.replace(
    '<WizardHeading title="When are you generally available?" palette={palette} mutedText={bodyText} />\n              <div className="space-y-4">',
    '<WizardHeading title="When are you generally available?" palette={palette} mutedText={bodyText} />\n              <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">'
  );
  wizard = wizard.replaceAll(
    '<div key={key} className="rounded-2xl border p-4" style={{ borderColor: palette.border, backgroundColor: softBackground }}>',
    '<div key={key} className="rounded-2xl border p-3" style={{ borderColor: palette.border, backgroundColor: softBackground }}>'
  );
  wizard = wizard.replaceAll(
    '<div className="mb-3 text-sm font-black" style={{ color: palette.charcoal }}>{day}</div>\n                    <div className="flex flex-wrap gap-2">',
    '<div className="mb-2 text-sm font-black" style={{ color: palette.charcoal }}>{day}</div>\n                    <div className="grid gap-2 sm:grid-cols-2">'
  );
  fs.writeFileSync(wizardPath, wizard);
}
