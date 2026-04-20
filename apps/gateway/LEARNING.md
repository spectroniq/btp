# Learning Notes — NestJS Gateway

Things I learned and concepts I should understand after building this service.

---

## NestJS Core Concepts

### The Module System

NestJS is built around modules. Everything (controllers, services, guards) must be declared inside a module before it can be used.

```typescript
@Module({
  controllers: [JobsController],
  providers: [JobsService, PrismaService],
})
export class JobsModule {}
```

- **controllers** — handle HTTP requests, call services
- **providers** — injectable classes (services, guards, etc.)
- A module can `import` other modules to access their exported providers

### Dependency Injection

NestJS manages object creation for you. Instead of `new JobsService(prisma)`, you declare it in the constructor and NestJS injects the right instance:

```typescript
@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}
}
```

`@Injectable()` marks a class as something NestJS can create and inject.

---

## Decorators

Decorators are the `@Something` annotations throughout the codebase. They're TypeScript/JavaScript functions that attach metadata to classes or methods.

### Route decorators

```typescript
@Controller({ path: 'jobs', version: '1' })  // base path + versioning
export class JobsController {
  @Get()           // GET /api/v1/jobs
  @Post('ingest')  // POST /api/v1/jobs/ingest
  @Delete(':jobId/save')  // DELETE /api/v1/jobs/:jobId/save
}
```

### Parameter decorators

```typescript
@Get()
findAll(
  @CurrentUserId() userId: string,  // custom decorator — pulls from request
  @Param('jobId') jobId: string,    // URL param
  @Body() body: CreateJobDto,       // request body
) {}
```

### Custom decorators

You can create your own decorators to extract things from the request context:

```typescript
// decorators/current-user.decorator.ts
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.userId;  // set earlier by the guard
  },
);
```

The `@Public()` decorator works similarly — it just sets metadata that the guard reads:

```typescript
export const IS_PUBLIC = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);
```

---

## Guards vs Pipes (Validators)

These both intercept requests but at different stages and for different purposes:

| | Guard | Pipe/Validator |
|--|-------|---------------|
| **Purpose** | Auth/authorization — *can this user access this?* | Data validation/transformation — *is this input valid?* |
| **Runs** | Before the handler | After guard, before handler |
| **Returns** | `true` (allow) or throws | Transformed/validated value or throws |
| **Example** | `ClerkGuard` checking the JWT | `class-validator` checking `CreateJobDto` |

### The ClerkGuard flow

```
Request arrives
  → ClerkGuard.canActivate()
      → is this route @Public()? → yes: allow through
      → read Authorization header
      → verifyToken() with Clerk
      → upsert user in DB (first-seen auto-create)
      → attach userId, sessionId to request
  → Handler runs
      → @CurrentUserId() reads request.userId
```

This means **the guard both authenticates AND ensures the user exists in our DB** — a first-time Clerk user gets created automatically.

### Reflector

The guard uses `Reflector` to read metadata set by decorators:

```typescript
const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
  context.getHandler(),   // check method-level metadata first
  context.getClass(),     // then class-level
]);
```

`getAllAndOverride` returns the first truthy value found (method decorator wins over class decorator).

---

## API Versioning

The gateway uses URL versioning:

```typescript
// main.ts
app.enableVersioning({ type: VersioningType.URI });

// controller
@Controller({ path: 'jobs', version: '1' })
// or per-route: @Version('2')
```

This produces `/api/v1/jobs`. The benefit: you can add a v2 controller without breaking existing clients.

---

## Prisma

### Schema organization

The schema is split into multiple `.prisma` files under `/prisma/schema/` — more maintainable than one giant file.

### `@@index` — database indexing

Without an index, a query like `WHERE userId = ?` scans every row in the table (O(n)). With `@@index([userId])`, Postgres builds a B-tree that makes lookups O(log n).

```prisma
model DSAAttempt {
  userId    String
  problemId String

  @@index([userId])    // fast lookup by user
  @@index([problemId]) // fast lookup by problem
}
```

**Rule of thumb**: Index columns you regularly filter or sort by. Don't index everything — writes become slower because the index must also be updated.

### `@@unique` vs `@@index`

- `@@unique` enforces uniqueness AND creates an index
- `@@index` only creates an index (no uniqueness constraint)

```prisma
model SavedJob {
  userId String
  jobId  String
  @@unique([userId, jobId])  // a user can only save a job once
}
```

The composite unique constraint `userId_jobId` is also what makes this Prisma query work:

```typescript
prisma.savedJob.delete({
  where: { userId_jobId: { userId, jobId } },
})
```

### `skipDuplicates: true`

When bulk-inserting jobs from the scraper, duplicates will come in repeatedly. `skipDuplicates` silently ignores records that violate unique constraints — no crash, no partial insert failure:

```typescript
prisma.job.createMany({
  data: jobs,
  skipDuplicates: true,
})
```

### `include` — joining relations

```typescript
prisma.savedJob.findMany({
  where: { userId },
  include: { job: true },  // JOINs the related Job record
})
```

Without `include`, you'd only get the `savedJob` rows. With it, each row also contains the full `job` object.

---

## Mistakes / Things To Watch

| Issue | Context |
|-------|---------|
| Guard also does DB upsert | The Clerk guard upserts a user on every authenticated request — watch for performance under high load. Consider caching seen user IDs in memory. |
| `findAll` ignores `userId` | `JobsService.findAll` receives `userId` but doesn't filter by it — returns all 50 jobs regardless of user. Intentional for now but worth tracking. |
| `console.log(jobs)` in service | Left in `findAll` — will log entire job objects to stdout in production. Remove before deploying. |
| No global validation pipe | `class-validator` DTOs only validate if you've added `new ValidationPipe()` globally in `main.ts`. Double-check this is set up. |
