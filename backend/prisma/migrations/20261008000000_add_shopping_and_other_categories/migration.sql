-- Add missing expense categories for existing users, preserving custom categories.
INSERT INTO "Category" ("id", "userId", "name", "icon", "color", "isSystem", "isIncome")
SELECT gen_random_uuid()::text, u."id", c.name, c.icon, c.color, true, false
FROM "User" u
CROSS JOIN (VALUES
  ('Compras', 'shopping-bag', '#EC4899'),
  ('Outros', 'tag', '#64748B')
) AS c(name, icon, color)
ON CONFLICT ("userId", "name") DO NOTHING;
