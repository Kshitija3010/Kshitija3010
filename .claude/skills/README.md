# Claude skills for this repo

Claude Code loads every folder here as a skill whenever a session opens this repository.

| Skills | Source | Licence |
|---|---|---|
| yt-audit, yt-chapters, yt-comment, yt-edit, yt-package, yt-plan, yt-retention, yt-script, yt-seo, yt-shorts, yt-viral | [Jakeschincariol/youtube-agent-skill](https://github.com/Jakeschincariol/youtube-agent-skill) @ a2feb21 | MIT ([LICENSE-youtube-agent.txt](LICENSE-youtube-agent.txt)) |
| youtube-transcript | [michalparkola/tapestry-skills-for-claude-code](https://github.com/michalparkola/tapestry-skills-for-claude-code) | MIT ([LICENSE-tapestry.txt](LICENSE-tapestry.txt)) |
| anime-cooking | Written for this repo | Same as the repo |
| content-research-writer, canvas-design | [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) | canvas-design: Apache-2.0 (its LICENSE.txt); fonts: SIL OFL (canvas-fonts/*-OFL.txt) |

The yt-* skills read a voice profile from `~/.claude/youtube/voice.md`. Fill in `yt-script/voice.template.md` and copy it there (Claude can do this for you).
