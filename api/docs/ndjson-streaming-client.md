# NDJSON Streaming Client Examples

## Overview

The IEP analysis endpoint uses **NDJSON (Newline-Delimited JSON)** streaming to provide real-time progress updates during long-running AI extraction operations (30-60 seconds).

### Event Types

```typescript
type StreamEvent =
  | { type: 'log'; ts: string; message: string; stage?: string; meta?: any }
  | { type: 'result'; ts: string; data: ExtractionResult }
  | { type: 'error'; ts: string; message: string; details?: any };
```

## Browser/Frontend Client (Fetch API)

```typescript
/**
 * Analyze IEP document with NDJSON streaming
 * @param documentId - Document ID to analyze
 * @param token - Bearer token
 * @param onLog - Callback for progress events
 * @returns ExtractionResult
 */
async function analyzeDocument(
  documentId: string,
  token: string,
  onLog?: (message: string, stage?: string, meta?: any) => void
): Promise<any> {
  const response = await fetch(`/api/v1/iep/${documentId}/analyze-iep`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/x-ndjson',
    },
  });

  if (!response.ok || !response.body) {
    throw new Error(`Request failed: ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = '';
  
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Split by newline (NDJSON format)
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);

      if (!line) continue;

      try {
        const event = JSON.parse(line);

        if (event.type === 'log') {
          console.log(`[${event.stage || 'info'}] ${event.message}`, event.meta || '');
          onLog?.(event.message, event.stage, event.meta);
        } else if (event.type === 'result') {
          console.log('✓ Analysis complete:', event.data);
          return event.data;
        } else if (event.type === 'error') {
          console.error('✗ Analysis error:', event.message, event.details);
          throw new Error(event.message);
        }
      } catch (parseError) {
        console.warn('Failed to parse NDJSON line:', line, parseError);
      }
    }
  }

  throw new Error('Stream ended without result');
}

// Usage Example
try {
  const result = await analyzeDocument(
    'doc-uuid-123',
    'your-bearer-token',
    (message, stage) => {
      // Update UI with progress
      console.log(`[${stage}] ${message}`);
      updateProgressBar(stage);
    }
  );
  
  console.log('Extraction complete:', result);
  // Handle result (show extraction data to user for review)
} catch (error) {
  console.error('Analysis failed:', error);
}
```

## React Hook Example

```typescript
import { useState, useCallback } from 'react';

interface AnalysisProgress {
  stage?: string;
  message: string;
  meta?: any;
}

export function useDocumentAnalysis() {
  const [progress, setProgress] = useState<AnalysisProgress[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const analyzeDocument = useCallback(async (documentId: string, token: string) => {
    setIsAnalyzing(true);
    setError(null);
    setProgress([]);
    setResult(null);

    try {
      const response = await fetch(`/api/v1/iep/${documentId}/analyze-iep`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/x-ndjson',
        },
      });

      if (!response.ok || !response.body) {
        throw new Error(`Request failed: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);

          if (!line) continue;

          const event = JSON.parse(line);

          if (event.type === 'log') {
            setProgress(prev => [...prev, {
              stage: event.stage,
              message: event.message,
              meta: event.meta,
            }]);
          } else if (event.type === 'result') {
            setResult(event.data);
            setIsAnalyzing(false);
            return event.data;
          } else if (event.type === 'error') {
            setError(event.message);
            setIsAnalyzing(false);
            throw new Error(event.message);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsAnalyzing(false);
      throw err;
    }
  }, []);

  return {
    analyzeDocument,
    progress,
    isAnalyzing,
    error,
    result,
  };
}

// Component Usage
function DocumentAnalyzer({ documentId, token }: { documentId: string; token: string }) {
  const { analyzeDocument, progress, isAnalyzing, error, result } = useDocumentAnalysis();

  const handleAnalyze = async () => {
    try {
      await analyzeDocument(documentId, token);
      // Result is now available in `result` state
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  return (
    <div>
      <button onClick={handleAnalyze} disabled={isAnalyzing}>
        {isAnalyzing ? 'Analyzing...' : 'Analyze Document'}
      </button>

      {isAnalyzing && (
        <div className="progress-log">
          {progress.map((p, i) => (
            <div key={i} className={`log-entry stage-${p.stage}`}>
              <span className="stage">[{p.stage}]</span>
              <span className="message">{p.message}</span>
            </div>
          ))}
        </div>
      )}

      {error && <div className="error">{error}</div>}
      {result && <div className="result">Analysis complete!</div>}
    </div>
  );
}
```

## Node.js Client Example

```typescript
import https from 'https';

function analyzeDocumentNode(
  documentId: string,
  token: string,
  baseUrl: string = 'https://api.example.com'
): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(`/api/v1/iep/${documentId}/analyze-iep`, baseUrl);

    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/x-ndjson',
      },
    };

    const req = https.request(url, options, (res) => {
      let buffer = '';

      res.on('data', (chunk) => {
        buffer += chunk.toString();

        let idx;
        while ((idx = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);

          if (!line) continue;

          try {
            const event = JSON.parse(line);

            if (event.type === 'log') {
              console.log(`[${event.stage}] ${event.message}`);
            } else if (event.type === 'result') {
              resolve(event.data);
            } else if (event.type === 'error') {
              reject(new Error(event.message));
            }
          } catch (err) {
            console.warn('Failed to parse line:', line);
          }
        }
      });

      res.on('end', () => {
        if (buffer.trim()) {
          console.warn('Incomplete data in buffer:', buffer);
        }
      });

      res.on('error', reject);
    });

    req.on('error', reject);
    req.end();
  });
}

// Usage
(async () => {
  try {
    const result = await analyzeDocumentNode('doc-uuid-123', 'your-token');
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
})();
```

## cURL Example

```bash
# Stream NDJSON events to stdout
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Accept: application/x-ndjson" \
     https://api.example.com/api/v1/iep/DOC_ID/analyze-iep

# Example output:
# {"type":"log","ts":"2026-02-01T10:00:00.000Z","message":"Starting analysis","stage":"init"}
# {"type":"log","ts":"2026-02-01T10:00:01.000Z","message":"Document loaded","stage":"preparing"}
# {"type":"log","ts":"2026-02-01T10:00:05.000Z","message":"Running AI extraction","stage":"ai-analysis"}
# {"type":"result","ts":"2026-02-01T10:00:45.000Z","data":{...}}
```

## Stage Progression

The typical stage progression during analysis:

1. **init** - Starting analysis
2. **preparing** - Loading document record, updating status
3. **downloading** - Downloading document from storage
4. **extracting** - Extracting text from PDF
5. **ai-analysis** - Running AI extraction (longest step: 30-60s)
6. **saving** - Saving extraction results to database
7. **complete** - Analysis finished
8. **result** event - Final data payload

## Error Handling

If an error occurs at any stage:

```json
{
  "type": "error",
  "ts": "2026-02-01T10:00:30.000Z",
  "message": "Document not found",
  "details": {
    "documentId": "uuid-123",
    "name": "NotFoundError",
    "stack": "..."
  }
}
```

Your client should:
1. Display the error message to the user
2. Log details for debugging
3. Stop processing the stream
4. Allow retry if appropriate

## Best Practices

1. **Always check event type** before processing
2. **Handle incomplete lines** - buffer until newline found
3. **Implement timeout** - Analysis should complete within 2 minutes
4. **Show progress to user** - Display stage/message updates
5. **Handle disconnections** - Allow user to retry
6. **Parse errors gracefully** - Skip malformed lines, don't crash
7. **Close connections** - Clean up readers when done
