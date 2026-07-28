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

  /**
   * Seeds demo data for a tenant.
   */
  async seedDemoData(tenantId: string, seederUserId?: string) {
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

    const userId = seederUserId || 'GF2aowBVMrevKM1dUquT0N6g9MvsLuKm';

    // GUARD: check if categories AND products already exist
    const [existingCats, existingProds] = await Promise.all([
      this.db
        .select({ id: schema.categories.id })
        .from(schema.categories)
        .where(eq(schema.categories.tenantId, tenantId))
        .limit(1),
      this.db
        .select({ id: schema.products.id })
        .from(schema.products)
        .where(eq(schema.products.tenantId, tenantId))
        .limit(1),
    ]);

    if (existingCats.length > 0 || existingProds.length > 0) {
      throw new BadRequestException(
        'Data already exists for this tenant. Cannot seed.',
      );
    }

    const CATEGORY_NAMES = [
      'Beverages',
      'Dairy & Eggs',
      'Snacks & Confectionery',
      'Grains & Staples',
      'Household & Cleaning',
      'Personal Care',
    ];

    const PRODUCT_DEFS = [
      // Beverages
      {
        cat: 'Beverages',
        name: 'Milo Activ-Go 400g',
        sku: 'BEV-001',
        brand: 'Nestlé',
        supplier: 'Nestlé Lanka',
        price: 62000,
        costPrice: 49000,
        wholesalePrice: 54000,
        stock: 48,
        reorderPoint: 10,
        safetyStock: 5,
        uom: 'tin',
        batchNo: 'ML2025A',
        expiryDate: '2026-06-30',
        mfgDate: '2024-06-30',
      },
      {
        cat: 'Beverages',
        name: 'Nescafé Classic 200g',
        sku: 'BEV-002',
        brand: 'Nestlé',
        supplier: 'Nestlé Lanka',
        price: 85000,
        costPrice: 68000,
        wholesalePrice: 74000,
        stock: 35,
        reorderPoint: 8,
        safetyStock: 4,
        uom: 'jar',
        batchNo: 'NC2025B',
        expiryDate: '2026-12-31',
        mfgDate: '2024-12-31',
      },
      {
        cat: 'Beverages',
        name: 'Elephant House Orange Crush 1.5L',
        sku: 'BEV-003',
        brand: 'Elephant House',
        supplier: 'EHB Distributors',
        price: 28000,
        costPrice: 20000,
        wholesalePrice: 23000,
        stock: 72,
        reorderPoint: 20,
        safetyStock: 10,
        uom: 'btl',
        batchNo: 'EHB-OCR',
        expiryDate: '2025-09-15',
        mfgDate: '2025-03-15',
      },
      {
        cat: 'Beverages',
        name: 'Lipton Yellow Label Tea 100 Bags',
        sku: 'BEV-004',
        brand: 'Lipton',
        supplier: 'Unilever Lanka',
        price: 34500,
        costPrice: 27000,
        wholesalePrice: 30000,
        stock: 6,
        reorderPoint: 10,
        safetyStock: 5,
        uom: 'pck',
        batchNo: 'LPT-YL25',
        expiryDate: '2026-03-31',
        mfgDate: '2024-09-30',
      },
      {
        cat: 'Beverages',
        name: 'Coca-Cola 330ml Can',
        sku: 'BEV-005',
        brand: 'Coca-Cola',
        supplier: 'Softbev Lanka',
        price: 12000,
        costPrice: 8500,
        wholesalePrice: 10000,
        stock: 144,
        reorderPoint: 30,
        safetyStock: 12,
        uom: 'can',
        batchNo: 'CCL-CAN25',
        expiryDate: '2025-12-31',
        mfgDate: '2025-01-15',
      },

      // Dairy & Eggs
      {
        cat: 'Dairy & Eggs',
        name: 'Milco Full Cream Milk 1L',
        sku: 'DAI-001',
        brand: 'Milco',
        supplier: 'Milco (Pvt) Ltd',
        price: 32000,
        costPrice: 25500,
        wholesalePrice: 28000,
        stock: 60,
        reorderPoint: 20,
        safetyStock: 10,
        uom: 'pck',
        batchNo: 'MLC-FC1L',
        expiryDate: '2025-08-10',
        mfgDate: '2025-07-10',
      },
      {
        cat: 'Dairy & Eggs',
        name: 'Anchor Butter 250g',
        sku: 'DAI-002',
        brand: 'Anchor',
        supplier: 'Fonterra Brands',
        price: 48500,
        costPrice: 38000,
        wholesalePrice: 42000,
        stock: 28,
        reorderPoint: 8,
        safetyStock: 4,
        uom: 'pck',
        batchNo: 'ANB-250',
        expiryDate: '2025-10-31',
        mfgDate: '2025-04-30',
      },
      {
        cat: 'Dairy & Eggs',
        name: 'Cargills Prima Yoghurt 80g',
        sku: 'DAI-003',
        brand: 'Prima',
        supplier: 'Cargills Foods',
        price: 9500,
        costPrice: 7000,
        wholesalePrice: 8000,
        stock: 4,
        reorderPoint: 12,
        safetyStock: 6,
        uom: 'cup',
        batchNo: 'CRG-YGT',
        expiryDate: '2025-07-25',
        mfgDate: '2025-07-15',
      },
      {
        cat: 'Dairy & Eggs',
        name: 'Farm Fresh Eggs (Tray 30)',
        sku: 'DAI-004',
        brand: 'Farm Fresh',
        supplier: 'Hingurana Farms',
        price: 155000,
        costPrice: 120000,
        wholesalePrice: 135000,
        stock: 20,
        reorderPoint: 5,
        safetyStock: 2,
        uom: 'tray',
        batchNo: 'FF-EGG30',
        expiryDate: '2025-08-05',
        mfgDate: '2025-07-20',
      },
      {
        cat: 'Dairy & Eggs',
        name: 'Kotmale Cheese Slices 200g',
        sku: 'DAI-005',
        brand: 'Kotmale',
        supplier: 'Kotmale Holdings',
        price: 57000,
        costPrice: 44000,
        wholesalePrice: 50000,
        stock: 18,
        reorderPoint: 6,
        safetyStock: 3,
        uom: 'pck',
        batchNo: 'KTM-CS200',
        expiryDate: '2025-09-30',
        mfgDate: '2025-07-01',
      },

      // Snacks & Confectionery
      {
        cat: 'Snacks & Confectionery',
        name: 'Maliban Ginger Biscuit 200g',
        sku: 'SNK-001',
        brand: 'Maliban',
        supplier: 'Maliban Biscuits',
        price: 18500,
        costPrice: 14000,
        wholesalePrice: 16000,
        stock: 85,
        reorderPoint: 20,
        safetyStock: 10,
        uom: 'pck',
        batchNo: 'MLB-GNG',
        expiryDate: '2026-01-31',
        mfgDate: '2025-01-31',
      },
      {
        cat: 'Snacks & Confectionery',
        name: 'Lays Classic Salted 30g',
        sku: 'SNK-002',
        brand: "Lay's",
        supplier: 'PepsiCo Lanka',
        price: 8500,
        costPrice: 6000,
        wholesalePrice: 7000,
        stock: 120,
        reorderPoint: 30,
        safetyStock: 15,
        uom: 'pck',
        batchNo: 'LAYS-CLS',
        expiryDate: '2025-09-30',
        mfgDate: '2025-04-30',
      },
      {
        cat: 'Snacks & Confectionery',
        name: 'Kandos Dark Chocolate 50g',
        sku: 'SNK-003',
        brand: 'Kandos',
        supplier: 'Ceylon Chocolates',
        price: 14500,
        costPrice: 10500,
        wholesalePrice: 12000,
        stock: 50,
        reorderPoint: 15,
        safetyStock: 8,
        uom: 'bar',
        batchNo: 'KND-DK50',
        expiryDate: '2026-03-31',
        mfgDate: '2025-03-31',
      },
      {
        cat: 'Snacks & Confectionery',
        name: 'Super Cream Cracker 200g',
        sku: 'SNK-004',
        brand: 'Super',
        supplier: 'Lanka Soy',
        price: 16000,
        costPrice: 12000,
        wholesalePrice: 14000,
        stock: 7,
        reorderPoint: 15,
        safetyStock: 8,
        uom: 'pck',
        batchNo: 'SUP-CC200',
        expiryDate: '2025-11-30',
        mfgDate: '2025-05-31',
      },
      {
        cat: 'Snacks & Confectionery',
        name: 'Pringles Original 165g',
        sku: 'SNK-005',
        brand: 'Pringles',
        supplier: 'Global Imports',
        price: 72000,
        costPrice: 55000,
        wholesalePrice: 62000,
        stock: 30,
        reorderPoint: 10,
        safetyStock: 5,
        uom: 'can',
        batchNo: 'PRG-ORG',
        expiryDate: '2026-02-28',
        mfgDate: '2025-02-28',
      },

      // Grains & Staples
      {
        cat: 'Grains & Staples',
        name: 'Keeri Samba Rice 5kg',
        sku: 'GRN-001',
        brand: 'No Brand',
        supplier: 'Karunasena Millers',
        price: 115000,
        costPrice: 90000,
        wholesalePrice: 100000,
        stock: 40,
        reorderPoint: 10,
        safetyStock: 5,
        uom: 'bag',
        batchNo: 'KS-RCE5',
        expiryDate: '2026-07-01',
        mfgDate: '2025-07-01',
      },
      {
        cat: 'Grains & Staples',
        name: 'Munchee Marie 400g',
        sku: 'GRN-002',
        brand: 'Munchee',
        supplier: 'Ceylon Biscuits',
        price: 19500,
        costPrice: 15000,
        wholesalePrice: 17000,
        stock: 65,
        reorderPoint: 20,
        safetyStock: 10,
        uom: 'pck',
        batchNo: 'MCH-MR400',
        expiryDate: '2026-02-28',
        mfgDate: '2025-08-31',
      },
      {
        cat: 'Grains & Staples',
        name: 'Prima Kurakkan Flour 1kg',
        sku: 'GRN-003',
        brand: 'Prima',
        supplier: 'Prima Ceylon',
        price: 24000,
        costPrice: 19000,
        wholesalePrice: 21000,
        stock: 55,
        reorderPoint: 15,
        safetyStock: 8,
        uom: 'pck',
        batchNo: 'PRM-KRK1',
        expiryDate: '2025-12-31',
        mfgDate: '2025-06-30',
      },
      {
        cat: 'Grains & Staples',
        name: 'Dhal (Red Lentils) 1kg',
        sku: 'GRN-004',
        brand: 'No Brand',
        supplier: 'Cargills Trade',
        price: 38000,
        costPrice: 30000,
        wholesalePrice: 33000,
        stock: 30,
        reorderPoint: 10,
        safetyStock: 5,
        uom: 'pck',
        batchNo: 'DHAL-1KG',
        expiryDate: '2026-06-30',
        mfgDate: '2025-06-30',
      },
      {
        cat: 'Grains & Staples',
        name: 'Sunflower Oil 1L',
        sku: 'GRN-005',
        brand: 'Sunflower',
        supplier: 'Lanka Oleo',
        price: 68000,
        costPrice: 54000,
        wholesalePrice: 60000,
        stock: 5,
        reorderPoint: 10,
        safetyStock: 5,
        uom: 'btl',
        batchNo: 'SFO-1L25',
        expiryDate: '2026-04-30',
        mfgDate: '2025-04-30',
      },

      // Household & Cleaning
      {
        cat: 'Household & Cleaning',
        name: 'Surf Excel 1kg',
        sku: 'HHD-001',
        brand: 'Surf Excel',
        supplier: 'Unilever Lanka',
        price: 52000,
        costPrice: 40000,
        wholesalePrice: 45000,
        stock: 38,
        reorderPoint: 12,
        safetyStock: 6,
        uom: 'pck',
        batchNo: 'SRF-1KG',
        expiryDate: '2027-01-01',
        mfgDate: '2025-01-01',
      },
      {
        cat: 'Household & Cleaning',
        name: 'Vim Dishwash Liquid 750ml',
        sku: 'HHD-002',
        brand: 'Vim',
        supplier: 'Unilever Lanka',
        price: 38500,
        costPrice: 29000,
        wholesalePrice: 33000,
        stock: 45,
        reorderPoint: 12,
        safetyStock: 6,
        uom: 'btl',
        batchNo: 'VIM-750',
        expiryDate: '2027-06-30',
        mfgDate: '2025-06-30',
      },
      {
        cat: 'Household & Cleaning',
        name: 'Harpic Power Plus 500ml',
        sku: 'HHD-003',
        brand: 'Harpic',
        supplier: 'Reckitt Lanka',
        price: 47000,
        costPrice: 36000,
        wholesalePrice: 41000,
        stock: 22,
        reorderPoint: 8,
        safetyStock: 4,
        uom: 'btl',
        batchNo: 'HRP-500',
        expiryDate: '2027-03-31',
        mfgDate: '2025-03-31',
      },
      {
        cat: 'Household & Cleaning',
        name: 'Baygon Mosquito Coil (10pk)',
        sku: 'HHD-004',
        brand: 'Baygon',
        supplier: 'SC Johnson',
        price: 24000,
        costPrice: 18000,
        wholesalePrice: 21000,
        stock: 3,
        reorderPoint: 10,
        safetyStock: 5,
        uom: 'pck',
        batchNo: 'BGN-COIL',
        expiryDate: '2026-12-31',
        mfgDate: '2025-12-31',
      },
      {
        cat: 'Household & Cleaning',
        name: 'Freshkleen Floor Cleaner 1L',
        sku: 'HHD-005',
        brand: 'Freshkleen',
        supplier: 'Lanka Chemicals',
        price: 29000,
        costPrice: 21000,
        wholesalePrice: 25000,
        stock: 17,
        reorderPoint: 8,
        safetyStock: 4,
        uom: 'btl',
        batchNo: 'FKL-FL1L',
        expiryDate: '2027-01-01',
        mfgDate: '2025-01-01',
      },

      // Personal Care
      {
        cat: 'Personal Care',
        name: 'Dove Body Wash 250ml',
        sku: 'PRC-001',
        brand: 'Dove',
        supplier: 'Unilever Lanka',
        price: 59000,
        costPrice: 46000,
        wholesalePrice: 52000,
        stock: 26,
        reorderPoint: 8,
        safetyStock: 4,
        uom: 'btl',
        batchNo: 'DVE-BW250',
        expiryDate: '2027-06-30',
        mfgDate: '2025-06-30',
      },
      {
        cat: 'Personal Care',
        name: 'Colgate MaxFresh Toothpaste 150g',
        sku: 'PRC-002',
        brand: 'Colgate',
        supplier: 'Colgate Palmolive',
        price: 33500,
        costPrice: 26000,
        wholesalePrice: 29000,
        stock: 52,
        reorderPoint: 15,
        safetyStock: 8,
        uom: 'tube',
        batchNo: 'CLG-MF150',
        expiryDate: '2027-01-31',
        mfgDate: '2025-01-31',
      },
      {
        cat: 'Personal Care',
        name: 'Head & Shoulders Classic 200ml',
        sku: 'PRC-003',
        brand: 'Head & Shoulders',
        supplier: 'P&G Lanka',
        price: 67000,
        costPrice: 52000,
        wholesalePrice: 58000,
        stock: 20,
        reorderPoint: 8,
        safetyStock: 4,
        uom: 'btl',
        batchNo: 'HNS-CLS200',
        expiryDate: '2027-03-31',
        mfgDate: '2025-03-31',
      },
      {
        cat: 'Personal Care',
        name: 'Dettol Antiseptic 100ml',
        sku: 'PRC-004',
        brand: 'Dettol',
        supplier: 'Reckitt Lanka',
        price: 28500,
        costPrice: 21000,
        wholesalePrice: 24000,
        stock: 8,
        reorderPoint: 10,
        safetyStock: 5,
        uom: 'btl',
        batchNo: 'DTL-100',
        expiryDate: '2027-06-30',
        mfgDate: '2025-06-30',
      },
      {
        cat: 'Personal Care',
        name: 'Pears Transparent Soap 75g',
        sku: 'PRC-005',
        brand: 'Pears',
        supplier: 'Unilever Lanka',
        price: 18000,
        costPrice: 13000,
        wholesalePrice: 15500,
        stock: 60,
        reorderPoint: 20,
        safetyStock: 10,
        uom: 'bar',
        batchNo: 'PRS-75G',
        expiryDate: '2027-12-31',
        mfgDate: '2025-12-31',
      },
    ];

    const PAYMENT_METHODS = ['CASH', 'CARD', 'BANK_TRANSFER'] as const;
    const ORDER_STATUSES = [
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'COMPLETED',
      'REFUNDED',
      'CANCELLED',
    ] as const;

    const daysAgo = (n: number): Date => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      d.setHours(
        Math.floor(Math.random() * 14) + 8,
        Math.floor(Math.random() * 60),
        0,
        0,
      );
      return d;
    };

    const pick = <T>(arr: readonly T[]): T =>
      arr[Math.floor(Math.random() * arr.length)];
    const randInt = (min: number, max: number): number =>
      Math.floor(Math.random() * (max - min + 1)) + min;
    const padOrder = (n: number): string => `ORD-${String(n).padStart(5, '0')}`;

    return await this.db.transaction(async (tx) => {
      // 1. Insert categories
      const insertedCategories = await tx
        .insert(schema.categories)
        .values(CATEGORY_NAMES.map((name) => ({ tenantId, name })))
        .returning();

      const catMap: Record<string, string> = {};
      for (const cat of insertedCategories) {
        catMap[cat.name] = cat.id;
      }

      // 2. Insert products
      const insertedProducts = await tx
        .insert(schema.products)
        .values(
          PRODUCT_DEFS.map((p) => ({
            tenantId,
            name: p.name,
            sku: p.sku,
            price: p.price,
            costPrice: p.costPrice,
            wholesalePrice: p.wholesalePrice,
            taxRate: 0,
            stock: p.stock,
            uom: p.uom,
            reorderPoint: p.reorderPoint,
            safetyStock: p.safetyStock,
            brand: p.brand,
            supplier: p.supplier,
            batchNo: p.batchNo,
            expiryDate: p.expiryDate,
            mfgDate: p.mfgDate,
            isActive: true,
            categoryId: catMap[p.cat],
          })),
        )
        .returning();

      // 3. Purchase inventory movements
      const purchaseMovements = insertedProducts.map((p) => ({
        tenantId,
        productId: p.id,
        type: 'PURCHASE' as const,
        quantity: p.stock as number,
        costPrice: p.costPrice as number,
        remarks: 'Initial stock receipt',
        createdAt: daysAgo(28),
      }));
      await tx.insert(schema.inventoryMovements).values(purchaseMovements);

      // 4. Stock adjustments
      const adjProd1 = insertedProducts[2];
      const adjProd2 = insertedProducts[7];
      await tx.insert(schema.inventoryMovements).values([
        {
          tenantId,
          productId: adjProd1.id,
          type: 'ADJUSTMENT' as const,
          quantity: -3,
          reason: 'DAMAGED' as const,
          remarks: 'Cracked bottles found on shelf',
          userId: userId,
          createdAt: daysAgo(18),
        },
        {
          tenantId,
          productId: adjProd2.id,
          type: 'ADJUSTMENT' as const,
          quantity: -2,
          reason: 'EXPIRED' as const,
          remarks: 'Expired yoghurt removed from cold storage',
          userId: userId,
          createdAt: daysAgo(10),
        },
      ]);

      // 5. Audit logs
      const createAuditLogs = insertedProducts.map((p, i) => ({
        tenantId,
        userId: userId,
        entityType: 'PRODUCT',
        entityId: p.id,
        action: 'CREATE',
        payload: { name: p.name, sku: p.sku, price: p.price },
        createdAt: daysAgo(30 - i),
      }));
      await tx.insert(schema.auditLogs).values(createAuditLogs);

      await tx.insert(schema.auditLogs).values([
        {
          tenantId,
          userId: userId,
          entityType: 'PRODUCT',
          entityId: insertedProducts[0].id,
          action: 'UPDATE',
          payload: {
            field: 'price',
            from: 60000,
            to: 62000,
            reason: 'Supplier price revision',
          },
          createdAt: daysAgo(8),
        },
        {
          tenantId,
          userId: userId,
          entityType: 'PRODUCT',
          entityId: insertedProducts[10].id,
          action: 'UPDATE',
          payload: {
            field: 'stock',
            from: 95,
            to: 85,
            reason: 'Stock count correction',
          },
          createdAt: daysAgo(4),
        },
      ]);

      // 6. Orders + Items + Movements
      const orderSchedule: number[] = [];
      for (let day = 30; day >= 1; day--) {
        const count =
          day > 20 ? randInt(1, 2) : day > 10 ? randInt(2, 3) : randInt(3, 5);
        for (let i = 0; i < count; i++) orderSchedule.push(day);
      }

      let orderCounter = 1;

      for (const dayAgoVal of orderSchedule) {
        const statusChoice = pick(ORDER_STATUSES);
        const paymentMethod = pick(PAYMENT_METHODS);
        const orderCreatedAt = daysAgo(dayAgoVal);

        const itemCount = randInt(2, 5);
        const shuffled = [...insertedProducts]
          .sort(() => Math.random() - 0.5)
          .slice(0, itemCount);

        let subtotal = 0;
        const lineItems: Array<{
          productId: string;
          productName: string;
          quantity: number;
          unitPrice: number;
          costPrice: number;
          subtotal: number;
        }> = [];

        for (const prod of shuffled) {
          const qty = randInt(1, 4);
          const unitPrice = prod.price;
          const lineSubtotal = qty * unitPrice;
          subtotal += lineSubtotal;
          lineItems.push({
            productId: prod.id,
            productName: prod.name,
            quantity: qty,
            unitPrice,
            costPrice: prod.costPrice as number,
            subtotal: lineSubtotal,
          });
        }

        const grandTotal = subtotal;
        const orderNumber = padOrder(orderCounter++);

        const [order] = await tx
          .insert(schema.orders)
          .values({
            tenantId,
            orderNumber,
            subtotal,
            taxTotal: 0,
            discountTotal: 0,
            grandTotal,
            paymentMethod,
            status: statusChoice,
            createdAt: orderCreatedAt,
          })
          .returning();

        await tx.insert(schema.orderItems).values(
          lineItems.map((li) => ({
            tenantId,
            orderId: order.id,
            productId: li.productId,
            productName: li.productName,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            subtotal: li.subtotal,
            discountAmount: 0,
            discountType: 'MANUAL',
          })),
        );

        if (statusChoice === 'COMPLETED') {
          await tx.insert(schema.inventoryMovements).values(
            lineItems.map((li) => ({
              tenantId,
              productId: li.productId,
              type: 'SALE' as const,
              quantity: -li.quantity,
              costPrice: li.costPrice,
              referenceId: order.id,
              remarks: `POS sale — ${order.orderNumber}`,
              createdAt: orderCreatedAt,
            })),
          );
        } else if (statusChoice === 'REFUNDED') {
          await tx.insert(schema.inventoryMovements).values(
            lineItems.map((li) => ({
              tenantId,
              productId: li.productId,
              type: 'RETURN' as const,
              quantity: li.quantity,
              costPrice: li.costPrice,
              referenceId: order.id,
              remarks: `Customer return — ${order.orderNumber}`,
              createdAt: orderCreatedAt,
            })),
          );
        }
      }

      return {
        categories: insertedCategories.length,
        products: insertedProducts.length,
        orders: orderSchedule.length,
      };
    });
  }

  /**
   * Safely wipes clean all transactional and catalog data for a tenant
   * while keeping user data (Better-Auth user, cashier users) and tenant metadata intact.
   */
  async wipeTenant(tenantId: string) {
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

    // Delete transactional and catalog data in a transaction to satisfy FK dependencies
    await this.db.transaction(async (tx) => {
      // 1. Delete audit logs
      await tx
        .delete(schema.auditLogs)
        .where(eq(schema.auditLogs.tenantId, tenantId));

      // 2. Delete inventory movements
      await tx
        .delete(schema.inventoryMovements)
        .where(eq(schema.inventoryMovements.tenantId, tenantId));

      // 3. Delete order items
      await tx
        .delete(schema.orderItems)
        .where(eq(schema.orderItems.tenantId, tenantId));

      // 4. Delete orders
      await tx
        .delete(schema.orders)
        .where(eq(schema.orders.tenantId, tenantId));

      // 5. Delete products
      await tx
        .delete(schema.products)
        .where(eq(schema.products.tenantId, tenantId));

      // 6. Delete categories
      await tx
        .delete(schema.categories)
        .where(eq(schema.categories.tenantId, tenantId));
    });

    return {
      success: true,
      message: `Tenant ${tenantId} transactional and catalog data wiped successfully. User and tenant records preserved.`,
    };
  }

  /**
   * Safely deletes a tenant and all its associated business and auth data.
   */
  async deleteTenant(tenantId: string) {
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

    // Delete everything in a transaction to satisfy FK dependencies
    await this.db.transaction(async (tx) => {
      // 1. Delete audit logs
      await tx
        .delete(schema.auditLogs)
        .where(eq(schema.auditLogs.tenantId, tenantId));

      // 2. Delete inventory movements
      await tx
        .delete(schema.inventoryMovements)
        .where(eq(schema.inventoryMovements.tenantId, tenantId));

      // 3. Delete order items
      await tx
        .delete(schema.orderItems)
        .where(eq(schema.orderItems.tenantId, tenantId));

      // 4. Delete orders
      await tx
        .delete(schema.orders)
        .where(eq(schema.orders.tenantId, tenantId));

      // 5. Delete products
      await tx
        .delete(schema.products)
        .where(eq(schema.products.tenantId, tenantId));

      // 6. Delete categories
      await tx
        .delete(schema.categories)
        .where(eq(schema.categories.tenantId, tenantId));

      // 7. Delete cashier users
      await tx.delete(schema.users).where(eq(schema.users.tenantId, tenantId));

      // 8. Delete Better-Auth users (linked session & account automatically cascade delete at db level)
      await tx.delete(schema.user).where(eq(schema.user.tenantId, tenantId));

      // 9. Delete tenant config itself
      await tx.delete(schema.tenants).where(eq(schema.tenants.id, tenantId));
    });

    return {
      success: true,
      message: `Tenant ${tenantId} and all associated data deleted successfully.`,
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
