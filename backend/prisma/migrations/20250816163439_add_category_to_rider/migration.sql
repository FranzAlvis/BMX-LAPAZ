-- AlterTable
ALTER TABLE "riders" ADD COLUMN     "category_id" TEXT;

-- AddForeignKey
ALTER TABLE "riders" ADD CONSTRAINT "riders_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
