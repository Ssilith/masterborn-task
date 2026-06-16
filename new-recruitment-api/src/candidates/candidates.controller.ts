import { Request, Response, Router } from "express";
import { CandidateService } from "./candidate.service";

function isInt(value: unknown, def: number): number {
  const v = Number(value);
  return Number.isInteger(v) ? v : def;
}

export class CandidatesController {
  readonly router = Router();

  constructor(private readonly service: CandidateService) {
    this.router.get("/candidates", this.getAll.bind(this));
    this.router.post("/candidates", this.create.bind(this));
  }

  async getAll(req: Request, res: Response) {
    let page = isInt(req.query.page, 1);
    let pageSize = isInt(req.query.pageSize, 20);
    if (pageSize > 100) pageSize = 100;

    let jobOfferId: any = undefined;
    if (req.query.jobOfferId) {
      jobOfferId = isInt(req.query.jobOfferId, 0) || undefined;
    }

    const result = await this.service.get({ page, pageSize, jobOfferId });
    res.json(result);
  }

  async create(req: Request, res: Response) {
    const candidate = await this.service.create(req.body);
    res
      .status(201)
      .json({ message: "Candidate added successfully", candidate });
  }
}
