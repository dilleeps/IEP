# Dashboard Domain - Architecture

## Overview
Dashboard domain aggregates data from multiple sources to provide a unified summary view. No data persistence - purely read-only aggregation.

## Key Design Decisions

### 1. No Database Model
**Decision**: Dashboard has no persistent data model - aggregates from other domains.

**Rationale**:
- Dashboard is a view, not data
- Real-time aggregation ensures freshness
- No data duplication
- Simplified architecture

### 2. Role-Based Summary
**Decision**: Different dashboard content for PARENT/ADVOCATE vs. ADMIN.

**Rationale**:
- Parents need personal child data
- ADMINs need system-wide metrics
- Single endpoint, different responses
- Clear separation of concerns

### 3. Calculated Deadlines
**Decision**: Calculate `daysUntil` on the fly from dates.

**Rationale**:
- Always accurate (no stale data)
- Simple calculation
- Useful for UI prioritization
- Highlight urgent items (< 7 days)

### 4. Recent Activity Log
**Decision**: Query recent activity from multiple tables and merge.

**Rationale**:
- Users want to see "what's new"
- Aggregates goals, documents, communications, etc.
- Time-sorted unified view
- Limited to recent items (performance)

## Data Aggregation Sources

### For PARENT/ADVOCATE
- **Children Count**: Count from child_profiles where userId
- **Upcoming Deadlines**:
  - IEP review dates from child_profiles
  - Follow-up dates from communication_logs
  - Compliance deadlines from compliance_logs
  - Goal target dates from goal_progress
- **Advocacy Alerts**: Active advocacy_insights filtered by priority
- **Recent Activity**:
  - Goals: lastUpdated
  - Documents: uploadDate
  - Communications: createdAt
  - Behaviors: createdAt
  - Letters: createdAt
- **Stats**: Count active records by userId

### For ADMIN
- **System Stats**:
  - Total users: count(users)
  - Active users: count(users where status = 'active')
  - Pending approvals: count(users where status = 'pending')
  - Total children: count(child_profiles)
  - Resource views: sum(resources.viewCount)
- **Recent Activity**: Recent user registrations, approvals

## Business Rules

### Access Rules
1. PARENT/ADVOCATE: See own data only
2. ADMIN: See system-wide aggregated data
3. All data filtered by userId (except ADMIN)

### Deadline Prioritization
- Sort by daysUntil ascending
- Highlight items with daysUntil < 7 (urgent)
- Limit to next 10 deadlines

### Recent Activity
- Limit to last 30 days
- Sort by timestamp descending
- Limit to 20 most recent items

### Performance
- Dashboard may be slow (many joins/aggregations)
- Consider Redis caching for frequently accessed data
- Cache TTL: 5-15 minutes
- Invalidate cache on relevant data changes

## Security Considerations

### Data Access
- Strict userId filtering for non-ADMIN users
- No cross-user data leakage
- ADMIN sees aggregated stats (no PII)

### Performance
- Rate limit dashboard endpoint (expensive queries)
- Consider pagination for large datasets
- Monitor query performance

## Dependencies

### Internal Models
- User
- ChildProfile
- GoalProgress
- IepDocument
- CommunicationLog
- BehaviorLog
- ComplianceLog
- AdvocacyInsight
- Resource (viewCount)

### External
- Sequelize ORM (complex joins)
- Redis (optional caching)

## Integration Points

- **All Domains**: Dashboard aggregates from all user data domains
- **Preferences**: Uses dashboardLayout for widget customization (future)
- **Notifications**: Deadline reminders based on dashboard data

## Testing Strategy

### Unit Tests
- Deadline calculation logic
- Activity merging and sorting
- Stats aggregation
- Role-based filtering

### Integration Tests
- GET summary as PARENT (userId filtering)
- GET summary as ADMIN (system stats)
- Verify data aggregation accuracy
- Performance testing (query time)

### Performance Tests
- Dashboard load time with varying data sizes
- Caching effectiveness
- Concurrent requests handling
