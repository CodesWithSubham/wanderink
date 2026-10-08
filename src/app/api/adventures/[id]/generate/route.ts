import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { connectDB } from '@/lib/mongodb';
import { Adventure } from '@/models/Adventure';
import { createPresignedGetUrlLong } from '@/lib/r2';
import { analyzeImages } from '@/lib/ai/vision';
import { generateStory } from '@/lib/ai/story';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

function createSSEEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const adventure = await Adventure.findById(id);
    if (!adventure) {
      return NextResponse.json({ error: 'Adventure not found' }, { status: 404 });
    }

    if (adventure.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (adventure.status !== 'processing') {
      return NextResponse.json({ error: 'Adventure not in processing state' }, { status: 400 });
    }

    // Create signed URLs for vision analysis (24hr expiry)
    const signedImageUrls = await Promise.all(
      adventure.imageKeys.map((key: string) => createPresignedGetUrlLong(key))
    );

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    let streamClosed = false;

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: unknown) => {
          if (streamClosed) return;
          try {
            controller.enqueue(encoder.encode(createSSEEvent(event, data)));
          } catch {
            streamClosed = true;
          }
        };

        const sendError = (error: string) => {
          sendEvent('error', { message: error });
          streamClosed = true;
          controller.close();
        };

        const sendDone = (redirectUrl: string) => {
          sendEvent('done', { adventureId: id, redirectUrl });
          streamClosed = true;
          controller.close();
        };

        try {
          // Step 1: Vision analysis
          sendEvent('vision_start', { totalImages: signedImageUrls.length });

          const visionResults = await Promise.all(
            signedImageUrls.map(async (url, index) => {
              try {
                const result = await analyzeImages([url]);
                sendEvent('vision_progress', { completed: index + 1, total: signedImageUrls.length });
                return result;
              } catch (error) {
                console.error(`Vision analysis failed for image ${index}:`, error);
                return null;
              }
            })
          );

          const validResults = visionResults.filter((r): r is NonNullable<typeof r> => r !== null);
          if (validResults.length === 0) {
            throw new Error('All vision analyses failed');
          }

          // Aggregate vision results
          const aggregatedAnalysis = {
            titleSuggestions: validResults.flatMap((r) => r.titleSuggestions),
            detectedObjects: validResults.flatMap((r) => r.detectedObjects),
            detectedScenes: validResults.flatMap((r) => r.detectedScenes),
            mood: validResults.map((r) => r.mood).join(', '),
            notableDetails: validResults.flatMap((r) => r.notableDetails),
            storyElements: validResults.flatMap((r) => r.storyElements),
          };

          // Deduplicate arrays
          Object.keys(aggregatedAnalysis).forEach((key) => {
            if (Array.isArray(aggregatedAnalysis[key as keyof typeof aggregatedAnalysis])) {
              (aggregatedAnalysis[key as keyof typeof aggregatedAnalysis] as string[]) = [
                ...new Set(aggregatedAnalysis[key as keyof typeof aggregatedAnalysis] as string[]),
              ];
            }
          });

          sendEvent('vision_complete', { aggregatedAnalysis });

          // Step 2: Story generation
          sendEvent('story_start', {});

          const storyResult = await generateStory(aggregatedAnalysis);

          sendEvent('story_complete', storyResult);

          // Step 3: Update adventure in database
          adventure.title = storyResult.title;
          adventure.summary = storyResult.summary;
          adventure.story = storyResult.fullStory;
          adventure.highlights = storyResult.highlights;
          adventure.moodScore = storyResult.moodScore;
          adventure.status = 'completed';
          await adventure.save();

          // Determine redirect URL based on visibility
          const redirectUrl = adventure.visibility === 'public'
            ? `/story/${adventure._id}`
            : `/adventures/${adventure._id}`;

          sendDone(redirectUrl);
        } catch (error) {
          console.error('Generation error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Generation failed';

          // Update adventure with error status
          try {
            await Adventure.findByIdAndUpdate(id, {
              status: 'failed',
              generationError: errorMessage,
            });
          } catch (updateError) {
            console.error('Failed to update adventure error status:', updateError);
          }

          sendError(errorMessage);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('SSE generation error:', error);
    return NextResponse.json({ error: 'Failed to start generation' }, { status: 500 });
  }
}