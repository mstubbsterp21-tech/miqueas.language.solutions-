const fs = require('fs');

const portalPath = 'src/pages/InterpreterPortal.jsx';
if (!fs.existsSync(portalPath)) process.exit(0);

let page = fs.readFileSync(portalPath, 'utf8');

if (!page.includes('value: "ic_agreement"')) {
  page = page.replace(
    '{ value: "liability_insurance", label: "Liability insurance", required: true, description: "Professional liability policy certificate or proof of coverage." },',
    '{ value: "liability_insurance", label: "Liability insurance", required: true, description: "Professional liability policy certificate or proof of coverage." },\n  { value: "ic_agreement", label: "IC Agreement", required: true, description: "Signed independent contractor agreement for MLS onboarding." },'
  );
}

page = page.replace('Résumé, W-9, credential proof, insurance', 'Résumé, W-9, credential proof, insurance, IC agreement');

fs.writeFileSync(portalPath, page);
