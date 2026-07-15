async function main() {
  const driveId = '1Lzk2UUds_JQ2qeHoHOK3DfIWCMaeMrH4';
  const initialUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
  
  console.log('1. Fetching initial page...');
  const initialRes = await fetch(initialUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  const htmlText = await initialRes.text();
  console.log('2. Parsing form parameters...');

  const hiddenInputs = {};
  const inputTagsMatch = htmlText.match(/<input\s+[^>]*type="hidden"[^>]*>/g) || [];
  
  for (const tag of inputTagsMatch) {
    const nameMatch = tag.match(/name="([^"]+)"/);
    const valueMatch = tag.match(/value="([^"]+)"/);
    if (nameMatch && valueMatch) {
      hiddenInputs[nameMatch[1]] = valueMatch[1];
    }
  }

  console.log('Hidden Inputs found:', hiddenInputs);

  if (Object.keys(hiddenInputs).length > 0) {
    // Build query params
    const queryParams = new URLSearchParams();
    for (const [k, v] of Object.entries(hiddenInputs)) {
      queryParams.set(k, v);
    }
    
    const downloadUrl = `https://drive.usercontent.google.com/download?${queryParams.toString()}`;
    console.log('3. Fetching from final download URL:', downloadUrl);
    
    const res2 = await fetch(downloadUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    console.log('Final Status:', res2.status);
    console.log('Final Headers Content-Type:', res2.headers.get('content-type'));
    console.log('Final Headers Content-Length:', res2.headers.get('content-length'));
    
    const arrayBuffer = await res2.arrayBuffer();
    const size = arrayBuffer.byteLength;
    console.log('Binary downloaded size in bytes:', size);
    console.log('Downloaded size is around:', (size / (1024 * 1024)).toFixed(2), 'MB');
  } else {
    console.log('No form parameters found!');
  }
}

main().catch(console.error);
