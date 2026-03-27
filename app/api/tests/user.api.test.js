import { it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { PostgreSqlContainer } from "testcontainers";
let container;
beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:16-alpine").start();
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = container.getConnectionUri();
});
afterAll(async () => {
    await container.stop();
});
it("health works", async () => {
    const { app } = await import("../src/app.js");
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
});
//# sourceMappingURL=user.api.test.js.map