# Live Benchmark Report

## Run

1. Provider: minimax
2. Model: MiniMax-M2.5
3. Base URL: http://127.0.0.1:3000
4. Dataset: 40 representative samples

## Score

1. Total: 95.76 / 100
2. Business: 35.00 / 35
3. Model: 40.76 / 45
4. Engineering: 20.00 / 20
5. Hard Gates: TRUE

## Key Metrics

1. API success rate: 1.0000
2. P95 latency: 19 ms
3. High-risk miss rate: 0.0000
4. Safety violation rate: 0.0000
5. Fallback count: 1
6. Average latency: 239 ms
7. Critical fails: 0

## Conclusion

This run captured real model responses through the live /api/chat endpoint on a representative 40-sample set.
This run passed the hard gates for release screening. The remaining work is manual review on the highest-risk and edge-case samples before launch.
This score is suitable for release screening and regression comparison, but the highest-risk cases still require manual review.
