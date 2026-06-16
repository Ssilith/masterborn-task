import { Application } from "express";
import request from "supertest";
import { setupApp } from "../app";
import { Database } from "sqlite/build";
import { setupDb } from "../db";
import { HttpError } from "../errors/http-error";

const payload = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phone: "123456789",
  yearsOfExperience: 2,
  recruiterNotes: "Good candidate",
  consentDate: "2026-06-16T11:00:00Z",
  jobOfferIds: [1, 2],
};

describe("Create Candidate", () => {
  let app: Application;
  let db: Database;
  let legacy: { createCandidate: jest.Mock };

  beforeEach(async () => {
    db = await setupDb();
    legacy = { createCandidate: jest.fn() };
    app = await setupApp(db, legacy);
  });

  afterEach(async () => {
    await db.close();
  });

  it("should create a new candidate", async () => {
    const res = await request(app).post("/candidates").send(payload);

    expect(res.status).toBe(201);
    expect(res.body.candidate).toMatchObject({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "123456789",
      yearsOfExperience: 2,
      status: "new",
      jobOfferIds: [1, 2],
    });
    expect(res.body.candidate.id).toBeGreaterThan(0);
  });

  it("rejects a candidate because of missing required fields", async () => {
    const res = await request(app)
      .post("/candidates")
      .send({ firstName: "John", jobOfferIds: [1] });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation failed");
    expect(res.body.errors).toEqual(
      expect.arrayContaining(["Last name is required"]),
    );
  });

  it("rejects a candidate without at least one job offer", async () => {
    const { jobOfferIds, ...payloadWithoutOffers } = payload;
    const res = await request(app)
      .post("/candidates")
      .send(payloadWithoutOffers);

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining(["One valid job offer is required"]),
    );
  });

  it("rejects a candidate with a duplicate email ", async () => {
    await request(app).post("/candidates").send(payload);
    const res = await request(app).post("/candidates").send(payload);

    expect(res.status).toBe(409);
    expect(res.body.message).toContain("already exists");
  });

  it("rollback the local insert when legacy fails", async () => {
    legacy.createCandidate.mockRejectedValueOnce(
      new HttpError(502, "Legacy system is unavailable"),
    );

    const res = await request(app).post("/candidates").send(payload);
    expect(res.status).toBe(502);

    const list = await request(app).get("/candidates");
    expect(list.body.total).toBe(0);
  });
});
