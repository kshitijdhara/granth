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

Granth exists to eliminate those behaviors — not for one profession, but for any group that needs to evolve shared truth over time.

---

## 2. The Core Reframe

### Old Mental Model
> "I am editing the document."

### New Mental Model
> **"I am proposing a change to shared truth."**

Every system decision must reinforce this reframe.

---

## 3. The End Product Vision

The primitive Granth is building is **a group-held claim that can evolve with preserved reasoning.** Documents are one container for such claims. Specs, contracts, policies, model assumptions, annotation standards, and clinical protocols are others. The same mechanics apply to all of them: a canonical truth, proposals to change it, and the reasoning behind each accepted or rejected proposal.

What Git did for source code, Granth does for claims. Git made version control accessible enough to transform how software is built; Granth's bet is that the same primitive — applied without Git's surface complexity — can transform how any group makes and remembers decisions.

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
- What the group currently agrees on
- Stable, calm, readable
- Optimized for consumption, not churn

### 2. Proposal Layer — Parallel Futures
- All meaningful changes live here first
- Multiple proposals may coexist
- Every proposal has:
  - author
  - intent
  - scope
  - timestamp

Users do not explicitly "branch".
They explore safely by default.

### 3. Reasoning Layer — Why
- Discussion is attached to proposals, not raw text
- Decisions reference rationale
- Context must never be lost

If reasoning disappears, the system has failed.

---

## 5. Branching (Defined Precisely)

### What Branching Is NOT
- A button
- A workflow the user must learn
- Git concepts exposed in the UI
- A power-user feature

### What Branching IS
> **Protected parallel thinking**

A proposal is created implicitly when:
- Meaning changes
- An alternative is explored
- Content others rely on is modified
- A comment evolves into content

Safety is automatic.
Exploration never risks shared truth.

---

## 6. Merging Without "Merges"

There are no line-level conflicts.

Instead, the system helps users answer:
- Which idea do we accept?
- Do we combine these ideas?
- Does one supersede the other?
- Are these addressing different concerns?

Accepting a proposal is a **decision**, not a technical operation.

Rejected proposals are not deleted:
- They remain as historical context
- The system remembers *why* they were rejected

---

## 7. Diffs Are Semantic, Not Textual

Text diffs are a fallback, not the primary interface.

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

If users must read raw diffs to understand change, abstraction has leaked.

---

## 8. Collaboration Philosophy

Presence communicates **intent**, not cursor position.

The system should surface:
- "Alex is proposing an alternative"
- "Sam is reviewing a conflicting proposal"

Not:
- cursor noise
- real-time typing theatrics

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

### AI **is**, inside the UI:
- a proposal summarizer
- a semantic diff explainer
- a conflict detector
- a merge mediator
- a reasoning synthesizer

AI exists to clarify human disagreement, not erase it.

### AI as a first-class proposer

AI agents are not just helpers inside the interface — they are **users of the primitive**, submitting proposals the same way humans do. This is a first-class use case, not a retrofit.

- Agents submit structured proposals through the same API humans use
- Agents supply reasoning in the same reasoning layer humans use
- The canonical layer never distinguishes "an AI wrote this" from "a human wrote this" — provenance lives in the proposal and reasoning layers, not in the truth itself
- Humans retain the accept/reject decision at all times

This makes Granth the natural trust boundary between AI systems and institutional knowledge. Agents do not silently edit shared truth. They propose, with reasoning, and humans decide. The audit trail is the same audit trail humans already use.

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
A stable, structured, public interface for machine proposers. Proposals are submitted as data, with reasoning metadata attached. The API is not an afterthought or a retrofit — it is part of the primitive from day one, because agents-as-users is a first-class scenario (§9).

**The rule:** if we ever find ourselves building parallel systems for casual vs. power vs. agent users, we've broken the primitive. The same proposal object must flow through all three surfaces, rendered appropriately for each audience.

---

## 12. Explicit Non-Goals

Granth is not:
- a Notion competitor focused on flexibility
- a Google Docs competitor focused on simultaneity
- a knowledge base
- a personal notes app
- a file manager

**What is out of scope is containers and surfaces.** Granth is the primitive underneath. Knowledge bases, wikis, spec portals, and notes apps can all be built on top — but they are not the foundation, and Granth must not drift into building any of them as end products. The temptation will be real, because each of them looks like an easy win. None of them are the bet.

---

## 13. The Litmus Test (Use Constantly)

For any feature or decision, ask:

1. Does this make change safer?
2. Does this reduce fear?
3. Does this preserve reasoning?
4. Does this help resolve disagreement?
5. Does this reinforce "proposal over edit"?

If the answer is "no" to two or more, the idea is misaligned.

---

## 14. Honest Gap Assessment

The vision above is largely unbuilt. This section is deliberately uncomfortable.

The architectural skeleton is correct: a three-layer schema exists, blocks are structured for semantic comparison, proposals have intent/scope/author/state, and block-level changes are tracked per proposal. But the core loop does not close, and a few pieces directly contradict the vision.

**Verified gaps, grounded in the current repo:**

- ~~**Accept does not merge.** `apps/backend/internal/proposals/service.go:96` contains `// TODO: Apply changes to blocks (merge to canonical layer)`. Accepting a proposal only flips `state` to `"accepted"` — the tracked block changes never propagate to the canonical `blocks` table. The three-layer model is broken at its most critical moment: the moment the group decides.~~ **Closed 2026-04-15** — merge on accept is now wired up in a single transaction.

- ~~**Authorization contradicts the vision.** `service.go:92-94` and `service.go:120-122` both enforce `if proposal.AuthorID != userID { return "only author can accept/reject" }`. In a shared-truth system the author should be the *last* person allowed to self-accept. This is not a missing feature — it is the wrong invariant, and it makes the primitive unusable in any group of more than one person.~~ **Closed 2026-04-15** — author self-accept/self-reject is now blocked.

- ~~**No review UI.** `apps/frontend/src/features/proposals/proposal-item.tsx:16` renders a proposal card whose click handler is `alert(\`Proposal: ${proposal.title}\nState: ${proposal.state}\nIntent: ${proposal.intent}\`)`. There is no side-by-side diff, no reasoning view, no accept/reject affordance. Reviewers cannot see what they are deciding — this is GitHub PRs without a file diff.~~ **Closed 2026-04-15** — `proposal-review-modal.tsx` ships a proper review UI with accept/reject affordances.

- ~~**No rejection rationale.** Rejecting a proposal had no required reason field; rejected proposals were indistinguishable from silently discarded ones.~~ **Closed 2026-04-15** — rejection reason is required and stored (`4_add_rejection_reason.up.sql`); rejected proposals render their rationale.

- **No reasoning layer.** Grepping `apps/backend` for `discussion|rationale|comment|reasoning` returns zero matches. There are no tables, no routes, and no types for the layer that §4 calls "non-negotiable." The highest-differentiation feature does not exist yet.

- **No governance primitives.** Grepping `apps/backend` for `workspace|organization|team|role|reviewer` returns zero matches. Only four migrations exist (users, documents, proposals, rejection reason). There is no notion of teams, roles, required reviewers, or approval chains — which means no group of 3+ people can safely use this today.

- **No conflict detection.** Nothing compares `affected_block_ids` across open proposals. Two proposals touching the same block can be independently accepted without the system noticing they collide.

- **No AI integration of any kind.** There is no model client, no summarizer, no semantic-diff generator, and no agent-facing API. Everything §9 promises is aspirational.

If any of these file references become stale, update them in place — do not delete this section. The point of §14 is to stay continuously verifiable against the repo.

---

## 15. Roadmap — Now / Next / Long-term

Each item below is declarative and testable: an implementer should be able to tell when any single row is "done."

### Now — Close the core loop ✓
*Completed 2026-04-15. All four items shipped.*

1. ~~**Merge on accept.** In a single transaction, apply `proposal_block_changes` (create/update/delete) to the `blocks` table when a proposal is accepted. Fixes `service.go:96`.~~ ✓
2. ~~**Fix authorization.** Author cannot self-accept or self-reject. A reviewer must be a different user; eventually, a reviewer with the right role. Fixes `service.go:92-94` and `:120-122`.~~ ✓
3. ~~**Proposal review UI.** Side-by-side diff of old block → new block, grouped by proposal, with visible accept/reject affordances. Replaces the `alert()` in `proposal-item.tsx:16`.~~ ✓
4. ~~**Rejection rationale.** Rejecting a proposal requires a reason. Rejected proposals render as "considered and declined" with their rationale — not as deleted or hidden.~~ ✓

### Next — Make it safe for groups
*These unlock any collaboration with more than two people.*

5. **Workspace / organization / team model.** First migration beyond `users`, `documents`, `proposals`. Documents belong to a workspace; users belong to workspaces with roles.
6. **Roles.** Contributor (can propose), reviewer (can accept/reject), admin (can configure governance). Enforced at the service layer, not just the UI.
7. **Required reviewers / approval chains.** Configurable per workspace: N reviewers required, specific reviewers required, or designated role required.
8. **Reasoning layer v1.** Threaded comments attached to proposals (not to raw blocks). This is the first real build of §4's third layer.
9. **Notifications.** Inbox model: "you have proposals to review," "your proposal was accepted," "a proposal touches content you authored."

### Long-term — Transformative
*These are the bets that make Granth irreplaceable, not just useful.*

10. **Semantic diffs.** Model-assisted diff explanations: "reverses a prior decision," "introduces a new assumption," "narrows scope." Text diffs remain the fallback.
11. **Conflict detection.** When two open proposals affect overlapping `affected_block_ids`, surface the conflict in both review views and require explicit resolution.
12. **AI agent API.** A first-class public interface for machine proposers — structured proposal submission with reasoning payloads. Not a retrofit of internal routes.
13. **Vertical templates.** RFC, legal amendment, construction change order, clinical protocol amendment. Same primitive, different defaults and vocabulary.
14. **Query layer.** "What does the group currently believe about X?" across all canonical truth in a workspace. Enables the primitive to become the source of institutional memory.
15. **Integrations.** GitHub (RFC/PR linking), Slack (notification and context), Linear (work tracking). Meet users where they already are.

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
- **Backend**: Go + Chi router, PostgreSQL, Redis client (unused), clean package layout (`auth`, `documents`, `blocks`, `proposals`)
- **Schema**: three migrations — users, documents + blocks (with `order_path` hierarchy and typed block content), proposals + `proposal_block_changes` (with GIN index on `affected_block_ids`)
- **API**: full CRUD for documents, blocks, and proposals; proposal state transitions (open → accepted/rejected) — though merge is not wired up and authorization is inverted (see §14)
- **Frontend**: React + TypeScript + Vite; feature-based layout (`documents`, `proposals`, `auth`, `user`); editor page with implicit change tracking and a "Create Proposal" flow
- **Design system**: shared UI kit (Card, Button, Input, Sidebar), light/dark theme, Apple HIG-inspired visual language

### Recent Decisions

- **Decision (2026-04-15):** Closed the core loop — shipped all four "Now" roadmap items.
  **Reasoning:** Merge on accept, fixed authorization (author cannot self-accept/reject), proposal review modal, and rejection rationale were the four hard prerequisites for the primitive to be usable by any real group.
  **Tradeoffs accepted:** Reviewer model is still user-level only (no roles yet); that moves to the "Next" block.

- **Decision (2026-04-15):** Reframe Granth from "document editor with first-class change" to "operating system for shared truth."
  **Reasoning:** The document framing forces competition with Google Docs/Notion on their strengths and undersells the underlying primitive. The primitive itself is universal — any group that evolves shared claims has the same needs — and the horizontal framing unlocks verticals (open source, legal, compliance, clinical, quant, AI annotation, AI agents) the document framing cannot reach.
  **Tradeoffs accepted:** Broader scope creates a harder positioning challenge and risks "for everyone means for no one." Mitigation: the near-term roadmap (§15) is still concrete and code-grounded, and the vision explicitly calls out a beachhead path (open-source RFCs is the leading candidate because those users already think in proposals).

- **Decision:** Implemented proposal-first editing workflow
  **Reasoning:** Reinforces the "proposal over edit" mental model; makes change safe by default
  **Tradeoffs accepted:** Unfamiliar UI flow vs. traditional editing

- **Decision:** Adopted Apple UI/UX philosophy throughout
  **Reasoning:** Elegant, low-friction surface reduces the cognitive overhead of the proposal model
  **Tradeoffs accepted:** Design consistency over platform-specific conventions

- **Decision:** Split features into `documents/` and `proposals/` with shared components
  **Reasoning:** Better organization, reuse, and maintainability as surfaces multiply
  **Tradeoffs accepted:** Additional abstraction layers vs. a monolithic structure

- **Decision:** Block-based content storage over document-level content
  **Reasoning:** Enables granular change tracking and, eventually, semantic diffs
  **Tradeoffs accepted:** Query complexity vs. simple text storage

### Drift Check
Tempting but misaligned ideas:
- Real-time collaborative editing (Google Docs envy)
- AI-powered content generation (the writer role §9 explicitly rejects)
- File management features (containers, not primitive)
- A polished wiki / knowledge base layer on top, before the core loop works

Why they are tempting: each is familiar, each looks like an easy win, each has precedent in existing tools.
Why they are out of scope: each competes with the core "shared truth as first-class primitive" framing and dilutes focus away from §15's "Now" list. Any of them would feel like progress while being, at best, parallel motion.

---

## Final Reminder

> **If this ever feels like "just a better editor", stop.
> If it feels scary but clarifying, you are likely on track.**
