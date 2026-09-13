import { DynamicModule, Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ActivityController } from "./activity.controller";
import { ActivityService } from "./activity.service";
import { CONFIG, type Config } from "./config";
import { GitHubClient } from "./github.client";
import { HttpErrorFilter } from "./http.filter";
import { OperatorGuard } from "./security";

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
