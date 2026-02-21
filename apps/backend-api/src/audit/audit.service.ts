import { Inject, Injectable, Logger } from '@nestjs/common';
import { DB_CONNECTION } from '../db/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { desc, eq, and } from 'drizzle-orm';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Log a change to the audit table.
   */
  async logChange(
    tenantId: string,
    userId: string,
    entityType: string,
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    payload: Record<string, any>,
    tx?: any,
  ) {
    try {
      await (tx || this.db).insert(schema.auditLogs).values({
        tenantId,
        userId: userId || 'system',
        entityType,
        entityId,
        action,
        payload,
      });
    } catch (error) {
      // Fail silent but log error to avoid blocking main transaction
      this.logger.error(
        `Failed to write audit log for ${entityType}:${entityId}`,
        error,
      );
    }
  }

  /**
   * Calculate the difference between two objects.
   * Returns null if no changes found.
   */
  calculateDiff(
    oldObj: Record<string, any>,
    newObj: Record<string, any>,
  ): Record<string, { old: any; new: any }> | null {
    const changes: Record<string, { old: any; new: any }> = {};
    let hasChanges = false;

    // Iterate over new object keys
    for (const key in newObj) {
      if (key === 'updatedAt' || key === 'createdAt') continue;

      const newValRaw = newObj[key];
      const oldValRaw = oldObj[key];

      // Normalized values for comparison
      const newVal = this.normalizeForComparison(key, newValRaw);
      const oldVal = this.normalizeForComparison(key, oldValRaw);

      if (newVal !== oldVal) {
        // Double check for actual Date objects just in case
        if (newValRaw instanceof Date && oldValRaw instanceof Date) {
          if (newValRaw.getTime() === oldValRaw.getTime()) continue;
        }

        // Handle undefined/null equivalence
        if (
          (newVal === undefined || newVal === null || newVal === '') &&
          (oldVal === undefined || oldVal === null || oldVal === '')
        )
          continue;

        changes[key] = { old: oldValRaw, new: newValRaw };
        hasChanges = true;
      }
    }

    return hasChanges ? changes : null;
  }

  /**
   * Normalize values for comparison, especially for Dates
   */
  private normalizeForComparison(key: string, value: any): any {
    if (value === null || value === undefined) return null;

    // Handle date fields
    if (
      key.toLowerCase().endsWith('date') ||
      key.toLowerCase().endsWith('at')
    ) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          // Use YYYY-MM-DD for date-only fields to avoid timezone shifts
          // This matches how dates are usually sent from form inputs
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        // Fallback to original if parsing fails
      }
    }

    return value;
  }

  async getLogs(
    tenantId: string,
    entityType?: string,
    entityId?: string,
    page = 1,
    limit = 50,
  ) {
    // Calculate offset
    const offset = (page - 1) * limit;

    // Safety check: Ensure tenantId is a valid UUID to avoid DB errors
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      console.warn(`[AuditService] Invalid tenantId format: ${tenantId}`);
      return [];
    }

    const filters = [eq(schema.auditLogs.tenantId, tenantId)];

    if (entityType) {
      filters.push(eq(schema.auditLogs.entityType, entityType));
    }
    if (entityId) {
      if (!uuidRegex.test(entityId)) {
        console.warn(`[AuditService] Invalid entityId format: ${entityId}`);
        return [];
      }
      filters.push(eq(schema.auditLogs.entityId, entityId));
    }

    return await this.db
      .select({
        id: schema.auditLogs.id,
        tenantId: schema.auditLogs.tenantId,
        userId: schema.auditLogs.userId,
        entityType: schema.auditLogs.entityType,
        entityId: schema.auditLogs.entityId,
        action: schema.auditLogs.action,
        payload: schema.auditLogs.payload,
        createdAt: schema.auditLogs.createdAt,
        userName: schema.user.name, // Select userName
      })
      .from(schema.auditLogs)
      .leftJoin(schema.user, eq(schema.auditLogs.userId, schema.user.id)) // Join user table
      .where(and(...filters))
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }
}
