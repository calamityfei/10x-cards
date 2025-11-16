import { cleanupDatabase } from "./teardown";

async function globalTeardown() {
  await cleanupDatabase();
}

export default globalTeardown;
