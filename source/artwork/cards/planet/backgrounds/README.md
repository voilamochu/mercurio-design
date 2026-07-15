\# Planet Card Backgrounds



Version: 1.0



\---



\## Purpose



This directory contains the canonical deep-space background artwork used when composing Mercurio planet cards.



These backgrounds are reusable visual layers.



They are intentionally independent of:



\- planet artwork

\- card frames

\- gameplay information

\- runtime overlays



The Asset Compiler composites these backgrounds together with other layers to produce production-ready card assets.



\---



\## Current Assets



| Asset | Status | Notes |

|--------|--------|-------|

| deep-space-v1.png | Approved | Primary background for Version 1 |



\---



\## Usage



Backgrounds occupy the lowest visual layer in the composition stack.



```

Space Background

↓

Planet Artwork

↓

Frame

↓

Gameplay Icons

↓

Text

↓

Runtime Overlays

```



Backgrounds should never contain:



\- planets

\- moons

\- spacecraft

\- UI

\- text

\- borders

\- gameplay information



\---



\## Design Goals



Backgrounds should provide atmosphere without competing with gameplay information.



The central region of the artwork should remain visually quiet so that planet artwork remains the focal point.



Visual complexity should be concentrated near the edges.



\---



\## Master Assets



Store master artwork in PNG format.



The Asset Compiler is responsible for generating optimized WEBP assets.



\---



\## Naming Convention



```

deep-space-v1.png

deep-space-v2.png

deep-space-dark-v1.png

deep-space-nebula-v1.png

```



\---



\## Future Variants



Potential future additions include:



\- Minimal

\- Dense Nebula

\- Galactic Core

\- Outer Rim

\- Dark Void



Variants should share the same artistic language.

