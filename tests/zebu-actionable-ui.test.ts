import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { getZebuPageLabel, getZebuSuggestions } from "../src/lib/zebu-suggestions";

describe("Zebu actionable workspace UI", () => {
  test("provides concise actions for every primary workspace page", () => {
    const pages = [
      "/dashboard",
      "/dashboard/resumes",
      "/dashboard/job-tracker",
      "/dashboard/work",
      "/dashboard/cover-letters",
      "/dashboard/portfolio",
      "/dashboard/analytics",
      "/dashboard/settings",
      "/dashboard/linkedin",
    ];

    for (const page of pages) {
      const actions = getZebuSuggestions(page);
      assert.equal(actions.length, 3);
      assert.ok(actions.every((action) => action.label.length > 0 && action.prompt.length > action.label.length));
    }
  });

  test("labels detail pages with their real workspace context", () => {
    assert.equal(getZebuPageLabel("/dashboard"), "Home");
    assert.equal(getZebuPageLabel("/dashboard/resumes/resume_123"), "Resume editor");
    assert.equal(getZebuPageLabel("/dashboard/applications/app_123"), "Application workspace");
    assert.equal(getZebuPageLabel("/dashboard/linkedin"), "LinkedIn review");
  });

  test("live sessions receive and refresh the current route", () => {
    const hookSource = readFileSync("src/hooks/useZebuLive.ts", "utf8");
    const tokenSource = readFileSync("src/app/api/zebu/live-token/route.ts", "utf8");

    assert.match(hookSource, /currentPage: optionsRef\.current\.currentPage/);
    assert.match(hookSource, /\[Zebra page context\]/);
    assert.match(hookSource, /turnComplete: false/);
    assert.match(tokenSource, /isAllowedZebuRoute\(requestedPage\)/);
    assert.match(hookSource, /currentContext: optionsRef\.current\.currentContext/);
  });

  test("tracks the selected resume or application as well as the route", () => {
    const contextSource = readFileSync("src/context/ZebuContext.tsx", "utf8");
    const assistantSource = readFileSync("src/components/dashboard/ZebuAssistant.tsx", "utf8");
    const applicationSource = readFileSync("src/app/dashboard/applications/[id]/page.tsx", "utf8");
    const resumeSource = readFileSync("src/app/dashboard/resumes/[id]/page.tsx", "utf8");
    assert.match(contextSource, /entityContext/);
    assert.match(assistantSource, /currentContext: selectedContext/);
    assert.match(applicationSource, /<ZebuEntityContext kind="application"/);
    assert.match(resumeSource, /<ZebuEntityContext kind="resume"/);
  });

  test("committed live responses are not rendered a second time", () => {
    const assistantSource = readFileSync("src/components/dashboard/ZebuAssistant.tsx", "utf8");
    assert.match(assistantSource, /committedResponseText/);
    assert.match(assistantSource, /streamingResponse/);
  });

  test("voice transcripts do not duplicate messages or repopulate the text input", () => {
    const assistantSource = readFileSync("src/components/dashboard/ZebuAssistant.tsx", "utf8");
    assert.match(assistantSource, /transcriptCommittedForResponse/);
    assert.match(assistantSource, /skipTranscriptText/);
    assert.doesNotMatch(assistantSource, /if \(live\.transcript\) setInput/);
  });

  test("navigation collapses the panel and reports progress until the route changes", () => {
    const assistantSource = readFileSync("src/components/dashboard/ZebuAssistant.tsx", "utf8");
    assert.match(assistantSource, /setPendingNavigation/);
    assert.match(assistantSource, /setExpanded\(false\)/);
    assert.match(assistantSource, /Opening \$\{pendingNavigation\.label\}/);
  });

  test("typed questions use the turn API instead of opening a live voice session", () => {
    const assistantSource = readFileSync("src/components/dashboard/ZebuAssistant.tsx", "utf8");
    assert.match(assistantSource, /await sendFallback\(text, attempt\)/);
    assert.match(assistantSource, /fetch\("\/api\/zebu\/turn"/);
    assert.match(assistantSource, /setPendingReply\(true\)/);
    assert.doesNotMatch(assistantSource, /voiceSessionActive/);
    assert.doesNotMatch(assistantSource, /await live\.sendText\(text\)/);
  });

  test("turn context includes credit balance so Zebu does not send people to Settings for it", () => {
    const turn = readFileSync("src/app/api/zebu/turn/route.ts", "utf8");
    assert.match(turn, /credits: "credits" in sessionUser \? sessionUser\.credits : undefined/);
    assert.match(turn, /Do not navigate to Settings unless the user asked to open Settings/);
  });

  test("preferred Gemini Zebu turns fall back to Azure on transient Gemini failures", () => {
    const foundry = readFileSync("src/lib/azure-foundry.ts", "utf8");
    const turn = readFileSync("src/app/api/zebu/turn/route.ts", "utf8");
    assert.match(turn, /preferGemini: true/);
    assert.match(foundry, /if \(options\.preferGemini && gemini\)/);
    assert.match(foundry, /logProviderFallback\("gemini"/);
    assert.match(foundry, /if \(!azureConfig \|\| !shouldFallbackToGemini\(error\)\) throw error;/);
    assert.match(foundry, /getErrorStatus\(error\) !== 400/);
    assert.match(foundry, /responseFormat: undefined/);
  });

  test("clear shortcuts bypass model interpretation and expose action receipts", () => {
    const assistantSource = readFileSync("src/components/dashboard/ZebuAssistant.tsx", "utf8");
    const homeActions = getZebuSuggestions("/dashboard");
    assert.ok(homeActions.every((action) => action.action?.type === "tool"));
    assert.match(assistantSource, /fetch\("\/api\/zebu\/tool"/);
    assert.match(assistantSource, /zebu-receipt/);
    assert.match(assistantSource, /> Retry</);
  });

  test("keeps compact mode content-sized and conversation within the viewport", () => {
    const assistantSource = readFileSync("src/components/dashboard/ZebuAssistant.tsx", "utf8");
    const styles = readFileSync("src/app/globals.css", "utf8");
    assert.doesNotMatch(assistantSource, /setFullScreen|aria-modal/);
    assert.match(styles, /\.zebu-navigation-voice \.zebu-panel--compact \{ height: auto/);
    assert.match(styles, /\.zebu-navigation-voice \.zebu-panel--expanded[^}]*100dvh/);
    assert.match(styles, /env\(safe-area-inset-bottom\)/);
  });
});
