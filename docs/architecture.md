# Mercurio Design Architecture

Version: 1.0

---

# 1. Purpose

Mercurio Design is the canonical source of truth for every visual asset used by Mercurio. Mercurio Design is the only repository from which production visual assets may be generated.

It owns:

- Design system
- Source artwork
- Icons
- Templates
- Asset compiler
- Export pipeline
- AI prompt library

It does not own:

- Gameplay
- Rules
- Balancing
- Runtime UI
- Networking
- Platform-specific implementation

---

# 2. Vision

The goal of this repository is to make every visual asset reproducible.

No visual asset should ever require manual editing after it has been generated.

Every production asset should be reproducible from source assets.

This allows:

- consistent visual language
- deterministic builds
- easy expansion
- localization
- future editions
- multiple export targets

---

# 3. Core Principles

## Source assets are immutable

Icons

Templates

Artwork

Fonts

CSV

Prompt library

are source assets.

They are manually curated.

They are version controlled.

---

## Generated assets are disposable

Generated files are build artefacts.

They should never be edited.

Deleting the export folder and rebuilding should always produce identical output.

---

## Data is separate from presentation

Game content defines

- resources
- VP
- technology
- costs

Templates define

- layout
- spacing
- typography
- composition

Artwork defines

- atmosphere
- identity
- flavour

No layer should know about another layer's implementation.

---

## Templates own layout

Planet cards are never manually positioned.

Templates determine:

- cell layout for resource icons
- margins
- artwork bounds
- clipping masks
- panel position and dimensions

Changing a template should regenerate every card automatically.

---

## Artwork is reusable

Artwork should represent categories rather than individual cards.

Example

Ice Planet

instead of

Planet #17

This allows many cards to share a consistent visual language.

---

## Compiler first

The repository exists to build assets.

Everything should ultimately feed into the Asset Compiler.

---

# 4. Repository Responsibilities

Mercurio Design owns

- icon library
- card templates
- board templates
- AI prompts
- artwork
- typography
- palettes
- compiler
- exporters

Mercurio Design does NOT own

- game engine
- React runtime
- BGA implementation
- Firestore
- gameplay rules

---

# 5. Repository Structure

source/

    csv/

    icons/

    artwork/

    fonts/

    prompts/

templates/

exports/

docs/

scripts/

---

# 6. Source Assets

The following are canonical source assets.

CSV

Planet Layout

Planet Resources

Planet Types

Planet Benefits

Icons

Planet Type Icons

Resource Icons

Fonts

AI Prompt Library

Artwork

Templates

---

# 7. Canonical Build Pipeline

Source Data

↓

Normalization

↓

Canonical Card Model

↓

Template Resolution

↓

Composition

↓

Rendering

↓

Optimization

↓

Packaging

↓

Export

Each stage has a single responsibility.

---

# 8. Export Targets

The compiler must eventually support multiple export targets.

Examples

BGA

WEBP

Sprite sheets

PNG

Printable PDF

Marketing Assets

Future platforms should not require modification to source assets.

---

# 9. Design Philosophy

Mercurio is a strategy game.

Information density is more important than illustration density.

Illustration provides atmosphere.

Icons provide information.

Typography provides clarity.

The player should understand a card within one second.

Beauty must never reduce readability.

---

# 10. Future Roadmap

Phase 1

Canonical source assets

Phase 2

Design system

Phase 3

SVG templates

Phase 4

Asset compiler

Phase 5

AI artwork library

Phase 6

Board generation

Phase 7

BGA asset export

---

This document intentionally avoids implementation details.

Implementation belongs in subordinate documents.

This document defines architecture.
