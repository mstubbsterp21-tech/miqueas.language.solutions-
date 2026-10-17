// Lightweight, deterministic guidance for the public service finder.
// This is preliminary guidance only. MLS confirms the final service plan.
export const SERVICE_OPTIONS = {
  "in-person-interpreting": {
    title: "In-Person Interpreting",
    requestValue: "In-Person Interpreting",
    description: "An interpreter joins an appointment, meeting, or event on site to support live communication.",
  },
  "video-remote-interpreting": {
    title: "Video Remote Interpreting (VRI)",
    requestValue: "Video Remote Interpreting",
    description: "An interpreter joins a live interaction by video when the platform and communication setup are appropriate.",
  },
  "english-asl-translation": {
    title: "English → ASL Video Translation",
    requestValue: "ASL Video Translation (English → ASL)",
    description: "Written or spoken English becomes a recorded ASL video that can be shared and reused.",
  },
  "asl-english-translation": {
    title: "ASL → English Translation",
    requestValue: "ASL Content Translation (ASL → English)",
    description: "Existing ASL video becomes an English transcript, captions, summary, or written translation.",
  },
};

const question = (id, title, help, options) => ({ id, title, help, options });

const GOAL = question("goal", "What are you trying to accomplish?", "Choose the description closest to your situation.", [
  ["live", "Communicate during a live conversation, appointment, or event"],
  ["english-asl", "Turn English content into an ASL video"],
  ["asl-english", "Turn an ASL video into written English or captions"],
  ["unsure", "I'm not sure yet"],
]);

const MATERIAL = question("material", "Which description comes closest?", "This helps us distinguish live interpreting from prepared translation.", [
  ["live", "People need to communicate with each other live"],
  ["english-asl", "I have English text, audio, or video to make accessible in ASL"],
  ["asl-english", "I have ASL video that needs an English version"],
  ["unsure", "I could use guidance from MLS"],
]);

const VENUE = question("venue", "Where will the conversation happen?", "Choose based on how participants will meet.", [
  ["in-person", "In person, at a physical location"],
  ["remote", "Online, by video"],
  ["hybrid", "A mix of in-person and remote participants"],
  ["unsure", "Not decided yet"],
]);

const SETTING = question("setting", "What kind of interaction is this?", "This helps flag situations that may need extra preparation or specialist review.", [
  ["medical", "Medical or healthcare"],
  ["mental", "Mental health or counseling"],
  ["legal", "Legal or court-related"],
  ["education", "School or education"],
  ["business", "Workplace or business"],
  ["event", "Conference or large event"],
  ["community", "Everyday community interaction"],
  ["other", "Other / not sure"],
]);

const ACCESS = question("access", "Are additional communication supports likely to be needed?", "For example: tactile/pro-tactile communication, DeafBlind access, a Deaf interpreter, or emerging language needs.", [
  ["no", "No additional needs that I'm aware of"],
  ["yes", "Yes, additional communication supports may be needed"],
  ["unsure", "I'm not sure"],
]);

const TECH = question("tech", "Is reliable, accessible video communication available?", "Think stable internet, clear audio, good camera framing, and a screen that makes signing easy to see.", [
  ["yes", "Yes, the setup supports clear video and audio"],
  ["no", "No, the video setup is not suitable"],
  ["unsure", "I'm not sure / it hasn't been tested"],
]);

const USE = question("use", "How will the translated content be used?", "Your answer helps MLS plan the format and review process.", [
  ["public", "Website, public announcement, or patient-facing information"],
  ["internal", "Training, employee, or internal communication"],
  ["individual", "Personal message, interview, or documentation"],
  ["unsure", "Not decided yet"],
]);

const TIMING = question("timing", "When do you need the service?", "This does not reserve or guarantee availability.", [
  ["soon", "It's time-sensitive"],
  ["planned", "I can plan ahead"],
  ["unsure", "I don't have a timeline yet"],
]);

export function resolveGoal(answers = {}) {
  return answers.goal === "unsure" ? (answers.material || "unsure") : answers.goal;
}

export function getServiceFinderQuestions(answers = {}) {
  const start = [GOAL];
  if (answers.goal === "unsure") start.push(MATERIAL);
  const resolved = resolveGoal(answers);
  if (resolved === "live") {
    start.push(VENUE, SETTING, ACCESS);
    if (["remote", "hybrid"].includes(answers.venue)) start.push(TECH);
  } else if (["english-asl", "asl-english"].includes(resolved)) {
    start.push(USE, TIMING);
  }
  return start;
}

const settingToRequest = {
  medical: "Medical",
  mental: "Mental Health",
  legal: "Legal",
  education: "Edu. K-12",
  business: "Business",
  event: "Platform / Conference",
  community: "General / Community",
};

export function getServiceFinderResult(answers = {}) {
  const goal = resolveGoal(answers);
  const review = (reason) => ({
    id: null,
    title: "Let's find the right access plan together",
    description: "Your situation would benefit from a short, individualized review instead of an automatic recommendation.",
    reason,
    review: true,
    requestSetting: settingToRequest[answers.setting] || "",
  });
  if (goal === "unsure" || !goal) {
    return review("We can clarify whether live interpreting, video interpreting, or recorded translation will meet your needs.");
  }
  if (goal === "english-asl" || goal === "asl-english") {
    const id = goal === "english-asl" ? "english-asl-translation" : "asl-english-translation";
    return {
      id,
      ...SERVICE_OPTIONS[id],
      reason: goal === "english-asl"
        ? "You have English source material and need a recorded ASL deliverable, rather than a live conversation."
        : "You already have content in ASL and need a reusable English-language output.",
      note: answers.timing === "soon" ? "Mention your deadline in the request so MLS can review feasibility and turnaround." : "MLS will review your source material, intended audience, output format, and timeline before quoting.",
      review: false,
      requestSetting: "",
    };
  }
  if (answers.access !== "no") {
    return review("Communication preferences or additional supports should be discussed with the people receiving services before deciding on a modality or interpreter team.");
  }
  if (answers.venue === "unsure" || !answers.venue) {
    return review("The meeting format needs to be confirmed before we can recommend on-site or video interpreting.");
  }
  if (["remote", "hybrid"].includes(answers.venue) && answers.tech !== "yes") {
    return review("Remote interpreting should not be assumed appropriate without reliable, accessible video and audio; an alternative arrangement may be needed.");
  }
  const id = answers.venue === "remote" ? "video-remote-interpreting" : "in-person-interpreting";
  const specialized = ["medical", "mental", "legal", "event"].includes(answers.setting);
  return {
    id,
    ...SERVICE_OPTIONS[id],
    reason: id === "video-remote-interpreting"
      ? "The interaction is remote, and you've indicated that reliable video communication is available."
      : answers.venue === "hybrid"
        ? "A hybrid meeting needs coordinated visual access for participants in the room and online; on-site support is a sensible starting point."
        : "Participants are meeting face to face, so an on-site interpreter is the clearest starting point.",
    note: specialized
      ? "Because this is a specialized or higher-context setting, MLS will review qualifications, preparation, interpreter teaming, and whether the suggested modality is appropriate."
      : "MLS will confirm communication preferences, logistics, interpreter fit, and availability before booking.",
    review: false,
    requestSetting: settingToRequest[answers.setting] || "",
  };
}

export function serviceFinderRequestPath(result) {
  const params = new URLSearchParams();
  if (result?.id) params.set("service", SERVICE_OPTIONS[result.id].requestValue);
  if (result?.requestSetting) params.set("setting", result.requestSetting);
  return `/contact${params.toString() ? `?${params.toString()}` : ""}#request-form`;
}
