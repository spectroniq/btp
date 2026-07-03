import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RecordSolveDto } from './dto/record-solve.dto';

@Injectable()
export class DsaService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.dSAProblem.findMany({
      select: { id: true, slug: true, title: true, difficulty: true, topic: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    const problem = await this.prisma.dSAProblem.findUnique({ where: { slug } });
    if (!problem) throw new NotFoundException(`Problem "${slug}" not found`);
    return problem;
  }

  async getStats(userId: string) {
    const [allAttempts, solvedAttempts] = await Promise.all([
      this.prisma.dSAAttempt.count({ where: { userId } }),
      this.prisma.dSAAttempt.findMany({
        where: { userId, solved: true },
        include: { problem: { select: { topic: true } } },
        distinct: ['problemId'],
      }),
    ]);

    const patternsLearned = new Set(solvedAttempts.map((a) => a.problem.topic)).size;
    const streak = await this.computeStreak(userId);

    return {
      solved: solvedAttempts.length,
      attempts: allAttempts,
      streak,
      patternsLearned,
    };
  }

  async recordSolve(userId: string, dto: RecordSolveDto) {
    const problem = await this.prisma.dSAProblem.upsert({
      where: { slug: dto.slug },
      create: {
        slug: dto.slug,
        title: dto.title,
        difficulty: dto.difficulty,
        topic: dto.topic,
        description: '',
      },
      update: {},
    });

    await this.prisma.dSAAttempt.create({
      data: {
        userId,
        problemId: problem.id,
        code: dto.code,
        solved: true,
      },
    });
  }

  async executeCode(code: string, testCases: { input: unknown; expected: unknown }[]) {
    const fnMatch = code.match(/^def\s+(\w+)\s*\(/m);
    const fnName = fnMatch?.[1] ?? 'solution';

    const harness = `
${code}

import json as _json
_test_cases = ${JSON.stringify(testCases)}
_fn = ${fnName}
_results = []
for _tc in _test_cases:
    try:
        _args = _tc["input"] if isinstance(_tc["input"], list) else [_tc["input"]]
        _result = _fn(*_args)
        _expected = _tc["expected"]
        _results.append({"pass": _result == _expected, "actual": str(_result), "expected": str(_expected)})
    except Exception as _e:
        _results.append({"pass": False, "error": str(_e)})
print("__BTP__:" + _json.dumps(_results))
`;

    const pistonUrl = process.env['CODE_EXEC_URL'] ?? 'https://emkc.org/api/v2/piston/execute';

    let res: Response;
    try {
      res = await fetch(pistonUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'python',
          version: '3.10',
          files: [{ name: 'solution.py', content: harness }],
        }),
      });
    } catch {
      throw new InternalServerErrorException('Code execution service unreachable');
    }

    if (!res.ok) {
      throw new InternalServerErrorException(
        `Code execution service returned ${res.status}`,
      );
    }

    const data = await res.json() as {
      run?: { stdout: string; stderr: string; code: number };
    };

    if (!data.run) {
      throw new InternalServerErrorException('Unexpected response from code execution service');
    }

    const match = data.run.stdout.match(/__BTP__:(.+)/);
    if (!match) {
      const errorMsg = data.run.stderr?.trim() || data.run.stdout.trim() || 'Execution produced no output';
      return { results: [], error: errorMsg };
    }
    try {
      const results = JSON.parse(match[1]);
      return { results };
    } catch {
      return { results: [], error: 'Failed to parse execution output' };
    }
  }

  private async computeStreak(userId: string): Promise<number> {
    const attempts = await this.prisma.dSAAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    if (attempts.length === 0) return 0;

    const uniqueDays = [
      ...new Set(attempts.map((a) => a.createdAt.toDateString())),
    ];

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86_400_000).toDateString();

    if (!uniqueDays.includes(today) && !uniqueDays.includes(yesterday)) return 0;

    const cursor = new Date(
      uniqueDays.includes(today) ? Date.now() : Date.now() - 86_400_000
    );
    let streak = 0;

    while (uniqueDays.includes(cursor.toDateString())) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }
}
