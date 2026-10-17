import assert from "node:assert/strict";
import test from "node:test";
import {
  getServiceFinderQuestions,
  getServiceFinderResult,
  serviceFinderRequestPath,
} from "../../src/lib/serviceFinder.js";

test("live online requests include the video suitability question", () => {
  const ids = getServiceFinderQuestions({ goal: "live", venue: "remote" }).map((q) => q.id);
  assert.deepEqual(ids, ["goal", "venue", "setting", "access", "tech"]);
});

test("prepared translations use a shorter flow", () => {
  const ids = getServiceFinderQuestions({ goal: "english-asl" }).map((q) => q.id);
  assert.deepEqual(ids, ["goal", "use", "timing"]);
});

test("online meetings with workable technology point to VRI", () => {
  const result = getServiceFinderResult({
    goal: "live", venue: "remote", setting: "business", access: "no", tech: "yes",
  });
  assert.equal(result.id, "video-remote-interpreting");
  assert.match(serviceFinderRequestPath(result), /^\/contact\?service=Video\+Remote\+Interpreting/);
});

test("in-person medical assignments point to on-site support with review", () => {
  const result = getServiceFinderResult({
    goal: "live", venue: "in-person", setting: "medical", access: "no",
  });
  assert.equal(result.id, "in-person-interpreting");
  assert.match(result.note, /qualifications/);
  assert.match(serviceFinderRequestPath(result), /setting=Medical/);
});

test("translation direction stays correct", () => {
  assert.equal(getServiceFinderResult({ goal: "english-asl", timing: "planned" }).id, "english-asl-translation");
  assert.equal(getServiceFinderResult({ goal: "asl-english", timing: "soon" }).id, "asl-english-translation");
});

test("additional communication support is not automatically routed to VRI", () => {
  const result = getServiceFinderResult({
    goal: "live", venue: "remote", setting: "mental", access: "yes", tech: "yes",
  });
  assert.equal(result.review, true);
  assert.equal(result.id, null);
});

test("poor or untested remote technology requires a custom review", () => {
  for (const tech of ["no", "unsure"]) {
    const result = getServiceFinderResult({
      goal: "live", venue: "remote", setting: "community", access: "no", tech,
    });
    assert.equal(result.review, true);
  }
});

test("undecided visitor can request guidance without forcing a service", () => {
  const result = getServiceFinderResult({ goal: "unsure", material: "unsure" });
  assert.equal(result.review, true);
  assert.equal(serviceFinderRequestPath(result), "/contact#request-form");
});
