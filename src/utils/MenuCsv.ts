import { and, asc, eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import {
  menuCategorySchema,
  menuItemSchema,
} from '@/models/Schema';

export const MENU_CSV_MAX_FILE_SIZE = 512 * 1024;

export const MENU_CSV_COLUMNS = [
  'row_type',
  'category_id',
  'category_name',
  'category_name_en',
  'category_name_fr',
  'category_name_ar',
  'subcategory_id',
  'subcategory_name',
  'subcategory_name_en',
  'subcategory_name_fr',
  'subcategory_name_ar',
  'item_id',
  'item_name',
  'item_name_en',
  'item_name_fr',
  'item_name_ar',
  'description',
  'description_en',
  'description_fr',
  'description_ar',
  'price_usd',
  'price_local',
  'original_price_usd',
  'original_price_local',
  'available',
  'popular',
  'new',
  'spicy',
  'featured',
  'promo',
] as const;

type MenuCsvColumn = typeof MENU_CSV_COLUMNS[number];
type MenuCsvRow = Record<MenuCsvColumn, string>;

export type MenuCsvImportSummary = {
  categoriesCreated: number;
  categoriesUpdated: number;
  errors: string[];
  itemsCreated: number;
  itemsUpdated: number;
  skipped: number;
};

const emptySummary = (): MenuCsvImportSummary => ({
  categoriesCreated: 0,
  categoriesUpdated: 0,
  errors: [],
  itemsCreated: 0,
  itemsUpdated: 0,
  skipped: 0,
});

const normalizeCell = (value: string | undefined) => value?.trim() ?? '';

const normalizeKey = (value: string | null | undefined) => {
  return (value ?? '').trim().toLowerCase();
};

const normalizeNullableText = (value: string) => {
  const text = value.trim();

  return text.length > 0 ? text : null;
};

const getPrimaryText = (...values: (string | null | undefined)[]) => {
  return values.find(value => value && value.trim().length > 0)?.trim() ?? '';
};

const escapeCsvValue = (value: string | number | boolean | null) => {
  if (value === null) {
    return '';
  }

  const textValue = String(value);

  if (/[",\n\r]/.test(textValue)) {
    return `"${textValue.replaceAll('"', '""')}"`;
  }

  return textValue;
};

const parseCsv = (input: string) => {
  const rows: string[][] = [];
  let cell = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const nextCharacter = input[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((character === '\n' || character === '\r') && !inQuotes) {
      if (character === '\r' && nextCharacter === '\n') {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += character;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter(csvRow => csvRow.some(value => value.trim().length > 0));
};

const parseMenuCsvRows = (input: string) => {
  const parsedRows = parseCsv(input);
  const header = parsedRows.at(0)?.map(value => value.trim().toLowerCase());

  if (!header) {
    return {
      errors: ['CSV file is empty.'],
      rows: [],
    };
  }

  const missingColumns = MENU_CSV_COLUMNS.filter(column => !header.includes(column));

  if (missingColumns.length > 0) {
    return {
      errors: [`Missing required columns: ${missingColumns.join(', ')}`],
      rows: [],
    };
  }

  const rows = parsedRows.slice(1).map((csvRow) => {
    return MENU_CSV_COLUMNS.reduce((record, column) => {
      const columnIndex = header.indexOf(column);

      return {
        ...record,
        [column]: normalizeCell(csvRow[columnIndex]),
      };
    }, {} as MenuCsvRow);
  });

  return { errors: [], rows };
};

const parseOptionalInteger = (value: string) => {
  if (!value.trim()) {
    return {
      invalid: false,
      value: null,
    };
  }

  const parsedValue = Number.parseInt(value.trim(), 10);

  return {
    invalid: Number.isNaN(parsedValue) || parsedValue < 0,
    value: Number.isNaN(parsedValue) || parsedValue < 0 ? null : parsedValue,
  };
};

const parseOptionalUsdCents = (value: string) => {
  if (!value.trim()) {
    return {
      invalid: false,
      value: null,
    };
  }

  const normalizedValue = value.trim().replace(/^\$/, '');
  const parsedValue = Number.parseFloat(normalizedValue);

  return {
    invalid: Number.isNaN(parsedValue) || parsedValue < 0,
    value: Number.isNaN(parsedValue) || parsedValue < 0
      ? null
      : Math.round(parsedValue * 100),
  };
};

const parseBoolean = (value: string, fallback: boolean) => {
  const normalizedValue = value.trim().toLowerCase();

  if (['1', 'true', 'yes', 'y', 'on'].includes(normalizedValue)) {
    return true;
  }

  if (['0', 'false', 'no', 'n', 'off'].includes(normalizedValue)) {
    return false;
  }

  return fallback;
};

const getCategoryMatchKey = (
  name: string,
  parentCategoryId: number | null,
) => `${parentCategoryId ?? 'root'}:${normalizeKey(name)}`;

const getItemMatchKey = (name: string, categoryId: number) => {
  return `${categoryId}:${normalizeKey(name)}`;
};

const getCategoryNameFromRow = (
  row: MenuCsvRow,
  prefix: 'category' | 'subcategory',
) => {
  return getPrimaryText(
    row[`${prefix}_name_en`],
    row[`${prefix}_name_fr`],
    row[`${prefix}_name_ar`],
    row[`${prefix}_name`],
  );
};

const getItemNameFromRow = (row: MenuCsvRow) => {
  return getPrimaryText(
    row.item_name_en,
    row.item_name_fr,
    row.item_name_ar,
    row.item_name,
  );
};

const createCsvResponse = (fileName: string, rows: string[][]) => {
  const csv = `${rows
    .map(row => row.map(value => escapeCsvValue(value)).join(','))
    .join('\n')}\n`;

  return new Response(csv, {
    headers: {
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Type': 'text/csv; charset=utf-8',
    },
  });
};

export const validateMenuCsvFile = (file: FormDataEntryValue | null) => {
  if (!(file instanceof File) || file.size === 0) {
    return 'missing_file';
  }

  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();
  const allowedTypes = new Set([
    '',
    'application/csv',
    'application/vnd.ms-excel',
    'text/csv',
    'text/plain',
  ]);

  if (!fileName.endsWith('.csv') || !allowedTypes.has(fileType)) {
    return 'invalid_file';
  }

  if (file.size > MENU_CSV_MAX_FILE_SIZE) {
    return 'file_too_large';
  }

  return null;
};

export const createMenuCsvSampleDownload = () => {
  return createCsvResponse('wasl-menu-sample.csv', [
    [...MENU_CSV_COLUMNS],
    [
      'category',
      '',
      'Breakfast',
      'Breakfast',
      'Petit dejeuner',
      'الفطور',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'true',
      'false',
      'false',
      'false',
      'true',
      'false',
    ],
    [
      'item',
      '',
      'Breakfast',
      'Breakfast',
      'Petit dejeuner',
      'الفطور',
      '',
      '',
      '',
      '',
      '',
      '',
      'Labneh toast',
      'Labneh toast',
      'Toast labneh',
      'توست لبنة',
      'Labneh, zaatar, cucumber',
      'Labneh, zaatar, cucumber',
      'Labneh, zaatar, concombre',
      'لبنة، زعتر، خيار',
      '5.50',
      '500000',
      '',
      '',
      'true',
      'true',
      'false',
      'false',
      'true',
      'false',
    ],
  ]);
};

export const createMenuCsvExport = async (organizationId: string) => {
  const [categories, items] = await Promise.all([
    db
      .select()
      .from(menuCategorySchema)
      .where(eq(menuCategorySchema.organizationId, organizationId))
      .orderBy(
        asc(menuCategorySchema.displayOrder),
        asc(menuCategorySchema.name),
      ),
    db
      .select()
      .from(menuItemSchema)
      .where(eq(menuItemSchema.organizationId, organizationId))
      .orderBy(asc(menuItemSchema.name)),
  ]);
  const categoryById = new Map(categories.map(category => [category.id, category]));
  const rows: string[][] = [[...MENU_CSV_COLUMNS]];

  for (const category of categories) {
    const parentCategory = category.parentCategoryId
      ? categoryById.get(category.parentCategoryId)
      : null;

    rows.push([
      category.parentCategoryId ? 'subcategory' : 'category',
      parentCategory ? String(parentCategory.id) : String(category.id),
      parentCategory?.name ?? category.name,
      parentCategory?.nameEn ?? category.nameEn ?? '',
      parentCategory?.nameFr ?? category.nameFr ?? '',
      parentCategory?.nameAr ?? category.nameAr ?? '',
      category.parentCategoryId ? String(category.id) : '',
      category.parentCategoryId ? category.name : '',
      category.parentCategoryId ? category.nameEn ?? '' : '',
      category.parentCategoryId ? category.nameFr ?? '' : '',
      category.parentCategoryId ? category.nameAr ?? '' : '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ]);
  }

  for (const item of items) {
    const category = categoryById.get(item.categoryId);
    const parentCategory = category?.parentCategoryId
      ? categoryById.get(category.parentCategoryId)
      : null;
    const rootCategory = parentCategory ?? category;
    const subcategory = parentCategory ? category : null;

    rows.push([
      'item',
      rootCategory ? String(rootCategory.id) : '',
      rootCategory?.name ?? '',
      rootCategory?.nameEn ?? '',
      rootCategory?.nameFr ?? '',
      rootCategory?.nameAr ?? '',
      subcategory ? String(subcategory.id) : '',
      subcategory?.name ?? '',
      subcategory?.nameEn ?? '',
      subcategory?.nameFr ?? '',
      subcategory?.nameAr ?? '',
      String(item.id),
      item.name,
      item.nameEn ?? '',
      item.nameFr ?? '',
      item.nameAr ?? '',
      item.description ?? '',
      item.descriptionEn ?? '',
      item.descriptionFr ?? '',
      item.descriptionAr ?? '',
      item.priceUsdCents === null ? '' : (item.priceUsdCents / 100).toFixed(2),
      item.priceLbp === null ? '' : String(item.priceLbp),
      item.originalPriceUsdCents === null
        ? ''
        : (item.originalPriceUsdCents / 100).toFixed(2),
      item.originalPriceLbp === null ? '' : String(item.originalPriceLbp),
      String(item.isAvailable),
      String(item.isPopular),
      String(item.isNew),
      String(item.isSpicy),
      String(item.isFeatured),
      String(item.isPromo),
    ]);
  }

  return createCsvResponse(`wasl-menu-${organizationId}.csv`, rows);
};

export const importMenuCsv = async (
  organizationId: string,
  csvText: string,
) => {
  const summary = emptySummary();
  const parsedCsv = parseMenuCsvRows(csvText);

  if (parsedCsv.errors.length > 0) {
    return {
      ...summary,
      errors: parsedCsv.errors,
    };
  }

  const [categories, items] = await Promise.all([
    db
      .select()
      .from(menuCategorySchema)
      .where(eq(menuCategorySchema.organizationId, organizationId)),
    db
      .select()
      .from(menuItemSchema)
      .where(eq(menuItemSchema.organizationId, organizationId)),
  ]);
  const categoriesById = new Map(categories.map(category => [category.id, category]));
  const categoriesByName = new Map(
    categories.map(category => [
      getCategoryMatchKey(category.name, category.parentCategoryId),
      category,
    ]),
  );
  const itemsById = new Map(items.map(item => [item.id, item]));
  const itemsByName = new Map(
    items.map(item => [getItemMatchKey(item.name, item.categoryId), item]),
  );

  const ensureCategory = async (
    row: MenuCsvRow,
    prefix: 'category' | 'subcategory',
    parentCategoryId: number | null,
  ) => {
    const name = getCategoryNameFromRow(row, prefix);

    if (!name) {
      return null;
    }

    const idValue = parseOptionalInteger(row[`${prefix}_id`]);
    const existingById = idValue.value ? categoriesById.get(idValue.value) : null;
    const existingCategory = existingById
      && existingById.organizationId === organizationId
      ? existingById
      : categoriesByName.get(getCategoryMatchKey(name, parentCategoryId));
    const values = {
      name,
      nameEn: normalizeNullableText(row[`${prefix}_name_en`]),
      nameFr: normalizeNullableText(row[`${prefix}_name_fr`]),
      nameAr: normalizeNullableText(row[`${prefix}_name_ar`]),
      parentCategoryId,
    };

    if (existingCategory) {
      const [updatedCategory] = await db
        .update(menuCategorySchema)
        .set(values)
        .where(and(
          eq(menuCategorySchema.id, existingCategory.id),
          eq(menuCategorySchema.organizationId, organizationId),
        ))
        .returning();

      if (updatedCategory) {
        categoriesById.set(updatedCategory.id, updatedCategory);
        categoriesByName.set(
          getCategoryMatchKey(updatedCategory.name, updatedCategory.parentCategoryId),
          updatedCategory,
        );
        summary.categoriesUpdated += 1;
      }

      return updatedCategory ?? existingCategory;
    }

    const [createdCategory] = await db
      .insert(menuCategorySchema)
      .values({
        ...values,
        organizationId,
      })
      .returning();

    if (createdCategory) {
      categoriesById.set(createdCategory.id, createdCategory);
      categoriesByName.set(
        getCategoryMatchKey(createdCategory.name, createdCategory.parentCategoryId),
        createdCategory,
      );
      summary.categoriesCreated += 1;
    }

    return createdCategory ?? null;
  };

  const ensureRowCategory = async (row: MenuCsvRow) => {
    const category = await ensureCategory(row, 'category', null);

    if (!category) {
      return null;
    }

    const subcategoryName = getCategoryNameFromRow(row, 'subcategory');

    if (!subcategoryName) {
      return category;
    }

    return ensureCategory(row, 'subcategory', category.id);
  };

  for (const [index, row] of parsedCsv.rows.entries()) {
    const rowNumber = index + 2;
    const rowType = row.row_type.trim().toLowerCase() || 'item';

    if (!['category', 'subcategory', 'item'].includes(rowType)) {
      summary.skipped += 1;
      summary.errors.push(`Row ${rowNumber}: row_type must be category, subcategory, or item.`);
      continue;
    }

    const category = await ensureRowCategory(row);

    if (!category) {
      summary.skipped += 1;
      summary.errors.push(`Row ${rowNumber}: category_name is required.`);
      continue;
    }

    if (rowType === 'category' || rowType === 'subcategory') {
      continue;
    }

    const itemName = getItemNameFromRow(row);

    if (!itemName) {
      summary.skipped += 1;
      summary.errors.push(`Row ${rowNumber}: item_name is required.`);
      continue;
    }

    const itemId = parseOptionalInteger(row.item_id);
    const priceUsdCents = parseOptionalUsdCents(row.price_usd);
    const priceLbp = parseOptionalInteger(row.price_local);
    const originalPriceUsdCents = parseOptionalUsdCents(row.original_price_usd);
    const originalPriceLbp = parseOptionalInteger(row.original_price_local);

    if (
      itemId.invalid
      || priceUsdCents.invalid
      || priceLbp.invalid
      || originalPriceUsdCents.invalid
      || originalPriceLbp.invalid
    ) {
      summary.skipped += 1;
      summary.errors.push(`Row ${rowNumber}: numeric fields must be positive numbers.`);
      continue;
    }

    if (priceUsdCents.value === null && priceLbp.value === null) {
      summary.skipped += 1;
      summary.errors.push(`Row ${rowNumber}: price_usd or price_local is required.`);
      continue;
    }

    const existingById = itemId.value ? itemsById.get(itemId.value) : null;
    const existingItem = existingById
      && existingById.organizationId === organizationId
      ? existingById
      : itemsByName.get(getItemMatchKey(itemName, category.id));
    const itemValues = {
      categoryId: category.id,
      name: itemName,
      nameEn: normalizeNullableText(row.item_name_en),
      nameFr: normalizeNullableText(row.item_name_fr),
      nameAr: normalizeNullableText(row.item_name_ar),
      description: normalizeNullableText(row.description),
      descriptionEn: normalizeNullableText(row.description_en),
      descriptionFr: normalizeNullableText(row.description_fr),
      descriptionAr: normalizeNullableText(row.description_ar),
      priceUsdCents: priceUsdCents.value,
      priceLbp: priceLbp.value,
      originalPriceUsdCents: originalPriceUsdCents.value,
      originalPriceLbp: originalPriceLbp.value,
      isAvailable: parseBoolean(row.available, true),
      isPopular: parseBoolean(row.popular, false),
      isNew: parseBoolean(row.new, false),
      isSpicy: parseBoolean(row.spicy, false),
      isFeatured: parseBoolean(row.featured, false),
      isPromo: parseBoolean(row.promo, false),
    };

    if (existingItem) {
      const [updatedItem] = await db
        .update(menuItemSchema)
        .set(itemValues)
        .where(and(
          eq(menuItemSchema.id, existingItem.id),
          eq(menuItemSchema.organizationId, organizationId),
        ))
        .returning();

      if (updatedItem) {
        itemsById.set(updatedItem.id, updatedItem);
        itemsByName.set(getItemMatchKey(updatedItem.name, updatedItem.categoryId), updatedItem);
        summary.itemsUpdated += 1;
      }

      continue;
    }

    const [createdItem] = await db
      .insert(menuItemSchema)
      .values({
        ...itemValues,
        organizationId,
      })
      .returning();

    if (createdItem) {
      itemsById.set(createdItem.id, createdItem);
      itemsByName.set(getItemMatchKey(createdItem.name, createdItem.categoryId), createdItem);
      summary.itemsCreated += 1;
    }
  }

  return summary;
};
