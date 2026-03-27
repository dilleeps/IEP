# ASKIEP Project Pricing
## Build Engagement & Production Support

**Last Updated:** January 27, 2026  
**Project Board:** https://github.com/orgs/ASKIEP/projects/1/views/1?layout=board

---

## Engagement Overview

This document outlines the pricing structure for the initial build engagement of the IEP App, including web application, mobile applications, API infrastructure, and deployment pipeline.

### What We're Building

- **Web Application** - React-based responsive web app
- **Mobile Applications** - React Native (iOS & Android)
- **API Infrastructure** - Node.js RESTful API with authentication and authorization
- **Data Layer** - GCP CloudSQL (PostgreSQL) with backup and recovery
- **Authentication** - Firebase Authentication integration
- **CI/CD Pipeline** - GitHub Actions for automated testing and deployment
- **Hosting & Infrastructure** - GCP App Engine/Cloud Run deployment

---

## Engagement Structure

### Fixed Monthly Engagement

Build engagements are structured as **fixed-scope delivery phases** with clearly defined outcomes and handover points. This is not hourly billing—you pay for outcomes and responsibility, not time tracking.

### Project Management Approach

**All development work is tracked transparently via GitHub Projects:**
- Your team creates user stories with business requirements in https://github.com/orgs/ASKIEP/projects/1/views/1?layout=board
- Deemwar handles technical decomposition of user stories into implementation tasks
- Each user story includes acceptance criteria defined by your team
- Bugs and issues tracked and prioritized in the same board
- Real-time visibility into development progress across all phases
- Sprint planning and milestone tracking via GitHub Projects
- Clear status updates (Todo, In Progress, Done, Hold)
- Collaborative refinement sessions to ensure alignment

### What's Included

#### Discovery & Architecture Phase
- Comprehensive requirements validation and refinement
- User story creation and backlog population in GitHub Projects
- System architecture design and technology stack confirmation
- Database schema design and data model optimization
- API design and endpoint specification
- Security architecture (FERPA compliance, data encryption)
- Infrastructure planning (GCP resource allocation, CloudSQL sizing)
- CI/CD pipeline design
- Timeline and milestone definition

#### Development & Implementation Phase
- Web application development (React, responsive design, WCAG 2.2 AA)
- Mobile application development (React Native for iOS and Android)
- API development with Node.js, authentication and authorization
- Database setup with migrations and seeding
- Firebase Authentication integration
- Role-based access control implementation
- Real-time progress tracking features
- Document upload and OCR integration
- Meeting preparation and collaboration tools
- Legal knowledge base and templates

#### Infrastructure & DevOps Phase
- GCP project setup and resource provisioning
- CloudSQL instance configuration with automated backups
- GitHub Actions CI/CD pipeline implementation
- Automated testing (unit and E2E)
- Environment management (dev, production)
- Security hardening and secrets management
- Performance optimization and load testing

#### Testing & Quality Assurance Phase
- Unit testing (automated test coverage)
- End-to-end testing (critical user flows)
- Cross-browser and cross-device testing
- User acceptance testing support

#### Deployment & Handover Phase
- Production deployment with zero-downtime strategy
- Database migration to production
- DNS configuration and SSL certificates
- Monitoring and alerting setup
- Documentation (technical, user, API)
- Team training and knowledge transfer
- Source code and infrastructure handover

---

## Pricing Drivers

Engagement pricing is determined based on:

### Technical Complexity
- Number of user roles and permission levels
- Integration complexity (Firebase, GCP services, OCR)
- Real-time features and data synchronization requirements
- Offline functionality requirements for mobile apps
- Data migration and import complexity

### Scale & Performance Requirements
- Expected user base size
- Concurrent user capacity
- Data volume and storage requirements
- API request load and response time SLAs
- Geographic distribution needs

### Compliance & Security Requirements
- FERPA compliance implementation depth
- Data encryption and security measures
- Audit logging and compliance reporting
- Privacy controls and consent management
- Accessibility standards compliance

### Delivery Timeline
- Standard phased delivery (recommended)
- Accelerated delivery (compressed timeline)
- Parallel workstream management

### Platform Scope
- Web only vs web + mobile
- iOS only, Android only, or both platforms
- Progressive Web App (PWA) considerations
- Desktop application requirements

---

## Engagement Phases

Build engagements are delivered in **clearly defined phases**, each with explicit scope and outcomes.

### Phase-Based Delivery

Larger initiatives (like this full-stack application) are intentionally broken into **multiple phased engagements** to:
- Ensure clarity and risk control
- Provide predictable outcomes at each milestone
- Allow for feedback and course correction
- Maintain budget predictability

### ASKIEP Phase Structure

**Phase 1: Web UI with Role-Based Flows** ✅ COMPLETED
- React web application with responsive design
- Multi-role user interfaces (Parent, Teacher, Therapist, Advocate)
- Role-specific dashboards and navigation
- Child profile management
- IEP document viewing and management
- Progress entry and visualization
- Development environment setup
- GCP infrastructure foundation

**Phase 2: Web API with Role-Based Access**
- Node.js RESTful API architecture
- Role-based authorization middleware
- CRUD endpoints for all entities (users, children, IEPs, goals, progress)
- CloudSQL database schema and migrations
- API documentation and testing
- Data validation and error handling
- Unit test coverage for API layer

**Phase 3: Integration & CI/CD Pipelines**
- GitHub Actions CI/CD pipeline
- Automated unit and E2E testing
- Deployment automation (dev → production)
- Environment configuration management
- Database migration automation
- Code quality and security scanning
- Integration between web UI and API

**Phase 4: Mobile Application**
- React Native mobile app (iOS & Android)
- Role-based mobile interfaces
- Push notifications
- Mobile-optimized IEP viewing
- Progress tracking on mobile
- App store preparation and submission

**Phase 5: Firebase Authentication**
- Firebase Authentication integration
- Email/password and social login
- Session management and token handling
- Password reset and account recovery
- User invitation and onboarding flows
- Security hardening

**Phase 6: AI Chat and Advanced Features**
- AI-powered chat assistance for IEP guidance
- Smart Legal Prompts system
- Meeting preparation automation
- Document export and template generation
- Advanced analytics and reporting
- Compliance reporting features
- Final production optimization

---

## What Happens After Build

### Clean Handover Boundary

Build engagements end with:
- ✅ Complete source code ownership
- ✅ Infrastructure documentation
- ✅ API documentation and integration guides
- ✅ User and technical documentation
- ✅ Team training completion
- ✅ Production system deployed and validated

### No Lock-In

After handover, you can:
- Run the system independently
- Use your own team for maintenance
- Engage us for production support (see Support Pricing)
- Make your own modifications and enhancements

**Production support is entirely optional and handled separately.**

---

## Production Support Engagement

**Post-build ongoing support is a separate engagement after system handover.**

### Support Philosophy

**Building** new systems requires different expertise and commitment than **maintaining** production systems:

- Different skills and workflows
- Different SLA expectations
- Different risk profiles
- Clear responsibility boundaries
- Prevents scope creep

### Our Commitment

When we support your production system, we're accountable for:
- System uptime and reliability
- Security and compliance maintenance
- Performance monitoring and optimization
- Incident response and resolution
- Proactive issue detection

### Support vs Build: Clear Boundaries

**Support = Keeping It Running**
- Fixing bugs that emerge in production
- Applying security updates
- Performance monitoring and optimization
- Incident response and resolution
- Infrastructure maintenance
- Compliance maintenance

**Build = Adding New Capabilities**
- New features or functionality
- Major architectural changes
- New integrations
- UI/UX redesigns
- Database schema evolution
- New platform support

**If you're not sure whether something is support or build, we'll help you determine the right engagement type.**

### What's Covered Under Support

**System Maintenance**
- Dependency updates and security patches
- GCP service updates and migrations
- CloudSQL maintenance and optimization
- Firebase configuration updates
- SSL certificate renewals
- DNS management

**Performance & Monitoring**
- Application performance monitoring
- Database query optimization
- Resource utilization analysis
- Log aggregation and analysis
- Alerting and notification configuration
- Capacity planning recommendations

**Security & Compliance**
- Security patch application
- Vulnerability scanning and remediation
- Access control maintenance
- Audit log management
- Compliance reporting (FERPA)
- Incident response procedures

**Operational Support**
- Bug fixes and error resolution
- Environment management (dev, production)
- Backup verification and restoration testing
- Deployment coordination
- Rollback procedures
- Documentation updates

**Communication & Reporting**
- Regular status updates
- Monthly/weekly health reports
- Incident post-mortems
- Performance trend analysis
- Recommendation reports

### What's NOT Covered Under Support

❌ New features or functionality  
❌ Major architectural changes  
❌ UI/UX redesigns  
❌ Integration with new third-party services  
❌ Database schema major changes  
❌ Complete rewrites or refactoring  
❌ Training or consulting services  
❌ Marketing or analytics consultation  

**Feature work requires a separate build engagement.**

### Support Engagement Structure

**Monthly Subscription Model**

Support is provided as a **monthly subscription** with:
- Fixed monthly engagement fee
- No hourly tracking
- Clear SLA commitments
- Defined scope boundaries
- 30-day notice for changes or cancellation

**Minimum Commitment**
- **Basic Support:** 3-month minimum engagement
- **Premium Support:** 6-month minimum engagement

This ensures we can properly set up monitoring, learn your system deeply, and provide consistent quality.

**Scaling Support**

Support level can be adjusted:
- **Upgrade:** Immediate (subject to availability)
- **Downgrade:** 60-day notice required (ensures proper transition)

### When to Start Support

✅ After Phase 3 completion (when production deployment begins)  
✅ After Phase 6 completion (full production launch)  
✅ When system has active users in production  

**Support is entirely optional.** You can run the system independently or use your own team.

### You Own Everything

After build handover, you have:
- Complete source code ownership
- Full infrastructure access
- All documentation
- Deployment knowledge

**Your Options:**
1. Run it yourself - Use your own team
2. Hire contractors - Bring in other engineers
3. Engage us later - Start support when needed (subject to availability)

**We never lock you in. Support is entirely optional.**

---

## Pricing

### Pricing Methodology

**Market Rate Comparison:**

Indian custom software development rates:
- Senior Full-Stack Developer: $40-60/hour
- DevOps/Infrastructure Engineer: $45-70/hour
- Mobile Developer (iOS/Android): $35-55/hour
- AI Engineer: $50-80/hour

**LLM-Optimized Development Approach:**

Our pricing reflects modern LLM-assisted development practices:
- **30-40% efficiency gains** through AI-powered code generation and testing
- **Faster iteration cycles** with intelligent debugging and refactoring
- **Reduced boilerplate** for infrastructure and API scaffolding
- **Automated documentation** and test case generation

| Phase | Traditional Rate<br/>(without LLM) | LLM-Optimized Rate<br/>(Current) | Hours Saved | Efficiency Gain |
|-------|-----------------------------------|----------------------------------|-------------|------------------|
| Phase 1 | ~~$7,500~~ | **$6,000** | ~30 hours | 20% |
| Phase 2 | ~~$6,500~~ | **$5,200** | ~26 hours | 20% |
| Phase 3 | ~~$5,500~~ | **$4,400** | ~22 hours | 20% |
| Phase 4 | ~~$10,350~~ | **$8,300** | ~46 hours | 20% |
| Phase 5 | ~~$3,250~~ | **$2,600** | ~13 hours | 20% |
| Phase 6 | ~~$15,900~~ | **$12,700** | ~53 hours | 20% |
| **TOTAL** | ~~$49,000~~ | **$39,200** | **~190 hours** | **20% overall** |

**Value Proposition:**
- You get the same quality output as traditional development
- At 20% lower cost due to LLM efficiency gains
- Faster delivery timelines
- Modern development practices built-in

---

### Premium Build Engagement - Fixed-Scope Phased Delivery

| Phase | Scope | Status | Investment |
|-------|-------|--------|------------|
| **Phase 1** | Web UI with Role-Based Flows<br/>• React web app with responsive design (#1, #17, #18)<br/>• Multi-role dashboards (Parent, Teacher, Therapist, Advocate)<br/>• Child profile and IEP management (#66)<br/>• Progress tracking UI (#63)<br/>• Marketing landing page at https://askiep.com/ (#14)<br/>• Email capture and Telegram notifications<br/>• GCP infrastructure setup (#3, #27)<br/>• Local development environment | ✅ **COMPLETED**<br/>28 issues closed | **$6,000** |
| **Phase 2** | Web API with Role-Based Access<br/>• Node.js RESTful API at https://devapi.askiep.com/ (dev)<br/>• Swagger documentation at https://devapi.askiep.com/api-docs/ (#15)<br/>• Role-based authorization (#2)<br/>• CloudSQL database with migrations (#12, #13)<br/>• Full CRUD endpoints (Goals #63, Compliance #64, Contact #65, Behavior #67, Advocacy #68, Letters #69, Legal/Resources #70)<br/>• Google Flash AI integration (#21)<br/>• Admin user management API (#72)<br/>• Email notifications (#24) ✅<br/>• GCP Bucket integration (#8, #25 in progress)<br/>**Remaining:** Admin UI refinements (#57, #71, #158), Audit logging (#22), Change password (#26), User profile (#46), Forgot password (#47) | 🔄 **85% COMPLETE**<br/>18 issues done<br/>5 in progress<br/>7 todo | **$5,200** |
| **Phase 3** | Integration & CI/CD Pipelines<br/>• GitHub Actions automation (API #5, UI #4 ✅)<br/>• Dev environment deployed at https://dev.askiep.com/ ✅<br/>• Dev API at https://devapi.askiep.com/ ✅<br/>• Deployment automation to Cloud Run ✅<br/>• Web UI ↔ API integration ✅<br/>• Environment management (dev, production) ✅<br/>**Remaining:** Unit and E2E testing, Security scanning | 🔄 **60% COMPLETE**<br/>Deployments live<br/>Testing pending | **$4,400** |
| **Phase 4** | Mobile Application<br/>• React Native setup (#51 ✅)<br/>• Parent functionality (16 stories: #54, #79-93)<br/>• Teacher functionality (6 stories: #56, #95-100)<br/>• Advocate functionality (4 stories: #55, #101-104)<br/>• Push notifications (#87)<br/>• Camera/photo integration (#82, #92)<br/>• App store submission (#43, #44)<br/>**All 26 mobile user stories todo** | 📋 **5% COMPLETE**<br/>Template ready<br/>All features pending | **$8,300** |
| **Phase 5** | Firebase Authentication<br/>• Firebase setup (#39)<br/>• Firebase Admin SDK (#40)<br/>• Google login integration (#41)<br/>• Session management<br/>• Password reset flows (#47)<br/>• User invitation and onboarding<br/>• Security hardening | 📋 **NOT STARTED**<br/>6 issues todo | **$2,600** |
| **Phase 6** | AI Chat & Advanced Features<br/>• Smart Legal Prompts (14 stories: #105-118)<br/>• 10 detection algorithms (#105-114)<br/>• Email automation (#115-118)<br/>• RAG API integration (#20)<br/>• Lineage comparison (5 stories: #119-123)<br/>• Meeting prep toolkit (5+ stories: #124+)<br/>• Progress visualization (4 stories)<br/>• Legal knowledge base (6 stories)<br/>• Document export and templates<br/>• Advanced analytics and reporting<br/>• Final optimization | 📋 **5% COMPLETE**<br/>AI API integrated<br/>48 features pending | **$12,700** |
| | | **TOTAL** | **$39,200** |

### Updated Scope Summary (as of January 27, 2026)

**Completed Work (Phases 1-3):**
- ✅ 28 issues fully closed and deployed
- ✅ Complete web application with all role-based views
- ✅ Deployments:
  - **Production:** https://askiep.com/ (marketing landing page with email capture)
  - **Dev Web App:** https://dev.askiep.com/
  - **Dev API:** https://devapi.askiep.com/
  - **Dev API Documentation:** https://devapi.askiep.com/api-docs/
- ✅ API infrastructure with 18+ modules operational
- ✅ CI/CD pipelines for API and web deployed to Cloud Run
- ✅ Email capture and Telegram notification system operational
- ✅ GCP infrastructure (CloudSQL with pgvector, Docker, local TLS)
- ✅ Google Flash AI integration for chat functionality

**In Progress (Phase 2-3):**
- 🔄 5 issues actively being worked (Admin UI improvements, GCP bucket, user management refinements)
- 🔄 Remaining API endpoints and admin features

**Remaining Work (Phases 2-6):**
- 📋 **101 todo issues** including:
  - 26 mobile app user stories (parent, teacher, advocate)
  - 14 Smart Legal Prompt stories (core value proposition)
  - 5 lineage comparison & analytics stories
  - 10+ meeting preparation, progress visualization, accessibility, and compliance features
  - Firebase authentication integration
  - RAG API and advanced AI features

**Premium Pricing Reflects:**
- Comprehensive mobile functionality across 3 user roles (26 detailed user stories)
- Advanced AI features with 10 detection algorithms and automated email workflows
- Complex lineage tracking and multi-year analytics
- FERPA-compliant security and audit capabilities

### Investment Notes

- **Fixed-scope pricing** - Each phase is priced for defined deliverables, not hours
- **Phase independence** - Each phase can be paused, adjusted, or re-scoped
- **Payment structure** - Monthly invoicing within each phase based on milestone completion
- **Change requests** - Scope additions assessed separately and priced transparently
- **New feature requests** - All new features must be added to GitHub Projects board at https://github.com/orgs/ASKIEP/projects/1/views/1?layout=board and will be charged at **$60/hour**
- **Includes** - Architecture, development, testing, deployment, documentation, training
- **Excludes** - Third-party service costs (GCP, Firebase, app store fees)

### Why This Pricing Structure

✅ **Transparency** - You see exactly what each phase delivers  
✅ **Predictability** - No surprise costs or scope creep  
✅ **Flexibility** - Pause between phases if priorities shift  
✅ **Risk Control** - Validate each phase before proceeding  
✅ **Outcome Focus** - Paying for working software, not time tracking  

---

## ASKIEP Production Support Pricing

**Post-build ongoing support is a separate engagement after system handover.**

### Premium Support Tiers - Monthly Subscription

| Tier | Coverage | What's Included | Monthly Investment |
|------|----------|-----------------|-------------------|
| **Basic Support** | **Business Hours**<br/>(9AM-6PM ET, Mon-Fri) | • Monthly system health reviews<br/>• Security patches & updates<br/>• Bug fixes (scheduled)<br/>• Email support<br/>• 48-hour response time<br/>• Infrastructure monitoring<br/>• Monthly performance reports | **$3,500/mo** |
| **Premium 24/7** | **24/7/365**<br/>Continuous monitoring | • **All Basic Support features**<br/>• Real-time system monitoring<br/>• Incident response (defined SLAs)<br/>• On-call engineering coverage<br/>• Deployment assistance<br/>• Performance optimization<br/>• Security incident handling<br/>• Backup validation & DR testing<br/>• Slack/phone support<br/>• Weekly status reports | **$8,500/mo** |

### Premium 24/7 Service Level Agreement (SLA)

| Priority | Example | Response Time | Resolution Target |
|----------|---------|---------------|-------------------|
| **P1 - Critical** | System down, data loss, security breach | **15 minutes** | **2 hours** |
| **P2 - High** | Major feature broken, performance degraded | **1 hour** | **8 hours** |
| **P3 - Medium** | Minor issues, workaround available | **4 hours** | **48 hours** |
| **P4 - Low** | Cosmetic issues, enhancement requests | **24 hours** | Best effort |

### What Support DOES NOT Include (Both Tiers)

❌ New feature development (separate build engagement)  
❌ Major architectural changes  
❌ Third-party vendor support  
❌ Training or consulting services  
❌ Database migrations for new features  
❌ Marketing or analytics consultation  

**Feature work requires a separate scoped engagement.**

### Support Engagement Terms

- **Monthly subscription** - No long-term commitment required
- **30-day notice** - To change tiers or cancel
- **Onboarding included** - Monitoring setup and documentation
- **Tier flexibility** - Upgrade/downgrade with 30-day notice
- **Excludes** - GCP hosting costs, Firebase fees, third-party services
- **Minimum commitment** - Basic: 3 months, Premium: 6 months

### Support Scope for ASKIEP Project

**Based on current implementation status:**

**Production-Ready Components (Support-Eligible):**
- ✅ Marketing landing page at https://askiep.com/ (production - email capture + notifications)
- ✅ Web application at https://dev.askiep.com/ (dev environment - all role-based views operational)
- ✅ API infrastructure at https://devapi.askiep.com/ (dev environment - 18+ modules with Swagger docs)
- ✅ Database (CloudSQL with pgvector, migrations, seed data)
- ✅ CI/CD pipelines (GitHub Actions → Cloud Run deployment)
- ✅ Email and Telegram notification systems (operational)
- ✅ Local development environment (Docker Compose with TLS)
- ✅ Google Flash AI integration (chat functionality)

**Components Under Development (Not Yet Support-Eligible):**
- 🔄 Admin user management refinements (in progress)
- 📋 Mobile applications (template ready, features pending)
- 📋 Firebase authentication (not started)
- 📋 Smart Legal Prompts (not started)
- 📋 Advanced analytics and lineage tracking (not started)

**Support starts when components enter production with active users.**

**Recommended Support Start:**
- **After Phase 3 completion** - For web app and API in production
- **After Phase 4 completion** - Add mobile app coverage
- **After Phase 6 completion** - Full system support with AI features

---

## Important Notes

- All pricing is per-phase with clear scope boundaries
- Larger complex systems are delivered as progressive phases
- Each phase can be independently scoped and priced
- Change requests are assessed and priced separately
- Payment terms: Monthly invoicing per phase schedule
- Source code and infrastructure ownership transfers upon completion
- Live systems supported only under active support engagement
- Ad-hoc support requests are not accepted
- Support availability subject to capacity

---

*This document reflects Deemwar's engagement-based pricing philosophy: clarity without commoditization, outcomes over hours, and predictability through phased delivery.*
