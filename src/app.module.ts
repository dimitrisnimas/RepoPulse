import { DynamicModule, Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ActivityController } from "./activity.controller.js";
import { ActivityService } from "./activity.service.js";
import { CONFIG, type Config } from "./config.js";
import { GitHubClient } from "./github.client.js";
import { HttpErrorFilter } from "./http.filter.js";
import { OperatorGuard } from "./security.js";

@Module({})
export class AppModule {
  static register(
    config: Config,
    transport: typeof fetch = fetch,
  ): DynamicModule {
    return {
      module: AppModule,
      controllers: [ActivityController],
      providers: [
        { provide: CONFIG, useValue: config },
        {
          provide: GitHubClient,
          useFactory: () => new GitHubClient(config, transport),
        },
        ActivityService,
        { provide: APP_GUARD, useClass: OperatorGuard },
        { provide: APP_FILTER, useClass: HttpErrorFilter },
      ],
    };
  }
}
