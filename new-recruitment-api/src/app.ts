import express, { NextFunction } from "express";
import { CandidatesController } from "./candidates/candidates.controller";
import { CandidateRepository } from "./candidates/candidate.repository";
import { CandidateService } from "./candidates/candidate.service";
import { LegacyApiClient } from "./legacy/legacy.client";
import { Database } from "sqlite/build";
import { errorHandler, HttpError } from "./errors/http-error";

export const setupApp = async (db: Database, legacyClient?: any) => {
  const app = express();
  app.use(express.json());

  const legacy =
    legacyClient ||
    new LegacyApiClient(
      "http://localhost:4040",
      "0194ec39-4437-7c7f-b720-7cd7b2c8d7f4",
    );

  const service = new CandidateService(new CandidateRepository(db), legacy);

  app.use(new CandidatesController(service).router);
  app.use(errorHandler);

  return app;
};
