-- Add show_menu_item_images to organization table
ALTER TABLE "organization" ADD COLUMN "show_menu_item_images" boolean DEFAULT true NOT NULL;