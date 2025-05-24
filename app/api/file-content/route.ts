import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { repoUrl, filePath, branch = 'main' } = await request.json();
    
    if (!repoUrl || !filePath) {
      return NextResponse.json(
        { error: 'Repository URL and file path are required' },
        { status: 400 }
      );
    }

    // Parse GitHub URL
    const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!repoMatch) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL' },
        { status: 400 }
      );
    }

    const [, owner, repo] = repoMatch;
    const repoName = repo.replace(/\.git$/, ''); // Remove .git suffix if present

    // Fetch file content from GitHub API
    const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}?ref=${branch}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        ...(process.env.GITHUB_TOKEN && {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`
        })
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `GitHub API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (data.content) {
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return NextResponse.json({ 
        content,
        filename: filePath.split('/').pop(),
        size: data.size 
      });
    }
    
    return NextResponse.json(
      { error: 'No content found in file' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Error fetching file content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file content: ' + (error as Error).message },
      { status: 500 }
    );
  }
} 