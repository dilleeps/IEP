// src/modules/dashboard/dashboard.service.ts
import { DashboardSummaryResponse, DashboardOverviewResponse } from './dashboard.types.js';
import { getSequelize } from '../config/sequelize.js';
import { QueryTypes } from 'sequelize';
import { logger } from '../config/logger.js';
import { AppError } from '../shared/errors/appError.js';

export class DashboardService {
  /**
   * Refresh materialized views (for IEP compliance and goal mastery)
   * Call after goal progress updates, service logs, etc.
   */
  async refreshMaterializedViews(): Promise<void> {
    const sequelize = getSequelize();

    try {
      // Refresh both views concurrently (non-blocking)
      await Promise.all([
        sequelize.query('REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_compliance_health', {
          type: QueryTypes.RAW,
        }),
        sequelize.query('REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_goal_mastery', {
          type: QueryTypes.RAW,
        }),
      ]);

      logger.info('Materialized views refreshed successfully');
    } catch (error) {
      logger.error('Failed to refresh materialized views', error);
      throw error;
    }
  }

  /**
   * Get IEP compliance health from materialized view
   */
  async getComplianceHealth(childId: string): Promise<any> {
    const sequelize = getSequelize();

    const results = await sequelize.query(
      `SELECT * FROM dashboard_compliance_health WHERE child_id = :childId`,
      {
        replacements: { childId },
        type: QueryTypes.SELECT,
      }
    );

    return results[0] || null;
  }

  /**
   * Get goal mastery trends from materialized view
   */
  async getGoalMasteryTrends(childId: string): Promise<any[]> {
    const sequelize = getSequelize();

    return sequelize.query(
      `SELECT * FROM dashboard_goal_mastery 
       WHERE child_id = :childId 
       ORDER BY last_progress_date DESC`,
      {
        replacements: { childId },
        type: QueryTypes.SELECT,
      }
    );
  }

  async getSummary(userId: string, userRole: string): Promise<DashboardSummaryResponse> {
    const sequelize = getSequelize();

    // For admin, show all data; otherwise show user's data
    const userFilter = userRole === 'ADMIN' ? {} : { userId };

    // Get children count
    const childrenResult = await sequelize.query(
            `SELECT COUNT(*) as total, 
              COUNT(CASE WHEN is_active = true THEN 1 END) as active
       FROM child_profiles 
       WHERE ${userRole === 'ADMIN' ? '1=1' : 'user_id = :userId'} 
         AND deleted_at IS NULL`,
      {
        replacements: { userId },
        type: QueryTypes.SELECT,
      }
    );

    const children = {
      total: parseInt((childrenResult[0] as any).total || '0'),
      active: parseInt((childrenResult[0] as any).active || '0'),
    };

    // Get upcoming deadlines (from communications with follow-ups)
    const deadlines = await sequelize.query(
            `SELECT cl.id, cl.child_id as "childId", cp.name as "childName",
              'follow_up' as type, cl.subject as title, cl.follow_up_date as date,
              (cl.follow_up_date - CURRENT_DATE) as "daysUntil"
       FROM communication_logs cl
       JOIN child_profiles cp ON cl.child_id = cp.id
       WHERE ${userRole === 'ADMIN' ? '1=1' : 'cl.user_id = :userId'}
         AND cl.follow_up_needed = true
         AND cl.follow_up_completed = false
         AND cl.follow_up_date >= CURRENT_DATE
         AND cl.follow_up_date <= CURRENT_DATE + INTERVAL '30 days'
         AND cl.deleted_at IS NULL
       ORDER BY cl.follow_up_date ASC
       LIMIT 5`,
      {
        replacements: { userId },
        type: QueryTypes.SELECT,
      }
    );

    // Get advocacy alerts count
    const advocacyStats = await sequelize.query(
      `SELECT COUNT(*) as total,
              COUNT(CASE WHEN priority = 'high' THEN 1 END) as high,
              COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium,
              COUNT(CASE WHEN priority = 'low' THEN 1 END) as low
       FROM advocacy_insights
       WHERE ${userRole === 'ADMIN' ? '1=1' : 'user_id = :userId'}
         AND status = 'active'
         AND deleted_at IS NULL`,
      {
        replacements: { userId },
        type: QueryTypes.SELECT,
      }
    );

    const advocacyAlerts = {
      total: parseInt((advocacyStats[0] as any).total || '0'),
      byPriority: {
        high: parseInt((advocacyStats[0] as any).high || '0'),
        medium: parseInt((advocacyStats[0] as any).medium || '0'),
        low: parseInt((advocacyStats[0] as any).low || '0'),
      },
    };

    // Get recent activity
    const recentActivity = await sequelize.query(
      `SELECT * FROM (
          SELECT cl.id, 'communication' as type, cl.subject as title, 
            cp.name as "childName",
                cl.communication_date as date
         FROM communication_logs cl
         JOIN child_profiles cp ON cl.child_id = cp.id
         WHERE ${userRole === 'ADMIN' ? '1=1' : 'cl.user_id = :userId'} 
           AND cl.deleted_at IS NULL
         
         UNION ALL
         
          SELECT bl.id, 'behavior' as type, 
            'Behavior: ' || SUBSTRING(bl.behavior, 1, 50) as title,
            cp.name as "childName",
                bl.event_date as date
         FROM behavior_logs bl
         JOIN child_profiles cp ON bl.child_id = cp.id
         WHERE ${userRole === 'ADMIN' ? '1=1' : 'bl.user_id = :userId'}
           AND bl.deleted_at IS NULL
         
         UNION ALL
         
          SELECT gp.id, 'goal_update' as type, gp.goal_name as title,
            cp.name as "childName",
                gp.last_updated as date
         FROM goal_progress gp
         JOIN child_profiles cp ON gp.child_id = cp.id
         WHERE ${userRole === 'ADMIN' ? '1=1' : 'gp.user_id = :userId'}
           AND gp.deleted_at IS NULL
       ) recent
       ORDER BY date DESC
       LIMIT 10`,
      {
        replacements: { userId },
        type: QueryTypes.SELECT,
      }
    );

    // Get statistics
    const stats = await sequelize.query(
      `SELECT 
         (SELECT COUNT(*) FROM goal_progress gp 
          JOIN child_profiles cp ON gp.child_id = cp.id 
          WHERE ${userRole === 'ADMIN' ? '1=1' : 'gp.user_id = :userId'} 
          AND cp.is_active = true
          AND gp.deleted_at IS NULL 
          AND cp.deleted_at IS NULL) as "totalGoals",
         (SELECT COUNT(*) FROM goal_progress gp 
          JOIN child_profiles cp ON gp.child_id = cp.id 
          WHERE ${userRole === 'ADMIN' ? '1=1' : 'gp.user_id = :userId'} 
          AND gp.status = 'in_progress' 
          AND cp.is_active = true
          AND gp.deleted_at IS NULL 
          AND cp.deleted_at IS NULL) as "goalsInProgress",
         (SELECT COUNT(*) FROM communication_logs cl 
          JOIN child_profiles cp ON cl.child_id = cp.id 
          WHERE ${userRole === 'ADMIN' ? '1=1' : 'cl.user_id = :userId'} 
          AND cp.is_active = true
          AND cl.deleted_at IS NULL 
          AND cp.deleted_at IS NULL) as "totalCommunications",
         (SELECT COUNT(*) FROM communication_logs cl 
          JOIN child_profiles cp ON cl.child_id = cp.id 
          WHERE ${userRole === 'ADMIN' ? '1=1' : 'cl.user_id = :userId'} 
          AND cl.follow_up_needed = true 
          AND cl.follow_up_completed = false 
          AND cp.is_active = true
          AND cl.deleted_at IS NULL 
          AND cp.deleted_at IS NULL) as "pendingFollowUps",
         (SELECT COUNT(*) FROM communication_logs cl 
          WHERE ${userRole === 'ADMIN' ? '1=1' : 'cl.user_id = :userId'} 
          AND cl.deleted_at IS NULL) as "recentContactsCount"`,
      {
        replacements: { userId },
        type: QueryTypes.SELECT,
      }
    );

    console.log('Dashboard statistics:', stats[0]);
    
    // Debug: Show actual communication logs
    const debugComms = await sequelize.query(
      `SELECT cl.id, cl.child_id, cl.communication_date, cl.subject, cl.deleted_at,
              cp.name as child_name, cp.is_active as child_is_active, cp.deleted_at as child_deleted_at
       FROM communication_logs cl
       LEFT JOIN child_profiles cp ON cl.child_id = cp.id
       WHERE ${userRole === 'ADMIN' ? '1=1' : 'cl.user_id = :userId'}
       ORDER BY cl.communication_date DESC`,
      {
        replacements: { userId },
        type: QueryTypes.SELECT,
      }
    );
    console.log('All communication logs with child status:', JSON.stringify(debugComms, null, 2));

    const statistics = {
      totalGoals: parseInt((stats[0] as any).totalGoals || '0'),
      goalsInProgress: parseInt((stats[0] as any).goalsInProgress || '0'),
      totalCommunications: parseInt((stats[0] as any).totalCommunications || '0'),
      pendingFollowUps: parseInt((stats[0] as any).pendingFollowUps || '0'),
      recentContactsCount: parseInt((stats[0] as any).recentContactsCount || '0'),
    };

    // Random advocacy quote
    const quotes = [
      "Advocacy is not a job, it's a way of life for parents of children with special needs. - Unknown",
      "Never doubt that a small group of thoughtful, committed citizens can change the world. - Margaret Mead",
      "The only way to do great work is to love what you do. - Steve Jobs",
      "Be the change you wish to see in the world. - Mahatma Gandhi",
      "Your child's needs are unique. Trust your instincts and advocate fiercely.",
    ];

    return {
      children,
      upcomingDeadlines: deadlines as any,
      advocacyAlerts,
      recentActivity: recentActivity as any,
      advocacyQuote: quotes[Math.floor(Math.random() * quotes.length)],
      statistics,
    };
  }

  async getOverview(userId: string, childId: string): Promise<DashboardOverviewResponse> {
    const sequelize = getSequelize();

    // Get child info
    const childResult = await sequelize.query(
      `SELECT id, name, grade, school_name, disabilities 
       FROM child_profiles 
       WHERE id = :childId AND user_id = :userId AND deleted_at IS NULL`,
      {
        replacements: { childId, userId },
        type: QueryTypes.SELECT,
      }
    );

    if (!childResult || childResult.length === 0) {
      throw new AppError('Child not found', 404);
    }

    const child = childResult[0] as any;

    // Get compliance health from materialized view
    const complianceResult = await sequelize.query(
      `SELECT service_delivery_percentage, total_missed_sessions, review_status 
       FROM dashboard_compliance_health 
       WHERE child_id = :childId`,
      {
        replacements: { childId },
        type: QueryTypes.SELECT,
      }
    );

    const complianceHealth = complianceResult.length > 0 ? {
      serviceDeliveryPercentage: parseFloat((complianceResult[0] as any).service_delivery_percentage || '0'),
      totalMissedSessions: parseInt((complianceResult[0] as any).total_missed_sessions || '0'),
      reviewStatus: (complianceResult[0] as any).review_status || 'on_track',
    } : null;

    // Get goal mastery from materialized view
    const goalMasteryResult = await sequelize.query(
      `SELECT mastered_goals, progressing_goals, emerging_goals, not_started_goals, average_progress 
       FROM dashboard_goal_mastery 
       WHERE child_id = :childId`,
      {
        replacements: { childId },
        type: QueryTypes.SELECT,
      }
    );

    const goalMastery = goalMasteryResult.length > 0 ? {
      masteredGoals: parseInt((goalMasteryResult[0] as any).mastered_goals || '0'),
      progressingGoals: parseInt((goalMasteryResult[0] as any).progressing_goals || '0'),
      emergingGoals: parseInt((goalMasteryResult[0] as any).emerging_goals || '0'),
      notStartedGoals: parseInt((goalMasteryResult[0] as any).not_started_goals || '0'),
      averageProgress: parseFloat((goalMasteryResult[0] as any).average_progress || '0'),
    } : null;

    // Get recent documents
    const recentDocuments = await sequelize.query(
      `SELECT id, filename as "fileName", document_type as "documentType", 
              document_date as "uploadDate", processing_status as status 
       FROM iep_documents 
       WHERE child_id = :childId AND deleted_at IS NULL 
       ORDER BY document_date DESC 
       LIMIT 5`,
      {
        replacements: { childId },
        type: QueryTypes.SELECT,
      }
    );

    // Get active goals
    const activeGoals = await sequelize.query(
      `SELECT id, goal_name as "goalName", domain, progress_percentage as "progressPercentage", status 
       FROM goal_progress 
       WHERE child_id = :childId AND status IN ('not_started', 'in_progress') AND deleted_at IS NULL 
       ORDER BY last_updated DESC 
       LIMIT 10`,
      {
        replacements: { childId },
        type: QueryTypes.SELECT,
      }
    );

    return {
      child: {
        id: child.id,
        name: child.name,
        grade: child.grade,
        school: child.school_name,
        disabilities: child.disabilities,
      },
      complianceHealth,
      goalMastery,
      recentDocuments: recentDocuments as any,
      activeGoals: activeGoals as any,
    };
  }
}
