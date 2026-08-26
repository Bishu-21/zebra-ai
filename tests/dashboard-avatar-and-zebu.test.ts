import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const avatar = readFileSync("src/components/dashboard/UserAvatar.tsx", "utf8");
const header = readFileSync("src/components/dashboard/Header.tsx", "utf8");
const sidebar = readFileSync("src/components/dashboard/Sidebar.tsx", "utf8");
const assistant = readFileSync("src/components/dashboard/ZebuAssistant.tsx", "utf8");
const nextConfig = readFileSync("next.config.ts", "utf8");

describe("Dashboard identity and Zebu launcher", () => {
    it("loads supported Google avatars directly and falls back after image errors", () => {
        assert.match(nextConfig, /\*\*\.googleusercontent\.com/);
        assert.match(avatar, /unoptimized/);
        assert.match(avatar, /referrerPolicy="no-referrer"/);
        assert.match(avatar, /onError=\{\(\) => setFailedSrc/);
        assert.match(header, /<UserAvatar/);
        assert.match(sidebar, /<UserAvatar/);
    });

    it("keeps only the Talk to Zebu launcher button", () => {
        const launcher = assistant.slice(assistant.indexOf('<div className="zebu-launcher">'));
        assert.match(launcher, />Talk to Zebu</);
        assert.doesNotMatch(launcher, /zebu-wake-toggle|>Hey Zebu</);
    });
});
