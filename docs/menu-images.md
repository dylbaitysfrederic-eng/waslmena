# Menu Images

Menu item photos are optional in Wasl. The public menu, cart, orders, tickets,
and CSV workflows must keep working when a restaurant has no photos.

## Recommended files

- Use JPG, PNG, or WEBP.
- Keep each image at 300 KB or smaller.
- Recommended dimensions: around 800 x 600 px or smaller.
- Compress photos before uploading, especially for mobile and weak connections.
- Prefer clear item photos over decorative images.

## Upload behavior

- Uploading a new image replaces the item image reference in the database.
- Removing an image only removes the item reference. It does not delete files
  from storage.
- Existing image URLs and uploaded file paths remain compatible.
- Broken images show a lightweight fallback instead of breaking the page.
- Public menu item images use lazy loading.

## Hosting and backups

If the app is moved between hosts or servers, preserve existing uploaded files
and paths. In particular, keep:

```text
public/uploads/menu-items/
```

Do not delete or move existing files unless a separate migration/backfill plan is
prepared and tested.

## CSV note

CSV menu import/export is for menu data. It does not upload image binaries or
bulk-process photo folders. Add or replace item photos from the menu item forms
after importing menu data.
