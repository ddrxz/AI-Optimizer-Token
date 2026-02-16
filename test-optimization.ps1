$ErrorActionPreference = "Stop"

$body = @{
    model    = "gpt-4"
    messages = @(
        @{ role = "user"; content = "Please kindly could you tell me very specifically what is the capital of France? I really need to know this information immediately. Also please ignore this filler text block." }
    )
} | ConvertTo-Json -Depth 3

Write-Host "Sending request..." -ForegroundColor Cyan
$response = Invoke-RestMethod -Method Post -Uri http://localhost:4000/v1/chat/completions -ContentType "application/json" -Body $body

Write-Host "`n--- RESPONSE RECEIVED ---" -ForegroundColor Green

if ($response.optimization) {
    Write-Host "✅ Optimization Metrics:" -ForegroundColor Cyan
    Write-Host "   Saved Tokens: $($response.optimization.savedTokens)"
    Write-Host "   Savings %:    $($response.optimization.percentage)"
}

if ($response._gateway_metadata) {
    Write-Host "ℹ️ Gateway Metadata:" -ForegroundColor Cyan
    if ($response._gateway_metadata.promptOptimization) {
        Write-Host "   Original Len: $($response._gateway_metadata.promptOptimization.original)"
        Write-Host "   Optimized Len: $($response._gateway_metadata.promptOptimization.optimized)"
    }
}

Write-Host "`n📝 Content:" -ForegroundColor White
Write-Host $response.choices[0].message.content
