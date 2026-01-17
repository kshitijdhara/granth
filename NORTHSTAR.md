# Option B — North Star  
## Change as a First-Class Concept

> **This product is not a document editor.  
> It is a system for proposing, understanding, and resolving change safely.**

This document is the canonical reference for Option B.  
It exists to prevent conceptual drift and to realign decisions over time.

If an idea conflicts with this document, the idea is wrong by default.

---

## 1. The Problem We Actually Solve

People do not fear editing.  
**They fear irreversible consequences, lost context, and conflict.**

Existing tools create failure modes:
- Duplicated documents to feel safe
- Avoided edits to avoid blame
- Lost reasoning behind decisions
- Conflicts that are about ideas, not text

This product exists to eliminate those behaviors.

---

## 2. The Core Reframe

### Old Mental Model
> “I am editing the document.”

### New Mental Model
> **“I am proposing a change to shared truth.”**

Every system decision must reinforce this reframe.

---

## 3. The Three-Layer Document Model (Non-Negotiable)

A document is never a single mutable object.  
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

Users do not explicitly “branch”.  
They explore safely by default.

### 3. Reasoning Layer — Why
- Discussion is attached to proposals, not raw text
- Decisions reference rationale
- Context must never be lost

If reasoning disappears, the system has failed.

---

## 4. Branching (Defined Precisely)

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

## 5. Merging Without “Merges”

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

## 6. Diffs Are Semantic, Not Textual

Text diffs are a fallback, not the primary interface.

The system compares:
- Meaning
- Structure
- Claims
- Decisions
- Assumptions

Examples of semantic diffs:
- “Introduces a new assumption”
- “Weakens the original conclusion”
- “Reverses a previous decision”
- “Narrows scope”

If users must read raw diffs to understand change, abstraction has leaked.

---

## 7. Collaboration Philosophy

Presence communicates **intent**, not cursor position.

The system should surface:
- “Alex is proposing an alternative”
- “Sam is reviewing a conflicting proposal”

Not:
- cursor noise
- real-time typing theatrics

Collaboration success is measured by:
- clarity of disagreement
- speed of resolution
- preservation of context

---

## 8. The Role of AI (Strictly Scoped)

AI is **not**:
- a writer
- a replacement for thinking
- a sidebar assistant

AI **is**:
- a proposal summarizer
- a semantic diff explainer
- a conflict detector
- a merge mediator
- a reasoning synthesizer

AI exists to clarify human disagreement, not erase it.

---

## 9. Explicit Non-Goals

This product is not:
- a Notion competitor focused on flexibility
- a Google Docs competitor focused on simultaneity
- a knowledge base
- a personal notes app
- a file manager

These can exist on top of the system.  
They are not the foundation.

---

## 10. The Litmus Test (Use Constantly)

For any feature or decision, ask:

1. Does this make change safer?
2. Does this reduce fear?
3. Does this preserve reasoning?
4. Does this help resolve disagreement?
5. Does this reinforce “proposal over edit”?

If the answer is “no” to two or more, the idea is misaligned.

---

## 11. Long-Term Outcome

If successful, users will:
- stop duplicating documents
- stop avoiding edits
- stop losing context
- stop fearing collaboration

They will feel:
> “I can always explore ideas without breaking shared truth.”

Once that feeling exists, traditional editors feel irresponsible.

---

## 12. Progress & Alignment Log  
*(This section is intentionally mutable)*

### Current Phase
- [ ] Concept
- [ ] Prototype
- [ ] Internal dogfooding
- [ ] External users
- [ ] Scaling

### What Exists Today
- 

### Recent Decisions
- **Decision:**  
- **Reasoning:**  
- **Tradeoffs Accepted:**  

### Current Risks
- 

### Drift Check
- Tempting but misaligned ideas:
- Why they are tempting:
- Why they are out of scope:

### Next Irreversible Bets
- 

---

## Final Reminder

> **If this ever feels like “just a better editor”, stop.  
> If it feels scary but clarifying, you are likely on track.**
