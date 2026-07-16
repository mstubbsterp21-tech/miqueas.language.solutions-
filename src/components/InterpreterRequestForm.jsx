import InterpreterRequestFormShared from "./InterpreterRequestFormShared";

const defaultPalette = {
  burgundy: "#721100",
  gold: "#dd7d00",
  charcoal: "#464747",
  white: "#ffffff",
  softGray: "#f5f5f5",
  border: "#e5e5e5",
};

export default function InterpreterRequestForm({ palette = defaultPalette }) {
  const scriptUrl =
    import.meta.env.VITE_GOOGLE_SCRIPT_URL ||
    "https://script.google.com/macros/s/AKfycbwVCk2VeLlWlMFDY5r_SIR3nSgv4vQ7mOVZ2jmF5vacH3AP50BixZh-IdVqryu0LJ0/exec";

  async function submitToWebsiteRequestSheet(payload) {
    const encodedData = new URLSearchParams();
    Object.entries(payload).forEach(([key, value]) => {
      if (Array.isArray(value)) encodedData.append(key, value.join(", "));
      else if (typeof value === "boolean") encodedData.append(key, value ? "Yes" : "No");
      else encodedData.append(key, value ?? "");
    });

    const response = await fetch(scriptUrl, { method: "POST", body: encodedData });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.status !== "success") {
      throw new Error(result?.message || "Unable to submit request. Please try again.");
    }
  }

  return <InterpreterRequestFormShared palette={{ ...defaultPalette, ...palette }} onSubmitRequest={submitToWebsiteRequestSheet} />;
}
