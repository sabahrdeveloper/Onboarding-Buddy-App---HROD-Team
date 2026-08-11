---
name: peopledesk-design-system
description: Use this skill when designing, reviewing, or implementing PeopleDesk mobile app screens, HR service flows, AI-assisted employee journeys, HTML/CSS prototypes, React/React Native screens, Flutter screens, or UI components that should follow the PeopleDesk Mobile Design System.
---

# PeopleDesk Design System Skill

## Purpose

This skill helps Claude Code create, review, and improve PeopleDesk mobile app interfaces and HR service journeys.

PeopleDesk is an enterprise HR mobile experience for employees. The interface must feel professional, friendly, trustworthy, simple, supportive, and Bangla-first.

Use this skill when the user asks for:

- PeopleDesk mobile app screens
- HR service flows
- Leave, movement, lunch, payslip, salary certificate, document upload, TA/DA, onboarding, or employee service modules
- AI assistant cards or PeopleBuddy experiences
- HTML/CSS prototypes based on PeopleDesk
- React, React Native, Flutter, or mobile UI implementation
- UI review against PeopleDesk design rules

## Core Rules

Always follow the PeopleDesk design language unless the user explicitly requests a different brand or visual style.

Default design principles:

- Human-centered HR experience
- AI-assisted, not AI-first
- Low cognitive load
- Consistency over creativity
- Bangla-first employee experience
- Enterprise-grade simplicity

## Non-Negotiable Defaults

Always use:

- Primary Green `#2CA24D`
- Manrope font, with Inter/Roboto fallback
- 8px spacing system
- White cards on light gray backgrounds
- 16px horizontal mobile padding
- Outlined icons
- Existing reusable component patterns
- Maximum two columns on mobile
- Accessible touch targets of at least 48px x 48px

Never use by default:

- Gradients
- Glassmorphism
- Neumorphism
- Floating action buttons
- More than two accent colors
- More than two mobile columns
- Random new visual patterns
- Small unreadable text
- Dense forms without guidance

## Important References

Before implementing or reviewing, read the relevant files:

- `references/design-philosophy.md`
- `references/color-system.md`
- `references/typography-spacing.md`
- `references/components.md`
- `references/dashboard-pattern.md`
- `references/hr-service-flows.md`
- `references/bangla-writing-style.md`
- `references/accessibility-motion.md`
- `assets/design-tokens.json`

Use templates when useful:

- `templates/dashboard.html`
- `templates/movement-request.html`
- `templates/service-card.html`
- `templates/ai-assistant-card.html`
- `templates/modal.html`

Use examples when reviewing quality:

- `examples/good-ui.md`
- `examples/bad-ui.md`
- `examples/review-checklist.md`

## Implementation Behavior

When creating code:

1. Use design tokens instead of random values.
2. Build reusable components.
3. Keep mobile-first responsiveness.
4. Use the approved color palette only.
5. Use Bangla-first microcopy when employee-facing.
6. Keep AI guidance helpful and short.
7. Validate against the review checklist before final output.

When reviewing UI:

1. Check brand alignment.
2. Check typography and spacing.
3. Check component consistency.
4. Check mobile responsiveness.
5. Check accessibility.
6. Point out violations clearly.
7. Suggest corrected implementation.

## Override Policy

This skill is the default only for PeopleDesk and enterprise HR product design.

If the user explicitly requests another visual language, brand, industry, platform, or style, prioritize that request instead of forcing PeopleDesk rules.

Examples of override requests:

- Gaming UI
- SaaS landing page
- Luxury brand
- Fintech app
- Apple-style design
- Material Design 3
- Glassmorphism landing page
- Marketing website
- E-commerce app

When the task is unrelated to PeopleDesk, do not force PeopleDesk colors, typography, or HR components.

## Final Quality Standard

Every PeopleDesk output should feel like a natural extension of the existing PeopleDesk mobile application.

Consistency is more important than creativity.
