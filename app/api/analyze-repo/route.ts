import { NextRequest, NextResponse } from 'next/server';
import { analyzeGitHubRepo, AnalyzeProgressEvent } from '@/app/lib/analysis/pipeline';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { repoUrl, branch = 'main', includeAllFiles = false } = body;

  if (!repoUrl) {
    return NextResponse.json({ error: 'Repository URL is required' }, { status: 400 });
  }

  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    return NextResponse.json({ error: 'Invalid GitHub repository URL' }, { status: 400 });
  }

  const [, owner, repoName] = match;
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const send = async (payload: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      const onProgress = async (event: AnalyzeProgressEvent) => {
        switch (event.type) {
          case 'status':
            await send({ type: 'status', message: event.message });
            break;
          case 'files':
            await send({ type: 'files', allFiles: event.allFiles, repository: event.repository });
            break;
          case 'progress':
            await send({
              type: 'progress',
              current: event.current,
              total: event.total,
              file: event.file,
            });
            break;
          case 'component':
            await send({ type: 'component', component: event.component });
            break;
          case 'complete':
            await send({
              type: 'complete',
              components: event.result.components,
              edges: event.result.edges,
              totalFiles: event.result.totalFiles,
              analyzedFiles: event.result.components.length,
              apiCallsUsed: event.result.fromCache ? 0 : 1,
              fromCache: event.result.fromCache,
            });
            break;
        }
      };

      try {
        await analyzeGitHubRepo({
          owner,
          repo: repoName,
          branch,
          includeAllFiles,
          token: process.env.GITHUB_TOKEN,
          onProgress,
        });
      } catch (error) {
        console.error('Error in stream:', error);
        await send({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
