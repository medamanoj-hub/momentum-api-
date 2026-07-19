import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { EnvelopeInterceptor } from "./common/envelope.interceptor";
import { HttpErrorFilter } from "./common/http-error.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Versioned base path per the API Specification: /api/v1
  app.setGlobalPrefix("api/v1");

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? true,
    credentials: true
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    stopAtFirstError: false
  }));
  app.useGlobalInterceptors(new EnvelopeInterceptor());
  app.useGlobalFilters(new HttpErrorFilter());

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`Momentum API ready at http://localhost:${port}/api/v1`);
}
bootstrap();
