import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { logger } from "./logger";

export async function migrateLegacyKeys(): Promise<void> {
  try {
    await db.execute(sql`
      UPDATE projects SET project_type = 'interior_design'
        WHERE project_type IN ('interior', 'interior-design');
      UPDATE projects SET project_type = 'painting'
        WHERE project_type = 'exterior';
      UPDATE projects SET project_type = 'electrical'
        WHERE project_type = 'electric';
      UPDATE projects SET project_type = 'renovation'
        WHERE project_type = 'construction';

      UPDATE companies SET service_types = array_replace(service_types, 'interior',        'interior_design')
        WHERE 'interior'        = ANY(service_types);
      UPDATE companies SET service_types = array_replace(service_types, 'interior-design', 'interior_design')
        WHERE 'interior-design' = ANY(service_types);
      UPDATE companies SET service_types = array_replace(service_types, 'exterior',        'painting')
        WHERE 'exterior'        = ANY(service_types);
      UPDATE companies SET service_types = array_replace(service_types, 'electric',        'electrical')
        WHERE 'electric'        = ANY(service_types);
      UPDATE companies SET service_types = array_replace(service_types, 'construction',    'renovation')
        WHERE 'construction'    = ANY(service_types);

      UPDATE companies
        SET service_types = ARRAY(SELECT DISTINCT unnest(service_types) ORDER BY 1)
        WHERE cardinality(service_types) !=
              cardinality(ARRAY(SELECT DISTINCT unnest(service_types)));
    `);
    logger.info("Legacy key migration complete");
  } catch (err) {
    logger.error({ err }, "Legacy key migration failed");
  }
}
