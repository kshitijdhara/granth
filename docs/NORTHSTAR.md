# Granth — North Star
## An Operating System for Shared Truth

> **This product is not a document editor.
> It is the infrastructure layer that lets any group — human or AI — evolve what they collectively believe is true, safely and with preserved reasoning.**

This document is the canonical reference for Granth.
It exists to prevent conceptual drift and to realign decisions over time.

If an idea conflicts with this document, the idea is wrong by default.

---

## 1. The Problem We Actually Solve

Every group that holds shared truth — engineers with RFCs, lawyers with contracts, regulators with policies, clinicians with protocols, quants with model assumptions, standards bodies with specs, open-source projects with design docs — suffers the same failure modes:

- Duplicated artifacts to feel safe
- Avoided changes to avoid blame
- Lost reasoning behind decisions
- Conflicts about ideas, disguised as conflicts about text

The fear is never of editing. **It is of irreversible consequences, lost context, and conflict.** Today the world papers over this with Google Docs comments, Word tracked changes, email threads, and Slack archaeology. None of these preserve the one thing that matters: *why the group came to believe what it believes now.*

The problem is not tooling friction. It is the absence of a primitive for structured, attributable, reasoned change to shared truth. Granth exists to supply that primitive — not for one profession, but for any group that needs to evolve shared truth over time.

---

## 2. The Core Reframe

### Old Mental Model
> "I am editing the document."

### New Mental Model
> **"I am proposing a change to shared truth."**

A **proposal** is the atomic unit of change in Granth. It is a bounded, attributed, reasoning-bearing claim that a specific change to shared truth should be made. Every proposal carries: an author, an intent, a scope, a set of affected content, and a state (`open`, `accepted`, `rejected`). There is no other way to change shared truth. There is no direct edit.

Every system decision must reinforce this reframe.

---

## 3. The End Product Vision

The primitive Granth is building is **a group-held claim that can evolve with preserved reasoning.** Documents are one container for such claims. Specs, contracts, policies, model assumptions, annotation standards, and clinical protocols are others. The same mechanics apply to all of them: a canonical truth, proposals to change it, and the reasoning behind each accepted or rejected proposal.

What Git did for source code, Granth does for claims. Git made version control accessible enough to transform how software is built. Granth's bet is that the same primitive — applied without Git's surface complexity — can transform how any group makes and remembers decisions.

A single primitive produces three exposure layers, not three separate products:

- **Invisible layer** — casual contributors just type. The system creates proposals implicitly.
- **Explicit layer** — reviewers and maintainers see proposals, semantic diffs, reasoning threads, conflict graphs, and decision history.
- **API layer** — external systems and AI agents submit structured proposals with reasoning payloads over a stable public interface.

The same proposal object is *rendered* differently for each audience. It is never *reimplemented* differently. See §11 for the design principle that keeps this honest.

---

## 4. The Three-Layer Truth Model (Non-Negotiable)

Shared truth is never a single mutable object.
It always consists of three conceptual layers:

### 1. Canonical Layer — Shared Truth
**The group's current best understanding, stable until a proposal is accepted.**

- What the group currently agrees on
- Readable, authoritative, optimized for consumption
- Changes only through the explicit acceptance of a proposal — never by direct edit
- The source of record, not the workspace

### 2. Proposal Layer — Parallel Futures
**Every meaningful change lives here before it can become canonical.**

- Multiple proposals may coexist against the same canonical state
- Every proposal carries: author, intent, scope, affected content, timestamp, state
- Users do not explicitly "branch" — they explore safely by default
- A proposal is a first-class object, not a draft, not a diff, not a comment

### 3. Reasoning Layer — Why
**The structured record of how the group arrived at what it currently believes.**

- Discussion and deliberation are attached to proposals, not to raw content
- Every accepted or rejected proposal retains its rationale permanently
- The reasoning layer is not a chat log — it is a deliberation record tied to specific decisions
- Context must never be lost; losing it means the system has failed

These three layers are always present, even when only one is visible. A system that collapses them into a single mutable surface is not a simplification — it is a regression to the exact failure mode Granth exists to solve.

---

## 5. Branching (Defined Precisely)

### What Branching Is NOT
- A button
- A workflow the user must learn
- Git concepts exposed in the UI
- A power-user feature

### What Branching IS
> **A proposal under construction — a named parallel future that hasn't yet been accepted or rejected.**

A branch in Granth is not a Git branch. It has no checkout, no merge command, no local copy. It is a proposal in the `open` state: a declared intent to change shared truth, attributed to an author, with an explicit scope. It exists until the group decides.

A proposal is created implicitly when:
- Meaning changes
- An alternative is explored
- Content others rely on is modified
- A comment evolves into a substantive change

Safety is automatic. Exploration never risks shared truth. The canonical layer is never touched until a proposal is accepted.

---

## 6. Merging Without "Merges"

There are no line-level conflicts.

Instead, the system helps users answer:
- Which idea do we accept?
- Do we combine these ideas?
- Does one supersede the other?
- Are these addressing different concerns?

Accepting a proposal is a **decision**, not a technical operation. It is the moment the group updates what it collectively believes. The accepted proposal's reasoning becomes part of the permanent record of why shared truth is what it is.

Who may decide depends on the workspace:
- **Single-member workspace:** the author may accept or reject their own proposals. They are the group. The proposal-first model still applies — the value is preserved reasoning and safe exploration, not social governance.
- **Multi-member workspace:** a reviewer who is not the proposal's author must decide. The author is the interested party; they cannot be the judge.

This distinction is not a special case — it is the model working correctly at different scales.

Rejected proposals are not deleted:
- They remain as historical context
- The system records *why* they were rejected
- A rejected proposal is "considered and declined" — not discarded

The history of rejected proposals is part of the reasoning layer. Understanding what a group chose *not* to believe, and why, is as important as understanding what it does believe.

---

## 7. Diffs Are Semantic, Not Textual

**A semantic diff answers: what does this change mean for the group's shared understanding?**

Text diffs answer a different question: which characters changed? That answer is a fallback — useful when the semantic answer is unavailable, but never the primary interface.

The system compares:
- Meaning
- Structure
- Claims
- Decisions
- Assumptions

Examples of semantic diffs:
- "Introduces a new assumption"
- "Weakens the original conclusion"
- "Reverses a previous decision"
- "Narrows scope"
- "Contradicts an existing claim in §3"

The semantic diff is what allows a non-technical reviewer to understand a change without reading raw content. If users must read raw text diffs to understand what changed, abstraction has leaked.

Text diffs remain available as a fallback and as an audit artifact. They are never the primary communication of change.

---

## 8. Collaboration Philosophy

Presence communicates **intent**, not cursor position.

The system should surface:
- "Alex is proposing an alternative to §2"
- "Sam is reviewing a proposal that conflicts with yours"

Not:
- cursor noise
- real-time typing theatrics

Real-time co-editing optimizes for simultaneity. Granth optimizes for deliberation. These are different problems. Granth is not slower than a real-time editor — it is solving a different unit of time: not the keystroke, but the decision.

Collaboration success is measured by:
- clarity of disagreement
- speed of resolution
- preservation of context

---

## 9. The Role of AI

### AI is **not**:
- a writer
- a replacement for thinking
- a sidebar assistant
- an autonomous editor of shared truth

### AI **is**, inside the UI:
- a proposal summarizer
- a semantic diff explainer
- a conflict detector
- a merge mediator
- a reasoning synthesizer

AI exists to clarify human disagreement, not erase it.

### AI as a first-class proposer

AI agents are not just helpers inside the interface — they are **users of the primitive**, submitting proposals the same way humans do. This is a design requirement, not a retrofit.

The rules for AI proposers are identical to the rules for human proposers:

- Agents submit structured proposals through the same API humans use
- Agents supply reasoning in the same reasoning layer humans use
- Agents cannot self-accept — a human (or a human-authorized governance rule) makes the accept/reject decision
- Agents cannot bypass the proposal layer — there is no "AI direct edit" mode
- Provenance lives in the proposal and reasoning layers, not in the canonical truth itself; the canonical layer never distinguishes "an AI wrote this" from "a human wrote this"

This matters: the canonical layer is not the trust boundary. The **proposal system is the trust boundary**. An AI that writes directly to canonical truth — without a proposal, without reasoning, without human decision — is outside the system. That is not a permitted interaction mode.

This makes Granth the natural governance layer between AI systems and institutional knowledge. Agents propose, with reasoning, and humans decide. The audit trail is identical to the one humans already use. The proposal system cannot be bypassed by capability; it can only be satisfied.

---

## 10. Who This Is For

The proposal-first primitive applies wherever groups manage evolving shared claims. The vocabulary, templates, and defaults differ by vertical; the primitive does not.

| Group | Current Pain | What Granth Unlocks |
|---|---|---|
| **Software engineering (RFCs, ADRs, design docs)** | GitHub issues are chaotic; ADRs are ad-hoc Markdown files | Structured proposal → semantic diff → decision with captured rationale |
| **Legal contracts & amendments** | Word tracked changes + redline emails + version chaos | Every clause change is a proposal with intent; rejection history is preserved |
| **Open-source governance (PEPs, Rust RFCs, IETF drafts)** | Native RFC processes bolted onto GitHub issues, with no real tooling | First-class RFC workflow with voting, reasoning capture, and drift-safe history |
| **Compliance & regulated policy** | Manual audit trails, versioning in filenames, unreliable rationale | Immutable change history with rationale by default — the audit is the product |
| **Academic co-authorship & peer review** | Google Docs comments + email + lost context across reviewer rounds | Version-aware collaboration where the decision history survives the paper |
| **Construction & engineering (change orders, spec amendments)** | Faxed PDFs, email chains, change orders with no linked reasoning | Structured proposals with cost/scope metadata and explicit approval chains |
| **Clinical trial protocols** | Slow, formal amendment documents with little rationale preserved | Protocol amendments with machine-readable change history and audit trail |
| **Quant & finance models** | Parameter changes buried in Slack and private notebooks | Assumption changes carry a thesis, a reviewer, and a decision — no ghost edits |
| **AI annotation & evaluation standards** | Label standard drift, no captured reasoning, no inter-annotator visibility | Annotation standard proposals with inter-annotator reasoning threads |
| **AI agents contributing to human knowledge bases** | Silent edits, no audit, no human oversight at decision time | Agents propose; humans decide; reasoning is preserved and auditable |

Every row is the same shape: a group, holding claims, needing to evolve them safely with preserved reasoning. One primitive, many surfaces.

---

## 11. Universal Design Principle

**One primitive. Three exposure levels. Never three implementations.**

### Invisible layer — for casual contributors
A student editing a group project just types. A junior engineer tweaks a paragraph. A contract reviewer adjusts a clause. None of them touch a "proposal" button. None of them see a diff view. The system creates proposals implicitly and surfaces them only when review is needed. If the user never wanted to know the proposal layer existed, they never need to.

### Explicit layer — for reviewers and maintainers
Maintainers, legal reviewers, PMs, and standards editors see the full apparatus: side-by-side diffs, semantic diff summaries, reasoning threads, conflict graphs across overlapping proposals, and the complete decision history (including rejections and why). This is where Granth earns its keep in high-stakes work.

### API layer — for external systems and AI agents
A stable, structured, public interface for machine proposers. Proposals are submitted as data, with reasoning metadata attached. The API is not an afterthought or a retrofit — it is part of the primitive from day one, because agents-as-proposers is a first-class scenario (§9).

**The rule:** if we ever find ourselves building parallel systems for casual vs. power vs. agent users, we've broken the primitive. The same proposal object must flow through all three surfaces, rendered appropriately for each audience.

---

## 12. Explicit Non-Goals

Granth is not:
- a Notion competitor focused on flexibility
- a Google Docs competitor focused on simultaneity
- a knowledge base
- a personal notes app
- a file manager

**What is out of scope is containers and surfaces.** Granth is the primitive underneath. Knowledge bases, wikis, spec portals, and notes apps can all be built on top — but they are not the foundation, and Granth must not drift into building any of them as end products.

The temptation will be real, because each of them looks like an easy win. The test: does this feature make *proposals, reasoning, and decisions* better? If it primarily makes *content browsing* better, it is out of scope.

---

## 13. The Litmus Test (Use Constantly)

For any feature or decision, ask:

1. Does this make change safer?
2. Does this reduce fear?
3. Does this preserve reasoning?
4. Does this help resolve disagreement?
5. Does this reinforce "proposal over edit"?
6. Does this keep the three layers distinct?

If the answer is "no" to two or more, the idea is misaligned.

---

## 14. Honest Gap Assessment

The vision above is largely unbuilt. This section is deliberately uncomfortable.

The architectural skeleton is correct: a three-layer schema exists, blocks are structured for semantic comparison, proposals have intent/scope/author/state, and block-level changes are tracked per proposal. But the core loop does not fully close, and several pieces either do not match the vision or have been claimed complete when they are not.

**Verified gaps, grounded in the current repo:**

- ~~**Accept does not merge.** `apps/backend/internal/proposals/service.go:96` contains `// TODO: Apply changes to blocks (merge to canonical layer)`. Accepting a proposal only flips `state` to `"accepted"` — the tracked block changes never propagate to the canonical `blocks` table. The three-layer model is broken at its most critical moment: the moment the group decides.~~ **Closed 2026-04-15** — merge on accept is now wired up in a single transaction.

- **Authorization rule refined — solo workspaces are a valid use case. Implementation still open.**
  The original framing — "author cannot self-accept or self-reject, full stop" — is incorrect as an absolute rule. A workspace with exactly one member is a personal versioning workspace: the user is simultaneously author and sole reviewer, and blocking self-accept would make the system unusable for solo work. The correct invariant is membership-scoped:
  - **Single-member workspace:** author may self-accept/self-reject. They are the only possible reviewer.
  - **Multi-member workspace:** author cannot self-accept or self-reject. A different user must decide.
  - **No workspace (legacy docs):** unrestricted (backward compat).

  `service.go` currently enforces none of this — `acceptProposal()` never checks `proposal.AuthorID` against the calling user, and `rejectProposal()` discards the user ID entirely. The implementation must count workspace members before applying the author block. See §15 item 7 and §17 decision log (2026-05-26) for the rationale.

- ~~**No review UI.** `apps/frontend/src/features/proposals/proposal-item.tsx:16` renders a proposal card whose click handler is `alert(...)`. There is no side-by-side diff, no reasoning view, no accept/reject affordance.~~ **Closed 2026-04-15** — `decision-room.page.tsx` ships a full review UI with semantic diff display, conflict detection, and accept/reject affordances.

- ~~**No rejection rationale.** Rejecting a proposal had no required reason field.~~ **Closed 2026-04-15** — rejection reason is stored (`4_add_rejection_reason.up.sql`) and rendered as "considered and declined." Note: the reason is not validated as non-empty at the API layer — `handleRejectProposal` decodes it "best-effort." A direct API call can reject silently, which violates the "considered and declined" promise. Requires a non-empty enforcement check.

- **No reasoning layer.** Grepping `apps/backend` for `discussion|rationale|comment|reasoning` returns zero matches. There are no tables, no routes, and no types for the layer §4 calls non-negotiable. The highest-differentiation feature — the structured deliberation record — does not exist. This is not a UI gap; it is a schema gap. It cannot be added to the frontend without first being added to the backend.

- ~~**No governance primitives.** Only four migrations exist; no notion of teams, roles, or required reviewers.~~ **Closed 2026-04-15** — `workspaces` and `workspace_members` tables shipped (migration 5); `apps/backend/internal/workspaces/` provides full CRUD, member management, and role enforcement (`admin`, `reviewer`, `contributor`); `documents.workspace_id` FK added; frontend workspace selector, list, and settings pages wired into sidebar and routing.

- **Conflict detection is frontend-only; the backend does not enforce.** The inbox, motion, and decision-room pages detect overlapping `affected_block_ids` and surface warnings in the UI. But `acceptProposal()` in the backend does not query for open proposals sharing the same blocks. Two conflicting proposals can be independently accepted in sequence — the second silently overwrites the first with no server-side warning. The GIN index on `affected_block_ids` exists; it is not yet used at accept time.

- **No AI integration of any kind.** There is no model client, no summarizer, no semantic-diff generator, and no agent-facing API. Everything §9 promises is aspirational. The API layer described in §11 exists as a design intent only.

If any of these file references become stale, update them in place — do not delete this section. The point of §14 is to stay continuously verifiable against the repo.

---

## 15. Roadmap — Now / Next / Long-term

Each item below is declarative and testable: an implementer should be able to tell when any single row is "done."

### Now — Close the core loop ✓
*Completed 2026-04-15. All four items shipped.*

1. ~~**Merge on accept.** In a single transaction, apply `proposal_block_changes` (create/update/delete) to the `blocks` table when a proposal is accepted. Fixes `service.go:96`.~~ ✓
2. ~~**Fix authorization.** Author cannot self-accept or self-reject. A reviewer must be a different user; eventually, a reviewer with the right role. Fixes `service.go:92-94` and `:120-122`.~~ ✓ (claimed; see §14 — re-verify against running service)
3. ~~**Proposal review UI.** Side-by-side diff of old block → new block, grouped by proposal, with visible accept/reject affordances. Replaces the `alert()` in `proposal-item.tsx:16`.~~ ✓
4. ~~**Rejection rationale.** Rejecting a proposal requires a reason. Rejected proposals render as "considered and declined" with their rationale — not as deleted or hidden.~~ ✓ (stored and rendered; API enforcement of non-empty reason still needed)

### Next — Make it safe for groups
*These unlock any collaboration with more than two people.*

5. ~~**Workspace / organization / team model.** Documents belong to a workspace; users belong to workspaces with roles.~~ ✓ **Completed 2026-04-15**
6. ~~**Roles.** Contributor (can propose), reviewer (can accept/reject), admin (can configure governance). Enforced at the service layer, not just the UI.~~ ✓ **Completed 2026-04-15** — roles ship as part of items 5.
7. **Membership-aware author block.** Enforce at the service layer: if the document's workspace has more than one member, `acceptProposal` and `rejectProposal` must return an error if the calling user is the proposal's author. Single-member workspaces are exempt — the user is their own reviewer. No workspace (legacy) is also exempt. Currently unenforced in any case (§14).
8. **Enforce non-empty rejection reason at the API.** `handleRejectProposal` must validate that `reason` is non-empty before accepting the request. Currently best-effort only.
9. **Backend conflict enforcement.** At accept time, query open proposals sharing `affected_block_ids` using the existing GIN index. Surface the conflict as a blocking warning or require explicit override. Frontend detection alone is insufficient.
10. **Required reviewers / approval chains.** Configurable per workspace: N reviewers required, specific reviewers required, or designated role required. Roles exist; enforcement logic does not.
11. **Reasoning layer v1.** Threaded deliberation attached to proposals (not to raw blocks). Schema: `proposal_comments` table with `proposal_id`, `author_id`, `body`, `created_at`. This is the first real build of §4's third layer and the single highest-leverage addition.
12. **Notifications.** Inbox model: "you have proposals to review," "your proposal was accepted," "a proposal touches content you authored." Backend events required; the frontend inbox page exists but has no backend event source.

### Long-term — Transformative
*These are the bets that make Granth irreplaceable, not just useful.*

13. **Semantic diffs.** Model-assisted diff explanations: "reverses a prior decision," "introduces a new assumption," "narrows scope." Text diffs remain the fallback.
14. **AI agent API.** A first-class public interface for machine proposers — structured proposal submission with reasoning payloads. Not a retrofit of internal routes. Governed by the same authorization rules as human proposers (§9).
15. **Vertical templates.** RFC, legal amendment, construction change order, clinical protocol amendment. Same primitive, different defaults and vocabulary.
16. **Query layer.** "What does the group currently believe about X?" across all canonical truth in a workspace. Enables the primitive to become the source of institutional memory.
17. **Integrations.** GitHub (RFC/PR linking), Slack (notification and context), Linear (work tracking). Meet users where they already are.

---

## 16. Long-Term Outcome

If successful, users will:
- stop duplicating documents
- stop avoiding edits
- stop losing context
- stop fearing collaboration

They will feel:
> "I can always explore ideas without breaking shared truth."

Once that feeling exists, traditional editors feel irresponsible.

---

## 17. Progress & Alignment Log
*(This section is intentionally mutable. It is an append-only decisions log. Current risks live in §14; future work lives in §15.)*

### Current Phase
- [x] Concept
- [x] Prototype
- [ ] Internal dogfooding
- [ ] External users
- [ ] Scaling

### What Exists Today
- **Backend**: Go + Chi router, PostgreSQL, Redis client (unused), clean package layout (`auth`, `documents`, `blocks`, `proposals`, `workspaces`)
- **Schema**: five migrations — users, documents + blocks (with `order_path` hierarchy and typed block content), proposals + `proposal_block_changes` (with GIN index on `affected_block_ids`), rejection reason, workspaces + workspace members
- **API**: full CRUD for documents, blocks, proposals, and workspaces; proposal state transitions (open → accepted/rejected) with merge-on-accept; role-enforced workspace membership
- **Frontend**: React + TypeScript + Vite; feature-based layout (`documents`, `proposals`, `auth`, `user`, `workspaces`); composer page with implicit change tracking; decision-room review page with semantic diff display and conflict detection; motion page (open proposals by workspace); archive page (decided proposals); inbox page (proposals pending review)
- **Design system**: shared UI kit (Card, Button, Input, Sidebar), light/dark theme, Apple HIG-inspired visual language

### Recent Decisions

- **Decision (2026-05-26):** Refined the author self-accept rule — single-member workspaces are exempt.
  **Reasoning:** A workspace with exactly one member is a personal versioning workspace. The user is simultaneously author and sole reviewer; blocking self-accept would make the system unusable for solo work (drafting, personal knowledge, exploratory branching before sharing). The proposal-first model still applies in this mode — the value is preserved reasoning and safe exploration, not social governance. The invariant "author cannot self-accept" is a *collaborative* invariant, not a universal one. It activates when the workspace has more than one member.
  **Rule:** `count(workspace_members WHERE workspace_id = doc.workspace_id) > 1` → author block enforced. Otherwise → author may self-accept/self-reject.
  **Tradeoffs accepted:** Requires a member count query on every accept/reject. This is a single indexed lookup and acceptable overhead. The alternative — a flag on the workspace — is a premature optimization that adds schema complexity for no benefit.

- **Decision (2026-05-26):** Re-opened the "authorization contradiction" gap after code verification.
  **Reasoning:** §14 claimed author self-accept/self-reject was blocked as of 2026-04-15. Verification against `apps/backend/internal/proposals/service.go` shows `acceptProposal()` never compares the calling user's ID to `proposal.AuthorID`. `rejectProposal()` discards the user ID entirely. The invariant is unenforced in any case. §14 and §15 updated with the refined rule above.

- **Decision (2026-05-26):** Surfaced rejection reason API enforcement gap.
  **Reasoning:** The rejection reason is stored and rendered correctly in the UI, but `handleRejectProposal` in `routes.go` accepts an empty reason body without error. This violates the "considered and declined" promise (§6). Added to §15 as a discrete actionable item.

- **Decision (2026-05-26):** Clarified conflict detection status: frontend-only, backend unenforced.
  **Reasoning:** Three frontend pages (inbox, motion, decision-room) detect and display conflicting proposals. However, the backend will accept conflicting proposals independently without warning. The existing GIN index on `affected_block_ids` is the correct enforcement point. Added to §15 as item 9.

- **Decision (2026-04-15):** Shipped workspace / organization / team model (roadmap items 5 + 6).
  **Reasoning:** Items 5 and 6 are inseparable — you can't have workspace members without roles, so both shipped in the same migration and service layer. `workspace_id` on documents is nullable for backward compat; the service layer enforces it for new creates. Roles are `admin` (update workspace, manage members), `reviewer` (accept/reject proposals), `contributor` (propose changes). The workspace creator is atomically inserted as an admin member in the same transaction.
  **Tradeoffs accepted:** Member lookup by user ID only (no invite-by-email yet); required reviewers / approval chains (item 10) are the natural next step now that roles exist.

- **Decision (2026-04-15):** Closed the core loop — shipped all four "Now" roadmap items.
  **Reasoning:** Merge on accept, fixed authorization (claimed), proposal review modal, and rejection rationale were the four hard prerequisites for the primitive to be usable by any real group.
  **Tradeoffs accepted:** Author enforcement requires re-verification (see 2026-05-26 entry above).

- **Decision (2026-04-15):** Reframe Granth from "document editor with first-class change" to "operating system for shared truth."
  **Reasoning:** The document framing forces competition with Google Docs/Notion on their strengths and undersells the underlying primitive. The primitive itself is universal — any group that evolves shared claims has the same needs — and the horizontal framing unlocks verticals (open source, legal, compliance, clinical, quant, AI annotation, AI agents) the document framing cannot reach.
  **Tradeoffs accepted:** Broader scope creates a harder positioning challenge and risks "for everyone means for no one." Mitigation: the near-term roadmap (§15) is still concrete and code-grounded.

- **Decision:** Implemented proposal-first editing workflow.
  **Reasoning:** Reinforces the "proposal over edit" mental model; makes change safe by default.
  **Tradeoffs accepted:** Unfamiliar UI flow vs. traditional editing.

- **Decision:** Adopted Apple UI/UX philosophy throughout.
  **Reasoning:** Elegant, low-friction surface reduces the cognitive overhead of the proposal model.
  **Tradeoffs accepted:** Design consistency over platform-specific conventions.

- **Decision:** Split features into `documents/` and `proposals/` with shared components.
  **Reasoning:** Better organization, reuse, and maintainability as surfaces multiply.
  **Tradeoffs accepted:** Additional abstraction layers vs. a monolithic structure.

- **Decision:** Block-based content storage over document-level content.
  **Reasoning:** Enables granular change tracking and, eventually, semantic diffs.
  **Tradeoffs accepted:** Query complexity vs. simple text storage.

### Drift Check
Tempting but misaligned ideas:
- Real-time collaborative editing (Google Docs envy — optimizes for simultaneity, not deliberation)
- AI-powered content generation (the writer role §9 explicitly rejects)
- File management features (containers, not primitive)
- A polished wiki / knowledge base layer on top, before the core loop works

Why they are tempting: each is familiar, each looks like an easy win, each has precedent in existing tools.
Why they are out of scope: each competes with the core "shared truth as first-class primitive" framing and dilutes focus away from §15's actionable items. Any of them would feel like progress while being, at best, parallel motion.

---

## Final Reminder

> **If this ever feels like "just a better editor", stop.
> If it feels scary but clarifying, you are likely on track.**
