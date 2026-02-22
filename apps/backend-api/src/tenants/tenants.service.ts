import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DB_CONNECTION } from '../db/database.module';
import * as schema from '../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { auth } from '../auth/auth.config';
import { ShopConfigDto, ProvisionTenantDto } from './dto/shop-config.dto';

@Injectable()
export class TenantsService {
  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Provision a new tenant for a user.
   * Creates the tenant, assigns it to the user, and seeds default data.
   */
  async provision(userId: string, dto: ProvisionTenantDto) {
    // 1. Check if user already has a tenant
    const [existingUser] = await this.db
      .select({ tenantId: schema.user.tenantId })
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .limit(1);

    if (existingUser?.tenantId) {
      throw new BadRequestException('User already has a tenant assigned.');
    }

    // 2. Generate slug from business name
    const slug = this.generateSlug(dto.name);

    // 3. Check slug uniqueness
    const existingTenant = await this.db
      .select({ id: schema.tenants.id })
      .from(schema.tenants)
      .where(eq(schema.tenants.slug, slug))
      .limit(1);

    if (existingTenant.length > 0) {
      throw new BadRequestException(
        `Business name "${dto.name}" is already taken. Please choose a different name.`,
      );
    }

    // 4. Build shop config (sync with desktop-pos ShopConfig interface)
    const shopConfig = {
      name: dto.name,
      addressLine1: dto.addressLine1 || '',
      addressLine2: dto.addressLine2 || '',
      phone1: dto.phone1 || '',
      phone2: dto.phone2 || '',
      email: dto.email || '',
    };

    // 5. Create tenant, assign to user, and seed sequence in a transaction
    const tenant = await this.db.transaction(async (tx) => {
      const [newTenant] = await tx
        .insert(schema.tenants)
        .values({
          name: dto.name,
          slug,
          config: JSON.stringify(shopConfig),
        })
        .returning();

      // 6. Assign tenant to user
      // We update the user table directly since Better-Auth doesn't have tenant management
      await tx
        .update(schema.user)
        .set({ tenantId: newTenant.id })
        .where(eq(schema.user.id, userId));

      // 7. Seed SKU sequence for this tenant (if not exists)
      // Note: Ideally, the skuSequence table should be tenant-scoped
      const existingSeq = await tx
        .select()
        .from(schema.skuSequence)
        .where(eq(schema.skuSequence.id, 1))
        .limit(1);

      if (existingSeq.length === 0) {
        await tx.insert(schema.skuSequence).values({
          id: 1,
          currentValue: 0,
        });
      }

      return newTenant;
    });

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        config: shopConfig,
      },
    };
  }

  /**
   * Get the current user's tenant info.
   */
  async getMyTenant(tenantId: string) {
    if (!tenantId) {
      return { tenant: null };
    }

    const [tenant] = await this.db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return { tenant: null };
    }

    // Parse config JSON
    let config = null;
    try {
      config = tenant.config ? JSON.parse(tenant.config) : null;
    } catch {
      config = null;
    }

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        isActive: tenant.isActive,
        config,
      },
    };
  }

  /**
   * Update the tenant's config (ShopConfig).
   * Used by both web-admin settings page and desktop-pos push.
   */
  async updateConfig(tenantId: string, config: ShopConfigDto) {
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required.');
    }

    // Verify tenant exists
    const [tenant] = await this.db
      .select({ id: schema.tenants.id })
      .from(schema.tenants)
      .where(eq(schema.tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      throw new NotFoundException('Tenant not found.');
    }

    // Build the full ShopConfig
    const shopConfig = {
      name: config.name,
      addressLine1: config.addressLine1 || '',
      addressLine2: config.addressLine2 || '',
      phone1: config.phone1 || '',
      phone2: config.phone2 || '',
      email: config.email || '',
    };

    // Update tenant name + config
    await this.db
      .update(schema.tenants)
      .set({
        name: config.name,
        config: JSON.stringify(shopConfig),
        updatedAt: new Date(),
      })
      .where(eq(schema.tenants.id, tenantId));

    return {
      tenant: {
        id: tenantId,
        config: shopConfig,
      },
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }
}
