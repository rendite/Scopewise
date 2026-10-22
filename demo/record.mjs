// Records scopewise-demo.html as a sharp 1080p MP4.
//
// Plays the demo in Google Chrome, captures JPEG frames through the DevTools
// screencast (Playwright's built-in video recorder is too blurry for text),
// then lets ffmpeg turn them into scopewise-demo.mp4.
//
// Needs: Google Chrome, ffmpeg (`brew install ffmpeg`), `npm install` in this folder.
// Run:   npm run record

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

const here = fileURLToPath(new URL(".", import.meta.url));
const page_ = pathToFileURL(join(here, "scopewise-demo.html")).href;
const output = join(here, "scopewise-demo.mp4");
const work = mkdtempSync(join(tmpdir(), "scopewise-demo-"));
mkdirSync(join(work, "frames"));

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, colorScheme: "light" });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(page_);
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => document.body.classList.add("recording"));   // hides Play/Restart
await page.waitForTimeout(500);

const cdp = await page.context().newCDPSession(page);
const frames = [];
cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
  const file = join(work, "frames", `${String(frames.length).padStart(5, "0")}.jpg`);
  writeFileSync(file, Buffer.from(data, "base64"));
  frames.push({ file, t: metadata.timestamp });
  await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
});

// Start on the title slate: show it instantly (no fade from the dashboard), then record.
await page.evaluate(() => {
  document.getElementById("slate").style.transition = "none";
  document.getElementById("play").click();
});
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 95, maxWidth: 1920, maxHeight: 1080 });
await page.waitForTimeout(200);
await page.evaluate(() => (document.getElementById("slate").style.transition = ""));
await page.waitForFunction(() => document.body.dataset.finished === "true", null, { timeout: 300_000, polling: 250 });
await page.waitForTimeout(1500);
await cdp.send("Page.stopScreencast");
await browser.close();

// Frames arrive only when something changes on screen, so each one keeps its real duration.
const list = ["ffconcat version 1.0"];
frames.forEach((frame, i) => {
  const next = frames[i + 1]?.t ?? frame.t + 2;
  list.push(`file '${frame.file}'`, `duration ${Math.max(0.001, next - frame.t).toFixed(4)}`);
});
list.push(`file '${frames.at(-1).file}'`);
writeFileSync(join(work, "frames.txt"), list.join("\n"));

execFileSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y",
  "-f", "concat", "-safe", "0", "-i", join(work, "frames.txt"),
  "-fps_mode", "cfr", "-r", "30",
  "-vf", "scale=1920:1080:flags=lanczos,format=yuv420p",
  "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-tune", "stillimage",
  "-movflags", "+faststart", output,
], { stdio: "inherit" });
rmSync(work, { recursive: true, force: true });

console.log(`Wrote ${output} (${frames.length} frames, ${(frames.at(-1).t - frames[0].t).toFixed(0)} s)`);
if (errors.length) console.error("Page errors:", errors);
