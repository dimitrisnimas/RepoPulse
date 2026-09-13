import { createHash } from "node:crypto";
import { Controller, Get, Inject, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { ActivityService } from "./activity.service.js";
import { CONFIG, type Config } from "./config.js";
import { renderActivity } from "./render.js";
import { Access } from "./security.js";

@Controller()
export class ActivityController {
  constructor(
    private readonly activity: ActivityService,
    @Inject(CONFIG) private readonly config: Config,
  ) {}

  @Get("health")
  @Access("health")
  health() {
    return { status: "ok" };
  }

  @Get("activity.json")
  data() {
    return this.activity.get();
  }

  @Get("activity.svg")
  @Access("svg")
  async svg(@Req() request: Request, @Res() response: Response): Promise<void> {
    const svg = renderActivity(await this.activity.get(), this.config);
    response.type("image/svg+xml");
    if (this.config.publishActivity) {
      const etag = `"${createHash("sha256").update(svg).digest("base64url")}"`;
      response.setHeader(
        "Cache-Control",
        "public, max-age=0, s-maxage=300, must-revalidate",
      );
      response.setHeader("ETag", etag);
      const condition = request.headers["if-none-match"];
      if (
        condition
          ?.split(",")
          .some(
            (value) =>
              value.trim().replace(/^W\//, "") === etag || value.trim() === "*",
          )
      ) {
        response.status(304).end();
        return;
      }
    }
    response.send(svg);
  }
}
