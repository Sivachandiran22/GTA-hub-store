async function main() {
  const driveId = '1Lzk2UUds_JQ2qeHoHOK3DfIWCMaeMrH4';
  const initialUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
  
  const initialRes = await fetch(initialUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  const htmlText = await initialRes.text();
  console.log('--- FULL HTML START ---');
  console.log(htmlText);
  console.log('--- FULL HTML END ---');
}

main().catch(console.error);
