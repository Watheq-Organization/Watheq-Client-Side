---
description: Mandatory rules for Watheq project
globs: "**/*"
always_on: true
---

# Watheq Project Agent Rules

Before executing any task or modifying code in this repository:
1. Always read and enforce the guidelines in [AGENT.md](file:///d:/MAHMOUD2026/WatheqNew/WatiqNew_/AGENT.md).
2. Never call fetch or APIs directly from JSX components; use `src/services/` with `httpClient`.
3. Check `swagger.json` and `src/types/` for official schemas.
4. Verify changes using `npx tsc --noEmit`.
5. Strictly adhere to scope; do not touch unrelated files.
