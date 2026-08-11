# AKIJ RESOURCE LTD. — Business Requirements Specification (BRS)
## OnboardingBuddy — PeopleDesk

| Document Version | 1.0 |
|---|---|
| Prepared by | People & Culture Team |
| Date | 02 July 2026 |
| Status | Draft |
| Confidentiality | Confidential — For Internal & Authorized Stakeholder Use Only |
| Source Reference | BRS Template AI Software + OnboardingBuddy PeopleDesk offline HTML prototype |


## Table of Contents

- 1. Document Control
- 2. Introduction
- 3. Business Overview
- 4. Business Objectives & Success Criteria
- 5. Stakeholder Identification
- 6. Project Scope
- 7. Business Requirements
- 8. Functional Requirements (High-Level)
- 9. Non-Functional Requirements
- 10. Business Rules
- 11. Assumptions, Constraints & Dependencies
- 12. Risk Assessment
- 13. Data Requirements
- 14. Reporting & Analytics Requirements
- 15. Acceptance Criteria
- 16. Appendix

## 1. Document Control


### 1.1 Revision History

| Version | Date | Author | Description of Change | Approved By |
|---|---|---|---|---|
| 1.0 | 02/07/2026 | People & Culture Team | Initial completed BRS populated from OnboardingBuddy PeopleDesk offline HTML prototype | Pending |


### 1.2 Approval / Sign-off

| Name | Role / Designation | Signature | Date |
|---|---|---|---|
| TBD | Project Sponsor |  |  |
| TBD | Product Owner / Human Capital Lead |  |  |
| TBD | Business Analyst |  |  |
| TBD | Technical Lead / Architect |  |  |


### 1.3 Distribution List

- CPO / Human Capital Leadership — Akij Resource
- HR Operations / HRSS — PeopleDesk Process Owner
- Talent Management & OD — Onboarding Process Owner
- IT / HR Digital Team — System Build and Integration
- Learning & Development Team — Training and Content Owner
- Line Managers and HRBPs — Onboarding Execution Stakeholders

## 2. Introduction


### 2.1 Purpose

This Business Requirements Specification describes the business needs, objectives, scope, and high-level requirements for OnboardingBuddy — PeopleDesk, an AI-guided onboarding assistant designed to guide new joiners through their first 180 days at Akij Resource. The BRS is prepared based on the provided OnboardingBuddy offline HTML prototype and follows the provided BRS template structure.

### 2.2 Scope of Document

This document covers the business requirements for the OnboardingBuddy application, including onboarding journey tracking, 50-work checklist completion, AI-style onboarding support, 30/60/90 day assessments, 180-day growth review, help-request routing, and PeopleDesk profile visibility. Detailed system architecture, database schema, API design, security architecture, and UI code specifications will be covered separately in SRS/FRD and technical design documents.

### 2.3 Intended Audience

- Business sponsors and Human Capital leadership
- Product owner / HR Digital process owner
- Business analysts and implementation consultants
- Solution architects and application developers
- QA and UAT team
- HRBP, L&D, IT support, reporting managers, and onboarding coordinators

### 2.4 Definitions, Acronyms & Abbreviations

| Term | Definition |
|---|---|
| BRS | Business Requirements Specification |
| PeopleDesk | The organization’s HR/ERP platform intended to host or integrate the onboarding module |
| OnboardingBuddy | AI-guided onboarding assistant and journey tracker for new joiners |
| AI Guide | Assistant interface that provides guided answers, quick questions, and onboarding support based on knowledge content |
| 30-60-90 | Structured onboarding review stages for first 30, 60, and 90 days |
| 180 Days Review | Growth and integration review after completion of the 90-day onboarding journey |
| UAT | User Acceptance Testing |
| HRSS | Human Resources Shared Services |
| HRBP | Human Resources Business Partner |
| KPI | Key Performance Indicator |


### 2.5 References

- BRS_Template_AI_Software.docx — provided template structure
- OnboardingBuddy - PeopleDesk (offline).html — mobile prototype and functional reference
- 30-60-90 onboarding checklist embedded in the prototype
- PeopleDesk employee profile and onboarding process context

## 3. Business Overview


### 3.1 Business Background

Akij Resource manages a large and distributed workforce where new joiners require structured guidance, timely HR/IT/manager support, role clarity, system access, KPI understanding, policy awareness, and performance feedback during the early employment period. In the current process, onboarding activities may depend on manual follow-up, scattered communication, and inconsistent tracking across HR, manager, IT, buddy, and L&D stakeholders.
The OnboardingBuddy prototype introduces a mobile-first PeopleDesk experience that converts the onboarding journey into an engaging, step-by-step 180-day pathway. It combines progress tracking, milestone cards, task manuals, responsible-person routing, assessments, badges, help requests, and an onboarding assistant.

### 3.2 Business Problem / Opportunity Statement

Business Problem: New joiners may not always receive a consistent, transparent, and measurable onboarding experience across departments. Manual tracking of onboarding tasks, manager feedback, policy orientation, buddy support, system access, and confirmation-readiness reviews increases the risk of delay, confusion, poor engagement, and incomplete documentation.
Business Opportunity: A PeopleDesk-based onboarding assistant can standardize the first 180 days, increase completion visibility, reduce HR follow-up workload, improve new joiner engagement, and generate structured data for confirmation, development planning, and HR service improvement.

### 3.3 Proposed Business Solution (High-Level)

The proposed solution is OnboardingBuddy — a mobile-first onboarding module embedded in or integrated with PeopleDesk. The module will guide each new joiner through 50 onboarding works grouped into 30, 60, and 90-day phases, followed by a 180-day growth review. The system will show progress, open task-level manuals, identify responsible stakeholders, allow completion marking, trigger assessments, provide HR service contacts, capture help requests, and answer common onboarding questions through an AI-style assistant.

### 3.4 Business Benefits

| Benefit | Description |
|---|---|
| Efficiency Gain | Reduces manual HR follow-up by giving employees a guided checklist, task manuals, self-service answers, and direct support channels. |
| New Joiner Experience | Creates a supportive, gamified onboarding journey with progress cards, badges, encouragement, and clear next actions. |
| Governance & Compliance | Ensures policy, system access, compliance training, KPI review, and feedback checkpoints are not missed. |
| Manager Alignment | Improves role clarity, first-month goal setting, KPI discussion, and 30/60/90 review discipline. |
| Data Visibility | Provides onboarding completion, pending work, support issue, assessment, and growth-review data for HR analytics. |
| Risk Reduction | Reduces onboarding gaps, delayed access, unclear responsibilities, and inconsistent confirmation decisions. |


## 4. Business Objectives & Success Criteria


### 4.1 Business Objectives

| ID | Objective | Success Metric / KPI | Priority |
|---|---|---|---|
| OBJ-01 | Standardize the first 180 days onboarding journey for every eligible new joiner | 100% eligible new joiners assigned a 50-work journey within PeopleDesk | High |
| OBJ-02 | Increase onboarding task completion visibility | Real-time progress shown by completed, pending, phase, and percentage | High |
| OBJ-03 | Improve new joiner role clarity and system readiness | Day-7 role/KPI/system readiness tasks completed by at least 90% of new joiners | High |
| OBJ-04 | Institutionalize 30/60/90 assessment discipline | All required assessments completed and submitted before confirmation decision | High |
| OBJ-05 | Reduce HR service friction during onboarding | Help requests logged with issue type, contact number, attachment, ticket ID, and assigned team | Medium |
| OBJ-06 | Provide AI-style self-service onboarding support | Assistant covers common queries on role, access, policy, buddy, KPI, 30/60/90, 180-day review, and help | Medium |
| OBJ-07 | Enable post-onboarding growth planning | 180-day growth review and development plan available after 90-day completion | Medium |


### 4.2 Strategic Alignment

The initiative aligns with Akij Resource’s HR digital transformation, employee experience improvement, onboarding governance, performance culture, HR service automation, and PeopleDesk enhancement goals. It supports a scalable employee lifecycle model by connecting onboarding, role clarity, KPI alignment, learning, manager feedback, HR support, confirmation readiness, and development planning in one guided journey.

## 5. Stakeholder Identification

| Stakeholder | Role | Interest / Involvement | Contact |
|---|---|---|---|
| CPO / Human Capital Leadership | Project Sponsor | Strategic direction, governance, approval, adoption | TBD |
| HR Digital / PeopleDesk Owner | Product Owner | Prioritization, requirement validation, UAT ownership | TBD |
| Talent Management & OD | Process Owner | Onboarding journey design, assessment criteria, development plan design | TBD |
| HRSS / HR Operations | Operational Owner | Help request handling, employee onboarding service delivery | TBD |
| HRBP Team | Business User | SBU onboarding tracking, issue escalation, manager alignment | TBD |
| IT Support Desk | Service Stakeholder | System access, email, tool setup, support SLA | TBD |
| Learning & Development | Content Owner | Compliance training, advanced tools training, learning resources | TBD |
| Reporting Manager / Team Lead | Reviewer | Role clarity, goal setting, task review, 30/60/90 assessment | TBD |
| Assigned Buddy / Mentor | Support Role | Practical assistance during onboarding | TBD |
| New Joiner | End User | Uses the app to complete tasks, ask questions, request help, and track progress | Employee profile |


## 6. Project Scope


### 6.1 In-Scope

- Mobile-first OnboardingBuddy module with splash, home, journey, assistant, and profile screens.
- 50-work onboarding checklist grouped into 30 Days, 60 Days, and 90 Days journey phases.
- 180 Days Growth Review preview/unlock flow after completion of all 50 works and required assessments.
- Task detail manual showing responsible role, timeline, why the task matters, how-to-complete steps, and contact/help actions.
- Progress calculation showing completed works, pending works, current phase, and overall 180-day progress percentage.
- 30/60/90/180 assessment forms with rating scale, manager comment, HR observation, and final status.
- AI-style assistant with quick questions and knowledge responses for role, system access, policy, buddy, KPI, milestones, and help.
- HR service contact sheet for HR, IT, Manager, Buddy, L&D, and Department Head contacts.
- Help request form with issue type, related task, problem description, phone, screenshot/document upload, ticket confirmation.
- Employee profile section with onboarding stats, badges, employee details, and current phase.
- Bilingual Bangla-English support as reflected in the prototype.
- PeopleDesk integration requirements for employee profile, onboarding assignment, task status, assessments, and support tickets.

### 6.2 Out-of-Scope

- Payroll, attendance correction, leave approval, salary certificate, and payslip workflows beyond onboarding guidance.
- Full enterprise HRIS redesign outside the OnboardingBuddy module.
- External candidate onboarding prior to employee creation in PeopleDesk.
- Voice-based AI assistant, live call center integration, or video-based onboarding content in the first release.
- Complex AI model training/retraining pipeline if the first release uses a curated knowledge base / keyword-based assistant.
- Data migration of historical onboarding data unless approved as a separate scope item.

### 6.3 Future Scope (Phase 2 and beyond)

- LLM/NLP-powered assistant connected with HR policies, handbook, role profile, KPI library, and PeopleDesk records.
- Manager and HRBP dashboards for all new joiners and overdue onboarding tasks.
- Push notifications, reminders, escalation workflow, and SLA monitoring.
- Role-based dynamic onboarding task generation based on SBU, department, designation, location, and grade.
- Integration with learning management system, Google Calendar/Outlook, email, and document management systems.
- Onboarding analytics for early attrition risk, completion trends, service bottlenecks, and confirmation-readiness prediction.

## 7. Business Requirements

| Req ID | Requirement Description | Related Objective | Priority | Status |
|---|---|---|---|---|
| BR-001 | The system shall provide a mobile-first onboarding experience branded as OnboardingBuddy under PeopleDesk. | OBJ-01 | High | Draft |
| BR-002 | The system shall present the employee’s first 180 days journey as a guided pathway with 30, 60, 90, and 180-day milestones. | OBJ-01 | High | Draft |
| BR-003 | The system shall maintain a complete 50-work onboarding checklist for each eligible new joiner. | OBJ-01 | High | Draft |
| BR-004 | The system shall categorize checklist works into 30 Days Journey, 60 Days Journey, and 90 Days Journey phases. | OBJ-01 | High | Draft |
| BR-005 | The system shall display overall progress using completed count, pending count, progress percentage, and current phase. | OBJ-02 | High | Draft |
| BR-006 | The system shall allow a user to open each work item and view a task-specific manual. | OBJ-03 | High | Draft |
| BR-007 | Each task manual shall show timeline, responsible role, importance/why message, and how-to-complete steps. | OBJ-03 | High | Draft |
| BR-008 | The system shall allow users to mark onboarding tasks as done and update progress automatically. | OBJ-02 | High | Draft |
| BR-009 | The system shall show responsible contact options for HR, IT, Manager, Buddy, L&D, and Department Head as applicable. | OBJ-05 | High | Draft |
| BR-010 | The system shall provide 30, 60, and 90-day assessments linked to the relevant journey phases. | OBJ-04 | High | Draft |
| BR-011 | Assessment forms shall capture ratings, manager comments, HR observations, and final status. | OBJ-04 | High | Draft |
| BR-012 | The 180 Days Growth Review shall remain locked until all 50 works and required assessments are completed. | OBJ-07 | High | Draft |
| BR-013 | The system shall provide a 180-day growth review covering KPI progress, learning plan, skill gap, culture integration, collaboration, career development, and future readiness. | OBJ-07 | Medium | Draft |
| BR-014 | The system shall provide an AI-style onboarding assistant for common onboarding questions. | OBJ-06 | Medium | Draft |
| BR-015 | The assistant shall provide quick question chips for role/JD, system access, policy, buddy, KPI, 30/60/90/180 days, and help. | OBJ-06 | Medium | Draft |
| BR-016 | The system shall provide a help request form with employee enroll number, issue type, related task, problem description, preferred contact number, and attachment. | OBJ-05 | High | Draft |
| BR-017 | The system shall generate a ticket confirmation after help request submission. | OBJ-05 | Medium | Draft |
| BR-018 | The system shall display employee profile details such as name, enroll number, SBU, department, designation, joining date, reporting manager, buddy, and email. | OBJ-02 | Medium | Draft |
| BR-019 | The system shall provide onboarding badges/achievements to encourage completion and engagement. | OBJ-02 | Low | Draft |
| BR-020 | The system shall support Bangla-English mixed interface content as reflected in the prototype. | OBJ-01 | Medium | Draft |
| BR-021 | The system shall provide success modal and toast notifications for task completion, assessment submission, contact actions, and help ticket creation. | OBJ-02 | Medium | Draft |
| BR-022 | The system shall be configurable so HR can update tasks, timelines, responsible roles, assessment items, final statuses, and knowledge-base answers without code changes in future release. | OBJ-01 | Medium | Draft |


### 7.1 Priority Legend

- High — Critical to business objectives; must be delivered in the first release.
- Medium — Important but can be phased or delivered after core launch if necessary.
- Low — Desirable experience enhancement that can be deferred to later release.

## 8. Functional Requirements (High-Level)


### 8.1 Core Functional Requirements

| FR ID | Feature | Description |
|---|---|---|
| FR-01 | Splash / Welcome Screen | Display welcome message, product name, Bangla tagline, and Start My Journey action. |
| FR-02 | Home Dashboard | Show greeting, progress card, completed/pending works, AI Guide card, HR service shortcuts, and current milestone. |
| FR-03 | Journey Screen | Display all milestones: 30 Days, 60 Days, 90 Days, and 180 Days Growth. |
| FR-04 | Full 50 Work List | Provide overlay listing all onboarding works with status and completion progress. |
| FR-05 | Phase View | Open each phase and show phase tasks, done/pending status, phase progress, and assessment entry. |
| FR-06 | Task Manual | Show task title, work number, timeline, responsible role, why-important note, how-to-complete steps, contact, help, and mark-as-done action. |
| FR-07 | Completion Tracking | Mark task as done, update counts, phase status, progress bar, and overall percentage in real time. |
| FR-08 | Assessment Forms | Support 30/60/90/180 assessment items with 1-4 rating scale, final status, manager comment, and HR observation. |
| FR-09 | Assessment Validation | Prevent assessment submission if all ratings and final status are not selected. |
| FR-10 | 180 Days Growth Review | Show locked/preview state, unlock after required completion, show review items, and allow 180-day assessment submission. |
| FR-11 | AI-style Assistant | Accept text questions and quick questions, respond using onboarding knowledge base, and support common onboarding topics. |
| FR-12 | Quick Question Chips | Provide pre-defined quick access topics such as Role/JD, System Access, Policy, Buddy, KPI, 30 Days, 60 Days, 90 Days, 180 Days, Help. |
| FR-13 | Contact Sheet | Show responsible contact details and actions for call, WhatsApp, message, and help request. |
| FR-14 | Help Request | Capture enroll number, issue type, related task, problem description, phone, attachment, and submit to HR team. |
| FR-15 | Ticket Confirmation | Show ticket ID, status, and assigned team after help request submission. |
| FR-16 | Profile Screen | Show employee profile, onboarding statistics, badges, and employee details. |
| FR-17 | Badges | Display earned and locked onboarding achievement badges. |
| FR-18 | Development Plan | Show next 90-day development plan items after growth review access. |
| FR-19 | Notifications / Feedback | Show success modal, toasts, encouragement, and phase complete messages. |
| FR-20 | Responsive Mobile UI | Maintain mobile app layout compatible with PeopleDesk mobile/webview experience. |


### 8.2 AI / ML Specific Requirements

| AI Area | Requirement |
|---|---|
| Model / Assistant Type | Phase 1 may use a curated knowledge base and keyword matching as reflected in the prototype. Future release may use an NLP/LLM-based assistant connected to approved HR content. |
| Knowledge Sources | Approved employee handbook, onboarding policy, role/JD guidance, KPI process, system access instructions, HRSS support rules, and 30/60/90/180 review process. |
| Training / Content Governance | Only approved HR content shall be used. HR process owners must be able to review and approve knowledge-base changes before publishing. |
| Accuracy / Quality Threshold | At least 90% of common onboarding queries in UAT shall return the correct approved response or guide the employee to the correct responsible team. |
| Human-in-the-loop | Any query involving sensitive employment decision, confirmation, payroll, disciplinary matter, or policy exception shall route to HR/manager rather than providing final automated decision. |
| Explainability | Assistant responses should clearly state the next action, responsible team, and when to contact HR/IT/Manager/Buddy. |
| Bias & Fairness | The assistant and onboarding tasks must be applied consistently across eligible employees, while allowing role/SBU/location-specific configuration where approved. |
| Data Privacy | Chat and help data containing employee information must be protected and used only for onboarding support and authorized analytics. |


## 9. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Home, journey, profile, task, and assessment screens should load within 2 seconds under normal network conditions for 95% of users. |
| Availability | The module should follow PeopleDesk availability standards. Target uptime should be no less than the agreed HRIS SLA. |
| Scalability | The solution should support onboarding cohorts across Akij Resource SBUs, with concurrent access during joining/onboarding periods. |
| Security | Access shall be authenticated through PeopleDesk login/SSO. Employees can view only their own onboarding data unless role-based permissions allow otherwise. |
| Data Privacy | Employee profile, assessment, support request, and attachment data must be handled under organizational data privacy and access-control policies. |
| Usability | The interface should be mobile-first, simple, bilingual, encouraging, and understandable by new joiners without formal training. |
| Accessibility | Text contrast, tappable controls, readable font sizes, and Bangla rendering must support comfortable use on mobile devices. |
| Maintainability | HR admins should be able to update tasks, manual steps, assessment criteria, support contacts, and AI knowledge-base content without code deployment in future state. |
| Auditability | Task completion, assessment submission, help request, and status changes should be logged with user, timestamp, and source. |
| Compatibility | The module should work in PeopleDesk web/mobile view and modern browsers used by employees. |
| Localization | Bangla-English mixed content must render correctly, including Bangla numerals where used in the UI. |
| Reliability | Progress calculation must remain accurate even after refresh, device change, or session timeout once backend persistence is enabled. |


## 10. Business Rules

| Rule ID | Business Rule Description |
|---|---|
| BRU-01 | Every eligible new joiner shall be assigned the 50-work onboarding checklist from joining date or employee activation date. |
| BRU-02 | The 30 Days Journey contains Work 1-22; the 60 Days Journey contains Work 23-39; the 90 Days Journey contains Work 40-50. |
| BRU-03 | Overall onboarding progress shall be calculated as completed works divided by 50 total works. |
| BRU-04 | Current phase shall be determined by the earliest incomplete phase among 30, 60, and 90 Days. |
| BRU-05 | Users shall be able to mark only their assigned onboarding tasks as done, unless HR/admin role allows update on behalf of employee. |
| BRU-06 | Task manual shall display the responsible role and contact route based on the task category: HR, IT, Manager, Buddy, Training, or Department Head. |
| BRU-07 | Assessment submission shall not be allowed until all assessment items are rated and final status is selected. |
| BRU-08 | 30/60/90 assessments shall include manager comment and HR observation fields. |
| BRU-09 | 180 Days Growth Review shall remain locked until all 50 works and 30/60/90 assessments are completed. |
| BRU-10 | Help request submission shall require problem description; issue type and employee enroll number shall be captured. |
| BRU-11 | Submitted help requests shall generate a ticket ID and be assigned to HR Onboarding Team or configured support owner. |
| BRU-12 | The assistant shall not provide final decision for confirmation, promotion, policy exceptions, or disciplinary matters; it shall route to HR/manager. |
| BRU-13 | Employee profile data shall be fetched from PeopleDesk and should not be manually edited by the employee in the onboarding module. |
| BRU-14 | Only authorized HR/manager roles may access assessment records beyond the employee’s self-view, according to privacy rules. |
| BRU-15 | Badges are motivational indicators and shall not replace formal performance or confirmation assessment. |


## 11. Assumptions, Constraints & Dependencies


### 11.1 Assumptions

- PeopleDesk will remain the source of employee master data including enroll number, department, designation, joining date, reporting manager, and email.
- Human Capital process owners will approve the final onboarding checklist, task manuals, assessment items, and growth review criteria.
- IT, HR, Manager, Buddy, L&D, and Department Head contact responsibilities will be configurable by SBU/department if required.
- Employees will have access to PeopleDesk mobile/web after joining and will use the module during onboarding.
- The first release may be implemented with a rules/knowledge-base assistant before advanced AI model integration.

### 11.2 Constraints

- The provided HTML is an offline prototype and currently does not include backend persistence, authentication, real ticketing, or live PeopleDesk API integration.
- The prototype contains sample employee data and sample support contacts; production must replace these with real PeopleDesk data and approved contact directory.
- Any AI/assistant response must be limited to approved HR content and should not create policy ambiguity.
- Bangla font rendering and mobile responsiveness must be validated on actual user devices.
- Production launch depends on PeopleDesk integration capacity and data-security approval.

### 11.3 Dependencies

- PeopleDesk employee master data and user authentication.
- HR-approved onboarding content and policy references.
- IT support workflow and contact directory.
- Manager and HRBP role mapping for each employee.
- File/attachment storage service for help request screenshots/documents.
- Notification service for future reminders and escalations.
- Analytics/reporting layer for dashboards and exports.

## 12. Risk Assessment

| Risk | Likelihood | Impact | Mitigation Strategy |
|---|---|---|---|
| Onboarding checklist not aligned with business reality across SBUs | Medium | High | Run stakeholder validation by SBU, role family, and location; allow configurable task templates. |
| User adoption resistance from employees or managers | Medium | Medium | Use simple mobile UI, onboarding communication, manager briefing, and HRBP follow-up. |
| AI/assistant provides outdated or inaccurate guidance | Medium | High | Use approved knowledge base, version control, HR content owner approval, and human escalation path. |
| Privacy concern around assessment visibility | Medium | High | Apply role-based access control, audit logs, and privacy-by-design principles. |
| Incomplete backend integration causes manual duplication | Medium | Medium | Define clear API requirements with PeopleDesk before development and run integration UAT. |
| Progress/status data becomes inaccurate due to refresh or device change | Low | High | Persist all completion and assessment data in backend with timestamp and transaction logs. |
| Scope creep into broader HR services | Medium | Medium | Keep release 1 focused on onboarding journey; manage new service requests through change control. |
| Bangla rendering or mobile layout issues | Medium | Medium | Conduct device-level QA on common Android/iOS/browser environments and approved fonts. |


## 13. Data Requirements


### 13.1 Data Sources

- PeopleDesk employee master data
- Onboarding task template library
- Task completion status and timestamps
- Assessment forms and results
- Manager and HR comments/observations
- Support contact directory
- Help request tickets and attachments
- Assistant knowledge base and chat/query logs
- Badge/achievement rules
- Development plan items

### 13.2 Data Quality Requirements

- Employee profile fields must be complete before journey assignment.
- Each checklist task must have task name, phase, timeline, responsible role, and active/inactive status.
- Assessment items and final statuses must be version-controlled.
- Support contacts must be valid and reviewed periodically.
- Task completion data must avoid duplication and maintain one source of truth per employee.

### 13.3 Data Governance & Privacy

- Only authorized roles can access assessment details and HR observations.
- Attachments must be stored securely and retained according to HR data retention policy.
- Chat/help data should be used only for onboarding support, service improvement, and approved analytics.
- All data changes should be auditable with user ID, timestamp, and action type.
- Personal data should not be used for AI training unless explicitly approved by governance and privacy rules.

## 14. Reporting & Analytics Requirements

- Individual new joiner onboarding progress: completed works, pending works, percentage, current phase.
- Phase-wise completion report for 30/60/90-day journey.
- Overdue or pending task report by employee, department, manager, HRBP, and SBU.
- Assessment completion and status report for 30/60/90/180 reviews.
- Help request dashboard by issue type, task, assigned team, status, and turnaround time.
- Assistant usage report: common questions, unresolved topics, and content gaps.
- Badge/engagement report by onboarding cohort.
- 180-day growth and development plan completion report.
- Exportable reports for HR leadership, HRBP, manager, and HRSS follow-up.

## 15. Acceptance Criteria

- All High-priority business requirements in Section 7 are implemented and validated through UAT.
- The system correctly displays all 50 onboarding works grouped into 30, 60, and 90-day phases.
- Progress counts and percentage update accurately after task completion.
- Each task opens with manual, responsible role, timeline, importance note, contact action, help request, and mark-as-done option.
- 30/60/90 assessments validate required ratings and final status before submission.
- 180 Days Growth Review remains locked until the defined completion conditions are met.
- Assistant returns correct approved responses for role/JD, system access, policy, buddy, KPI, 30/60/90, 180-day review, and help topics.
- Help request form creates ticket confirmation with ticket ID, status, and assigned team.
- Profile screen displays PeopleDesk employee data and onboarding stats correctly.
- Bangla-English interface renders correctly on target mobile devices.
- Security and privacy controls pass IT/security review before production rollout.
- Business sponsor, product owner, HR process owner, and technical lead sign off after UAT.

## 16. Appendix


### 16.1 Complete 50-Work Onboarding Checklist from Prototype

| # | Phase | Work / Task | Responsible | Timeline | Prototype Status |
|---|---|---|---|---|---|
| 1 | 30 Days | Review job role, responsibilities & expectations | HR | Day 1 | Done |
| 2 | 30 Days | Ensure access to email, HR software & PM tools | IT Department | Day 1 | Done |
| 3 | 30 Days | Meet immediate team members & understand roles | HR / Manager | Day 1-2 | Done |
| 4 | 30 Days | Introduce company history, mission & values | HR | Day 1-2 | Done |
| 5 | 30 Days | Orientation on policies (attendance & security) | HR | Day 2-3 | Done |
| 6 | 30 Days | Explain culture, work ethics & communication style | HR / Manager | Day 2-3 | Done |
| 7 | 30 Days | Complete mandatory compliance training | HR / Training | Day 3-5 | Done |
| 8 | 30 Days | Set up email, storage & communication channels | IT Department | Day 1-3 | Done |
| 9 | 30 Days | Familiarize with leave, dress code & ethics policy | HR | Day 4-6 | Pending |
| 10 | 30 Days | Ensure access to employee handbook & documents | HR | Day 2 | Pending |
| 11 | 30 Days | Assign a mentor / buddy for first 90 days | HR / Manager | Day 3 | Pending |
| 12 | 30 Days | Review initial KPIs & performance expectations | Manager / Team Lead | Day 7 | Pending |
| 13 | 30 Days | Set meeting with manager to discuss first month goals | Manager / Team Lead | Day 7 | Pending |
| 14 | 30 Days | Familiarize with internal communication platform | IT / Manager | Day 2-3 | Pending |
| 15 | 30 Days | Introduce company structure & key leadership | HR | Day 3 | Pending |
| 16 | 30 Days | Overview of products, services & target markets | HR / Manager | Day 5 | Pending |
| 17 | 30 Days | Set up work tracking tools & reminders | IT / Manager | Day 3 | Pending |
| 18 | 30 Days | Explain department's role within the company | Department Head | Day 4-5 | Pending |
| 19 | 30 Days | Assign first project/task for review & learning | Manager / Team Lead | Day 7 | Pending |
| 20 | 30 Days | Schedule first week 1:1 feedback session | Manager / Team Lead | Day 7 | Pending |
| 21 | 30 Days | Check performance against KPIs & improvement areas | Manager / Team Lead | Day 30 | Pending |
| 22 | 30 Days | Feedback session on strengths & development areas | Manager / Team Lead | Day 30 | Pending |
| 23 | 60 Days | Evaluate integration with team & collaboration | Manager / Team Lead | Day 30-45 | Pending |
| 24 | 60 Days | Assess independent work & deadline meeting | Manager / Team Lead | Day 30-45 | Pending |
| 25 | 60 Days | Ensure proficiency in required tools & systems | Manager / Team Lead | Day 30-45 | Pending |
| 26 | 60 Days | Provide advanced tools / system training | IT / HR Training | Day 30-45 | Pending |
| 27 | 60 Days | HR meeting to evaluate work-environment satisfaction | HR | Day 30-45 | Pending |
| 28 | 60 Days | Constructive feedback on initial projects | Manager / HR Training | Day 30 | Pending |
| 29 | 60 Days | Encourage participation in events & workshops | HR / Manager | Day 30-60 | Pending |
| 30 | 60 Days | Ensure involvement in one cross-department project | Manager / Team Lead | Day 45-60 | Pending |
| 31 | 60 Days | Continue mentoring with regular check-ins | Manager / Team Lead | Day 30-60 | Pending |
| 32 | 60 Days | Provide learning resources or certifications | HR / Manager | Day 45-60 | Pending |
| 33 | 60 Days | Evaluate communication effectiveness in team | Manager / Team Lead | Day 45-60 | Pending |
| 34 | 60 Days | Ensure active contribution of ideas & feedback | Manager / Team Lead | Day 45-60 | Pending |
| 35 | 60 Days | Meeting with senior management for career discussion | HR / Manager | Day 60 | Pending |
| 36 | 60 Days | Assess familiarity with relevant projects | Manager / Team Lead | Day 60 | Pending |
| 37 | 60 Days | Discuss personal development goals & skills gap | Manager / Team Lead | Day 60 | Pending |
| 38 | 60 Days | Review KPI progress & adjust if needed | Manager / Team Lead | Day 60 | Pending |
| 39 | 60 Days | Evaluate initiative in solving problems independently | Manager / Team Lead | Day 60 | Pending |
| 40 | 90 Days | Formal performance review (self + manager feedback) | Manager / HR | Day 90 | Pending |
| 41 | 90 Days | Assess integration into company culture | Manager / HR | Day 90 | Pending |
| 42 | 90 Days | Review overall job performance vs KPIs | Manager / HR | Day 90 | Pending |
| 43 | 90 Days | Identify development areas & actionable feedback | Manager / HR | Day 90 | Pending |
| 44 | 90 Days | Confirm meeting long-term performance expectations | Manager / HR | Day 90 | Pending |
| 45 | 90 Days | Provide leadership / additional responsibilities | Manager / Team Lead | Day 90 | Pending |
| 46 | 90 Days | Evaluate collaboration within & across departments | Manager / HR | Day 90 | Pending |
| 47 | 90 Days | Assess contribution to team objectives | Manager / Team Lead | Day 90 | Pending |
| 48 | 90 Days | Check ability to handle pressure & priorities | Manager / Team Lead | Day 90 | Pending |
| 49 | 90 Days | Discuss future growth, promotion & career | Manager / HR | Day 90 | Pending |
| 50 | 90 Days | Prepare action plan for professional development | HR / Manager | Day 90 | Pending |


### 16.2 180 Days Growth Review Items

| # | Growth Review Item |
|---|---|
| 1 | Long-term KPI progress |
| 2 | Learning plan follow-up |
| 3 | Skill gap improvement |
| 4 | Cultural integration |
| 5 | Cross-functional collaboration |
| 6 | Career development discussion |
| 7 | Future role readiness |
| 8 | Manager feedback |
| 9 | HR feedback |
| 10 | Next development action plan |


### 16.3 Assessment Structure

| Assessment | Review Items | Final Status Options |
|---|---|---|
| 30 Days Assessment | Role clarity, KPI understanding, System access completion, Team integration, First task completion, Employee self-feedback, Manager comment, HR observation, Development need | On Track, Needs Support, Role Clarity Required |
| 60 Days Assessment | Independent task completion, Deadline management, Collaboration, Tool proficiency, Learning progress, Cross-functional involvement, Communication, Problem-solving initiative, KPI progress | Performing Well, Development Needed, KPI Adjustment Required |
| 90 Days Assessment | KPI achievement, Job performance, Culture fit, Team collaboration, Pressure handling, Ownership, Learning agility, Future growth readiness, Confirmation recommendation, Development action plan | Confirmation Ready, Extend Probation, Development Plan Required |
| 180 Days Growth Review | Long-term KPI progress, Learning plan follow-up, Skill gap improvement, Cultural integration, Cross-functional collaboration, Career development discussion, Future role readiness, Manager feedback, HR feedback, Next development action plan | Growth on Track, Accelerated Development, Focused Support Needed |


### 16.4 Assistant Knowledge Base Topics

| Keywords / Topic | Prototype Response Summary |
|---|---|
| role, jd, responsib, ভূমিকা | আপনার role এবং responsibility বুঝতে প্রথমে JD পড়ুন, এরপর manager-এর সাথে first month goals discuss করুন। unclear থাকলে HR বা manager-এর সাথে যোগাযোগ করুন। |
| email, access, peopledesk, software, system | System access এর জন্য IT Support Desk-এর সাথে যোগাযোগ করুন। email, PeopleDesk, shared drive ও communication tools Day 1-3 এর মধ্যে চালু হয়েছে কিনা নিশ্চিত করুন। |
| policy, attendance, leave, dress | Company policy জানতে employee handbook পড়ুন। Attendance, leave, dress code, ethics ও security policy Day 2-6 এর মধ্যে বুঝে নিতে হবে। |
| buddy, mentor | আপনার প্রথম ৯০ দিনের জন্য একজন buddy/mentor assign করা হবে। practical support দরকার হলে buddy-এর সাথে যোগাযোগ করুন। |
| kpi, goal, performance | Day 7 এর মধ্যে manager-এর সাথে initial KPI ও first month goal review করুন। KPI বুঝে নেওয়া onboarding-এর অন্যতম গুরুত্বপূর্ণ ধাপ। |
| 30, first assessment | Day 30 assessment-এ role clarity, KPI understanding, team integration, system usage ও first task performance review করা হবে। |
| 60, second | Day 60 assessment-এ independent work, collaboration, communication, problem solving ও KPI progress review করা হবে। |
| 90, confirmation | Day 90 assessment-এ overall performance, culture fit, KPI achievement, ownership ও confirmation readiness review করা হবে। |
| 180, growth, development | Day 180 review-এ long-term KPI progress, learning plan, skill gap improvement, career growth ও future role readiness review করা হবে। |
| help, support, problem, সমস্যা | আপনার সমস্যার ধরন লিখুন। আপনি চাইলে HR, IT, Manager অথবা Buddy-এর সাথে সরাসরি যোগাযোগ করতে পারেন। |


### 16.5 Quick Questions and Badges

| Quick Question Label | Mapped Topic |
|---|---|
| Role / JD | role |
| System Access | email |
| Policy | policy |
| Buddy | buddy |
| KPI | kpi |
| 30 Days | 30 |
| 60 Days | 60 |
| 90 Days | 90 |
| 180 Days | 180 |
| Help | help |

| Badge | Prototype Status |
|---|---|
| First Day Ready | Earned |
| System Access Hero | Earned |
| Policy Learner | Earned |
| Team Connector | Earned |
| KPI Starter | Locked |
| 30 Days Champion | Locked |
| 60 Days Contributor | Locked |
| 90 Days Ready | Locked |
| 180 Days Growth Ready | Locked |


### 16.6 Contact Directory from Prototype

| Contact / Team | Role | Sample Phone |
|---|---|---|
| HR Onboarding Team | Human Resources | 01700-000001 |
| IT Support Desk | IT Department | 01700-000002 |
| Direct Manager | Manager / Team Lead | 01700-000003 |
| Assigned Buddy | Mentor / Buddy | 01700-000004 |
| Learning & Development Team | Training | 01700-000005 |
| Department Head | Department | 01700-000006 |


### 16.7 Supporting Documents

- BRS_Template_AI_Software.docx
- OnboardingBuddy - PeopleDesk (offline).html
- Extracted app data: journey phases, assessments, knowledge base, quick questions, badges, and contacts.