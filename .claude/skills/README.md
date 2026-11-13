# Claude skills for this repo

Claude Code loads every folder here as a skill whenever a session opens this repository.

| Skills | Source | Licence |
|---|---|---|
| yt-audit, yt-chapters, yt-comment, yt-edit, yt-package, yt-plan, yt-retention, yt-script, yt-seo, yt-shorts, yt-viral | [Jakeschincariol/youtube-agent-skill](https://github.com/Jakeschincariol/youtube-agent-skill) @ a2feb21 | MIT ([LICENSE-youtube-agent.txt](LICENSE-youtube-agent.txt)) |
| youtube-transcript | [michalparkola/tapestry-skills-for-claude-code](https://github.com/michalparkola/tapestry-skills-for-claude-code) | MIT ([LICENSE-tapestry.txt](LICENSE-tapestry.txt)) |
| content-research-writer, canvas-design | [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) | canvas-design: Apache-2.0 (its LICENSE.txt); fonts: SIL OFL (canvas-fonts/*-OFL.txt) |
| animated-chart, apple-launch-film, brand-intake, launch-video, loop-cover, milestone-reveal, model-showdown, motion-brief-writer, motion-effects, motion-prompt-writer, newsletter-promo, reel-export, reference-to-motion, title-sequence-3d, vox-explainer | [charlie947/motion-graphics-skills](https://github.com/charlie947/motion-graphics-skills) @ 229022e | MIT ([LICENSE-motion-graphics-skills.txt](LICENSE-motion-graphics-skills.txt)) |
| explainer-default, explainer-engaging, explainer-high-energy, motion-broll, object-separation, sound-effects | [Barty-Bart/motion-graphics](https://github.com/Barty-Bart/motion-graphics) @ 3d83d98 | MIT ([LICENSE-barty-motion-graphics.txt](LICENSE-barty-motion-graphics.txt)); bundled sound effects CC0 (sound-effects/LICENSES.md); Geist fonts OFL |
| 01-viral-hook … 10-podcast-visual (prompt writers for AI video generators) | [rediumvex/ai-video-generator-claude](https://github.com/rediumvex/ai-video-generator-claude) @ ffdad7d | MIT ([LICENSE-ai-video-generator.txt](LICENSE-ai-video-generator.txt)) |

The yt-* skills read a voice profile from `~/.claude/youtube/voice.md`. Fill in `yt-script/voice.template.md` and copy it there (Claude can do this for you).

Note: motion-broll's `scripts/setup.sh` installs its own Playwright and Chromium. In Claude cloud sessions a browser is already installed, so skip that step there.
