# Menu CSV Import / Export

Wasl supports a lightweight CSV workflow for restaurant menu onboarding and
future manual POS comparison. It does not connect to POS APIs, external
services, AI import, or image storage.

## Where to use it

- Restaurant dashboard: `/dashboard/menu-items`
- Restaurant export center: `/dashboard/export`
- Admin menu setup: `/admin/menu/[organizationId]`

## Safety rules

- Import never deletes existing categories or items.
- Import never changes item images.
- Existing items are matched by `item_id` when present.
- Without `item_id`, items are matched by item name plus category.
- Categories are matched by name plus parent category.
- Re-running the same CSV should update existing rows instead of duplicating
  them in normal use.
- CSV files must be `.csv` and 512 KB or smaller.

## Columns

Required columns:

```csv
row_type,category_id,category_name,category_name_en,category_name_fr,category_name_ar,subcategory_id,subcategory_name,subcategory_name_en,subcategory_name_fr,subcategory_name_ar,item_id,item_name,item_name_en,item_name_fr,item_name_ar,description,description_en,description_fr,description_ar,price_usd,price_local,original_price_usd,original_price_local,available,popular,new,spicy,featured,promo
```

`row_type` can be:

- `category`
- `subcategory`
- `item`

For item rows, provide at least:

- `category_name`
- `item_name` or one localized item name
- `price_usd` or `price_local`

## Example

```csv
row_type,category_id,category_name,category_name_en,category_name_fr,category_name_ar,subcategory_id,subcategory_name,subcategory_name_en,subcategory_name_fr,subcategory_name_ar,item_id,item_name,item_name_en,item_name_fr,item_name_ar,description,description_en,description_fr,description_ar,price_usd,price_local,original_price_usd,original_price_local,available,popular,new,spicy,featured,promo
category,,Breakfast,Breakfast,Petit dejeuner,الفطور,,,,,,,,,,,,,,,,,,,true,false,false,false,true,false
item,,Breakfast,Breakfast,Petit dejeuner,الفطور,,,,,,,Labneh toast,Labneh toast,Toast labneh,توست لبنة,"Labneh, zaatar, cucumber","Labneh, zaatar, cucumber","Labneh, zaatar, concombre","لبنة، زعتر، خيار",5.50,500000,,,true,true,false,false,true,false
```

## Recommended workflow

1. Download the sample CSV.
2. Fill categories and items in a spreadsheet.
3. Import on staging or a test restaurant first.
4. Review the result summary for created, updated, skipped, and error counts.
5. Download the menu CSV after import as a clean reference copy.
6. Add or review item images in Wasl, since CSV import does not modify images.
