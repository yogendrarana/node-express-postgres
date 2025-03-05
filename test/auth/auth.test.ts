import app from "../../src/app.js"
import supertest from "supertest";
import { truncateTables } from "../../test/setup.js";
import { expect, describe, it, beforeEach } from "vitest";

const request = supertest(app);

describe("auth", () => {
    describe("auth controller test", () => {
        beforeEach(async () => {
            // Truncate user and related tables
            await truncateTables(["user", "token"]); // Include any related tables
        });

        describe("POST /api/v1/auth/register", () => {
            it("should return 201 for successful registration", async () => {
                const registerationData = {
                    email: "yogendrarana4321@gmail.com",
                    password: "password1A@",
                    confirm_password: "password1A@"
                };

                const response = await request
                    .post("/api/v1/auth/register")
                    .send(registerationData)
                    .expect(201);

                expect(response.body).toHaveProperty("success", true);
                expect(response.body).toHaveProperty("data");
            });

            // Add more registration test cases
            it("should return 400 when email already exists", async () => {
                // First registration
                const registerationData = {
                    email: "yogendrarana4321@gmail.com",
                    password: "password1A@",
                    confirm_password: "password1A@"
                };

                await request.post("/api/v1/auth/register").send(registerationData);

                // Try to register again with same email
                const response = await request
                    .post("/api/v1/auth/register")
                    .send(registerationData)
                    .expect(400);

                expect(response.body).toHaveProperty("success", false);
            });
        });

        describe("POST /api/v1/auth/login", () => {
            // Setup test user before login tests
            beforeEach(async () => {
                // Register a user for login tests
                const registerationData = {
                    email: "yogendrarana4321@gmail.com",
                    password: "password1A@",
                    confirm_password: "password1A@"
                };

                await request.post("/api/v1/auth/register").send(registerationData);
            });

            it("should return 400 for invalid credentials", async () => {
                const loginData = {
                    email: "yogendrarana4321@gmail.com",
                    password: "password" // Wrong password
                };

                const response = await request.post("/api/v1/auth/login").send(loginData);

                expect(response.status).toBe(400);
                expect(response.body).toMatchObject({
                    success: false
                });
            });

            it("should return 200 for valid credentials", async () => {
                const loginData = {
                    email: "yogendrarana4321@gmail.com",
                    password: "password1A@" // Correct password
                };

                const response = await request.post("/api/v1/auth/login").send(loginData);

                expect(response.status).toBe(200);
                expect(response.body).toMatchObject({
                    success: true
                });
            });
        });
    });
});
